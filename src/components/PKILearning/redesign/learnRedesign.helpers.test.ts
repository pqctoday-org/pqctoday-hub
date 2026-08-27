// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  computePathProgress,
  isCheckpointPassed,
  CHECKPOINT_PASS_THRESHOLD,
  TOTAL_MODULE_COUNT,
  TRACK_COUNT,
  PERSONA_ORDER,
  NICE_AFFINITY_PERSONAS,
  formatHours,
} from './learnRedesign.helpers'
import type { PersonaPathPhase } from '../usePersonaPathItems'

const phase = (id: string, moduleIds: string[], categories: string[] = []): PersonaPathPhase => ({
  id,
  title: id,
  moduleIds,
  categories,
})

describe('computePathProgress', () => {
  const phases: PersonaPathPhase[] = [
    phase('cp-1', ['a', 'b']),
    phase('cp-2', ['c', 'd']),
    phase('wrap-up', ['quiz']), // excluded from module/checkpoint tallies
  ]

  it('counts completed modules and passed checkpoints, excluding the wrap-up phase', () => {
    const status = { a: 'completed', b: 'completed', c: 'in-progress' }
    const p = computePathProgress(phases, status)
    expect(p.totalModules).toBe(4) // wrap-up's quiz excluded
    expect(p.doneModules).toBe(2)
    expect(p.checkpointsTotal).toBe(2)
    expect(p.checkpointsPassed).toBe(1) // cp-1 fully done, cp-2 not
    expect(p.pct).toBe(50)
    expect(p.capstoneUnlocked).toBe(false)
  })

  it('reports 100% and all checkpoints passed when every module is complete', () => {
    const status = { a: 'completed', b: 'completed', c: 'completed', d: 'completed' }
    const p = computePathProgress(phases, status)
    expect(p.pct).toBe(100)
    expect(p.checkpointsPassed).toBe(2)
    expect(p.fullTrackComplete).toBe(true)
  })

  it('handles an empty path without dividing by zero', () => {
    const p = computePathProgress([], {})
    expect(p.pct).toBe(0)
    expect(p.capstoneUnlocked).toBe(false)
    expect(p.essentialsTotal).toBe(0)
    expect(p.essentialsComplete).toBe(false)
  })

  it('tracks essentials progress from the passed-in essentials list', () => {
    const status = { a: 'completed', b: 'in-progress', c: 'in-progress', d: 'in-progress' }
    const p = computePathProgress(phases, status, ['a', 'c'])
    expect(p.essentialsTotal).toBe(2)
    expect(p.essentialsDone).toBe(1) // a done, c not
    expect(p.essentialsPct).toBe(50)
    expect(p.essentialsComplete).toBe(false)
    expect(p.capstoneUnlocked).toBe(false)
  })

  it('unlocks the capstone as soon as the Essentials are complete, before the full track', () => {
    // Essentials (a, c) done; full-track modules b, d still incomplete.
    const status = { a: 'completed', c: 'completed', b: 'in-progress', d: 'in-progress' }
    const p = computePathProgress(phases, status, ['a', 'c'])
    expect(p.essentialsComplete).toBe(true)
    expect(p.fullTrackComplete).toBe(false)
    // A1: the capstone is gated on the Essentials, so it is unlocked here.
    expect(p.capstoneUnlocked).toBe(true)
  })

  it('sets fullTrackComplete when every module is done (capstone already unlocked via essentials)', () => {
    const status = { a: 'completed', b: 'completed', c: 'completed', d: 'completed' }
    const p = computePathProgress(phases, status, ['a', 'c'])
    expect(p.essentialsComplete).toBe(true)
    expect(p.fullTrackComplete).toBe(true)
    expect(p.capstoneUnlocked).toBe(true)
  })
})

