import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

// Triggers server-side generation of light/dark logo variants from the stored
// source logo (after a source upload, and on "re-process"). Runs in the API
// where sharp + background-removal live.
export async function POST(request: NextRequest) {
  return proxyToApi(request, '/api/newsletters/logo/process', { method: 'POST' })
}
