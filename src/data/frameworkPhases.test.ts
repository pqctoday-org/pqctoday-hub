// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { FRAMEWORK_PHASES, PHASE_ORDER } from './frameworkPhases'
import type { PhaseId } from './frameworkPhases'
import { CSWP39_ZONE_ORDER } from './cswp39ZoneData'
import type { ZoneId } from './cswp39ZoneData'

const ALL_PHASE_IDS: PhaseId[] = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'foundations']

const ZONE_SET: Set<ZoneId> = new Set(CSWP39_ZONE_ORDER)

describe('FRAMEWORK_PHASES', () => {
  it('every phase.cswp39Zones is a subset of the real ZoneId set', () => {
    for (const id of ALL_PHASE_IDS) {
      const phase = FRAMEWORK_PHASES[id]
      for (const zone of phase.cswp39Zones) {
        expect(ZONE_SET.has(zone)).toBe(true)
      }
    }
  })

  it('every record id matches its key', () => {
    for (const id of ALL_PHASE_IDS) {
      expect(FRAMEWORK_PHASES[id].id).toBe(id)
    }
  })

  it('declares every PhaseId exactly once', () => {
    const keys = Object.keys(FRAMEWORK_PHASES).sort()
    expect(keys).toEqual([...ALL_PHASE_IDS].sort())
  })
})

describe('PHASE_ORDER', () => {
  it('covers every PhaseId with no duplicates', () => {
    expect(new Set(PHASE_ORDER).size).toBe(PHASE_ORDER.length)
    expect([...PHASE_ORDER].sort()).toEqual([...ALL_PHASE_IDS].sort())
  })

  it('only references ids present in FRAMEWORK_PHASES', () => {
    for (const id of PHASE_ORDER) {
      expect(FRAMEWORK_PHASES[id]).toBeTruthy()
    }
  })
})
