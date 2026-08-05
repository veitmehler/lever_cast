/**
 * Azavea vertical — B2B Practice Growth article calendar (vertical-platform
 * plan V3c). 26 topics, 2/week (Mon + Thu), audience = chiropractic practice
 * OWNERS (not patients). Themes mirror the master pitch: patient drift,
 * response speed, reviews, content economics, AI front desk.
 *
 * Idempotent: skips if the calendar already exists. Assigns the calendar to
 * the Azavea account. Edit topics here (single source of truth), re-run to
 * recreate: delete the calendar first if topics changed.
 *
 * Run: set -a; . ./.env; set +a; pnpm --filter @omniply/db exec tsx scripts/seed-azavea-calendar.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CALENDAR_NAME = 'Azavea — B2B Practice Growth'
const START = new Date('2026-08-10T00:00:00Z') // a Monday

interface TopicSeed {
  topic: string
  angle: string
  keywords: string[]
}

const TOPICS: TopicSeed[] = [
  {
    topic: 'Patient drift: the revenue leak your practice can’t see',
    angle:
      'Define patient drift (patients who don’t return regularly, without ever “leaving”). Show the math: visit value × missed visits per drifting patient × patients per year. Why it’s invisible in the P&L and how to spot it in your PMS data.',
    keywords: ['patient retention chiropractic', 'patient drift', 'chiropractic practice revenue'],
  },
  {
    topic: 'The first practice that responds wins: the speed-to-lead problem in chiropractic',
    angle:
      '78% of local-service buyers choose the first responder. Map the typical journey: 6pm search, form or call, response next morning — and where the patient went instead. Practical response-time fixes, from front-desk process to automation.',
    keywords: ['speed to lead', 'chiropractic new patients', 'missed calls practice'],
  },
  {
    topic: 'Retention economics: why keeping a patient is 5× cheaper than finding one',
    angle:
      'Acquisition cost vs retention cost for a typical practice. Lifetime value of a maintenance-care patient. Where retention actually breaks (communication gaps, not clinical outcomes).',
    keywords: ['patient lifetime value', 'chiropractic patient retention', 'practice growth'],
  },
  {
    topic: 'Google reviews are compound interest — most practices stop depositing',
    angle:
      'Review velocity vs review count: why 8 recent reviews beat 80 stale ones. The ask-timing problem, the front-desk script that works, and what NOT to do (gating, incentives — compliance risks).',
    keywords: ['google reviews chiropractor', 'review velocity', 'practice reputation'],
  },
  {
    topic: 'What actually moves a chiropractic practice up the Google map pack',
    angle:
      'The three local ranking factors (relevance, distance, prominence) translated to practice terms: GBP completeness, review signals, site content freshness, NAP consistency. What’s worth doing monthly vs once.',
    keywords: ['local SEO chiropractor', 'google map pack', 'google business profile chiropractic'],
  },
  {
    topic: 'Why practices post for three weeks and then stop (and what consistency is worth)',
    angle:
      'The content consistency graph: sporadic posting produces near-zero compounding. The real constraint is practitioner time, not ideas. What a sustainable cadence looks like and what it returns in 6 months.',
    keywords: ['chiropractic content marketing', 'social media consistency', 'practice marketing time'],
  },
  {
    topic: 'The AI front desk: what it should and shouldn’t do for a practice',
    angle:
      'A sober walkthrough: what an AI chat assistant can safely handle (hours, location, booking links, callbacks, guide delivery) and what it must never do (clinical advice, diagnosis, promises). Compliance-first framing builds trust.',
    keywords: ['AI receptionist chiropractic', 'AI chat for clinics', 'medical chatbot compliance'],
  },
  {
    topic: 'Win-back campaigns that don’t feel desperate',
    angle:
      'Reactivating lapsed patients: segmenting by last-visit date, the tone that works (helpful check-in vs discount blast), cadence, and the compliance line on health claims in outreach.',
    keywords: ['patient reactivation', 'win-back campaign clinic', 'chiropractic recall'],
  },
  {
    topic: 'Your website is a brochure. Here’s how practices turn it into an engine.',
    angle:
      'Brochure site vs capture engine: fresh educational content, lead magnets, an interactive self-check, chat capture. What each adds to conversion, with realistic numbers.',
    keywords: ['chiropractic website conversion', 'clinic lead generation', 'practice website'],
  },
  {
    topic: 'The newsletter your patients would actually read',
    angle:
      'Why most clinic newsletters die (promotional, irregular). What a magazine-style patient newsletter does for retention and referrals: staying top-of-mind between visits without selling.',
    keywords: ['patient newsletter', 'clinic email marketing', 'patient communication'],
  },
  {
    topic: 'Missed calls are missed patients: auditing your front desk’s leaky hour',
    angle:
      'Call data from local-service businesses: the lunch-hour and after-close miss rates. What a missed first call costs, and the recovery ladder: voicemail → text-back → AI assistant → callback workflow.',
    keywords: ['missed calls practice', 'front desk efficiency', 'after hours calls clinic'],
  },
  {
    topic: 'Educational content beats promotional content — the data and the why',
    angle:
      'What patients actually engage with: education about their daily problems (desk pain, sleep, morning stiffness) vs practice announcements. How education positions the practitioner as the obvious choice without advertising claims.',
    keywords: ['health content marketing', 'patient education content', 'chiropractic blog'],
  },
  {
    topic: 'The compliance line: what practice marketing can and cannot say',
    angle:
      'Advertising rules for health practices in plain language: no outcome guarantees, no testimonials in some jurisdictions, no fear-based claims. How compliant marketing can still be compelling — and why it ages better.',
    keywords: ['healthcare advertising rules', 'chiropractic marketing compliance', 'health claims marketing'],
  },
  {
    topic: 'Content production just got 100× cheaper. What that means for a solo practice.',
    angle:
      'The big change: AI collapsed the cost of producing consistent, quality content. Why the winners are practices that pair AI production with human review and their own clinical voice — not those who ignore it or fully automate it.',
    keywords: ['AI content marketing', 'AI for small business', 'practice marketing automation'],
  },
  {
    topic: 'The lead magnet playbook for clinics: guides patients actually download',
    angle:
      'What converts: specific daily-life problems (desk setup, sleep positions, morning routines) over generic “about chiropractic” brochures. The delivery-and-drip mechanics that turn a download into a first visit.',
    keywords: ['lead magnet healthcare', 'clinic lead generation', 'patient guides'],
  },
  {
    topic: 'From five hours a week to fifteen minutes: what “done-for-you” should actually mean',
    angle:
      'Time audit of DIY practice marketing (writing, posting, replying, designing). Where the owner’s 15 minutes genuinely matter (review, voice, approval) and what should never need them.',
    keywords: ['done for you marketing', 'practice owner time', 'marketing automation clinic'],
  },
  {
    topic: 'How patients choose: the trust ladder from Google search to booked visit',
    angle:
      'The decision sequence: search → map pack → reviews → website → content depth → booking friction. Where practices lose people at each rung, and the one improvement per rung with the best return.',
    keywords: ['patient journey', 'how patients choose a chiropractor', 'practice conversion'],
  },
  {
    topic: 'Five numbers that tell you if your practice marketing works',
    angle:
      'A practical dashboard: new-patient calls per week, response time, review velocity, returning-patient rate, website capture rate. How to measure each without new software.',
    keywords: ['practice marketing metrics', 'clinic KPIs', 'chiropractic practice numbers'],
  },
  {
    topic: 'Why generic marketing agencies keep failing chiropractors',
    angle:
      'The mismatch: agencies optimize for ad spend and vanity metrics; practices need retention, reviews and local trust. What vertical-specific marketing looks like and the questions to ask any provider (including us).',
    keywords: ['chiropractic marketing agency', 'healthcare marketing', 'agency vs software'],
  },
  {
    topic: 'How often should a practice contact its patients? The cadence question.',
    angle:
      'Too quiet = drift; too loud = unsubscribes. Evidence-based cadence by channel: newsletter monthly-to-fortnightly, social several times weekly, SMS rarely and transactionally. Matching cadence to patient lifecycle stage.',
    keywords: ['patient communication cadence', 'email frequency healthcare', 'patient engagement'],
  },
  {
    topic: 'The 6pm searcher: capturing patients your office hours can’t',
    angle:
      'Search volume for back-pain queries peaks evenings and weekends — exactly when the front desk is off. The after-hours capture stack: booking links, chat assistants, callback workflows, and what each recovers.',
    keywords: ['after hours lead capture', 'online booking chiropractic', '24/7 patient capture'],
  },
  {
    topic: 'Seasonality in a chiropractic practice — and planning content around it',
    angle:
      'The demand curve: New Year resolutions, spring gardening injuries, back-to-school desk time, winter slowdowns. How a content calendar that anticipates seasons outperforms reactive posting.',
    keywords: ['chiropractic seasonality', 'content calendar healthcare', 'practice demand planning'],
  },
  {
    topic: 'The anatomy of a practice that grows on autopilot: a systems view',
    angle:
      'Not a case study — a systems diagram. Presence (content + reviews) feeds Response (capture + speed) feeds Retention (communication + recall). Why fixing one layer alone underperforms and how the loop compounds.',
    keywords: ['practice growth system', 'marketing flywheel clinic', 'chiropractic business growth'],
  },
  {
    topic: 'What your reviews say about you when you don’t reply',
    angle:
      'Reply rate and reply quality as trust signals prospective patients read. Templates for the three review types (glowing, mixed, unfair) — compliant, human, and non-defensive.',
    keywords: ['responding to reviews', 'negative review response healthcare', 'google review replies'],
  },
  {
    topic: 'Voice AI is coming to the practice phone. Here’s the sober version.',
    angle:
      'Where phone AI genuinely helps (after-hours answering, promoting the booking link, callbacks with context) and where it must hand off. Setting patient expectations honestly — disclosure builds rather than breaks trust.',
    keywords: ['voice AI healthcare', 'AI phone answering', 'practice phone automation'],
  },
  {
    topic: 'Run the numbers on your own practice: a 3-minute self-audit',
    angle:
      'A guided self-audit mirroring the Practice X-Ray’s four axes: content presence, response speed, review engine, retention. Reader computes their own leak estimate; soft CTA to the interactive version. The most conversion-oriented piece in the calendar — still genuinely useful standalone.',
    keywords: ['practice audit', 'chiropractic marketing audit', 'practice revenue leak'],
  },
]

async function main() {
  const existing = await prisma.articleCalendar.findFirst({ where: { name: CALENDAR_NAME } })
  if (existing) {
    console.log(`Calendar already exists (${existing.id}) — delete it first to reseed topics.`)
    return
  }

  // Mon + Thu each week from START.
  const dates: Date[] = []
  for (let week = 0; dates.length < TOPICS.length; week++) {
    dates.push(new Date(START.getTime() + week * 7 * 86400_000))
    if (dates.length < TOPICS.length) dates.push(new Date(START.getTime() + (week * 7 + 3) * 86400_000))
  }

  const calendar = await prisma.articleCalendar.create({
    data: {
      name: CALENDAR_NAME,
      industry: 'b2b-practice-growth',
      topics: {
        create: TOPICS.map((t, i) => ({
          date: dates[i],
          topic: t.topic,
          angle: t.angle,
          keywords: t.keywords,
        })),
      },
    },
  })

  const account = await prisma.account.findFirst({ where: { vertical: 'azavea' }, select: { id: true } })
  if (account) {
    await prisma.account.update({ where: { id: account.id }, data: { articleCalendarId: calendar.id } })
  }
  console.log(`Created "${CALENDAR_NAME}" (${calendar.id}) with ${TOPICS.length} topics; assigned to ${account?.id ?? 'NO azavea account'}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
