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

const toError = (err: unknown): Error => err instanceof Error ? err : new Error(String(err))

/**
 * Create (or reuse) a persistent TinyBase Store keyed by its OPFS file.
 * Loads once on init, then autosaves on every change — unless that load failed, in
 * which case no write path is armed at all, so an unreadable file is never
 * overwritten from an empty store. `reload()` re-arms it once the file reads clean.
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
  const onIgnoredError = (err: unknown): void => {
    error.value = toError(err)
  }
  // value-or-getter: the app owns compression state; the library reads it fresh at each write
  const getCompression = (): CompressionOptions =>
    typeof options.compression === 'function' ? options.compression() : options.compression ?? { enabled: false }

  const persister = options.createPersister
    ? await options.createPersister(store, onIgnoredError)
    : await createGzipOpfsPersister(store, file, getCompression, error)

  // autoload before autosave — TinyBase's own order (startAutoPersisting defaults to it). startAutoLoad
  // runs its own initial load, and registers the BroadcastChannel listener that keeps tabs in sync.
  await persister.startAutoLoad()

  // TinyBase's load() never throws. It hands getPersisted errors to onIgnoredError and resolves anyway,
  // leaving the store empty — and startAutoSave() opens with an unconditional save(), so an unreadable
  // file gets overwritten from that empty store before the user touches anything. onIgnoredError firing
  // is the only signal available, so gate every write path on it.
  let loadFailed = error.value !== null
  if (!loadFailed)
    await persister.startAutoSave()

  return {
    store,
    error,
    save: async () => {
      if (loadFailed)
        throw new Error(`Refusing to save over unreadable ${file}`)
      await persister.save()
    },
    // also the recovery path: once the file reads cleanly again, saving resumes
    reload: async () => {
      error.value = null
      await persister.load()
      loadFailed = error.value !== null
      if (!loadFailed && !persister.isAutoSaving())
        await persister.startAutoSave()
    },
    destroy: async () => {
      stores.delete(file)
      await persister.destroy()
    },
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
          error.value = toError(err)
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
  // Opened lazily so delPersisterListener can close it (persister.destroy() routes through
  // there) and a later start re-opens rather than posting into a dead channel.
  let channel: BroadcastChannel | null = null
  const getChannel = (): BroadcastChannel =>
    (channel ??= new BroadcastChannel(`template-storage:${file}`))

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
      getChannel().postMessage(1)
    },
    // listener() with no args is TinyBase's "re-read from source" signal — it triggers a full load()
    (listener) => { getChannel().onmessage = () => listener() },
    () => {
      channel?.close()
      channel = null
    },
    (err) => { error.value = toError(err) },
    // Persists.StoreOnly. `Persists` is an ambient `const enum`, and this project builds with
    // isolatedModules, so it cannot be imported as a value — the numeric cast is the only form
    // that compiles. Must track the store type: 2 for MergeableStore, 3 for either.
    1 as Persists,
  )
}

/**
 * Reactive rows of a TinyBase table for Vue. Rows carry their row id as `id`.
 * SSR-safe: empty until the store resolves. Listener cleanup is scoped.
 * ponytail: any cell change rebuilds every row with fresh object identities, so child
 * memoisation never hits — fine at template scale; addRowIdsListener plus per-row
 * listeners is the upgrade path if a table grows past a few hundred rows.
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
