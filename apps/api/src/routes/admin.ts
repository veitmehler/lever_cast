import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { getBoss, QUEUES } from '../queues/index'

const QUEUE_NAMES = Object.values(QUEUES)

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Socioply Admin</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; background: #0f172a; color: #e2e8f0; }
    h1 { color: #38bdf8; }
    h2 { color: #94a3b8; font-size: 1rem; margin-top: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.875rem; }
    th { text-align: left; padding: 0.5rem; background: #1e293b; color: #94a3b8; }
    td { padding: 0.5rem; border-bottom: 1px solid #1e293b; }
    .ok { color: #4ade80; } .warn { color: #facc15; } .err { color: #f87171; }
    #ts { color: #475569; font-size: 0.75rem; }
  </style>
</head>
<body>
  <h1>Socioply Admin</h1>
  <p id="ts">Loading…</p>
  <h2>Queue Depths</h2>
  <table id="queues"><tr><th>Queue</th><th>Depth</th></tr></table>
  <h2>PG Connections</h2>
  <table id="pg"><tr><th>State</th><th>Count</th></tr></table>
  <h2>Recent Failures (last 25)</h2>
  <table id="failures"><tr><th>Queue</th><th>Created</th><th>Completed</th><th>Output</th></tr></table>
  <script>
    async function refresh() {
      const [q, p, f] = await Promise.all([
        fetch('/admin/queues.json').then(r => r.json()),
        fetch('/admin/pg-stats.json').then(r => r.json()),
        fetch('/admin/recent-failures.json').then(r => r.json()),
      ])
      document.getElementById('ts').textContent = 'Last updated: ' + q.ts

      const qt = document.getElementById('queues')
      qt.innerHTML = '<tr><th>Queue</th><th>Depth</th></tr>'
      for (const { name, size } of q.queues) {
        const cls = size > 50 ? 'err' : size > 10 ? 'warn' : 'ok'
        qt.innerHTML += \`<tr><td>\${name}</td><td class="\${cls}">\${size}</td></tr>\`
      }

      const pt = document.getElementById('pg')
      pt.innerHTML = '<tr><th>State</th><th>Count</th></tr>'
      for (const row of p.pg) {
        pt.innerHTML += \`<tr><td>\${row.state ?? 'null'}</td><td>\${row.count}</td></tr>\`
      }

      const ft = document.getElementById('failures')
      ft.innerHTML = '<tr><th>Queue</th><th>Created</th><th>Completed</th><th>Output</th></tr>'
      for (const row of f.failures) {
        ft.innerHTML += \`<tr>
          <td>\${row.name}</td>
          <td>\${row.createdOn ? new Date(row.createdOn).toISOString() : '-'}</td>
          <td>\${row.completedOn ? new Date(row.completedOn).toISOString() : '-'}</td>
          <td style="max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\${JSON.stringify(row.output)}</td>
        </tr>\`
      }
    }
    refresh()
    setInterval(refresh, 5000)
  </script>
</body>
</html>`

export async function adminRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    reply.type('text/html').send(HTML)
  })

  app.get('/queues.json', async () => {
    const boss = await getBoss()
    const data = await Promise.all(
      QUEUE_NAMES.map(async (name) => ({
        name,
        size: await boss.getQueueSize(name).catch(() => -1),
      })),
    )
    return { queues: data, ts: new Date().toISOString() }
  })

  app.get('/recent-failures.json', async () => {
    const failures = await prisma.$queryRaw`
      SELECT name, state, output, "completedOn", "createdOn"
      FROM pgboss.job
      WHERE state = 'failed'
      ORDER BY "completedOn" DESC NULLS LAST
      LIMIT 25
    `
    return { failures }
  })

  app.get('/pg-stats.json', async () => {
    const pg = await prisma.$queryRaw`
      SELECT state, count(*)::int AS count
      FROM pg_stat_activity
      WHERE datname = 'socioply'
      GROUP BY state
    `
    return { pg }
  })
}
