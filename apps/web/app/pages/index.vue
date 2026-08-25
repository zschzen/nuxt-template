<script setup lang="ts">
import { Button } from '@template/ui/components/ui/button'
import { computed, onMounted, ref } from 'vue'

type Note = {
  id: string
  title: string
  body: string
  updatedAt: number
}

definePageMeta({ layout: 'default' })

const nuxtApp = useNuxtApp()
const pwa = computed(() => nuxtApp.$pwa)

const supported = isOpfsSupported
const online = useOnline()
const { persisted, quota, refresh, requestPersist } = useStorageStatus()

const entries = ref<{ name: string, size: number }[]>([])
const gzip = ref(true)
const lastStat = ref<{ raw: number, stored: number } | null>(null)
const selectedId = ref<string | null>(null)
const title = ref('')
const body = ref('')
const busy = ref(false)

const canSave = computed(() => !busy.value && title.value.trim().length > 0)
const totalStored = computed(() => entries.value.reduce((sum, e) => sum + e.size, 0))
const ratio = computed(() =>
  lastStat.value && lastStat.value.raw > 0
    ? Math.round((1 - lastStat.value.stored / lastStat.value.raw) * 100)
    : 0,
)

async function loadList() {
  const all = await opfsList()
  entries.value = all.filter(e => e.name.startsWith('note-') && e.name.endsWith('.json')).reverse()
}

function noteName(id: string) {
  return `note-${id}.json`
}

async function newNote() {
  selectedId.value = null
  title.value = ''
  body.value = ''
}

async function openNote(name: string) {
  let note: Note | null
  try {
    note = await opfsReadJson<Note>(name, { gzip: gzip.value })
  }
  catch {
    note = await opfsReadJson<Note>(name)
  }
  if (!note)
    return
  selectedId.value = note.id
  title.value = note.title
  body.value = note.body
}

async function saveNote() {
  if (!canSave.value)
    return
  busy.value = true
  try {
    const id = selectedId.value ?? crypto.randomUUID()
    const text = JSON.stringify({
      id,
      title: title.value.trim(),
      body: body.value,
      updatedAt: Date.now(),
    })
    const stored = await opfsWrite(noteName(id), text, { gzip: gzip.value })
    lastStat.value = { raw: new Blob([text]).size, stored }
    selectedId.value = id
    await loadList()
    await refresh()
  }
  finally {
    busy.value = false
  }
}

async function deleteNote(name: string) {
  await opfsDelete(name)
  if (selectedId.value && noteName(selectedId.value) === name)
    await newNote()
  await loadList()
  await refresh()
}

async function deleteSelected() {
  if (!selectedId.value)
    return
  await deleteNote(noteName(selectedId.value))
}

async function exportAll() {
  const blob = await opfsExportZip()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'local-first-backup.zip'
  a.click()
  URL.revokeObjectURL(url)
}

async function importArchive(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return
  busy.value = true
  try {
    await opfsImportZip(file)
    await loadList()
    await refresh()
  }
  finally {
    busy.value = false
    input.value = ''
  }
}

onMounted(async () => {
  if (!supported)
    return
  await loadList()
  await refresh()
})
</script>

