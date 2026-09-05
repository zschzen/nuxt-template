import type { OpfsNode, OpfsRequest } from '../utils/types'
/// <reference lib="webworker" />
import { unzipSync, zipSync } from 'fflate'
import { gzipCompress, gzipDecompress, isGzipped } from '../composables/compression'
import { opfsBasename, opfsJoinPath, opfsNormalizePath, opfsPathSegments, opfsResolveDirectory, opfsResolveFile } from '../utils/opfsPath'

const encoder = new TextEncoder()

let root: FileSystemDirectoryHandle | null = null

async function getRoot(): Promise<FileSystemDirectoryHandle> {
  if (!root)
    root = await navigator.storage.getDirectory()
  return root
}

async function readRaw(path: string): Promise<Uint8Array | null> {
  const fh = await opfsResolveFile(await getRoot(), path)
  if (!fh)
    return null

  const ah = await fh.createSyncAccessHandle()
  try {
    const size = ah.getSize()
    if (size === 0)
      return new Uint8Array(0)
    const bytes = new Uint8Array(size)
    ah.read(bytes, { at: 0 })
    return bytes
  }
  finally {
    ah.close()
  }
}

/** Whole-file write. Creates the parent directory chain. */
async function writeRaw(path: string, bytes: Uint8Array): Promise<void> {
  const fh = await opfsResolveFile(await getRoot(), path, { create: true })
  if (!fh)
    throw new Error(`Cannot open ${path} for writing`)

  const ah = await fh.createSyncAccessHandle()
  try {
    ah.truncate(0)
    ah.write(bytes, { at: 0 })
    ah.flush()
  }
  finally {
    ah.close()
  }
}

async function toNode(handle: FileSystemHandle, path: string, recursive: boolean): Promise<OpfsNode> {
  if (handle.kind === 'file') {
    const file = await (handle as FileSystemFileHandle).getFile()
    return { kind: 'file', name: handle.name, path, size: file.size, lastModified: file.lastModified }
  }
  const node: OpfsNode = { kind: 'directory', name: handle.name, path }
  if (recursive)
    node.children = await listDir(handle as FileSystemDirectoryHandle, path, true)
  return node
}

/** Direct children of a directory handle, directories first then name order. */
async function listDir(dir: FileSystemDirectoryHandle, base: string, recursive: boolean): Promise<OpfsNode[]> {
  const nodes: OpfsNode[] = []
  for await (const [name, handle] of dir.entries())
    nodes.push(await toNode(handle, opfsJoinPath(base, name), recursive))

  return nodes.sort((a, b) =>
    a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'directory' ? -1 : 1,
  )
}

async function list(path: string, recursive: boolean): Promise<OpfsNode[]> {
  const dir = await opfsResolveDirectory(await getRoot(), opfsPathSegments(path), false)
  if (!dir)
    throw notFound(path)
  return listDir(dir, opfsNormalizePath(path), recursive)
}

function notFound(path: string): Error {
  const error = new Error(`No such entry: ${path || '/'}`)
  error.name = 'NotFoundError'
  return error
}

async function stat(path: string): Promise<OpfsNode | null> {
  const segments = opfsPathSegments(path)
  const dir = await opfsResolveDirectory(await getRoot(), segments.slice(0, -1), false)
  if (!dir)
    return null
  if (segments.length === 0)
    return { kind: 'directory', name: '', path: '' }

  const name = segments[segments.length - 1] as string
  for (const get of [
    () => dir.getFileHandle(name),
    () => dir.getDirectoryHandle(name),
  ]) {
    try {
      return await toNode(await get(), segments.join('/'), false)
    }
    catch {
      // try the other kind, then report missing
    }
  }
  return null
}

/** Parent directory of an entry, or null when the chain is missing. */
async function parentOf(path: string, create: boolean): Promise<FileSystemDirectoryHandle | null> {
  return opfsResolveDirectory(await getRoot(), opfsPathSegments(path).slice(0, -1), create)
}

async function remove(path: string, recursive: boolean): Promise<void> {
  const name = opfsBasename(path)
  if (!name)
    throw new Error('Refusing to remove the OPFS root')

  const dir = await parentOf(path, false)
  if (!dir)
    return // parent already gone — delete stays idempotent

  try {
    await dir.removeEntry(name, { recursive })
  }
  catch (error) {
    // idempotent on missing entries only; a non-empty directory must still report
    // InvalidModificationError rather than silently surviving a delete that did nothing
    if ((error as Error).name !== 'NotFoundError')
      throw error
  }
}

