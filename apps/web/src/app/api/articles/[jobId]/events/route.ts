import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

const DO_API_BASE = process.env.DO_API_BASE ?? 'https://api.socioply.com'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { jobId } = await params

  // Proxy the SSE stream from the Fastify backend.
  // Cannot use proxyToApi here because it buffers the response with arrayBuffer().
  const upstream = await fetch(`${DO_API_BASE}/api/articles/${jobId}/events`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
  })

  if (!upstream.ok || !upstream.body) {
    return new Response('Failed to connect to event stream', { status: 502 })
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
