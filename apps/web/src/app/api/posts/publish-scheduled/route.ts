import { NextResponse } from 'next/server'

/**
 * This endpoint is retired. Scheduled publishing is now handled by the
 * pg-boss worker on the DigitalOcean droplet (apps/api/src/handlers/publish.ts).
 *
 * The worker runs the `publish-scheduled` queue every minute via pg-boss schedule.
 * Vercel Cron entries for this path have been removed from vercel.json.
 */
export async function GET() {
  return NextResponse.json({
    status: 'retired',
    message: 'Scheduled publishing is now handled by the DO worker (pg-boss).',
  })
}
