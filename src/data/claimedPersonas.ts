// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — which personas an item CLAIMS, from the
 * registries: a playground tool's `recommendedPersonas`; a business tool's
 * audience ('business' = executive and GRC, else the named role); a module's
 * membership in a persona's recommended path. The persona-fit clause of the
 * 90 band is measured against this set (decision 3: claimed personas only).
 */
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { PERSONAS } from '@/data/learningPersonas'
import { PERSONA_IDS, type PersonaId } from '@/data/personaIds'

export function claimedPersonasFor(route: string): PersonaId[] {
  if (route.startsWith('/playground/')) {
    const id = route.slice('/playground/'.length)
    return WORKSHOP_TOOLS.find((t) => t.id === id)?.recommendedPersonas ?? []
  }
  if (route.startsWith('/business/tools/')) {
    const id = route.slice('/business/tools/'.length)
    const t = BUSINESS_TOOLS.find((t) => t.id === id)
    if (!t) return []
    const audience = t.audience ?? 'business'
    return audience === 'business' ? ['executive', 'grc'] : [audience]
  }
  if (route.startsWith('/learn/')) {
    const id = route.slice('/learn/'.length)
    // eslint-disable-next-line security/detect-object-injection -- PersonaId from the typed union
    return PERSONA_IDS.filter((p) => PERSONAS[p].recommendedPath.includes(id))
  }
  return []
}
