# Template

PWA-ready Nuxt 4 monorepo with component library, env validation, and push notifications.

## Stack

- [Nuxt 4](https://nuxt.com) (Vue 3, Vite 8)
- [UnoCSS](https://unocss.dev) + [shadcn-vue](https://www.shadcn-vue.com)
- [Turborepo](https://turborepo.dev) + pnpm workspaces
- [PWA](https://vite-pwa-org.netlify.app/) — offline support, push notifications, OPFS storage
- [Zod](https://zod.dev) — env validation at startup

## Structure

```
├── apps/
│   └── web/                  # Main Nuxt application (PWA-enabled)
├── packages/
│   ├── env/                  # Zod env validation (fail-fast typed config)
│   ├── ui/                   # UI components (shadcn-vue + UnoCSS)
│   └── eslint-config/        # Shared ESLint config
├── pnpm-workspace.yaml       # Named catalog-managed dependency versions
└── turbo.json                # Turborepo pipeline config
```

## Getting Started

```bash
cp apps/web/.env.example apps/web/.env
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |

## Dependency Catalogs

Dependencies are categorized using [pnpm named catalogs](https://pnpm.io/catalogs#named-catalogs) in `pnpm-workspace.yaml`. Each catalog name communicates **purpose**, not just version:

| Catalog | Purpose | Example |
|---|---|---|
| `core` | Framework runtime | nuxt, vue, pinia |
| `vueuse` | Composable utilities | @vueuse/core, @vueuse/nuxt |
| `pwa` | PWA & push tooling | @vite-pwa/nuxt, web-push |
| `styling` | CSS engine + themes | unocss, preset-shadcn |
| `ui` | Component library | reka-ui, shadcn-nuxt, vaul-vue |
| `linting` | Code quality | eslint, @antfu/eslint-config |
| `types` | TypeScript + type defs | typescript, vue-tsc, @types/web-push |
| `validation` | Schema validation | zod |
| `devtools` | Dev tooling | turbo, taze, dotenv-cli |
| `git-hooks` | Pre-commit checks | husky, lint-staged |
| `icon` | Icon fonts | @iconify-json/lucide |
| `modules` | Nuxt modules | @nuxt/image, @nuxtjs/color-mode |

### Why catalogs?

1. **Categorization** — `catalog:linting` in `package.json` tells you *what* a dep is for, not just its version
2. **Single version source** — update once in `pnpm-workspace.yaml`, all packages pick it up
3. **Review-friendly** — dep upgrades show which catalog changed, making PRs easier to review

### Adding a dependency

```bash
# Add to a named catalog in pnpm-workspace.yaml first, then:
pnpm --filter <package> add <dep> catalog:<catalog-name>
```

## Adding Components

```bash
pnpm --filter @template/ui dlx shadcn-vue add button
```

## License

MIT
