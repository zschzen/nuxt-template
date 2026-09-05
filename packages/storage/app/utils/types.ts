import type { Store } from 'tinybase'
import type { Persister, Persists } from 'tinybase/persisters'
import type { Ref } from 'vue'

/**
 * Public contract of @template/storage. Pure types — no runtime.
 * Lives in app/utils/ because Nuxt auto-imports scan composables/ and utils/ only;
 * an app/types/ directory would not be scanned and these would stop resolving.
 */

export type CompressionOptions = {
  /** Master switch for store persistence. Raw-file API uses the boolean `gzip` flag instead. */
  enabled?: boolean
  /** fflate gzipSync level, 0-9. Default 6. */
  level?: number
  /** fflate mem, 1-12. Default 9. */
  mem?: number
}

export type StoreCompression = CompressionOptions | (() => CompressionOptions)

export type StoreOptions = {
  /** OPFS file backing the store. Default: 'store.json'. */
  file?: string
  /** Compression policy: value or getter. Pass a getter to change at runtime; applies on the next autosave. Default: disabled. */
  compression?: StoreCompression
  /**
   * Backend seam. Default: gzip-aware OpfsPersister on `file`. Compression does not apply to custom persisters.
   * `onIgnoredError` must be wired into the backend's own error hook — TinyBase's `load()` swallows read
   * failures, and this callback is what tells the store layer not to autosave over an unreadable file.
   */
  createPersister?: (store: Store, onIgnoredError: (error: unknown) => void) => Promise<Persister<Persists>>
}

export type StoreApi = {
  store: Store
  error: Ref<Error | null>
  /** Force a write. Throws instead of overwriting a file that failed to load. */
  save: () => Promise<void>
  /** Re-read from the backend. Resumes autosave if the file has become readable again. */
  reload: () => Promise<void>
  /** Release listeners, the broadcast channel and the shared-store cache entry. */
  destroy: () => Promise<void>
}

export type TableRow = Record<string, unknown> & { id: string }

/**
 * A node in the OPFS tree. `kind` is the discriminant: files carry size/lastModified,
 * directories carry children when they were walked recursively.
 */
export type OpfsFileNode = {
  kind: 'file'
  /** Basename, e.g. 'a.json'. */
  name: string
  /** Full path from the OPFS root, e.g. 'notes/2024/a.json'. Never leading-slashed. */
  path: string
  size: number
  lastModified: number
}

export type OpfsDirectoryNode = {
  kind: 'directory'
  name: string
  path: string
  /** Set by `opfsTree()` only. Undefined from `opfsList()` — children were not walked. */
  children?: OpfsNode[]
}

export type OpfsNode = OpfsFileNode | OpfsDirectoryNode

export type OpfsDeleteOptions = {
  /** Delete a directory with contents. Default false: a non-empty directory throws instead. */
  recursive?: boolean
}

export type OpfsWriteOptions = {
  /** Compress on write: `true` for defaults, or fflate `{ level, mem }`. Reads always decompress transparently. */
  gzip?: boolean | Pick<CompressionOptions, 'level' | 'mem'>
}

/** Worker message protocol — shared by useOpfs (rpc) and opfs.worker. Paths are root-relative. */
export type OpfsRequest
  = | { id: number, op: 'read', path: string }
    | { id: number, op: 'write', path: string, data: string | Uint8Array, gzip?: OpfsWriteOptions['gzip'] }
    | { id: number, op: 'list', path: string, recursive: boolean }
    | { id: number, op: 'stat', path: string }
    | { id: number, op: 'mkdir', path: string }
    | { id: number, op: 'remove', path: string, recursive: boolean }
    | { id: number, op: 'move', from: string, to: string }
    | { id: number, op: 'copy', from: string, to: string }
    | { id: number, op: 'exportZip', path: string }
    | { id: number, op: 'importZip', path: string, data: Uint8Array }

/** Worker response. `name` carries the original error name (NotFoundError, OpfsPathError, …). */
export type OpfsResponse
  = | { id: number, ok: true, result?: unknown }
    | { id: number, ok: false, error: string, name?: string }
