import type { GzipOptions } from 'fflate'
import type { CompressionOptions } from '../utils/types'
import { gunzipSync, gzipSync } from 'fflate'

export function isGzipped(bytes: Uint8Array): boolean {
  return bytes.length > 2 && bytes[0] === 0x1F && bytes[1] === 0x8B
}

export function gzipCompress(bytes: Uint8Array, opts: Pick<CompressionOptions, 'level' | 'mem'> = {}): Uint8Array<ArrayBuffer> {
  // boundary cast: options come from consumer config/UI (1-9), validated upstream
  return gzipSync(bytes, opts as GzipOptions)
}

export function gzipDecompress(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return gunzipSync(bytes)
}

// ponytail: sync gzip on the calling thread — sub-ms for template-scale stores;
// hand off to opfs.worker if stores grow past a few MB
