import type { Ref } from 'vue'
import { ref } from 'vue'

export type StorageStatus = {
  persisted: Ref<boolean | null>
  permission: Ref<PermissionState | null>
  usage: Ref<number>
  quota: Ref<number>
  refresh: () => Promise<void>
  requestPersist: () => Promise<boolean>
}

function formatBytes(bytes: number): string {
  if (bytes === 0)
    return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)

  return `${Number.parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}` as string
}

// ponytail: single shared state — storage status is global by nature
const persisted = ref<boolean | null>(null)
// null = unknown: no Permissions API, or the browser does not know this permission name (Safari throws)
const permission = ref<PermissionState | null>(null)
const usage = ref(0)
const quota = ref(0)

export function useStorageStatus(): StorageStatus {
  async function refresh() {
    if (typeof window === 'undefined' || !navigator.storage?.estimate)
      return

    const { usage: u = 0, quota: q = 0 } = await navigator.storage.estimate()

    usage.value = u
    quota.value = q
    if (navigator.storage.persisted)
      persisted.value = await navigator.storage.persisted()

    try {
      permission.value = (await navigator.permissions?.query({ name: 'persistent-storage' as PermissionName }))?.state ?? null
    }
    catch {
      permission.value = null
    }
  }

  async function requestPersist() {
    if (typeof window === 'undefined' || !navigator.storage?.persist)
      return false

    const granted = await navigator.storage.persist()
    persisted.value = granted
    permission.value = granted ? 'granted' : 'denied'

    return granted
  }

  return { persisted, permission, usage, quota, refresh, requestPersist }
}

export { formatBytes as formatStorageBytes }
