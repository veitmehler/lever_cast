import { describe, it, expect } from 'vitest'
import { Semaphore, mapWithConcurrency } from '../concurrency'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('Semaphore', () => {
  it('never exceeds the limit', async () => {
    const sem = new Semaphore(2)
    let active = 0
    let peak = 0
    await Promise.all(
      Array.from({ length: 8 }, () =>
        sem.run(async () => {
          active++
          peak = Math.max(peak, active)
          await sleep(10)
          active--
        }),
      ),
    )
    expect(peak).toBe(2)
  })

  it('releases the permit when fn throws', async () => {
    const sem = new Semaphore(1)
    await expect(sem.run(async () => { throw new Error('boom') })).rejects.toThrow('boom')
    // Permit must be free again:
    const result = await sem.run(async () => 'ok')
    expect(result).toBe('ok')
  })

  it('double-release is a no-op', async () => {
    const sem = new Semaphore(1)
    const release = await sem.acquire()
    release()
    release()
    const r2 = await sem.acquire() // must not hang and must not over-count
    r2()
    const r3 = await sem.acquire()
    r3()
  })
})

describe('mapWithConcurrency', () => {
  it('preserves input order in results', async () => {
    const out = await mapWithConcurrency([30, 10, 20], 3, async (ms) => {
      await sleep(ms)
      return ms
    })
    expect(out).toEqual([30, 10, 20])
  })

  it('caps concurrency', async () => {
    let active = 0
    let peak = 0
    await mapWithConcurrency(Array.from({ length: 9 }, (_, i) => i), 3, async () => {
      active++
      peak = Math.max(peak, active)
      await sleep(5)
      active--
    })
    expect(peak).toBe(3)
  })

  it('lets siblings finish before re-throwing a single failure', async () => {
    const done: number[] = []
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (n) => {
        if (n === 2) throw new Error('task2')
        await sleep(10)
        done.push(n)
      }),
    ).rejects.toThrow('task2')
    expect(done.sort()).toEqual([1, 3])
  })

  it('aggregates multiple failures', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 3, async (n) => {
        if (n !== 3) throw new Error(`t${n}`)
      }),
    ).rejects.toThrow('2 of 3 tasks failed')
  })

  it('handles empty input', async () => {
    expect(await mapWithConcurrency([], 3, async () => 1)).toEqual([])
  })
})
