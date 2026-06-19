import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params
  return proxyToApi(request, `/api/admin/specializations/${id}`, { method: 'PATCH' })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params
  return proxyToApi(request, `/api/admin/specializations/${id}`, { method: 'DELETE' })
}
