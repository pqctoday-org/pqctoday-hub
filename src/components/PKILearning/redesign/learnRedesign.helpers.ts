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
 * Phase completion roll-up for the progress dial + capstone gate.
 * "passed" is keyed to MODULE COMPLETION (Decision 2 revised) — a checkpoint
 * phase counts as passed once all its modules are done; the wrap-up/quiz phase
 * is excluded from the checkpoint tally.
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
  essentialsIds: readonly string[] = []
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
    if (total > 0 && done === total) checkpointsPassed += 1
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
