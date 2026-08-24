// SPDX-License-Identifier: GPL-3.0-only
//
// Shared, dependency-light helpers for the redesigned /learn surface.
// Counts are DERIVED from the manifest-driven catalog (never hard-coded) so the
// "Browse all N" label and subtitle always reflect reality (G4 in the build plan).
import { Briefcase, Code, ShieldCheck, GraduationCap, Server, Lightbulb } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import { MODULE_TRACKS } from '../moduleData'
import type { PersonaPathPhase } from '../usePersonaPathItems'

/** Display order for the persona lens pills (curious first — the cold-start default). */
export const PERSONA_ORDER: PersonaId[] = [
  'curious',
  'executive',
  'developer',
  'architect',
  'ops',
  'researcher',
]

/** Roles for which the workforce (NICE) lens is auto-surfaced (Decision 1). */
export const NICE_AFFINITY_PERSONAS: ReadonlySet<PersonaId> = new Set(['executive', 'researcher'])

const PERSONA_ICONS: Record<LearningPersonaIcon, LucideIcon> = {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  Server,
  Lightbulb,
}

type LearningPersonaIcon = (typeof PERSONAS)[PersonaId]['icon']

export function personaIcon(id: PersonaId): LucideIcon {
  return PERSONA_ICONS[PERSONAS[id].icon]
}

/** Total learnable modules across every track (derived, excludes quiz/assess special ids). */
export const TOTAL_MODULE_COUNT: number = MODULE_TRACKS.reduce((n, t) => n + t.modules.length, 0)

/** Number of tracks in the catalog. */
export const TRACK_COUNT: number = MODULE_TRACKS.length

/**
 * Checkpoint quizzes pass at the same 80% bar as the capstone (QuizResults.tsx's
 * own "80% passing grade" badge) — one passing threshold, used consistently.
 */
export const CHECKPOINT_PASS_THRESHOLD = 80

/**
 * A checkpoint phase is "passed" once every one of its quiz categories has a
 * recorded best score at or above the passing threshold — not merely once its
 * modules are marked complete (remediation item 3). Phases with no categories
 * (the defensive 'implicit-final' phase for a path with a trailing, uncapped
 * module run) have no quiz to gate on, so they fall back to module completion.
 */
export function isCheckpointPassed(
  phase: Pick<PersonaPathPhase, 'categories' | 'moduleIds'>,
  statusById: Record<string, string | undefined>,
  quizScores: Record<string, number> | undefined
): boolean {
  if (phase.categories.length === 0) {
    return (
      phase.moduleIds.length > 0 && phase.moduleIds.every((id) => statusById[id] === 'completed')
    )
  }
  return phase.categories.every((cat) => (quizScores?.[cat] ?? 0) >= CHECKPOINT_PASS_THRESHOLD)
}

/**
 * Phase completion roll-up for the progress dial + capstone gate.
 * "passed" requires a passing checkpoint-quiz score (see `isCheckpointPassed`),
 * not just finished modules; the wrap-up/quiz phase is excluded from the tally.
 */
export interface PathProgress {
  doneModules: number
  totalModules: number
  /** Checkpoint phases whose modules are all complete. */
  checkpointsPassed: number
  /** Checkpoint phases total (excludes the terminal wrap-up phase). */
  checkpointsTotal: number
  /** Overall percent across the path's modules (0–100, rounded). */
  pct: number
  /** Completed count among the persona's Essentials (0 if no essentials passed in). */
  essentialsDone: number
  /** Total Essentials modules for the persona. */
  essentialsTotal: number
  /** Essentials percent (0–100, rounded). */
  essentialsPct: number
  /** True once every Essentials module is complete → unlocks the capstone (A1). */
  essentialsComplete: boolean
  /** True once every non-wrap-up module in the path is complete → the optional "mastery" badge. */
  fullTrackComplete: boolean
  /**
   * Whether the capstone (final quiz) is unlocked. A1: gated on the Essentials
   * (`essentialsComplete`) rather than the full track, so a learner reaches the
   * capstone after the short core instead of every module. `fullTrackComplete`
   * remains available for the optional "full track mastered" badge.
   */
  capstoneUnlocked: boolean
}

export function computePathProgress(
  phases: PersonaPathPhase[],
  statusById: Record<string, string | undefined>,
  essentialsIds: readonly string[] = [],
  quizScores: Record<string, number> | undefined = undefined
): PathProgress {
  const checkpointPhases = phases.filter((p) => p.id !== 'wrap-up')
  let doneModules = 0
  let totalModules = 0
  let checkpointsPassed = 0
  for (const phase of checkpointPhases) {
    const total = phase.moduleIds.length
    const done = phase.moduleIds.filter((id) => statusById[id] === 'completed').length
    totalModules += total
    doneModules += done
    if (isCheckpointPassed(phase, statusById, quizScores)) checkpointsPassed += 1
  }
  const checkpointsTotal = checkpointPhases.length
  const pct = totalModules > 0 ? Math.round((doneModules / totalModules) * 100) : 0

  const essentialsTotal = essentialsIds.length
  const essentialsDone = essentialsIds.filter((id) => statusById[id] === 'completed').length
  const essentialsPct =
    essentialsTotal > 0 ? Math.round((essentialsDone / essentialsTotal) * 100) : 0
  const essentialsComplete = essentialsTotal > 0 && essentialsDone === essentialsTotal
  const fullTrackComplete = totalModules > 0 && doneModules === totalModules

  return {
    doneModules,
    totalModules,
    checkpointsPassed,
    checkpointsTotal,
    pct,
    essentialsDone,
    essentialsTotal,
    essentialsPct,
    essentialsComplete,
    fullTrackComplete,
    // A1: the capstone unlocks on the Essentials core, not the full track.
    capstoneUnlocked: essentialsComplete,
  }
}

/**
 * 2026-08-24 audit R5: was duplicated verbatim in MyPathView.tsx (desktop)
 * and MobileMyPathView.tsx, and rounded to the nearest hour — 190 minutes
 * read as "~3h", silently dropping 10 real minutes. Now shared, and keeps
 * the real minutes instead of rounding them away.
 */
export function formatHours(minutes: number): string {
  const total = Math.max(1, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
