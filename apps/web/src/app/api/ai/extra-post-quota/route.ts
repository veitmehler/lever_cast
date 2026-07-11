import type { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

export function GET(request: NextRequest) {
  return proxyToApi(request, '/api/ai/extra-post-quota', { method: 'GET' })
}
