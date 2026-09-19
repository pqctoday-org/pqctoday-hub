// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — the "Related on this site" links a role
 * board variant carries. Every variant already declares `moduleIds`,
 * `workshopIds` and `businessToolIds` (validated against the role's path and
 * the registries), but only the workshops were rendered; the modules and
 * Command Center tools were metadata no visitor could reach. This resolves
 * all three to titles and routes in one place for the desktop board and the
 * phone board.
 */
import type { RoleBoardVariant } from '@/data/personaConfig'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

export interface BoardRelatedLink {
  to: string
  name: string
  kind: 'module' | 'workshop' | 'business'
}

const WORKSHOP_NAME: Record<string, string> = Object.fromEntries(
  WORKSHOP_TOOLS.map((w) => [w.id, w.name])
)
const BUSINESS_NAME: Record<string, string> = Object.fromEntries(
  BUSINESS_TOOLS.map((t) => [t.id, t.name])
)

export function boardRelatedLinks(
  variant: Pick<RoleBoardVariant, 'moduleIds' | 'workshopIds' | 'businessToolIds'>
): BoardRelatedLink[] {
  const out: BoardRelatedLink[] = []
  for (const id of variant.moduleIds) {
    // eslint-disable-next-line security/detect-object-injection -- id is CSV-derived repo data validated at generation time
    const m = MODULE_CATALOG[id]
    if (m) out.push({ to: `/learn/${id}`, name: m.title, kind: 'module' })
  }
  for (const id of variant.workshopIds) {
    // eslint-disable-next-line security/detect-object-injection -- id is CSV-derived repo data validated at generation time
    const name = WORKSHOP_NAME[id]
    if (name) out.push({ to: `/playground/${id}`, name, kind: 'workshop' })
  }
  for (const id of variant.businessToolIds) {
    // eslint-disable-next-line security/detect-object-injection -- id is CSV-derived repo data validated at generation time
    const name = BUSINESS_NAME[id]
    if (name) out.push({ to: `/business/tools/${id}`, name, kind: 'business' })
  }
  return out
}
