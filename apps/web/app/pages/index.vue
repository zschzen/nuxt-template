<script setup lang="ts">
import { Button } from '@template/ui/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@template/ui/components/ui/dialog'
import { Separator } from '@template/ui/components/ui/separator'
import { computed, onMounted, ref } from 'vue'

type Entry = {
  id: string
  title: string
  body: string
  size: number
}

definePageMeta({ layout: 'default' })

const pwa = usePWA()
const { t } = useI18n()

const supported = isOpfsSupported
const online = useOnline()
const { persisted, refresh, requestPersist } = useStorageStatus()

const { store, notes, error, ready, reload } = useNotes()

const entries = computed<Entry[]>(() =>
  notes.value
    .map(row => ({
      id: row.id,
      title: String(row.title ?? ''),
      body: String(row.body ?? ''),
      size: JSON.stringify(row).length,
    })),
)
const selectedId = ref<string | null>(null)
const title = ref('')
const body = ref('')
const busy = ref(false)
const pendingDelete = ref<Entry | null>(null)
const deleteOpen = ref(false)

const canSave = computed(() => !busy.value && title.value.trim().length > 0)
const selectedEntry = computed(() =>
  entries.value.find(entry => entry.id === selectedId.value) ?? null,
)

const statusLabel = computed(() =>
  `${pwa?.isPWAInstalled ? t('web.status.installed') : t('web.status.notInstalled')} · ${online.value ? t('web.status.online') : t('web.status.offline')}`,
)

function newNote() {
  selectedId.value = null
  title.value = ''
  body.value = ''
}

function openNote(id: string) {
  const entry = entries.value.find(entry => entry.id === id)
  if (!entry)
    return
  selectedId.value = id
  title.value = entry.title
  body.value = entry.body
}

function saveNote() {
  if (!canSave.value)
    return
  if (!store.value) {
    error.value = new Error('Notes store is not ready')
    return
  }
  const id = selectedId.value ?? crypto.randomUUID()
  store.value.setRow('notes', id, {
    title: title.value.trim(),
    body: body.value,
  })
  selectedId.value = id
}

async function confirmDelete() {
  if (!pendingDelete.value)
    return
  store.value?.delRow('notes', pendingDelete.value.id)
  if (selectedId.value === pendingDelete.value.id)
    await newNote()
  await refresh()
  deleteOpen.value = false
  pendingDelete.value = null
}

function askDelete(entry: Entry) {
  pendingDelete.value = {
    ...entry,
    title: entry.id === selectedId.value ? (title.value.trim() || entry.title) : entry.title,
  }
  deleteOpen.value = true
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
    await reload()
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
  const api = await ready
  if (api)
    await refresh()
})
</script>

