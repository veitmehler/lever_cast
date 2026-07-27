import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

// Self-contained link-in-bio HTML download (non-WordPress clinics) — the DO
// API regenerates it from current account data on every request.
export async function GET(request: NextRequest) {
  return proxyToApi(request, '/api/onboarding/linktree.html', { method: 'GET' })
}
