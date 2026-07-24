/**
 * Chiropractor-specific Omniply sales page (marketing-site plan).
 * Same Klaff skeleton as /home, chiro ammunition throughout.
 */
import type { Metadata } from 'next'
import {
  TOKENS,
  Cta,
  Eyebrow,
  Section,
  H2,
  P,
  Bullet,
  ConsistencyGraph,
  VarianceDiagram,
  PipelineDiagram,
  TouchpointGraph,
  ReactivationLoop,
  PricingBlock,
} from '@/components/marketing/Marketing'

export const metadata: Metadata = {
  title: 'Omniply for Chiropractors — Your Practice, Marketed Every Week Without You',
  description:
    'The content system elite chiropractic coaches teach, fully automated: articles, newsletters, social, lead magnets and Google reviews in your voice. $397/mo flat.',
}

export default function ChiropractorsPage() {
  return (
    <main>
      {/* ── Hook ── */}
      <Section dark>
        <Eyebrow>Omniply for Chiropractors</Eyebrow>
        <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-5xl" style={{ textWrap: 'balance' } as React.CSSProperties}>
          Somewhere in your town tonight, a person with back pain is choosing a chiropractor. The one they
          choose is the one they keep seeing everywhere.
        </h1>
        <P lead>
          Omniply markets your practice every single week, in your voice, on every channel your patients
          actually look at. You adjust spines. It handles the showing up.
        </P>
        <Cta sub="Onboarding capped at 74 practices this quarter">Set up your account right now</Cta>
      </Section>

      {/* ── Problem reframe ── */}
      <Section>
        <Eyebrow>The real problem</Eyebrow>
        <H2>You already know the playbook. The problem is that it never survives a busy week.</H2>
        <P>
          The high-end chiropractic coaches all teach the same growth system, and they charge thousands for
          it: educate your community weekly, email your list every week, stay visible on social, give
          prospects something valuable, and keep your Google reviews climbing. It works. Their best clients
          prove it works.
        </P>
        <P>
          <strong>But the system has a brutal requirement: it only compounds if it runs every week.</strong>{' '}
          After your last patient. After the notes. After the family gets their share of you. That is when the
          newsletter is supposed to get written, and that is exactly when it does not.
        </P>
        <ConsistencyGraph />
        <P>
          This is not a discipline failure. <strong>You are a clinician running a business, and content is the
          first casualty of every full schedule.</strong> The practices that grow are simply the ones where
          the content goes out anyway.
        </P>
      </Section>

      {/* ── Why the obvious fixes fail ── */}
      <Section>
        <Eyebrow>Why the obvious fixes fail</Eyebrow>
        <H2>You tried ChatGPT. It sounded like everyone else. Here is the deeper reason.</H2>
        <P>
          AI assistants are impressive until you rely on them. Ask for a post and you get something generic
          about wellness that any clinic in any suburb could have published. The newer AI agents are worse in
          a sneakier way: brilliant one day, off-brand the next, because <strong>they improvise every time
          instead of running a fixed system.</strong> Engineers call it non-determinism. You would call it an
          intern you cannot trust with your name.
        </P>
        <P>
          And in healthcare that is not a cosmetic problem. One overclaiming sentence about what an adjustment
          treats is a compliance headache waiting to happen. So you end up reading every word anyway, which
          means you bought a tool and inherited a supervision job.
        </P>
        <VarianceDiagram />
        <P>
          <strong>A real system produces dependable output with guardrails built in,</strong> so your review
          takes two minutes over coffee, not an evening with a red pen.
        </P>
      </Section>

      {/* ── The Omniply frame ── */}
      <Section dark>
        <Eyebrow>The Omniply frame</Eyebrow>
        <H2>The coaches&apos; system, running as software. In your voice. Every week. Without you.</H2>
        <P lead>
          Omniply learns your voice in a guided onboarding where you literally talk to it about your practice.
          Then it runs the whole playbook: patient-education articles on your website, a weekly newsletter
          your patients actually read, social posts with designed visuals, branded lead-magnet guides, and a
          steady engine for Google reviews. Everything stops at one review gate where you approve with a
          click.
        </P>
        <PipelineDiagram />
        <P>
          Health-content guardrails are built into every generator: no overclaiming, no miracle language,
          nothing you would wince at. It writes like a careful clinician who happens to be great at
          marketing. Because that is exactly what it learned from: you.
        </P>
      </Section>

      {/* ── Money math ── */}
      <Section>
        <Eyebrow>The money math</Eyebrow>
        <H2>More touchpoints turn more prospects into patients. And more past patients into rebookings.</H2>
        <P>
          A person searching for back-pain help does not book on first contact. They lurk. They read one of
          your articles, see a post, get your guide on desk posture, read two more emails, and then book. Every
          missing touchpoint is a patient who booked somewhere else.
        </P>
        <TouchpointGraph />
        <P>
          Then there is the revenue already sitting in your files: <strong>every patient who stopped coming has
          a spine that did not stop needing care.</strong> They did not leave you. Life just got loud. A weekly
          newsletter is the quiet tap on the shoulder that fills next week&apos;s schedule with people who
          already know and trust you.
        </P>
        <ReactivationLoop />
      </Section>

      {/* ── Bencivenga bullets ── */}
      <Section>
        <Eyebrow>What you actually get</Eyebrow>
        <H2>Everything the coaches tell you to do, done for you.</H2>
        <ul>
          <Bullet head="A voice-cloning onboarding you talk through in minutes,">
            so your newsletters sound like you talking to a patient at the table, not like a content farm
            wearing your logo.
          </Bullet>
          <Bullet head="Weekly patient-education articles published to your website,">
            mapped to a chiropractic seasonal calendar, so sciatica content lands in gardening season and
            posture content when the school year starts.
          </Bullet>
          <Bullet head="A weekly newsletter with 25,000 sends a month included,">
            the single highest-leverage habit in practice marketing, running without you and costing nothing
            extra per send.
          </Bullet>
          <Bullet head="A library of branded lead-magnet guides in your colors with your logo,">
            desk-worker survival guides, sleep guides, first-visit explainers, ready for your front desk and
            your ads on day one.
          </Bullet>
          <Bullet head="A printed QR card for your front desk plus review follow-ups,">
            so the patient who just said &quot;I feel so much better&quot; becomes a five-star Google review
            while the feeling is still fresh.
          </Bullet>
          <Bullet head="Social posts with designed graphics, scheduled and published for you,">
            so your practice looks alive and current to every prospect who checks, which is all of them.
          </Bullet>
          <Bullet head="One approval inbox for all of it,">
            two minutes with your morning coffee, and your entire week of marketing ships.
          </Bullet>
        </ul>
      </Section>

      {/* ── Pricing ── */}
      <Section>
        <Eyebrow>The number</Eyebrow>
        <H2>Less than one new patient a month. For all of it.</H2>
        <PricingBlock vertical />
        <P>
          One flat price. If one article brings you one new patient this year, the system has likely paid for
          itself. It will publish fifty-two of them.
        </P>
      </Section>

      {/* ── Founder + proof ── */}
      <Section>
        <Eyebrow>Who built this</Eyebrow>
        <H2>Built by someone who spent 16 years marketing practices like yours by hand.</H2>
        <P>
          I have run marketing for chiropractors and health professionals for 16 years, and scaled online
          businesses from obscurity to six figures a month. The playbook inside Omniply is the exact system
          the top practice coaches teach their private clients to run manually. I have watched it transform
          practices, and I have watched it quietly die in busy months, over and over, for one reason only:
          humans cannot ship every week forever.
        </P>
        <P>
          So I learned to code and spent years building the version that can. <strong>Omniply does not get
          tired, does not get busy, and has never once skipped a week.</strong>
        </P>
      </Section>

      {/* ── Close ── */}
      <Section dark>
        <H2>74 practices this quarter. That is the cap, and it is real.</H2>
        <P lead>
          Voice onboarding and brand setup take real attention per practice, and the practices already inside
          come first. When the 74 spots are taken, the door closes until next quarter.
        </P>
        <P>
          A year from now your practice will either have 52 weeks of compounding content working for it, or
          another year of good intentions. The only difference is what you do in the next five minutes.
        </P>
        <Cta sub="$397/mo flat · everything included · cancel any month">
          Set up your account right now
        </Cta>
      </Section>

      <footer className="px-6 py-10 text-center text-sm" style={{ background: TOKENS.inkDeep, color: 'rgba(255,255,255,0.55)' }}>
        <p>Omniply · Built for chiropractic practices</p>
        <p className="mt-2">
          <a href="/home" className="underline">Not a chiropractor? See the Omniply platform</a>
        </p>
      </footer>
    </main>
  )
}
