// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 1.3 (2026-09-19) — every tool a role can reach from its own
 * board. The six question-variant boards carry three to six curated cards
 * each, and the coverage contract (every role reaches every section) made
 * every card a role's only route to a section, so a tool with no card had no
 * board at all. This row sits under the board's track strip and lists the
 * role's tools from the registries themselves:
 *   playground — tools whose `recommendedPersonas` name the role, Start-here
 *                picks first, then registry order;
 *   business   — the role's recommended sequence first (businessRoleConfig),
 *                then every tool whose audience is the role's.
 * roleTools.test.ts pins that the seven rows together reach every live tool.
 */
import { WORKSHOP_TOOLS, type WorkshopTool } from '@/components/Playground/workshopRegistry'
import {
  BUSINESS_TOOLS,
  type BusinessTool,
  type BusinessToolAudience,
} from '@/components/BusinessCenter/businessToolsRegistry'
import { getBusinessRoleSequence } from '@/data/businessRoleConfig'
import type { PersonaId } from '@/data/personaIds'

export interface RoleTools {
  playground: WorkshopTool[]
  business: BusinessTool[]
}

const AUDIENCE_FOR_ROLE: Record<PersonaId, BusinessToolAudience | null> = {
  executive: 'business',
  grc: 'business',
  architect: 'architect',
  developer: 'developer',
  ops: null,
  researcher: null,
  curious: null,
}

export function toolsForRole(persona: PersonaId): RoleTools {
  const live = WORKSHOP_TOOLS.filter((t) => !t.sandbox && !t.wip)
  const mine = live.filter((t) => t.recommendedPersonas.includes(persona))
  const playground = [
    ...mine.filter((t) => t.startHere?.includes(persona)),
    ...mine.filter((t) => !t.startHere?.includes(persona)),
  ]
  const seq = getBusinessRoleSequence(persona)
    .steps.map((s) => BUSINESS_TOOLS.find((t) => t.id === s.id))
    .filter((t): t is BusinessTool => Boolean(t))
  // eslint-disable-next-line security/detect-object-injection -- persona is the typed PersonaId union
  const audience = AUDIENCE_FOR_ROLE[persona]
  const byAudience = audience
    ? BUSINESS_TOOLS.filter((t) => (t.audience ?? 'business') === audience)
    : []
  const seen = new Set<string>()
  const business = [...seq, ...byAudience].filter((t) =>
    seen.has(t.id) ? false : (seen.add(t.id), true)
  )
  return { playground, business }
}
