import { logger } from '../../lib/logger'

const MAX = 3
const BASE_MS = 400

export async function withGeoRetry<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const msg = err instanceof Error ? err.message : String(err)
      logger.warn({ label, attempt, msg }, '[enrichment-geo] retry')
      if (attempt < MAX) {
        await new Promise((r) => setTimeout(r, BASE_MS * 2 ** (attempt - 1)))
      }
    }
  }
  throw lastErr
}
