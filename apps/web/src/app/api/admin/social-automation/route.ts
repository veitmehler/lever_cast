import { proxyToApi } from '@/lib/api-proxy'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search
  return proxyToApi(request, `/api/admin/social-automation${search}`, { method: 'GET' })
}
