// SPDX-License-Identifier: GPL-3.0-only
// @reviewed 2026-09-01 by eram2207usa — full read + cross-check; removed 2
// unconsumed exports (LIBRARY_PERSONA_SENTENCE, LIBRARY_NO_PERSONA_SENTENCE)
// and corrected a header comment that overclaimed what's actually rendered
/**
 * Library redesign — per-persona presentation config for the Role Lens.
 *
 * The Role Lens (`/library` redesign) shapes the page for the active persona:
 * it seeds the default sort (`libraryDefaultSortForPersona`, consulted at
 * `LibraryViewRedesign.tsx` when the URL carries no `?sort=`) and, via
 * `PERSONA_LIBRARY_CATEGORIES` in `personaConfig.ts`, the category emphasis +
 * soft narrow. Persona itself lives in `usePersonaStore`.
 */
import type { PersonaId } from './learningPersonas'
import type { SortOption } from '@/components/Library/SortControl'

/** Display order of the six personas in the Role Lens segmented control. */
export const LIBRARY_PERSONAS: { id: PersonaId; label: string }[] = [
  { id: 'executive', label: 'Executive' },
  { id: 'developer', label: 'Developer' },
  { id: 'architect', label: 'Architect' },
  { id: 'researcher', label: 'Researcher' },
  { id: 'ops', label: 'Ops' },
  { id: 'curious', label: 'Curious' },
]

/** Persona-aware default sort. Explicit `?sort=` always wins; this only seeds
 * the initial value when the URL is silent (still live — see the header
 * comment above).
 *
 * Every persona currently maps to the same value, `'published'`: a reader
 * asking "what is newest here" means the document's own publication date,
 * not the catalog's activity date or a reference-ID ordering. The per-persona
 * keys are kept (rather than collapsing to one constant) so a future editorial
 * decision to differentiate again doesn't have to rebuild this shape. */
export const LIBRARY_DEFAULT_SORT_BY_PERSONA: Record<PersonaId, SortOption> = {
  executive: 'published',
  developer: 'published',
  architect: 'published',
  researcher: 'published',
  ops: 'published',
  curious: 'published',
}

export function libraryDefaultSortForPersona(persona: PersonaId | null | undefined): SortOption {
  if (!persona) return 'published'
  return LIBRARY_DEFAULT_SORT_BY_PERSONA[persona] ?? 'published' // eslint-disable-line security/detect-object-injection
}
