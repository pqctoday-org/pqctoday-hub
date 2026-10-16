// SPDX-License-Identifier: GPL-3.0-only
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'

/**
 * Roles whose board still carries track_chip rows past their Essentials while
 * a retirement waits in the data lane. Curious: Essentials were cut from six
 * modules to three (owner decision C2, 16 Oct 2026); chips 3–5 are retired
 * through the data flow's retirement lane, not by hand.
 *
 * Self-expiring: personaConfig.test fails once a listed role's board has no
 * extra chips, so this entry is deleted with the data that makes it moot.
 */
export const PENDING_CHIP_RETIREMENT: ReadonlySet<PersonaId> = new Set<PersonaId>(['curious'])

/**
 * The chips a board renders: one per Essentials module, in order, each linking
 * to that module. Extra chips (only possible for a role listed above) are not
 * shown, because they would link to no module.
 */
export function essentialsTrackChips(persona: PersonaId, chips: readonly string[]): string[] {
  // eslint-disable-next-line security/detect-object-injection -- persona is the typed PersonaId union
  return chips.slice(0, PERSONAS[persona].essentials.length)
}
