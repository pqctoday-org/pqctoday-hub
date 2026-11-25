// SPDX-License-Identifier: AGPL-3.0-only
import { LEARN_MODULES } from '@/data/generated/learnModules.generated'
import { NICE_COMPETENCY_AREAS, type NiceCompetencyAreaId } from '@/data/niceFramework'

/**
 * The two facets a Learn address can name besides the track: `?stage=<1 to 5>` (a stage of the
 * learning order) and `?area=<CA-…>` (a NICE competency area). Both are the targets of the tags
 * `STG:<n>` and `NICE:<area>` (`/go/STG:3`, `/go/NICE:CA-CRYPTO`). A value the catalogue does not
 * know is ignored, never an empty list.
 */
export interface LearnFacets {
  stage: number | null
  area: NiceCompetencyAreaId | null
}

export const NO_FACETS: LearnFacets = { stage: null, area: null }

const STAGE_NAMES = new Map<number, string>()
for (const m of LEARN_MODULES)
  if (m.stage !== undefined && m.stageName) STAGE_NAMES.set(m.stage, m.stageName)

export function resolveStage(raw: string | null | undefined): number | null {
  const n = raw && /^[1-9]\d*$/.test(raw) ? Number(raw) : NaN
  return STAGE_NAMES.has(n) ? n : null
}

export function resolveArea(raw: string | null | undefined): NiceCompetencyAreaId | null {
  return raw && Object.prototype.hasOwnProperty.call(NICE_COMPETENCY_AREAS, raw)
    ? (raw as NiceCompetencyAreaId)
    : null
}

export function parseFacets(params: URLSearchParams): LearnFacets {
  return { stage: resolveStage(params.get('stage')), area: resolveArea(params.get('area')) }
}

const BY_ID = new Map(LEARN_MODULES.map((m) => [m.id, m]))

/** True when the lesson is in the stage and teaches the area named by the facets (an absent facet passes). */
export function lessonHasFacets(moduleId: string, f: LearnFacets): boolean {
  if (f.stage === null && f.area === null) return true
  const m = BY_ID.get(moduleId)
  if (!m) return false
  if (f.stage !== null && m.stage !== f.stage) return false
  if (f.area !== null && !m.niceCompetencyAreas.includes(f.area)) return false
  return true
}

export interface FacetChip {
  key: 'stage' | 'area'
  label: string
}

/** The words for an active facet, for the chip that names it and clears it. */
export function facetChips(f: LearnFacets): FacetChip[] {
  const out: FacetChip[] = []
  if (f.stage !== null)
    out.push({ key: 'stage', label: `Stage ${f.stage}: ${STAGE_NAMES.get(f.stage)}` })
  if (f.area !== null)
    out.push({ key: 'area', label: `NICE area: ${NICE_COMPETENCY_AREAS[f.area].title}` })
  return out
}
