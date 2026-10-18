// SPDX-License-Identifier: AGPL-3.0-only
import type { LibraryItem } from '@/data/libraryData'

const SCOPE_SENSITIVE_CLAIM =
  /\b(mandat(?:e|ed|ory)|require(?:d|ment)?|must|prohibit(?:s|ed)?|deadline|compliant|certif(?:y|ied|ication))\b/i

/**
 * Catalog summaries are pqctoday editorial text, not quotations from the
 * publisher. Low-confidence or stale summaries containing obligation language
 * need an explicit scope warning: applicability often depends on jurisdiction,
 * system class, scheme version, and effective date.
 */
export function needsScopeVerification(item: LibraryItem): boolean {
  return (
    SCOPE_SENSITIVE_CLAIM.test(item.shortDescription ?? '') &&
    ((item.confidenceScore ?? 0) < 85 || !item.lastVerified)
  )
}

export const MISSING_REVIEWED_SUMMARY =
  'No reviewed pqctoday summary yet. Use the official source for its scope and details.'

export const SCOPE_VERIFICATION_NOTE =
  'Scope-sensitive catalog summary: verify the official source before treating this as a requirement. Applicability can depend on jurisdiction, system, scheme version, and date.'

export function paidSourceContext(item: LibraryItem): string | null {
  if (item.accessType !== 'paid' || item.freeSummaryUrl) return null
  return 'The publisher purchase page is the only free official description catalogued; no separate free official summary is available here.'
}
