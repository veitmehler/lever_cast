import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ jobId: string }> }

export async function GET(request: NextRequest, { params }: Ctx) {
  const { jobId } = await params
  return proxyToApi(request, `/api/articles/${jobId}/promo-email`, { method: 'GET' })
}
