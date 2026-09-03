/**
 * IndexedDB persister, re-exported so consumers never depend on tinybase subpaths.
 * Any Persister<Persists> satisfies StoreOptions.createPersister — the load-before-
 * autosave lifecycle and StoreApi are identical across backends. No gzip on this
 * backend (see README "Backends").
 */
export { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db'
