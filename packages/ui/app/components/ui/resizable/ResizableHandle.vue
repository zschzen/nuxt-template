<script setup lang="ts">
import type { SplitterResizeHandleEmits, SplitterResizeHandleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@openpencil/ui/lib/utils'
import { reactiveOmit } from '@vueuse/core'
import { SplitterResizeHandle, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<SplitterResizeHandleProps & { class?: HTMLAttributes['class'], withHandle?: boolean }>()
const emits = defineEmits<SplitterResizeHandleEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SplitterResizeHandle v-bind="forwarded" :class="cn('group relative flex w-2 items-center justify-center bg-transparent transition-colors data-[state=hover]:bg-primary/20 data-[state=drag]:bg-primary/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&[data-orientation=vertical]]:h-2 [&[data-orientation=vertical]]:w-full [&[data-orientation=vertical]>div]:rotate-90', props.class)">
    <template v-if="props.withHandle">
      <div class="border rounded-sm bg-border flex h-4 w-3 transition-colors items-center justify-center z-10 group-data-[state=drag]:bg-primary/50 group-data-[state=hover]:bg-primary/50">
        <div class="i-lucide-grip-vertical h-2.5 w-2.5" />
      </div>
    </template>
  </SplitterResizeHandle>
</template>
