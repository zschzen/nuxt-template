<script setup lang="ts">
import { Button } from '@template/ui/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@template/ui/components/ui/dialog'
import { Separator } from '@template/ui/components/ui/separator'
import { Switch } from '@template/ui/components/ui/switch'
import { computed, onMounted, ref } from 'vue'

type Note = {
  id: string
  title: string
  body: string
  updatedAt: number
}

definePageMeta({ layout: 'default' })

const nuxtApp = useNuxtApp()
const pwa = computed(() => nuxtApp.$pwa)

const supported = isOpfsSupported
const online = useOnline()
const { persisted, refresh, requestPersist } = useStorageStatus()

const entries = ref<{ name: string, size: number, title: string }[]>([])
const gzip = ref(true)
const lastStat = ref<{ raw: number, stored: number, updatedAt: number } | null>(null)
const selectedId = ref<string | null>(null)
const title = ref('')
const body = ref('')
const busy = ref(false)
const pendingDelete = ref<{ name: string, title: string } | null>(null)
const deleteOpen = ref(false)

const canSave = computed(() => !busy.value && title.value.trim().length > 0)
const ratio = computed(() =>
  lastStat.value && lastStat.value.raw > 0
    ? Math.round((1 - lastStat.value.stored / lastStat.value.raw) * 100)
    : 0,
)

