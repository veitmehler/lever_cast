import Link from 'next/link'
import { CalendarDays, MessageSquareText, Play, ChevronRight, Tags } from 'lucide-react'

const cards = [
  {
    href: '/admin/newsletter/calendars',
    label: 'Content Calendars',
    description: 'Create calendars (specialization + hemisphere), upload CSV topics, and assign customers.',
    icon: CalendarDays,
  },
  {
    href: '/admin/newsletter/specializations',
    label: 'Specializations',
    description: 'Manage the specialization list clients pick from and that calendars are scoped to.',
    icon: Tags,
  },
  {
    href: '/admin/newsletter/prompts',
    label: 'Newsletter Prompts',
    description: 'Edit the nl_* prompt templates that drive newsletter generation.',
    icon: MessageSquareText,
  },
  {
    href: '/admin/newsletter/generate',
    label: 'Generate (manual)',
    description: 'Manually trigger generation for a customer + date range (testing).',
    icon: Play,
  },
]

export default function AdminNewsletterPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Newsletter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage magazine-style newsletter content calendars, prompts, and generation.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-border/80 hover:shadow-sm transition-all"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {label}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
