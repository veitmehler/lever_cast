'use client'

import { Eye, EyeOff, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { ApiKeyData } from './types'
import type { SettingsData } from './useSettingsData'
import type { SocialConnectionsData } from './useSocialConnections'

// Telegram - Uses API Key instead of OAuth
export function TelegramRow({ settings, social }: { settings: SettingsData; social: SocialConnectionsData }) {
  const {
    isSaving, setIsSaving,
    telegramBotToken, setTelegramBotToken,
    telegramMaskedKey, setTelegramMaskedKey,
    isEditingTelegram, setIsEditingTelegram,
    showTelegramKey, setShowTelegramKey,
    telegramChatId, setTelegramChatId,
    isSavingTelegramChatId, setIsSavingTelegramChatId,
  } = settings
  const { isDisconnecting, setIsDisconnecting } = social

  const hasTelegramKey = !!telegramMaskedKey
  const telegramInputValue = telegramBotToken
  const telegramDisplayValue = telegramInputValue || (hasTelegramKey && !isEditingTelegram ? telegramMaskedKey : '')

  const handleSaveTelegramKey = async () => {
    const apiKey = telegramInputValue?.trim()
    if (!apiKey) {
      toast.error('Please enter a Telegram bot token')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'telegram', apiKey }),
      })

      if (response.ok) {
        const result: ApiKeyData = await response.json()
        setTelegramMaskedKey(result.maskedKey)
        setTelegramBotToken('')
        setIsEditingTelegram(false)
        toast.success('Telegram bot token saved successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save Telegram bot token')
      }
    } catch (error) {
      console.error('Error saving Telegram bot token:', error)
      toast.error('Failed to save Telegram bot token')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveTelegramKey = async () => {
    if (!confirm('Are you sure you want to remove your Telegram bot token?')) {
      return
    }

    try {
      setIsDisconnecting(prev => ({ ...prev, telegram: true }))
      const response = await fetch('/api/api-keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'telegram' }),
      })
      if (response.ok) {
        setTelegramMaskedKey('')
        toast.success('Telegram bot token removed successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove Telegram bot token')
      }
    } catch (error) {
      console.error('Error removing Telegram bot token:', error)
      toast.error('Failed to remove Telegram bot token')
    } finally {
      setIsDisconnecting(prev => ({ ...prev, telegram: false }))
    }
  }

  return (
    <div key="telegram" className="flex items-center justify-between p-4 rounded-lg border border-border">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold bg-[#0088cc]">
          📱
        </div>
        <div className="flex-1">
          <div className="font-medium text-card-foreground mb-2">
            Telegram
          </div>
          <div className="relative">
            <input
              type={showTelegramKey && (telegramInputValue || isEditingTelegram) ? 'text' : 'password'}
              value={isEditingTelegram ? telegramInputValue : telegramDisplayValue}
              onChange={(e) => {
                setTelegramBotToken(e.target.value)
                if (!isEditingTelegram && hasTelegramKey) {
                  setIsEditingTelegram(true)
                }
              }}
              placeholder={hasTelegramKey && !isEditingTelegram ? telegramMaskedKey : 'Enter your Telegram bot token'}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
            {(telegramInputValue || isEditingTelegram) && (
              <button
                onClick={() => setShowTelegramKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showTelegramKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {hasTelegramKey && !isEditingTelegram && !telegramInputValue
              ? 'Bot token saved'
              : 'Get your bot token from @BotFather on Telegram'}
          </p>
          {hasTelegramKey && (
            <div className="mt-3">
              <label className="text-xs font-medium text-card-foreground mb-1 block">
                Default Telegram Channel ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="@channelname or -1001234567890"
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSavingTelegramChatId}
                  onClick={async () => {
                    try {
                      setIsSavingTelegramChatId(true)
                      const response = await fetch('/api/settings', {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          telegramChatId: telegramChatId || null,
                        }),
                      })
                      if (response.ok) {
                        toast.success('Telegram channel ID saved successfully')
                      } else {
                        const error = await response.json()
                        toast.error(error.error || 'Failed to save Telegram channel ID')
                      }
                    } catch (error) {
                      console.error('Error saving Telegram channel ID:', error)
                      toast.error('Failed to save Telegram channel ID')
                    } finally {
                      setIsSavingTelegramChatId(false)
                    }
                  }}
                  className="px-3"
                >
                  {isSavingTelegramChatId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Channel username (e.g., @mychannel) or numeric ID (e.g., -1001234567890). Your bot must be an admin of this channel.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        {(telegramInputValue || isEditingTelegram) && (
          <Button
            variant="outline"
            size="sm"
            disabled={!telegramInputValue || isSaving}
            onClick={() => handleSaveTelegramKey()}
            className="px-3"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </Button>
        )}
        {hasTelegramKey && !isEditingTelegram && !telegramInputValue && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditingTelegram(true)
                setTelegramBotToken('')
              }}
              className="px-3"
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveTelegramKey}
              disabled={isDisconnecting['telegram']}
              className="px-3"
            >
              {isDisconnecting['telegram'] ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Remove'
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
