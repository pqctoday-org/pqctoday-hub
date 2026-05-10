// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink } from 'lucide-react'

interface TimelineEvidenceBadgeProps {
  confidenceScore?: number
  trustedSourceIdStatus?: string
  localFile?: string
  /**
   * ISO date used to compute freshness state (C9). When set, renders a
   * `current` (≤365d), `stale` (≤730d), or `critical` (>730d) pill alongside
   * the tier and confidence chips.
   */
  lastVerifiedDate?: string
  compact?: boolean
}

export type FreshnessState = 'current' | 'stale' | 'critical'

export function computeFreshnessState(
  isoDate: string | undefined,
  now: number = Date.now()
): FreshnessState | null {
  if (!isoDate) return null
  const ts = Date.parse(isoDate)
  if (!Number.isFinite(ts)) return null
  const days = Math.floor((now - ts) / (1000 * 60 * 60 * 24))
  if (days <= 365) return 'current'
  if (days <= 730) return 'stale'
  return 'critical'
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

function tierLabel(status: string | undefined): { text: string; cls: string } {
  switch (status) {
    case 'registered':
      return {
        text: 'Tier 1',
        cls: 'bg-status-success/10 text-status-success border-status-success/30',
      }
    case 'proposed':
      return {
        text: 'Tier 2',
        cls: 'bg-status-warning/10 text-status-warning border-status-warning/30',
      }
    default:
      return { text: 'Unverified', cls: 'bg-muted text-muted-foreground border-border' }
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-status-success'
  if (score >= 55) return 'text-status-warning'
  return 'text-status-error'
}

export function TimelineEvidenceBadge({
  confidenceScore,
  trustedSourceIdStatus,
  localFile,
  lastVerifiedDate,
  compact = false,
}: TimelineEvidenceBadgeProps) {
  const freshness = computeFreshnessState(lastVerifiedDate)
  if (!trustedSourceIdStatus && confidenceScore === undefined && !freshness) return null

  const tier = tierLabel(trustedSourceIdStatus)
  const docHref = localFile ? `/${localFile.replace(/^public\//, '')}` : undefined

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${tier.cls}`}
        >
          {tier.text}
        </span>
        {freshness && (
          <span
            data-testid="timeline-freshness-badge"
            data-freshness={freshness}
            aria-label={`Source freshness: ${FRESHNESS_LABEL[freshness]}`}
            className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${FRESHNESS_CLS[freshness]}`}
          >
            {FRESHNESS_LABEL[freshness]}
          </span>
        )}
        {confidenceScore !== undefined && (
          <span className={`text-[10px] font-mono tabular-nums ${scoreColor(confidenceScore)}`}>
            {confidenceScore}/100
          </span>
        )}
        {docHref && (
          <a
            href={docHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-[10px] text-primary hover:underline"
            title="View cached document"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </span>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${tier.cls}`}
        >
          {tier.text}
        </span>
        {freshness && (
          <span
            data-testid="timeline-freshness-badge"
            data-freshness={freshness}
            aria-label={`Source freshness: ${FRESHNESS_LABEL[freshness]}`}
            className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${FRESHNESS_CLS[freshness]}`}
          >
            {FRESHNESS_LABEL[freshness]}
          </span>
        )}
        {confidenceScore !== undefined && (
          <span className={`text-xs font-mono tabular-nums ${scoreColor(confidenceScore)}`}>
            confidence: {confidenceScore} / 100
          </span>
        )}
      </div>
      {docHref && (
        <a
          href={docHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          View cached document
        </a>
      )}
    </div>
  )
}
