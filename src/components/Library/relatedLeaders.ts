// SPDX-License-Identifier: GPL-3.0-only
/**
 * Community leaders related to a library document — shared by the detail
 * drawer and the legacy LibraryDetailPopover (Compliance still hosts it), so
 * both list the same people.
 */
import type { LibraryItem } from '@/data/libraryData'
import { leadersData, type Leader } from '@/data/leadersData'
import { libraryEnrichments } from '@/data/libraryEnrichmentData'

/** Strip parenthetical annotations and honorific prefixes, then lowercase. */
function normalizeLeaderName(raw: string): string {
  return raw
    .replace(/\s*\(.*?\)/g, '')
    .replace(/^(Dr\.|Prof\.|Dr |Prof )\s*/i, '')
    .trim()
    .toLowerCase()
}

/** Built once at module load: normalized name → Leader. */
const leaderByNormalizedName = new Map(leadersData.map((l) => [normalizeLeaderName(l.name), l]))

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
      const leader = leaderByNormalizedName.get(normalizeLeaderName(contrib))
      if (leader && !seen.has(leader.id)) {
        related.push(leader)
        seen.add(leader.id)
      }
    }
  }
  return related
}
