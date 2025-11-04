'use client'

import { useState } from 'react'
import { Eye, EyeOff, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'

// Mock data
const mockSettings = {
  theme: 'dark',
  sidebarState: 'expanded',
  apiKeys: {
    openai: '••••••••••••••••••••sk-abc123',
    anthropic: '',
    gemini: '',
    openrouter: ''
  },
  connectedAccounts: {
    linkedin: true,
    twitter: false
  }
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [apiKeys, setApiKeys] = useState(mockSettings.apiKeys)
  const [selectedProvider, setSelectedProvider] = useState('openai')

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences, API keys, and connected accounts
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Theme
              </label>
              <div className="flex gap-3">
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex-1 rounded-lg p-4 text-left transition-all ${
                    theme === 'dark' 
                      ? 'border-2 border-primary bg-secondary' 
                      : 'border border-border bg-muted hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-foreground">Dark Mode</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {theme === 'dark' ? 'Current theme' : 'Click to activate'}
                  </div>
                </button>
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex-1 rounded-lg p-4 text-left transition-all ${
                    theme === 'light' 
                      ? 'border-2 border-primary bg-secondary' 
                      : 'border border-border bg-muted hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-foreground">Light Mode</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {theme === 'light' ? 'Current theme' : 'Click to activate'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">AI Provider Settings</h2>
          
          <div className="mb-4">
            <label className="text-sm font-medium text-card-foreground mb-2 block">
              Default LLM Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="gemini">Google Gemini</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>

          <div className="space-y-4">
            {Object.entries(apiKeys).map(([provider, key]) => (
              <div key={provider}>
                <label className="text-sm font-medium text-card-foreground mb-2 block capitalize">
                  {provider} API Key
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKeys[provider] ? 'text' : 'password'}
                      value={key}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                      placeholder={`Enter your ${provider} API key`}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={() => toggleApiKeyVisibility(provider)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKeys[provider] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!key}
                    className="px-3"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Save API Keys
          </Button>
        </div>

        {/* Connected Accounts */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Connected Accounts</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your social media accounts to publish directly from Levercast
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white font-bold">
                  in
                </div>
                <div>
                  <div className="font-medium text-card-foreground">LinkedIn</div>
                  {mockSettings.connectedAccounts.linkedin && (
                    <div className="text-xs text-primary">Connected</div>
                  )}
                </div>
              </div>
              <Button
                variant={mockSettings.connectedAccounts.linkedin ? 'outline' : 'default'}
                size="sm"
                className={mockSettings.connectedAccounts.linkedin ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
              >
                {mockSettings.connectedAccounts.linkedin ? 'Disconnect' : 'Connect'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1DA1F2] flex items-center justify-center text-white font-bold">
                  𝕏
                </div>
                <div>
                  <div className="font-medium text-card-foreground">Twitter / X</div>
                  {!mockSettings.connectedAccounts.twitter && (
                    <div className="text-xs text-muted-foreground">Not connected</div>
                  )}
                </div>
              </div>
              <Button
                variant="default"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Connect
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

