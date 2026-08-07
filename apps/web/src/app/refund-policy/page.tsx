import type { Metadata } from 'next'
import { ProsePage, P, H3 } from '@/components/marketing/Marketing'

export const metadata: Metadata = {
  title: 'Refund Policy... Omniply',
  description: 'Cancellation and refunds for Omniply subscriptions.',
}

export default function RefundPage() {
  return (
    <ProsePage title="Refund &amp; Cancellation Policy" updated="August 2026">
      <H3>Cancel any month</H3>
      <P>
        Omniply is month to month. You can cancel at any time, and cancellation takes effect at the end of
        your current billing period. You keep access until then, and everything already published to your
        properties stays published... it was always yours.
      </P>
      <H3>Why paid fees are not refundable</H3>
      <P>
        Your subscription fee funds real production that starts the moment a billing period begins: articles
        are written, newsletters designed, social posts produced, and AI systems run for your practice. Those
        costs are incurred immediately, which is why fees already paid cannot be refunded, in whole or in
        part.
      </P>
      <H3>Billing mistakes</H3>
      <P>
        If you believe you were charged in error (for example a duplicate charge), email{' '}
        <a href="mailto:support@omniply.io" className="underline">support@omniply.io</a> within 30 days and
        we will make it right.
      </P>
    </ProsePage>
  )
}
