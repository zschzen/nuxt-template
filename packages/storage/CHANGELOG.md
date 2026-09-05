# Changelog

All notable changes to `@template/storage` are documented here.

## 0.2.0 — 2026-09-05

### Fixed
- Data loss on an unreadable store file: `load()` doesn't throw on a bad read, and `startAutoSave()` wrote an empty store over it. Autosave and `save()` now gate on `onIgnoredError`; `reload()` re-arms once the file is readable again.
- Autoload now runs before autosave, matching TinyBase's order.

### Added
- `StoreApi.destroy()` — releases listeners and closes the broadcast channel.
- `test/store.test.ts` + `test/compression.test.ts` (vitest, `pnpm --filter @template/storage test:run`) — cover `createOpfsStore`/`useOpfsStore`/`useTable` lifecycle (load, autosave, failed-load gate, reload, destroy, cache) and the gzip helpers. OPFS/Worker paths untested (no happy-dom OPFS implementation).

### Changed
- `createPersister` seam takes `onIgnoredError` as a second argument.

## 0.1.0 — 2026-09-03

First release of the storage layer API.

### Added
- TinyBase `MergeableStore` persisted to OPFS with autosave: `createOpfsStore` / SSR-safe `useOpfsStore`
- Transparent gzip compression: flag-driven writes, magic-byte sniff reads (`0x1f 0x8b`), toggle converts on next autosave
- Data-loss guard: a failed load throws before autosave starts, so files are never overwritten from an empty store
- Public types contract in `app/utils/types.ts` (`CompressionOptions`, `StoreOptions`, `StoreApi`, `TableRow`, `OpfsEntry`, `OpfsWriteOptions`, `OpfsRequest`)
- IndexedDB backend: `createIndexedDbPersister` re-exported for use via the `createPersister` seam — identical lifecycle across backends
- Reactive table bridge for Vue: `useTable` with scoped listener cleanup
- Raw OPFS file API with worker offload: read/write/list/delete, ZIP export/import
- Compression policy accepts a value or getter (`StoreCompression`); runtime changes apply on the next autosave

### Notes
- gzip compression is an OPFS-persister feature; the IndexedDB persister stores plain JSON
- ZIP backup tooling walks OPFS files only
