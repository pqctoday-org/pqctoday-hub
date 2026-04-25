// SPDX-License-Identifier: GPL-3.0-only
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'

function FipsBadge({ label, count, color }: { label: string; count: number; color: string }) {
  if (count === 0) return null
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}>
      {count} {label}
    </span>
  )
}

export interface FipsBreakdownWidgetProps {
  breakdown: BusinessMetrics['fipsBreakdown']
}

export function FipsBreakdownWidget({ breakdown }: FipsBreakdownWidgetProps) {
  return (
    <div>
      <span className="text-xs text-muted-foreground mb-2 block">FIPS Readiness</span>
      <div className="flex flex-wrap gap-2">
        <FipsBadge
          label="Validated"
          count={breakdown.validated}
          color="bg-status-success/15 text-status-success"
        />
        <FipsBadge
          label="Partial"
          count={breakdown.partial}
          color="bg-status-warning/15 text-status-warning"
        />
        <FipsBadge label="No FIPS" count={breakdown.none} color="bg-muted text-muted-foreground" />
      </div>
    </div>
  )
}
