// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared pill/label helpers for the Library redesign cards + drawer. Token-only
 * styling (per the app's semantic-token standard).
 */
import { BUCKET_STYLES, type DocumentStatusBucket } from '@/utils/documentStatusBucket'
import { getTrustScore } from '@/data/trustScore'

export function lifecycleLabel(bucket: DocumentStatusBucket): string {
  // eslint-disable-next-line security/detect-object-injection -- bucket is a typed enum key
  return BUCKET_STYLES[bucket]?.label ?? bucket
}

export function lifecyclePillClass(bucket: DocumentStatusBucket): string {
  // eslint-disable-next-line security/detect-object-injection -- bucket is a typed enum key
  return BUCKET_STYLES[bucket]?.badge ?? 'bg-muted text-muted-foreground'
}

/** Urgency pill — only Critical/High are shown on cards (per the design). */
export function urgencyPillClass(urgency: string): string {
  switch (urgency) {
    case 'Critical':
      return 'bg-destructive/15 text-destructive'
    case 'High':
      return 'bg-warning/15 text-warning'
    case 'Medium':
      return 'bg-info/15 text-info'
    case 'Low':
      return 'bg-success/15 text-success'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export interface TrustInfo {
  score: number | null
  pillClass: string
  source: 'Authoritative' | 'Needs review'
}

export function trustInfo(referenceId: string): TrustInfo {
  const ts = getTrustScore('library', referenceId)
  const score = ts ? ts.compositeScore : null
  const pillClass =
    score == null
      ? 'bg-muted text-muted-foreground'
      : score >= 80
        ? 'bg-success/15 text-success'
        : score >= 66
          ? 'bg-warning/15 text-warning'
          : 'bg-muted text-muted-foreground'
  const source: TrustInfo['source'] =
    ts && (ts.tier === 'Authoritative' || ts.tier === 'High') ? 'Authoritative' : 'Needs review'
  return { score, pillClass, source }
}

/** Render a catalog date at the precision the evidence actually supports.
 *
 * Publication dates are stored as partial ISO where the publisher states no more
 * than that — an RFC is published in a month ("2019-04"), an ISO standard's
 * edition is a year ("2000"). Formatting those through a full date would print
 * "Apr 1, 2019", re-inventing the exact day this data was cleaned up to remove.
 * Parsed as UTC and formatted with a UTC timeZone so a date-only string can't
 * slip a day backwards for readers west of Greenwich. */
export function formatLibDate(raw: string): string {
  const value = raw?.trim()
  if (!value) return ''
  const opts: Intl.DateTimeFormatOptions = { timeZone: 'UTC', year: 'numeric' }
  if (/^\d{4}$/.test(value)) return value
  if (/^\d{4}-\d{2}$/.test(value)) {
    opts.month = 'short'
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    opts.month = 'short'
    opts.day = 'numeric'
  } else {
    opts.month = 'short'
    opts.day = 'numeric'
    delete opts.timeZone
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, opts)
}
