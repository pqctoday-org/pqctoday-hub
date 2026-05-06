// SPDX-License-Identifier: GPL-3.0-only
import { useNavigate } from 'react-router-dom'
import { ListChecks, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BusinessMetrics, ActionItem } from '../hooks/useBusinessMetrics'

const PRIORITY_STYLES: Record<number, string> = {
  1: 'border-l-status-error',
  2: 'border-l-status-warning',
  3: 'border-l-border',
}

function ActionRow({ item }: { item: ActionItem }) {
  const navigate = useNavigate()
  const borderClass = PRIORITY_STYLES[item.priority] ?? 'border-l-border'
  const drivers = item.drivers ?? []

  return (
    <div
      className={`flex items-start gap-3 p-3 border-l-2 rounded-r-md bg-card hover:bg-muted/50 transition-colors ${borderClass}`}
    >
      <item.icon size={18} className="text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
        {drivers.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {drivers.map((d) => (
              <span
                key={d}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                title="Why this is in your top 5: based on your assessment profile"
              >
                {d}
              </span>
            ))}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0"
        onClick={() => navigate(item.action.path)}
      >
        {item.action.label}
      </Button>
    </div>
  )
}

export interface ActionItemsSectionProps {
  metrics: BusinessMetrics
  /** Max items to show above the fold. Driven by density from the parent
   *  (basic=3, intermediate=4, advanced=5). When unset, all items render. */
  cap?: number
}

export function ActionItemsSection({ metrics, cap }: ActionItemsSectionProps) {
  const allItems = metrics.actionItems
  const visibleItems = cap !== undefined ? allItems.slice(0, cap) : allItems
  const hiddenCount = allItems.length - visibleItems.length

  if (allItems.length === 0) {
    return (
      <div className="glass-panel p-6" data-testid="action-items-hero">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
          <ListChecks size={20} className="text-primary" />
          Your next steps
        </h2>
        <div className="flex items-center justify-center gap-3 py-8 text-center">
          <CheckCircle2 size={24} className="text-status-success" />
          <div>
            <p className="text-sm font-medium text-foreground">You&apos;re on track!</p>
            <p className="text-xs text-muted-foreground">All key activities are underway.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel p-6" data-testid="action-items-hero">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-1">
        <ListChecks size={20} className="text-primary" />
        Your next steps
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Personalised to your industry, persona, and assessment so far.
      </p>
      <div className="space-y-2">
        {visibleItems.map((item, i) => (
          <ActionRow key={i} item={item} />
        ))}
      </div>
      {hiddenCount > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          +{hiddenCount} more next-step{hiddenCount === 1 ? '' : 's'} available — switch persona to{' '}
          <span className="font-semibold text-foreground">developer</span> or{' '}
          <span className="font-semibold text-foreground">researcher</span> to see all.
        </p>
      )}
    </div>
  )
}
