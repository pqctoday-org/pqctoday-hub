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

export function formatLibDate(raw: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
