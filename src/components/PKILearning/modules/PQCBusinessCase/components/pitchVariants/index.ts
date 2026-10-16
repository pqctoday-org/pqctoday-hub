// SPDX-License-Identifier: AGPL-3.0-only
import type { PersonaId } from '@/data/learningPersonas'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { PitchVariant } from './types'
import { buildExecutiveVariant } from './executive'
import { buildDeveloperVariant } from './developer'
import { buildArchitectVariant } from './architect'
import { buildOpsVariant } from './ops'

/** Personas with a dedicated pitch variant. Other personas (grc, researcher, curious, null) fall back to executive framing — see PersonaPitchBanner.test.tsx's "treats researcher and curious personas as unsupported" case, which this joins rather than a split-caused regression. */
export const SUPPORTED_PITCH_PERSONAS: PersonaId[] = ['executive', 'developer', 'architect', 'ops']

export function isSupportedPitchPersona(persona: PersonaId | null): boolean {
  return persona !== null && SUPPORTED_PITCH_PERSONAS.includes(persona)
}

export function getPitchVariant(
  persona: PersonaId | null,
  data: ExecutiveModuleData
): PitchVariant {
  switch (persona) {
    case 'developer':
      return buildDeveloperVariant(data)
    case 'architect':
      return buildArchitectVariant(data)
    case 'ops':
      return buildOpsVariant(data)
    case 'executive':
    default:
      return buildExecutiveVariant(data)
  }
}

export type { PitchVariant, FormData } from './types'
