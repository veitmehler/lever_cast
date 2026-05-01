import { proxyToApi } from '@/lib/api-proxy'
import type { NextRequest } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  return proxyToApi(request, `/api/admin/llm-keys/${provider}`, { method: 'PUT' })
}
