'use client'

import { useCallback, useEffect, useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

/**
 * Find the nearest preceding H2 heading text for this node position.
 * Walks backwards from the node's position in the ProseMirror document.
 */
function findPrecedingH2Text(editor: NodeViewProps['editor'], getPos: NodeViewProps['getPos']): string {
  const pos = typeof getPos === 'function' ? getPos() : undefined
  if (pos == null) return ''

  let found = ''
  editor.state.doc.nodesBetween(0, pos, (node) => {
    if (node.type.name === 'heading' && node.attrs.level === 2) {
      found = node.textContent.trim()
    }
  })
  return found
}

/**
 * React NodeView for article diagrams.
 *
 * - Caption auto-derives from the preceding H2 as "Diagram: {heading}".
 *   It updates live as the user edits headings, and is NOT user-editable.
 * - Alt text mirrors the caption.
 * - On save, `renderHTML` serialises the derived caption and alt from node attrs.
 */
export function ArticleDiagramView({ node, editor, getPos, updateAttributes, selected }: NodeViewProps) {
  const src = node.attrs.src as string | null
  const storedCaption = ((node.attrs.caption as string | undefined) ?? '').trim()
  const [caption, setCaption] = useState(storedCaption)

  const derive = useCallback(() => {
    const h2 = findPrecedingH2Text(editor, getPos)
    const altText = h2 ? `Diagram: ${h2}` : storedCaption

    if (storedCaption) {
      // Respect the LLM-generated caption; only keep alt text live from H2
      setCaption(storedCaption)
      updateAttributes({ alt: altText })
      return
    }

    // Fallback: no stored caption — derive display caption from H2
    const text = h2 ? `Diagram: ${h2}` : ''
    setCaption(text)
    updateAttributes({ caption: text, alt: text })
  }, [editor, getPos, updateAttributes, storedCaption])

  // Derive on mount.
  useEffect(() => { derive() }, [derive])

  // Re-derive alt text whenever the document changes (heading edits, reorders, etc.).
  useEffect(() => {
    const handler = () => derive()
    editor.on('update', handler)
    return () => { editor.off('update', handler) }
  }, [editor, derive])

  return (
    <NodeViewWrapper
      as="figure"
      className={`article-diagram${selected ? ' diagram-node-selected' : ''}`}
      data-drag-handle
    >
      {src && (
        <img
          src={src}
          alt={caption}
          loading="lazy"
          style={{ display: 'block', margin: '0 auto', borderRadius: '0.75rem' }}
        />
      )}
      {caption && (
        <figcaption style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.4rem' }}>
          {caption}
        </figcaption>
      )}
    </NodeViewWrapper>
  )
}
