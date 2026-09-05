<script setup lang="ts">
import { Button } from '@template/ui/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@template/ui/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@template/ui/components/ui/dropdown-menu'
import { Input } from '@template/ui/components/ui/input'
import { Separator } from '@template/ui/components/ui/separator'
import { TooltipProvider } from '@template/ui/components/ui/tooltip'
import { onMounted, ref } from 'vue'

definePageMeta({ layout: 'default' })

const supported = isOpfsSupported
const { refresh } = useStorageStatus()

const {
  tree,
  selectedPath,
  notePath,
  title,
  body,
  noteSize,
  busy,
  fileError,
  promptOpen,
  promptName,
  promptTarget,
  pendingNode,
  nodeDeleteOpen,
  canSave,
  noteCount,
  refreshTree,
  openNode,
  newNote,
  saveNote,
  askNewFolder,
  askRename,
  confirmPrompt,
  askRemoveNode,
  confirmRemoveNode,
  exportAll,
  importArchive,
  migrateLegacy,
} = useNoteFiles()

// storage-status numbers (persisted/quota) live outside the notes tree,
// so refresh them after every mutation that touches OPFS.
async function onSave() {
  await saveNote()
  await refresh()
}

async function onConfirmPrompt() {
  await confirmPrompt()
  await refresh()
}

async function onConfirmRemove() {
  await confirmRemoveNode()
  await refresh()
}

async function onImport(event: Event) {
  await importArchive(event)
  await refresh()
}

const archiveInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  if (!supported)
    return
  await migrateLegacy()
  await refresh()
  await refreshTree()
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
        <AppInfo @error="fileError = $event" />
      </div>
    </header>

    <Separator />

    <ClientOnly>
      <div v-if="!supported" class="text-sm text-red-700 p-4 border border-red-300 rounded-md bg-red-50 dark:text-red-300 dark:border-red-800 dark:bg-red-950">
        {{ $t('web.unsupported.opfs') }}
      </div>

      <template v-else>
        <div v-if="fileError" class="text-sm text-red-700 p-4 border border-red-300 rounded-md bg-red-50 flex gap-3 items-center justify-between dark:text-red-300 dark:border-red-800 dark:bg-red-950">
          <span class="font-mono">{{ fileError }}</span>
          <button
            type="button"
            class="text-red-700 shrink-0 dark:text-red-300"
            :aria-label="$t('web.error.dismiss')"
            @click="fileError = null"
          >
            <span class="i-lucide-x shrink-0 size-3.5" />
          </button>
        </div>

        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted-foreground tracking-[0.12em] font-medium uppercase">{{ $t('web.editor.label') }}</span>
            <Button :disabled="!canSave" @click="onSave">
              <span class="i-lucide-save shrink-0 size-4" />
              {{ $t('web.editor.save') }}
            </Button>
          </div>
          <input
            v-model="title"
            :placeholder="$t('web.editor.titlePlaceholder')"
            class="text-[30px] text-foreground leading-[1.2] font-semibold font-serif pb-1.5 pt-0.5 outline-none border-b border-border bg-transparent w-full placeholder:text-muted-foreground/60"
            @keydown.ctrl.s.prevent="onSave"
            @keydown.meta.s.prevent="onSave"
          >
          <div v-if="notePath" class="flex gap-[7px] items-center">
            <span class="rounded-full bg-green-500 size-1.5" />
            <span class="text-xs text-muted-foreground font-mono">
              {{ noteSize !== null ? formatStorageBytes(noteSize) : '' }} · {{ $t('web.editor.autosaves') }}
            </span>
          </div>
          <textarea
            v-model="body"
            :placeholder="$t('web.editor.bodyPlaceholder')"
            class="text-base text-foreground leading-[1.7] font-serif px-[22px] py-5 outline-none border border-border rounded-sm bg-background h-[260px] w-full resize-none placeholder:text-muted-foreground/60"
          />
        </section>

        <section class="flex flex-col gap-2">
          <TooltipProvider :delay-duration="300">
            <div class="p-1 border border-border rounded-sm max-h-52 [scrollbar-width:thin] overflow-y-auto">
              <input
                ref="archiveInput"
                type="file"
                accept=".zip"
                class="hidden"
                :disabled="busy"
                @change="onImport"
              >
              <FileTree
                :nodes="tree"
                :selected="selectedPath"
                :title="$t('web.notes.title')"
                :count="noteCount"
                @select="openNode"
                @rename="askRename"
                @remove="askRemoveNode"
                @create-folder="askNewFolder"
                @create-file="newNote"
                @refresh="refreshTree"
              >
                <template #menu>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button
                        variant="ghost"
                        class="text-muted-foreground p-0 size-6 hover:text-foreground"
                        :aria-label="$t('web.notes.moreActions')"
                        :title="$t('web.notes.moreActions')"
                      >
                        <span class="i-lucide-ellipsis shrink-0 size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem :disabled="busy" @select="archiveInput?.click()">
                        <span class="i-lucide-upload shrink-0 size-4" />
                        {{ $t('web.notes.import') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem :disabled="busy" @select="exportAll">
                        <span class="i-lucide-download shrink-0 size-4" />
                        {{ $t('web.notes.export') }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </template>
              </FileTree>
            </div>
          </TooltipProvider>
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
          </div>
        </footer>
      </template>

      <template #fallback>
        <p class="text-sm text-muted-foreground">
          {{ $t('web.footer.loading') }}
        </p>
      </template>
    </ClientOnly>

    <Dialog :open="promptOpen" @update:open="promptOpen = $event">
      <DialogContent
        hide-close
        overlay-class="bg-black/35"
        class="p-5 rounded-md gap-3 max-w-[360px] shadow-[0_12px_28px_rgba(0,0,0,0.15)] sm:max-w-[360px]"
      >
        <DialogTitle class="text-base tracking-normal font-semibold">
          {{ promptTarget.mode === 'rename' ? $t('web.notes.renameTitle') : $t('web.notes.newFolderTitle') }}
        </DialogTitle>
        <Input
          v-model="promptName"
          :placeholder="$t('web.notes.namePlaceholder')"
          @keydown.enter.prevent="onConfirmPrompt"
        />
        <DialogFooter class="gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="promptOpen = false"
          >
            {{ $t('common.cancel') }}
          </Button>
          <Button
            size="sm"
            :disabled="!promptName.trim()"
            @click="onConfirmPrompt"
          >
            {{ $t('common.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="nodeDeleteOpen" @update:open="nodeDeleteOpen = $event">
      <DialogContent
        hide-close
        overlay-class="bg-black/35"
        class="p-5 rounded-md gap-3 max-w-[360px] shadow-[0_12px_28px_rgba(0,0,0,0.15)] sm:max-w-[360px]"
      >
        <DialogTitle class="text-base tracking-normal font-semibold">
          {{ $t('web.notes.deleteTitle') }}
        </DialogTitle>
        <DialogDescription class="text-sm leading-[1.5]">
          {{ pendingNode?.kind === 'directory'
            ? $t('web.notes.deleteFolderBody', { name: pendingNode?.name })
            : $t('web.notes.deleteFileBody', { name: pendingNode ? noteDisplayName(pendingNode.name) : '' }) }}
        </DialogDescription>
        <DialogFooter class="gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="nodeDeleteOpen = false"
          >
            {{ $t('common.cancel') }}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            @click="onConfirmRemove"
          >
            {{ $t('common.delete') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
