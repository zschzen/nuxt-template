# @template/eslint-config

Shared ESLint configuration for the monorepo. Powered by [@antfu/eslint-config](https://github.com/antfu/eslint-config).

## What's Configured

- **TypeScript** — `type` declarations enforced, `no-redeclare` off (overloads)
- **Vue** — max 2 attrs single-line, 1 attr multi-line
- **UnoCSS** — plugin enabled
- **Formatting** — 2-space indent, single quotes, no semicolons
- **pnpm** — catalog enforcement available (currently off)
- **Node** — `process.env` banned (use `@template/env` instead)

## Usage

Each package imports this config in `eslint.config.mjs`:

```js
import config from '@template/eslint-config'

export default config
```

## Customizing

Override rules per-package by extending the config:

```js
import config from '@template/eslint-config'

export default [
  ...config,
  {
    rules: {
      // package-specific overrides
    },
  },
]
```

## Catalog

Uses `catalog:linting` in `pnpm-workspace.yaml`.
