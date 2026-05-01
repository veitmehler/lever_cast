'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Upload, FileText, ChevronLeft, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

type ImportResult = {
  row: number
  topicId?: string
  jobId?: string
  mode?: string
  error?: string
}

type ImportResponse = {
  total: number
  succeeded: number
  failed: number
  results: ImportResult[]
}

// ── CSV column aliases used for auto-detection ────────────────────────────────
const KNOWN_COLUMNS = ['topic', 'idea', 'title', 'scheduled date', 'scheduledDate', 'mode', 'slug', 'category', 'excluded keywords', 'output targets', 'wordpress connection']

function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = values[i] ?? '' })
    return obj
  })
  return { headers, rows }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TopicsCsvPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setPreview(parseCsvText(text))
    }
    reader.readAsText(f)
  }

  const handleImport = async () => {
    if (!file) return
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/topics/csv', { method: 'POST', body: formData })
      const data: ImportResponse = await res.json()
      if (!res.ok && res.status !== 207) throw new Error((data as unknown as { error?: string }).error ?? 'Import failed')
      setImportResult(data)
      toast.success(`Import complete: ${data.succeeded} succeeded, ${data.failed} failed`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const hasTopic = preview && preview.headers.some((h) =>
    ['topic', 'idea', 'title'].includes(h.toLowerCase().trim()),
  )

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/workflow" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Topic Import</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload a CSV file to create multiple topics and optionally kick off article pipelines.
          </p>
        </div>
      </div>

      {/* CSV format guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <p className="font-semibold mb-1">Required column: <code className="font-mono bg-blue-100 rounded px-1">topic</code></p>
        <p className="text-xs text-blue-700 mb-2">Optional columns:</p>
        <div className="flex flex-wrap gap-1.5">
          {['scheduled date', 'mode (social_only|article_first|article_only)', 'slug', 'category', 'excluded keywords', 'output targets', 'wordpress connection'].map((c) => (
            <span key={c} className="bg-blue-100 rounded px-2 py-0.5 font-mono text-xs">{c}</span>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Default mode is <code className="font-mono">social_only</code>. Use <code className="font-mono">article_first</code> or <code className="font-mono">article_only</code> to kick off the article pipeline.
        </p>
      </div>

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors mb-6"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">
          {file ? file.name : 'Click to upload or drag a CSV file here'}
        </p>
        <p className="text-xs text-gray-400 mt-1">CSV, max 10 MB</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Preview table */}
      {preview && preview.rows.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Preview — {preview.rows.length} row{preview.rows.length !== 1 ? 's' : ''}
            </h2>
            {!hasTopic && (
              <span className="inline-flex items-center gap-1 text-xs text-red-500">
                <AlertTriangle className="h-3.5 w-3.5" />
                No <code className="font-mono">topic</code> column detected
              </span>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {preview.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                      {h}
                      {KNOWN_COLUMNS.some((k) => k.toLowerCase() === h.toLowerCase()) && (
                        <CheckCircle2 className="h-3 w-3 text-green-500 inline ml-1" />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    {preview.headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-gray-700 max-w-xs truncate">
                        {row[h] || <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                {preview.rows.length > 10 && (
                  <tr>
                    <td colSpan={preview.headers.length} className="px-3 py-2 text-center text-gray-400 text-xs">
                      + {preview.rows.length - 10} more rows not shown
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => { setFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
            >
              Clear
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || !hasTopic}
            >
              {isImporting ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Importing…</>
              ) : (
                <><FileText className="h-4 w-4 mr-1.5" /> Import {preview.rows.length} topic{preview.rows.length !== 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {importResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Import Results</h2>
          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">{importResult.succeeded} succeeded</span>
            </div>
            {importResult.failed > 0 && (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-gray-700">{importResult.failed} failed</span>
              </div>
            )}
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {importResult.results.map((r) => (
              <div key={r.row} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs ${r.error ? 'bg-red-50' : 'bg-green-50'}`}>
                <span className="w-12 font-mono text-gray-400">row {r.row}</span>
                {r.error ? (
                  <span className="text-red-600">{r.error}</span>
                ) : (
                  <>
                    <span className="text-green-700 font-medium capitalize">{r.mode}</span>
                    {r.jobId && (
                      <Link href={`/workflow/${r.jobId}`} className="ml-auto text-indigo-600 hover:underline">
                        View job →
                      </Link>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          {importResult.succeeded > 0 && (
            <div className="mt-4 flex justify-end">
              <Link href="/workflow">
                <Button variant="outline" size="sm">View article jobs →</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
