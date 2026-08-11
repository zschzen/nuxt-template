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
│   ├── components/       # Page components
│   ├── composables/      # usePush, useOpfs
│   ├── layouts/          # Page layouts
│   ├── pages/            # File-based routing
│   ├── app.vue           # Root component
│   └── app.config.ts     # Runtime app config
├── public/               # Static assets (icons, OPFS worker)
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

## Catalogs

Uses `catalog:core`, `catalog:vueuse`, `catalog:pwa`, `catalog:linting`, `catalog:types` in `pnpm-workspace.yaml`.
