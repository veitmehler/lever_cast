import { proxyToApi } from '@/lib/api-proxy'
import type { NextRequest } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxyToApi(request, `/api/admin/accounts/${id}`, { method: 'PATCH' })
}
