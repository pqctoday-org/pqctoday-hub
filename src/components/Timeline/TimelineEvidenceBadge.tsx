// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink } from 'lucide-react'

interface TimelineEvidenceBadgeProps {
  confidenceScore?: number
  trustedSourceIdStatus?: string
  /** External authoritative source URL — the only link this badge renders.
   * (Previously linked to a local cached-document path, but that file was
   * never actually published/deployed — see LOCAL-FILES-REMEDIATION-PLAN-07122026.md
   * in the private repo. Removed 2026-07-12 rather than left silently 404ing.) */
  sourceUrl?: string
  /**
   * The source document's own publication date (CSV `SourceDate`), shown as a
   * neutral `Published <date>` chip. It is NOT a freshness state: until
   * 2026-09-24 this date was fed to computeFreshnessState, so a 2022 roadmap
   * read red "Critical" and FIPS 203 read "Stale" purely for being old
   * (63 / 101 of 265 rows). A verification pill returns only when a real
   * per-row decision time exists (timeline remediation r2 T-B3).
   */
  publishedDate?: string
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
  sourceUrl,
  publishedDate,
  compact = false,
}: TimelineEvidenceBadgeProps) {
  const published = (publishedDate ?? '').trim()
  if (!trustedSourceIdStatus && confidenceScore === undefined && !published) return null

  const tier = tierLabel(trustedSourceIdStatus)
  const docHref = sourceUrl

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${tier.cls}`}
        >
          {tier.text}
        </span>
        {published && (
          <span
            data-testid="timeline-published-date"
            className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium bg-muted text-muted-foreground border-border"
          >
            Published {published}
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
            title="View source"
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
        {published && (
          <span
            data-testid="timeline-published-date"
            className="inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium bg-muted text-muted-foreground border-border"
          >
            Published {published}
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
          View source
        </a>
      )}
    </div>
  )
}
