// SPDX-License-Identifier: GPL-3.0-only
/**
 * transformationStatus — the headline the sim is scored on, replacing the static
 * (unwinnable) Mosca "over by N years" gauge.
 *
 * It rolls the live maturity state into: the three objectives (governance in place /
 * critical assets protected / migration completed) with on-time judgment vs the scenario's
 * dates; the four migration tracks (HNDL/TNFL × critical/general) with progress; and a DYNAMIC
 * harvest-now (HNDL) exposure that FALLS as the HNDL tracks migrate — so the gauge shows the
 * gap closing (winnable) while keeping the EO/framework "why now". Pure: no store reads.
 */
import type { SimScenario, SimTrackId } from './scenarioConfig'

export type OnTime = 'in-progress' | 'done' | 'done-late' | 'late'

export interface TrackStatus {
  id: SimTrackId
  label: string
  track: 'HNDL' | 'TNFL'
  tier: 'critical' | 'general'
  year: number
  progress: number // 0..1
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
  hndlExposure: number // 0..1 (1 = fully exposed to harvest-now; 0 = protected)
  tracks: TrackStatus[]
  objectives: ObjectiveStatus[]
}

export interface StatusInput {
  scenario: SimScenario
  programMaturity: number // 0..4
  p0Level: number // levelOf('p0')
  migrationFraction: number // 0..1 — fraction of P5 (migration execution) done
  allAtTopBand: boolean // every phase at its own top band
  currentYear: number
}

// Where each track sits along the migration-execution progress (HNDL→TNFL, critical→general).
const TRACK_RANGE = new Map<SimTrackId, [number, number]>([
  ['hndl-critical', [0, 0.25]],
  ['tnfl-critical', [0.25, 0.5]],
  ['hndl-general', [0.5, 0.75]],
  ['tnfl-general', [0.75, 1]],
])

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x))

export function transformationStatus(inp: StatusInput): TransformationStatus {
  const f = inp.migrationFraction
  const tracks: TrackStatus[] = inp.scenario.tracks.map((t) => {
    const [lo, hi] = TRACK_RANGE.get(t.id) ?? [0, 1]
    const progress = clamp01((f - lo) / Math.max(0.0001, hi - lo))
    return {
      id: t.id,
      label: t.label,
      track: t.track,
      tier: t.tier,
      year: t.year,
      progress,
      done: progress >= 1,
    }
  })

  const hndl = tracks.filter((t) => t.track === 'HNDL')
  const hndlExposure = 1 - hndl.reduce((s, t) => s + t.progress, 0) / Math.max(1, hndl.length)
  const criticalDone = tracks.filter((t) => t.tier === 'critical').every((t) => t.done)

  const objectives: ObjectiveStatus[] = inp.scenario.objectives.map((o) => {
    const done =
      o.id === 'governance'
        ? inp.p0Level >= 2
        : o.id === 'critical'
          ? criticalDone
          : inp.allAtTopBand
    const onTime: OnTime = done
      ? inp.currentYear <= o.byYear
        ? 'done'
        : 'done-late'
      : inp.currentYear > o.byYear
        ? 'late'
        : 'in-progress'
    return { id: o.id, label: o.label, byYear: o.byYear, done, onTime }
  })

  return { maturity: inp.programMaturity, hndlExposure, tracks, objectives }
}
