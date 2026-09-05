/**
 * Notes as markdown files anywhere in OPFS. The title lives in the
 * filename: `<folders>/<title>.md`, the body is raw markdown.
 * The tree is rooted at the OPFS root and shows every folder.
 * Single source of truth is one opfsTree() walk, reloaded after each mutation.
 */
const NOTES_ROOT = ''
const EXT = '.md'
const LEGACY_FILE = 'notes.json'

/** Display form of a file name: `Foo.md` renders as `Foo`. */
export function noteDisplayName(name: string): string {
  return name.endsWith(EXT) ? name.slice(0, -EXT.length) : name
}

function countNotes(nodes: OpfsNode[]): number {
  return nodes.reduce((n, node) =>
    n + (node.kind === 'file'
      ? (node.name.endsWith(EXT) ? 1 : 0)
      : countNotes(node.children ?? [])), 0)
}

export function useNoteFiles() {
  const tree = ref<OpfsNode[]>([])
  const selectedPath = ref<string | null>(null)
  /** Currently open note, or null for a fresh draft. */
  const notePath = ref<string | null>(null)
  const title = ref('')
  const body = ref('')
  const noteSize = ref<number | null>(null)
  const busy = ref(false)
  const fileError = ref<string | null>(null)
  /** Where a new note lands. Follows the open note or the last opened folder, root by default. */
  const draftDir = ref<string>(NOTES_ROOT)

  const promptOpen = ref(false)
  const promptName = ref('')
  /** Folder creation target, or the node being renamed. */
  const promptTarget = ref<{ mode: 'newFolder' | 'rename', node: OpfsNode | null }>({ mode: 'newFolder', node: null })
  const pendingNode = ref<OpfsNode | null>(null)
  const nodeDeleteOpen = ref(false)

  const canSave = computed(() => !busy.value && title.value.trim().length > 0)
  const noteCount = computed(() => countNotes(tree.value))

  async function refreshTree() {
    // the OPFS root always exists — no mkdir fallback needed
    tree.value = await opfsTree(NOTES_ROOT)
  }

  /** Run a mutation, surface its error, and reload the tree. */
  async function run(action: () => Promise<void>) {
    fileError.value = null
    busy.value = true
    try {
      await action()
      await refreshTree()
    }
    catch (err) {
      fileError.value = err instanceof Error ? err.message : String(err)
    }
    finally {
      busy.value = false
    }
  }

  async function uniquePath(path: string): Promise<string> {
    if (!await opfsExists(path))
      return path
    const dir = opfsDirname(path)
    const base = noteDisplayName(opfsBasename(path))
    let n = 2
    while (await opfsExists(opfsJoinPath(dir, `${base} - ${n}${EXT}`)))
      n++
    return opfsJoinPath(dir, `${base} - ${n}${EXT}`)
  }

  async function openNode(node: OpfsNode) {
    selectedPath.value = node.path
    if (node.kind === 'directory') {
      draftDir.value = node.path
      return
    }
    if (!node.name.endsWith(EXT))
      return
    fileError.value = null
    busy.value = true
    try {
      notePath.value = node.path
      title.value = noteDisplayName(node.name)
      body.value = await opfsReadText(node.path) ?? ''
      noteSize.value = node.size
      draftDir.value = opfsDirname(node.path)
    }
    catch (err) {
      fileError.value = err instanceof Error ? err.message : String(err)
    }
    finally {
      busy.value = false
    }
  }

  /**
   * Start a fresh draft. An explicit node targets its folder, explicit null
   * targets the root, omitted keeps the current context (open note's folder).
   */
  function newNote(node?: OpfsNode | null) {
    if (node === null)
      draftDir.value = NOTES_ROOT
    else if (node)
      draftDir.value = node.kind === 'directory' ? node.path : opfsDirname(node.path)
    else if (notePath.value)
      draftDir.value = opfsDirname(notePath.value)
    notePath.value = null
    selectedPath.value = null
    title.value = ''
    body.value = ''
    noteSize.value = null
  }

  async function saveNote() {
    const name = title.value.trim()
    if (!name || busy.value)
      return
    await run(async () => {
      const dir = notePath.value ? opfsDirname(notePath.value) : draftDir.value
      // opfsJoinPath throws OpfsPathError on hostile names — surfaced via run()
      let target = opfsJoinPath(dir, name + EXT)
      if (notePath.value && notePath.value !== target) {
        // title changed: rename, then write
        target = await uniquePath(target)
        await opfsMove(notePath.value, target)
      }
      else if (!notePath.value) {
        target = await uniquePath(target)
      }
      await opfsWrite(target, body.value, { gzip: true })
      notePath.value = target
      selectedPath.value = target
      const stat = await opfsStat(target)
      noteSize.value = stat?.kind === 'file' ? stat.size : null
    })
  }

  function askNewFolder(node: OpfsNode | null) {
    promptTarget.value = { mode: 'newFolder', node }
    promptName.value = ''
    promptOpen.value = true
  }

  function askRename(node: OpfsNode) {
    promptTarget.value = { mode: 'rename', node }
    promptName.value = node.kind === 'file' ? noteDisplayName(node.name) : node.name
    promptOpen.value = true
  }

  async function confirmPrompt() {
    const name = promptName.value.trim()
    if (!name)
      return
    const { mode, node } = promptTarget.value
    promptOpen.value = false
    await run(async () => {
      if (mode === 'rename' && node) {
        const destName = node.kind === 'file' && !name.endsWith(EXT) ? name + EXT : name
        const dest = await uniquePath(opfsJoinPath(opfsDirname(node.path), destName))
        await opfsMove(node.path, dest)
        if (notePath.value === node.path) {
          notePath.value = dest
          title.value = node.kind === 'file' ? noteDisplayName(opfsBasename(dest)) : title.value
        }
        selectedPath.value = dest
      }
      else {
        await opfsMkdir(opfsJoinPath(node?.kind === 'directory' ? node.path : NOTES_ROOT, name))
      }
    })
  }

  function askRemoveNode(node: OpfsNode) {
    pendingNode.value = node
    nodeDeleteOpen.value = true
  }

  async function confirmRemoveNode() {
    const node = pendingNode.value
    nodeDeleteOpen.value = false
    pendingNode.value = null
    if (!node)
      return
    // directories are deleted with their contents — the dialog is the confirmation
    await run(async () => {
      await opfsDelete(node.path, { recursive: node.kind === 'directory' })
      if (notePath.value === node.path || (node.kind === 'directory' && notePath.value?.startsWith(`${node.path}/`)))
        newNote()
      else if (selectedPath.value === node.path)
        selectedPath.value = null
    })
  }

  async function exportAll() {
    const blob = await opfsExportZip(NOTES_ROOT)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notes-backup.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importArchive(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file)
      return
    busy.value = true
    fileError.value = null
    try {
      await opfsImportZip(file, NOTES_ROOT)
      await refreshTree()
    }
    catch (err) {
      fileError.value = err instanceof Error ? err.message : String(err)
    }
    finally {
      busy.value = false
      input.value = ''
    }
  }

  /**
   * One-shot migration from the old single-file store: each TinyBase row in
   * notes.json becomes one markdown file, then the legacy file is deleted.
   * TinyBase persists as [tables, values], so rows live at parsed[0].notes.
   */
  async function migrateLegacy() {
    if (!await opfsExists(LEGACY_FILE))
      return
    try {
      const parsed = await opfsReadJson<unknown>(LEGACY_FILE)
      const tables = (Array.isArray(parsed) ? parsed[0] : undefined) as Record<string, unknown> | undefined
      const rows = tables?.notes as Record<string, Record<string, unknown>> | undefined
      if (rows) {
        for (const row of Object.values(rows)) {
          const name = String(row.title ?? '').trim() || 'Untitled'
          const target = await uniquePath(opfsJoinPath(NOTES_ROOT, name + EXT))
          await opfsWrite(target, String(row.body ?? ''), { gzip: true })
        }
      }
    }
    finally {
      await opfsDelete(LEGACY_FILE)
    }
  }

  return {
    tree,
    selectedPath,
    notePath,
    title,
    body,
    noteSize,
    busy,
    fileError,
    promptOpen,
    promptName,
    promptTarget,
    pendingNode,
    nodeDeleteOpen,
    canSave,
    noteCount,
    refreshTree,
    openNode,
    newNote,
    saveNote,
    askNewFolder,
    askRename,
    confirmPrompt,
    askRemoveNode,
    confirmRemoveNode,
    exportAll,
    importArchive,
    migrateLegacy,
  }
}
