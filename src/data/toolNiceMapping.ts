// SPDX-License-Identifier: AGPL-3.0-only
// @reviewed 2026-09-01 by eram2207usa — full read; every real WORKSHOP_TOOLS
// moduleLink traced and confirmed to resolve in NICE_MODULE_MAP; no defects found
/**
 * Bridges WORKSHOP_TOOLS to NICE Framework metadata.
 *
 * A Playground tool that belongs to a lesson takes its tier, competency areas
 * and work roles from that lesson: `tools.generated.ts` reads them from the
 * lessons file, so they are not repeated in the tool's own row. A tool with no
 * lesson (and every sandbox scenario) keeps its own columns in the tools data
 * file (`src/data/tools_*.csv`). A tool whose record names no tier is returned
 * as undefined and won't appear in NICE-view buckets.
 */
import type { NiceCompetencyAreaId, NiceProficiencyTier, NiceWorkRoleId } from './niceFramework'
import { TOOL_RECORD_BY_ID } from './generated/tools.generated'
import type { WorkshopTool } from '@/components/Playground/workshopRegistry'

export interface ToolNiceRef {
  toolId: string
  competencyAreas: NiceCompetencyAreaId[]
  tier: NiceProficiencyTier
  workRoles: NiceWorkRoleId[]
}

/**
 * Resolve a workshop tool to its NICE metadata. Returns undefined when its row
 * names no tier (the tool will be excluded from NICE-view buckets).
 */
export function getToolNiceMapping(tool: WorkshopTool): ToolNiceRef | undefined {
  const record = TOOL_RECORD_BY_ID[tool.id]
  if (!record || record.kind === 'business' || !record.niceTier) return undefined
  return {
    toolId: tool.id,
    competencyAreas: [...record.niceCompetencyAreas],
    tier: record.niceTier,
    workRoles: [...record.niceWorkRoles],
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
