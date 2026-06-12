'use client'

import { Loader2 } from 'lucide-react'
import { PlatformConnectionRow } from './PlatformConnectionRow'
import { TelegramRow } from './TelegramRow'
import type { SettingsData } from './useSettingsData'
import type { SocialConnectionsData } from './useSocialConnections'

export function ConnectedAccountsSection({ settings, social }: { settings: SettingsData; social: SocialConnectionsData }) {
  const { isLoadingConnections } = social

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-xl font-semibold text-card-foreground mb-4">Connected Accounts</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Twitter and Telegram use direct OAuth here. Facebook, Instagram, LinkedIn, and Threads publish via Omniply above.
      </p>

      {isLoadingConnections ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {['linkedin', 'twitter', 'facebook', 'instagram', 'threads'].map((platform) => (
            <PlatformConnectionRow key={platform} platform={platform} social={social} />
          ))}

          <TelegramRow settings={settings} social={social} />
        </div>
      )}
    </div>
  )
}
