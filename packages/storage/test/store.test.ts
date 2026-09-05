import { createSessionPersister } from 'tinybase/persisters/persister-browser'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOpfsStore, useOpfsStore, useTable } from '../app/composables/useStore'

const HEALTHY = '[{"pets":{"fido":{"species":"dog"}}},{}]'
const CORRUPT = '{"pets":'

function make(file: string) {
  return createOpfsStore({
    file,
    createPersister: async (store, onIgnoredError) =>
      createSessionPersister(store, file, onIgnoredError),
  })
}

beforeEach(() => sessionStorage.clear())

describe('createOpfsStore', () => {
  it('loads and autosaves a healthy file', async () => {
    sessionStorage.setItem('healthy.json', HEALTHY)
    const api = await make('healthy.json')

    expect(api.error.value).toBeNull()
    expect(api.store.getCell('pets', 'fido', 'species')).toBe('dog')

    api.store.setCell('pets', 'fido', 'species', 'cat')
    await vi.waitFor(() => expect(sessionStorage.getItem('healthy.json')).toContain('cat'))
    await api.destroy()
  })

  it('refuses to save over an unreadable file', async () => {
    sessionStorage.setItem('gate.json', CORRUPT)
    const api = await make('gate.json')

    expect(api.error.value).not.toBeNull()
    await expect(api.save()).rejects.toThrow('Refusing to save over unreadable gate.json')

    api.store.setCell('pets', 'fido', 'species', 'cat') // must not trigger autosave
    expect(sessionStorage.getItem('gate.json')).toBe(CORRUPT)
    await api.destroy()
  })

  it('reload() re-arms saving once the file reads cleanly again', async () => {
    sessionStorage.setItem('reload.json', CORRUPT)
    const api = await make('reload.json')
    await expect(api.save()).rejects.toThrow()

    sessionStorage.setItem('reload.json', HEALTHY) // user restores from a ZIP export
    await api.reload()
    await expect(api.save()).resolves.not.toThrow()
    await api.destroy()
  })

  it('caches by file; destroy() releases the cache entry', async () => {
    sessionStorage.setItem('cache.json', HEALTHY)
    const first = await make('cache.json')
    const second = await make('cache.json')
    expect(second.store).toBe(first.store)

    await first.destroy()
    const third = await make('cache.json')
    expect(third.store).not.toBe(first.store)
    await third.destroy()
  })
})

describe('useOpfsStore + useTable', () => {
  it('resolves a reactive store and tracks table rows', async () => {
    sessionStorage.setItem('table.json', HEALTHY)
    const { store, ready } = useOpfsStore({
      file: 'table.json',
      createPersister: async (s, onIgnoredError) => createSessionPersister(s, 'table.json', onIgnoredError),
    })
    const api = await ready
    expect(store.value).not.toBeNull()

    const rows = useTable(() => store.value, 'notes')
    expect(rows.value).toEqual([])

    store.value!.setRow('notes', '1', { title: 'a' })
    expect(rows.value).toEqual([{ id: '1', title: 'a' }])

    await api!.destroy()
  })
})
