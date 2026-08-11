<script setup lang="ts">
const { template } = useAppConfig()
</script>

<template>
  <div class="px-4 bg-muted/30 flex h-screen w-full items-center justify-center">
    <UiCard class="max-w-md w-full shadow-xl">
      <UiCardHeader class="space-y-1">
        <UiCardTitle class="text-3xl tracking-tight font-extrabold italic">
          Welcome to {{ template.ui.name }}
        </UiCardTitle>
        <UiCardDescription class="text-lg">
          Explore and interact with the UI components built with Nuxt 4, Reka UI, and UnoCSS.
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent class="py-6 gap-6 grid">
        <div class="gap-2 grid">
          <UiLabel for="email" class="italic">
            Quick Search
          </UiLabel>
          <UiInput
            id="email"
            type="text"
            placeholder="Search for a component..."
          />
        </div>
      </UiCardContent>
      <UiCardFooter class="pt-6 border-t flex flex-col gap-4">
        <UiButton as-child class="text-lg font-bold h-12 w-full">
          <NuxtLink to="/components">
            View Component Gallery
            <div class="i-carbon-arrow-right ml-2 h-5 w-5" />
          </NuxtLink>
        </UiButton>
        <p class="text-sm text-muted-foreground text-center italic">
          Built with <span class="text-primary font-bold italic">Template UI</span> Layer
        </p>
      </UiCardFooter>
    </UiCard>
  </div>
</template>