// ponytail: copy is whole-file read + write and move is copy + remove — no
// FileSystemFileHandle.move() fast path (Chrome-only, files-only) and no streaming.
// Stream via handle.getFile().stream() if multi-MB files show up.
async function copy(from: string, to: string): Promise<void> {
  const source = opfsNormalizePath(from)
  const dest = opfsNormalizePath(to)
  if (dest === source || dest.startsWith(`${source}/`))
    throw new Error(`Cannot copy ${source || '/'} into itself`)

  const node = await stat(source)
  if (!node)
    throw notFound(source)

  if (node.kind === 'file') {
    const bytes = await readRaw(source)
    await writeRaw(dest, bytes ?? new Uint8Array(0))
    return
  }

  await opfsResolveDirectory(await getRoot(), opfsPathSegments(dest), true)
  for (const child of await list(source, false))
    await copy(child.path, opfsJoinPath(dest, child.name))
}

async function exportZip(path: string): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {}
  const walk = async (nodes: OpfsNode[]): Promise<void> => {
    for (const node of nodes) {
      if (node.kind === 'directory') {
        await walk(await list(node.path, false))
        continue
      }
      const bytes = await readRaw(node.path)
      if (bytes && bytes.length > 0)
        files[node.path] = bytes
    }
  }
  await walk(await list(path, false))
  return zipSync(files)
}

async function importZip(base: string, data: Uint8Array): Promise<void> {
  for (const [name, bytes] of Object.entries(unzipSync(data))) {
    // zip entry names are untrusted: strip harmless prefixes (leading `/`,
    // `./`, `\` separators, `__MACOSX/` noise), then the validator below
    // stays the zip-slip guard — `..` still throws and skips the entry
    const clean = name
      .replace(/\\/g, '/')
      .replace(/^(\.\/)+/, '')
      .replace(/^\/+/, '')
    if (!clean || clean.startsWith('__MACOSX/'))
      continue
    let target: string
    try {
      target = opfsJoinPath(base, clean)
    }
    catch {
      continue
    }
    if (!target)
      continue

    if (clean.endsWith('/'))
      await opfsResolveDirectory(await getRoot(), opfsPathSegments(target), true)
    else
      await writeRaw(target, bytes)
  }
}

async function handle(req: OpfsRequest): Promise<unknown> {
  switch (req.op) {
    case 'read': {
      const raw = await readRaw(req.path)
      if (!raw)
        return null
      // transparent compression: gzip'd files decompress on read regardless of how they were written
      return isGzipped(raw) ? gzipDecompress(raw) : raw
    }
    case 'write': {
      const bytes = typeof req.data === 'string' ? encoder.encode(req.data) : req.data
      const gzip = req.gzip
      const stored = gzip
        ? gzipCompress(bytes, typeof gzip === 'object' ? gzip : undefined)
        : bytes
      await writeRaw(req.path, stored)
      return stored.length
    }
    case 'list':
      return await list(req.path, req.recursive)
    case 'stat':
      return await stat(req.path)
    case 'mkdir': {
      const segments = opfsPathSegments(req.path)
      if (segments.length === 0)
        return undefined
      if (!await opfsResolveDirectory(await getRoot(), segments, true))
        throw new Error(`Cannot create directory ${req.path}`)
      return undefined
    }
    case 'remove':
      return await remove(req.path, req.recursive)
    case 'copy':
      return await copy(req.from, req.to)
    case 'move': {
      await copy(req.from, req.to)
      return await remove(req.from, true)
    }
    case 'exportZip':
      return await exportZip(req.path)
    case 'importZip':
      return await importZip(req.path, req.data)
  }
}

// eslint-disable-next-line no-restricted-globals -- dedicated-worker scope: `self` is DedicatedWorkerGlobalScope
self.onmessage = async (event: MessageEvent<OpfsRequest>) => {
  const { id } = event.data
  try {
    const result = await handle(event.data)
    // eslint-disable-next-line no-restricted-globals -- dedicated-worker scope: `self` is DedicatedWorkerGlobalScope
    self.postMessage({ id, ok: true, result }, {
      transfer: result instanceof Uint8Array ? [result.buffer] : [],
    })
  }
  catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    // the name is the contract: callers branch on NotFoundError / InvalidModificationError / OpfsPathError
    // eslint-disable-next-line no-restricted-globals -- dedicated-worker scope: `self` is DedicatedWorkerGlobalScope
    self.postMessage({ id, ok: false, error: err.message, name: err.name })
  }
}
