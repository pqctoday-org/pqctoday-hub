// SPDX-License-Identifier: AGPL-3.0-only
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
function leaderForContributor(raw: string): Leader[] {
  const cleaned = raw.replace(/\s*\(.*?\)/g, '').trim()
  if (!cleaned) return []
  const whole = findLeaderByParam(leadersData, cleaned, deprecatedLeaderSuccessors)
  if (whole) return [whole]
  // One list item can name several people, or a person and their title
  // ("Tushin Mallick, Ashish Kundu, Ramana Kompella"; "Ray Harishankar, IBM
  // Fellow"), so try each comma part as a name too.
  return cleaned
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => findLeaderByParam(leadersData, part, deprecatedLeaderSuccessors))
    .filter((leader): leader is Leader => Boolean(leader))
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
      for (const leader of leaderForContributor(contrib)) {
        if (!seen.has(leader.id)) {
          related.push(leader)
          seen.add(leader.id)
        }
      }
    }
  }
  return related
}
