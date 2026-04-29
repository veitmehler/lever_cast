'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from './ThemeProvider'
import { Toaster } from './Toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </ClerkProvider>
  )
}

