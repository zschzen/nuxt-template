<script setup lang="ts">
import { Button } from '@template/ui/components/ui/button'

const { locale, locales, setLocale } = useI18n()

const displayNames = computed(() => new Intl.DisplayNames([locale.value], { type: 'language' }))
const languageName = (code: string) => displayNames.value.of(code) ?? code
const shortCode = (code: string) => code.split('-')[0] ?? code
</script>

<template>
  <div
    class="flex gap-1 items-center"
    role="group"
    :aria-label="$t('common.language')"
  >
    <Button
      v-for="l in locales"
      :key="l.code"
      variant="ghost"
      size="sm"
      class="text-[11px] px-1.5 py-0.5 h-auto uppercase"
      :title="languageName(l.code)"
      :disabled="locale === l.code"
      @click="setLocale(l.code)"
    >
      {{ shortCode(l.code) }}
    </Button>
  </div>
</template>
