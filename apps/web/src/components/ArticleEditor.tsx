'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { Bold, Heading2, Heading3, Heading4, Italic, Link2Icon, List, ListOrdered, Redo2, Save, Undo2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import '@/app/article-typography.css'
import { ArticleDiagram } from '@/components/tiptap/ArticleDiagram'
import { GeoSummary } from '@/components/tiptap/GeoSummary'
import { IslandMarker } from '@/components/tiptap/IslandMarker'
import { restorePreservedArticleBlocks, stripPreservedArticleBlocks, stripTocFromHtml } from '@/lib/article-html-islands'

type TocEntry = { level: 2 | 3; text: string }

/** Extract h2/h3 entries from the live TipTap editor JSON. */
function extractTocEntries(editor: import('@tiptap/react').Editor): TocEntry[] {
  const entries: TocEntry[] = []
  editor.state.doc.forEach((node) => {
    if (node.type.name === 'heading' && (node.attrs.level === 2 || node.attrs.level === 3)) {
      const text = node.textContent.trim()
      if (text) entries.push({ level: node.attrs.level as 2 | 3, text })
    }
  })
  return entries
}

/** Scroll to the first heading in the editor that matches the given text. */
function scrollToHeading(editorEl: HTMLElement | null, text: string) {
  if (!editorEl) return
  const headings = editorEl.querySelectorAll<HTMLElement>('h2, h3')
  for (const h of headings) {
    if (h.textContent?.trim() === text) {
      h.scrollIntoView({ behavior: 'smooth', block: 'start' })
      break
    }
  }
}

/**
 * Strips a leading <p> whose text begins with a markdown heading sigil (# …).
 * Happens when old articles were approved before the server-side cleanup was deployed.
 */
function stripOrphanedMarkdownHeading(html: string): string {
  if (typeof document === 'undefined') return html
  const tpl = document.implementation.createHTMLDocument('')
  const div = tpl.createElement('div')
  div.innerHTML = html
  const first = div.firstElementChild
  if (first && first.tagName === 'P' && /^#{1,6}\s/.test(first.textContent?.trim() ?? '')) {
    first.remove()
  }
  return div.innerHTML
}

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
  }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Placeholder.configure({ placeholder: 'Edit your article…' }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: 'https',
    HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
  }),
  ArticleDiagram,
  GeoSummary,
  IslandMarker,
]

export type ArticleEditorCitation = { link_title: string; link_url: string }

export type ArticleEditorInitial = {
  title: string
  slug: string
  bodyHtml: string
  seoTitle: string
  seoDescription: string
  excerpt: string
  readingTime?: number | null
  primaryKeyword?: string
}

type ArticleEditorProps = {
  jobId: string
  initial: ArticleEditorInitial
  featuredImage?: { url: string; altText?: string | null } | null
  citations: ArticleEditorCitation[]
  disclaimer: string
}

