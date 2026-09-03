# Template

PWA-ready Nuxt 4 monorepo: local-first OPFS storage, offline support, and built-in SEO/AI discoverability.

Live at **https://zschzen.github.io/nuxt-template/**

## Stack

- [Nuxt 4](https://nuxt.com) (Vue 3, Vite 8)
- [UnoCSS](https://unocss.dev) + [shadcn-vue](https://www.shadcn-vue.com)
- [Turborepo](https://turborepo.dev) + pnpm workspaces
- [PWA](https://vite-pwa-org.netlify.app/) — offline support, push notifications, OPFS storage
- [TinyBase](https://tinybase.org) — reactive local-first store, persisted to OPFS via OpfsPersister
- [NuxtSEO](https://nuxtseo.com) — robots, sitemap, schema.org, OG images, `llms.txt`
- [Zod](https://zod.dev) — env validation at startup

## Structure

```
├── apps/
│   └── web/                  # Main Nuxt application (PWA-enabled)
│       ├── app/              # Vue app source (pages/, components/, layouts/)
│       └── design/           # pen.dev design files (.pen)
├── packages/
│   ├── env/                  # Zod env validation (fail-fast typed config)
│   ├── seo/                  # Shared SEO layer (@nuxtjs/seo + AI-crawler support)
│   ├── storage/              # OPFS storage composables (gzip, ZIP import/export, TinyBase store)
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

| Command          | Description              |
| ---------------- | ------------------------ |
| `pnpm dev`       | Start development server |
| `pnpm build`     | Build for production     |
| `pnpm lint`      | Lint all packages        |
| `pnpm typecheck` | Type-check all packages  |

## SEO & AI Discoverability

SEO ships as a shared Nuxt layer ([`packages/seo`](packages/seo)) enabled in any app with one line:

```ts
export default defineNuxtConfig({
  extends: ['@template/seo'],
})
```

The layer bundles [@nuxtjs/seo](https://nuxtseo.com) (robots, sitemap, OG images, schema.org, canonical URLs, link checking) plus two standalone modules:

| Module                 | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `nuxt-ai-ready`        | Generates `/llms.txt` and `/llms-full.txt` for AI crawlers      |
| `nuxt-skew-protection` | Prevents ChunkLoadError / stale-chunk errors during deployments |

### Auto-generated endpoints

| Endpoint         | Description                                   |
| ---------------- | --------------------------------------------- |
| `/sitemap.xml`   | XML sitemap for search engines                |
| `/llms.txt`      | Markdown index of the site for LLMs           |
| `/llms-full.txt` | Full page content in markdown for AI crawlers |

### Configuration

Each app declares its own site identity — required by the sitemap module:

```ts
// apps/web/nuxt.config.ts
export default defineNuxtConfig({
  site: {
    name: 'Template App',
    description: 'PWA-ready Nuxt template with offline support',
    url: 'https://zschzen.github.io/',
  },
})
```

GitHub Pages note: this app serves from a subpath (`/nuxt-template/`), so robots.txt generation is disabled (`robots.robotsTxt: false`). Full layer docs: [`packages/seo/README.md`](packages/seo/README.md).

## Dependency Catalogs

Dependencies are categorized using [pnpm named catalogs](https://pnpm.io/catalogs#named-catalogs) in `pnpm-workspace.yaml`. Each catalog name communicates **purpose**, not just version:

| Catalog      | Purpose                | Example                              |
| ------------ | ---------------------- | ------------------------------------ |
| `core`       | Framework runtime      | nuxt, vue, pinia                     |
| `vueuse`     | Composable utilities   | @vueuse/core, @vueuse/nuxt           |
| `pwa`        | PWA & push tooling     | @vite-pwa/nuxt, web-push             |
| `styling`    | CSS engine + themes    | unocss, preset-shadcn                |
| `ui`         | Component library      | reka-ui, shadcn-nuxt, vaul-vue       |
| `linting`    | Code quality           | eslint, @antfu/eslint-config         |
| `types`      | TypeScript + type defs | typescript, vue-tsc, @types/web-push |
| `validation` | Schema validation      | zod                                  |
| `devtools`   | Dev tooling            | turbo, taze, dotenv-cli              |
| `git-hooks`  | Pre-commit checks      | husky, lint-staged                   |
| `icon`       | Icon fonts             | @iconify-json/lucide                 |
| `modules`    | Nuxt modules           | @nuxt/image, @nuxtjs/color-mode      |

### Why catalogs?

1. **Categorization** — `catalog:linting` in `package.json` tells you _what_ a dep is for, not just its version
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

## Design

App screens are mocked as [pen.dev](https://docs.pencil.dev) `.pen` files in `apps/web/design/` — JSON-based, versioned alongside code. Workflow and conventions: `apps/web/README.md`.

## License

MIT
