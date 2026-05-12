// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Network, ShieldCheck } from 'lucide-react'
import type { ComplianceFramework } from '../../../../data/complianceData'
import { conceptIdForFramework } from '../../../../data/complianceData'
import type { TimelineEvent } from '../../../../types/timeline'
import type { ApplicabilityResult } from '../../../../utils/applicabilityEngine'
import { TIER_STYLES } from '../../../applicability/parts/tierStyles'
import { TierBadge } from '../../../applicability/parts/items'
import { Button } from '../../../ui/button'
import { FrameworkConceptGraphModal } from '../../FrameworkConceptGraphModal'

interface FrameworkDeadlineCardProps {
  result: ApplicabilityResult<ComplianceFramework>
  /** Embedded milestone events for this framework, sorted ascending by year. */
  events: ApplicabilityResult<TimelineEvent>[]
  /** When provided, embedded events open an inline timeline detail pane. */
  onSelectTimeline?: (item: TimelineEvent) => void
  /** When provided, clicking the card header opens an inline framework detail pane. */
  onSelectFramework?: (item: ComplianceFramework) => void
}

/**
 * Executive-view framework card — wider than the panel's FrameworkItem and
 * carries the embedded chronology of milestones tied to this framework.
 *
 * The card itself is non-clickable; all framework info is shown inline. Each
 * embedded event is a button that opens the timeline detail pane in place
 * (when `onSelectTimeline` is provided), keeping the user on the For You tab.
 */
export function FrameworkDeadlineCard({
  result,
  events,
  onSelectTimeline,
  onSelectFramework,
}: FrameworkDeadlineCardProps) {
  const fw = result.item
  const [graphOpen, setGraphOpen] = useState(false)
  const graphConceptId = conceptIdForFramework(fw)

  const styles = TIER_STYLES[result.tier]
  const sortedEvents = [...events].sort((a, b) => a.item.startYear - b.item.startYear)

  const headerContent = (
    <div className="flex items-start gap-2 w-full">
      <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${styles.dot}`} aria-hidden="true" />
      <div className="flex-1 min-w-0 text-left">
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
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{fw.description}</p>
        <p className="text-[10px] text-muted-foreground/80 mt-0.5 italic">{result.reason}</p>
      </div>
    </div>
  )

  return (
    <div
      className="relative rounded-lg border border-border bg-card p-3 space-y-2 overflow-hidden"
      title={result.reason}
    >
      {graphConceptId && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Open concept graph for ${fw.label}`}
          title="Concept graph (IR 8477 xwalk)"
          onClick={(e) => {
            e.stopPropagation()
            setGraphOpen(true)
          }}
          className="absolute top-1 right-1 p-1 h-auto z-10 text-muted-foreground hover:text-primary"
        >
          <Network size={14} />
        </Button>
      )}
      {graphConceptId && (
        <FrameworkConceptGraphModal
          isOpen={graphOpen}
          onClose={() => setGraphOpen(false)}
          centerConceptId={graphConceptId}
          title={fw.label}
        />
      )}
      {onSelectFramework ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onSelectFramework(fw)}
          className="w-full h-auto -m-1 p-1 rounded hover:bg-muted/40 transition-colors block text-left"
        >
          {headerContent}
        </Button>
      ) : (
        headerContent
      )}

      {sortedEvents.length > 0 && (
        <ul className="pl-6 space-y-0.5 border-l-2 border-border ml-1">
          {sortedEvents.map((evRes, i) => {
            const ev = evRes.item
            const content = (
              <>
                <span className="tabular-nums text-foreground/80">{ev.startYear}</span>
                <span className="line-clamp-1">{ev.title}</span>
              </>
            )
            return (
              <li key={i} className="text-xs text-muted-foreground">
                {onSelectTimeline ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onSelectTimeline(ev)}
                    className="flex items-baseline gap-2 text-left w-full h-auto hover:text-foreground hover:bg-muted/40 rounded px-1 -mx-1 transition-colors"
                    title={ev.title}
                  >
                    {content}
                  </Button>
                ) : (
                  <div className="flex items-baseline gap-2 px-1">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
