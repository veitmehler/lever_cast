import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ id: string }> }

// Forwards the multipart CSV body + ?commit=true to the DO API.
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params
  return proxyToApi(request, `/api/admin/article-calendars/${id}/csv`, { method: 'POST' })
}
