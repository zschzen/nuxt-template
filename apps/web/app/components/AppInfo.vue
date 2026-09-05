<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@template/ui/components/ui/tooltip'
import { ref } from 'vue'

const emit = defineEmits<{
  error: [message: string]
}>()

const { t } = useI18n()
const pwa = usePWA()
const online = useOnline()
const { persisted, permission, refresh, requestPersist } = useStorageStatus()
const busy = ref(false)

async function onInstall() {
  if (busy.value)
    return
  busy.value = true
  try {
    await pwa?.install()
  }
  finally {
    busy.value = false
  }
}

async function onRequestPersist() {
  if (busy.value)
    return
  busy.value = true
  try {
    const granted = await requestPersist()
    await refresh()
    if (!granted)
      emit('error', t('web.footer.persistDenied'))
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <div class="flex gap-2.5 items-center">
      <div class="flex gap-1.5 items-center">
        <span class="rounded-full size-1.5" :class="online ? 'bg-green-500' : 'bg-destructive'" />
        <span class="text-[11px] text-muted-foreground">{{ online ? $t('web.appInfo.online') : $t('web.appInfo.offline') }}</span>
        <Tooltip>
          <TooltipTrigger as-child>
            <span
              class="i-lucide-info text-muted-foreground shrink-0 size-3"
              :aria-label="$t('web.appInfo.onlineTip')"
              role="img"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {{ $t('web.appInfo.onlineTip') }}
          </TooltipContent>
        </Tooltip>
      </div>

      <div class="flex gap-1.5 items-center">
        <span class="rounded-full size-1.5" :class="pwa?.isPWAInstalled ? 'bg-green-500' : 'bg-destructive'" />
        <button
          v-if="!pwa?.isPWAInstalled"
          type="button"
          :disabled="busy"
          class="text-[11px] text-primary font-medium disabled:opacity-60 hover:underline"
          @click="onInstall"
        >
          {{ $t('web.appInfo.install') }}
        </button>
        <span v-else class="text-[11px] text-muted-foreground">{{ $t('web.appInfo.installed') }}</span>
        <Tooltip>
          <TooltipTrigger as-child>
            <span
              class="i-lucide-info text-muted-foreground shrink-0 size-3"
              :aria-label="$t('web.appInfo.installTip')"
              role="img"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {{ $t('web.appInfo.installTip') }}
          </TooltipContent>
        </Tooltip>
      </div>

      <div v-if="persisted !== null" class="flex gap-1.5 items-center">
        <span class="rounded-full size-1.5" :class="persisted ? 'bg-green-500' : 'bg-destructive'" />
        <button
          v-if="!persisted && permission !== 'denied'"
          type="button"
          :disabled="busy"
          class="text-[11px] text-primary font-medium disabled:opacity-60 hover:underline"
          @click="onRequestPersist"
        >
          {{ $t('web.appInfo.notPersisted') }}
        </button>
        <span v-else-if="persisted" class="text-[11px] text-muted-foreground">{{ $t('web.appInfo.persisted') }}</span>
        <span v-else class="text-[11px] text-muted-foreground">{{ $t('web.appInfo.notPersisted') }}</span>
        <Tooltip>
          <TooltipTrigger as-child>
            <span
              class="i-lucide-info text-muted-foreground shrink-0 size-3"
              :aria-label="$t('web.appInfo.persistedTip')"
              role="img"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {{ $t('web.appInfo.persistedTip') }}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  </TooltipProvider>
</template>
