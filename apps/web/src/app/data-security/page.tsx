import type { Metadata } from 'next'
import { ProsePage, P, H3 } from '@/components/marketing/Marketing'

export const metadata: Metadata = {
  title: 'Data & AI Handling... Omniply',
  description: 'How Omniply handles your data and uses AI, in plain language.',
}

export default function DataSecurityPage() {
  return (
    <ProsePage title="Data &amp; AI Handling">
      <P lead>
        Practices trust us with their brand and their website visitors. Here is exactly how we treat that
        responsibility, without the legalese.
      </P>
      <H3>Your conversations never train AI models</H3>
      <P>
        Omniply&#39;s content engine and website assistant run on enterprise AI APIs, principally Anthropic&#39;s
        Claude, chosen specifically because conversations and content sent through them are not used to
        train models. Your voice, your patients&#39; chats, and your business data stay yours.
      </P>
      <H3>Chat transcripts have a fixed shelf life</H3>
      <P>
        Website-assistant conversations are retained for 180 days for quality review, then deleted
        automatically. The assistant refuses medical conversations by design; it exists for appointment
        logistics, opening hours, and practice questions.
      </P>
      <H3>Every practice is isolated</H3>
      <P>
        Your content, brand profile, connected accounts, and conversations are scoped to your account.
        Nothing you provide is shared with, or visible to, any other practice.
      </P>
      <H3>You approve everything</H3>
      <P>
        Nothing carrying your name publishes without your explicit approval. The review pass is the core of
        the product, not an afterthought.
      </P>
      <H3>Where things run</H3>
      <P>
        Hosting on DigitalOcean and Vercel, file storage on Amazon Web Services, CRM and messaging through
        HighLevel, authentication by Clerk, payments processed by Stripe through our billing platform. Each
        provider processes data only to deliver its service.
      </P>
      <P>
        Questions we did not answer here: <a href="mailto:support@omniply.io" className="underline">support@omniply.io</a>.
      </P>
    </ProsePage>
  )
}
