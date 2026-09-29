// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink, Calendar } from 'lucide-react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import FocusLock from 'react-focus-lock'
import type { TimelinePhase, TimelineEvent, Phase } from '../../types/timeline'
import { phaseColors, eventLinkKey, timelineEventPageUrl } from '../../data/timelineData'
import {
  TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME,
  type DeadlineMandate,
} from '../../data/timelineFacts.generated'
import { useEffect, useRef } from 'react'
import { StatusBadge } from '../common/StatusBadge'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import {
  timelineEnrichments,
  hasSubstantiveEnrichment,
  getTimelineEnrichmentKey,
} from '../../data/timelineEnrichmentData'
import { TimelineAnalysisPanel } from './TimelineAnalysisPanel'
import { DocumentAnalysis } from '../common/DocumentAnalysis'
import { TimelineEvidenceBadge } from './TimelineEvidenceBadge'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { useModalPosition } from '../../hooks/useModalPosition'
import { periodLabel } from '@/utils/timelinePeriod'

interface GanttDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  phase: TimelinePhase | null
  /**
   * The event a `?event=` deep link named. A phase row groups several events
   * and is titled after its first one; when the link targets a later event,
   * the popover shows THAT event (title, description, period, source)
   * instead of the row's first. Defaults to the row's first event.
   */
  focusEvent?: TimelineEvent | null
}

