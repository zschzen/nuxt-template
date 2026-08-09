<script setup lang="ts">
import type { AvatarImageProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@openpencil/ui/lib/utils'
import { AvatarImage } from 'reka-ui'

const props = defineProps<AvatarImageProps & { class?: HTMLAttributes['class'] }>()
</script>

<template>
  <AvatarImage
    v-bind="props"
    :class="cn('aspect-square h-full w-full', props.class)"
  />
</template>
