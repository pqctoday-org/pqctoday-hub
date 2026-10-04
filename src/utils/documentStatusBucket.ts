// SPDX-License-Identifier: GPL-3.0-only

export type DocumentStatusBucket = 'Published' | 'Proposed' | 'Draft' | 'Expired' | 'Superseded'

/**
 * Map a raw documentStatus string from the library CSV to one of five buckets.
 * This is the rule set that ran before the six lifecycle labels. It now only
 * answers for a document whose `lifecycle_state` is blank, through
 * `resolveLifecycleLabel` in libraryLifecycle.ts, which maps the five buckets onto
 * the six labels (Published to Released, Proposed to Draft, Superseded to Historical).
 */
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
