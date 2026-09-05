<script setup lang="ts">
import { Button } from '@template/ui/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@template/ui/components/ui/tooltip'
import { computed, ref } from 'vue'

const props = defineProps<{
  nodes: OpfsNode[]
  selected?: string | null
  depth?: number
  title?: string
  count?: number
}>()

const emit = defineEmits<{
  select: [node: OpfsNode]
  rename: [node: OpfsNode]
  remove: [node: OpfsNode]
  createFolder: [node: OpfsNode | null]
  createFile: [node: OpfsNode | null]
  refresh: []
}>()

const isRoot = computed(() => (props.depth ?? 0) === 0)

function displayName(node: OpfsNode): string {
  return node.kind === 'file' && node.name.endsWith('.md')
    ? node.name.slice(0, -3)
    : node.name
}

// expansion is view state, not data — the page owns the tree and reloads it after mutations
const collapsed = ref(new Set<string>())

function toggle(node: OpfsNode) {
  if (collapsed.value.has(node.path))
    collapsed.value.delete(node.path)
  else
    collapsed.value.add(node.path)
  collapsed.value = new Set(collapsed.value)
}

function collapseAll() {
  const paths = new Set<string>()
  const walk = (nodes: OpfsNode[]) => {
    for (const node of nodes) {
      if (node.kind === 'directory' && node.children?.length) {
        paths.add(node.path)
        walk(node.children)
      }
    }
  }
  walk(props.nodes)
  collapsed.value = paths
}

function activate(node: OpfsNode) {
  if (node.kind === 'directory')
    toggle(node)
  emit('select', node)
}
</script>

<template>
  <div v-if="isRoot" class="px-2 pt-1.5 flex items-center justify-between">
    <div class="flex gap-2 items-center">
      <span class="text-[11px] text-muted-foreground tracking-[1px] font-medium uppercase">{{ title }}</span>
      <span v-if="count !== undefined" class="text-xs text-muted-foreground font-mono">{{ count }}</span>
    </div>
    <div class="flex gap-0.5 items-center">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            class="text-muted-foreground p-0 size-6 hover:text-foreground"
            :aria-label="$t('web.notes.new')"
            @click="emit('createFile', null)"
          >
            <span class="i-lucide-file-plus shrink-0 size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {{ $t('web.notes.new') }}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            class="text-muted-foreground p-0 size-6 hover:text-foreground"
            :aria-label="$t('web.notes.newFolder')"
            @click="emit('createFolder', null)"
          >
            <span class="i-lucide-folder-plus shrink-0 size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {{ $t('web.notes.newFolder') }}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            class="text-muted-foreground p-0 size-6 hover:text-foreground"
            :aria-label="$t('web.notes.refresh')"
            @click="emit('refresh')"
          >
            <span class="i-lucide-refresh-cw shrink-0 size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {{ $t('web.notes.refresh') }}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            class="text-muted-foreground p-0 size-6 hover:text-foreground"
            :aria-label="$t('web.notes.collapseAll')"
            @click="collapseAll"
          >
            <span class="i-lucide-fold-vertical shrink-0 size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {{ $t('web.notes.collapseAll') }}
        </TooltipContent>
      </Tooltip>
      <slot name="menu" />
    </div>
  </div>

  <ul v-if="nodes.length" class="flex flex-col">
    <li v-for="node in nodes" :key="node.path">
      <div
        class="group text-sm rounded-sm flex gap-1.5 cursor-pointer items-center hover:bg-muted/60"
        :class="node.path === selected && 'bg-muted'"
        :style="{ paddingLeft: `${(depth ?? 0) * 14 + 4}px` }"
        @click="activate(node)"
      >
        <span
          class="shrink-0 size-3.5"
          :class="node.kind === 'directory'
            ? (collapsed.has(node.path) ? 'i-lucide-folder' : 'i-lucide-folder-open')
            : 'i-lucide-file-text text-muted-foreground'"
        />
        <span class="py-1 truncate">{{ displayName(node) }}</span>
        <span v-if="node.kind === 'file'" class="text-[11px] text-muted-foreground font-mono ml-auto">
          {{ formatStorageBytes(node.size) }}
        </span>
        <div class="opacity-0 flex shrink-0 gap-0.5 items-center group-hover:opacity-100" :class="node.kind === 'directory' && 'ml-auto'">
          <Button
            v-if="node.kind === 'directory'"
            variant="ghost"
            class="text-muted-foreground p-0 size-5 hover:text-foreground"
            :aria-label="$t('web.notes.new')"
            @click.stop="emit('createFile', node)"
          >
            <span class="i-lucide-plus shrink-0 size-3.5" />
          </Button>
          <Button
            v-if="node.kind === 'directory'"
            variant="ghost"
            class="text-muted-foreground p-0 size-5 hover:text-foreground"
            :aria-label="$t('web.notes.newFolder')"
            @click.stop="emit('createFolder', node)"
          >
            <span class="i-lucide-folder-plus shrink-0 size-3.5" />
          </Button>
          <Button
            variant="ghost"
            class="text-muted-foreground p-0 size-5 hover:text-foreground"
            :aria-label="$t('web.notes.rename')"
            @click.stop="emit('rename', node)"
          >
            <span class="i-lucide-pencil shrink-0 size-3" />
          </Button>
          <Button
            variant="ghost"
            class="text-muted-foreground p-0 size-5 hover:text-destructive"
            :aria-label="$t('web.notes.delete')"
            @click.stop="emit('remove', node)"
          >
            <span class="i-lucide-x shrink-0 size-3.5" />
          </Button>
        </div>
      </div>

      <FileTree
        v-if="node.kind === 'directory' && node.children?.length && !collapsed.has(node.path)"
        :nodes="node.children"
        :selected="selected"
        :depth="(depth ?? 0) + 1"
        @select="emit('select', $event)"
        @rename="emit('rename', $event)"
        @remove="emit('remove', $event)"
        @create-folder="emit('createFolder', $event)"
        @create-file="emit('createFile', $event)"
      />
    </li>
  </ul>
  <p v-else-if="isRoot" class="text-xs text-muted-foreground p-2">
    {{ $t('web.notes.empty') }}
  </p>
</template>
