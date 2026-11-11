// SPDX-License-Identifier: AGPL-3.0-only
/** Named sample-planning progress and objective timing. Pure: no store reads. */
import type { SimScenario, SimTrackId } from './scenarioConfig'
import type { PlanningGroupId, PlanningGroupProgress } from '@/simulation/edgePlanningProgress'

export type OnTime = 'in-progress' | 'done' | 'done-late' | 'done-unknown' | 'late'

export interface TrackStatus {
  id: SimTrackId
  label: string
  track: 'HNDL' | 'TNFL'
  tier: 'critical' | 'general'
  year: number
  progress: number | null // 0..1; null when the named group is unassessed
  requiredCount: number | null
  completedCount: number | null
  done: boolean
}

export interface ObjectiveStatus {
  id: string
  label: string
  byYear: number
  done: boolean
  onTime: OnTime
}

export interface TransformationStatus {
  maturity: number // 0..4 program maturity
  hndlExposure: number | null // illustrative remaining confidentiality planning, not measured protection
  tracks: TrackStatus[]
  objectives: ObjectiveStatus[]
}

export interface StatusInput {
  scenario: SimScenario
  programMaturity: number // 0..4
  p0Level: number // levelOf('p0')
  planningGroups: Record<PlanningGroupId, PlanningGroupProgress>
  allAtTopBand: boolean // every phase at its own top band
  currentYear: number
  objectiveAchievedYears?: Readonly<Record<string, number>>
}

// Reject incomplete or inconsistent runtime inputs rather than treating empty groups as done.
function assessedGroup(group: PlanningGroupProgress | undefined): PlanningGroupProgress | null {
  if (!group || !Array.isArray(group.requiredKeys) || !Array.isArray(group.completedKeys))
    return null
  const { requiredKeys, completedKeys, progress, done } = group
  if (
    requiredKeys.length === 0 ||
    ![...requiredKeys].every((key) => typeof key === 'string' && key.trim().length > 0) ||
    ![...completedKeys].every((key) => typeof key === 'string' && key.trim().length > 0) ||
    new Set(requiredKeys).size !== requiredKeys.length ||
    new Set(completedKeys).size !== completedKeys.length ||
    ![...completedKeys].every((key) => requiredKeys.includes(key)) ||
    typeof progress !== 'number' ||
    !Number.isFinite(progress) ||
    progress < 0 ||
    progress > 1 ||
    Math.abs(progress - completedKeys.length / requiredKeys.length) > 1e-9 ||
    done !== (completedKeys.length === requiredKeys.length)
  )
    return null
  return group
}

export function transformationStatus(inp: StatusInput): TransformationStatus {
  const tracks: TrackStatus[] = inp.scenario.tracks.map((t) => {
    const group = assessedGroup(inp.planningGroups?.[t.id])
    return {
      id: t.id,
      label: t.label,
      track: t.track,
      tier: t.tier,
      year: t.year,
      progress: group?.progress ?? null,
      requiredCount: group?.requiredKeys.length ?? null,
      completedCount: group?.completedKeys.length ?? null,
      done: group?.done ?? false,
    }
  })

  // Preserve the sample's 70/30 confidentiality weighting, using only its actual named groups.
  const hCrit = assessedGroup(inp.planningGroups?.['hndl-critical'])
  const hGen = assessedGroup(inp.planningGroups?.['hndl-general'])
  const hndlExposure =
    hCrit?.progress != null && hGen?.progress != null
      ? Math.max(0, 1 - (0.7 * hCrit.progress + 0.3 * hGen.progress))
      : null
  const criticalDone =
    assessedGroup(inp.planningGroups?.['hndl-critical'])?.done === true &&
    assessedGroup(inp.planningGroups?.['tnfl-critical'])?.done === true

  const objectives: ObjectiveStatus[] = inp.scenario.objectives.map((o) => {
    const done =
      o.id === 'governance'
        ? inp.p0Level >= 2
        : o.id === 'critical'
          ? criticalDone
          : inp.allAtTopBand
    const achievedYear = inp.objectiveAchievedYears?.[o.id]
    const onTime: OnTime = done
      ? achievedYear == null || !Number.isFinite(achievedYear)
        ? 'done-unknown'
        : achievedYear <= o.byYear
          ? 'done'
          : 'done-late'
      : inp.currentYear > o.byYear
        ? 'late'
        : 'in-progress'
    return {
      id: o.id,
      label: o.id === 'critical' ? 'Critical sample planning complete' : o.label,
      byYear: o.byYear,
      done,
      onTime,
    }
  })

  return { maturity: inp.programMaturity, hndlExposure, tracks, objectives }
}
