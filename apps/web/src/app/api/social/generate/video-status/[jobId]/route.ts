import { type NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params
  return proxyToApi(request, `/api/social/generate/video-status/${jobId}`, { method: 'GET' })
}
