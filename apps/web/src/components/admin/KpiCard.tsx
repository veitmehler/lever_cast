import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  sub?: string
  accent?: 'default' | 'green' | 'yellow' | 'red'
}

export function KpiCard({ title, value, sub, accent = 'default' }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
      <p
        className={cn(
          'mt-1.5 text-2xl font-bold',
          accent === 'green' && 'text-green-400',
          accent === 'yellow' && 'text-yellow-400',
          accent === 'red' && 'text-red-400',
          accent === 'default' && 'text-foreground',
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
