<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { SheetVariants } from '.'
import { cn } from '@template/ui/lib/utils'
import { reactiveOmit } from '@vueuse/core'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { sheetVariants } from '.'

type SheetContentProps = {
  class?: HTMLAttributes['class']
  side?: SheetVariants['side']
} & DialogContentProps

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<SheetContentProps>()

const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'side')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="bg-black/80 inset-0 fixed z-50 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
    />
    <DialogContent
      :class="cn(sheetVariants({ side }), props.class)"
      v-bind="{ ...forwarded, ...$attrs }"
    >
      <slot />

      <DialogClose
        class="rounded-sm opacity-70 ring-offset-background transition-opacity right-4 top-4 absolute focus:outline-none data-[state=open]:bg-secondary hover:opacity-100 disabled:pointer-events-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <div class="i-lucide-x text-muted-foreground h-4 w-4" />
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
