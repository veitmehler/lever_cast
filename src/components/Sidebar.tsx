'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  User, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Posts', href: '/posts', icon: <FileText className="w-5 h-5" /> },
  { label: 'Calendar', href: '/calendar', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Templates', href: '/templates', icon: <Sparkles className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
  { label: 'Account', href: '/account', icon: <User className="w-5 h-5" /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  // Load sidebar state from API after mount
  useEffect(() => {
    const fetchSidebarState = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const settings = await response.json()
          if (settings.sidebarState) {
            setIsCollapsed(settings.sidebarState === 'collapsed')
          }
        } else {
          // Fallback to localStorage if API fails
          const saved = localStorage.getItem('sidebar-collapsed')
          if (saved !== null) {
            setIsCollapsed(JSON.parse(saved))
          }
        }
      } catch (error) {
        console.error('Error fetching sidebar state:', error)
        // Fallback to localStorage if API fails
        const saved = localStorage.getItem('sidebar-collapsed')
        if (saved !== null) {
          setIsCollapsed(JSON.parse(saved))
        }
      } finally {
        setMounted(true)
      }
    }

    fetchSidebarState()
  }, [])

  // Track screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024) // lg breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Save sidebar state to API
  const toggleSidebar = async () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    
    // Save to API (non-blocking)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sidebarState: newState ? 'collapsed' : 'open' }),
      })
    } catch (error) {
      console.error('Error saving sidebar state:', error)
      // Fallback to localStorage if API fails
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
    }
  }

  // Force collapsed on tablet (md to lg)
  const shouldBeCollapsed = !isLargeScreen || isCollapsed

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar transition-all duration-200">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-sidebar-border px-4">
            <h1 className="text-xl font-semibold text-foreground">
              Levercast
            </h1>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-200',
        'hidden md:block', // Hide on mobile
        shouldBeCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo/Brand */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          {!shouldBeCollapsed && (
            <h1 className="text-xl font-semibold text-foreground">
              Levercast
            </h1>
          )}
          {shouldBeCollapsed && (
            <div className="flex w-full justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                L
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  shouldBeCollapsed && 'justify-center'
                )}
              >
                <span className={cn(isActive && 'text-primary')}>
                  {item.icon}
                </span>
                {!shouldBeCollapsed && (
                  <span className="ml-3">{item.label}</span>
                )}
                
                {/* Tooltip for collapsed state */}
                {shouldBeCollapsed && (
                  <div className="absolute left-full ml-2 hidden rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Toggle Button - Only on desktop */}
        {isLargeScreen && (
          <div className="border-t border-sidebar-border p-3">
            <button
              onClick={toggleSidebar}
              className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

