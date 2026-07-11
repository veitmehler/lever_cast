/**
 * Bounded-concurrency primitives for the throughput work
 * (.plans/production-throughput.implementation-plan.md Phase 1).
 *
 * Design rule from the plan: limits are GLOBAL (module-level semaphores shared
 * across jobs), never per-job — article batchSize 2 × social concurrency 3
 * already multiply whatever a single job allows itself.
 */

/** Classic counting semaphore. FIFO waiters; release is idempotent-safe via the token fn. */
export class Semaphore {
  private available: number
  private waiters: Array<() => void> = []

  constructor(readonly max: number) {
    this.available = max
  }

  /** Resolves with a release function. Always call release in `finally`. */
  async acquire(): Promise<() => void> {
    if (this.available > 0) {
      this.available--
      return this.makeRelease()
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve))
    this.available--
    return this.makeRelease()
  }

  /** Run fn while holding a permit. */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire()
    try {
      return await fn()
    } finally {
      release()
    }
  }

  get pending(): number {
    return this.waiters.length
  }

  private makeRelease(): () => void {
    let released = false
    return () => {
      if (released) return
      released = true
      this.available++
      const next = this.waiters.shift()
      if (next) next()
    }
  }
}

/**
 * Map over items with at most `limit` concurrent executions. Results keep input
 * order. Rejections are captured per item and re-thrown AFTER all tasks settle
 * (as an AggregateError when multiple failed) so one failure can't strand
 * running siblings — callers that want per-item failure isolation should catch
 * inside `fn` (the enrichment/carousel loops do exactly that).
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  const errors: unknown[] = []
  let cursor = 0

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor++
      if (index >= items.length) return
      try {
        results[index] = await fn(items[index], index)
      } catch (err) {
        errors.push(err)
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, () => worker())
  await Promise.all(workers)

  if (errors.length === 1) throw errors[0]
  if (errors.length > 1) throw new AggregateError(errors, `${errors.length} of ${items.length} tasks failed`)
  return results
}