describe('isCheckpointPassed — score-aware checkpoints (remediation item 3)', () => {
  it('does NOT mark a checkpoint passed on module completion alone when it has quiz categories', () => {
    const cp = phase('cp-1', ['a', 'b'], ['cat-x', 'cat-y'])
    const status = { a: 'completed', b: 'completed' }
    expect(isCheckpointPassed(cp, status, undefined)).toBe(false)
    expect(isCheckpointPassed(cp, status, {})).toBe(false)
  })

  it('requires EVERY listed category to meet the pass threshold, not just one', () => {
    const cp = phase('cp-1', ['a', 'b'], ['cat-x', 'cat-y'])
    const status = { a: 'completed', b: 'completed' }
    expect(isCheckpointPassed(cp, status, { 'cat-x': 90 })).toBe(false) // cat-y missing
    expect(isCheckpointPassed(cp, status, { 'cat-x': 90, 'cat-y': 79 })).toBe(false) // below bar
    expect(
      isCheckpointPassed(cp, status, { 'cat-x': CHECKPOINT_PASS_THRESHOLD, 'cat-y': 100 })
    ).toBe(true)
  })

  it('passes regardless of module completion once every category clears the bar (quiz-gated, not module-gated)', () => {
    const cp = phase('cp-1', ['a', 'b'], ['cat-x'])
    const status = { a: 'in-progress', b: 'not-started' }
    expect(isCheckpointPassed(cp, status, { 'cat-x': 100 })).toBe(true)
  })

  it('falls back to module completion for a categoryless phase (defensive implicit-final case)', () => {
    const cp = phase('implicit-final', ['a', 'b'], [])
    expect(isCheckpointPassed(cp, { a: 'completed', b: 'completed' }, undefined)).toBe(true)
    expect(isCheckpointPassed(cp, { a: 'completed', b: 'in-progress' }, undefined)).toBe(false)
  })

  it('computePathProgress.checkpointsPassed reflects quiz scores, not module completion', () => {
    const scoredPhases: PersonaPathPhase[] = [
      phase('cp-1', ['a', 'b'], ['cat-a']),
      phase('cp-2', ['c', 'd'], ['cat-b']),
      phase('wrap-up', ['quiz']),
    ]
    const allModulesDone = { a: 'completed', b: 'completed', c: 'completed', d: 'completed' }

    // Modules finished, quiz never attempted → nothing passed yet.
    const beforeQuiz = computePathProgress(scoredPhases, allModulesDone, [], undefined)
    expect(beforeQuiz.doneModules).toBe(4) // module completion tracking is unaffected
    expect(beforeQuiz.checkpointsPassed).toBe(0)

    // Pass cp-1's quiz only.
    const afterOneQuiz = computePathProgress(scoredPhases, allModulesDone, [], {
      'cat-a': CHECKPOINT_PASS_THRESHOLD,
    })
    expect(afterOneQuiz.checkpointsPassed).toBe(1)

    // Pass both.
    const afterBothQuizzes = computePathProgress(scoredPhases, allModulesDone, [], {
      'cat-a': CHECKPOINT_PASS_THRESHOLD,
      'cat-b': CHECKPOINT_PASS_THRESHOLD,
    })
    expect(afterBothQuizzes.checkpointsPassed).toBe(2)
  })
})

describe('catalog-derived constants', () => {
  it('derives a real module count and the 9 tracks (never hard-coded)', () => {
    expect(TOTAL_MODULE_COUNT).toBeGreaterThan(40)
    expect(TRACK_COUNT).toBe(9)
  })

  it('lists all six personas with curious first, and NICE affinity for exec + researcher', () => {
    expect(PERSONA_ORDER).toHaveLength(6)
    expect(PERSONA_ORDER[0]).toBe('curious')
    expect(NICE_AFFINITY_PERSONAS.has('executive')).toBe(true)
    expect(NICE_AFFINITY_PERSONAS.has('researcher')).toBe(true)
    expect(NICE_AFFINITY_PERSONAS.has('curious')).toBe(false)
  })
})

// 2026-08-24 audit R5: was duplicated in both MyPathView.tsx and
// MobileMyPathView.tsx as `~${Math.round(minutes / 60)}h` — 190 minutes
// rounded to "~3h", silently dropping 10 real minutes.
describe('formatHours', () => {
  it('keeps the real minutes instead of rounding them away', () => {
    expect(formatHours(190)).toBe('3h 10m')
  })

  it('omits a zero minute remainder', () => {
    expect(formatHours(120)).toBe('2h')
  })

  it('shows bare minutes under an hour', () => {
    expect(formatHours(45)).toBe('45m')
  })

  it('floors at 1 minute rather than showing 0', () => {
    expect(formatHours(0)).toBe('1m')
  })
})
