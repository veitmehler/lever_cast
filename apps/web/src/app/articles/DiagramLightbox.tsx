'use client'

/**
 * Diagram lightbox for marketing articles (user-locked 2026-08-13):
 * DIAGRAMS ONLY (`figure.article-diagram img`), max zoom 5x.
 * Click/tap a diagram → full-screen navy-scrim modal with pinch-zoom,
 * wheel zoom, drag pan, double-click 2x toggle, +/− buttons, Esc/scrim/X
 * close. Event delegation over the rendered body HTML — the pipeline and
 * stored articles are untouched. omniply.io articles only; clinic WP sites
 * are their themes' business.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_ZOOM = 5
const MIN_ZOOM = 1

interface LightboxState {
  src: string
  alt: string
  caption: string | null
}

export function DiagramLightbox() {
  const [open, setOpen] = useState<LightboxState | null>(null)
  const [view, setView] = useState({ s: 1, tx: 0, ty: 0 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchStart = useRef<{ dist: number; s: number } | null>(null)
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const prevFocus = useRef<Element | null>(null)

  // Delegate clicks from the rendered article HTML.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const img = (e.target as Element | null)?.closest?.('figure.article-diagram img') as HTMLImageElement | null
      if (!img?.src) return
      e.preventDefault()
      const figure = img.closest('figure')
      const caption = figure?.querySelector('figcaption')?.textContent?.trim() ?? null
      prevFocus.current = document.activeElement
      setView({ s: 1, tx: 0, ty: 0 })
      setOpen({ src: img.src, alt: img.alt ?? '', caption })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const close = useCallback(() => {
    setOpen(null)
    pointers.current.clear()
    pinchStart.current = null
    dragStart.current = null
    ;(prevFocus.current as HTMLElement | null)?.focus?.()
  }, [])

  useEffect(() => {
    if (!open) return
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, close])

  const clampScale = (s: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s))

  /** Zoom toward a viewport point (cx, cy measured from screen center). */
  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
    setView((v) => {
      const s = clampScale(v.s * factor)
      const k = s / v.s
      if (k === 1) return v
      return { s, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k }
    })
  }, [])

  function center(e: { clientX: number; clientY: number }) {
    return { cx: e.clientX - window.innerWidth / 2, cy: e.clientY - window.innerHeight / 2 }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const { cx, cy } = center(e)
    zoomAt(cx, cy, e.deltaY < 0 ? 1.2 : 1 / 1.2)
  }

  function onDoubleClick(e: React.MouseEvent) {
    const { cx, cy } = center(e)
    setView((v) => {
      if (v.s > 1.01) return { s: 1, tx: 0, ty: 0 }
      const s = 2
      return { s, tx: cx - (cx - v.tx) * (s / v.s), ty: cy - (cy - v.ty) * (s / v.s) }
    })
  }

  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty }
      pinchStart.current = null
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), s: view.s }
      dragStart.current = null
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const midX = (a.x + b.x) / 2 - window.innerWidth / 2
      const midY = (a.y + b.y) / 2 - window.innerHeight / 2
      const target = clampScale(pinchStart.current.s * (dist / pinchStart.current.dist))
      setView((v) => {
        const k = target / v.s
        if (!isFinite(k) || k === 1) return v
        return { s: target, tx: midX - (midX - v.tx) * k, ty: midY - (midY - v.ty) * k }
      })
    } else if (pointers.current.size === 1 && dragStart.current) {
      const d = dragStart.current
      setView((v) => ({ ...v, tx: d.tx + (e.clientX - d.x), ty: d.ty + (e.clientY - d.y) }))
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
    if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()]
      dragStart.current = { x: p.x, y: p.y, tx: view.tx, ty: view.ty }
    } else if (pointers.current.size === 0) {
      dragStart.current = null
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={open.alt || 'Diagram'}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(5,34,52,0.94)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="flex items-center justify-end gap-2 p-3">
        <button
          onClick={() => zoomAt(0, 0, 1 / 1.4)}
          aria-label="Zoom out"
          className="h-10 w-10 rounded-lg text-xl font-bold text-white/90"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          −
        </button>
        <button
          onClick={() => zoomAt(0, 0, 1.4)}
          aria-label="Zoom in"
          className="h-10 w-10 rounded-lg text-xl font-bold text-white/90"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          +
        </button>
        <button
          ref={closeBtn}
          onClick={close}
          aria-label="Close"
          className="h-10 w-10 rounded-lg text-xl font-bold text-white/90"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          ×
        </button>
      </div>
      <div
        className="flex flex-1 items-center justify-center overflow-hidden"
        style={{ touchAction: 'none', cursor: view.s > 1 ? 'grab' : 'zoom-in' }}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={open.src}
          alt={open.alt}
          draggable={false}
          className="max-h-[82vh] max-w-[94vw] select-none"
          style={{
            transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`,
            transition: pointers.current.size ? 'none' : 'transform 0.15s ease-out',
          }}
        />
      </div>
      {open.caption && (
        <div className="px-6 pb-5 pt-2 text-center text-sm text-white/75">{open.caption}</div>
      )}
    </div>
  )
}
