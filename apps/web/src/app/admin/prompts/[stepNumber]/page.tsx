'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, AlertTriangle } from 'lucide-react'
import { PromptEditor } from './PromptEditor'

interface PromptTemplate {
  id: string
  stepNumber: number
  stepName: string
  defaultProvider: string
  defaultModel: string
  maxTokens: number | null
  systemPrompt: string | null
  userPrompt: string
  version: number
  isActive: boolean
}

export default function PromptEditorPage() {
  const params = useParams<{ stepNumber: string }>()
  const stepNumber = parseInt(params?.stepNumber ?? '', 10)

  const [template, setTemplate] = useState<PromptTemplate | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (Number.isNaN(stepNumber)) {
      setError('Invalid step number')
      setLoading(false)
      return
    }
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/prompts/${stepNumber}`, { cache: 'no-store' })
        if (!res.ok) {
          const body = await res.text()
          if (alive) setError(`HTTP ${res.status}: ${body || res.statusText}`)
          return
        }
        const data = await res.json()
        if (alive) setTemplate(data.template ?? null)
      } catch (err) {
        if (alive) setError((err as Error).message ?? 'Failed to load template')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [stepNumber])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading template…
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="max-w-3xl">
        <Link
          href="/admin/prompts"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Back to all templates
        </Link>
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Could not load template</div>
            <div className="mt-1 font-mono text-xs">{error ?? 'Template not found'}</div>
          </div>
        </div>
      </div>
    )
  }

  return <PromptEditor template={template} />
}
