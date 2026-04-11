// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink, Calendar, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { TimelinePhase, Phase } from '../../types/timeline'
import { phaseColors } from '../../data/timelineData'
import { useEffect, useRef, useState, useCallback } from 'react'
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
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { useModalPosition } from '../../hooks/useModalPosition'
import { Button } from '@/components/ui/button'

interface GanttDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  phase: TimelinePhase | null
}

export const GanttDetailPopover = ({ isOpen, onClose, phase }: GanttDetailPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const isEmbedded = useIsEmbedded()
  const positionStyle = useModalPosition(isEmbedded)

  // Track which phase's analysis panel is expanded so it auto-collapses on phase change
  const [analysisOpenForPhase, setAnalysisOpenForPhase] = useState<string | null>(null)
  const analysisOpen = analysisOpenForPhase === phase?.title
  const toggleAnalysis = useCallback(
    () =>
      setAnalysisOpenForPhase((prev) => (prev === phase?.title ? null : (phase?.title ?? null))),
    [phase?.title]
  )

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

  const primaryEvent = phase.events[0]
  const sourceUrl = primaryEvent?.sourceUrl
  const sourceDate = primaryEvent?.sourceDate

  const enrichmentKey = primaryEvent
    ? getTimelineEnrichmentKey(primaryEvent.countryName, primaryEvent.orgName, phase.title)
    : null
  const enrichment = enrichmentKey ? timelineEnrichments[enrichmentKey] : null
  const isEnriched = !!enrichment && hasSubstantiveEnrichment(enrichment)

  const style: React.CSSProperties = {
    zIndex: 9999,
    ...positionStyle,
  }

  const content = (
    <div
      ref={popoverRef}
      className="w-[90vw] max-w-[36rem] bg-popover text-popover-foreground shadow-2xl border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-200"
      style={style}
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
          <h3 className="text-xs font-bold text-foreground leading-tight">{phase.title}</h3>
          <StatusBadge status={phase.status} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 overflow-y-auto max-h-[70vh]">
        <div>
          <p className="text-xs text-muted-foreground leading-relaxed break-words">
            {phase.description}
          </p>
        </div>

        {/* Collapsible enrichment section */}
        {isEnriched && enrichment && (
          <div className="border-t border-border">
            <Button
              variant="ghost"
              type="button"
              onClick={toggleAnalysis}
              className="w-full flex items-center justify-between pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-accent transition-colors group"
              aria-expanded={analysisOpen}
            >
              <span className="flex items-center gap-1">
                <Sparkles size={9} aria-hidden="true" />
                Analysis
              </span>
              <span className="flex items-center gap-1 text-accent">
                <span className="text-[9px] normal-case font-normal">
                  {analysisOpen ? 'collapse' : 'expand'}
                </span>
                {analysisOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
            </Button>

            {!analysisOpen && (
              <div className="pb-2 space-y-1.5">
                {enrichment.mainTopic && (
                  <p className="text-xs text-foreground leading-relaxed line-clamp-3">
                    {enrichment.mainTopic}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {enrichment.mandateLevel && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent border border-accent/20">
                      {enrichment.mandateLevel}
                    </span>
                  )}
                  {enrichment.migrationUrgency && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-status-warning/10 text-status-warning border border-status-warning/20">
                      {enrichment.migrationUrgency}
                    </span>
                  )}
                  {enrichment.sectorApplicability?.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted/30 text-muted-foreground border border-border"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysisOpen && <TimelineAnalysisPanel enrichment={enrichment} />}
          </div>
        )}

        {/* Detail grid: 2×2 on small screens, 4-col inline on sm+ */}
        <div className="pt-3 border-t border-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
            <div>
              <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                Start
              </span>
              <span className="font-mono text-foreground">{phase.startYear}</span>
            </div>
            <div>
              <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                End
              </span>
              <span className="font-mono text-foreground">{phase.endYear}</span>
            </div>
            <div>
              <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                Source
              </span>
              {sourceUrl ? (
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
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <div>
              <span className="block text-muted-foreground uppercase tracking-wider font-medium text-xs">
                Date
              </span>
              <div className="flex items-center gap-1.5 text-foreground">
                <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="truncate">{sourceDate || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <EndorseButton
            endorseUrl={buildEndorsementUrl({
              category: 'timeline-endorsement',
              title: `Endorse: ${primaryEvent?.countryName ?? 'Unknown'} — ${phase.title}`,
              resourceType: 'Timeline Event',
              resourceId: `${primaryEvent?.countryName ?? 'Unknown'} / ${phase.title}`,
              resourceDetails: [
                `**Country:** ${primaryEvent?.countryName ?? 'Unknown'}`,
                `**Phase:** ${phase.phase}`,
                `**Title:** ${phase.title}`,
                `**Period:** ${phase.startYear}–${phase.endYear}`,
                phase.description ? `**Description:** ${phase.description}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
              pageUrl: `/timeline?country=${encodeURIComponent(primaryEvent?.countryName ?? '')}`,
            })}
            resourceLabel={phase.title}
            resourceType="Timeline"
            variant="text"
            label="Endorse"
          />
          <FlagButton
            flagUrl={buildFlagUrl({
              category: 'timeline-endorsement',
              title: `Flag: ${primaryEvent?.countryName ?? 'Unknown'} — ${phase.title}`,
              resourceType: 'Timeline Event',
              resourceId: `${primaryEvent?.countryName ?? 'Unknown'} / ${phase.title}`,
              resourceDetails: [
                `**Country:** ${primaryEvent?.countryName ?? 'Unknown'}`,
                `**Phase:** ${phase.phase}`,
                `**Title:** ${phase.title}`,
                `**Period:** ${phase.startYear}–${phase.endYear}`,
                phase.description ? `**Description:** ${phase.description}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
              pageUrl: `/timeline?country=${encodeURIComponent(primaryEvent?.countryName ?? '')}`,
            })}
            resourceLabel={phase.title}
            resourceType="Timeline"
            variant="text"
            label="Flag"
          />
          <AskAssistantButton
            variant="text"
            label="Ask about this"
            question={`How did the "${phase.title}" ${phase.phase} phase (${phase.startYear}–${phase.endYear}) advance PQC adoption?${phase.description ? ` Context: ${phase.description}` : ''}`}
          />
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
