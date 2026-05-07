import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ jobId: string }> }

/** GET raw citation data for diagnosis — see API /articles/:jobId/citations-debug */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { jobId } = await params
  return proxyToApi(request, `/api/articles/${jobId}/citations-debug`, { method: 'GET' })
}
