# @template/storage

Local-first storage layer for Nuxt apps: OPFS-backed file store running in a dedicated worker with synchronous access handles, plus optional gzip compression and ZIP import/export (via [fflate](https://github.com/101arrowz/fflate)).

## Why a worker?

`FileSystemFileHandle.createSyncAccessHandle()` — the fastest OPFS API — is only available inside dedicated workers. A single worker owns every file, which also sidesteps concurrent-handle conflicts.

## Usage

Enable the layer in your app:

```ts
export default defineNuxtConfig({
  extends: ['@template/storage'],
})
```

Composables are auto-imported:

```ts
const notes = await opfsList()
await opfsWriteJson('note-1.json', { title: 'Hello', done: false })
await opfsReadJson<{ title: string }>('note-1.json')

// large payloads
await opfsWrite('blob.bin', bytes, { gzip: true })

// backup / migration
const blob = await opfsExportZip() // download it
await opfsImportZip(file) // restore from it
```

Storage status:

```ts
const { persisted, usage, quota, refresh, requestPersist } = useStorageStatus()
await requestPersist() // opt out of eviction under storage pressure
```

## TinyBase store

Reactive local-first store ([TinyBase](https://tinybase.org) `Store`), persisted to OPFS via `store.json` with auto-save. The module is domain-free: table names, schemas and migrations are consumer-supplied.

```ts
const { store, error, save, reload, destroy } = await createOpfsStore({
  file: 'store.json', // default
  compression: { enabled: true, level: 6 }, // value or getter — pass a getter () => opts.value to change at runtime
  // createPersister: (store, onIgnoredError) => otherBackend(store, onIgnoredError), // backend swap (e.g. IndexedDB)
})

store.setRow('notes', id, { title: 'Hello', body: '…' })

// reactive rows for Vue (auto listener, scoped cleanup)
const rows = useTable(() => store, 'notes')

// release the persister listeners, the broadcast channel and the shared-store cache entry
await destroy()
```

`destroy()` is consumer-called on purpose: one store is shared by every caller of the same file, so
unmounting a single component must not tear it down for the rest. Call it when the file itself is done with.

**Why not TinyBase's own `createOpfsPersister`?** It exists (since TinyBase v6.7.0) and is a fine default,
but it has no hook for compressing what it writes, and its auto-load is built on `FileSystemObserver`, which
is not yet broadly available. This package's persister adds gzip and signals other tabs over a
`BroadcastChannel` instead. Swap to the built-in through the `createPersister` seam if you want neither.

**Backends** — OPFS is the default persister. IndexedDB is re-exported for consumers who prefer it (broader browser support); pass it through the `createPersister` seam:

```ts
const { store } = await useOpfsStore({
  // wire onIgnoredError through: it is what tells the layer a load failed and saving must stay off
  createPersister: async (store, onIgnoredError) =>
    createIndexedDbPersister(store, 'notes-db', undefined, onIgnoredError),
})
```

The failed-load write guard, autosave and the whole `StoreApi` are identical for every backend. Caveats: gzip compression is an OPFS-persister feature (the IndexedDB persister stores plain JSON), and the ZIP backup tooling walks OPFS files only.

**Compression** — the storage layer compresses and decompresses by itself:

- Write side is flag-driven (`enabled`), with fflate options (`level` 0-9, `mem` 1-12).
- Read side magic-byte-sniffs (`0x1f 0x8b`), so gzip and plaintext files load regardless of the current flag — toggling just converts the file on the next autosave.
- A failed load leaves **every write path disarmed** — autosave never starts and `save()` throws — so an unreadable file is never overwritten from an empty store. This has to be explicit: TinyBase's `Persister.load()` does not throw on a bad read, it routes the error to `onIgnoredError` and resolves anyway, and `startAutoSave()` opens with an unconditional write. The layer watches that error hook and refuses to arm saving. `reload()` re-arms it once the file reads cleanly again, so a restored or re-imported file recovers without a page reload.
- `gzipCompress` / `gzipDecompress` / `isGzipped` in `composables/compression.ts` are reusable directly.
- All public types (`CompressionOptions`, `StoreOptions`, `StoreApi`, `OpfsEntry`, …) live in `app/utils/types.ts` — the single contract file.

Additional notes:

- Stores are cached per file: repeat calls share one store + persister.
- `createSyncAccessHandle` is not needed here, so the persister runs on the main thread — the worker stays for raw reads/writes, gzip and ZIP ops.
- TinyBase has no Vue bindings; `useTable` is the bridge (returns rows with `id` embedded).

## API

| Function                                     | Description                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| `opfsRead` / `opfsReadText` / `opfsReadJson` | Read raw bytes / text / JSON (`null` if missing); gzip'd files decompress transparently |
| `opfsWrite` / `opfsWriteJson`                | Write; `gzip: true` or `{ level, mem }` compresses with fflate `gzipSync`               |
| `opfsList`                                   | Sorted filenames in the OPFS root                                                       |
| `opfsDelete`                                 | Idempotent delete                                                                       |
| `opfsExportZip`                              | All files → zip `Blob`                                                                  |
| `opfsImportZip`                              | Unzip + write entries                                                                   |
| `isOpfsSupported`                            | Feature detection constant                                                              |

## Limits

- **Flat filenames only** (no nested directories) — add recursive mkdir in the worker when needed.
- **Whole-file writes** (truncate + write). Crash mid-write loses that save. Append-log + compaction is the upgrade path for large documents.
- No IndexedDB fallback — unsupported browsers get an explicit error state.
- gzip is flag-driven on write and magic-byte-sniffed on read — flag mismatches are impossible.

## Browser support

| Browser          | OPFS sync handles |
| ---------------- | ----------------- |
| Chrome/Edge 102+ | yes               |
| Firefox 111+     | yes               |
| Safari 16.4+     | yes               |
