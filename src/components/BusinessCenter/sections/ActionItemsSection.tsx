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

  return (
    <div
      className={`flex items-start gap-3 p-3 border-l-2 rounded-r-md bg-card hover:bg-muted/50 transition-colors ${borderClass}`}
    >
      <item.icon size={18} className="text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
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

export function ActionItemsSection({ metrics }: { metrics: BusinessMetrics }) {
  if (metrics.actionItems.length === 0) {
    return (
      <div className="glass-panel p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
          <ListChecks size={20} className="text-primary" />
          Next Steps
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
    <div className="glass-panel p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
        <ListChecks size={20} className="text-primary" />
        Next Steps
      </h2>
      <div className="space-y-2">
        {metrics.actionItems.map((item, i) => (
          <ActionRow key={i} item={item} />
        ))}
      </div>
    </div>
  )
}
