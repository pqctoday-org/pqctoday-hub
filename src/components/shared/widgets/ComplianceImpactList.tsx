// SPDX-License-Identifier: GPL-3.0-only
import clsx from 'clsx'
import type { ComplianceImpact } from '@/hooks/assessmentTypes'

/**
 * Compact list of compliance frameworks with PQC-requirement status + deadline.
 *
 * Canonical shared widget so the Report and Business Center render the same
 * compliance surface — previously the BC Compliance pillar rolled its own and
 * drifted. The Report still wraps this in a `CollapsibleSection` with
 * library/timeline backlinks; BC can consume the bare list directly.
 */
export function ComplianceImpactList({
  impacts,
  maxItems,
  emptyLabel = 'No compliance frameworks selected.',
}: {
  impacts: ComplianceImpact[]
  maxItems?: number
  emptyLabel?: string
}) {
  if (!impacts.length) {
    return <p className="text-xs text-muted-foreground italic">{emptyLabel}</p>
  }
  const items = typeof maxItems === 'number' ? impacts.slice(0, maxItems) : impacts
  return (
    <div className="space-y-2">
      {items.map((c) => (
        <div
          key={c.framework}
          className={clsx(
            'p-3 rounded-lg border text-sm',
            c.requiresPQC === true
              ? 'border-warning/30 bg-warning/5'
              : c.requiresPQC === null
                ? 'border-muted/50 bg-muted/5'
                : 'border-border'
          )}
        >
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className="font-semibold text-foreground">{c.framework}</span>
            <span
              className={clsx(
                'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0',
                c.requiresPQC === true
                  ? 'bg-warning/10 text-warning'
                  : c.requiresPQC === null
                    ? 'bg-muted/20 text-muted-foreground'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {c.requiresPQC === true
                ? 'PQC Required'
                : c.requiresPQC === null
                  ? 'Unknown'
                  : 'No mandate yet'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Deadline:</strong> {c.deadline}
          </p>
          {c.notes && <p className="text-[11px] text-muted-foreground/80 mt-1">{c.notes}</p>}
        </div>
      ))}
      {maxItems && impacts.length > maxItems && (
        <p className="text-[11px] text-muted-foreground italic">
          +{impacts.length - maxItems} more — see Report for full list.
        </p>
      )}
    </div>
  )
}
