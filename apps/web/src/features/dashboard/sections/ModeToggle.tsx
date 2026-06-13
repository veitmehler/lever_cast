import { MessageSquare, FileEdit, Newspaper } from 'lucide-react'
import type { DashboardMode } from '../types'
import type { DashboardView } from '../useDashboard'

export function ModeToggle({ dashboard }: { dashboard: DashboardView }) {
  const { dashMode, setDashMode } = dashboard

  return (
    <>
      {/* ── Mode toggle ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex gap-2 flex-wrap">
        {([
          { value: 'social_only',  label: 'Social posts',    icon: MessageSquare, desc: 'Instant multi-platform drafts' },
          { value: 'article_first',label: 'Article + social', icon: FileEdit,      desc: 'Full article, then social posts' },
          { value: 'article_only', label: 'Article only',     icon: Newspaper,     desc: 'Long-form article pipeline (~10 min)' },
        ] as { value: DashboardMode; label: string; icon: React.ComponentType<{className?: string}>; desc: string }[]).map(({ value, label, icon: Icon, desc }) => (
          <button
            key={value}
            type="button"
            onClick={() => setDashMode(value)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors text-left ${
              dashMode === value
                ? 'border-primary/40 bg-primary/10 text-primary font-medium'
                : 'border-border bg-card text-foreground hover:bg-muted/50 hover:border-border'
            }`}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 ${dashMode === value ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <span className="block leading-tight">{label}</span>
              <span className={`text-xs leading-tight ${dashMode === value ? 'text-primary/70' : 'text-muted-foreground'}`}>{desc}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