<template>
  <div class="mx-auto p-4 flex flex-col gap-6 max-w-2xl min-h-screen">
    <header class="flex flex-col gap-2">
      <h1 class="text-2xl font-semibold">
        Local-first PWA Template
      </h1>
      <p class="text-muted-foreground">
        OPFS storage · offline-ready · your data stays on device
      </p>
      <div class="text-xs text-muted-foreground flex flex-wrap gap-2 items-center">
        <span :class="online ? 'text-green-600' : 'text-orange-500'">
          {{ online ? 'online' : 'offline' }}
        </span>
        <span>·</span>
        <span>persisted: {{ persisted === null ? 'unknown' : persisted ? 'yes' : 'no' }}</span>
        <span v-if="totalStored > 0">· {{ formatStorageBytes(totalStored) }} stored</span>
        <span v-if="quota > 0 && totalStored > 0">/ {{ formatStorageBytes(quota) }}</span>
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"
          target="_blank"
          rel="noopener"
          class="underline hover:text-foreground"
        >PWA docs</a>
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_API#origin_private_file_system"
          target="_blank"
          rel="noopener"
          class="underline hover:text-foreground"
        >OPFS docs</a>
        <a
          href="https://github.com/101arrowz/fflate"
          target="_blank"
          rel="noopener"
          class="underline hover:text-foreground"
        >fflate</a>
        <Button
          v-if="persisted === false"
          variant="outline"
          size="sm"
          @click="requestPersist"
        >
          Persist storage
        </Button>
        <Button
          v-if="pwa?.showInstallPrompt"
          size="sm"
          @click="pwa?.install()"
        >
          Install app
        </Button>
      </div>
    </header>

    <ClientOnly>
      <div v-if="!supported" class="text-sm text-red-700 p-4 border border-red-300 rounded-md bg-red-50 dark:text-red-300 dark:border-red-800 dark:bg-red-950">
        This browser doesn't support OPFS (needs Chrome/Edge 102+, Firefox 111+, or Safari 16.4+). Data features are disabled.
      </div>

      <section v-else class="flex flex-col gap-3">
        <div class="flex flex-wrap gap-2 items-center">
          <Button :disabled="busy" @click="saveNote">
            {{ selectedId ? 'Update' : 'Create' }}
          </Button>
          <Button
            variant="outline"
            :disabled="busy"
            @click="newNote"
          >
            New
          </Button>
          <Button
            variant="outline"
            :disabled="busy || !selectedId"
            @click="deleteSelected"
          >
            Delete
          </Button>
          <label class="text-sm text-muted-foreground inline-flex gap-1.5 cursor-pointer items-center">
            <input v-model="gzip" type="checkbox">
            gzip
          </label>
          <span class="grow" />
          <Button
            variant="outline"
            :disabled="busy"
            @click="exportAll"
          >
            Export ZIP
          </Button>
          <label class="inline-flex">
            <input
              type="file"
              accept=".zip"
              class="hidden"
              :disabled="busy"
              @change="importArchive"
            >
            <Button
              variant="outline"
              as-child
              :disabled="busy"
            >
              <span>Import ZIP</span>
            </Button>
          </label>
        </div>

        <div
          v-if="lastStat"
          class="text-xs text-muted-foreground p-2 border rounded-md bg-muted/40 flex flex-col gap-1"
        >
          <div class="flex flex-wrap gap-2 items-center">
            <span>{{ formatStorageBytes(lastStat.raw) }} raw</span>
            <span>→</span>
            <span class="text-foreground font-medium">{{ formatStorageBytes(lastStat.stored) }} on disk</span>
            <span
              class="font-medium px-1.5 py-0.5 rounded-full"
              :class="ratio >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'text-orange-600'"
            >
              {{ ratio >= 0 ? `${ratio}% smaller` : `${-ratio}% larger` }}
            </span>
          </div>
          <div class="rounded-full bg-muted h-1 overflow-hidden">
            <div
              class="bg-green-500 h-full transition-all dark:bg-green-400"
              :style="{ width: `${Math.max(0, Math.min(100, 100 - ratio))}%` }"
            />
          </div>
        </div>

        <input
          v-model="title"
          placeholder="Title"
          class="text-sm px-3 py-2 outline-none border rounded-md bg-transparent w-full focus-visible:ring-1 focus-visible:ring-ring"
        >
        <textarea
          v-model="body"
          rows="8"
          placeholder="Body — saved straight into the Origin Private File System"
          class="text-sm px-3 py-2 outline-none border rounded-md bg-transparent w-full focus-visible:ring-1 focus-visible:ring-ring"
        />
      </section>

      <section v-if="supported && entries.length > 0" class="flex flex-col gap-2">
        <h2 class="text-sm text-muted-foreground font-medium">
          Saved locally ({{ entries.length }})
        </h2>
        <ul class="border rounded-md flex flex-col divide-y">
          <li
            v-for="entry in entries"
            :key="entry.name"
            class="text-sm px-3 py-2 flex cursor-pointer items-center justify-between hover:bg-accent/50"
            :class="{ 'bg-accent': selectedId && noteName(selectedId) === entry.name }"
            @click="openNote(entry.name)"
          >
            <span>{{ entry.name.replace(/^note-/, '').replace(/\.json$/, '') }}</span>
            <span class="text-xs text-muted-foreground">{{ formatStorageBytes(entry.size) }}</span>
          </li>
        </ul>
      </section>

      <template #fallback>
        <p class="text-sm text-muted-foreground">
          Loading local storage…
        </p>
      </template>
    </ClientOnly>
  </div>
</template>
