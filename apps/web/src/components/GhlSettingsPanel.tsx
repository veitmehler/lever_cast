'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Loader2, RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { GhlAccountIds, GhlSocialAccount } from '@/lib/ghl/types'

const GHL_PLATFORMS = [
  { key: 'facebook' as const, label: 'Facebook' },
  { key: 'instagram' as const, label: 'Instagram' },
  { key: 'linkedin' as const, label: 'LinkedIn' },
]

export function GhlSettingsPanel() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)

  const [ghlApiKey, setGhlApiKey] = useState('')
  const [ghlLocationId, setGhlLocationId] = useState('')
  const [ghlUserId, setGhlUserId] = useState('')
  const [maskedApiKey, setMaskedApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [accountIds, setAccountIds] = useState<GhlAccountIds>({})
  const [availableAccounts, setAvailableAccounts] = useState<GhlSocialAccount[]>([])
  const [lastError, setLastError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/ghl/settings')
      if (!response.ok) {
        throw new Error('Failed to load GHL settings')
      }
      const data = await response.json()
      setGhlLocationId(data.ghlLocationId ?? '')
      setGhlUserId(data.ghlUserId ?? '')
      setMaskedApiKey(data.maskedApiKey ?? '')
      setHasApiKey(!!data.hasApiKey)
      setAccountIds(data.accountIds ?? {})
      setLastError(data.lastError ?? null)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load Go HighLevel settings')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    if (!ghlLocationId.trim() || !ghlUserId.trim()) {
      toast.error('Location ID and GHL User ID are required')
      return
    }
    if (!ghlApiKey.trim() && !hasApiKey) {
      toast.error('GHL API key is required')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/ghl/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghlApiKey: ghlApiKey.trim() || undefined,
          ghlLocationId: ghlLocationId.trim(),
          ghlUserId: ghlUserId.trim(),
          accountIds,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save GHL settings')
      }

      setMaskedApiKey(data.maskedApiKey ?? '')
      setHasApiKey(true)
      setGhlApiKey('')
      toast.success('Go HighLevel settings saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save GHL settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadAccounts = async () => {
    try {
      setIsLoadingAccounts(true)
      const response = await fetch('/api/ghl/accounts')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load GHL accounts')
      }
      setAvailableAccounts(data.accounts ?? [])
      setLastError(null)
      toast.success(`Loaded ${data.accounts?.length ?? 0} GHL account(s)`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load accounts'
      setLastError(message)
      toast.error(message)
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  const openGhlOAuth = async (platform: string) => {
    try {
      const response = await fetch(`/api/ghl/oauth-url/${platform}`)
      const data = await response.json()
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Could not get GHL OAuth URL')
      }
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open GHL connect page')
    }
  }

  const accountsForPlatform = (platform: string) =>
    availableAccounts.filter((a) => a.platform === platform)

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-card-foreground">Go HighLevel</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Facebook, Instagram, and LinkedIn publishing is routed through your GHL Social Planner.
          Connect accounts in GHL, then map them here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1">Private Integration API key</label>
          <input
            type="password"
            value={ghlApiKey}
            onChange={(e) => setGhlApiKey(e.target.value)}
            placeholder={hasApiKey ? maskedApiKey || '••••••••' : 'Paste GHL API key'}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          {hasApiKey && !ghlApiKey && (
            <p className="text-xs text-muted-foreground mt-1">Saved key: {maskedApiKey || 'configured'}. Enter a new value to replace it.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1">Location ID</label>
          <input
            type="text"
            value={ghlLocationId}
            onChange={(e) => setGhlLocationId(e.target.value)}
            placeholder="ve9EPM428h8vShlRW1KT"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1">GHL User ID</label>
          <input
            type="text"
            value={ghlUserId}
            onChange={(e) => setGhlUserId(e.target.value)}
            placeholder="Team member who owns scheduled posts"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save GHL settings
        </Button>
        <Button variant="outline" onClick={() => void handleLoadAccounts()} disabled={isLoadingAccounts}>
          {isLoadingAccounts ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Load accounts from GHL
        </Button>
      </div>

      {lastError && (
        <p className="text-sm text-destructive">Last GHL error: {lastError}</p>
      )}

      <div className="space-y-3 pt-2 border-t border-border">
        <p className="text-sm font-medium text-card-foreground">Platform account mapping</p>
        {GHL_PLATFORMS.map(({ key, label }) => {
          const options = accountsForPlatform(key)
          return (
            <div key={key} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-[120px] text-sm text-card-foreground">{label}</div>
              <select
                value={accountIds[key] ?? ''}
                onChange={(e) =>
                  setAccountIds((prev) => ({
                    ...prev,
                    [key]: e.target.value || undefined,
                  }))
                }
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select GHL account…</option>
                {options.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name ?? account.id}
                    {account.isExpired ? ' (expired)' : ''}
                  </option>
                ))}
              </select>
              <Button variant="ghost" size="sm" onClick={() => void openGhlOAuth(key)}>
                <ExternalLink className="w-4 h-4 mr-1" />
                Connect in GHL
              </Button>
            </div>
          )
        })}
        <p className="text-xs text-muted-foreground">
          If an account is missing, click &quot;Connect in GHL&quot;, complete OAuth in Go HighLevel, then click &quot;Load accounts from GHL&quot; again.
        </p>
      </div>
    </div>
  )
}
