# @template/storage

Local-first storage layer for Nuxt apps: OPFS-backed file tree running in a dedicated worker with synchronous access handles, plus optional gzip compression and ZIP import/export (via [fflate](https://github.com/101arrowz/fflate)).

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
// writes create any missing parent directories
await opfsWriteJson('notes/2024/note-1.json', { title: 'Hello', done: false })
await opfsReadJson<{ title: string }>('notes/2024/note-1.json')

// large payloads
await opfsWrite('blob.bin', bytes, { gzip: true })

// backup / migration
const blob = await opfsExportZip() // download it (zip keys are full paths)
await opfsImportZip(file) // restore from it
```

## File tree

Paths are slash-separated and always relative to the OPFS root; `''` is the root. There is no cached index — the OPFS directory handles are the tree, so a write from another tab is visible on the next read.

```ts
type OpfsNode
  = | { kind: 'file', name: string, path: string, size: number, lastModified: number }
    | { kind: 'directory', name: string, path: string, children?: OpfsNode[] }
```

`kind` is the discriminant, `name` is the basename and `path` is the full root-relative path. `children` is set by `opfsTree()` only — `opfsList()` returns directory nodes without walking them, which is what a lazily-expanding UI wants.

```ts
await opfsMkdir('notes/2024')
const top = await opfsList() // direct children, directories first
const all = await opfsTree() // whole subtree in one walk
const node = await opfsStat('notes/2024/note-1.json') // OpfsNode | null

await opfsMove('notes/2024/note-1.json', 'archive/note-1.json') // rename = move within a directory
await opfsCopy('notes', 'notes-backup')
await opfsDelete('archive', { recursive: true }) // without recursive, a non-empty directory throws
```

**Path validation is a trust boundary.** `..`, `.`, empty segments, leading slashes and NUL bytes are rejected with an `OpfsPathError`, which is what keeps a hostile ZIP entry from escaping the origin sandbox — `opfsImportZip` skips entries that fail it. The grammar lives in `app/utils/opfsPath.ts` and is shared by the worker and the store persister, so nested store files (`createOpfsStore({ file: 'data/notes.json' })`) work too.

Errors keep their name across the worker boundary, so callers can branch on `NotFoundError`, `InvalidModificationError` (non-empty directory) or `OpfsPathError` instead of matching message strings.

Storage status:

```ts
const { persisted, permission, usage, quota, refresh, requestPersist } = useStorageStatus()
await requestPersist() // opt out of eviction under storage pressure
```

`permission` mirrors `navigator.permissions.query({ name: 'persistent-storage' })` (`null` where the browser does not know that name — Safari throws on it), so `persisted === false` can be told apart from an outright refusal. Caller contract:

- **Chrome/Edge** never prompt: `persist()` resolves `false` when the site fails the engagement heuristic. That is normal and retryable once engagement grows.
- **Firefox** shows a real permission prompt — only call `requestPersist()` from a user gesture, and stop offering it once `permission === 'denied'`.

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
- All public types (`CompressionOptions`, `StoreOptions`, `StoreApi`, `OpfsNode`, …) live in `app/utils/types.ts` — the single contract file.

Additional notes:

- Stores are cached per file: repeat calls share one store + persister.
- `createSyncAccessHandle` is not needed here, so the persister runs on the main thread — the worker stays for raw reads/writes, gzip and ZIP ops.
- TinyBase has no Vue bindings; `useTable` is the bridge (returns rows with `id` embedded).

## API

| Function                                     | Description                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `opfsRead` / `opfsReadText` / `opfsReadJson` | Read raw bytes / text / JSON (`null` if missing); gzip'd files decompress transparently  |
| `opfsWrite` / `opfsWriteJson`                | Write; creates parent directories; `gzip: true` or `{ level, mem }` uses fflate `gzipSync` |
| `opfsList(path?)`                            | Direct children as `OpfsNode[]`, directories first                                       |
| `opfsTree(path?)`                            | Whole subtree; directory nodes carry `children`                                          |
| `opfsStat(path)` / `opfsExists(path)`        | Metadata for one entry / existence check                                                 |
| `opfsMkdir(path)`                            | Create a directory and any missing parents; idempotent                                   |
| `opfsDelete(path, { recursive })`            | Idempotent delete; a non-empty directory needs `recursive`                               |
| `opfsMove(from, to)` / `opfsCopy(from, to)`  | Move/rename or copy a file or a whole directory                                          |
| `opfsExportZip(path?)`                       | Subtree → zip `Blob`, keyed by full path                                                 |
| `opfsImportZip(file, path?)`                 | Unzip under `path`; entries failing path validation are skipped                          |
| `isOpfsSupported`                            | Feature detection constant                                                               |

## Limits

- **Whole-file writes** (truncate + write). Crash mid-write loses that save. Append-log + compaction is the upgrade path for large documents.
- **`move` is copy + delete**, and `copy` reads whole files into memory — `FileSystemFileHandle.move()` is Chrome-only and files-only, so one portable path is used instead. Streaming is the upgrade path for multi-MB files.
- **Empty directories do not survive a ZIP round-trip** — a zip carries files, so a directory with no files in it is not restored by `opfsImportZip`.
- No file watching: OPFS change notification (`FileSystemObserver`) is not broadly available, so callers re-read after their own mutations (the store uses a `BroadcastChannel` for the cross-tab case).
- No IndexedDB fallback — unsupported browsers get an explicit error state.
- gzip is flag-driven on write and magic-byte-sniffed on read — flag mismatches are impossible.

## Browser support

| Browser          | OPFS sync handles |
| ---------------- | ----------------- |
| Chrome/Edge 102+ | yes               |
| Firefox 111+     | yes               |
| Safari 16.4+     | yes               |
