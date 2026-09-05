import { describe, expect, it } from 'vitest'
import { gzipCompress, gzipDecompress, isGzipped } from '../app/composables/compression'

describe('compression', () => {
  it('round-trips bytes through gzip', () => {
    const bytes = new TextEncoder().encode('hello world')
    const compressed = gzipCompress(bytes)
    expect(gzipDecompress(compressed)).toEqual(bytes)
  })

  it('sniffs gzip magic bytes', () => {
    const bytes = new TextEncoder().encode('hello world')
    expect(isGzipped(bytes)).toBe(false)
    expect(isGzipped(gzipCompress(bytes))).toBe(true)
  })
})
