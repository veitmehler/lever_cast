'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertTriangle, ArrowLeft, Save, RefreshCw, CheckCircle2 } from 'lucide-react'

type Template = Record<string, string>
type Delivery = Record<string, string>

const COLOR_FIELDS: Array<[string, string]> = [
  ['nlHeaderBgColor', 'Header background'],
  ['nlFooterBgColor', 'Footer background'],
  ['nlSectionColor1', 'Content band 1'],
  ['nlSectionColor2', 'Content band 2'],
  ['nlSectionColor3', 'Content band 3'],
  ['nlSectionColor4', 'Content band 4'],
  ['nlFontColor', 'Body text color'],
  ['nlLinkColor', 'Link color'],
]
const WEIGHTS = ['400', '500', '600', '700', '800']

export default function NewsletterTemplatePage() {
  const [template, setTemplate] = useState<Template>({})
  const [delivery, setDelivery] = useState<Delivery>({})
  const [ghlConnected, setGhlConnected] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refreshPreview = useCallback(async (t: Template) => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/newsletters/template-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: t }),
      })
      if (res.ok) {
        const data = await res.json()
        setPreviewHtml(data.html ?? '')
      }
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/newsletters/settings', { cache: 'no-store' })
        if (!res.ok) {
          setError(`HTTP ${res.status}`)
          return
        }
        const data = await res.json()
        const t: Template = {}
        for (const [k, v] of Object.entries(data.template ?? {})) t[k] = (v as string) ?? ''
        const d: Delivery = {}
        for (const [k, v] of Object.entries(data.delivery ?? {})) d[k] = (v as string) ?? ''
        setTemplate(t)
        setDelivery(d)
        setGhlConnected(!!data.ghlConnected)
        await refreshPreview(t)
      } catch (err) {
        setError((err as Error).message ?? 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    })()
  }, [refreshPreview])

  const [uploadingLogo, setUploadingLogo] = useState(false)

  function setT(key: string, value: string) {
    setTemplate((prev) => ({ ...prev, [key]: value }))
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadingLogo(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/newsletters/logo', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Logo upload failed')
        return
      }
      setTemplate((prev) => ({ ...prev, nlLogoUrl: data.url }))
      setNotice('Logo uploaded.')
    } catch (err) {
      setError((err as Error).message ?? 'Logo upload failed')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function removeLogo() {
    setUploadingLogo(true)
    try {
      await fetch('/api/newsletters/logo', { method: 'DELETE' })
      setTemplate((prev) => ({ ...prev, nlLogoUrl: '' }))
    } catch {
      /* ignore */
    } finally {
      setUploadingLogo(false)
    }
  }
  function setD(key: string, value: string) {
    setDelivery((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch('/api/newsletters/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, delivery }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
        return
      }
      setNotice('Saved.')
      await refreshPreview(template)
    } catch (err) {
      setError((err as Error).message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/newsletter"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Newsletter
      </Link>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Template &amp; delivery</h1>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>

      {notice && <div className="mb-3 text-sm text-green-700">{notice}</div>}
      {error && (
        <div className="mb-3 flex items-start gap-2 text-sm text-red-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          {/* Appearance */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Appearance
            </h3>
            <div className="space-y-3">
              {COLOR_FIELDS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-foreground">{label}</label>
                  <input
                    type="color"
                    value={template[key] || '#000000'}
                    onChange={(e) => setT(key, e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border border-border"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Font family (CSS stack)
                </label>
                <input
                  value={template.nlFontFamily || ''}
                  onChange={(e) => setT('nlFontFamily', e.target.value)}
                  placeholder="Georgia, serif"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Heading weight</label>
                  <select
                    value={template.nlHeadingFontWeight || '700'}
                    onChange={(e) => setT('nlHeadingFontWeight', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    {WEIGHTS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Body weight</label>
                  <select
                    value={template.nlBodyFontWeight || '400'}
                    onChange={(e) => setT('nlBodyFontWeight', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    {WEIGHTS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Header logo */}
              <div className="border-t border-border pt-3">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Header logo (shown in the email header)
                </label>
                {template.nlLogoUrl ? (
                  <div className="mb-2 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.nlLogoUrl}
                      alt="Newsletter logo"
                      style={{ width: `${parseInt(template.nlLogoWidth || '0', 10) || 200}px`, maxWidth: '100%' }}
                      className="rounded border border-border bg-white p-1"
                    />
                    <button onClick={removeLogo} disabled={uploadingLogo} className="text-xs text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                ) : null}
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={uploadLogo} className="text-sm" />
                  {uploadingLogo && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <label className="mb-1 mt-3 block text-xs font-medium text-muted-foreground">
                  Logo width: {parseInt(template.nlLogoWidth || '0', 10) || 320}px
                </label>
                <input
                  type="range"
                  min={120}
                  max={600}
                  step={10}
                  value={parseInt(template.nlLogoWidth || '0', 10) || 320}
                  onChange={(e) => setT('nlLogoWidth', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Delivery (GoHighLevel)
            </h3>
            {!ghlConnected && (
              <p className="mb-3 text-xs text-amber-600">
                Connect GoHighLevel in Settings to enable sending.
              </p>
            )}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">From name</label>
                  <input
                    value={delivery.newsletterFromName || ''}
                    onChange={(e) => setD('newsletterFromName', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">From email</label>
                  <input
                    type="email"
                    value={delivery.newsletterFromEmail || ''}
                    onChange={(e) => setD('newsletterFromEmail', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tag ID</label>
                  <input
                    value={delivery.newsletterTagId || ''}
                    onChange={(e) => setD('newsletterTagId', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tag name</label>
                  <input
                    value={delivery.newsletterTagName || ''}
                    onChange={(e) => setD('newsletterTagName', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Send time</label>
                  <input
                    type="time"
                    value={delivery.newsletterSendTime || '09:00'}
                    onChange={(e) => setD('newsletterSendTime', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Timezone</label>
                  <input
                    value={delivery.newsletterTimezone || 'America/New_York'}
                    onChange={(e) => setD('newsletterTimezone', e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl border border-border bg-card p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs text-muted-foreground">Live preview (sample content)</span>
            <button
              onClick={() => refreshPreview(template)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </button>
          </div>
          {previewHtml ? (
            <iframe
              title="Template preview"
              srcDoc={previewHtml}
              className="h-[760px] w-full rounded-lg border-0 bg-white"
            />
          ) : (
            <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Adjust settings, then Refresh.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
