import { MessageSquare, Newspaper } from 'lucide-react'
import type { DashboardTab } from '../types'
import type { DashboardView } from '../useDashboard'

export function ModeToggle({ dashboard }: { dashboard: DashboardView }) {
  const { activeTab, setActiveTab } = dashboard

  return (
    <>
      {/* ── Tab toggle ──────────────────────────────────────────────────── */}
      <div className="mb-5 flex gap-2 flex-wrap">
        {([
          { value: 'workflow', label: 'Start Workflow', icon: Newspaper,     desc: 'Article, with optional social posts' },
          { value: 'social',   label: 'Social posts',   icon: MessageSquare, desc: 'Instant multi-platform drafts' },
        ] as { value: DashboardTab; label: string; icon: React.ComponentType<{className?: string}>; desc: string }[]).map(({ value, label, icon: Icon, desc }) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors text-left ${
              activeTab === value
                ? 'border-primary/40 bg-primary/10 text-primary font-medium'
                : 'border-border bg-card text-foreground hover:bg-muted/50 hover:border-border'
            }`}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 ${activeTab === value ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <span className="block leading-tight">{label}</span>
              <span className={`text-xs leading-tight ${activeTab === value ? 'text-primary/70' : 'text-muted-foreground'}`}>{desc}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
