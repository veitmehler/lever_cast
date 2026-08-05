/**
 * Agent action validation (.plans/chat-agent-v1.implementation-plan.md §2/§4).
 *
 * The model proposes at most one action per turn inside its JSON reply; the
 * SERVER decides whether it runs. Everything here is a whitelist: unknown
 * types, malformed fields, guide slugs that aren't live, or booking links
 * without a booking URL all collapse to null (reply still ships, action
 * doesn't). Pure module — unit-tested.
 */

export type AgentAction =
  | { type: 'send_booking_link' }
  | { type: 'offer_guide'; slug: string }
  | { type: 'capture_contact'; name: string; email: string; phone: string | null; guideSlug: string | null }
  | { type: 'request_callback'; name: string; phone: string; reason: string }

export interface ActionContext {
  /** Slugs of guides that are live AND deliverable for this account. */
  guideSlugs: string[]
  bookingAvailable: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

function validPhone(v: string): boolean {
  return v.replace(/\D/g, '').length >= 7 && v.length <= 30
}

/** Whitelist-validate a model-proposed action; null on anything off. */
export function validateAction(raw: unknown, ctx: ActionContext): AgentAction | null {
  if (typeof raw !== 'object' || raw === null) return null
  const a = raw as Record<string, unknown>

  switch (a.type) {
    case 'send_booking_link':
      return ctx.bookingAvailable ? { type: 'send_booking_link' } : null

    case 'offer_guide': {
      const slug = str(a.slug, 80)
      return ctx.guideSlugs.includes(slug) ? { type: 'offer_guide', slug } : null
    }

    case 'capture_contact': {
      const name = str(a.name, 60)
      const email = str(a.email, 254).toLowerCase()
      const phone = str(a.phone, 30)
      const guideSlug = str(a.guideSlug, 80)
      if (!name || !EMAIL_RE.test(email)) return null
      return {
        type: 'capture_contact',
        name,
        email,
        phone: phone && validPhone(phone) ? phone : null,
        guideSlug: guideSlug && ctx.guideSlugs.includes(guideSlug) ? guideSlug : null,
      }
    }

    case 'request_callback': {
      const name = str(a.name, 60)
      const phone = str(a.phone, 30)
      const reason = str(a.reason, 200)
      if (!name || !validPhone(phone)) return null
      return { type: 'request_callback', name, phone, reason }
    }

    default:
      return null
  }
}
