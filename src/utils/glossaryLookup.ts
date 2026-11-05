// SPDX-License-Identifier: AGPL-3.0-only
import type { GlossaryTerm } from '@/data/glossary/types'

/**
 * Preserve exact canonical names before considering acronym aliases. An alias
 * without its own canonical entry is usable only when it names one distinct
 * canonical term. This resolves identity, not the intended domain of prose;
 * it does not merge, rank or review duplicate canonical definitions.
 */
export function buildGlossaryLookup(terms: readonly GlossaryTerm[]): Map<string, GlossaryTerm> {
  const canonical = new Map(terms.map((term) => [term.term.toLowerCase(), term]))
  const aliasOwners = new Map<string, Set<string>>()
  for (const term of terms) {
    if (!term.acronym) continue
    const alias = term.acronym.toLowerCase()
    if (canonical.has(alias)) continue
    const owners = aliasOwners.get(alias) ?? new Set<string>()
    owners.add(term.term.toLowerCase())
    aliasOwners.set(alias, owners)
  }
  const lookup = new Map(canonical)
  for (const [alias, owners] of aliasOwners) {
    if (owners.size !== 1) continue
    const owner = owners.values().next().value
    const entry = owner === undefined ? undefined : canonical.get(owner)
    if (entry) lookup.set(alias, entry)
  }
  return lookup
}
