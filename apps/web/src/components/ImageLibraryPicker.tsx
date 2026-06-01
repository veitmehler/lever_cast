'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Loader2, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LibraryItem = {
  id: string
  url: string
  title?: string | null
  altText?: string | null
  source?: string
}

interface ImageLibraryPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

export function ImageLibraryPicker({ open, onClose, onSelect }: ImageLibraryPickerProps) {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/media?limit=60')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-xl border border-border bg-card shadow-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Images className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">Choose from library</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">
              No images in your library yet. Upload images on the Image Library page first.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item.url); onClose() }}
                  className={cn(
                    'group relative aspect-square rounded-lg overflow-hidden border border-border',
                    'hover:ring-2 hover:ring-primary transition-all',
                  )}
                >
                  <Image
                    src={item.url}
                    alt={item.altText ?? item.title ?? 'Library image'}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5">
                    <p className="text-[10px] text-white truncate">
                      {item.title ?? item.altText ?? 'Image'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}
