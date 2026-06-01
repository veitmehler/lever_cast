'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  Upload, Search, Copy, Check, Download, Trash2, Loader2, ImageOff, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type MediaItem = {
  id: string
  url: string
  title?: string | null
  altText?: string | null
  source: 'upload' | 'ai_featured' | 'ai_social' | 'diagram'
  prompt?: string | null
  provider?: string | null
  jobId?: string | null
  width?: number | null
  height?: number | null
  mimeType?: string | null
  createdAt: string
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'upload', label: 'Uploads' },
  { id: 'ai', label: 'AI Images' },
  { id: 'diagram', label: 'Diagrams' },
] as const

const SOURCE_LABELS: Record<MediaItem['source'], string> = {
  upload: 'Upload',
  ai_featured: 'AI Featured',
  ai_social: 'AI Social',
  diagram: 'Diagram',
}

export default function ImageLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [tab, setTab] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<MediaItem | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchItems = useCallback(async (reset: boolean, currentItems: MediaItem[]) => {
    setLoading(true)
    const offset = reset ? 0 : currentItems.length
    const params = new URLSearchParams({ limit: '40', offset: String(offset) })
    if (tab !== 'all') params.set('source', tab)
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())

    try {
      const res = await fetch(`/api/media?${params}`)
      const data = res.ok ? await res.json() : { items: [], hasMore: false, total: 0 }
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]))
      setHasMore(Boolean(data.hasMore))
      setTotal(data.total ?? 0)
    } catch {
      toast.error('Failed to load images')
    } finally {
      setLoading(false)
    }
  }, [tab, debouncedSearch])

  useEffect(() => {
    void fetchItems(true, [])
  }, [fetchItems])

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    let ok = 0
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        continue
      }
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
      if (res.ok) ok++
      else toast.error(`Upload failed: ${file.name}`)
    }
    setUploading(false)
    if (ok > 0) {
      toast.success(ok === 1 ? 'Image uploaded' : `${ok} images uploaded`)
      void fetchItems(true, [])
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const copyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url)
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success('CDN URL copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  const remove = async (item: MediaItem) => {
    const res = await fetch(`/api/media/${item.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Delete failed')
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setTotal((t) => Math.max(0, t - 1))
    if (preview?.id === item.id) setPreview(null)
    toast.success('Removed from library')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Image Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload custom images and reuse AI-generated assets from your account.
          </p>
        </div>
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload images
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleUpload(e.target.files)}
        />
      </div>

      <div
        className={cn(
          'mb-6 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void handleUpload(e.dataTransfer.files)
        }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Drag and drop images here, or click Upload above
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {total} image{total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ImageOff className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No images yet. Upload one or generate from a post.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  type="button"
                  className="block w-full aspect-square relative bg-muted"
                  onClick={() => setPreview(item)}
                >
                  <Image
                    src={item.url}
                    alt={item.altText ?? item.title ?? 'Library image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                </button>
                <div className="p-2">
                  <p className="text-xs font-medium truncate text-card-foreground">
                    {item.title ?? item.altText ?? 'Untitled'}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {SOURCE_LABELS[item.source]}
                  </p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => void copyUrl(item)}
                    className="p-1.5 rounded-md bg-background/90 border border-border shadow-sm hover:bg-muted"
                    title="Copy CDN URL"
                  >
                    {copiedId === item.id
                      ? <Check className="h-3.5 w-3.5 text-green-500" />
                      : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <a
                    href={item.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-background/90 border border-border shadow-sm hover:bg-muted"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => void remove(item)}
                    className="p-1.5 rounded-md bg-background/90 border border-border shadow-sm hover:bg-destructive/10 text-destructive"
                    title="Remove from library"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => void fetchItems(false, items)}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-card-foreground truncate pr-4">
                {preview.title ?? preview.altText ?? 'Image preview'}
              </h2>
              <button type="button" onClick={() => setPreview(null)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative w-full aspect-video bg-muted">
              <Image
                src={preview.url}
                alt={preview.altText ?? preview.title ?? 'Preview'}
                fill
                className="object-contain"
              />
            </div>
            <div className="p-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Source:</span> {SOURCE_LABELS[preview.source]}</p>
              {preview.width && preview.height && (
                <p><span className="text-muted-foreground">Size:</span> {preview.width} × {preview.height}</p>
              )}
              {preview.provider && (
                <p><span className="text-muted-foreground">Provider:</span> {preview.provider}</p>
              )}
              {preview.prompt && (
                <p className="text-muted-foreground line-clamp-3"><span className="font-medium text-foreground">Prompt:</span> {preview.prompt}</p>
              )}
              <p className="text-xs text-muted-foreground break-all">{preview.url}</p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => void copyUrl(preview)}>
                  {copiedId === preview.id ? 'Copied!' : 'Copy URL'}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={preview.url} download target="_blank" rel="noopener noreferrer">Download</a>
                </Button>
                <Button size="sm" variant="destructive" onClick={() => void remove(preview)}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
