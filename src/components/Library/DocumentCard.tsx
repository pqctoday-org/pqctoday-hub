// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Eye,
  ExternalLink,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import type { LibraryItem } from '../../data/libraryData'
import { libraryEnrichments } from '../../data/libraryEnrichmentData'
import { maturityByRefId } from '../../data/maturityGovernanceData'
import { PILLAR_TO_ZONE, CSWP39_ZONE_DETAILS, CSWP39_ZONE_STYLES } from '../../data/cswp39ZoneData'
import { CSWP39_TIERS } from '../Compliance/cswp39Data'
import type { PillarId, MaturityLevel } from '@/types/MaturityTypes'
import { StatusBadge } from '../common/StatusBadge'
import { BUCKET_STYLES } from '../../utils/documentStatusBucket'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildLibraryEndorsementUrl, buildLibraryFlagUrl } from './libraryEndorsement'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'
import { DocumentAnalysis } from './DocumentAnalysis'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'

interface DocumentCardProps {
  item: LibraryItem
  onViewDetails: (item: LibraryItem) => void
  index?: number
  highlighted?: boolean
}

const URGENCY_COLORS: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive border-destructive/20',
  High: 'bg-status-warning text-status-warning',
  Medium: 'bg-status-warning text-status-warning',
  Low: 'bg-status-success text-status-success border-status-success',
}

// Pillars rendered in CSWP 39 5-step process order so the pill cluster reads
// left-to-right as Govern → Inventory → Identify Gaps → Prioritise → Implement.
const PILLAR_ORDER: PillarId[] = [
  'governance',
  'inventory',
  'observability',
  'assurance',
  'lifecycle',
]

const TIER_TONE_TO_FILL: Record<'error' | 'warning' | 'info' | 'success', string> = {
  error: 'bg-status-error',
  warning: 'bg-status-warning',
  info: 'bg-status-info',
  success: 'bg-status-success',
}

