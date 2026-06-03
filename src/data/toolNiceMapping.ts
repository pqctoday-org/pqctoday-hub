// SPDX-License-Identifier: GPL-3.0-only
/**
 * Bridges WORKSHOP_TOOLS to NICE Framework metadata.
 *
 * Two sources feed this:
 *   1. Learn-module tools (most playground tools): tool.moduleLink → moduleId
 *      → getNiceMapping(moduleId) from niceModuleMapping.ts
 *   2. Sandbox tools (id prefix 'sbx-'): strip prefix → getSandboxNiceMapping()
 *      from sandboxNiceMapping.ts
 *
 * Tools without a NICE mapping under either source are returned as undefined
 * and won't appear in NICE-view buckets.
 */
import type { NiceCompetencyAreaId, NiceProficiencyTier, NiceWorkRoleId } from './niceFramework'
import { getNiceMapping } from './niceModuleMapping'
import { getSandboxNiceMapping } from './sandboxNiceMapping'
import type { WorkshopTool } from '@/components/Playground/workshopRegistry'
import { SANDBOX_TOOL_PREFIX } from '@/components/Playground/workshopRegistry'

export interface ToolNiceRef {
  toolId: string
  competencyAreas: NiceCompetencyAreaId[]
  tier: NiceProficiencyTier
  workRoles: NiceWorkRoleId[]
}

/**
 * Extract the moduleId from a tool's moduleLink (e.g. '/learn/slh-dsa' → 'slh-dsa',
 * '/learn/hybrid-crypto?tab=workshop&step=5' → 'hybrid-crypto').
 * Returns null when moduleLink is empty or points outside /learn/.
 */
function extractLearnModuleId(moduleLink: string): string | null {
  if (!moduleLink.startsWith('/learn/')) return null
  const rest = moduleLink.slice('/learn/'.length)
  const idEnd = rest.search(/[/?#]/)
  return idEnd === -1 ? rest : rest.slice(0, idEnd)
}

/**
 * Resolve a workshop tool to its NICE metadata. Returns undefined when no
 * mapping exists (the tool will be excluded from NICE-view buckets).
 */
export function getToolNiceMapping(tool: WorkshopTool): ToolNiceRef | undefined {
  // Sandbox path
  if (tool.id.startsWith(SANDBOX_TOOL_PREFIX)) {
    const scenarioId = tool.id.slice(SANDBOX_TOOL_PREFIX.length)
    const sbx = getSandboxNiceMapping(scenarioId)
    if (!sbx) return undefined
    return {
      toolId: tool.id,
      competencyAreas: sbx.competencyAreas,
      tier: sbx.tier,
      workRoles: sbx.workRoles,
    }
  }

  // Learn-module path
  const moduleId = extractLearnModuleId(tool.moduleLink)
  if (!moduleId) return undefined
  const mod = getNiceMapping(moduleId)
  if (!mod) return undefined
  return {
    toolId: tool.id,
    competencyAreas: mod.competencyAreas,
    tier: mod.tier,
    workRoles: mod.workRoles,
  }
}

/**
 * Return all tools tagged for a given competency area, preserving the order in
 * which tools appear in the input array. A tool whose primary CA is `caId`
 * (first in its competencyAreas list) sorts before one whose primary CA is
 * elsewhere — mirrors the "borrowed CA" dimming pattern in NiceView for Learn.
 */
export function getToolsForCompetencyArea(
  caId: NiceCompetencyAreaId,
  tools: WorkshopTool[]
): { tool: WorkshopTool; ref: ToolNiceRef; isPrimary: boolean }[] {
  const out: { tool: WorkshopTool; ref: ToolNiceRef; isPrimary: boolean }[] = []
  for (const tool of tools) {
    const ref = getToolNiceMapping(tool)
    if (!ref) continue
    if (!ref.competencyAreas.includes(caId)) continue
    out.push({ tool, ref, isPrimary: ref.competencyAreas[0] === caId })
  }
  // Primary CA first, but preserve input order otherwise.
  return out.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
}