export const GanttDetailPopover = ({
  isOpen,
  onClose,
  phase,
  focusEvent,
}: GanttDetailPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const isEmbedded = useIsEmbedded()
  const positionStyle = useModalPosition(isEmbedded)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !phase) return null

  const colors = phaseColors[phase.phase as Phase] || {
    start: 'hsl(var(--muted-foreground))',
    end: 'hsl(var(--muted))',
    glow: 'hsl(var(--ring))',
  }

  const focusKey = focusEvent ? eventLinkKey(focusEvent) : null
  const primaryEvent =
    (focusKey && phase.events.find((e) => eventLinkKey(e) === focusKey)) || phase.events[0]
  // Row-level fields describe the row's first event (plus the row's full span);
  // a focused later event shows its own.
  const focused = primaryEvent !== undefined && primaryEvent !== phase.events[0]
  const shown = focused
    ? {
        title: primaryEvent.title,
        description: primaryEvent.description,
        startYear: primaryEvent.startYear,
        endYear: primaryEvent.endYear,
        openEnded: primaryEvent.openEnded,
      }
    : phase
  const pageUrl = timelineEventPageUrl(
    primaryEvent?.countryName ?? '',
    primaryEvent ? eventLinkKey(primaryEvent) : null
  )
  const sourceUrl = primaryEvent?.sourceUrl
  const sourceDate = primaryEvent?.sourceDate

  // Binding legal mandate (HARD) vs soft published guidance (SOFT) for this milestone
  // — single source: the timeline CSV `mandate_type`. Any row can carry its OWN
  // curated event-level label now (the mandate-label sweep covers Deadline rows
  // AND the CNSA 2.0 Migration lanes) — show it whenever present, regardless of
  // phase. Only Deadline-phase rows without their own label fall back to the
  // country-level map (the one row per country tagged `is_sim_deadline`); other
  // phases have no country-level equivalent to fall back to.
  let deadlineMandate: DeadlineMandate | undefined
  if (primaryEvent?.mandateType) {
    deadlineMandate = primaryEvent.mandateType
  } else if (phase.phase === 'Deadline' && primaryEvent) {
    deadlineMandate = TIMELINE_COUNTRY_DEADLINE_MANDATE_BY_NAME[primaryEvent.countryName]
  }

  const enrichmentKey = primaryEvent
    ? getTimelineEnrichmentKey(primaryEvent.countryName, primaryEvent.orgName, shown.title)
    : null
  const enrichment = enrichmentKey ? timelineEnrichments[enrichmentKey] : null
  const isEnriched = !!enrichment && hasSubstantiveEnrichment(enrichment)

  const content = (
    <>
      {/* Backdrop */}
      <div
        className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 z-overlay bg-black/60`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Centering wrapper (standalone only) */}
      <div
        className={clsx(!isEmbedded && 'fixed inset-0 flex items-center justify-center p-4')}
        style={!isEmbedded ? { zIndex: 9999 } : undefined}
      >
        <FocusLock returnFocus>
          <div
            ref={popoverRef}
            className="w-[90vw] max-w-[36rem] bg-popover text-popover-foreground shadow-2xl border border-border rounded-xl animate-in zoom-in-95 duration-200"
            style={isEmbedded ? { zIndex: 9999, ...positionStyle } : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gantt-phase-popover-title"
          >
            {/* Header with Phase Color */}
            <div
              className="p-3 border-b border-border"
              style={{
                background: `linear-gradient(to bottom, ${colors.glow} 0%, transparent 100%)`,
              }}
            >
              {/* Badge and Title */}
              <div className="flex items-center gap-2">
                <div
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider text-black flex-shrink-0"
                  style={{ backgroundColor: colors.start }}
                >
                  {phase.phase}
                </div>
                <h3
                  id="gantt-phase-popover-title"
                  className="text-xs font-bold text-foreground leading-tight"
                >
                  {shown.title}
                </h3>
                <StatusBadge status={phase.status} size="sm" />
                {deadlineMandate && (
                  <span
                    title={
                      deadlineMandate === 'HARD'
                        ? 'Binding legal mandate — law, regulation, or executive order.'
                        : deadlineMandate === 'SOFT'
                          ? 'Published guidance — a target, not a binding legal mandate.'
                          : 'Binding status could not be confirmed from an authoritative source yet — treat as neither binding nor advisory until reviewed.'
                    }
                    className={clsx(
                      'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium',
                      deadlineMandate === 'HARD'
                        ? 'border-destructive/30 bg-destructive/10 text-destructive'
                        : deadlineMandate === 'SOFT'
                          ? 'border-border bg-muted text-muted-foreground'
                          : 'border-status-warning/30 bg-status-warning/10 text-status-warning'
                    )}
                  >
                    {deadlineMandate === 'HARD'
                      ? 'binding mandate'
                      : deadlineMandate === 'SOFT'
                        ? 'guidance'
                        : 'label pending'}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[70dvh]">
              <div>
                <p className="text-xs text-muted-foreground leading-relaxed break-words">
                  {shown.description}
                </p>
              </div>

              {/* Document Analysis — same collapsible enrichment panel
                  TimelineDocumentDetailPopover already renders; this popover
                  never had it, so mobile (which only ever reaches this
                  popover via MobileTimelineList) had no way to open it. */}
              {isEnriched && enrichment && <DocumentAnalysis enrichment={enrichment} />}

              {/* Enrichment section — renders directly, no extra click (Phase 8.5:
                  matches TimelineDocumentDetailPopover's zero-extra-click depth). */}
              {isEnriched && enrichment && <TimelineAnalysisPanel enrichment={enrichment} />}

              {/* Detail grid: 2×2 on small screens, 4-col inline on sm+ */}
              <div className="pt-3 border-t border-border">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                      Start
                    </span>
                    <span className="font-mono text-foreground">{shown.startYear}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                      End
                    </span>
                    <span className="font-mono text-foreground">
                      {shown.openEnded ? 'Not stated by source' : shown.endYear}
                    </span>
                  </div>
                  {/* Source/Date cells are dropped entirely rather than shown as
                      "-" placeholders when absent — a row that says nothing costs
                      space this grid can't spare, especially at the 2-col mobile
                      width. */}
                  {sourceUrl && (
                    <div>
                      <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                        Source
                      </span>
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
                        title={sourceUrl}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span>View</span>
                      </a>
                    </div>
                  )}
                  {sourceDate && (
                    <div>
                      <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                        Date
                      </span>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{sourceDate}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Electronic evidence — trust/freshness badge with a link to
                  the real external source. (Used to also surface a link to
                  a locally-cached document copy, but that file was never
                  actually published/deployed — see
                  LOCAL-FILES-REMEDIATION-PLAN-07122026.md in the private
                  repo. Removed 2026-07-12 rather than left silently 404ing.) */}
              {primaryEvent &&
                (primaryEvent.confidenceScore !== undefined ||
                  primaryEvent.trustedSourceIdStatus) && (
                  <div className="pt-3 border-t border-border">
                    <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs mb-1.5">
                      Electronic evidence
                    </span>
                    <TimelineEvidenceBadge
                      confidenceScore={primaryEvent.confidenceScore}
                      trustedSourceIdStatus={primaryEvent.trustedSourceIdStatus}
                      sourceClass={primaryEvent.sourceClass}
                      sourceUrl={primaryEvent.sourceUrl}
                      publishedDate={primaryEvent.sourceDate}
                    />
                  </div>
                )}

              <div className="flex items-center gap-2">
                <EndorseButton
                  endorseUrl={buildEndorsementUrl({
                    category: 'timeline-endorsement',
                    title: `Endorse: ${primaryEvent?.countryName ?? 'Unknown'} — ${shown.title}`,
                    resourceType: 'Timeline Event',
                    resourceId: `${primaryEvent?.countryName ?? 'Unknown'} / ${shown.title}`,
                    resourceDetails: [
                      `**Country:** ${primaryEvent?.countryName ?? 'Unknown'}`,
                      `**Phase:** ${phase.phase}`,
                      `**Title:** ${shown.title}`,
                      `**Period:** ${periodLabel(shown.startYear, shown.endYear, shown.openEnded)}`,
                      shown.description ? `**Description:** ${shown.description}` : '',
                    ]
                      .filter(Boolean)
                      .join('\n'),
                    pageUrl,
                  })}
                  resourceLabel={shown.title}
                  resourceType="Timeline"
                  variant="text"
                  label="Endorse"
                />
                <FlagButton
                  flagUrl={buildFlagUrl({
                    category: 'timeline-endorsement',
                    title: `Flag: ${primaryEvent?.countryName ?? 'Unknown'} — ${shown.title}`,
                    resourceType: 'Timeline Event',
                    resourceId: `${primaryEvent?.countryName ?? 'Unknown'} / ${shown.title}`,
                    resourceDetails: [
                      `**Country:** ${primaryEvent?.countryName ?? 'Unknown'}`,
                      `**Phase:** ${phase.phase}`,
                      `**Title:** ${shown.title}`,
                      `**Period:** ${periodLabel(shown.startYear, shown.endYear, shown.openEnded)}`,
                      shown.description ? `**Description:** ${shown.description}` : '',
                    ]
                      .filter(Boolean)
                      .join('\n'),
                    pageUrl,
                  })}
                  resourceLabel={shown.title}
                  resourceType="Timeline"
                  variant="text"
                  label="Flag"
                />
                <AskAssistantButton
                  variant="text"
                  label="Ask about this"
                  question={`How did the "${shown.title}" ${phase.phase} phase (${periodLabel(shown.startYear, shown.endYear, shown.openEnded)}) advance PQC adoption?${shown.description ? ` Context: ${shown.description}` : ''}`}
                />
              </div>
            </div>
          </div>
        </FocusLock>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
