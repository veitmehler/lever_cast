import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ number: string }> }

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { number } = await params
  return proxyToApi(request, `/api/admin/outline-frameworks/${number}`, { method: 'PUT' })
}
