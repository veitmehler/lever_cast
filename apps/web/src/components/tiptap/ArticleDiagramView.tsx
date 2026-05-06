'use client'

import { useEffect, useRef, useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

/**
 * React NodeView for article diagrams.
 *
 * Renders the diagram image with:
 *   - An inline editable figcaption (styled exactly like the published version)
 *   - A compact editor-only alt-text input
 *
 * `updateAttributes` writes changes back to the ProseMirror node so that
 * `editor.getHTML()` serialises the updated caption/alt when the user saves.
 */
export function ArticleDiagramView({ node, updateAttributes, selected }: NodeViewProps) {
  const src = node.attrs.src as string | null
  const [caption, setCaption] = useState<string>((node.attrs.caption as string | null) ?? '')
  const [alt, setAlt] = useState<string>((node.attrs.alt as string | null) ?? '')
  const captionRef = useRef<HTMLTextAreaElement>(null)

  // Sync if the node attrs are updated externally (e.g. initial load / undo).
  useEffect(() => setCaption((node.attrs.caption as string | null) ?? ''), [node.attrs.caption])
  useEffect(() => setAlt((node.attrs.alt as string | null) ?? ''), [node.attrs.alt])

  // Auto-resize the caption textarea to fit its content.
  useEffect(() => {
    const el = captionRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [caption])

  const stopPropagation = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation()

  return (
    <NodeViewWrapper
      as="figure"
      className={`article-diagram${selected ? ' diagram-node-selected' : ''}`}
      data-drag-handle
    >
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{ display: 'block', margin: '0 auto', borderRadius: '0.75rem' }}
        />
      )}

      {/* Inline editable figcaption */}
      <textarea
        ref={captionRef}
        className="diagram-caption-input"
        placeholder="Add a caption…"
        value={caption}
        rows={1}
        onChange={(e) => setCaption(e.target.value)}
        onBlur={(e) => updateAttributes({ caption: e.currentTarget.value.trim() })}
        onMouseDown={stopPropagation}
        onClick={stopPropagation}
        onKeyDown={stopPropagation}
      />

      {/* Editor-only alt-text field */}
      <div className="diagram-alt-row" onMouseDown={stopPropagation} onClick={stopPropagation}>
        <span className="diagram-alt-label">Alt</span>
        <input
          type="text"
          className="diagram-alt-input"
          placeholder="Describe the image for screen readers…"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onBlur={(e) => updateAttributes({ alt: e.currentTarget.value.trim() })}
          onMouseDown={stopPropagation}
          onClick={stopPropagation}
          onKeyDown={stopPropagation}
        />
      </div>
    </NodeViewWrapper>
  )
}
