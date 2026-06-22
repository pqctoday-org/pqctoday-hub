// SPDX-License-Identifier: GPL-3.0-only
/**
 * simMissions — the Simulation's per-phase, per-maturity-level mission content,
 * loaded from a maintainable dated CSV (`sim_missions_<MMDDYYYY>.csv`).
 *
 * Edit the CSV to review/tune what each phase asks of the player and the goal at
 * each maturity level; the latest-dated file wins (same convention as the other
 * hub CSVs). `goal` is seeded from the framework's Level 0–4 indicators.
 */
import type { PhaseId } from './frameworkPhases'
import { loadLatestCSV } from './csvUtils'

const modules = import.meta.glob('./sim_missions_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawRow {
  phase: string
  phase_name: string
  phase_mission: string
  phase_todo: string
  phase_produces: string
  level: string
  level_name: string
  goal: string
}

interface MissionRow {
  phase: PhaseId
  phaseName: string
  mission: string
  todo: string[]
  produces: string[]
  level: number
  levelName: string
  goal: string
}

const splitList = (v: string) =>
  v
    ? v
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)
    : []

const { data: rows, metadata } = loadLatestCSV<RawRow, MissionRow>(
  modules,
  /sim_missions_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    phase: row.phase as PhaseId,
    phaseName: row.phase_name,
    mission: row.phase_mission,
    todo: splitList(row.phase_todo),
    produces: splitList(row.phase_produces),
    level: Number(row.level),
    levelName: row.level_name,
    goal: row.goal,
  })
)

export interface PhaseLevelMission {
  level: number
  name: string
  /** Player-facing goal to reach this level. */
  goal: string
}

export interface PhaseMission {
  name: string
  mission: string
  todo: string[]
  produces: string[]
  /** Per maturity level (0–4). */
  levels: Record<number, PhaseLevelMission>
}

export const SIM_MISSIONS: Partial<Record<PhaseId, PhaseMission>> = (() => {
  const acc: Partial<Record<PhaseId, PhaseMission>> = {}
  for (const r of rows) {
    let pm = acc[r.phase]
    if (!pm) {
      pm = { name: r.phaseName, mission: r.mission, todo: r.todo, produces: r.produces, levels: {} }
      acc[r.phase] = pm
    }
    pm.levels[r.level] = { level: r.level, name: r.levelName, goal: r.goal }
  }
  return acc
})()

export const simMissionsMetadata = metadata
