// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  computePathProgress,
  TOTAL_MODULE_COUNT,
  TRACK_COUNT,
  PERSONA_ORDER,
  NICE_AFFINITY_PERSONAS,
} from './learnRedesign.helpers'
import type { PersonaPathPhase } from '../usePersonaPathItems'

const phase = (id: string, moduleIds: string[]): PersonaPathPhase => ({
  id,
  title: id,
  moduleIds,
  categories: [],
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
