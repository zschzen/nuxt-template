# @template/ui

Shared UI component library. [Nuxt Layer](https://nuxt.com/docs/getting-started/layers) — apps extend it, components auto-import.

## Stack

- [shadcn-vue](https://www.shadcn-vue.com) — component primitives
- [reka-ui](https://www.reka-ui.com) — headless UI library
- [UnoCSS](https://unocss.dev) — atomic CSS engine
- [class-variance-authority](https://cva.docs.lathe.dev) — variant management
- [tailwind-merge](https://github.com/dcastil/tailwind-merge) — class deduplication

## Structure

```
├── app/
│   ├── components/       # shadcn-vue components (auto-imported)
│   ├── composables/      # Shared composables
│   ├── lib/              # Utility functions (cn, etc.)
│   └── assets/           # Global styles (globals.css)
├── uno.config.ts         # UnoCSS presets + theme
└── nuxt.config.ts        # Layer config
```

## Usage

Apps extend this layer in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  extends: ['@template/ui'],
})
```

All components in `app/components/` are then available app-wide without imports.

## Adding Components

```bash
pnpm dlx shadcn-vue add button
```

Components land in `app/components/ui/` and are auto-imported.

## UnoCSS Presets

Configured in `uno.config.ts`:

| Preset              | Purpose                            |
| ------------------- | ---------------------------------- |
| `presetWind4`       | Tailwind-compatible utilities      |
| `presetAttributify` | Attribute-based styling            |
| `presetIcons`       | Icon fonts (Lucide)                |
| `presetTypography`  | Prose styles                       |
| `presetWebFonts`    | System fonts (no external loading) |
| `presetShadcn`      | shadcn theme tokens                |
| `presetAnimations`  | Enter/exit animations              |

## Catalogs

Uses `catalog:ui`, `catalog:styling`, `catalog:icon`, `catalog:modules`, `catalog:linting`, `catalog:types`, `catalog:core` in `pnpm-workspace.yaml`.
