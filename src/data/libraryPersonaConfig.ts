// SPDX-License-Identifier: GPL-3.0-only
/**
 * Library redesign — per-persona presentation config for the Role Lens.
 *
 * The Role Lens (`/library` redesign) is the single source of truth that shapes
 * the page for the active persona: it seeds the default sort, the "what this
 * means for you" sentence, and (via PERSONA_LIBRARY_CATEGORIES in personaConfig)
 * the category emphasis + soft narrow. Persona itself lives in `usePersonaStore`.
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
 *  the initial value when the URL is silent. Mirrors the live LibraryView map. */
export const LIBRARY_DEFAULT_SORT_BY_PERSONA: Record<PersonaId, SortOption> = {
  executive: 'newest',
  developer: 'referenceId',
  architect: 'urgency',
  researcher: 'mostCited',
  ops: 'urgency',
  curious: 'newest',
}

export function libraryDefaultSortForPersona(persona: PersonaId | null | undefined): SortOption {
  if (!persona) return 'newest'
  return LIBRARY_DEFAULT_SORT_BY_PERSONA[persona] ?? 'newest' // eslint-disable-line security/detect-object-injection
}

/** One-line "what this means for you" sentence shown under the Role Lens. */
export const LIBRARY_PERSONA_SENTENCE: Record<PersonaId, string> = {
  executive:
    'Standards and policy guidance that frame the business case and deadlines for your PQC program — newest first.',
  developer:
    "Algorithm specs, protocol RFCs and drafts you'll build against — ordered by reference ID.",
  architect:
    'Migration-critical standards plus certificate and protocol guidance — ordered by urgency.',
  researcher: 'The full corpus, ranked by how often each document is cited — nothing narrowed out.',
  ops: 'The certification-relevant set — FIPS, CMVP and the standards that govern validations.',
  curious: 'A gentle starting set — the headline standards and migration guidance, newest first.',
}

/** Sentence shown when no persona is selected. */
export const LIBRARY_NO_PERSONA_SENTENCE =
  'Pick a role to tailor the library — picks, sort order and emphasis adapt to how you use these documents.'
