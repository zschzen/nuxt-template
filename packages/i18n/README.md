# @template/i18n

Shared i18n layer for Nuxt apps: `@nuxtjs/i18n` defaults (locales `en` + `pt-BR`, `no_prefix` strategy, lazy loading, cookie-based browser detection) plus shared `common.*` messages.

## Usage

Enable the layer in your app:

```ts
export default defineNuxtConfig({
  extends: ['@template/i18n'],
})
```

## Key ownership

- Layer owns `common.*` only (actions, states, language names).
- Each app owns its keys under its own namespace (e.g. `web.*` in `apps/web/i18n/locales/*.json`, `landing.*` in `apps/landing`). Never add per-app subfolders here — each app would ship every sibling's strings.
- Each app **must redeclare the locale codes** so its files merge over the layer (project wins on conflict):

```ts
export default defineNuxtConfig({
  extends: ['@template/i18n'],

  i18n: {
    locales: [
      { code: 'en', file: 'en.json' },
      { code: 'pt-BR', file: 'pt-BR.json' },
    ],
  },
})
```

## Per-app overrides

Apps diverge in their own `nuxt.config.ts` (app config wins over the layer):

```ts
export default defineNuxtConfig({
  extends: ['@template/i18n'],

  // e.g. SEO landing needs prefixed URLs + hreflang base
  i18n: {
    strategy: 'prefix_except_default',
    baseUrl: 'https://example.com',
  },
})
```

`baseUrl` is unset in the layer on purpose — it must come from each app's `site.url` (`@template/seo`). `site.defaultLocale` in `@template/seo` must match `i18n.defaultLocale` (`en`).

## Versioning

`@nuxtjs/i18n` is pinned through the pnpm catalog (`modules:` section in the root `pnpm-workspace.yaml`) — one source of truth for every app that extends this layer.

Full module docs: https://i18n.nuxtjs.org/
