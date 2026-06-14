// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard for phaseResourceMap. The map is hand-maintained; this test only
 * checks structural integrity against the live registries so a new/removed
 * module or tool can't silently desync the phase overlay.
 */
import { describe, it, expect } from 'vitest'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { PHASE_ORDER, type PhaseId } from '@/data/frameworkPhases'
import {
  LEARN_PHASES,
  BUSINESS_PHASES,
  PLAYGROUND_PHASES,
  REFERENCE_PHASES,
  type PhaseResource,
} from './phaseResourceMap'

const sorted = (a: string[]) => [...a].sort()
const asArray = (p: PhaseId | PhaseId[]): PhaseId[] => (Array.isArray(p) ? p : [p])

describe('phaseResourceMap — registry parity (no orphans, no stale keys)', () => {
  it('LEARN_PHASES keys exactly match MODULE_CATALOG ids', () => {
    expect(sorted(Object.keys(LEARN_PHASES))).toEqual(sorted(Object.keys(MODULE_CATALOG)))
  })

  it('BUSINESS_PHASES keys exactly match BUSINESS_TOOLS ids', () => {
    expect(sorted(Object.keys(BUSINESS_PHASES))).toEqual(sorted(BUSINESS_TOOLS.map((t) => t.id)))
  })

  it('PLAYGROUND_PHASES keys exactly match WORKSHOP_TOOLS ids', () => {
    expect(sorted(Object.keys(PLAYGROUND_PHASES))).toEqual(sorted(WORKSHOP_TOOLS.map((t) => t.id)))
  })
})

describe('phaseResourceMap — primary phase ⊆ phasesServed', () => {
  it('every module/tool frameworkPhase is contained in its phasesServed', () => {
    for (const [id, mod] of Object.entries(MODULE_CATALOG)) {
      const served = LEARN_PHASES[id].phasesServed
      for (const primary of asArray(mod.frameworkPhase)) {
        expect(served, `LEARN ${id}: frameworkPhase ${primary} not in phasesServed`).toContain(
          primary
        )
      }
    }
    for (const tool of BUSINESS_TOOLS) {
      const served = BUSINESS_PHASES[tool.id].phasesServed
      expect(
        served,
        `BUSINESS ${tool.id}: frameworkPhase ${tool.frameworkPhase} not in phasesServed`
      ).toContain(tool.frameworkPhase)
    }
  })
})

describe('phaseResourceMap — value integrity', () => {
  const allEntries: [string, PhaseResource][] = [
    ...Object.entries(LEARN_PHASES),
    ...Object.entries(BUSINESS_PHASES),
    ...Object.entries(PLAYGROUND_PHASES),
    ...Object.entries(REFERENCE_PHASES),
  ]

  it('every phasesServed is non-empty and contains only valid PhaseIds', () => {
    for (const [id, r] of allEntries) {
      expect(r.phasesServed.length, `${id}: empty phasesServed`).toBeGreaterThan(0)
      for (const p of r.phasesServed) {
        expect(PHASE_ORDER, `${id}: invalid PhaseId ${p}`).toContain(p)
      }
    }
  })

  it('every resource declares at least one leg', () => {
    for (const [id, r] of allEntries) {
      expect(r.legs.length, `${id}: no legs`).toBeGreaterThan(0)
    }
  })
})
