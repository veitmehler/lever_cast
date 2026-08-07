import type { Metadata } from 'next'
import { ProsePage, P, H3 } from '@/components/marketing/Marketing'

export const metadata: Metadata = {
  title: 'Privacy Policy... Omniply',
  description: 'How Omniply and Azavea Inc. handle your data.',
}

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy Policy" updated="August 2026">
      <P>
        Omniply is operated by Azavea Inc. This policy explains what we collect, why, and how it is handled,
        in plain language.
      </P>
      <H3>What we collect from subscribers</H3>
      <P>
        Your business details (practice name, branding, services, hours, connected accounts) and the content
        the platform produces for you. Payment details are processed by our billing platform and its payment
        processor; Azavea Inc. does not store card numbers.
      </P>
      <H3>Website-assistant conversations</H3>
      <P>
        When a visitor chats with the AI assistant on a subscriber&#39;s website, the conversation is
        processed to generate replies and, where the visitor asks for it, to arrange callbacks or deliver
        guides. Transcripts are retained for 180 days and then deleted automatically. The assistant declines
        medical conversations by design and is not intended for health information.
      </P>
      <H3>AI processing... and what we never do</H3>
      <P>
        Content generation and the website assistant use enterprise AI providers, principally Anthropic.
        <strong> Conversations and your content are never used to train AI models.</strong> We chose our
        providers specifically for their no-training API guarantees.
      </P>
      <H3>Service providers we rely on</H3>
      <P>
        Anthropic, Google, and OpenAI (AI processing), HighLevel (CRM, email, SMS and billing platform),
        DigitalOcean and Amazon Web Services (hosting and storage), Vercel (website hosting), Clerk
        (authentication), and Stripe via our billing platform (payments). Each processes data only to provide
        its service to us.
      </P>
      <H3>Cookies and analytics</H3>
      <P>
        We use essential cookies for sign-in and lightweight analytics to understand how our own pages are
        used. We do not sell personal information.
      </P>
      <H3>Your choices</H3>
      <P>
        To access, correct, or delete information we hold about you or your practice, email{' '}
        <a href="mailto:support@omniply.io" className="underline">support@omniply.io</a>. Cancelled accounts
        are deleted on a fixed schedule after cancellation, with usage records retained as required for
        accounting.
      </P>
    </ProsePage>
  )
}
