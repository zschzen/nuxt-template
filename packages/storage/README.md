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

## API

| Function                                     | Description                                        |
| -------------------------------------------- | -------------------------------------------------- |
| `opfsRead` / `opfsReadText` / `opfsReadJson` | Read raw bytes / text / JSON (`null` if missing)   |
| `opfsWrite` / `opfsWriteJson`                | Write; `{ gzip: true }` compresses with `gzipSync` |
| `opfsList`                                   | Sorted filenames in the OPFS root                  |
| `opfsDelete`                                 | Idempotent delete                                  |
| `opfsExportZip`                              | All files → zip `Blob`                             |
| `opfsImportZip`                              | Unzip + write entries                              |
| `isOpfsSupported`                            | Feature detection constant                         |

## Limits

- **Flat filenames only** (no nested directories) — add recursive mkdir in the worker when needed.
- **Whole-file writes** (truncate + write). Crash mid-write loses that save. Append-log + compaction is the upgrade path for large documents.
- No IndexedDB fallback — unsupported browsers get an explicit error state.
- gzip flag is per-call and symmetric (read must pass what write passed).

## Browser support

| Browser          | OPFS sync handles |
| ---------------- | ----------------- |
| Chrome/Edge 102+ | yes               |
| Firefox 111+     | yes               |
| Safari 16.4+     | yes               |
