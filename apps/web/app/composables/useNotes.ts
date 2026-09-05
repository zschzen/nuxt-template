import type { Store } from 'tinybase'
import type { Ref } from 'vue'

export type Note = {
  id: string
  title: string
  body: string
}

/**
 * Domain wiring for the notes app: OPFS-backed store + reactive `notes` table.
 * Rows store title and body only; the storage layer always compresses.
 * SSR-safe by construction — `useOpfsStore` guards the client-only init.
 */
export function useNotes(): {
  store: Ref<Store | null>
  notes: Ref<Array<Record<string, unknown> & { id: string }>>
  error: Ref<Error | null>
  ready: Promise<StoreApi | null>
  reload: () => Promise<void>
} {
  const { store, error, ready } = useOpfsStore({
    file: 'notes.json',
    compression: { enabled: true },
  })
  const notes = useTable(() => store.value, 'notes')

  return {
    store,
    notes,
    error,
    ready,
    reload: async () => {
      const api = await ready
      await api?.reload()
    },
  }
}
