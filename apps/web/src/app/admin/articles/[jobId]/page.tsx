import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ArticleJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params

  const job = await prisma.articleJob.findUnique({
    where: { id: jobId },
    include: {
      topic: true,
      user: { select: { id: true, email: true, name: true } },
      pipelineSteps: {
        orderBy: { stepNumber: 'asc' },
        include: {
          promptTemplate: { select: { stepName: true, defaultProvider: true, defaultModel: true } },
        },
      },
      sitePage: { include: { diagrams: { orderBy: { position: 'asc' } } } },
      outputAttempts: { orderBy: { startedAt: 'desc' } },
      errorLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      llmUsage: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!job) notFound()

  const totalCost = job.llmUsage.reduce((s, r) => s + r.cost, 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/articles" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground truncate">
            {job.sitePage?.title ?? job.topic.topic}
          </h1>
          <p className="text-xs text-muted-foreground">
            {job.user.email} · Job {job.id} · ${totalCost.toFixed(4)}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InfoCard label="Mode" value={job.topic.mode} />
        <InfoCard label="Step" value={`${job.currentStep} / 18`} />
        <InfoCard label="Total Cost" value={`$${totalCost.toFixed(4)}`} />
        <InfoCard label="Total Tokens" value={job.totalTokens.toLocaleString()} />
      </div>

      {job.sitePage && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground mb-3">SitePage</h2>
          <Row label="Title" value={job.sitePage.title} />
          <Row label="Slug" value={job.sitePage.slug} />
          <Row label="Primary Keyword" value={job.sitePage.primaryKeyword ?? '—'} />
          <Row label="SEO Title" value={job.sitePage.seoTitle ?? '—'} />
          <Row
            label="Enrichment"
            value={job.sitePage.enrichmentStatus}
            valueClass={
              job.sitePage.enrichmentStatus === 'completed'
                ? 'text-green-400'
                : job.sitePage.enrichmentStatus === 'failed'
                  ? 'text-red-400'
                  : undefined
            }
          />
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">
          Pipeline Steps ({job.pipelineSteps.length})
        </h2>
        {job.pipelineSteps.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No steps yet</p>
        ) : (
          <div className="divide-y divide-border">
            {job.pipelineSteps.map((step) => (
              <div key={step.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-xs text-muted-foreground font-mono">{step.stepNumber}</span>
                    <span className="text-sm font-medium text-foreground">{step.stepName}</span>
                    <span className="text-xs text-muted-foreground">{step.provider}/{step.model}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {step.inputTokens}↑ {step.outputTokens}↓
                    </span>
                    <span className="font-mono text-foreground">${step.cost.toFixed(5)}</span>
                    <StepStatusBadge status={step.status} />
                  </div>
                </div>
                {step.output && (
                  <details className="mt-1">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Output ({step.output.length.toLocaleString()} chars)
                    </summary>
                    <pre className="mt-2 max-h-96 overflow-auto rounded bg-muted/30 p-2 text-xs text-foreground whitespace-pre-wrap break-words">
                      {step.output}
                    </pre>
                  </details>
                )}
                {step.errorMessage && (
                  <p className="mt-1 text-xs text-red-400 font-mono">{step.errorMessage}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {job.errorLogs.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-card overflow-hidden">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-red-400">
            Error Logs ({job.errorLogs.length})
          </h2>
          <div className="divide-y divide-border">
            {job.errorLogs.map((err) => (
              <div key={err.id} className="px-4 py-3">
                <p className="text-xs font-medium text-red-400">{err.errorType}</p>
                <p className="mt-0.5 text-sm text-foreground">{err.errorMessage}</p>
                {err.stackTrace && (
                  <details className="mt-1">
                    <summary className="text-xs text-muted-foreground cursor-pointer">Stack trace</summary>
                    <pre className="mt-1 max-h-32 overflow-auto text-xs text-muted-foreground font-mono">
                      {err.stackTrace}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {job.outputAttempts.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">Output Attempts</h2>
          <div className="divide-y divide-border">
            {job.outputAttempts.map((att) => (
              <div key={att.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-foreground">{att.target}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Date(att.startedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {att.durationMs && (
                    <span className="text-xs text-muted-foreground">{att.durationMs}ms</span>
                  )}
                  {att.resultUrl && (
                    <a
                      href={att.resultUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View →
                    </a>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      att.status === 'success'
                        ? 'bg-green-500/20 text-green-400'
                        : att.status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {att.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    in_progress: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    enriched: 'bg-purple-500/20 text-purple-400',
    exported: 'bg-indigo-500/20 text-indigo-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  )
}

function StepStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'text-muted-foreground',
    running: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  }
  return <span className={`font-medium ${colors[status] ?? 'text-muted-foreground'}`}>{status}</span>
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className={`break-all ${valueClass ?? 'text-foreground'}`}>{value}</span>
    </div>
  )
}
