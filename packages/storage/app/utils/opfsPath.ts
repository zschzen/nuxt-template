/**
 * Path grammar for the OPFS tree, shared by the worker and the main-thread persister.
 * Every export is `opfs`-prefixed: this file sits in app/utils/, so Nuxt auto-imports
 * it into consumer apps and unprefixed names like `basename` would collide.
 *
 * Paths are slash-separated and always relative to the OPFS root. '' is the root.
 * Validation is a trust boundary — it is what keeps ZIP entry names from escaping
 * the sandbox — so it throws instead of silently sanitising.
 */

/** Thrown for any path the tree refuses: traversal, absolute, empty or NUL-bearing segments. */
function pathError(path: string, reason: string): Error {
  const error = new Error(`Invalid OPFS path ${JSON.stringify(path)}: ${reason}`)
  error.name = 'OpfsPathError'
  return error
}

/** Split and validate. Returns [] for the root. Throws OpfsPathError on anything unsafe. */
export function opfsPathSegments(path: string): string[] {
  if (path === '' || path === '/')
    return []
  if (path.startsWith('/'))
    throw pathError(path, 'must be relative to the OPFS root')

  const parts = path.split('/')
  // a single trailing slash is legal (directory form: 'a/b/'), anything else empty is not
  if (parts[parts.length - 1] === '')
    parts.pop()

  for (const segment of parts) {
    if (segment === '')
      throw pathError(path, 'empty segment')
    if (segment === '.' || segment === '..')
      throw pathError(path, 'relative segments are not allowed')
    if (segment.includes('\0'))
      throw pathError(path, 'NUL in segment')
  }

  return parts
}

/** Canonical form of a path: validated segments rejoined. '' for the root. */
export function opfsNormalizePath(path: string): string {
  return opfsPathSegments(path).join('/')
}

/** Join and validate. Empty parts are skipped, so joining onto the root works. */
export function opfsJoinPath(...parts: string[]): string {
  return opfsNormalizePath(parts.filter(Boolean).join('/'))
}

/** Last segment of a path. '' for the root. */
export function opfsBasename(path: string): string {
  return opfsPathSegments(path).pop() ?? ''
}

/** Everything but the last segment. '' when the path names a root-level entry. */
export function opfsDirname(path: string): string {
  return opfsPathSegments(path).slice(0, -1).join('/')
}

/**
 * Walk directory handles segment by segment. With `create`, missing directories are made;
 * without it, a missing segment resolves to null rather than throwing.
 */
export async function opfsResolveDirectory(
  root: FileSystemDirectoryHandle,
  segments: string[],
  create: boolean,
): Promise<FileSystemDirectoryHandle | null> {
  let dir = root
  for (const segment of segments) {
    try {
      dir = await dir.getDirectoryHandle(segment, { create })
    }
    catch {
      return null
    }
  }
  return dir
}

/**
 * Resolve a file handle, creating the whole parent chain when `create` is set.
 * Returns null when the file (or a parent) is missing and `create` is false.
 */
export async function opfsResolveFile(
  root: FileSystemDirectoryHandle,
  path: string,
  options: { create?: boolean } = {},
): Promise<FileSystemFileHandle | null> {
  const segments = opfsPathSegments(path)
  const name = segments.pop()
  if (!name)
    throw pathError(path, 'a file path needs at least one segment')

  const create = options.create ?? false
  const dir = await opfsResolveDirectory(root, segments, create)
  if (!dir)
    return null

  try {
    return await dir.getFileHandle(name, { create })
  }
  catch {
    return null
  }
}
