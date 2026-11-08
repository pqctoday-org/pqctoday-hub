// SPDX-License-Identifier: AGPL-3.0-only
//
// Shared, dependency-light helpers for the redesigned /learn surface.
// Counts are DERIVED from the manifest-driven catalog (never hard-coded) so the
// "Browse all N" label and subtitle always reflect reality (G4 in the build plan).
import {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  BadgeCheck,
  Server,
  Lightbulb,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import { matchesAllWords } from '@/utils/searchMatch'
import { MODULE_TRACKS } from '../moduleData'
import type { ModuleItem } from '../ModuleCard'
import type { PersonaPathPhase } from '../usePersonaPathItems'

/** Display order for the persona lens pills (curious first — the cold-start default). */
export const PERSONA_ORDER: PersonaId[] = [
  'curious',
  'executive',
  'grc',
  'developer',
  'architect',
  'ops',
  'researcher',
  'cert-engineer',
]

/** Roles for which the workforce (NICE) lens is auto-surfaced (Decision 1).
 *  `grc` added 2026-09-07 — its whole learning path maps onto risk-manager /
 *  is-security-manager NICE work roles (see roleCrosswalk.ts), at least as
 *  directly as executive's. `cert-engineer` added 2026-09-29 — its path maps
 *  onto DD-WRL-007 Systems Testing and Evaluation (niceFramework.ts). */
export const NICE_AFFINITY_PERSONAS: ReadonlySet<PersonaId> = new Set([
  'executive',
  'grc',
  'researcher',
  'cert-engineer',
])

const PERSONA_ICONS: Record<LearningPersonaIcon, LucideIcon> = {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  BadgeCheck,
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

/**
 * True for a role whose path does not open with PQC 101 (the certification
 * engineer's starts at the certificate): a reader new to PQC would otherwise
 * find no pointer to the basics, so the path views add an optional note.
 */
export function pathSkipsPqcBasics(personaId: PersonaId): boolean {
  return !PERSONAS[personaId].recommendedPath.includes('pqc-101')
}

// ---------------------------------------------------------------------------------------------
// Browse all: the filter and sort rules, shared by the desktop catalogue (BrowseAllView) and the
// phone one (MobileBrowseAllView), so the two always list the same modules in the same order.
// ---------------------------------------------------------------------------------------------

/** The value of the "all tracks" chip and of an unset status filter. */
export const BROWSE_ALL = 'All'

export type BrowseSortMode = 'default' | 'alpha' | 'difficulty' | 'duration' | 'status'

/** Status filter choices (id `All` means no status filter). */
export const BROWSE_STATUS_ITEMS: ReadonlyArray<{ id: string; label: string }> = [
  { id: BROWSE_ALL, label: 'All statuses' },
  { id: 'not-started', label: 'Not started' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
]

/** Sort choices, in display order. */
export const BROWSE_SORT_ITEMS: ReadonlyArray<{ id: BrowseSortMode; label: string }> = [
  { id: 'default', label: 'Recommended' },
  { id: 'alpha', label: 'Name A–Z' },
  { id: 'difficulty', label: 'Difficulty' },
  { id: 'duration', label: 'Shortest first' },
  { id: 'status', label: 'By status' },
]

const DIFF_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 }
const STATUS_ORDER: Record<string, number> = { 'in-progress': 0, 'not-started': 1, completed: 2 }

/** "30 min" → 30; a duration that does not start with a number sorts last. */
export function minutesOf(duration: string): number {
  const n = parseInt(duration, 10)
  return Number.isNaN(n) ? 999 : n
}

/**
 * The track a `?track=` link or a chip names: the catalogue's own spelling when it is one of the
 * catalogue's tracks, otherwise "All" (an unknown or empty name is ignored, never an empty list).
 */
export function resolveBrowseTrack(raw: string | null | undefined): string {
  return raw && MODULE_TRACKS.some((t) => t.track === raw) ? raw : BROWSE_ALL
}

/** A group of catalogue modules under one track heading. */
export interface BrowseGroup {
  track: string
  modules: ModuleItem[]
}

export interface BrowseFilterInput {
  /** The catalogue to filter, grouped by track (normally `MODULE_TRACKS`). */
  tracks: ReadonlyArray<{ track: string; modules: readonly ModuleItem[] }>
  /** Free text; every word must appear in the title, description or topic keywords. */
  search?: string
  /** Curated per-module topic keywords, once loaded (search works on title and description without them). */
  topicKeywords?: Readonly<Record<string, string>> | null
  /** A track name, or `All`. */
  track?: string
  /** `not-started`, `in-progress`, `completed`, or `All`. */
  status?: string
  sort?: BrowseSortMode
  savedOnly?: boolean
  /** Ids of the modules the reader has saved. */
  savedIds?: ReadonlySet<string>
  /** Per-module progress, as `useModuleStore` keeps it (a module with no entry is not started). */
  progress?: Readonly<Record<string, { status?: string } | undefined>>
  /** Extra desktop-only narrowing (workforce proficiency tier, algorithm or standard); a module must pass it. */
  extraFilter?: (moduleId: string) => boolean
}

/**
 * The Browse all list: the catalogue narrowed by track, saved, status, the extra filter and the
 * search words, each track's modules sorted, and tracks left with no modules dropped. `default`
 * keeps the catalogue's own (recommended) order.
 */
export function filterAndSortModules(input: BrowseFilterInput): BrowseGroup[] {
  const {
    tracks,
    search = '',
    topicKeywords = null,
    track = BROWSE_ALL,
    status = BROWSE_ALL,
    sort = 'default',
    savedOnly = false,
    savedIds,
    progress = {},
    extraFilter,
  } = input
  const q = search.trim()
  const statusOf = (id: string) => progress[id]?.status ?? 'not-started'

  const groups = tracks
    .map((t) => ({
      track: t.track,
      modules: t.modules.filter((m) => {
        if (track !== BROWSE_ALL && t.track !== track) return false
        if (savedOnly && !savedIds?.has(m.id)) return false
        if (status !== BROWSE_ALL && statusOf(m.id) !== status) return false
        if (extraFilter && !extraFilter(m.id)) return false
        if (q && !matchesAllWords([m.title, m.description, topicKeywords?.[m.id]], q)) return false
        return true
      }) as ModuleItem[],
    }))
    .filter((g) => g.modules.length > 0)

  const sorter = (a: ModuleItem, b: ModuleItem): number => {
    switch (sort) {
      case 'alpha':
        return a.title.localeCompare(b.title)
      case 'difficulty':
        return (
          (DIFF_ORDER[a.difficulty ?? 'beginner'] ?? 0) -
          (DIFF_ORDER[b.difficulty ?? 'beginner'] ?? 0)
        )
      case 'duration':
        return minutesOf(a.duration) - minutesOf(b.duration)
      case 'status':
        return (STATUS_ORDER[statusOf(a.id)] ?? 1) - (STATUS_ORDER[statusOf(b.id)] ?? 1)
      default:
        return 0
    }
  }
  if (sort !== 'default') groups.forEach((g) => g.modules.sort(sorter))
  return groups
}
