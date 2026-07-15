'use client'

import { LeadMagnetsView } from '@/components/LeadMagnetsView'

// Open-web surface: Clerk session + the Vercel /api/leadgen proxy.
export default function LeadMagnetsPage() {
  return <LeadMagnetsView apiFetch={(path, init) => fetch(path, init)} />
}
