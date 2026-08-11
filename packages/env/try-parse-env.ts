import type { z } from 'zod'
import { env } from './index'

/**
 * Try to parse env — returns null if parsing fails.
 * Used in test/dependency-setup contexts where env may be incomplete.
 */
export function tryParseEnv(schema: z.ZodType = env): z.infer<typeof schema> | null {
  try {
    return schema.parse(process.env)
  }
  catch {
    return null
  }
}

export { env }
