import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ jobId: string; target: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  const { jobId, target } = await params
  return proxyToApi(request, `/api/articles/${jobId}/output/${target}`, { method: 'POST' })
}
