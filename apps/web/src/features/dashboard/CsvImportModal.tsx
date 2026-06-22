'use client'

import { useRef, useState } from 'react'
import { Upload, FileText, X, CheckCircle2, XCircle, Loader2, AlertTriangle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type ImportResult = { row: number; topicId?: string; jobId?: string; mode?: string; error?: string }
type ImportResponse = { total: number; succeeded: number; failed: number; results: ImportResult[] }

// Friendly column names → accepted by the CSV importer (see api topics.ts CSV_ALIASES).
// `topic` is the only required column; everything else is optional.
const OPTIONAL_COLUMNS = [
  'outline framework',
  'special instructions',
  'real case studies',
  'excluded keywords',
  'category',
  'mode (article_first | article_only | social_only)',
]

const TEMPLATE = [
  'topic,outline framework,special instructions,real case studies,excluded keywords,category,mode',
  '"Why posture matters for desk workers",3,"Lead with a patient story","Acme Clinic 2024","cheap;discount","ergonomics",article_first',
  '"Migraine relief without medication",,,,,,article_first',
].join('\n')

// Shared so the Ideas Bank page can offer the same download next to its button.
export function downloadIdeasTemplate() {
  const blob = new Blob([TEMPLATE], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ideas-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

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

export function CsvImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResponse | null>(null)

  const hasTopic = preview && preview.headers.some((h) => ['topic', 'idea', 'title'].includes(h.toLowerCase().trim()))

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(parseCsvText(ev.target?.result as string))
    reader.readAsText(f)
  }

  async function doImport() {
    if (!file) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/topics/csv', { method: 'POST', body: fd })
      const data: ImportResponse = await res.json()
      if (!res.ok && res.status !== 207) throw new Error((data as unknown as { error?: string }).error ?? 'Import failed')
      setResult(data)
      toast.success(`Imported ${data.succeeded} idea${data.succeeded !== 1 ? 's' : ''}${data.failed ? `, ${data.failed} failed` : ''}`)
      if (data.succeeded > 0) onImported()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">Import ideas from CSV</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Format guide */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium text-foreground">
              Required column: <code className="rounded bg-background px-1 font-mono text-xs">topic</code>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Optional columns:</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {OPTIONAL_COLUMNS.map((c) => (
                <span key={c} className="rounded bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{c}</span>
              ))}
            </div>
            <button onClick={downloadIdeasTemplate} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <Download className="h-3.5 w-3.5" /> Download template
            </button>
          </div>

          {/* Upload area */}
          <div
            className="cursor-pointer rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">{file ? file.name : 'Click to choose a CSV file'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">CSV, max 10 MB</p>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </div>

          {/* Preview */}
          {preview && preview.rows.length > 0 && !result && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Preview — {preview.rows.length} row{preview.rows.length !== 1 ? 's' : ''}
                </span>
                {!hasTopic && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-500">
                    <AlertTriangle className="h-3.5 w-3.5" /> No <code className="font-mono">topic</code> column
                  </span>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {preview.headers.map((h) => (
                        <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 8).map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {preview.headers.map((h) => (
                          <td key={h} className="max-w-[16rem] truncate px-3 py-2 text-foreground">
                            {row[h] || <span className="text-muted-foreground/40">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {preview.rows.length > 8 && (
                      <tr>
                        <td colSpan={preview.headers.length} className="px-3 py-2 text-center text-muted-foreground">
                          + {preview.rows.length - 8} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="rounded-xl border border-border p-4">
              <div className="flex gap-6">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> {result.succeeded} imported
                </span>
                {result.failed > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <XCircle className="h-4 w-4 text-red-500" /> {result.failed} failed
                  </span>
                )}
              </div>
              {result.failed > 0 && (
                <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
                  {result.results.filter((r) => r.error).map((r) => (
                    <div key={r.row} className="rounded bg-red-50 px-2 py-1 text-xs text-red-600">row {r.row}: {r.error}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          {result ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={doImport} disabled={importing || !hasTopic}>
                {importing ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Importing…</> : <><FileText className="mr-1.5 h-4 w-4" /> Import{preview ? ` ${preview.rows.length}` : ''}</>}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
