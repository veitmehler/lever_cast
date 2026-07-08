/**
 * Bound an external call so a hung request can never wedge a worker slot.
 *
 * Root cause of the 2026-07-08 incident: a Fal.ai video call hung with no
 * client-side timeout. The job sat 'active' forever, occupying the worker's
 * single social-generate slot and blocking every other client's run. See
 * .plans/social-generation-resilience.implementation-plan.md (Phase 1).
 */

export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

/**
 * Race `fn` against a timer. `fn` receives an AbortSignal — pass it through to
 * `fetch`/SDK calls that support cancellation so the underlying request is
 * actually aborted (not just abandoned) when the timeout fires.
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout>

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new TimeoutError(label, ms))
    }, ms)
  })

  try {
    return await Promise.race([fn(controller.signal), timeout])
  } finally {
    clearTimeout(timer!)
  }
}
