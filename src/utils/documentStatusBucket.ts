// SPDX-License-Identifier: AGPL-3.0-only

export type DocumentStatusBucket =
  'Published' | 'Proposed' | 'Draft' | 'Expired' | 'Superseded' | 'Unverified'

/**
 * Map a raw documentStatus string from the library CSV to one of six buckets.
 * This is the rule set that ran before the lifecycle labels. It now only
 * answers for a document whose `lifecycle_state` is blank or not a label,
 * through `resolveLifecycleLabel` in libraryLifecycle.ts.
 *
 * There is no "Published" default (document labels, 16 Oct 2026). Text that
 * matches no rule — or says it needs review — is Unverified, so an unread
 * status can never be shown to a reader as a released document.
 * libraryLifecycle.test.ts runs every active status string in the latest
 * library CSV through these rules.
 */
export function getDocumentStatusBucket(raw: string): DocumentStatusBucket {
  const s = raw.toLowerCase().trim()
  if (!s || s.includes('unverified') || s.includes('needs review')) return 'Unverified'

  // Expired / obsoleted / withdrawn — before Draft so "Expired Internet-Draft" is Expired
  if (s.includes('superseded')) return 'Superseded'
  if (s.includes('expired') || s.includes('obsoleted') || s.startsWith('withdrawn'))
    return 'Expired'

  // Draft — every in-progress or pre-publication form, with or without a hyphen
  if (
    s.includes('draft') ||
    s.startsWith('draft-') ||
    s.includes('in development') ||
    s.includes('active research') ||
    s.includes('preprint') ||
    s.includes('new project') ||
    s.includes('in iesg review') ||
    s.includes('iesg evaluation')
  )
    return 'Draft'

  // Proposed — selected, nominated or a candidate, but not a finished document
  if (
    s.includes('call for proposals') ||
    /round \d (submission|specification)/.test(s) ||
    s.includes('nist round 4') ||
    s.includes('kpqc selected') ||
    s.includes('study item approved') ||
    s.includes('release candidate') ||
    s.startsWith('beta')
  )
    return 'Proposed'

  // Published — finished documents. An RFC's category ("Proposed Standard",
  // "Standards Track", "Informational", "Experimental", "Best Current
  // Practice") describes a published RFC, not a draft.
  if (
    /\b(published|final|released|in force|enacted|adopted|approved|current|live|active)\b/.test(
      s
    ) ||
    /\b(standard|standards track|rfc|recommendation|guidance|guideline|informational|experimental|best current practice)\b/.test(
      s
    ) ||
    /\b(white paper|report|specification|policy|advisory|certified|certification|results|executive order|programme|program|living document|web resource|presentation|position paper|ballot \(passed\)|framework|note|practice guide)\b/.test(
      s
    )
  )
    return 'Published'

  return 'Unverified'
}
