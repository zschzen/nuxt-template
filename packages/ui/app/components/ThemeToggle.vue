<script setup lang="ts">
const colorMode = useColorMode()

useHead({
  meta: [{
    id: 'theme-color',
    name: 'theme-color',
    content: () => colorMode.value === 'dark' ? '#000000' : '#ffffff',
  }],
})
</script>

<template>
  <UiDropdownMenu>
    <UiDropdownMenuTrigger as-child>
      <UiButton
        variant="outline"
        size="icon"
        class="relative"
      >
        <div class="i-lucide-sun h-4 w-4 rotate-0 scale-100 transition-all dark:scale-0 dark:-rotate-90" />
        <div class="i-lucide-moon h-4 w-4 rotate-90 scale-0 transition-all absolute dark:rotate-0 dark:scale-100" />
        <span class="sr-only">Toggle theme</span>
      </UiButton>
    </UiDropdownMenuTrigger>
    <UiDropdownMenuContent align="end" class="min-w-32">
      <UiDropdownMenuItem
        class="font-bold cursor-pointer italic"
        @select="colorMode.preference = 'light'"
      >
        <div class="i-lucide-sun mr-2 opacity-70 h-4 w-4" />
        <span>Light</span>
      </UiDropdownMenuItem>
      <UiDropdownMenuItem
        class="font-bold cursor-pointer italic"
        @select="colorMode.preference = 'dark'"
      >
        <div class="i-lucide-moon mr-2 opacity-70 h-4 w-4" />
        <span>Dark</span>
      </UiDropdownMenuItem>
      <UiDropdownMenuItem
        class="font-bold cursor-pointer italic"
        @select="colorMode.preference = 'system'"
      >
        <div class="i-lucide-monitor mr-2 opacity-70 h-4 w-4" />
        <span>System</span>
      </UiDropdownMenuItem>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>
