import { describe, it, expect, vi } from 'vitest'

// pg-boss pulls in native-ish deps at import; stub it so importing the module is cheap.
vi.mock('pg-boss', () => ({ default: class {} }))
vi.mock('../../lib/sentry', () => ({ Sentry: { captureException: vi.fn() } }))

import { withNoVerifySsl } from '../index'

describe('withNoVerifySsl', () => {
  it('rewrites sslmode=require to no-verify', () => {
    const out = withNoVerifySsl(
      'postgresql://u:p@private-host.db.ondigitalocean.com:25060/socioply_staging?sslmode=require',
    )
    expect(out).toContain('sslmode=no-verify')
    expect(out).not.toContain('sslmode=require')
  })

  it('adds sslmode=no-verify when none is present', () => {
    const out = withNoVerifySsl('postgresql://u:p@host:25060/db')
    expect(out).toContain('sslmode=no-verify')
  })

  it('preserves host, port, db, and credentials', () => {
    const out = withNoVerifySsl('postgresql://user:secret@host.example.com:25060/mydb?sslmode=require')
    expect(out).toContain('user:secret@host.example.com:25060')
    expect(out).toContain('/mydb')
  })

  it('returns the input unchanged if it is not a parseable URL', () => {
    expect(withNoVerifySsl('not-a-url')).toBe('not-a-url')
  })
})
