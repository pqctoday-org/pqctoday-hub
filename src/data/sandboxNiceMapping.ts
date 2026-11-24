// SPDX-License-Identifier: AGPL-3.0-only
/**
 * NICE Framework metadata of the sandbox scenarios, read from the tools data
 * file (`src/data/tools_*.csv`, rows `sbx-<scenario id>`, through
 * `tools.generated.ts`). Mirrors src/data/niceModuleMapping.ts but for sandbox
 * tools, which have no corresponding Learn moduleId.
 *
 * The per-track defaults, per-scenario overrides and the difficulty-to-tier
 * table that used to live here are gone: each scenario's tier, competency areas
 * and work roles are columns of its row, in the order a reader sees them
 * (primary competency area first).
 */
import type { NiceCompetencyAreaId, NiceProficiencyTier, NiceWorkRoleId } from './niceFramework'
import { SANDBOX_SCENARIOS } from './sandboxScenarios'
import { SANDBOX_TOOL_RECORDS } from './generated/tools.generated'

export interface SandboxNiceRef {
  scenarioId: string
  competencyAreas: NiceCompetencyAreaId[]
  tier: NiceProficiencyTier
  workRoles: NiceWorkRoleId[]
}

const SANDBOX_ID_PREFIX = 'sbx-'

// Built lazily on first access. Module-top-level `.map()` on the imported
// SANDBOX_SCENARIOS array crashes in production when Vite's code-splitter
// places this module in a chunk that evaluates before sandboxScenarios.ts —
// the import binding is `undefined` at that point, and `.map()` throws.
let _cachedMap: SandboxNiceRef[] | null = null
let _byScenarioId: Map<string, SandboxNiceRef> | null = null

function buildMaps(): Map<string, SandboxNiceRef> {
  if (_byScenarioId !== null) return _byScenarioId
  const recordById = new Map(SANDBOX_TOOL_RECORDS.map((record) => [record.toolId, record]))
  _cachedMap = SANDBOX_SCENARIOS.flatMap((scenario) => {
    const record = recordById.get(`${SANDBOX_ID_PREFIX}${scenario.id}`)
    if (!record?.niceTier) return []
    return [
      {
        scenarioId: scenario.id,
        competencyAreas: [...record.niceCompetencyAreas],
        tier: record.niceTier,
        workRoles: [...record.niceWorkRoles],
      },
    ]
  })
  _byScenarioId = new Map(_cachedMap.map((r) => [r.scenarioId, r]))
  return _byScenarioId
}

export function getSandboxNiceMap(): SandboxNiceRef[] {
  if (_cachedMap === null) buildMaps()
  return _cachedMap as SandboxNiceRef[]
}

export function getSandboxNiceMapping(scenarioId: string): SandboxNiceRef | undefined {
  return buildMaps().get(scenarioId)
}
