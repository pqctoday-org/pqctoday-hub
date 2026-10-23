// SPDX-License-Identifier: AGPL-3.0-only
import type { PersonaId } from '@/data/learningPersonas'

export type PqcTestingLearnPathId = 'network-practitioner' | 'certification-engineer'

/** A certification engineer needs this module only for the side-channel (TVLA) and
 *  FIPS 140-3 / ACVP parts; everyone else follows the whole network-testing path. */
export function defaultPqcTestingLearnPath(
  persona: PersonaId | null
): PqcTestingLearnPathId | null {
  if (!persona) return null
  return persona === 'cert-engineer' ? 'certification-engineer' : 'network-practitioner'
}
