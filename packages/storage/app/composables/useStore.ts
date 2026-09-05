import type { Store } from 'tinybase'
import type { Persister, Persists } from 'tinybase/persisters'
import type { Ref } from 'vue'
import type { CompressionOptions, StoreApi, StoreOptions, TableRow } from '../utils/types'
import { createStore } from 'tinybase'
import { createCustomPersister } from 'tinybase/persisters'
import { gzipCompress, gzipDecompress, isGzipped } from './compression'

const DEFAULT_FILE = 'store.json'
const encoder = new TextEncoder()
const decoder = new TextDecoder()

// one store + persister per file — double persisters on the same file would thrash
const stores = new Map<string, Promise<StoreApi>>()

/**
 * Create (or reuse) a persistent TinyBase Store keyed by its OPFS file.
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
  const store = createStore()
  const error = shallowRef<Error | null>(null)
  // value-or-getter: the app owns compression state; the library reads it fresh at each write
  const getCompression = (): CompressionOptions =>
    typeof options.compression === 'function' ? options.compression() : options.compression ?? { enabled: false }

  const persister = options.createPersister
    ? await options.createPersister(store)
    : await createGzipOpfsPersister(store, file, getCompression, error)

  // load must precede autosave: a failed load throws here and never reaches save
  await persister.load()
  await persister.startAutoSave()
  // pairs with the persister's BroadcastChannel listener below to keep tabs on the same file in sync
  await persister.startAutoLoad()

  return {
    store,
    error,
    save: async () => { await persister.save() },
    reload: async () => { await persister.load() },
  }
}

/**
 * Composable wrapper around `createOpfsStore` with the client-only guard baked in.
 * SSR-safe: `store` stays null and `ready` resolves null on the server.
 */
export function useOpfsStore(options: StoreOptions = {}): {
  store: Ref<Store | null>
  error: Ref<Error | null>
  ready: Promise<StoreApi | null>
} {
  const store = shallowRef<Store | null>(null)
  const error = shallowRef<Error | null>(null)

  const ready = typeof window !== 'undefined'
    ? createOpfsStore(options)
        .then((api) => {
          store.value = api.store
          watch(api.error, (value) => {
            error.value = value
          }, { immediate: true })
          return api
        })
        .catch((err) => {
          error.value = err instanceof Error ? err : new Error(String(err))
          return null
        })
    : Promise.resolve(null)

  return { store, error, ready }
}

/**
 * OPFS persister with transparent compression: gzip on write when enabled,
 * magic-byte sniff on read so both formats load regardless of the flag.
 * Cross-tab: broadcasts on save and reloads on a peer tab's broadcast (paired
 * with startAutoLoad in init()) so tabs on the same file stay in sync.
 */
async function createGzipOpfsPersister(
  store: Store,
  file: string,
  getCompression: () => CompressionOptions,
  error: Ref<Error | null>,
): Promise<Persister<Persists>> {
  const dir = await navigator.storage.getDirectory()
  const handle = await dir.getFileHandle(file, { create: true })
  // ponytail: whole-file reload, not a merge — two tabs saving in the same instant can still
  // race; MergeableStore + a Synchronizer is the upgrade path if that gap needs closing.
  const channel = new BroadcastChannel(`template-storage:${file}`)

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
      error.value = null
      channel.postMessage(1)
    },
    (listener) => { channel.onmessage = () => listener() },
    () => { channel.onmessage = null },
    (err) => { error.value = err instanceof Error ? err : new Error(String(err)) },
    1 as Persists,
  )
}

/**
 * Reactive rows of a TinyBase table for Vue. Rows carry their row id as `id`.
 * SSR-safe: empty until the store resolves. Listener cleanup is scoped.
 */
export function useTable(getStore: () => Store | null | undefined, tableId: string): Ref<TableRow[]> {
  const rows = shallowRef<TableRow[]>([])

  function sync(store: Store) {
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
