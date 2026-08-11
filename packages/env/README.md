# @template/env

Zod-validated environment variables. Fail fast at startup — no silent misconfiguration.

## Usage

```ts
import { env } from '@template/env'

// Typed, validated, throws on missing/invalid vars
console.log(env.VAPID_PUBLIC_KEY)
```

## Schema

| Variable | Type | Default | Description |
|---|---|---|---|
| `NODE_ENV` | `development \| test \| production` | `development` | Runtime environment |
| `VAPID_PUBLIC_KEY` | `string` | `''` | VAPID public key for push notifications |
| `VAPID_PRIVATE_KEY` | `string` | `''` | VAPID private key for push notifications |

## Adding Variables

Edit `packages/env/index.ts`:

```ts
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VAPID_PUBLIC_KEY: z.string().default(''),
  VAPID_PRIVATE_KEY: z.string().default(''),
  // Add new vars here — schema validates at import time
})
```

Then add the matching entry to `apps/web/.env.example`.

## Graceful Fallback

For test/setup contexts where env may be incomplete:

```ts
import { tryParseEnv } from '@template/env/try-parse-env'

const env = tryParseEnv()
if (!env) {
  // handle missing config
}
```

## Catalog

Uses `catalog:validation` (zod) in `pnpm-workspace.yaml`.
