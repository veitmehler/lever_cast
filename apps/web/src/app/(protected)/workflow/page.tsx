'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Plus, Loader2, RefreshCw, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type PipelineStep = {
  stepNumber: number
  stepName: string
  status: string
}

type ArticleJob = {
  id: string
  status: string
  currentStep: number
  totalCost: number
  totalTokens: number
  createdAt: string
  startedAt: string | null
  topic: { topic: string; mode: string }
  _count: { pipelineSteps: number; errorLogs: number }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'Running', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Needs Approval', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', color: 'bg-purple-100 text-purple-700' },
  enriched: { label: 'Ready', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
}

function StatusBadge({ status }: { status: string }) {
  const { label, color } = STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

function ProgressBar({ currentStep }: { currentStep: number }) {
  const pct = Math.min(100, Math.round((currentStep / 12) * 100))
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Step {currentStep}/12</span>
        <span className="text-xs text-gray-500">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function WorkflowPage() {
  const [jobs, setJobs] = useState<ArticleJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const fetchJobs = async () => {
    try {
      const url = filter === 'all' ? '/api/articles' : `/api/articles?status=${filter}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch articles')
      const data = await res.json()
      setJobs(data.jobs ?? [])
    } catch {
      toast.error('Failed to load article jobs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [filter])

  const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'in_progress', label: 'Running' },
    { value: 'completed', label: 'Needs Approval' },
    { value: 'enriched', label: 'Ready' },
    { value: 'failed', label: 'Failed' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Article Workflow</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage your AI-generated articles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsLoading(true); fetchJobs() }}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/dashboard">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                New Article
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setIsLoading(true) }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filter === f.value
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No article jobs yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create your first article from the dashboard using the article pipeline mode.
            </p>
            <Link href="/dashboard">
              <Button>
                <Plus className="h-4 w-4 mr-1.5" />
                Create Article
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link key={job.id} href={`/workflow/${job.id}`} className="block">
                <div className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={job.status} />
                        {job._count.errorLogs > 0 && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                            {job._count.errorLogs} error{job._count.errorLogs !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate mt-1">
                        {job.topic.topic}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Started {new Date(job.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                        {job.totalCost > 0 && (
                          <span className="ml-3 text-gray-400">
                            Cost: ${job.totalCost.toFixed(4)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {['in_progress', 'pending'].includes(job.status) && (
                        <div className="w-32">
                          <ProgressBar currentStep={job.currentStep} />
                        </div>
                      )}
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
