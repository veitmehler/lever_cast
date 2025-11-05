'use client'

import { Sidebar } from '@/components/Sidebar'
import { MobileNav } from '@/components/MobileNav'
import { BottomNav } from '@/components/BottomNav'
import { ProtectedHeader } from '@/components/ProtectedHeader'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileNav />
      
      <div className="flex flex-1 flex-col overflow-hidden ml-0 md:ml-16 lg:ml-64 transition-all duration-200">
        <ProtectedHeader />

        {/* Main Content - Account for top mobile header and bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-20 md:pt-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      
      <BottomNav />
    </div>
  )
}

