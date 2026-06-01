import { proxyToApi } from '@/lib/api-proxy'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params
  return proxyToApi(request, `/api/admin/social-automation/${runId}`, { method: 'GET' })
}
