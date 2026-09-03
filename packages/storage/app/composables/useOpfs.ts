import type { OpfsEntry, OpfsRequest, OpfsWriteOptions } from '../utils/types'

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
  if (!worker) {
    worker = new Worker(new URL('../workers/opfs.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent) => {
      const res = event.data as { id: number, ok: boolean, result?: unknown, error?: string }
      const entry = pending.get(res.id)
      if (!entry)
        return
      pending.delete(res.id)
      if (res.ok)
        entry.resolve(res.result)
      else entry.reject(new Error(res.error ?? 'OPFS worker error'))
    }
  }
  return worker
}

type WithoutId<T> = T extends { id: number } ? Omit<T, 'id'> : never

function rpc<T>(req: WithoutId<OpfsRequest>): Promise<T> {
  const id = ++seq
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject })
    getWorker().postMessage({ ...req, id })
  })
}

export function opfsRead(name: string): Promise<Uint8Array | null> {
  return rpc<Uint8Array | null>({ op: 'read', name })
}

export async function opfsReadText(name: string): Promise<string | null> {
  const bytes = await opfsRead(name)
  return bytes ? decoder.decode(bytes) : null
}

export async function opfsReadJson<T>(name: string): Promise<T | null> {
  const text = await opfsReadText(name)
  return text ? JSON.parse(text) as T : null
}

export function opfsWrite(name: string, data: string | Uint8Array, options: OpfsWriteOptions = {}): Promise<number> {
  return rpc<number>({ op: 'write', name, data, gzip: options.gzip })
}

export function opfsWriteJson(name: string, value: unknown, options: OpfsWriteOptions = {}): Promise<number> {
  return opfsWrite(name, JSON.stringify(value), options)
}

// ponytail: flat filenames only — nested paths need recursive mkdir in the worker
export function opfsList(): Promise<OpfsEntry[]> {
  return rpc<OpfsEntry[]>({ op: 'list' })
}

export function opfsDelete(name: string): Promise<void> {
  return rpc<void>({ op: 'delete', name })
}

export async function opfsExportZip(): Promise<Blob> {
  const bytes = await rpc<Uint8Array>({ op: 'exportZip' })
  return new Blob([bytes as BlobPart], { type: 'application/zip' })
}

export async function opfsImportZip(file: File): Promise<void> {
  const buffer = await file.arrayBuffer()
  await rpc<void>({ op: 'importZip', data: new Uint8Array(buffer) })
}
