/**
 * Generic Omniply platform sales page (marketing-site plan).
 * Served at `/` on the marketing hosts (middleware rewrite) and directly at
 * /home for review. Klaff skeleton, Kern connective tissue, Bencivenga
 * bullets, dash-free house style.
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
  Faq,
  FaqJsonLd,
  type FaqEntry,
} from '@/components/marketing/Marketing'

export const metadata: Metadata = {
  title: 'Omniply — The Content Operating System for Local Practices',
  description:
    'Articles, newsletters, social posts, lead magnets and review growth. Generated in your voice, approved by you, published every week without you. $397/mo flat.',
}

const FAQ_ITEMS: FaqEntry[] = [
  {
    q: 'How is this different from just using ChatGPT?',
    a: 'ChatGPT is a blank box that waits for you to be good at prompting, and it forgets you between sessions. Omniply is a pipeline: it learns your voice once, runs on a fixed weekly schedule, applies compliance and brand guardrails to every piece, and publishes to your website, email list and social accounts automatically. You approve output. You never prompt anything.',
  },
  {
    q: 'Will it really sound like me?',
    a: 'That is the whole point of the onboarding. You talk, in your own words, about your business and the people you serve. The system studies how you actually speak and writes in that voice from day one. Most owners say the spooky moment is reading their first newsletter and hearing themselves in it.',
  },
  {
    q: 'How much of my time does this take?',
    a: 'Setup is a guided conversation of roughly ten to fifteen minutes. After that, your job is a review pass measured in minutes per week: read, click approve, done. Everything else, including publishing and scheduling, happens without you.',
  },
  {
    q: 'What exactly is included in the $397?',
    a: 'Everything. Weekly articles, the weekly newsletter with 25,000 email sends a month, social posts with designed graphics, your branded lead-magnet library, and the review growth engine. There are no per-piece fees, no content credits, and no surprise line items.',
  },
  {
    q: 'What if I do not like a piece of content?',
    a: 'Nothing goes out without your approval. If a piece misses, you reject it with a note and the system regenerates it with your feedback applied. Your name never appears on anything you have not signed off.',
  },
  {
    q: 'Do I need to be technical?',
    a: 'No. If you can answer questions about your own business and click an approve button, you have every skill required. The setup conversation feels like talking to a sharp marketing consultant, not configuring software.',
  },
  {
    q: 'Can I cancel? What happens to my content?',
    a: 'You can cancel any month. Everything already published stays published, because it was always yours: your website, your email list, your social accounts, your documents.',
  },
  {
    q: 'Why only 74 practices this quarter?',
    a: 'Because onboarding is the moment we clone your voice and set up your brand properly, and we refuse to rush it. The cap is our real capacity for doing that well while serving the practices already inside. When the spots are gone, the door closes until next quarter.',
  },
]

export default function HomePage() {
  return (
    <main>
      {/* ── Hook ── */}
      <Section dark>
        <Eyebrow>Omniply</Eyebrow>
        <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-5xl" style={{ textWrap: 'balance' } as React.CSSProperties}>
          Your next customer chose your competitor last month. Not because they are better. Because they kept showing up.
        </h1>
        <P lead>
          Omniply is the content operating system for local practices. It writes, designs and publishes your
          marketing every single week, in your voice, across every channel, with you approving the output
          instead of producing it.
        </P>
        <Cta sub="Onboarding capped at 74 practices this quarter">Set up your account right now</Cta>
      </Section>

      {/* ── Problem reframe ── */}
      <Section>
        <Eyebrow>The real problem</Eyebrow>
        <H2>You do not have a marketing problem. You have a consistency problem.</H2>
        <P>
          You already know what works: useful articles, a weekly newsletter, social posts that sound like you,
          something valuable to give prospects, a steady stream of reviews. None of this is a secret. High-end
          practice coaches charge thousands to teach exactly this system, and their clients grow with it.
        </P>
        <P>
          <strong>The catch is that the system only works if it runs every week.</strong> Not the weeks you feel
          inspired. Not the weeks between patient emergencies. Every week, for years. Attention compounds like
          interest, and every gap resets the curve.
        </P>
        <ConsistencyGraph />
        <P>
          Here is the honest part: <strong>you were never going to sustain it manually, and neither is anyone
          you hire at a sane price.</strong> You run a practice. Content is the first thing dropped in a busy
          week, and every week is a busy week.
        </P>
      </Section>

      {/* ── Why the obvious fixes fail ── */}
      <Section>
        <Eyebrow>Why the obvious fixes fail</Eyebrow>
        <H2>ChatGPT does not solve this. Neither do AI agents. Here is why.</H2>
        <P>
          You have probably tried the AI route. Everyone has. And the tools are genuinely impressive right up
          until you rely on them. Ask ChatGPT for a post and you get something generic that sounds like every
          other practice in town. Wire up an AI agent like Claude Code or OpenClaw and you have a brilliant
          intern with no memory of your brand, no publishing pipeline, and a different personality every
          morning.
        </P>
        <P>
          <strong>The technical word for the problem is non-determinism.</strong> Agents improvise. Run the same
          request twice and you get two different results, two different tones, two different levels of
          compliance risk. Which means a human still has to check every output, every day. That is not
          automation. That is a supervision job you just gave yourself, on top of the one you already have.
        </P>
        <VarianceDiagram />
        <P>
          An assistant that is 90 percent right every day is a part-time employee.{' '}
          <strong>A system is only a system if the output is dependable enough that checking it takes minutes,
          not hours.</strong>
        </P>
        <P>
          And here is the part nobody says out loud: <strong>most people get mediocre results from AI because
          prompting is a craft, and they are beginners at it.</strong> We have spent years inside these models,
          engineering the prompts, the research chains and the guardrails that force AI to do deep, careful
          work instead of confident guessing. That expertise is baked into every generator in Omniply. You get
          expert-level output every single time, without spending your evenings becoming a prompt engineer.
        </P>
      </Section>

      {/* ── The Omniply frame ── */}
      <Section dark>
        <Eyebrow>The Omniply frame</Eyebrow>
        <H2>Deterministic content. Your voice. A review gate. Then it ships without you.</H2>
        <P lead>
          Omniply is not an assistant you prompt. It is a pipeline that runs. It learns your voice once, deeply,
          during a guided onboarding. Then it produces your articles, newsletters, social posts and lead
          magnets on a fixed weekly rhythm, holds them at a review gate where you approve with one click, and
          publishes them across every channel on schedule.
        </P>
        <PipelineDiagram />
        <P>
          The same input produces the same quality, week after week. Guardrails keep claims compliant and
          on-brand. And the one thing the machine never does is skip a week.
        </P>
      </Section>

      {/* ── Money math ── */}
      <Section>
        <Eyebrow>The money math</Eyebrow>
        <H2>Consistency is not a virtue. It is a conversion multiplier.</H2>
        <P>
          Prospects rarely buy on first contact. They buy after they have seen you be useful seven, nine,
          twelve times. Every touchpoint you fail to send quietly hands the sale to whoever kept showing up.
        </P>
        <TouchpointGraph />
        <P>
          And the fastest revenue is not even new prospects. It is past customers who simply drifted, and who
          come back the week your newsletter reminds them you exist.
        </P>
        <ReactivationLoop />
      </Section>

      {/* ── Bencivenga bullets ── */}
      <Section>
        <Eyebrow>What you actually get</Eyebrow>
        <H2>Every feature, translated into what it does for you.</H2>
        <ul>
          <Bullet head="A 10-minute onboarding that clones how you write and speak,">
            so every article and email sounds like you on your best day, not like a bot doing an impression of a
            professional.
          </Bullet>
          <Bullet head="Weekly articles, newsletters and social posts on autopilot,">
            planned against a seasonal calendar built for your field, so January content converts January
            buyers.
          </Bullet>
          <Bullet head="25,000 emails a month included,">
            which means your entire list hears from you weekly and the marginal cost of staying unforgettable
            is zero.
          </Bullet>
          <Bullet head="A branded lead-magnet library generated in your identity,">
            professionally designed guides prospects trade their email for, feeding your pipeline while you
            work.
          </Bullet>
          <Bullet head="A review growth engine,">
            because your Google rating is the first page of your website whether you like it or not.
          </Bullet>
          <Bullet head="One review gate for everything,">
            so you stay in control of every word that carries your name while spending minutes on it, not
            evenings.
          </Bullet>
        </ul>
      </Section>

      {/* ── Pricing ── */}
      <Section>
        <Eyebrow>The number</Eyebrow>
        <H2>One flat price. No content fees. No surprises.</H2>
        <PricingBlock />
      </Section>

      {/* ── Founder + proof ── */}
      <Section>
        <Eyebrow>Who built this</Eyebrow>
        <H2>Sixteen years of doing this manually taught me exactly what to automate.</H2>
        <P>
          I have spent 16 years running marketing for health professionals and local practices, and scaling
          online businesses from obscurity to six figures a month. The system inside Omniply is not a theory.
          It is the same playbook elite practice coaches teach their clients to execute by hand, the one that
          works every time it is actually executed, and fails every time life gets in the way of executing it.
        </P>
        <P>
          So I learned to code and spent years turning that playbook into a machine. <strong>Omniply is the
          version of that system that cannot get tired, cannot get busy, and cannot skip a week.</strong>
        </P>
      </Section>

      {/* ── FAQ ── */}
      <Section>
        <Eyebrow>Questions, answered straight</Eyebrow>
        <H2>Everything owners ask before they start.</H2>
        <Faq items={FAQ_ITEMS} />
      </Section>

      {/* ── Close ── */}
      <Section dark>
        <H2>We onboard 74 practices this quarter. Then we close the doors and serve them.</H2>
        <P lead>
          That is a real capacity number, not a countdown timer. Voice onboarding, brand setup and quality
          review take real attention per practice, and we protect the practices already inside.
        </P>
        <P>
          If your marketing is already consistent, every week, in your voice, keep going. You do not need us.
          If it is not, you know exactly what that has been costing you.
        </P>
        <Cta sub="$397/mo flat · cancel any month · capped at 74 practices this quarter">
          Set up your account right now
        </Cta>
      </Section>

      <FaqJsonLd items={FAQ_ITEMS} />
      <footer className="px-6 py-10 text-center text-sm" style={{ background: TOKENS.inkDeep, color: 'rgba(255,255,255,0.55)' }}>
        <p>Omniply · The content operating system for local practices</p>
        <p className="mt-2">
          <a href="/chiropractors" className="underline">Chiropractor? See the version built for your practice</a>
        </p>
      </footer>
    </main>
  )
}
