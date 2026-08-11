<script setup lang="ts">
import { Button } from '@template/ui/components/ui/button'

definePageMeta({
  layout: 'default',
})
</script>

<template>
  <div class="p-4 flex flex-col gap-4 min-h-screen items-center justify-center">
    <h1 class="text-2xl font-semibold">
      Nuxt 4 Monorepo Template
    </h1>
    <p class="text-muted-foreground">
      UnoCSS · shadcn-vue · Drizzle · Better Auth · i18n
    </p>
    <Button variant="outline" as-child>
      <a
        href="https://nuxt.com"
        target="_blank"
        rel="noopener"
      >
        Documentation
      </a>
    </Button>
  </div>
</template>
