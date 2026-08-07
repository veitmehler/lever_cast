import type { Metadata } from 'next'
import { SiteHeader, Section, H2, P, MarketingFooter } from '@/components/marketing/Marketing'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact... Omniply',
  description: 'Talk to the team behind Omniply.',
}

export default function ContactPage() {
  return (
    <main>
      <SiteHeader />
      <Section>
        <H2>Talk to us.</H2>
        <P lead>
          Questions about the platform, your practice, or whether Omniply fits: send them over. A human
          reads every message and replies within one business day.
        </P>
        <div className="mt-10">
          <ContactForm />
        </div>
        <P>
          <span className="mt-10 block text-[16px]">
            Prefer email? <a href="mailto:support@omniply.io" className="underline">support@omniply.io</a>
          </span>
        </P>
      </Section>
      <MarketingFooter />
    </main>
  )
}
