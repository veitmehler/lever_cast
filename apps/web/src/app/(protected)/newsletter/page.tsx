import { Mail } from 'lucide-react'

// Placeholder until Phase 1d builds the review queue (/newsletter), per-edition
// review (/newsletter/[id]), template settings (/newsletter/template), and
// history. The nav link points here so it's discoverable now.
export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Newsletter</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your monthly magazine-style newsletters will appear here for review and approval. This
          area is being built — once an admin assigns you a content calendar and generates a month,
          you&apos;ll be able to review, tweak, and approve each edition here.
        </p>
      </div>
    </div>
  )
}
