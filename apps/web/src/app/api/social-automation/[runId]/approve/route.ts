import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ runId: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  const { runId } = await params
  return proxyToApi(request, `/api/social-automation/${runId}/approve`, { method: 'POST' })
}
