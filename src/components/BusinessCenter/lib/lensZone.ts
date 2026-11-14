// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The zone the Command Center opens for a visitor, by role.
 *
 * A role that has its own lens (see BC_ZONE_EMPHASIS_BY_PERSONA) opens that
 * lens's zone, at any density. Curious, and a visitor with no role picked,
 * have no lens and open the no-lens default zone.
 */
import type { PersonaId } from '@/data/personaIds'
import { BC_ZONE_EMPHASIS_BY_PERSONA } from '@/data/personaConfig'
import type { ZoneId } from '@/data/cswp39ZoneData'
import { BASIC_DENSITY_DEFAULT_ZONE } from './density'

export function defaultOpenZoneFor(persona: PersonaId | null): ZoneId {
  const lens = persona ? BC_ZONE_EMPHASIS_BY_PERSONA[persona] : undefined
  return lens ? lens.defaultActiveZone : BASIC_DENSITY_DEFAULT_ZONE
}
