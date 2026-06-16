import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params
  return proxyToApi(request, `/api/admin/newsletter/calendars/${id}/assign`, { method: 'POST' })
}
