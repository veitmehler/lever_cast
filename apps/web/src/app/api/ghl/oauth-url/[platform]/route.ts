import { type NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params
  return proxyToApi(request, `/api/ghl/oauth-url/${platform}`, { method: 'GET' })
}
