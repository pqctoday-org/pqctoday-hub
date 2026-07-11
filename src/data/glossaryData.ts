// SPDX-License-Identifier: GPL-3.0-only
import type { GlossaryTerm } from './glossary/types'
import algorithms from './glossary/algorithms.json'
import protocols from './glossary/protocols.json'
import standards from './glossary/standards.json'
import concepts from './glossary/concepts.json'
import organizations from './glossary/organizations.json'

export type { GlossaryTerm }

/**
 * Uniqueness guard: term names must be unique (case-insensitive) across all
 * five category files. Duplicates shipped conflicting definitions in the past
 * (e.g. three different CBOM entries), so any duplicate is dropped here
 * (first occurrence wins, in category-file order) and reported via
 * console.error — matching the soft-fail error idiom of the other data
 * loaders (csvUtils.ts, timelineData.ts).
 */
function dedupeTerms(terms: GlossaryTerm[]): GlossaryTerm[] {
  const seen = new Set<string>()
  const unique: GlossaryTerm[] = []
  for (const t of terms) {
    const key = t.term.trim().toLowerCase()
    if (seen.has(key)) {
      console.error(
        `[glossaryData] Duplicate glossary term "${t.term}" (category: ${t.category}) — ` +
          'dropping this entry; term names must be unique across the glossary JSON files.'
      )
      continue
    }
    seen.add(key)
    unique.push(t)
  }
  return unique
}

export const glossaryTerms: GlossaryTerm[] = dedupeTerms([
  ...(algorithms as unknown as GlossaryTerm[]),
  ...(protocols as unknown as GlossaryTerm[]),
  ...(standards as unknown as GlossaryTerm[]),
  ...(concepts as unknown as GlossaryTerm[]),
  ...(organizations as unknown as GlossaryTerm[]),
])
