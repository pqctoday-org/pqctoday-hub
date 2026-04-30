// SPDX-License-Identifier: GPL-3.0-only
import type { TrackedFramework } from '../hooks/useBusinessMetrics'

const URGENCY_STYLES: Record<string, string> = {
  critical: 'bg-status-error/15 text-status-error border-status-error/30',
  warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  safe: 'bg-status-success/15 text-status-success border-status-success/30',
  unknown: 'bg-muted text-muted-foreground border-border',
}

const SOURCE_LABEL: Record<TrackedFramework['source'], string> = {
  compliance: 'from /compliance',
  assess: 'from /assess',
  both: 'both',
}

const SOURCE_STYLE: Record<TrackedFramework['source'], string> = {
  compliance: 'bg-primary/10 text-primary border-primary/20',
  assess: 'bg-accent/10 text-accent border-accent/20',
  both: 'bg-status-success/15 text-status-success border-status-success/30',
}

function FrameworkRow({ framework }: { framework: TrackedFramework }) {
  const style = URGENCY_STYLES[framework.urgency] ?? URGENCY_STYLES.unknown

  const deadlineLabel =
    framework.daysUntilDeadline !== null
      ? framework.daysUntilDeadline > 0
        ? `${Math.floor(framework.daysUntilDeadline / 365)}y ${Math.floor((framework.daysUntilDeadline % 365) / 30)}m`
        : 'Overdue'
      : framework.deadline || 'TBD'

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">{framework.label}</span>
          <span
            className={`text-[9px] font-semibold uppercase tracking-wider px-1 py-0 rounded border ${SOURCE_STYLE[framework.source]}`}
            title={`Source: ${SOURCE_LABEL[framework.source]}`}
          >
            {SOURCE_LABEL[framework.source]}
          </span>
        </div>
        {framework.requiresPQC && (
          <span className="text-xs text-muted-foreground">PQC required</span>
        )}
      </div>
      <div className={`px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
        {deadlineLabel}
      </div>
    </div>
  )
}

export interface FrameworkDeadlineListProps {
  frameworks: TrackedFramework[]
  limit?: number
}

export function FrameworkDeadlineList({ frameworks, limit = 6 }: FrameworkDeadlineListProps) {
  if (frameworks.length === 0) return null
  const visible = frameworks.slice(0, limit)
  const overflow = frameworks.length - limit

  return (
    <div className="flex-1 overflow-y-auto max-h-48 space-y-0">
      {visible.map((fw) => (
        <FrameworkRow key={fw.id} framework={fw} />
      ))}
      {overflow > 0 && (
        <p className="text-xs text-muted-foreground pt-2 text-center">+{overflow} more</p>
      )}
    </div>
  )
}