export function ArticleEditor({ jobId, initial, featuredImage, citations, disclaimer }: ArticleEditorProps) {
  const [mounted, setMounted] = useState(false)
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle)
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription)
  const [excerpt, setExcerpt] = useState(initial.excerpt)
  const [saving, setSaving] = useState(false)
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([])

  const islandsRef = useRef<Record<string, { html: string; label: string }>>({})
  const editorWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  const { editorHtml, islands } = useMemo(() => {
    if (!mounted)
      return { editorHtml: initial.bodyHtml, islands: {} as Record<string, { html: string; label: string }> }
    const { editorHtml: stripped, islands: extractedIslands } = stripPreservedArticleBlocks(initial.bodyHtml)
    // Remove the static TOC — it's rendered live and regenerated server-side on save.
    return { editorHtml: stripTocFromHtml(stripped), islands: extractedIslands }
  }, [mounted, initial.bodyHtml])

  useEffect(() => {
    islandsRef.current = islands
  }, [islands])

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    editable: false,
    content: '',
    editorProps: {
      attributes: {
        class: 'article-body focus:outline-none min-h-[24rem] max-w-none px-1 py-2',
      },
    },
    onUpdate: ({ editor: e }) => setTocEntries(extractTocEntries(e)),
    onCreate: ({ editor: e }) => setTocEntries(extractTocEntries(e)),
  })

  // TipTap initialises as non-editable; flip to editable once the client has mounted.
  useEffect(() => {
    if (!editor || !mounted) return
    editor.setEditable(true)
  }, [editor, mounted])

  useEffect(() => {
    if (!editor || !mounted) return
    editor.commands.setContent(stripOrphanedMarkdownHeading(editorHtml) || '<p></p>', { emitUpdate: false })
  }, [editor, mounted, editorHtml])

  useEffect(() => {
    setSeoTitle(initial.seoTitle)
    setSeoDescription(initial.seoDescription)
    setExcerpt(initial.excerpt)
  }, [initial.seoTitle, initial.seoDescription, initial.excerpt])

  const validCitations = citations.filter((c) => c.link_url)

  const handleSave = async () => {
    if (!editor) return
    setSaving(true)
    try {
      const mergedHtml = restorePreservedArticleBlocks(editor.getHTML(), islandsRef.current)
      const res = await fetch(`/api/articles/${jobId}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyHtml: mergedHtml,
          seoTitle: seoTitle.trim(),
          seoDescription: seoDescription.trim(),
          excerpt: excerpt.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? 'Save failed')
      }
      toast.success('Article saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Google snippet preview — live */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8 font-sans">
          <div className="text-xs text-green-700 dark:text-green-400 mb-1 truncate">
            {initial.slug || 'your-site.com/article-slug'}
          </div>
          <div className="text-lg font-semibold text-blue-800 dark:text-blue-200 leading-tight mb-1">{seoTitle || 'Meta title'}</div>
          <div className="text-sm text-muted-foreground leading-relaxed">{seoDescription || 'Meta description'}</div>
        </div>

        <article className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {featuredImage?.url && (
            <div className="relative w-full" style={{ paddingTop: '52%' }}>
              <Image
                src={featuredImage.url}
                alt={featuredImage.altText ?? initial.title}
                fill
                className="object-cover"
                sizes="(max-width: 800px) 100vw, 768px"
                priority
              />
            </div>
          )}

          <div className="px-8 py-10">
            <h1 className="text-3xl font-bold text-card-foreground leading-tight mb-4">{seoTitle || initial.title}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
              {initial.readingTime != null ? <span>{initial.readingTime} min read</span> : null}
              {initial.primaryKeyword ? (
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">{initial.primaryKeyword}</span>
              ) : null}
            </div>

            <section className="space-y-4 mb-8 border border-border rounded-xl p-4 bg-muted/30">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Edit metadata</h2>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Meta title</label>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Meta description</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Excerpt</label>
                <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </section>

            {/* Live Table of Contents — rebuilt from editor headings on every edit */}
            {mounted && tocEntries.length > 0 && (
              <nav className="mb-4 border border-border rounded-xl overflow-hidden">
                <details open>
                  <summary className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 cursor-pointer text-sm font-semibold text-card-foreground select-none">
                    <span className="mr-auto">Table of Contents</span>
                    <span className="text-xs text-muted-foreground font-normal">live · updates as you edit</span>
                  </summary>
                  <LiveTocList entries={tocEntries} onClickEntry={(text) => scrollToHeading(editorWrapperRef.current, text)} />
                </details>
              </nav>
            )}

            {/* Key Takeaways — read-only panel rendered outside TipTap */}
            {mounted && Object.keys(islands).length > 0 && (
              <div className="mb-6 space-y-3">
                {Object.entries(islands)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([id, { html, label }]) => (
                    <details key={id} className="border border-border rounded-xl overflow-hidden" open>
                      <summary className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 cursor-pointer text-sm font-semibold text-card-foreground select-none">
                        <span className="mr-auto">{label}</span>
                        <span className="text-xs text-muted-foreground font-normal">click to collapse</span>
                      </summary>
                      <div
                        className="article-body px-4 py-4"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    </details>
                  ))}
              </div>
            )}

            {/* TipTap */}
            {!mounted ? (
              <div className="article-body rounded-xl bg-muted animate-pulse min-h-[360px]" />
            ) : (
              <div className="article-editor border border-border rounded-xl bg-background overflow-hidden">
                <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/40">
                  {editor && (
                    <>
                      <ToolbarIcon
                        pressed={editor.isActive('bold')}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        label="Bold"
                      >
                        <Bold className="h-4 w-4" />
                      </ToolbarIcon>
                      <ToolbarIcon pressed={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic">
                        <Italic className="h-4 w-4" />
                      </ToolbarIcon>
                      <div className="w-px h-6 bg-border mx-1 self-center" />
                      <ToolbarIcon pressed={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="H2">
                        <Heading2 className="h-4 w-4" />
                      </ToolbarIcon>
                      <ToolbarIcon pressed={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="H3">
                        <Heading3 className="h-4 w-4" />
                      </ToolbarIcon>
                      <ToolbarIcon pressed={editor.isActive('heading', { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} label="H4">
                        <Heading4 className="h-4 w-4" />
                      </ToolbarIcon>
                      <div className="w-px h-6 bg-border mx-1 self-center" />
                      <ToolbarIcon pressed={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bullet list">
                        <List className="h-4 w-4" />
                      </ToolbarIcon>
                      <ToolbarIcon pressed={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Ordered list">
                        <ListOrdered className="h-4 w-4" />
                      </ToolbarIcon>
                      <ToolbarIcon
                        pressed={editor.isActive('link')}
                        onClick={() => {
                          const prev = editor.getAttributes('link').href as string | undefined
                          const href = window.prompt('Link URL', prev ?? 'https://')
                          if (href === null) return
                          if (href === '') {
                            editor.chain().focus().extendMarkRange('link').unsetLink().run()
                            return
                          }
                          editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
                        }}
                        label="Link"
                      >
                        <Link2Icon className="h-4 w-4" />
                      </ToolbarIcon>
                      <div className="w-px h-6 bg-border mx-1 self-center" />
                      <ToolbarIcon pressed={false} onClick={() => editor.chain().focus().undo().run()} label="Undo">
                        <Undo2 className="h-4 w-4" />
                      </ToolbarIcon>
                      <ToolbarIcon pressed={false} onClick={() => editor.chain().focus().redo().run()} label="Redo">
                        <Redo2 className="h-4 w-4" />
                      </ToolbarIcon>
                    </>
                  )}
                </div>
                <div ref={editorWrapperRef}>
                  <EditorContent editor={editor} className="px-4 py-3" />
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button type="button" onClick={() => void handleSave()} disabled={saving || !mounted || !editor}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>

            {validCitations.length > 0 && (
              <section className="mt-10 border-t border-border pt-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">References</h2>
                <ol className="space-y-1.5 list-decimal pl-5">
                  {validCitations.map((c, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      <a href={c.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {c.link_title || c.link_url}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {disclaimer ? (
              <footer className="mt-8 bg-muted border border-border rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">{disclaimer}</footer>
            ) : null}
          </div>
        </article>

        <div className="mt-6 text-center">
          <a href={`/workflow/${jobId}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to job
          </a>
        </div>
      </div>
    </div>
  )
}

const LOWERCASE_WORDS = new Set(['a','an','the','and','but','or','nor','for','so','yet','at','by','in','of','on','to','up','as','is'])

/** CSS `text-transform: capitalize` equivalent in JS for consistent TOC labels. */
function toTitleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((word, i) => {
      const clean = word.replace(/[^a-zA-Z0-9''-]/g, '')
      if (i !== 0 && LOWERCASE_WORDS.has(clean.toLowerCase())) return word.toLowerCase()
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/** Nested TOC list — H2 items at top level, H3 items in a nested <ul>. */
function LiveTocList({ entries, onClickEntry }: { entries: TocEntry[]; onClickEntry: (text: string) => void }) {
  const groups: { h2: TocEntry; h3s: TocEntry[] }[] = []
  for (const e of entries) {
    if (e.level === 2) {
      groups.push({ h2: e, h3s: [] })
    } else if (groups.length > 0) {
      groups[groups.length - 1].h3s.push(e)
    }
  }

  return (
    <ul className="list-disc ml-6 py-3 pr-4 space-y-1 text-sm">
      {groups.map((g, i) => (
        <li key={i}>
          <button type="button" className="text-left text-primary hover:underline" onClick={() => onClickEntry(g.h2.text)}>
            {toTitleCase(g.h2.text)}
          </button>
          {g.h3s.length > 0 && (
            <ul className="list-disc ml-5 mt-1 space-y-0.5">
              {g.h3s.map((s, j) => (
                <li key={j}>
                  <button type="button" className="text-left text-primary hover:underline" onClick={() => onClickEntry(s.text)}>
                    {toTitleCase(s.text)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

function ToolbarIcon({
  children,
  onClick,
  pressed,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  pressed: boolean
  label: string
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-md p-2 transition-colors hover:bg-accent ${pressed ? 'bg-accent ring-1 ring-primary/30' : ''}`}
    >
      {children}
    </button>
  )
}
