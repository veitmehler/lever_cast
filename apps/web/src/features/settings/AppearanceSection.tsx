'use client'

import { useTheme } from '@/components/ThemeProvider'

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  return (
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
  )
}
