// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink } from 'lucide-react'
import type { TrustTier } from '@/data/trustScore'
import {
  computeFreshnessState,
  type FreshnessState,
} from '@/components/Timeline/TimelineEvidenceBadge'

interface EvidenceBadgeProps {
  /** Normalized 4-tier trust label from the scoring engine. Omit to suppress the tier chip. */
  tier?: TrustTier
  /** ISO date string for freshness computation (current ≤365d, stale ≤730d, critical >730d) */
  lastVerifiedDate?: string
  /** Composite confidence score 0–100 */
  confidenceScore?: number
  /** Local cached document path (e.g. `public/library/FIPS_203.pdf` or `library/FIPS_203.pdf`) */
  localFile?: string
  /** Fallback external authoritative URL when no local cache exists */
  sourceUrl?: string
  /** Compact inline layout (10px chips) vs. default stacked (12px) */
  compact?: boolean
  className?: string
}

const TIER_CLS: Record<TrustTier, string> = {
  Authoritative: 'bg-status-success/10 text-status-success border-status-success/30',
  High: 'bg-status-info/10 text-status-info border-status-info/30',
  Moderate: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  Low: 'bg-status-error/10 text-status-error border-status-error/30',
}

const FRESHNESS_CLS: Record<FreshnessState, string> = {
  current: 'bg-status-success/10 text-status-success border-status-success/30',
  stale: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  critical: 'bg-status-error/10 text-status-error border-status-error/30',
}

const FRESHNESS_LABEL: Record<FreshnessState, string> = {
  current: 'Current',
  stale: 'Stale',
  critical: 'Critical',
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-status-success'
  if (score >= 55) return 'text-status-warning'
  return 'text-status-error'
}

function cachedHref(localFile?: string, sourceUrl?: string): string | undefined {
  if (localFile) return `/${localFile.replace(/^public\//, '')}`
  return sourceUrl
}

export function EvidenceBadge({
  tier,
  lastVerifiedDate,
  confidenceScore,
  localFile,
  sourceUrl,
  compact = false,
  className = '',
}: EvidenceBadgeProps) {
  const freshness = computeFreshnessState(lastVerifiedDate)
  const docHref = cachedHref(localFile, sourceUrl)

  if (!tier && !freshness && confidenceScore === undefined && !docHref) return null

  const chipSize = compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
  const scoreSize = compact ? 'text-[10px]' : 'text-xs'

  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      {tier && (
        <span
          className={`inline-flex items-center rounded border font-medium ${chipSize} ${TIER_CLS[tier]}`}
          title={`Trust tier: ${tier}`}
        >
          {tier}
        </span>
      )}
      {freshness && (
        <span
          data-testid="evidence-freshness-badge"
          data-freshness={freshness}
          aria-label={`Source freshness: ${FRESHNESS_LABEL[freshness]}`}
          className={`inline-flex items-center rounded border font-medium ${chipSize} ${FRESHNESS_CLS[freshness]}`}
        >
          {FRESHNESS_LABEL[freshness]}
        </span>
      )}
      {confidenceScore !== undefined && (
        <span
          className={`font-mono tabular-nums ${scoreSize} ${scoreColor(confidenceScore)}`}
          title={`Confidence: ${confidenceScore}/100`}
        >
          {confidenceScore}/100
        </span>
      )}
      {docHref && (
        <a
          href={docHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center text-primary hover:underline ${scoreSize}`}
          title={localFile ? 'View cached document' : 'View source'}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        </a>
      )}
    </span>
  )
}
