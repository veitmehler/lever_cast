import type { Metadata } from 'next'
import { ProsePage, P, H3 } from '@/components/marketing/Marketing'

export const metadata: Metadata = {
  title: 'Terms of Service... Omniply',
  description: 'The terms that govern your Omniply subscription.',
}

export default function TermsPage() {
  return (
    <ProsePage title="Terms of Service" updated="August 2026">
      <P>
        Omniply is a product of Azavea Inc. These terms are an agreement between Azavea Inc. and the
        practice or business that subscribes to Omniply. By subscribing, you accept them.
      </P>
      <H3>The service</H3>
      <P>
        Omniply produces and publishes marketing content for your practice: articles, newsletters, social
        posts, lead-generation documents, review growth, recall campaigns, and an AI website assistant.
        Content carrying your name ships only after your review and approval. You are responsible for the
        accuracy of the business information you provide and for the final review of everything you approve.
      </P>
      <H3>Billing and cancellation</H3>
      <P>
        Subscriptions are billed monthly in advance at the published price. You can cancel any month;
        cancellation takes effect at the end of the current billing period. Because content production for
        your billing period begins immediately after payment, fees already paid are not refundable. See our{' '}
        <a href="/refund-policy" className="underline">Refund Policy</a> for the details.
      </P>
      <H3>Your content stays yours</H3>
      <P>
        Content produced for your practice and published to your properties (your website, your email list,
        your social accounts, your documents) is yours and remains published after cancellation.
      </P>
      <H3>Fair use of AI features</H3>
      <P>
        AI features (the website assistant, content generation) include generous usage suitable for a normal
        practice. Sustained extraordinary usage may require an adjusted plan; we will always talk to you
        before anything changes. Automated abuse of AI endpoints is prohibited and is rate-limited.
      </P>
      <H3>Health information and the website assistant</H3>
      <P>
        The Omniply website assistant handles appointment logistics and practice information only. It is
        designed to decline medical conversations and directs urgent matters to emergency services. It is not
        intended to collect or process protected health information, and you agree not to configure or use it
        for that purpose. Omniply is not a business associate under HIPAA and no business associate agreement
        is offered.
      </P>
      <H3>Liability</H3>
      <P>
        Omniply is provided with reasonable skill and care. To the extent permitted by law, Azavea Inc.&#39;s
        aggregate liability under this agreement is limited to the fees you paid in the three months before
        the event giving rise to the claim. Nothing in these terms limits liability that cannot lawfully be
        limited.
      </P>
      <H3>Contact</H3>
      <P>
        Questions about these terms: <a href="mailto:support@omniply.io" className="underline">support@omniply.io</a>.
      </P>
    </ProsePage>
  )
}
