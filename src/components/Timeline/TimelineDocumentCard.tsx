// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ExternalLink, Flag, Info, Sparkles } from 'lucide-react'
import { StatusBadge } from '../common/StatusBadge'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import type { Phase } from '../../types/timeline'
import { phaseColors } from '../../data/timelineData'
import {
  timelineEnrichments,
  hasSubstantiveEnrichment,
  getTimelineEnrichmentKey,
} from '../../data/timelineEnrichmentData'
import type { TimelineDocumentRow } from './TimelineDocumentDetailPopover'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { TimelineEvidenceBadge } from './TimelineEvidenceBadge'
import { ReviewedBadge } from '@/components/ui/ReviewedBadge'
import { RevisionDrilldownPanel } from '@/components/ui/RevisionDrilldownPanel'
import { useRevisions, byRecord } from '@/hooks/useRevisions'
import { Button } from '@/components/ui/button'

interface TimelineDocumentCardProps {
  row: TimelineDocumentRow
  onViewDetails: (row: TimelineDocumentRow) => void
  index?: number
}

export const TimelineDocumentCard = ({
  row,
  onViewDetails,
  index = 0,
}: TimelineDocumentCardProps) => {
  const colors = phaseColors[row.phase as Phase] || {
    start: 'hsl(var(--muted-foreground))',
    end: 'hsl(var(--muted))',
    glow: 'hsl(var(--ring))',
  }
  const { revisions } = useRevisions()
  const [drilldownOpen, setDrilldownOpen] = useState(false)

  const enrichmentKey = getTimelineEnrichmentKey(row.countryName, row.org, row.title)
  const enrichment = timelineEnrichments[enrichmentKey]
  const isEnriched = !!enrichment && hasSubstantiveEnrichment(enrichment)

  const period =
    row.startYear < 2025
      ? `< 2024${row.startYear !== row.endYear ? ` – ${row.endYear}` : ''}`
      : row.startYear === row.endYear
        ? String(row.startYear)
        : `${row.startYear} – ${row.endYear}`

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      role="button"
      tabIndex={0}
      onClick={() => onViewDetails(row)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewDetails(row)
        }
      }}
      aria-label={`View details for ${row.title}`}
      className="glass-panel p-5 flex flex-col h-full hover:border-secondary/50 hover:bg-card/70 transition-colors bg-card/50 relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
    >
      {row.status && (
        <div className="absolute top-3 right-3">
          <StatusBadge status={row.status as 'New' | 'Updated'} size="sm" />
        </div>
      )}

      {/* Org as identifier (analogous to referenceId) */}
      <span className="font-mono text-sm text-primary/80 mb-1 truncate pr-16" title={row.org}>
        {row.org}
      </span>

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground mb-2 leading-snug pr-16 line-clamp-2">
        {row.title}
      </h3>

      {/* Phase + Type + Trust + Enriched badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <TrustScoreBadge
          resourceType="timeline"
          resourceId={getTimelineEnrichmentKey(row.countryName, row.org, row.title)}
          size="sm"
        />
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
        {isEnriched && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            title="AI-analyzed document with enriched metadata"
          >
            <Sparkles size={10} aria-hidden="true" />
            Enriched
          </span>
        )}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <span onClick={(e) => e.stopPropagation()}>
          <ReviewedBadge
            domain="timeline"
            entityId={row.title}
            showUnreviewed={false}
            onOpenDrilldown={() => setDrilldownOpen(true)}
          />
        </span>
      </div>

      {/* Evidence badge row — FR-T-03 + C9 freshness */}
      {(row.confidenceScore !== undefined || row.trustedSourceIdStatus || row.sourceDate) && (
        <div className="mb-2">
          <TimelineEvidenceBadge
            confidenceScore={row.confidenceScore}
            trustedSourceIdStatus={row.trustedSourceIdStatus}
            localFile={row.localFile}
            lastVerifiedDate={row.sourceDate}
            compact
          />
        </div>
      )}

      {/* Period */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Calendar size={12} aria-hidden="true" />
        <span>{period}</span>
      </div>

      {/* Country pill */}
      <div className="flex flex-wrap gap-1 mb-3">
        <span className="px-1.5 py-0.5 rounded text-xs bg-muted/30 text-muted-foreground border border-border">
          {row.countryName}
        </span>
      </div>

      {/* Footer actions */}
      <div
        className="flex items-center gap-2 mt-auto pt-3 border-t border-border"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <Button
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(row)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary text-xs font-medium transition-all"
          aria-label={`View details for ${row.title}`}
        >
          {isEnriched ? (
            <Sparkles size={14} aria-hidden="true" />
          ) : (
            <Info size={14} aria-hidden="true" />
          )}
          Details
        </Button>
        {row.sourceUrl && (
          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted/30 border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-all"
            aria-label={`View source for ${row.title}`}
          >
            <ExternalLink size={14} aria-hidden="true" />
            Source
          </a>
        )}
        <div className="flex items-center gap-1 ml-auto">
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
        </div>
      </div>
      {drilldownOpen && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onClick={(e) => e.stopPropagation()}>
          <RevisionDrilldownPanel
            domain="timeline"
            entityId={row.title}
            entityLabel={row.title}
            revisions={byRecord(revisions, 'timeline', row.title)}
            onClose={() => setDrilldownOpen(false)}
          />
        </div>
      )}
    </motion.article>
  )
}