export const DocumentCard = ({
  item,
  onViewDetails,
  index = 0,
  highlighted,
}: DocumentCardProps) => {
  const { libraryBookmarks, toggleLibraryBookmark } = useBookmarkStore()
  const isBookmarked = libraryBookmarks.includes(item.referenceId)
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])
  const isEnriched = !!libraryEnrichments[item.referenceId]

  // CSWP 39 rollup: pillar counts + tier coverage from the maturity dataset.
  // Silent (renders nothing) when this referenceId has no enriched requirements.
  const cswp39 = useMemo(() => {
    const reqs = maturityByRefId.get(item.referenceId)
    if (!reqs || reqs.length === 0) return null
    const pillarCounts = new Map<PillarId, number>()
    const tiers = new Set<MaturityLevel>()
    for (const r of reqs) {
      pillarCounts.set(r.pillar, (pillarCounts.get(r.pillar) ?? 0) + 1)
      tiers.add(r.maturityLevel)
    }
    const pillars = PILLAR_ORDER.filter((p) => pillarCounts.has(p)).map((p) => ({
      pillar: p,
      count: pillarCounts.get(p)!,
    }))
    return { pillars, tiers, total: reqs.length }
  }, [item.referenceId])

  return (
    <motion.article
      ref={cardRef}
      id={`doc-${item.referenceId}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={() => onViewDetails(item)}
      className={clsx(
        'glass-panel p-5 flex flex-col h-full hover:border-secondary/50 hover:shadow-md cursor-pointer transition-all bg-card/50 relative scroll-mt-20',
        highlighted && 'ring-2 ring-primary shadow-glow',
        (item.documentStatusBucket === 'Expired' || item.documentStatusBucket === 'Superseded') &&
          'opacity-50 hover:opacity-90'
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewDetails(item)
        }
      }}
    >
      {item.status && (
        <div className="absolute top-3 right-3">
          <StatusBadge status={item.status} size="sm" />
        </div>
      )}

      <span className="font-mono text-sm text-primary/80 mb-1">{item.referenceId}</span>

      <h3
        className="text-sm font-semibold text-foreground mb-2 leading-snug pr-16 line-clamp-2"
        title={item.documentTitle}
      >
        {item.documentTitle}
      </h3>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <TrustScoreBadge resourceType="library" resourceId={item.referenceId} size="sm" />
        <span
          className={clsx(
            'inline-flex self-start items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider',
            BUCKET_STYLES[item.documentStatusBucket].badge
          )}
          title={item.documentStatus}
        >
          {BUCKET_STYLES[item.documentStatusBucket].label}
        </span>
        {isEnriched ? (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            title="AI-analyzed document with enriched metadata"
          >
            <Sparkles size={10} aria-hidden="true" />
            Enriched
          </span>
        ) : item.localFile ? (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            title="Rich summary and preview available"
          >
            <Eye size={10} aria-hidden="true" />
            Preview
          </span>
        ) : null}
      </div>

      {cswp39 && (
        <div
          className="mb-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            CSWP 39
            <span className="text-muted-foreground/50">▸</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {cswp39.pillars.map(({ pillar, count }) => {
              const zoneId = PILLAR_TO_ZONE[pillar]
              const style = CSWP39_ZONE_STYLES[zoneId]
              const detail = CSWP39_ZONE_DETAILS[zoneId]
              return (
                <Link
                  key={pillar}
                  to={`/business#zone-${zoneId}`}
                  title={`${detail.title} — ${count} requirement${count === 1 ? '' : 's'}; click to open the ${detail.title} zone`}
                  className={clsx(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-opacity hover:opacity-80',
                    style.border,
                    style.bg,
                    style.text
                  )}
                >
                  <span className="capitalize">{pillar}</span>
                  <span className="opacity-70">·{count}</span>
                </Link>
              )
            })}
            <div
              className="inline-flex items-center gap-0.5 ml-1"
              title="Maturity tiers covered (Tier 1 Partial → Tier 4 Adaptive)"
            >
              {([1, 2, 3, 4] as MaturityLevel[]).map((level) => {
                const tier = CSWP39_TIERS[level - 1]
                const filled = cswp39.tiers.has(level)
                return (
                  <span
                    key={level}
                    aria-label={`Tier ${level} ${tier.name}${filled ? ' covered' : ' not covered'}`}
                    className={clsx(
                      'w-2 h-2 rounded-full border',
                      filled
                        ? `${TIER_TONE_TO_FILL[tier.tone]} border-transparent`
                        : 'bg-transparent border-muted-foreground/30'
                    )}
                  />
                )
              })}
            </div>
            <Link
              to={`/compliance?tab=cswp39&evref=${encodeURIComponent(item.referenceId)}`}
              title={`View ${cswp39.total} CSWP 39 requirements extracted from this document`}
              className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {cswp39.total} req{cswp39.total === 1 ? '' : 's'}
              <ArrowRight size={10} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Calendar size={12} aria-hidden="true" />
        <span>{item.lastUpdateDate}</span>
      </div>

      {item.migrationUrgency && (
        <span
          className={clsx(
            'inline-flex self-start items-center px-2 py-0.5 rounded text-xs font-medium border mb-2',
            URGENCY_COLORS[item.migrationUrgency] ??
              'bg-muted/20 text-muted-foreground border-border'
          )}
        >
          {item.migrationUrgency} urgency
        </span>
      )}

      {item.regionScope && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.regionScope.split(',').map((region) => (
            <span
              key={region.trim()}
              className="px-1.5 py-0.5 rounded text-xs bg-muted/30 text-muted-foreground border border-border"
            >
              {region.trim()}
            </span>
          ))}
        </div>
      )}

      {isEnriched && (
        <div
          className="mb-3 mt-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <DocumentAnalysis enrichment={libraryEnrichments[item.referenceId]} />
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
        {item.downloadUrl && (
          <a
            href={item.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted/30 border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-all"
            aria-label={`Open ${item.documentTitle} in new tab`}
          >
            <ExternalLink size={14} aria-hidden="true" />
            Open
          </a>
        )}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="flex items-center gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              toggleLibraryBookmark(item.referenceId)
            }}
            className="p-1 rounded hover:bg-muted/50 transition-colors"
            aria-label={
              isBookmarked ? `Remove ${item.referenceId} bookmark` : `Bookmark ${item.referenceId}`
            }
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {isBookmarked ? (
              <BookmarkCheck size={16} className="text-primary" />
            ) : (
              <Bookmark size={16} className="text-muted-foreground" />
            )}
          </Button>
          <EndorseButton
            endorseUrl={buildLibraryEndorsementUrl(item)}
            resourceLabel={item.referenceId}
            resourceType="Library"
          />
          <FlagButton
            flagUrl={buildLibraryFlagUrl(item)}
            resourceLabel={item.referenceId}
            resourceType="Library"
          />
        </div>
      </div>
    </motion.article>
  )
}
