import { computed, onMounted, onUnmounted, ref } from 'vue'

// Shared matchMedia instance for md breakpoint (768px — UnoCSS presetWind4 default)
let mdQuery: MediaQueryList | null = null
let activeCount = 0
let onChange: (() => void) | null = null

function getMdQuery() {
  if (typeof window === 'undefined')
    return null
  if (!mdQuery)
    mdQuery = window.matchMedia('(min-width: 768px)')
  return mdQuery
}

export function useLayout() {
  const matches = ref(true) // SSR default: desktop-first

  onMounted(() => {
    const q = getMdQuery()
    if (!q)
      return

    matches.value = q.matches

    if (activeCount === 0) {
      onChange = () => {
        matches.value = q.matches
      }
      q.addEventListener('change', onChange)
    }
    activeCount++
  })

  onUnmounted(() => {
    const q = getMdQuery()
    if (!q || !onChange)
      return

    activeCount--
    if (activeCount === 0) {
      q.removeEventListener('change', onChange)
      onChange = null
    }
  })

  const isDesktop = computed(() => matches.value)
  const isMobile = computed(() => !matches.value)

  return {
    isDesktop,
    isMobile,
  }
}
