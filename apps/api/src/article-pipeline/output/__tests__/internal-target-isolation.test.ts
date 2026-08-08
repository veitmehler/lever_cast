import { describe, expect, it } from 'vitest'
import { getOutputTarget, VALID_TARGETS } from '../registry'

/**
 * CLINIC-PATH ISOLATION GUARDS (brand-consolidation Phase A, user-mandated):
 * the internal target is additive; the clinic-facing targets — wordpress
 * publish, the HTML download, the bundle export — must keep resolving
 * exactly as before. If a refactor breaks any of these, CI fails here.
 */
describe('output registry isolation', () => {
  it('all pre-existing clinic targets still resolve', () => {
    expect(getOutputTarget('html').name).toBe('html')
    expect(getOutputTarget('bundle').name).toBe('bundle')
    expect(getOutputTarget('wordpress').name).toBe('wordpress')
  })
  it('VALID_TARGETS still contains every clinic target', () => {
    for (const t of ['html', 'bundle', 'wordpress']) expect(VALID_TARGETS).toContain(t)
  })
  it('internal target is registered and additive', () => {
    expect(getOutputTarget('internal').name).toBe('internal')
    expect(VALID_TARGETS).toHaveLength(4)
  })
})
