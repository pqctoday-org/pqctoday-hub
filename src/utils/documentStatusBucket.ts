// SPDX-License-Identifier: GPL-3.0-only

export type DocumentStatusBucket = 'Published' | 'Proposed' | 'Draft' | 'Expired' | 'Superseded'

/** Map a raw documentStatus string from the library CSV to one of five lifecycle buckets. */
export function getDocumentStatusBucket(raw: string): DocumentStatusBucket {
  const s = raw.toLowerCase().trim()

  // Expired / obsoleted — check first so "Expired" substrings win over "Draft" patterns
  if (s.includes('expired') || s.includes('obsoleted')) return 'Expired'

  // Superseded
  if (s.includes('superseded')) return 'Superseded'

  // Draft — all forms of in-progress, unfinished, or pre-publication documents
  if (
    s.includes('internet-draft') ||
    s.includes('initial public draft') ||
    s === 'draft' ||
    s.startsWith('draft ') ||
    s.includes('pre-draft') ||
    s.includes('in development') ||
    s.includes('active research') ||
    s.includes('preprint') ||
    s.includes('new project') ||
    s.includes('committee specification draft') ||
    s.includes('preliminary draft')
  )
    return 'Draft'

  // Proposed — selected/nominated but not yet a finished standard
  if (
    s.includes('proposed standard') ||
    s.includes('call for proposals') ||
    s.includes('round 4 submission') ||
    s.includes('nist round 4') ||
    s.includes('kpqc selected') ||
    s.includes('in iesg review') ||
    s.includes('study item approved') ||
    // "Standards Track" without "rfc" means it's on the path but not yet an RFC
    (s.includes('standards track') && !s.includes('rfc') && !s.includes('internet-draft'))
  )
    return 'Proposed'

  // Default — published, active, final, in force, enacted, etc.
  return 'Published'
}

export const BUCKET_STYLES: Record<
  DocumentStatusBucket,
  { badge: string; label: string; dot: string }
> = {
  Published: {
    badge: 'bg-success/15 text-success border border-success/40',
    label: 'Published',
    dot: 'bg-success',
  },
  Draft: {
    badge: 'bg-warning/15 text-warning border border-warning/40',
    label: 'Draft',
    dot: 'bg-warning',
  },
  Proposed: {
    badge: 'bg-status-info/15 text-status-info border border-status-info/40',
    label: 'Proposed',
    dot: 'bg-status-info',
  },
  Expired: {
    badge: 'bg-destructive/15 text-destructive border border-destructive/40',
    label: 'Expired',
    dot: 'bg-destructive',
  },
  Superseded: {
    badge: 'bg-muted text-muted-foreground border border-border',
    label: 'Superseded',
    dot: 'bg-muted-foreground',
  },
}

export const LIFECYCLE_FILTER_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'All', label: 'All Statuses' },
  { id: 'Published', label: 'Published' },
  { id: 'Proposed', label: 'Proposed' },
  { id: 'Draft', label: 'Draft' },
  { id: 'Expired', label: 'Expired' },
  { id: 'Superseded', label: 'Superseded' },
]
