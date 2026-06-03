import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ jobId: string; runId: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  const { jobId, runId } = await params
  return proxyToApi(request, `/api/articles/${jobId}/social-automation/${runId}/approve`, {
    method: 'POST',
  })
}
