import type { OpfsEntry, OpfsRequest } from '../utils/types'
/// <reference lib="webworker" />
import { unzipSync, zipSync } from 'fflate'
import { gzipCompress, gzipDecompress, isGzipped } from '../composables/compression'

type Res
  = | { id: number, ok: true, result?: Uint8Array | null | number | OpfsEntry[] }
    | { id: number, ok: false, error: string }

const encoder = new TextEncoder()

let root: FileSystemDirectoryHandle | null = null

async function getRoot(): Promise<FileSystemDirectoryHandle> {
  if (!root)
    root = await navigator.storage.getDirectory()
  return root
}

// ponytail: flat filenames only — nested paths need recursive mkdir; add if docs outgrow root
async function readRaw(name: string): Promise<Uint8Array | null> {
  const dir = await getRoot()
  let fh: FileSystemFileHandle
  try {
    fh = await dir.getFileHandle(name)
  }
  catch {
    return null
  }
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

async function writeRaw(name: string, bytes: Uint8Array): Promise<void> {
  const dir = await getRoot()
  const fh = await dir.getFileHandle(name, { create: true })
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

async function listEntries(): Promise<OpfsEntry[]> {
  const dir = await getRoot()
  const entries: OpfsEntry[] = []
  for await (const [name, handle] of dir.entries())
    entries.push({ name: name as string, size: (await (handle as FileSystemFileHandle).getFile()).size })
  return entries.sort((a, b) => a.name.localeCompare(b.name))
}

type HandleResult = Extract<Res, { ok: true }>['result']

async function handle(req: OpfsRequest): Promise<HandleResult> {
  switch (req.op) {
    case 'read': {
      const raw = await readRaw(req.name)
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
      await writeRaw(req.name, stored)
      return stored.length
    }
    case 'list':
      return await listEntries()

    case 'delete': {
      const dir = await getRoot()
      try {
        await dir.removeEntry(req.name)
      }
      catch {
        // already gone — delete is idempotent
      }
      return undefined
    }
    case 'exportZip': {
      const names = (await listEntries()).map(e => e.name)
      const files: Record<string, Uint8Array> = {}
      for (const name of names) {
        const bytes = await readRaw(name)
        if (bytes && bytes.length > 0)
          files[name] = bytes
      }
      return zipSync(files)
    }
    case 'importZip': {
      const entries = unzipSync(req.data)
      for (const [name, bytes] of Object.entries(entries)) {
        if (!name.startsWith('/'))
          await writeRaw(name, bytes)
      }
      return undefined
    }
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
    // eslint-disable-next-line no-restricted-globals -- dedicated-worker scope: `self` is DedicatedWorkerGlobalScope
    self.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) })
  }
}
