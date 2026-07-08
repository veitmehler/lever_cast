import { describe, it, expect, beforeEach } from 'vitest'
import { CircuitBreaker, CircuitOpenError, getCircuitBreaker, resetAllCircuitBreakers } from '../circuit-breaker'

describe('CircuitBreaker', () => {
  it('starts closed and allows attempts', () => {
    const cb = new CircuitBreaker('test')
    expect(cb.getState()).toBe('closed')
    expect(cb.canAttempt()).toBe(true)
  })

  it('stays closed and resets the failure count on success', () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 3 })
    cb.onFailure()
    cb.onFailure()
    cb.onSuccess()
    cb.onFailure()
    cb.onFailure()
    // 2 failures since the reset — below threshold of 3, still closed.
    expect(cb.getState()).toBe('closed')
  })

  it('opens after `failureThreshold` consecutive failures', () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 3 })
    cb.onFailure()
    cb.onFailure()
    expect(cb.getState()).toBe('closed')
    cb.onFailure()
    expect(cb.getState()).toBe('open')
  })

  it('rejects attempts while open and within the cooldown window', () => {
    let now = 1_000_000
    const cb = new CircuitBreaker('test', { failureThreshold: 1, cooldownMs: 60_000, now: () => now })
    cb.onFailure() // opens immediately (threshold 1)
    expect(cb.getState()).toBe('open')
    expect(cb.canAttempt()).toBe(false)

    now += 30_000 // still within the 60s cooldown
    expect(cb.canAttempt()).toBe(false)
  })

  it('transitions to half-open exactly once the cooldown elapses, allowing one probe', () => {
    let now = 1_000_000
    const cb = new CircuitBreaker('test', { failureThreshold: 1, cooldownMs: 60_000, now: () => now })
    cb.onFailure()
    now += 60_000
    expect(cb.canAttempt()).toBe(true)
    expect(cb.getState()).toBe('half-open')
  })

  it('closes fully on a successful half-open probe', () => {
    let now = 1_000_000
    const cb = new CircuitBreaker('test', { failureThreshold: 1, cooldownMs: 60_000, now: () => now })
    cb.onFailure()
    now += 60_000
    cb.canAttempt() // transitions to half-open
    cb.onSuccess()
    expect(cb.getState()).toBe('closed')
    expect(cb.canAttempt()).toBe(true)
  })

  it('reopens with a fresh cooldown when the half-open probe fails', () => {
    let now = 1_000_000
    const cb = new CircuitBreaker('test', { failureThreshold: 1, cooldownMs: 60_000, now: () => now })
    cb.onFailure()
    now += 60_000
    cb.canAttempt() // half-open
    cb.onFailure() // probe failed
    expect(cb.getState()).toBe('open')
    // Fresh cooldown starts now — not attemptable immediately.
    expect(cb.canAttempt()).toBe(false)
    now += 60_000
    expect(cb.canAttempt()).toBe(true)
  })

  it('assertClosed throws CircuitOpenError only while open', () => {
    let now = 1_000_000
    const cb = new CircuitBreaker('fal-ai', { failureThreshold: 1, cooldownMs: 60_000, now: () => now })
    expect(() => cb.assertClosed()).not.toThrow()
    cb.onFailure()
    expect(() => cb.assertClosed()).toThrow(CircuitOpenError)
    expect(() => cb.assertClosed()).toThrow(/fal-ai circuit is open/)
    now += 60_000
    expect(() => cb.assertClosed()).not.toThrow() // half-open probe allowed
  })
})

describe('getCircuitBreaker registry', () => {
  beforeEach(() => resetAllCircuitBreakers())

  it('returns the same instance for repeated calls with the same provider name', () => {
    const a = getCircuitBreaker('fal-ai')
    const b = getCircuitBreaker('fal-ai')
    expect(a).toBe(b)
  })

  it('returns distinct breakers for different providers', () => {
    const fal = getCircuitBreaker('fal-ai')
    const eleven = getCircuitBreaker('elevenlabs')
    expect(fal).not.toBe(eleven)
  })
})
