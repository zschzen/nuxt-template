<script setup lang="ts">
const i18nHead = useLocaleHead()
useHead(() => ({
  htmlAttrs: { lang: i18nHead.value.htmlAttrs?.lang ?? 'en' },
}))
</script>

<template>
  <NuxtLoadingIndicator />
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
