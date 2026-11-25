// SPDX-License-Identifier: AGPL-3.0-only
/** NICE lesson mappings are generated from the canonical Learn modules CSV. */
import { LEARN_MODULES } from './generated/learnModules.generated'
import type {
  NiceCompetencyAreaId,
  NiceProficiencyTier,
  NiceWorkRoleId,
  NfComId,
  NfCompetencyArea,
} from './niceFramework'
import { getOfficialCompetencyAreas, NF_COMPETENCY_AREAS } from './niceFramework'

export interface NiceModuleRef {
  moduleId: string
  competencyAreas: NiceCompetencyAreaId[]
  tier: NiceProficiencyTier
  workRoles: NiceWorkRoleId[]
  isCommonGround: boolean
  nfExtra?: NfComId[]
}
export const NICE_MODULE_MAP: NiceModuleRef[] = LEARN_MODULES.filter((row) => row.niceTier)
  .sort((a, b) => (a.niceOrder ?? 0) - (b.niceOrder ?? 0))
  .map((row) => ({
    moduleId: row.id,
    competencyAreas: [...row.niceCompetencyAreas],
    tier: row.niceTier!,
    workRoles: [...row.niceWorkRoles],
    isCommonGround: row.isCommonGround ?? false,
    ...(row.niceOfficialAreasExtra.length ? { nfExtra: [...row.niceOfficialAreasExtra] } : {}),
  }))
const byModuleId = new Map(NICE_MODULE_MAP.map((entry) => [entry.moduleId, entry]))
export function getNiceMapping(moduleId: string): NiceModuleRef | undefined {
  return byModuleId.get(moduleId)
}
export function getModuleOfficialAreas(ref: NiceModuleRef): NfCompetencyArea[] {
  const out = getOfficialCompetencyAreas(ref.competencyAreas)
  const seen = new Set<NfComId>(out.map((area) => area.id))
  for (const id of ref.nfExtra ?? [])
    if (!seen.has(id)) {
      seen.add(id)
      out.push(NF_COMPETENCY_AREAS[id])
    }
  return out
}
export function getModulesForCompetencyArea(caId: NiceCompetencyAreaId): NiceModuleRef[] {
  return NICE_MODULE_MAP.filter((row) => row.competencyAreas.includes(caId))
}
export function getModulesAtTier(tier: NiceProficiencyTier): NiceModuleRef[] {
  const order: NiceProficiencyTier[] = ['awareness', 'practitioner', 'expert']
  return NICE_MODULE_MAP.filter((row) => order.indexOf(row.tier) >= order.indexOf(tier))
}
export function getCommonGroundModules(): NiceModuleRef[] {
  return NICE_MODULE_MAP.filter((row) => row.isCommonGround)
}
export function getCompetencyAreaCoverage(moduleIds: string[]): NiceCompetencyAreaId[] {
  const ids = new Set<NiceCompetencyAreaId>()
  for (const id of moduleIds) byModuleId.get(id)?.competencyAreas.forEach((area) => ids.add(area))
  return [...ids]
}
