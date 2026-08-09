<script setup lang="ts">
import type { AvatarRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@openpencil/ui/lib/utils'
import { AvatarRoot } from 'reka-ui'

const props = defineProps<AvatarRootProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <AvatarRoot :class="cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', props.class)">
    <slot />
  </AvatarRoot>
</template>
