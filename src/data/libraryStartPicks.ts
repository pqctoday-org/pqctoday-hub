// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Start here" picks for the Library redesign — three curated entry documents
 * per persona, always present above the grid.
 *
 * Curious / Executive / Ops reuse their existing hand-curated pick sets. The
 * three personas that never had a curated set (Developer, Architect, Researcher)
 * are DERIVED from their PERSONA_LIBRARY_CATEGORIES focus areas — top documents
 * by citations then recency — so every reference id is guaranteed to resolve to a
 * real LibraryItem. Swap a derived set for a hand-curated file later if desired.
 */
import { libraryData } from './libraryData'
import { PERSONA_LIBRARY_CATEGORIES } from './personaConfig'
import { LIBRARY_CURIOUS_PICKS, type LibraryCuriousPick } from './libraryCuriousPicks'
import { LIBRARY_EXECUTIVE_PICKS } from './libraryExecutivePicks'
import { LIBRARY_OPS_PICKS } from './libraryOpsPicks'
import type { PersonaId } from './learningPersonas'

export type LibraryStartPick = LibraryCuriousPick

const CURATED: Partial<Record<PersonaId, readonly LibraryStartPick[]>> = {
  curious: LIBRARY_CURIOUS_PICKS,
  executive: LIBRARY_EXECUTIVE_PICKS,
  ops: LIBRARY_OPS_PICKS,
}

function derivePicks(persona: PersonaId): LibraryStartPick[] {
  // eslint-disable-next-line security/detect-object-injection -- persona is a typed enum key
  const cats = PERSONA_LIBRARY_CATEGORIES[persona] ?? []
  const pool =
    cats.length > 0
      ? libraryData.filter((i) => i.categories?.some((c) => cats.includes(c)))
      : [...libraryData]
  return pool
    .slice()
    .sort((a, b) => {
      const ac = a.citationCount ?? 0
      const bc = b.citationCount ?? 0
      if (bc !== ac) return bc - ac
      return new Date(b.lastUpdateDate).getTime() - new Date(a.lastUpdateDate).getTime()
    })
    .slice(0, 3)
    .map((i) => ({
      referenceId: i.referenceId,
      label: `${i.referenceId} — ${i.documentTitle}`,
      blurb:
        i.shortDescription && i.shortDescription.length > 130
          ? `${i.shortDescription.slice(0, 127)}…`
          : (i.shortDescription ?? ''),
    }))
}

const DERIVED_CACHE = new Map<PersonaId, LibraryStartPick[]>()

/** Three "Start here" picks for the active persona (or null when no persona). */
export function getLibraryStartPicks(persona: PersonaId | null): LibraryStartPick[] {
  if (!persona) return []
  // eslint-disable-next-line security/detect-object-injection -- persona is a typed enum key
  const curated = CURATED[persona]
  if (curated) return curated.slice(0, 3)
  if (!DERIVED_CACHE.has(persona)) DERIVED_CACHE.set(persona, derivePicks(persona))
  return DERIVED_CACHE.get(persona) ?? []
}
