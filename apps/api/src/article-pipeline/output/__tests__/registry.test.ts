import { describe, it, expect } from 'vitest'
import { getOutputTarget, VALID_TARGETS } from '../registry'

describe('output target registry', () => {
  it('exposes exactly the html, bundle, wordpress, and internal targets', () => {
    // 'internal' = azavea-vertical essays (brand-consolidation Phase A);
    // the three clinic targets are additionally guarded by
    // internal-target-isolation.test.ts.
    expect([...VALID_TARGETS].sort()).toEqual(['bundle', 'html', 'internal', 'wordpress'])
  })

  it('returns the matching target whose name equals the key', () => {
    for (const name of VALID_TARGETS) {
      const target = getOutputTarget(name)
      expect(target.name).toBe(name)
      expect(typeof target.publish).toBe('function')
    }
  })

  it('throws a descriptive error for an unknown target', () => {
    expect(() => getOutputTarget('email')).toThrow(/Unknown output target: "email"/)
  })
})
