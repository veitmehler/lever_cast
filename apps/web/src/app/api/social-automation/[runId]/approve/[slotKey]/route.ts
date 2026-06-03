import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ runId: string; slotKey: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  const { runId, slotKey } = await params
  return proxyToApi(request, `/api/social-automation/${runId}/approve/${slotKey}`, {
    method: 'POST',
  })
}
