'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  User, 
  Sparkles,
  Calendar,
  Menu,
  X 
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Posts', href: '/posts', icon: FileText },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Templates', href: '/templates', icon: Sparkles },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Account', href: '/account', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4">
        {/* Hamburger Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">L</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Levercast</h1>
        </div>

        {/* User profile placeholder - actual UserButton is in protected layout */}
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
          U
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Drawer */}
      <aside
        className={cn(
          'md:hidden fixed top-0 left-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Drawer Header */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <h1 className="text-xl font-semibold text-foreground">
              Levercast
            </h1>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-sidebar-foreground" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="ml-3">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer Info */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground">
              <p className="font-medium">Authenticated</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

