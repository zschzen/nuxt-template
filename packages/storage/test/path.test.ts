import { describe, expect, it } from 'vitest'
import {
  opfsBasename,
  opfsDirname,
  opfsJoinPath,
  opfsNormalizePath,
  opfsPathSegments,
} from '../app/utils/opfsPath'

describe('path grammar', () => {
  it('splits and canonicalises', () => {
    expect(opfsPathSegments('')).toEqual([])
    expect(opfsPathSegments('/')).toEqual([])
    expect(opfsPathSegments('a.json')).toEqual(['a.json'])
    expect(opfsPathSegments('notes/2024/a.json')).toEqual(['notes', '2024', 'a.json'])
    expect(opfsPathSegments('notes/2024/')).toEqual(['notes', '2024']) // directory form
    expect(opfsNormalizePath('notes/2024/')).toBe('notes/2024')
  })

  it('joins, skipping empty parts so root-relative joins work', () => {
    expect(opfsJoinPath('', 'a.json')).toBe('a.json')
    expect(opfsJoinPath('notes', '2024', 'a.json')).toBe('notes/2024/a.json')
    expect(opfsJoinPath('notes', '')).toBe('notes')
  })

  it('reports basename and dirname', () => {
    expect(opfsBasename('notes/2024/a.json')).toBe('a.json')
    expect(opfsDirname('notes/2024/a.json')).toBe('notes/2024')
    expect(opfsDirname('a.json')).toBe('')
    expect(opfsBasename('')).toBe('')
  })
})

describe('path validation (trust boundary)', () => {
  // these are the shapes a malicious ZIP entry would use to escape the sandbox
  it.each([
    ['../escape', 'parent traversal'],
    ['a/../b', 'embedded traversal'],
    ['a/./b', 'dot segment'],
    ['/absolute', 'absolute path'],
    ['a//b', 'empty segment'],
    ['a/\0b', 'NUL byte'],
  ])('rejects %s (%s)', (path) => {
    expect(() => opfsPathSegments(path)).toThrow(/Invalid OPFS path/)
    expect(() => opfsPathSegments(path)).toThrowError(
      expect.objectContaining({ name: 'OpfsPathError' }),
    )
  })

  it('rejects unsafe parts through join too', () => {
    expect(() => opfsJoinPath('notes', '../../etc')).toThrow(/Invalid OPFS path/)
  })
})
