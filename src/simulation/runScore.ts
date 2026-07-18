// SPDX-License-Identifier: GPL-3.0-only
/**
 * runScore (WP4.2) — grades a completed (or in-progress) run A–D from four
 * independently-visible sub-scores, not a black box: pace against a
 * difficulty-adjusted par, how many traps were picked THIS run (the lifetime
 * tally in simTrapTally.ts is a separate, cross-run instrument — this is
 * run-scoped so a past run's mistakes never colour a fresh one), estate
 * compliance (readiness.ts's compliancePct), and how many transformation
 * objectives landed on schedule (transformationStatus.ts's objectives).
 *
 * Pure function — no React, no store reads. The caller supplies every input.
 */
import { PAR_QUARTERS, type DifficultyId } from '@/data/simBalance'

export type RunGrade = 'A' | 'B' | 'C' | 'D'

export interface RunScoreInput {
  /** Total quarters played this run (from Q1 of the seed year to now). */
  quartersUsed: number
  difficulty: DifficultyId
  /** Traps picked THIS run (store's trapsThisRun, reset on reset()). */
  trapsThisRun: number
  /** readiness.ts's compliancePct (0–100). */
  compliancePct: number
  objectivesOnTime: number
  objectivesTotal: number
}

export interface RunScoreBreakdown {
  grade: RunGrade
  overall: number
  parQuarters: number
  paceScore: number
  trapScore: number
  complianceScore: number
  onTimeScore: number
}

const clamp0to100 = (n: number) => Math.max(0, Math.min(100, n))

/** 5 points off per quarter over par; a run that finishes at or under par scores 100. */
function paceScore(quartersUsed: number, parQuarters: number): number {
  return clamp0to100(100 - Math.max(0, quartersUsed - parQuarters) * 5)
}

/** 15 points off per trap picked this run. */
function trapScore(trapsThisRun: number): number {
  return clamp0to100(100 - trapsThisRun * 15)
}

function onTimeScore(objectivesOnTime: number, objectivesTotal: number): number {
  return objectivesTotal > 0 ? clamp0to100((objectivesOnTime / objectivesTotal) * 100) : 100
}

function gradeOf(overall: number): RunGrade {
  if (overall >= 90) return 'A'
  if (overall >= 75) return 'B'
  if (overall >= 60) return 'C'
  return 'D'
}

export function computeRunScore(input: RunScoreInput): RunScoreBreakdown {
  const parQuarters = PAR_QUARTERS[input.difficulty]
  const pace = paceScore(input.quartersUsed, parQuarters)
  const trap = trapScore(input.trapsThisRun)
  const compliance = clamp0to100(input.compliancePct)
  const onTime = onTimeScore(input.objectivesOnTime, input.objectivesTotal)
  const overall = Math.round((pace + trap + compliance + onTime) / 4)
  return {
    grade: gradeOf(overall),
    overall,
    parQuarters,
    paceScore: pace,
    trapScore: trap,
    complianceScore: compliance,
    onTimeScore: onTime,
  }
}
