// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { ShieldCheck, ChevronRight } from 'lucide-react'
import type { ComplianceFramework } from '../../../../data/complianceData'
import type { TimelineEvent } from '../../../../types/timeline'
import type { ApplicabilityResult } from '../../../../utils/applicabilityEngine'
import { TIER_STYLES } from '../../../applicability/parts/tierStyles'
import { TierBadge } from '../../../applicability/parts/items'

interface FrameworkDeadlineCardProps {
  result: ApplicabilityResult<ComplianceFramework>
  /** Embedded milestone events for this framework, sorted ascending by year. */
  events: ApplicabilityResult<TimelineEvent>[]
}

/**
 * Executive-view framework card — wider than the panel's FrameworkItem and
 * carries the embedded chronology of milestones tied to this framework.
 */
export function FrameworkDeadlineCard({ result, events }: FrameworkDeadlineCardProps) {
  const fw = result.item

  const styles = TIER_STYLES[result.tier]
  const sortedEvents = [...events].sort((a, b) => a.item.startYear - b.item.startYear)

  return (
    <Link
      to={`/compliance?framework=${encodeURIComponent(fw.id)}`}
      className="group block rounded-lg border border-border bg-card hover:border-primary/40 transition-colors p-3 space-y-2"
      title={result.reason}
    >
      <div className="flex items-start gap-2">
        <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${styles.dot}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <ShieldCheck size={14} className="text-primary inline" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">{fw.label}</span>
            <TierBadge tier={result.tier} />
            {fw.deadlineYear && (
              <span className="text-xs font-medium text-status-error tabular-nums ml-auto">
                {fw.deadlineYear}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{fw.description}</p>
          <p className="text-[10px] text-muted-foreground/80 mt-0.5 italic">{result.reason}</p>
        </div>
        <ChevronRight
          size={14}
          className="text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0"
          aria-hidden="true"
        />
      </div>

      {sortedEvents.length > 0 && (
        <ul className="pl-6 space-y-0.5 border-l-2 border-border ml-1">
          {sortedEvents.map((evRes, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-baseline gap-2">
              <span className="tabular-nums text-foreground/80">{evRes.item.startYear}</span>
              <span className="line-clamp-1">{evRes.item.title}</span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  )
}
