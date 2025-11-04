'use client'

import { Sidebar } from '@/components/Sidebar'
import { User } from 'lucide-react'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden ml-16 lg:ml-64 transition-all duration-200">
        {/* Top Navigation Bar */}
        <header className="flex h-16 items-center justify-end border-b border-border bg-background px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Design Mode - No Auth Required</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

