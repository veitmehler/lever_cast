/**
 * Per-provider circuit breaker — the last resilience layer. Phases 1-5 bound
 * and gracefully handle a SINGLE call's failure; this handles a SUSTAINED
 * outage (like the 2026-07-08 Fal "Exhausted balance" incident, which lasted
 * far longer than any one call's retry/timeout budget). Once a provider has
 * failed enough times in a row, stop paying the full timeout on every
 * subsequent call — fail instantly until a cooldown passes, then let one
 * probe through to test recovery.
 *
 * Classic Fowler circuit breaker: closed (normal) → open (fail fast) →
 * half-open (one probe) → closed or back to open.
 */

export type CircuitState = 'closed' | 'open' | 'half-open'

export class CircuitOpenError extends Error {
  constructor(provider: string, cooldownRemainingMs: number) {
    super(
      `${provider} circuit is open (too many recent failures) — failing fast for another ${Math.ceil(cooldownRemainingMs / 1000)}s`,
    )
    this.name = 'CircuitOpenError'
  }
}

export interface CircuitBreakerOptions {
  /** Consecutive failures (in 'closed' state) before opening. */
  failureThreshold?: number
  /** How long to stay 'open' before allowing a half-open probe. */
  cooldownMs?: number
  /** Injectable clock — tests control time without real sleeps. */
  now?: () => number
}

export class CircuitBreaker {
  private state: CircuitState = 'closed'
  private consecutiveFailures = 0
  private openedAt = 0
  private readonly failureThreshold: number
  private readonly cooldownMs: number
  private readonly now: () => number

  constructor(private readonly name: string, opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 5
    this.cooldownMs = opts.cooldownMs ?? 3 * 60 * 1000
    this.now = opts.now ?? Date.now
  }

  getState(): CircuitState {
    return this.state
  }

  private cooldownRemainingMs(): number {
    return Math.max(0, this.cooldownMs - (this.now() - this.openedAt))
  }

  /** May the caller attempt a call right now? Transitions open→half-open when the cooldown elapses. */
  canAttempt(): boolean {
    if (this.state === 'open') {
      if (this.cooldownRemainingMs() > 0) return false
      this.state = 'half-open'
    }
    return true
  }

  /** Throws CircuitOpenError if the circuit is open; call before attempting the underlying operation. */
  assertClosed(): void {
    if (!this.canAttempt()) throw new CircuitOpenError(this.name, this.cooldownRemainingMs())
  }

  onSuccess(): void {
    // A successful probe (half-open) or a normal success (closed) both fully reset the breaker.
    this.state = 'closed'
    this.consecutiveFailures = 0
  }

  onFailure(): void {
    this.consecutiveFailures++
    if (this.state === 'half-open') {
      // Probe failed — the provider is still down; reopen and restart the cooldown.
      this.state = 'open'
      this.openedAt = this.now()
      return
    }
    if (this.state === 'closed' && this.consecutiveFailures >= this.failureThreshold) {
      this.state = 'open'
      this.openedAt = this.now()
    }
  }
}

const breakers = new Map<string, CircuitBreaker>()

/** One shared breaker per provider name, created lazily on first use. */
export function getCircuitBreaker(provider: string, opts?: CircuitBreakerOptions): CircuitBreaker {
  let breaker = breakers.get(provider)
  if (!breaker) {
    breaker = new CircuitBreaker(provider, opts)
    breakers.set(provider, breaker)
  }
  return breaker
}

/** Test-only: clear all breaker state between test runs. */
export function resetAllCircuitBreakers(): void {
  breakers.clear()
}
