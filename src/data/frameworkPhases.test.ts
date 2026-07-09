// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { FRAMEWORK_PHASES, PHASE_ORDER } from './frameworkPhases'
import type { PhaseId } from './frameworkPhases'
import { CSWP39_ZONE_ORDER } from './cswp39ZoneData'
import type { ZoneId } from './cswp39ZoneData'

const ALL_PHASE_IDS: PhaseId[] = [
  'p0',
  'p1',
  'p2',
  'p3',
  'p4',
  'p5',
  'p6',
  'p7',
  'verify-close',
  'foundations',
]

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

/**
 * Gate-authority drift guard (07082026 audit finding).
 *
 * frameworkPhases.ts had P4's gate authority as 'SteerCo'; the framework says
 * 'Executive Sponsor' in TWO independent places that agree — Activity 4.6's own
 * detail text AND the global `stage_gates` table (transition G3->G4). That's the
 * one case in the extraction clean enough to pin with confidence.
 *
 * This is NOT extended to a generic all-phase cross-check: the extraction's own
 * `stage_gates.source_note` documents that pdftotext merged columns on at least
 * one row, and per-phase `maps_to_transition` fields don't follow a consistent
 * arithmetic pattern (p3 and p4 both map to "G3->G4") — a naive id-based or
 * criterion-text match produces false positives (verified by hand while writing
 * this guard). Untangling the full gate table is a separate task, not a
 * regression test. The weaker structural check below (valid authority values)
 * still catches typos/garbage without asserting more than is actually known.
 */
describe('gate authority (drift guard vs framework-2.1.json)', () => {
  const fw = JSON.parse(
    readFileSync(resolve(process.cwd(), 'pqc-references/framework-2.1.json'), 'utf8')
  ) as { stage_gates: { gates: Array<{ id: string; authority: string }> } }

  it("P4's gate authority matches the framework's G3->G4 transition (Executive Sponsor)", () => {
    const transition = fw.stage_gates.gates.find((g) => g.id === 'G3->G4')
    expect(transition, 'G3->G4 transition missing from stage_gates').toBeTruthy()
    expect(FRAMEWORK_PHASES.p4.gate?.authority).toBe(transition!.authority)
  })

  it('every gated phase has a recognized decision authority (no typos/garbage)', () => {
    const VALID = new Set(['Executive Sponsor', 'SteerCo', 'QRPM'])
    for (const id of ALL_PHASE_IDS) {
      const gate = FRAMEWORK_PHASES[id].gate
      if (!gate) continue
      expect(VALID.has(gate.authority), `${id}: unrecognized authority "${gate.authority}"`).toBe(
        true
      )
    }
  })
})
