// SPDX-License-Identifier: GPL-3.0-only
/**
 * industryMatch — sector-key join between a user's industry (Assess /
 * persona vocabulary, e.g. 'Finance & Banking') and a data row's industry
 * label (threats CSV, e.g. 'Financial Services / Banking'; compliance
 * `industries` display text).
 *
 * WHY (vendor-risk remediation, 2026-08-27): these joins used to be raw
 * substring tests — `t.industry.includes(assessIndustry)` — across three
 * uncoordinated vocabularies. 'Finance & Banking' is not a substring of
 * 'Financial Services / Banking', so a finance user matched ZERO threats and
 * the Supply Chain Risk Matrix rendered an empty Impact axis for most
 * industries. Both spellings are registered aliases of sector 52 in the
 * sector vocabulary registry (sector_vocabulary_*.csv), so resolving each
 * side to its NAICS sector-key set and intersecting fixes the class, not the
 * instance — and keeps working unchanged when the CSV strings are later
 * normalized, because canonical names are aliases too.
 *
 * Cross-Industry rows: 'Cross-Industry' is not a sector; those threats apply
 * to everyone. Under the old substring test they matched NOBODY (no user
 * industry contains 'Cross-Industry'), silently dropping 25 threats from
 * every personalized view.
 */
import { resolveToNaicsSet } from './sectorVocabularyData'

/**
 * Sector keys for a freeform industry string, or null when the vocabulary
 * doesn't know it. resolveToNaicsSet returns `[value]` verbatim for unknown
 * tokens (so unresolved URL params still surface in filter UIs); callers
 * here need to distinguish that echo from a real resolution.
 */
export function sectorKeysFor(industry: string): string[] | null {
  const trimmed = (industry || '').trim()
  if (!trimmed) return null
  const keys = resolveToNaicsSet(trimmed)
  if (keys.length === 0) return null
  if (keys.length === 1 && keys[0] === trimmed) return null // unknown-token echo
  return keys
}

/** Cross-industry rows ('Cross-Industry', 'Cross-Industry / HSM') apply to every industry. */
export function isCrossIndustry(rowIndustry: string): boolean {
  return (rowIndustry || '').trim().toLowerCase().startsWith('cross-industry')
}

/**
 * Does a data row tagged `rowIndustry` apply to a user whose industry is
 * `userIndustry`? Sector-key intersection when both sides resolve through the
 * vocabulary; the legacy substring test as a fallback when either side is
 * unknown, so an unregistered spelling degrades to the old behavior instead
 * of matching nothing.
 */
export function matchesIndustry(rowIndustry: string, userIndustry: string): boolean {
  const user = (userIndustry || '').trim()
  if (!user) return false
  if (isCrossIndustry(rowIndustry)) return true
  const rowKeys = sectorKeysFor(rowIndustry)
  const userKeys = sectorKeysFor(user)
  if (rowKeys && userKeys) {
    const userSet = new Set(userKeys)
    return rowKeys.some((k) => userSet.has(k))
  }
  return (rowIndustry || '').toLowerCase().includes(user.toLowerCase())
}
