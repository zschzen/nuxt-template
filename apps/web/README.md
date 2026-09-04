# @template/web

Main Nuxt 4 application with PWA support, push notifications, and OPFS offline storage.

## Getting Started

```bash
cp .env.example .env   # Configure VAPID keys
pnpm install
pnpm dev
```

## Environment Variables

Validated at startup by `@template/env`. See `packages/env/index.ts` for the schema.

| Variable            | Required                   | Description                    |
| ------------------- | -------------------------- | ------------------------------ |
| `VAPID_PUBLIC_KEY`  | No (empty = push disabled) | VAPID public key for web push  |
| `VAPID_PRIVATE_KEY` | No (empty = push disabled) | VAPID private key for web push |

Generate VAPID keys:

```bash
pnpm dlx web-push@latest generate-vapid-keys
```

## Structure

```
├── app/
│   ├── components/       # Page components (incl. LocaleSwitcher)
│   ├── composables/      # usePush, useOpfs
│   ├── layouts/          # Page layouts
│   ├── pages/            # File-based routing
│   ├── app.vue           # Root component (sets <html lang> via useLocaleHead)
│   └── app.config.ts     # Runtime app config
├── i18n/locales/           # App messages (en, pt-BR) — merged over @template/i18n `common.*`
├── design/                 # .pen design files (pen.dev) — see Design section
├── public/                 # Static assets (icons, OPFS worker)
├── server/
│   ├── api/push/         # Push subscription endpoints
│   └── utils/            # Server utilities (web-push, push-store)
├── service-worker/       # Custom SW (Workbox)
├── nuxt.config.ts        # Nuxt config (PWA, runtimeConfig, UnoCSS)
└── .env.example          # Env template
```

## PWA

Configured via `@vite-pwa/nuxt` in `nuxt.config.ts`:

- **Offline support** — precached assets + offline fallback page
- **Push notifications** — subscribe/unsubscribe/send via `/api/push/*`
- **OPFS storage** — persistent offline file access via dedicated worker

### Push Notification Flow

1. Client calls `usePush().requestPermission()` — requests Notification API permission
2. Client calls `usePush().subscribeToPush()` — subscribes to push manager, sends subscription to server
3. Server stores subscription in `push-store.ts` (in-memory, swap to Redis/D1 for production)
4. Send notifications via `POST /api/push/send` with `{ title, body, url }`

## Server API

| Endpoint                | Method | Body                      | Description                  |
| ----------------------- | ------ | ------------------------- | ---------------------------- |
| `/api/push/subscribe`   | POST   | `{ endpoint, keys, ... }` | Store push subscription      |
| `/api/push/unsubscribe` | POST   | `{ endpoint }`            | Remove push subscription     |
| `/api/push/send`        | POST   | `{ title, body?, url? }`  | Send push to all subscribers |

## Composables

| Composable  | Purpose                                               |
| ----------- | ----------------------------------------------------- |
| `usePush()` | Push notification subscribe/unsubscribe/permission    |
| `useOpfs()` | OPFS file read/write/list/remove via dedicated worker |

## i18n

Extends `@template/i18n` (see `packages/i18n/README.md`): locales `en` + `pt-BR`, `no_prefix` strategy, lazy loading, cookie-based browser detection. Shared `common.*` keys come from the layer; app keys live under `web.*` in `i18n/locales/`.

## Design

`design/` holds [.pen files](https://docs.pencil.dev/core-concepts/pen-files) — pen.dev's JSON-based, Git-friendly design format. Each file mirrors the app's screens on an infinite canvas.

- `design/home.pen` — screens for this app (currently the OPFS notes page from `app/pages/index.vue`)

### Working with .pen files (agents included)

- **Editing** — open the file in the [pen.dev](https://docs.pencil.dev) desktop app. The file must be open in the editor before any tool can access it.
- **AI integration** — pen.dev exposes an MCP server (`pencil`) with an `execute` tool for programmatic design: [AI Integration docs](https://docs.pencil.dev/getting-started/ai-integration)
- **No auto-save** — the editor never writes to disk automatically. After every change session, save explicitly (Ctrl/Cmd+S) and verify the file size on disk changed. Unsaved work is lost when the app closes.
- **Schema** — node types, layout, and variables are defined by the .pen schema; if a property isn't in the schema it isn't supported. See the [developer docs](https://docs.pencil.dev/for-developers/the-pen-format).
- **Design tokens** — colors, radii, and fonts are stored as document variables (`$primary`, `$border`, …) mirroring the shadcn theme in `packages/ui/uno.config.ts` (`blue`, radius `0.75`). Keep them in sync when the theme changes.

## Catalogs

Uses `catalog:core`, `catalog:vueuse`, `catalog:pwa`, `catalog:linting`, `catalog:types` in `pnpm-workspace.yaml`.
