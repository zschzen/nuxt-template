# @template/seo

Shared SEO layer for Nuxt apps: search-engine essentials (robots, sitemap, OG images, schema.org, canonical URLs, link checking) plus AI-crawler support and deploy skew protection.

## What's included

### Core bundle — `@nuxtjs/seo`

One dependency that installs every NuxtSEO module:

| Module       | Purpose                                                       | Docs                                  |
| ------------ | ------------------------------------------------------------- | ------------------------------------- |
| robots       | `robots.txt` generation, per-route rules, dev noindex         | https://nuxtseo.com/docs/robots       |
| sitemap      | Multi-sitemap `sitemap.xml` generation                        | https://nuxtseo.com/docs/sitemap      |
| link-checker | Crawls your app and reports broken internal links             | https://nuxtseo.com/docs/link-checker |
| og-image     | Dynamic OG image generation (templates + runtime rendering)   | https://nuxtseo.com/docs/og-image     |
| schema-org   | JSON-LD structured data for rich results / answer engines     | https://nuxtseo.com/docs/schema-org   |
| seo-utils    | Canonical URLs, title templates, meta defaults                | https://nuxtseo.com/docs/seo-utils    |
| site-config  | `NUXT_SITE_*` env resolution, canonical URLs, title templates | https://nuxtseo.com/docs/site-config  |

Full bundle docs: https://nuxtseo.com/docs/nuxt-seo

### Standalone add-ons

| Module                 | Purpose                                                                   | Docs                                                                  |
| ---------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `nuxt-ai-ready`        | `llms.txt` generation and AI crawler optimization                         | https://nuxtseo.com/docs/ai-ready/getting-started/installation        |
| `nuxt-skew-protection` | Fixes ChunkLoadError / stale-chunk 404s during deployments (version skew) | https://nuxtseo.com/docs/skew-protection/getting-started/introduction |

## Usage

Enable the layer in your app:

```ts
export default defineNuxtConfig({
  extends: ['@template/seo'],
})
```

Each app **must** declare its own site identity — without a name the default title template renders the literal `%siteName`:

```ts
export default defineNuxtConfig({
  extends: ['@template/seo'],

  site: {
    name: 'My App',
    description: 'What this app is',
  },
})
```

Set the deploy URL via env (auto-read by site-config):

```sh
NUXT_SITE_URL=https://example.com
```

Titles resolve automatically: pages without an explicit title show the site name; pages with one render as `Page Title | Site Name`.

## Auto-generated endpoints

| Endpoint         | Description                                      |
| ---------------- | ------------------------------------------------ |
| `/robots.txt`    | Crawler rules — noindex in development by design |
| `/sitemap.xml`   | XML sitemap for search engines                   |
| `/llms.txt`      | Markdown index for AI crawlers (`nuxt-ai-ready`) |
| `/llms-full.txt` | Full page content in markdown for AI crawlers    |

## Versioning

All SEO module versions are pinned through the pnpm catalog (`modules:` section in the root `pnpm-workspace.yaml`) and referenced with `catalog:` in `package.json` — one source of truth for every app that extends this layer.

## Updating

The core bundle updates through the main package; standalone modules (`nuxt-ai-ready`, `nuxt-skew-protection`) update independently. See https://nuxtseo.com/docs/nuxt-seo/guides/updating-modules
