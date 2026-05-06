import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ jobId: string }> }

/** PATCH editable article preview fields → Fastify PATCH /articles/:jobId/content */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { jobId } = await params
  return proxyToApi(request, `/api/articles/${jobId}/content`, { method: 'PATCH' })
}
