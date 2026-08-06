/**
 * Azavea vertical — B2B Practice Growth article calendar (vertical-platform
 * plan V3c; belief-arc revision 2026-08-05). 26 topics, 2/week (Mon + Thu),
 * audience = chiropractic practice OWNERS. Every angle is a Problem →
 * Solution → New Problem arc brief (framework #90): teach the system, never
 * the checklist; end on a rotated execution-wall flavor (time / consistency /
 * compliance / non-determinism / opportunity cost).
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
// Cadence: Mon/Wed/Fri starting Wednesday 2026-08-05 (user decision; slot 1 =
// the patient-drift arc article already published as the v6 draft).
const START = new Date('2026-08-05T00:00:00Z') // a Wednesday

interface TopicSeed {
  topic: string
  angle: string
  keywords: string[]
}

const TOPICS: TopicSeed[] = [
  {
    topic: 'Patient drift: the revenue leak your practice can’t see',
    angle:
      'PROBLEM: patient drift — active patients quietly stop returning without ever cancelling; show the per-practice math of the invisible loss and why the P&L hides it. SOLUTION BELIEF: drift is beaten by a constant-contact system — steady educational presence, newsletters and timely recall touches working together so patients never drift out of orbit; teach why constancy compounds where one-off reactivation blasts fail. NEW PROBLEM (time cost): running constant contact means producing content and touches every single week, forever — count the honest owner-hours. No DIY checklists.',
    keywords: ['patient retention chiropractic', 'patient drift', 'chiropractic practice revenue'],
  },
  {
    topic: 'The first practice that responds wins: the speed-to-lead problem in chiropractic',
    angle:
      'PROBLEM: 78% of local-service buyers choose the first responder; map the 6pm-search journey and where the patient went instead. SOLUTION BELIEF: a capture-and-respond system that answers in minutes at any hour — instant booking paths, immediate follow-up; teach why response speed beats ad spend. NEW PROBLEM (non-determinism): bolting together generic AI chat tools looks quick, but their answers are unpredictable and unsupervised — in a health setting an unpredictable answer is a liability, and babysitting the tool eats the time it promised to save. No setup tutorials.',
    keywords: ['speed to lead', 'chiropractic new patients', 'missed calls practice'],
  },
  {
    topic: 'Retention economics: why keeping a patient is 5× cheaper than finding one',
    angle:
      'PROBLEM: acquisition costs ~5-7× retention, yet practice spending runs the opposite direction; show the math both ways. SOLUTION BELIEF: retention is an engineered outcome of systematic communication — education between visits, newsletters, recall — not a front-desk personality trait; teach the compounding lifetime-value mechanism. NEW PROBLEM (opportunity cost): the owner CAN run this — by becoming the practice’s part-time marketer; every hour writing emails is an hour not adjusting patients, and the math on that trade is brutal. No how-to steps.',
    keywords: ['patient lifetime value', 'chiropractic patient retention', 'practice growth'],
  },
  {
    topic: 'Google reviews are compound interest — most practices stop depositing',
    angle:
      'PROBLEM: review velocity beats review count — 8 recent reviews outrank 80 stale ones; show how dormant review profiles decay in the map pack. SOLUTION BELIEF: a review engine — systematic, well-timed asks woven into patient flow plus consistent responses — compounds like deposits; teach the velocity mechanism, and the compliance line (no gating, no incentives). NEW PROBLEM (consistency decay): every manual review system works for three weeks and dies the first busy Monday; the mechanism only pays if it never skips — which is precisely what humans are worst at. No scripts.',
    keywords: ['google reviews chiropractor', 'review velocity', 'practice reputation'],
  },
  {
    topic: 'What actually moves a chiropractic practice up the Google map pack',
    angle:
      'PROBLEM: owners burn money on ads while the map pack — where patients actually choose — is decided by relevance, prominence and freshness signals they never touch. SOLUTION BELIEF: local visibility is a system of continuous signals: fresh site content, review velocity, complete profiles reinforcing each other; teach why Google rewards sustained signals over bursts. NEW PROBLEM (time cost): every one of those signals demands weekly production — articles, responses, updates; total the hours honestly and it is a part-time role. No SEO tutorials.',
    keywords: ['local SEO chiropractor', 'google map pack', 'google business profile chiropractic'],
  },
  {
    topic: 'Why practices post for three weeks and then stop (and what consistency is worth)',
    angle:
      'PROBLEM: the sporadic-posting graph — enthusiasm, decay, silence — and why intermittent presence compounds to nearly zero. SOLUTION BELIEF: consistency is the entire game; a practice visible every week for a year builds an asset a burst-poster never touches; teach the compounding-attention mechanism. NEW PROBLEM (compliance): the shortcut everyone tries is ChatGPT — it writes fine posts, but it does not know what a health practice is legally allowed to claim, and it will confidently write outcome promises the owner then publishes under their own name; between the prompting, the checking and the fixing, the time saving evaporates. No content-calendar templates.',
    keywords: ['chiropractic content marketing', 'social media consistency', 'practice marketing time'],
  },
  {
    topic: 'The AI front desk: what it should and shouldn’t do for a practice',
    angle:
      'PROBLEM: patients ask questions at 9pm; front desks answer at 9am; the gap leaks bookings daily. SOLUTION BELIEF: a compliance-first AI assistant that handles logistics (hours, location, booking, callbacks) and refuses clinical territory — teach why the refusal IS the feature in a regulated field. NEW PROBLEM (non-determinism): generic chatbots bolted onto a clinic site are non-deterministic — nobody knows what they said until a patient screenshots it; a safe assistant needs engineered guardrails, red-flag interception and audit trails, which is a build, not a plugin. No bot-setup guides.',
    keywords: ['AI receptionist chiropractic', 'AI chat for clinics', 'medical chatbot compliance'],
  },
  {
    topic: 'Win-back campaigns that don’t feel desperate',
    angle:
      'PROBLEM: lapsed-patient files are the largest untapped asset in the practice, but clumsy reactivation (discount blasts, guilt) burns the list. SOLUTION BELIEF: win-back works as a respectful, well-timed sequence — check-in, friction-removal, graceful exit — sent from the practice’s real voice; teach the psychology of why warmth outperforms urgency. NEW PROBLEM (consistency decay): the sequence only works when the drift report is pulled and acted on every single week; skip two weeks and the backlog makes the list stale — manual recall dies of its own administration. No email templates.',
    keywords: ['patient reactivation', 'win-back campaign clinic', 'chiropractic recall'],
  },
  {
    topic: 'Your website is a brochure. Here’s how practices turn it into an engine.',
    angle:
      'PROBLEM: most practice sites are static brochures — they inform the already-convinced and capture nothing; show the visitor math. SOLUTION BELIEF: an engine site works around the clock — fresh educational content pulling search traffic, interactive self-checks capturing curiosity, guides converting readers into contacts, chat capturing questions; teach the visitor-to-patient pipeline as a system. NEW PROBLEM (skills stack): building that engine spans copywriting, SEO, design, automation and compliance — five disciplines the owner would need to hire or become; the brochure site persists not from ignorance but because the stack is genuinely hard. No website to-do lists.',
    keywords: ['chiropractic website conversion', 'clinic lead generation', 'practice website'],
  },
  {
    topic: 'The newsletter your patients would actually read',
    angle:
      'PROBLEM: clinic newsletters die because they are promotional, irregular, and about the clinic instead of the reader. SOLUTION BELIEF: a magazine-style patient newsletter — genuinely useful, life-adjacent education in the practice’s voice — keeps the practice top-of-mind between visits and quietly drives recall; teach why being useful beats being promotional. NEW PROBLEM (time cost): a magazine issue is real editorial work — topics, writing, layout, sending — every fortnight, forever; the honest hours are why almost no practice sustains one. No newsletter templates.',
    keywords: ['patient newsletter', 'clinic email marketing', 'patient communication'],
  },
  {
    topic: 'Missed calls are missed patients: auditing your front desk’s leaky hour',
    angle:
      'PROBLEM: the lunch-hour and after-close miss rates; each missed first call is a patient who called the next practice; show the weekly math. SOLUTION BELIEF: a recovery ladder — text-back, after-hours assistant, callback workflow with context — catches what the desk physically cannot; teach the caller-behavior data. NEW PROBLEM (opportunity cost): patching this manually means the owner or staff monitoring queues and returning calls in gaps that do not exist; the fix must run itself or it becomes another job on someone who already has one. No phone-system comparisons.',
    keywords: ['missed calls practice', 'front desk efficiency', 'after hours calls clinic'],
  },
  {
    topic: 'Educational content beats promotional content — the data and the why',
    angle:
      'PROBLEM: promotional posts get ignored; practices conclude “content doesn’t work” after feeding patients ads. SOLUTION BELIEF: education about the reader’s daily problems earns attention and positions the practitioner as the obvious choice — teach the trust-transfer mechanism with engagement data. NEW PROBLEM (compliance): educational health content has rules — claims, disclaimers, YMYL standards; generic AI will draft “educational” posts that cross lines the owner does not know exist, and checking every line requires exactly the expertise the owner lacks time to apply. No content-idea lists.',
    keywords: ['health content marketing', 'patient education content', 'chiropractic blog'],
  },
  {
    topic: 'The compliance line: what practice marketing can and cannot say',
    angle:
      'PROBLEM: health-practice advertising is regulated — outcome promises, testimonials, fear appeals can each trigger board trouble; most owners learn the lines the hard way. SOLUTION BELIEF: compliant marketing is a system property, not a review step — rails built into how every piece is produced; teach why compliant content also ages better and builds more trust. NEW PROBLEM (non-determinism): this is where generic AI is most dangerous — it does not know these rules exist and writes violations fluently; every AI-drafted piece needs expert review, which means the tool amplified the workload it promised to remove. No legal checklists (and no legal advice).',
    keywords: ['healthcare advertising rules', 'chiropractic marketing compliance', 'health claims marketing'],
  },
  {
    topic: 'Content production just got 100× cheaper. What that means for a solo practice.',
    angle:
      'PROBLEM: AI collapsed content production costs — and every practice’s competitors got the same discount; standing still now means falling behind. SOLUTION BELIEF: the winners pair AI production with human review, a real voice, and systematic distribution — teach why raw capability without a system produces noise, not growth. NEW PROBLEM (skills stack): wielding AI well is itself a skill stack — prompting, editing, brand voice, compliance, scheduling; the tool is cheap, the operation of the tool is not; count what “free” actually costs weekly. No tool tutorials.',
    keywords: ['AI content marketing', 'AI for small business', 'practice marketing automation'],
  },
  {
    topic: 'The lead magnet playbook for clinics: guides patients actually download',
    angle:
      'PROBLEM: generic “about chiropractic” brochures convert nobody; practices conclude lead magnets don’t work. SOLUTION BELIEF: magnets tied to specific daily problems (desk pain, sleep, mornings) convert because they meet a felt need — and the magnet is only the door: the delivery-and-drip system behind it turns a download into a first visit; teach the full corridor. NEW PROBLEM (time cost): a working magnet system means designed guides, delivery automation, and follow-up sequences — built once, maintained forever; the corridor is why most practices stop at a PDF nobody downloads. No guide-writing instructions.',
    keywords: ['lead magnet healthcare', 'clinic lead generation', 'patient guides'],
  },
  {
    topic: 'From five hours a week to fifteen minutes: what “done-for-you” should actually mean',
    angle:
      'PROBLEM: audit the owner’s real marketing hours — writing, posting, replying, designing — and what those hours cost at the owner’s clinical rate. SOLUTION BELIEF: the owner’s irreplaceable 15 minutes are voice, review and approval; everything else is systematizable; teach the division of labor that actually respects the clinician’s time. NEW PROBLEM (non-determinism): half-automating with generic tools keeps the owner in the loop for every output because none can be trusted sight-unseen — review-everything is the hidden tax of unpredictable tools. No productivity hacks.',
    keywords: ['done for you marketing', 'practice owner time', 'marketing automation clinic'],
  },
  {
    topic: 'How patients choose: the trust ladder from Google search to booked visit',
    angle:
      'PROBLEM: patients climb a ladder — search, map pack, reviews, site, content depth, booking friction — and practices lose people at rungs they cannot see. SOLUTION BELIEF: the ladder is a system: each rung reinforces the next, and the practice that maintains all rungs wins by default; teach the full climb with drop-off math. NEW PROBLEM (consistency decay): every rung decays without maintenance — stale content, unanswered reviews, dead links; maintaining six rungs weekly is the real job description hiding inside “just be visible online”. No audit checklists.',
    keywords: ['patient journey', 'how patients choose a chiropractor', 'practice conversion'],
  },
  {
    topic: 'Five numbers that tell you if your practice marketing works',
    angle:
      'PROBLEM: owners fly blind or drown in vanity metrics; neither tells them if marketing works. SOLUTION BELIEF: five numbers matter — new-patient calls, response time, review velocity, returning-patient rate, capture rate; teach what each reveals and how they interlock as a system diagnosis. NEW PROBLEM (opportunity cost): tracking five numbers weekly across five tools is admin the owner does instead of clinical work — measurement itself becomes overhead unless the system reports on itself. Explain the numbers; no spreadsheet templates.',
    keywords: ['practice marketing metrics', 'clinic KPIs', 'chiropractic practice numbers'],
  },
  {
    topic: 'Why generic marketing agencies keep failing chiropractors',
    angle:
      'PROBLEM: agencies optimize ad spend and vanity metrics; practices need retention, reviews and local trust — the mismatch burns budgets; name the pattern honestly. SOLUTION BELIEF: what works is vertical-specific systems built around how patients actually choose and return — teach the difference between renting attention and building assets. NEW PROBLEM (skills stack): the alternative to the wrong agency is not DIY — it is the same five-discipline stack, now without help; the real question is who operates the right system, not whether to have one. Fair, specific, no agency-bashing.',
    keywords: ['chiropractic marketing agency', 'healthcare marketing', 'agency vs software'],
  },
  {
    topic: 'How often should a practice contact its patients? The cadence question.',
    angle:
      'PROBLEM: too quiet = drift, too loud = unsubscribes; owners guess and get both wrong at once. SOLUTION BELIEF: cadence is solvable by channel and lifecycle stage — teach the evidence-based rhythm and the segmentation principle that makes frequency welcome instead of annoying. NEW PROBLEM (consistency decay): a cadence is a promise — monthly means every month, forever; the calendar does not care that the clinic got busy, and broken cadence is worse than none; sustaining the promise is the hidden difficulty. No send-schedule templates.',
    keywords: ['patient communication cadence', 'email frequency healthcare', 'patient engagement'],
  },
  {
    topic: 'The 6pm searcher: capturing patients your office hours can’t',
    angle:
      'PROBLEM: back-pain searches peak evenings and weekends — exactly when the desk is dark; show the after-hours volume math. SOLUTION BELIEF: an always-on capture layer — booking paths, compliant chat, callback workflows with context — converts the 6pm searcher the morning voicemail loses; teach the response-window evidence. NEW PROBLEM (compliance): after-hours automation in health has rules the generic tools ignore — an unsupervised bot giving quasi-clinical answers at midnight is a board complaint waiting to happen; safe after-hours capture is engineered, not installed. No tool comparisons.',
    keywords: ['after hours lead capture', 'online booking chiropractic', '24/7 patient capture'],
  },
  {
    topic: 'Seasonality in a chiropractic practice — and planning content around it',
    angle:
      'PROBLEM: chiro demand is seasonal — resolutions, gardening season, back-to-school desks, winter dips — and reactive posting always arrives a month late. SOLUTION BELIEF: a content calendar that anticipates the curve meets patients at the moment of need; teach the seasonal-demand data and the lead-time principle. NEW PROBLEM (time cost): anticipating seasons means planning and producing quarters ahead while running this quarter — a newsroom discipline layered on a clinical schedule; the lead-time is the moat. No calendar templates.',
    keywords: ['chiropractic seasonality', 'content calendar healthcare', 'practice demand planning'],
  },
  {
    topic: 'The anatomy of a practice that grows on autopilot: a systems view',
    angle:
      'PROBLEM: practices fix one layer — some content, or some ads, or a review push — and wonder why growth stalls; single-layer fixes underperform structurally. SOLUTION BELIEF: growth compounds when Presence (content + reviews) feeds Response (capture + speed) feeds Retention (communication + recall) as one loop; teach the flywheel and why each layer multiplies the others. NEW PROBLEM (skills stack): operating the full loop is the workload of a small marketing team — the reason single-layer fixes are popular is that the loop is hard; name that honestly. This is the systems-thesis article: diagram-friendly, no implementation steps.',
    keywords: ['practice growth system', 'marketing flywheel clinic', 'chiropractic business growth'],
  },
  {
    topic: 'What your reviews say about you when you don’t reply',
    angle:
      'PROBLEM: prospective patients read the practice’s replies as character evidence — silence, defensiveness and copy-paste all say something; show the reader-psychology. SOLUTION BELIEF: consistent, human, compliant responses — grateful, non-defensive, never clinical — turn the review page into a trust asset; teach the principles per review type. NEW PROBLEM (consistency decay): reply discipline is a forever-cadence on an unpredictable trigger; the practice that replies for a month and stops looks worse than one that never started. Principles only, no response templates.',
    keywords: ['responding to reviews', 'negative review response healthcare', 'google review replies'],
  },
  {
    topic: 'Voice AI is coming to the practice phone. Here’s the sober version.',
    angle:
      'PROBLEM: the practice phone is the biggest capture channel and the least covered — and vendors are now selling voice AI with promises that outrun the technology. SOLUTION BELIEF: the sober version works — after-hours answering that promotes booking, captures callbacks with context, and hands off anything clinical; teach where voice genuinely helps and where it must refuse. NEW PROBLEM (non-determinism): an unpredictable voice on the practice’s phone line is the highest-stakes version of the generic-AI problem — every sentence is spoken under the practice’s name in a regulated field; guardrails and disclosure are the difference between an asset and an incident. No vendor comparisons.',
    keywords: ['voice AI healthcare', 'AI phone answering', 'practice phone automation'],
  },
  {
    topic: 'Run the numbers on your own practice: a 3-minute self-audit',
    angle:
      'PROBLEM: owners feel the leak but have never computed it; guide a self-audit across the four axes — content presence, response speed, review engine, retention — reader computes their own number. SOLUTION BELIEF: seeing the number reframes marketing from expense to leak-repair; teach what each axis reveals. NEW PROBLEM (opportunity cost): closing all four axes is the part-time job this series has been honest about — and the reader now has their own number for what NOT closing them costs; the interactive Practice X-Ray does this audit properly in three minutes. This is the series capstone: most conversion-forward piece, still genuinely useful standalone.',
    keywords: ['practice audit', 'chiropractic marketing audit', 'practice revenue leak'],
  },
]

async function main() {
  const existing = await prisma.articleCalendar.findFirst({ where: { name: CALENDAR_NAME } })
  if (existing) {
    console.log(`Calendar already exists (${existing.id}) — delete it first to reseed topics.`)
    return
  }

  // Mon/Wed/Fri from START (START itself included when it lands on M/W/F).
  const dates: Date[] = []
  for (let d = new Date(START); dates.length < TOPICS.length; d.setUTCDate(d.getUTCDate() + 1)) {
    const dow = d.getUTCDay()
    if (dow === 1 || dow === 3 || dow === 5) dates.push(new Date(d))
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
          // Belief-arc framework (#90, isActive:false — pin-only). The
          // azavea-gated content-batch mapping carries this to the Topic.
          outlineFrameworkNumber: 90,
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
