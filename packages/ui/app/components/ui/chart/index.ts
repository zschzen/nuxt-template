export { default as ChartCrosshair } from './ChartCrosshair.vue'
export { default as ChartLegend } from './ChartLegend.vue'
export { default as ChartSingleTooltip } from './ChartSingleTooltip.vue'
export { default as ChartTooltip } from './ChartTooltip.vue'

// --chart-1..5 are emitted by presetShadcn; cycle them so any series count resolves.
export function defaultColors(count: number = 3) {
  return Array.from({ length: count }, (_, i) => `oklch(var(--chart-${(i % 5) + 1}))`)
}

export * from './interface'
