// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink, Calendar, X, Flag, BookOpen } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import FocusLock from 'react-focus-lock'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { DocumentAnalysis } from '../Library/DocumentAnalysis'
import { TimelineAnalysisPanel } from './TimelineAnalysisPanel'
import {
  timelineEnrichments,
  hasSubstantiveEnrichment,
  getTimelineEnrichmentKey,
  timelineToLibraryRef,
} from '../../data/timelineEnrichmentData'
import type { Phase } from '../../types/timeline'
import { phaseColors } from '../../data/timelineData'

export interface TimelineDocumentRow {
  countryName: string
  org: string
  phase: string
  type: string
  title: string
  startYear: number
  endYear: number
  description: string
  sourceUrl?: string
  sourceDate?: string
  status?: string
}

interface TimelineDocumentDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  row: TimelineDocumentRow | null
}

export const TimelineDocumentDetailPopover = ({
  isOpen,
  onClose,
  row,
}: TimelineDocumentDetailPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !row) return null

  const style: React.CSSProperties = { zIndex: 9999 }
  const colors = phaseColors[row.phase as Phase] || {
    start: 'hsl(var(--muted-foreground))',
    end: 'hsl(var(--muted))',
    glow: 'hsl(var(--ring))',
  }

  const period =
    row.startYear < 2025
      ? `< 2024${row.startYear !== row.endYear ? ` – ${row.endYear}` : ''}`
      : row.startYear === row.endYear
        ? String(row.startYear)
        : `${row.startYear} – ${row.endYear}`

  const enrichmentKey = getTimelineEnrichmentKey(row.countryName, row.org, row.title)
  const enrichment = timelineEnrichments[enrichmentKey]
  const isEnriched = !!enrichment && hasSubstantiveEnrichment(enrichment)

  // Check if this timeline doc's SourceUrl matches a library record
  const libraryRefId = row.sourceUrl ? timelineToLibraryRef[row.sourceUrl] : undefined

  const content = (
    <FocusLock returnFocus>
      <div
        ref={popoverRef}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:w-[85vw] md:w-[60vw] max-w-[1200px] max-h-[85vh] border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col bg-popover text-popover-foreground shadow-2xl"
        style={style}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timeline-doc-popover-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-start gap-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-black"
                style={{ backgroundColor: colors.start }}
              >
                {row.phase}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-status-info text-status-info border border-status-info/50">
                {row.type === 'Milestone' && <Flag size={9} aria-hidden="true" />}
                {row.type}
              </span>
              <span className="text-xs text-muted-foreground">{row.org}</span>
            </div>
            <h3
              id="timeline-doc-popover-title"
              className="text-lg font-bold text-foreground leading-tight"
            >
              {row.title}
            </h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <EndorseButton
              endorseUrl={buildEndorsementUrl({
                category: 'timeline-endorsement',
                title: `Endorse: ${row.countryName} — ${row.title}`,
                resourceType: 'Timeline Document',
                resourceId: `${row.countryName} / ${row.title}`,
                resourceDetails: [
                  `**Country:** ${row.countryName}`,
                  `**Organization:** ${row.org}`,
                  `**Phase:** ${row.phase}`,
                  `**Title:** ${row.title}`,
                  `**Period:** ${row.startYear}–${row.endYear}`,
                ].join('\n'),
                pageUrl: `/timeline?country=${encodeURIComponent(row.countryName)}`,
              })}
              resourceLabel={row.title}
              resourceType="Timeline"
            />
            <FlagButton
              flagUrl={buildFlagUrl({
                category: 'timeline-endorsement',
                title: `Flag: ${row.countryName} — ${row.title}`,
                resourceType: 'Timeline Document',
                resourceId: `${row.countryName} / ${row.title}`,
                resourceDetails: [
                  `**Country:** ${row.countryName}`,
                  `**Organization:** ${row.org}`,
                  `**Phase:** ${row.phase}`,
                  `**Title:** ${row.title}`,
                  `**Period:** ${row.startYear}–${row.endYear}`,
                ].join('\n'),
                pageUrl: `/timeline?country=${encodeURIComponent(row.countryName)}`,
              })}
              resourceLabel={row.title}
              resourceType="Timeline"
            />
            <AskAssistantButton
              question={`Explain the "${row.title}" ${row.type.toLowerCase()} for ${row.org} (${row.countryName}) in the context of PQC migration.${row.description ? ` Context: ${row.description}` : ''}`}
            />
            <button
              onClick={onClose}
              aria-label="Close details"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Description
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {row.description?.trim() || 'No description available.'}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 w-full">
            <div className="flex flex-row items-baseline gap-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                Organization:
              </h4>
              <p className="text-sm text-foreground truncate" title={row.org}>
                {row.org}
              </p>
            </div>

            <div className="flex flex-row items-baseline gap-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                Country:
              </h4>
              <p className="text-sm text-foreground">{row.countryName}</p>
            </div>

            <div className="flex flex-row items-center gap-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                Phase:
              </h4>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-black"
                style={{ backgroundColor: colors.start }}
              >
                {row.phase}
              </span>
            </div>

            <div className="flex flex-row items-center gap-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                Type:
              </h4>
              <span className="inline-flex items-center gap-1 text-sm text-foreground">
                {row.type === 'Milestone' && (
                  <Flag size={12} className="text-muted-foreground" aria-hidden="true" />
                )}
                {row.type}
              </span>
            </div>

            <div className="flex flex-row items-center gap-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                Period:
              </h4>
              <div className="flex items-center gap-1.5 text-foreground text-sm">
                <Calendar className="w-3 h-3 text-muted-foreground shrink-0" aria-hidden="true" />
                <span>{period}</span>
              </div>
            </div>

            {row.sourceDate && (
              <div className="flex flex-row items-center gap-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                  Source Date:
                </h4>
                <div className="flex items-center gap-1.5 text-foreground text-sm">
                  <Calendar className="w-3 h-3 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span>{row.sourceDate}</span>
                </div>
              </div>
            )}
          </div>

          {/* Source link + Library cross-link */}
          {(row.sourceUrl || libraryRefId) && (
            <div className="pt-2 border-t border-border flex flex-wrap items-center gap-3">
              {row.sourceUrl && (
                <a
                  href={row.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  View Source
                </a>
              )}
              {libraryRefId && (
                <Link
                  to={`/library?ref=${encodeURIComponent(libraryRefId)}`}
                  className="inline-flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors text-sm font-medium"
                >
                  <BookOpen size={13} aria-hidden="true" />
                  Also in Library
                </Link>
              )}
            </div>
          )}

          {/* Document Analysis — enriched base dimensions */}
          {isEnriched && <DocumentAnalysis enrichment={enrichment} />}

          {/* Timeline Analysis — timeline-specific dimensions */}
          {isEnriched && <TimelineAnalysisPanel enrichment={enrichment} />}
        </div>
      </div>
    </FocusLock>
  )

  return createPortal(content, document.body)
}