<template>
  <div class="font-sans mx-auto p-8 flex flex-col gap-5 max-w-[672px] min-h-screen">
    <header class="flex items-center justify-between">
      <h1 class="text-sm text-foreground font-semibold">
        {{ $t('web.header.title') }}
      </h1>
      <div class="flex gap-2.5 items-center">
        <LocaleSwitcher />
        <div class="flex gap-1.5 items-center">
          <span class="rounded-full size-1.5" :class="online ? 'bg-green-500' : 'bg-orange-400'" />
          <span class="text-[11px] text-muted-foreground">{{ statusLabel }}</span>
        </div>
      </div>
    </header>

    <Separator />

    <ClientOnly>
      <div v-if="!supported" class="text-sm text-red-700 p-4 border border-red-300 rounded-md bg-red-50 dark:text-red-300 dark:border-red-800 dark:bg-red-950">
        {{ $t('web.unsupported.opfs') }}
      </div>

      <template v-else>
        <div v-if="error" class="text-sm text-red-700 p-4 border border-red-300 rounded-md bg-red-50 flex gap-3 items-center justify-between dark:text-red-300 dark:border-red-800 dark:bg-red-950">
          <span>{{ $t('web.error.saveFailed') }}</span>
          <button
            type="button"
            class="text-red-700 shrink-0 dark:text-red-300"
            :aria-label="$t('web.error.dismiss')"
            @click="error = null"
          >
            <span class="i-lucide-x shrink-0 size-3.5" />
          </button>
        </div>

        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted-foreground tracking-[0.12em] font-medium uppercase">{{ $t('web.editor.label') }}</span>
            <Button :disabled="busy" @click="saveNote">
              <span class="i-lucide-save shrink-0 size-4" />
              {{ $t('web.editor.save') }}
            </Button>
          </div>
          <input
            v-model="title"
            :placeholder="$t('web.editor.titlePlaceholder')"
            class="text-[30px] text-foreground leading-[1.2] font-semibold font-serif pb-1.5 pt-0.5 outline-none border-b border-border bg-transparent w-full placeholder:text-muted-foreground/60"
            @keydown.ctrl.s.prevent="saveNote"
            @keydown.meta.s.prevent="saveNote"
          >
          <div v-if="selectedEntry" class="flex gap-[7px] items-center">
            <span class="rounded-full bg-green-500 size-1.5" />
            <span class="text-xs text-muted-foreground font-mono">
              {{ formatStorageBytes(selectedEntry.size) }} · {{ $t('web.editor.autosaves') }}
            </span>
          </div>
          <textarea
            v-model="body"
            :placeholder="$t('web.editor.bodyPlaceholder')"
            class="text-base text-foreground leading-[1.7] font-serif px-[22px] py-5 outline-none border border-border rounded-sm bg-background h-[260px] w-full resize-none placeholder:text-muted-foreground/60"
          />
        </section>

        <section class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="flex gap-2 items-center">
              <span class="text-[11px] text-muted-foreground tracking-[1px] font-medium uppercase">{{ $t('web.list.title') }}</span>
              <span class="text-xs text-muted-foreground font-mono">{{ entries.length }}</span>
            </div>
            <div class="flex gap-2 items-center">
              <Button :disabled="busy" @click="newNote">
                <span class="i-lucide-plus shrink-0 size-4" />
                {{ $t('web.list.new') }}
              </Button>
              <label class="inline-flex cursor-pointer">
                <input
                  type="file"
                  accept=".zip"
                  class="hidden"
                  :disabled="busy"
                  @change="importArchive"
                >
                <Button
                  variant="outline"
                  :disabled="busy"
                >
                  <span class="i-lucide-upload shrink-0 size-4" />
                  {{ $t('web.list.import') }}
                </Button>
              </label>
              <Button
                variant="outline"
                :disabled="busy"
                @click="exportAll"
              >
                <span class="i-lucide-download shrink-0 size-4" />
                {{ $t('web.list.export') }}
              </Button>
            </div>
          </div>
          <ul class="flex flex-col h-40 [scrollbar-width:thin] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground [&::-webkit-scrollbar-track]:bg-border [&::-webkit-scrollbar]:w-1">
            <li
              v-for="entry in entries"
              :key="entry.id"
              class="group py-2.5 pl-0 pr-3 border-b border-border flex cursor-pointer items-center justify-between"
              @click="openNote(entry.id)"
            >
              <div class="flex gap-2 items-center">
                <span
                  v-if="entry.id === selectedId"
                  class="rounded-full bg-green-500 size-1.5"
                />
                <span
                  class="text-[15px] leading-[1.2] font-serif"
                  :class="entry.id === selectedId ? 'font-semibold text-foreground' : 'text-muted-foreground'"
                >{{ entry.title }}</span>
              </div>
              <div class="flex gap-2.5 items-center">
                <span class="text-[11px] text-muted-foreground font-mono">{{ formatStorageBytes(entry.size) }}</span>
                <Button
                  variant="ghost"
                  :aria-label="$t('web.list.deleteNote')"
                  class="text-muted-foreground p-0 size-4 hover:text-destructive"
                  @click.stop="askDelete(entry)"
                >
                  <span class="i-lucide-x shrink-0 size-3" />
                </Button>
              </div>
            </li>
          </ul>
        </section>

        <footer class="mt-auto pt-3 border-t border-border flex items-center justify-between">
          <span class="text-[11px] text-muted-foreground">{{ $t('web.footer.localOnly') }}</span>
          <div class="flex flex-wrap gap-2 items-center">
            <Button
              variant="link"
              as-child
              class="text-[11px] p-0 h-auto"
            >
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"
                target="_blank"
                rel="noopener"
              >PWA docs</a>
            </Button>
            <span class="text-[11px] text-muted-foreground">·</span>
            <Button
              variant="link"
              as-child
              class="text-[11px] p-0 h-auto"
            >
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_API#origin_private_file_system"
                target="_blank"
                rel="noopener"
              >OPFS docs</a>
            </Button>
            <span class="text-[11px] text-muted-foreground">·</span>
            <Button
              variant="link"
              as-child
              class="text-[11px] p-0 h-auto"
            >
              <a
                href="https://tinybase.org"
                target="_blank"
                rel="noopener"
              >TinyBase</a>
            </Button>
            <template v-if="persisted === false">
              <span class="text-[11px] text-muted-foreground">·</span>
              <Button
                variant="link"
                class="text-[11px] p-0 h-auto"
                @click="requestPersist"
              >
                {{ $t('web.footer.persist') }}
              </Button>
            </template>
            <template v-if="pwa?.showInstallPrompt">
              <span class="text-[11px] text-muted-foreground">·</span>
              <Button
                variant="link"
                class="text-[11px] p-0 h-auto"
                @click="pwa?.install()"
              >
                {{ $t('web.footer.install') }}
              </Button>
            </template>
          </div>
        </footer>
      </template>

      <template #fallback>
        <p class="text-sm text-muted-foreground">
          {{ $t('web.footer.loading') }}
        </p>
      </template>
    </ClientOnly>

    <Dialog :open="deleteOpen" @update:open="deleteOpen = $event">
      <DialogContent
        hide-close
        overlay-class="bg-black/35"
        class="p-5 rounded-md gap-3 max-w-[360px] shadow-[0_12px_28px_rgba(0,0,0,0.15)] sm:max-w-[360px]"
      >
        <DialogTitle class="text-base tracking-normal font-semibold">
          {{ $t('web.dialog.deleteTitle') }}
        </DialogTitle>
        <DialogDescription class="text-sm leading-[1.5]">
          {{ $t('web.dialog.deleteBody', { title: pendingDelete?.title }) }}
        </DialogDescription>
        <DialogFooter class="gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="deleteOpen = false"
          >
            {{ $t('common.cancel') }}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            @click="confirmDelete"
          >
            {{ $t('common.delete') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
