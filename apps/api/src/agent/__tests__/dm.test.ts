import { describe, expect, it } from 'vitest'
import { parseDmPayload } from '../dm'

describe('parseDmPayload (tolerant GHL workflow webhook shapes)', () => {
  it('reads customData mappings (the documented snapshot shape)', () => {
    const p = parseDmPayload({
      customData: { contact_id: 'c1', message_body: 'hi there', message_type: 'TYPE_INSTAGRAM', direction: 'inbound' },
    })
    expect(p).toEqual({ contactId: 'c1', message: 'hi there', messageType: 'TYPE_INSTAGRAM', direction: 'inbound' })
  })
  it('falls back to standard payload fields', () => {
    const p = parseDmPayload({ contact: { id: 'c2' }, message: { body: 'yo', type: 'FB', direction: 'inbound' } })
    expect(p.contactId).toBe('c2')
    expect(p.message).toBe('yo')
    expect(p.messageType).toBe('FB')
  })
  it('returns nulls on junk without throwing', () => {
    const p = parseDmPayload({ foo: 'bar' })
    expect(p.contactId).toBeNull()
    expect(p.message).toBeNull()
  })
})
