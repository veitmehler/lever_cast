import { type NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

export async function GET(request: NextRequest) {
  return proxyToApi(request, '/api/voice/settings', { method: 'GET' })
}

export async function PUT(request: NextRequest) {
  return proxyToApi(request, '/api/voice/settings', { method: 'PUT' })
}
