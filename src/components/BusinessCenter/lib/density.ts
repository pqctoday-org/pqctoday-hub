// SPDX-License-Identifier: GPL-3.0-only
/**
 * Command Center density derivation.
 *
 * pqctoday is an educational platform: the Command Center is a worked example
 * of what a real PQC program contains. New learners are overwhelmed by the
 * full density (CSWP-tier badges, §-refs, sub-element groupings, per-zone
 * wires); experienced visitors expect them.
 *
 * Density is derived from the existing `usePersonaStore` (no new store):
 *   - `executive` / `curious`           → 'basic'
 *   - `ops` / `architect`               → 'intermediate'
 *   - `developer` / `researcher` / null → 'advanced'
 *
 * `experienceLevel` (curious / basics / expert) overrides the persona default
 * when set: curious → basic, basics → intermediate, expert → advanced.
 */
import type { PersonaId } from '@/data/learningPersonas'
import type { ExperienceLevel } from '@/store/usePersonaStore'

export type Density = 'basic' | 'intermediate' | 'advanced'

const PERSONA_DEFAULT_DENSITY: Record<PersonaId, Density> = {
  executive: 'basic',
  curious: 'basic',
  ops: 'intermediate',
  architect: 'intermediate',
  developer: 'advanced',
  researcher: 'advanced',
}

const EXPERIENCE_DENSITY: Record<ExperienceLevel, Density> = {
  curious: 'basic',
  basics: 'intermediate',
  expert: 'advanced',
}

export function deriveDensity(
  persona: PersonaId | null,
  experienceLevel: ExperienceLevel | null = null
): Density {
  if (experienceLevel) return EXPERIENCE_DENSITY[experienceLevel]
  if (!persona) return 'advanced'
  // eslint-disable-next-line security/detect-object-injection
  return PERSONA_DEFAULT_DENSITY[persona] ?? 'advanced'
}

/** True if the page should show CSWP-tier badges, §-refs, etc. */
export function showAdvancedZoneMetadata(d: Density): boolean {
  return d !== 'basic'
}

/** True if zone panels should sub-group artifacts by zone sub-element. */
export function showSubElementGroups(d: Density): boolean {
  return d === 'advanced'
}

/** True if per-zone data wires (GovernanceWire, AssetsWire, …) should render. */
export function showZoneWires(d: Density): boolean {
  return d !== 'basic'
}

/** True if the §3-§6 document-section accordion should render at the top. */
export function showSectionsNav(d: Density): boolean {
  return d === 'advanced'
}

/** True if the filter + export-ZIP toolbar should render at the top. */
export function showTopToolbar(d: Density): boolean {
  return d === 'advanced'
}

/** Cap of action items shown above the fold (the rest are revealed via "show more"). */
export function actionItemCap(d: Density): number {
  return d === 'basic' ? 3 : d === 'intermediate' ? 4 : 5
}

/** When density is basic, only this zone is expanded by default; the rest are
 *  one-line collapsed teasers. Other densities use persona emphasis. */
export const BASIC_DENSITY_DEFAULT_ZONE = 'assets' as const
