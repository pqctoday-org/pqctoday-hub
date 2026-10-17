// SPDX-License-Identifier: AGPL-3.0-only
import type { PersonaId } from '@/data/learningPersonas'

export type EntropyLearnPathId = 'general-practitioner' | 'certification-engineer'

export function defaultEntropyLearnPath(persona: PersonaId | null): EntropyLearnPathId | null {
  if (!persona) return null
  return persona === 'cert-engineer' ? 'certification-engineer' : 'general-practitioner'
}
