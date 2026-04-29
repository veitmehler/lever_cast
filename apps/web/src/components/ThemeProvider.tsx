'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [isLoading, setIsLoading] = useState(true)

  // Load theme from API on mount
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const settings = await response.json()
          if (settings.theme) {
            setThemeState(settings.theme as Theme)
          }
        } else {
          // Fallback to localStorage if API fails
          const saved = localStorage.getItem('theme') as Theme
          if (saved) {
            setThemeState(saved)
          }
        }
      } catch (error) {
        console.error('Error fetching theme:', error)
        // Fallback to localStorage if API fails
        const saved = localStorage.getItem('theme') as Theme
        if (saved) {
          setThemeState(saved)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchTheme()
  }, [])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    
    // Update document class immediately for instant feedback
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Save to API (non-blocking)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: newTheme }),
      })
    } catch (error) {
      console.error('Error saving theme:', error)
      // Fallback to localStorage if API fails
      localStorage.setItem('theme', newTheme)
    }
  }

  // Apply theme on mount and when it changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

