import { NextRequest, NextResponse } from 'next/server'

const DO_API_BASE = process.env.DO_API_BASE ?? 'https://svc.omniply.io'

/**
 * Public same-origin proxy for the marketing contact form — no auth (the DO
 * API endpoint validates, honeypots, and rate-limits). Keeps the browser call
 * same-origin so no CORS surface opens on the API.
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const res = await fetch(`${DO_API_BASE}/api/marketing/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
    },
    body,
  })
  const payload = await res.text()
  return new NextResponse(payload, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
