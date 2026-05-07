import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ jobId: string; diagramId: string }> }

/** GET diagram SVG proxied from S3 — avoids browser CORS restrictions */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { jobId, diagramId } = await params
  return proxyToApi(request, `/api/articles/${jobId}/diagram-svg/${diagramId}`, { method: 'GET' })
}