const statusLabel = computed(() =>
  `${pwa.value?.isPWAInstalled ? 'Installed' : 'Not installed'} · ${online.value ? 'Online' : 'Offline'}`,
)

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)
    return 'Saved just now'
  const m = Math.floor(s / 60)
  if (m < 60)
    return `Saved ${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)
    return `Saved ${h}h ago`
  return `Saved ${new Date(ts).toLocaleDateString()}`
}

async function loadList() {
  const all = await opfsList()
  const files = all.filter(e => e.name.startsWith('note-') && e.name.endsWith('.json')).reverse()
  entries.value = await Promise.all(files.map(async (entry) => {
    const id = entry.name.replace(/^note-/, '').replace(/\.json$/, '')
    const note = await opfsReadJson<Note>(entry.name, { gzip: gzip.value })
      .catch(() => opfsReadJson<Note>(entry.name))
    return { ...entry, title: note?.title || id }
  }))
}

function noteName(id: string) {
  return `note-${id}.json`
}

async function newNote() {
  selectedId.value = null
  title.value = ''
  body.value = ''
}

async function openNote(name: string) {
  let note: Note | null
  try {
    note = await opfsReadJson<Note>(name, { gzip: gzip.value })
  }
  catch {
    note = await opfsReadJson<Note>(name)
  }
  if (!note)
    return
  selectedId.value = note.id
  title.value = note.title
  body.value = note.body
}

async function saveNote() {
  if (!canSave.value)
    return
  busy.value = true
  try {
    const id = selectedId.value ?? crypto.randomUUID()
    const text = JSON.stringify({
      id,
      title: title.value.trim(),
      body: body.value,
      updatedAt: Date.now(),
    })
    const stored = await opfsWrite(noteName(id), text, { gzip: gzip.value })
    lastStat.value = { raw: new Blob([text]).size, stored, updatedAt: Date.now() }
    selectedId.value = id
    await loadList()
    await refresh()
  }
  finally {
    busy.value = false
  }
}

async function confirmDelete() {
  if (!pendingDelete.value)
    return
  await opfsDelete(pendingDelete.value.name)
  if (selectedId.value && noteName(selectedId.value) === pendingDelete.value.name)
    await newNote()
  await loadList()
  await refresh()
  deleteOpen.value = false
  pendingDelete.value = null
}

function askDelete(entry: { name: string, title: string }) {
  pendingDelete.value = {
    name: entry.name,
    title: selectedId.value && noteName(selectedId.value) === entry.name
      ? (title.value.trim() || entry.title)
      : entry.title,
  }
  deleteOpen.value = true
}

async function exportAll() {
  const blob = await opfsExportZip()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'local-first-backup.zip'
  a.click()
  URL.revokeObjectURL(url)
}

async function importArchive(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return
  busy.value = true
  try {
    await opfsImportZip(file)
    await loadList()
    await refresh()
  }
  finally {
    busy.value = false
    input.value = ''
  }
}

onMounted(async () => {
  if (!supported)
    return
  await loadList()
  await refresh()
})
</script>

<template>
  <div class="font-sans mx-auto p-8 flex flex-col gap-5 max-w-[672px] min-h-screen">
    <header class="flex items-center justify-between">
      <h1 class="text-sm text-foreground font-semibold">
        Local Notes
      </h1>
      <div class="flex gap-2.5 items-center">
        <div class="flex gap-1.5 items-center">
          <span class="rounded-full size-1.5" :class="online ? 'bg-green-500' : 'bg-orange-400'" />
          <span class="text-[11px] text-muted-foreground">{{ statusLabel }}</span>
        </div>
        <span class="text-[11px] text-muted-foreground">·</span>
        <label class="flex gap-2 cursor-pointer items-center">
          <Switch v-model:checked="gzip" />
          <span class="text-xs text-muted-foreground">gzip</span>
        </label>
      </div>
    </header>

    <Separator />

    <ClientOnly>
      <div v-if="!supported" class="text-sm text-red-700 p-4 border border-red-300 rounded-md bg-red-50 dark:text-red-300 dark:border-red-800 dark:bg-red-950">
        This browser doesn't support OPFS (needs Chrome/Edge 102+, Firefox 111+, or Safari 16.4+). Data features are disabled.
      </div>

      <template v-else>
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted-foreground tracking-[0.12em] font-medium uppercase">Note name</span>
            <Button :disabled="busy" @click="saveNote">
              <span class="i-lucide-save shrink-0 size-4" />
              Save note
            </Button>
          </div>
          <input
            v-model="title"
            placeholder="Untitled"
            class="text-[30px] text-foreground leading-[1.2] font-semibold font-serif pb-1.5 pt-0.5 outline-none border-b border-border bg-transparent w-full placeholder:text-muted-foreground/60"
            @keydown.ctrl.s.prevent="saveNote"
            @keydown.meta.s.prevent="saveNote"
          >
          <div v-if="lastStat" class="flex gap-[7px] items-center">
            <span class="rounded-full bg-green-500 size-1.5" />
            <span class="text-xs text-muted-foreground font-mono">
              {{ timeAgo(lastStat.updatedAt) }} · {{ formatStorageBytes(lastStat.stored) }} · gzip −{{ ratio }}%
            </span>
          </div>
          <textarea
            v-model="body"
            placeholder="Start writing…"
            class="text-base text-foreground leading-[1.7] font-serif px-[22px] py-5 outline-none border border-border rounded-sm bg-background h-[260px] w-full resize-none placeholder:text-muted-foreground/60"
          />
        </section>

        <section class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="flex gap-2 items-center">
              <span class="text-[11px] text-muted-foreground tracking-[1px] font-medium uppercase">Notes</span>
              <span class="text-xs text-muted-foreground font-mono">{{ entries.length }}</span>
            </div>
            <div class="flex gap-2 items-center">
              <Button :disabled="busy" @click="newNote">
                <span class="i-lucide-plus shrink-0 size-4" />
                New note
              </Button>
              <label class="inline-flex cursor-pointer">
                <input
                  type="file"
                  accept=".zip"
                  class="hidden"
                  :disabled="busy"
                  @change="importArchive"
                >
                <Button
                  variant="outline"
                  :disabled="busy"
                >
                  <span class="i-lucide-upload shrink-0 size-4" />
                  Import ZIP
                </Button>
              </label>
              <Button
                variant="outline"
                :disabled="busy"
                @click="exportAll"
              >
                <span class="i-lucide-download shrink-0 size-4" />
                Export ZIP
              </Button>
            </div>
          </div>
          <ul class="flex flex-col h-40 [scrollbar-width:thin] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground [&::-webkit-scrollbar-track]:bg-border [&::-webkit-scrollbar]:w-1">
            <li
              v-for="entry in entries"
              :key="entry.name"
              class="group py-2.5 pl-0 pr-3 border-b border-border flex cursor-pointer items-center justify-between"
              @click="openNote(entry.name)"
            >
              <div class="flex gap-2 items-center">
                <span
                  v-if="selectedId && noteName(selectedId) === entry.name"
                  class="rounded-full bg-green-500 size-1.5"
                />
                <span
                  class="text-[15px] leading-[1.2] font-serif"
                  :class="selectedId && noteName(selectedId) === entry.name ? 'font-semibold text-foreground' : 'text-muted-foreground'"
                >{{ entry.title }}</span>
              </div>
              <div class="flex gap-2.5 items-center">
                <span class="text-[11px] text-muted-foreground font-mono">{{ formatStorageBytes(entry.size) }}</span>
                <Button
                  variant="ghost"
                  aria-label="Delete note"
                  class="text-muted-foreground p-0 size-4 hover:text-destructive"
                  @click.stop="askDelete(entry)"
                >
                  <span class="i-lucide-x shrink-0 size-3" />
                </Button>
              </div>
            </li>
          </ul>
        </section>

        <footer class="mt-auto pt-3 border-t border-border flex items-center justify-between">
          <span class="text-[11px] text-muted-foreground">Data never leaves this device</span>
          <div class="flex flex-wrap gap-2 items-center">
            <Button
              variant="link"
              as-child
              class="text-[11px] p-0 h-auto"
            >
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"
                target="_blank"
                rel="noopener"
              >PWA docs</a>
            </Button>
            <span class="text-[11px] text-muted-foreground">·</span>
            <Button
              variant="link"
              as-child
              class="text-[11px] p-0 h-auto"
            >
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_API#origin_private_file_system"
                target="_blank"
                rel="noopener"
              >OPFS docs</a>
            </Button>
            <span class="text-[11px] text-muted-foreground">·</span>
            <Button
              variant="link"
              as-child
              class="text-[11px] p-0 h-auto"
            >
              <a
                href="https://github.com/101arrowz/fflate"
                target="_blank"
                rel="noopener"
              >fflate</a>
            </Button>
            <template v-if="persisted === false">
              <span class="text-[11px] text-muted-foreground">·</span>
              <Button
                variant="link"
                class="text-[11px] p-0 h-auto"
                @click="requestPersist"
              >
                Persist
              </Button>
            </template>
            <template v-if="pwa?.showInstallPrompt">
              <span class="text-[11px] text-muted-foreground">·</span>
              <Button
                variant="link"
                class="text-[11px] p-0 h-auto"
                @click="pwa?.install()"
              >
                Install
              </Button>
            </template>
          </div>
        </footer>
      </template>

      <template #fallback>
        <p class="text-sm text-muted-foreground">
          Loading local storage…
        </p>
      </template>
    </ClientOnly>

    <Dialog :open="deleteOpen" @update:open="deleteOpen = $event">
      <DialogContent
        hide-close
        overlay-class="bg-black/35"
        class="p-5 rounded-md gap-3 max-w-[360px] shadow-[0_12px_28px_rgba(0,0,0,0.15)] sm:max-w-[360px]"
      >
        <DialogTitle class="text-base tracking-normal font-semibold">
          Delete note?
        </DialogTitle>
        <DialogDescription class="text-sm leading-[1.5]">
          Permanently delete “{{ pendingDelete?.title }}” from this device? This can’t be undone.
        </DialogDescription>
        <DialogFooter class="gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="deleteOpen = false"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            @click="confirmDelete"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
