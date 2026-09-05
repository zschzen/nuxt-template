import type { OpfsDeleteOptions, OpfsNode, OpfsRequest, OpfsResponse, OpfsWriteOptions } from '../utils/types'

type WithoutId<T> = T extends { id: number } ? Omit<T, 'id'> : never

const decoder = new TextDecoder()

export const isOpfsSupported = typeof window !== 'undefined'
  && 'storage' in navigator
  && 'getDirectory' in navigator.storage

let worker: Worker | null = null
let seq = 0
const pending = new Map<number, { resolve: (v: unknown) => void, reject: (e: Error) => void }>()

function getWorker(): Worker {
  if (!isOpfsSupported)
    throw new Error('OPFS is not supported in this browser')

  if (worker) {
    return worker
  }

  worker = new Worker(new URL('../workers/opfs.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (event: MessageEvent<OpfsResponse>) => {
    const res = event.data
    const entry = pending.get(res.id)
    if (!entry)
      return

    pending.delete(res.id)
    if (res.ok) {
      entry.resolve(res.result)
      return
    }

    // rebuild the worker-side error name so callers can branch on
    // NotFoundError / InvalidModificationError / OpfsPathError
    const error = new Error(res.error ?? 'OPFS worker error')
    if (res.name)
      error.name = res.name
    entry.reject(error)
  }

  return worker
}

function rpc<T>(req: WithoutId<OpfsRequest>): Promise<T> {
  const id = ++seq

  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject })
    getWorker().postMessage({ ...req, id })
  })
}

export function opfsRead(path: string): Promise<Uint8Array | null> {
  return rpc<Uint8Array | null>({ op: 'read', path })
}

export async function opfsReadText(path: string): Promise<string | null> {
  const bytes = await opfsRead(path)
  return bytes ? decoder.decode(bytes) : null
}

export async function opfsReadJson<T>(path: string): Promise<T | null> {
  const text = await opfsReadText(path)
  return text ? JSON.parse(text) as T : null
}

/** Write bytes or text, creating any missing parent directories. Returns bytes stored. */
export function opfsWrite(path: string, data: string | Uint8Array, options: OpfsWriteOptions = {}): Promise<number> {
  return rpc<number>({ op: 'write', path, data, gzip: options.gzip })
}

export function opfsWriteJson(path: string, value: unknown, options: OpfsWriteOptions = {}): Promise<number> {
  return opfsWrite(path, JSON.stringify(value), options)
}

/** Direct children of a directory, directories first. Directory nodes carry no `children`. */
export function opfsList(path = ''): Promise<OpfsNode[]> {
  return rpc<OpfsNode[]>({ op: 'list', path, recursive: false })
}

/** Whole subtree in one walk. Every directory node carries `children`. */
export function opfsTree(path = ''): Promise<OpfsNode[]> {
  return rpc<OpfsNode[]>({ op: 'list', path, recursive: true })
}

/** Metadata for one entry, `null` when it does not exist. */
export function opfsStat(path: string): Promise<OpfsNode | null> {
  return rpc<OpfsNode | null>({ op: 'stat', path })
}

export async function opfsExists(path: string): Promise<boolean> {
  return await opfsStat(path) !== null
}

/** Create a directory and any missing parents. Idempotent. */
export function opfsMkdir(path: string): Promise<void> {
  return rpc<void>({ op: 'mkdir', path })
}

/**
 * Delete a file or directory. Missing entries are a no-op.
 * A non-empty directory throws `InvalidModificationError` unless `recursive` is set.
 */
export function opfsDelete(path: string, options: OpfsDeleteOptions = {}): Promise<void> {
  return rpc<void>({ op: 'remove', path, recursive: options.recursive ?? false })
}

/** Move or rename. `to` is the full destination path, not a parent directory. */
export function opfsMove(from: string, to: string): Promise<void> {
  return rpc<void>({ op: 'move', from, to })
}

/** Copy a file or a whole directory. `to` is the full destination path. */
export function opfsCopy(from: string, to: string): Promise<void> {
  return rpc<void>({ op: 'copy', from, to })
}

/** Zip a subtree (default: everything). Entry names are full paths, so structure round-trips. */
export async function opfsExportZip(path = ''): Promise<Blob> {
  const bytes = await rpc<Uint8Array>({ op: 'exportZip', path })
  return new Blob([bytes as BlobPart], { type: 'application/zip' })
}

/** Extract an archive under `path`. Entries that fail path validation are skipped. */
export async function opfsImportZip(file: File, path = ''): Promise<void> {
  const buffer = await file.arrayBuffer()
  await rpc<void>({ op: 'importZip', path, data: new Uint8Array(buffer) })
}
