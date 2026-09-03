import type { MergeableStore } from 'tinybase'
import type { Persister, Persists } from 'tinybase/persisters'
import type { CompressionOptions, StoreApi, StoreOptions, TableRow } from '../utils/types'
import { createMergeableStore } from 'tinybase'
import { createCustomPersister } from 'tinybase/persisters'
import { gzipCompress, gzipDecompress, isGzipped } from './compression'

const DEFAULT_FILE = 'store.json'
const encoder = new TextEncoder()
const decoder = new TextDecoder()

// one store + persister per file — double persisters on the same file would thrash
const stores = new Map<string, Promise<StoreApi>>()

/**
 * Create (or reuse) a persistent TinyBase MergeableStore keyed by its OPFS file.
 * Loads once on init — a failed load throws before autosave starts, so the file
 * is never overwritten from an empty store — then autosaves on every change.
 * Compression is format-sniffed on read and flag-driven on write. Client-only.
 */
export function createOpfsStore(options: StoreOptions = {}): Promise<StoreApi> {
  const file = options.file ?? DEFAULT_FILE
  const existing = stores.get(file)
  if (existing)
    return existing
  const created = init(file, options)
  stores.set(file, created)
  created.catch(() => stores.delete(file))
  return created
}

async function init(file: string, options: StoreOptions): Promise<StoreApi> {
  if (typeof window === 'undefined')
    throw new Error('createOpfsStore is client-only')
  const store = createMergeableStore()
  // value-or-getter: the app owns compression state; the library reads it fresh at each write
  const getCompression = (): CompressionOptions =>
    typeof options.compression === 'function' ? options.compression() : options.compression ?? { enabled: false }

  const persister = options.createPersister
    ? await options.createPersister(store)
    : await createGzipOpfsPersister(store, file, getCompression)

  // load must precede autosave: a failed load throws here and never reaches save
  await persister.load()
  await persister.startAutoSave()

  return {
    store,
    save: async () => { await persister.save() },
    reload: async () => { await persister.load() },
  }
}

/**
 * Composable wrapper around `createOpfsStore` with the client-only guard baked in.
 * SSR-safe: `store` stays null and `ready` resolves null on the server.
 */
export function useOpfsStore(options: StoreOptions = {}): {
  store: Ref<MergeableStore | null>
  ready: Promise<StoreApi | null>
} {
  const store = shallowRef<MergeableStore | null>(null)

  const ready = typeof window !== 'undefined'
    ? createOpfsStore(options)
        .then((api) => {
          store.value = api.store
          return api
        })
        .catch((error) => {
          console.error('[useOpfsStore] store init failed', error)
          return null
        })
    : Promise.resolve(null)

  return { store, ready }
}

/**
 * OPFS persister with transparent compression: gzip on write when enabled,
 * magic-byte sniff on read so both formats load regardless of the flag.
 */
async function createGzipOpfsPersister(
  store: MergeableStore,
  file: string,
  getCompression: () => CompressionOptions,
): Promise<Persister<Persists>> {
  const dir = await navigator.storage.getDirectory()
  const handle = await dir.getFileHandle(file, { create: true })

  const readBytes = async (): Promise<Uint8Array | null> => {
    try {
      const f = await handle.getFile()
      if (f.size === 0)
        return new Uint8Array(0)
      return new Uint8Array(await f.arrayBuffer())
    }
    catch {
      return null
    }
  }

  const writeBytes = async (bytes: Uint8Array<ArrayBuffer>): Promise<void> => {
    const w = await handle.createWritable()
    await w.write(bytes)
    await w.close()
  }

  return createCustomPersister(
    store,
    async () => {
      const bytes = await readBytes()
      if (!bytes || bytes.length === 0)
        return undefined
      const raw = isGzipped(bytes) ? gzipDecompress(bytes) : bytes
      return JSON.parse(decoder.decode(raw))
    },
    async (getContent) => {
      const opts = getCompression()
      let bytes: Uint8Array<ArrayBuffer> = encoder.encode(JSON.stringify(getContent()))
      if (opts.enabled)
        bytes = gzipCompress(bytes, opts)
      await writeBytes(bytes)
    },
    () => 0,
    () => {},
    undefined,
    3 as Persists,
  )
}

/**
 * Reactive rows of a TinyBase table for Vue. Rows carry their row id as `id`.
 * SSR-safe: empty until the store resolves. Listener cleanup is scoped.
 */
export function useTable(getStore: () => MergeableStore | null | undefined, tableId: string): Ref<TableRow[]> {
  const rows = shallowRef<TableRow[]>([])

  function sync(store: MergeableStore) {
    rows.value = Object.entries(store.getTable(tableId)).map(([id, cells]) => ({ id, ...cells }))
  }

  watch(() => toValue(getStore), (store, _prev, onCleanup) => {
    if (!store) {
      rows.value = []
      return
    }
    sync(store)
    const listenerId = store.addTableListener(tableId, () => sync(store))
    onCleanup(() => store.delListener(listenerId))
  }, { immediate: true })

  return rows
}
