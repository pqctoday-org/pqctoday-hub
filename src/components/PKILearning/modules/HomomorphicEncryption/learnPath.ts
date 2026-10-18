// SPDX-License-Identifier: AGPL-3.0-only
import type { PersonaId } from '@/data/personaIds'

export type FheLearnPathId = 'fhe-foundations' | 'hsm-custody'

export const FHE_ADVANCED_PERSONAS: readonly PersonaId[] = [
  'developer',
  'architect',
  'researcher',
  'cert-engineer',
  'ops',
]

export function canUseFheAdvancedPath(persona: PersonaId | null): boolean {
  return persona !== null && FHE_ADVANCED_PERSONAS.includes(persona)
}

export function defaultFheLearnPath(persona: PersonaId | null): FheLearnPathId {
  return persona === 'cert-engineer' ? 'hsm-custody' : 'fhe-foundations'
}
