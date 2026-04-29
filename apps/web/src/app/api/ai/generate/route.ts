import type { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

export const maxDuration = 60

export function POST(request: NextRequest) {
  return proxyToApi(request, '/api/ai/generate', { method: 'POST' })
}
