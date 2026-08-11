# Template

## Stack

- [Nuxt 4](https://nuxt.com) (Vue 3, Vite 8)
- [UnoCSS](https://unocss.dev) + [shadcn-vue](https://www.shadcn-vue.com)
- [Turborepo](https://turborepo.dev) + pnpm workspaces

## Structure

```
├── apps/
│   └── web/              # Main Nuxt application
├── packages/
│   ├── ui/               # UI components (shadcn-vue + UnoCSS)
│   └── eslint-config/    # Shared ESLint config
├── pnpm-workspace.yaml   # Catalog-managed dependency versions
└── turbo.json            # Turborepo pipeline config
```

## Getting Started

```bash
cp .env.example .env
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

## Adding Components

```bash
pnpm --filter @template/ui dlx shadcn-vue add button
```

## License

MIT
