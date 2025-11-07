'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Save, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { toast } from 'sonner'

type ApiKeyData = {
  id: string
  provider: string
  maskedKey: string
  createdAt: string
  updatedAt: string
}

type SocialConnection = {
  id: string
  platform: string
  platformUserId: string | null
  platformUsername: string | null
  isActive: boolean
  lastUsed: string | null
  createdAt: string
  updatedAt: string
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: '',
    anthropic: '',
    gemini: '',
    openrouter: ''
  })
  const [maskedKeys, setMaskedKeys] = useState<Record<string, string>>({})
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20241022',
    gemini: 'gemini-pro',
    openrouter: 'openai/gpt-4o-mini',
  })
  const [providerModels, setProviderModels] = useState<Record<string, Array<{ value: string; label: string }>>>({
    openai: [],
    anthropic: [],
    gemini: [],
    openrouter: [],
  })
  const [isLoadingModels, setIsLoadingModels] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingAISettings, setIsSavingAISettings] = useState(false)
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState<Record<string, boolean>>({})
  const [editingApiKeys, setEditingApiKeys] = useState<Record<string, boolean>>({})

  // Fetch settings and API keys on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        
        // Fetch settings
        const settingsResponse = await fetch('/api/settings')
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json()
          if (settings.defaultProvider) {
            setSelectedProvider(settings.defaultProvider)
          }
          if (settings.defaultModel) {
            try {
              const models = JSON.parse(settings.defaultModel)
              setSelectedModels(prev => ({ ...prev, ...models }))
            } catch (e) {
              // If not JSON, ignore
            }
          }
        }

        // Fetch API keys
        const keysResponse = await fetch('/api/api-keys')
        if (keysResponse.ok) {
          const keys: ApiKeyData[] = await keysResponse.json()
          const masked: Record<string, string> = {}
          keys.forEach(key => {
            masked[key.provider] = key.maskedKey
          })
          setMaskedKeys(masked)
          
          // Fetch models for providers that have API keys
          Object.keys(masked).forEach(provider => {
            if (masked[provider]) {
              fetchModelsForProvider(provider)
            }
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Fetch models when API keys are saved
  useEffect(() => {
    Object.keys(maskedKeys).forEach(provider => {
      if (maskedKeys[provider]) {
        fetchModelsForProvider(provider)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maskedKeys])

  // Function to fetch models for a provider
  const fetchModelsForProvider = async (provider: string) => {
    if (!maskedKeys[provider]) return // No API key, can't fetch models
    
    setIsLoadingModels(prev => ({ ...prev, [provider]: true }))
    try {
      const response = await fetch(`/api/ai/models/${provider}`)
      if (response.ok) {
        const data = await response.json()
        if (data.models && data.models.length > 0) {
          setProviderModels(prev => ({
            ...prev,
            [provider]: data.models,
          }))
          // Set default model if not already set
          if (!selectedModels[provider] && data.models[0]) {
            setSelectedModels(prev => ({
              ...prev,
              [provider]: data.models[0].value,
            }))
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching models for ${provider}:`, error)
    } finally {
      setIsLoadingModels(prev => ({ ...prev, [provider]: false }))
    }
  }

  // Fetch social connections on mount
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setIsLoadingConnections(true)
        const response = await fetch('/api/social/connections')
        if (response.ok) {
          const connections: SocialConnection[] = await response.json()
          setSocialConnections(connections)
        }
      } catch (error) {
        console.error('Error fetching social connections:', error)
      } finally {
        setIsLoadingConnections(false)
      }
    }

    fetchConnections()
  }, [])

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  const handleSaveApiKey = async (provider: string) => {
    const apiKey = apiKeys[provider]?.trim()
    if (!apiKey) {
      toast.error('Please enter an API key')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey }),
      })

      if (response.ok) {
        const result: ApiKeyData = await response.json()
        setMaskedKeys(prev => ({ ...prev, [provider]: result.maskedKey }))
        setApiKeys(prev => ({ ...prev, [provider]: '' })) // Clear input
        setEditingApiKeys(prev => ({ ...prev, [provider]: false }))
        // Fetch models for this provider
        fetchModelsForProvider(provider)
        toast.success(`${provider} API key saved successfully`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save API key')
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      toast.error('Failed to save API key')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAllApiKeys = async () => {
    const providers = Object.keys(apiKeys)
    const keysToSave = providers.filter(provider => apiKeys[provider]?.trim())

    if (keysToSave.length === 0) {
      toast.error('No API keys to save')
      return
    }

    try {
      setIsSaving(true)
      const promises = keysToSave.map(provider =>
        fetch('/api/api-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ provider, apiKey: apiKeys[provider].trim() }),
        })
      )

      const results = await Promise.all(promises)
      const allSuccess = results.every(r => r.ok)

      if (allSuccess) {
        // Refresh masked keys
        const response = await fetch('/api/api-keys')
        if (response.ok) {
          const keys: ApiKeyData[] = await response.json()
          const masked: Record<string, string> = {}
          keys.forEach(key => {
            masked[key.provider] = key.maskedKey
          })
          setMaskedKeys(masked)
        }
        setApiKeys({
          openai: '',
          anthropic: '',
          gemini: '',
          openrouter: ''
        })
        setEditingApiKeys({})
        // Fetch models for all providers that have keys
        Object.keys(masked).forEach(provider => {
          if (masked[provider]) {
            fetchModelsForProvider(provider)
          }
        })
        toast.success('All API keys saved successfully')
      } else {
        toast.error('Some API keys failed to save')
      }
    } catch (error) {
      console.error('Error saving API keys:', error)
      toast.error('Failed to save API keys')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAISettings = async () => {
    try {
      setIsSavingAISettings(true)
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defaultProvider: selectedProvider,
          defaultModel: JSON.stringify(selectedModels),
        }),
      })

      if (response.ok) {
        toast.success('AI settings saved successfully')
      } else {
        const error = await response.json()
        console.error('Failed to save AI settings:', error)
        toast.error(error.details || error.error || 'Failed to save AI settings')
      }
    } catch (error) {
      console.error('Error saving AI settings:', error)
      toast.error('Failed to save AI settings')
    } finally {
      setIsSavingAISettings(false)
    }
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
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Default LLM Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="gemini">Google Gemini</option>
                <option value="openrouter">OpenRouter</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Select which provider to use by default when generating content
              </p>
            </div>

            {/* Model Selection for each provider */}
            <div className="space-y-3">
              {Object.keys(providerModels).map((provider) => {
                const hasApiKey = !!maskedKeys[provider]
                const models = providerModels[provider] || []
                const isLoadingModel = isLoadingModels[provider]
                
                return (
                  <div key={provider}>
                    <label className="text-sm font-medium text-card-foreground mb-2 block capitalize">
                      {provider === 'openrouter' ? 'OpenRouter' : provider} Model
                      {hasApiKey && isLoadingModel && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          <Loader2 className="w-3 h-3 inline animate-spin" /> Loading models...
                        </span>
                      )}
                      {hasApiKey && !isLoadingModel && models.length === 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">(No models available)</span>
                      )}
                    </label>
                    <select
                      value={selectedModels[provider] || models[0]?.value || ''}
                      onChange={(e) => setSelectedModels(prev => ({ ...prev, [provider]: e.target.value }))}
                      disabled={models.length === 0}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {models.length > 0 ? (
                        models.map((model) => (
                          <option key={model.value} value={model.value}>
                            {model.label}
                          </option>
                        ))
                      ) : (
                        <option value="">No models available</option>
                      )}
                    </select>
                    {!hasApiKey && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Add an API key to see available models
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <Button
              onClick={handleSaveAISettings}
              disabled={isSavingAISettings}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSavingAISettings ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving AI Settings...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save AI Settings
                </>
              )}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {Object.keys(apiKeys).map((provider) => {
                  const hasExistingKey = !!maskedKeys[provider]
                  const isEditing = editingApiKeys[provider] || false
                  const inputValue = apiKeys[provider] || ''
                  const displayValue = inputValue || (hasExistingKey && !isEditing ? maskedKeys[provider] : '')
                  
                  return (
                    <div key={provider}>
                      <label className="text-sm font-medium text-card-foreground mb-2 block capitalize">
                        {provider} API Key
                        {hasExistingKey && !isEditing && !inputValue && (
                          <span className="ml-2 text-xs text-muted-foreground">(Saved)</span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showApiKeys[provider] && (inputValue || isEditing) ? 'text' : 'password'}
                            value={isEditing ? inputValue : displayValue}
                            onChange={(e) => {
                              setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))
                              if (!isEditing && hasExistingKey) {
                                setEditingApiKeys(prev => ({ ...prev, [provider]: true }))
                              }
                            }}
                            placeholder={hasExistingKey && !isEditing ? maskedKeys[provider] : `Enter your ${provider} API key`}
                            className="w-full rounded-lg border border-input bg-background px-4 py-2 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          {(inputValue || isEditing) && (
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
                          )}
                        </div>
                        {(inputValue || isEditing) && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!inputValue || isSaving}
                            onClick={() => {
                              handleSaveApiKey(provider)
                              setEditingApiKeys(prev => ({ ...prev, [provider]: false }))
                            }}
                            className="px-3"
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        {hasExistingKey && !isEditing && !inputValue && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingApiKeys(prev => ({ ...prev, [provider]: true }))
                              setApiKeys(prev => ({ ...prev, [provider]: '' }))
                            }}
                            className="px-3"
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <Button 
                className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSaveAllApiKeys}
                disabled={isSaving || Object.values(apiKeys).every(key => !key.trim())}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save API Keys
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Connected Accounts */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Connected Accounts</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your social media accounts to publish directly from Levercast
          </p>
          
          {isLoadingConnections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {['linkedin', 'twitter'].map((platform) => {
                const connection = socialConnections.find(c => c.platform === platform && c.isActive)
                const isConnected = !!connection
                const isDisconnectingPlatform = isDisconnecting[platform] || false

                const handleConnect = async () => {
                  try {
                    const response = await fetch(`/api/social/${platform}`, {
                      method: 'POST',
                    })
                    if (response.ok) {
                      const data = await response.json()
                      if (data.redirectUrl) {
                        // Redirect to OAuth URL
                        window.location.href = data.redirectUrl
                      } else {
                        toast.info('OAuth flow not yet implemented')
                      }
                    } else {
                      const error = await response.json()
                      toast.error(error.error || 'Failed to connect')
                    }
                  } catch (error) {
                    console.error('Error connecting platform:', error)
                    toast.error('Failed to connect')
                  }
                }

                const handleDisconnect = async () => {
                  if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
                    return
                  }

                  try {
                    setIsDisconnecting(prev => ({ ...prev, [platform]: true }))
                    const response = await fetch(`/api/social/${platform}`, {
                      method: 'DELETE',
                    })
                    if (response.ok) {
                      setSocialConnections(prev => prev.filter(c => !(c.platform === platform && c.isActive)))
                      toast.success(`${platform} disconnected successfully`)
                    } else {
                      const error = await response.json()
                      toast.error(error.error || 'Failed to disconnect')
                    }
                  } catch (error) {
                    console.error('Error disconnecting platform:', error)
                    toast.error('Failed to disconnect')
                  } finally {
                    setIsDisconnecting(prev => ({ ...prev, [platform]: false }))
                  }
                }

                return (
                  <div key={platform} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                        platform === 'linkedin' ? 'bg-[#0A66C2]' : 'bg-[#1DA1F2]'
                      }`}>
                        {platform === 'linkedin' ? 'in' : '𝕏'}
                      </div>
                      <div>
                        <div className="font-medium text-card-foreground capitalize">
                          {platform === 'twitter' ? 'Twitter / X' : platform}
                        </div>
                        {isConnected ? (
                          <div className="text-xs text-primary">
                            Connected{connection.platformUsername ? ` as ${connection.platformUsername}` : ''}
                            {connection.lastUsed && (
                              <span className="text-muted-foreground ml-1">
                                • Last used {new Date(connection.lastUsed).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Not connected</div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={isConnected ? 'outline' : 'default'}
                      size="sm"
                      onClick={isConnected ? handleDisconnect : handleConnect}
                      disabled={isDisconnectingPlatform}
                      className={isConnected ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
                    >
                      {isDisconnectingPlatform ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        isConnected ? 'Disconnect' : 'Connect'
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

