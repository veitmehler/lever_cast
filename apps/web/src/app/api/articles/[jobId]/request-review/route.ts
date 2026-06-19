import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ jobId: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  const { jobId } = await params
  return proxyToApi(request, `/api/articles/${jobId}/request-review`, { method: 'POST' })
}
