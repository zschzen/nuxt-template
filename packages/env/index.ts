import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
})

/**
 * Parse and validate environment variables.
 * Throws on invalid config at startup — fail fast, no silent misconfiguration.
 */
export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
