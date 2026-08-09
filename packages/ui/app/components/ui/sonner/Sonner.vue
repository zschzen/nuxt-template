<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { reactiveOmit } from '@vueuse/core'
import { Toaster as Sonner } from 'vue-sonner'

const props = defineProps<ToasterProps>()
const delegatedProps = reactiveOmit(props, 'toastOptions')
</script>

<template>
  <Sonner
    class="toaster group"
    :toast-options="{
      classes: {
        toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton:
          'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton:
          'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      },
    }"
    v-bind="delegatedProps"
  >
    <template #success-icon>
      <div class="i-lucide-circle-check size-4" />
    </template>
    <template #info-icon>
      <div class="i-lucide-info size-4" />
    </template>
    <template #warning-icon>
      <div class="i-lucide-triangle-alert size-4" />
    </template>
    <template #error-icon>
      <div class="i-lucide-octagon-x size-4" />
    </template>
    <template #loading-icon>
      <div>
        <div class="i-lucide-loader-2 size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <div class="i-lucide-x size-4" />
    </template>
  </Sonner>
</template>
