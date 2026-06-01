'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Mic, Upload, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface VoiceSettings {
  voiceId: string | null
  modelId: string
  voiceoverEnabled: boolean
  stability: number
  similarity: number
  hasApiKey: boolean
  maskedApiKey?: string
}

interface ElevenLabsVoice {
  voice_id: string
  name: string
  category?: string
}

export function VoiceSettingsPanel() {
  const [settings, setSettings] = useState<VoiceSettings | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingVoices, setIsLoadingVoices] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [cloneName, setCloneName] = useState('My Voice')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/voice/settings')
      if (res.ok) {
        setSettings(await res.json())
      }
    } catch {
      toast.error('Failed to load voice settings')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const loadVoices = async () => {
    setIsLoadingVoices(true)
    try {
      const res = await fetch('/api/voice/voices')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load voices')
      }
      const data = await res.json()
      setVoices(data.voices ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load voices')
    } finally {
      setIsLoadingVoices(false)
    }
  }

  const saveSettings = async (patch: Partial<VoiceSettings> & { elevenLabsApiKey?: string }) => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/voice/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elevenLabsApiKey: patch.elevenLabsApiKey ?? (apiKey.trim() || undefined),
          elevenLabsVoiceId: patch.voiceId,
          elevenLabsModelId: patch.modelId,
          voiceoverEnabled: patch.voiceoverEnabled,
          voiceoverStability: patch.stability,
          voiceoverSimilarity: patch.similarity,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save')
      }
      const updated = await res.json()
      setSettings(updated)
      setApiKey('')
      toast.success('Voice settings saved')
      if (updated.hasApiKey) await loadVoices()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save voice settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClone = async (file: File) => {
    setIsCloning(true)
    try {
      const form = new FormData()
      form.append('name', cloneName.trim() || 'My Voice')
      form.append('file', file)

      const res = await fetch('/api/voice/clone', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Clone failed')

      toast.success(data.message || 'Voice cloned')
      await loadSettings()
      await loadVoices()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Voice cloning failed')
    } finally {
      setIsCloning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading voice settings…
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Volume2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-card-foreground">ElevenLabs Voice</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect your ElevenLabs account for quote video voiceovers. Instant Voice Cloning requires a paid ElevenLabs plan.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={settings?.hasApiKey ? '•••••••• (saved — enter to replace)' : 'sk_...'}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!apiKey.trim() || isSaving}
          onClick={() => saveSettings({})}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save API Key'}
        </Button>
      </div>

      {settings?.hasApiKey && (
        <>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-sm font-medium">Voice</label>
              <select
                value={settings.voiceId ?? ''}
                onChange={(e) => setSettings((s) => s ? { ...s, voiceId: e.target.value || null } : s)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a voice…</option>
                {voices.map((v) => (
                  <option key={v.voice_id} value={v.voice_id}>
                    {v.name}{v.category ? ` (${v.category})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={loadVoices} disabled={isLoadingVoices}>
              {isLoadingVoices ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Voices'}
            </Button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.voiceoverEnabled}
              onChange={(e) => setSettings((s) => s ? { ...s, voiceoverEnabled: e.target.checked } : s)}
              className="rounded"
            />
            <span className="text-sm">Enable voiceover on quote videos</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Stability ({settings.stability.toFixed(2)})</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.stability}
                onChange={(e) => setSettings((s) => s ? { ...s, stability: parseFloat(e.target.value) } : s)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Similarity ({settings.similarity.toFixed(2)})</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.similarity}
                onChange={(e) => setSettings((s) => s ? { ...s, similarity: parseFloat(e.target.value) } : s)}
                className="w-full"
              />
            </div>
          </div>

          <Button
            type="button"
            disabled={isSaving}
            onClick={() => settings && saveSettings(settings)}
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Voice Preferences
          </Button>

          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Clone Your Voice
            </h3>
            <p className="text-xs text-muted-foreground">
              Upload 1–2 minutes of clear speech. Raw samples are deleted after cloning. IVC requires a paid ElevenLabs plan.
            </p>
            <input
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              placeholder="Voice name"
              className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleClone(file)
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isCloning}
              onClick={() => fileInputRef.current?.click()}
            >
              {isCloning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload Sample & Clone
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
