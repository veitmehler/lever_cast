import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * H1 regression guard: the global `NODE_TLS_REJECT_UNAUTHORIZED = '0'` override
 * disables TLS certificate verification for EVERY outbound connection in the
 * process (Clerk, OpenAI, S3, WordPress, ...). It was removed in H1; TLS for the
 * Postgres hop is handled scoped to the pg-boss connection instead. If this
 * assertion fails, someone re-introduced the process-wide override.
 */
const FILES = [
  '../index.ts',
  '../worker.ts',
  '../../scripts/migrate-user-keys-to-system.ts',
]

describe('no global TLS verification disable (H1)', () => {
  for (const rel of FILES) {
    it(`${rel} does not set NODE_TLS_REJECT_UNAUTHORIZED`, () => {
      const src = readFileSync(join(__dirname, rel), 'utf8')
      expect(src).not.toMatch(/NODE_TLS_REJECT_UNAUTHORIZED/)
    })
  }
})
