// SPDX-License-Identifier: GPL-3.0-only
/**
 * Community leaders related to a library document — shared by the detail
 * drawer and the legacy LibraryDetailPopover (Compliance still hosts it), so
 * both list the same people.
 */
import type { LibraryItem } from '@/data/libraryData'
import { deprecatedLeaderSuccessors, leadersData, type Leader } from '@/data/leadersData'
import { findLeaderByParam } from '@/components/Leaders/leaderDeepLink'
import { libraryEnrichments } from '@/data/libraryEnrichmentData'

/**
 * Enrichment contributor strings carry annotations ("Chris Peikert (author)",
 * "Jaime Gómez García (Banco Santander)"); drop them, then resolve with the
 * Community page's own matcher — accent- and honorific-tolerant, and it
 * forwards names of merged duplicate profiles to the kept one.
 */
function leaderForContributor(raw: string): Leader | undefined {
  const cleaned = raw.replace(/\s*\(.*?\)/g, '').trim()
  return cleaned ? findLeaderByParam(leadersData, cleaned, deprecatedLeaderSuccessors) : undefined
}

export function relatedLeadersFor(item: LibraryItem): Leader[] {
  // Pass 1: reverse keyResourceRefs lookup (authoritative). `keyResourceUrl`
  // contains URLs, not library reference IDs — use the dedicated refs field.
  const seen = new Set<string>()
  const related: Leader[] = []
  for (const l of leadersData) {
    if (l.keyResourceRefs?.includes(item.referenceId)) {
      related.push(l)
      seen.add(l.id)
    }
  }

  // Pass 2: name-match from enrichment leadersContributions (additive, deduplicated)
  const enrichment = libraryEnrichments[item.referenceId]
  if (enrichment) {
    for (const contrib of enrichment.leadersContributions) {
      const leader = leaderForContributor(contrib)
      if (leader && !seen.has(leader.id)) {
        related.push(leader)
        seen.add(leader.id)
      }
    }
  }
  return related
}
