import type { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

export const maxDuration = 30

export function POST(request: NextRequest) {
  return proxyToApi(request, '/api/images/generate-prompt', { method: 'POST' })
}
