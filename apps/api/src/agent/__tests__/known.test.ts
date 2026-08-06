import { describe, expect, it } from 'vitest'
import { knownDetailsPromptBlock, primaryEmailOf, type KnownDetails } from '../known'

const base: KnownDetails = { name: null, phone: null, leadEmail: null, preferredEmail: null }

describe('primaryEmailOf (user-locked: deliberately-chosen callback email wins the primary slot)', () => {
  it('falls back to the lead-gen email when no preferred email exists', () => {
    expect(primaryEmailOf({ ...base, leadEmail: 'guides@x.com' })).toBe('guides@x.com')
  })
  it('prefers the add_contact_email address over the capture email', () => {
    expect(primaryEmailOf({ ...base, leadEmail: 'guides@x.com', preferredEmail: 'real@x.com' })).toBe('real@x.com')
  })
  it('is null when nothing is known', () => {
    expect(primaryEmailOf(base)).toBeNull()
  })
})

describe('knownDetailsPromptBlock', () => {
  it('renders a placeholder when nothing is captured', () => {
    expect(knownDetailsPromptBlock(base)).toBe('(nothing captured yet)')
  })
  it('lists name, phone and the current primary email', () => {
    const block = knownDetailsPromptBlock({ name: 'Sam', phone: '07 5555 1234', leadEmail: 'a@x.com', preferredEmail: 'b@x.com' })
    expect(block).toContain('Name: Sam')
    expect(block).toContain('Phone: 07 5555 1234')
    expect(block).toContain('Email on file: b@x.com')
    expect(block).not.toContain('a@x.com')
  })
})
