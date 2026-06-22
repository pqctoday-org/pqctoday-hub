// SPDX-License-Identifier: GPL-3.0-only
/**
 * Wave-1 drift-guard for the Applied Quantum `frameworkPhase` tags scattered
 * across the downstream registries.
 *
 * The canonical phase model lives in `./frameworkPhases.ts`. Every registry
 * that tags an entry with a `frameworkPhase` is a *lens* over that model and
 * must not drift from it. This test asserts:
 *
 *   1. Every tagged `frameworkPhase` value (scalar or array) across all
 *      registries is a valid `PhaseId` (∈ `PHASE_ORDER`).
 *   2. Spine consistency — for every business tool whose `id` equals a `ref`
 *      inside some `FRAMEWORK_PHASES[p].produce`, that tool's `frameworkPhase`
 *      must equal `p`. This is the key guard: the tag cannot drift from the
 *      phase model's own produce-pointers.
 *   3. No tagged entry is left untagged — `frameworkPhase` is defined on every
 *      entry of every registry covered here.
 *
 * Registries imported cleanly and covered:
 *   - BUSINESS_TOOLS            (businessToolsRegistry.tsx)  array, scalar tag
 *   - ASSESS_STEP_MAPPINGS      (assessStepToCswp39.ts)      record, scalar tag
 *   - REPORT_SECTION_TO_CSWP39  (reportSectionToCswp39.ts)   record, scalar|array
 *   - MIGRATION_STEPS           (migrationWorkflowData.ts)   array, scalar|array
 *   - PQC_TIMELINE_EVENTS       (regulatoryTimelines.ts)     array, scalar tag
 *   - REGULATORY_PHASE          (regulatoryTimelines.ts)     record of PhaseId
 *   - MODULE_CATALOG            (PKILearning/moduleData.ts)  record, scalar|array
 */
import { describe, it, expect } from 'vitest'
import { FRAMEWORK_PHASES, PHASE_ORDER } from './frameworkPhases'
import type { PhaseId } from './frameworkPhases'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { ASSESS_STEP_MAPPINGS } from './assessStepToCswp39'
import { REPORT_SECTION_TO_CSWP39 } from './reportSectionToCswp39'
import { MIGRATION_STEPS } from './migrationWorkflowData'
import { PQC_TIMELINE_EVENTS, REGULATORY_PHASE } from './regulatoryTimelines'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

const PHASE_SET: Set<PhaseId> = new Set(PHASE_ORDER)

/** Normalise a scalar-or-array phase tag to a flat list for assertions. */
function asList(tag: PhaseId | PhaseId[]): PhaseId[] {
  return Array.isArray(tag) ? tag : [tag]
}

describe('frameworkPhase tag validity (1: ∈ PHASE_ORDER)', () => {
  it('PHASE_ORDER and FRAMEWORK_PHASES agree (self-check of the guard)', () => {
    expect(PHASE_SET.size).toBe(PHASE_ORDER.length)
    for (const id of PHASE_ORDER) expect(FRAMEWORK_PHASES[id]).toBeTruthy()
  })

  it('every BUSINESS_TOOLS frameworkPhase is a valid PhaseId', () => {
    for (const tool of BUSINESS_TOOLS) {
      expect(PHASE_SET.has(tool.frameworkPhase), `${tool.id} → ${tool.frameworkPhase}`).toBe(true)
    }
  })

  it('every ASSESS_STEP_MAPPINGS frameworkPhase is a valid PhaseId', () => {
    for (const [key, m] of Object.entries(ASSESS_STEP_MAPPINGS)) {
      expect(PHASE_SET.has(m.frameworkPhase), `${key} → ${m.frameworkPhase}`).toBe(true)
    }
  })

  it('every REPORT_SECTION_TO_CSWP39 frameworkPhase is a valid PhaseId', () => {
    for (const [key, s] of Object.entries(REPORT_SECTION_TO_CSWP39)) {
      for (const p of asList(s.frameworkPhase)) {
        expect(PHASE_SET.has(p), `${key} → ${p}`).toBe(true)
      }
    }
  })

  it('every MIGRATION_STEPS frameworkPhase is a valid PhaseId', () => {
    for (const step of MIGRATION_STEPS) {
      for (const p of asList(step.frameworkPhase)) {
        expect(PHASE_SET.has(p), `${step.id} → ${p}`).toBe(true)
      }
    }
  })

  it('every PQC_TIMELINE_EVENTS frameworkPhase is a valid PhaseId', () => {
    for (const e of PQC_TIMELINE_EVENTS) {
      expect(PHASE_SET.has(e.frameworkPhase), `${e.event} → ${e.frameworkPhase}`).toBe(true)
    }
  })

  it('every REGULATORY_PHASE value is a valid PhaseId', () => {
    for (const [key, p] of Object.entries(REGULATORY_PHASE)) {
      expect(PHASE_SET.has(p), `${key} → ${p}`).toBe(true)
    }
  })

  it('every MODULE_CATALOG frameworkPhase is a valid PhaseId', () => {
    for (const [key, m] of Object.entries(MODULE_CATALOG)) {
      for (const p of asList(m.frameworkPhase)) {
        expect(PHASE_SET.has(p), `${key} → ${p}`).toBe(true)
      }
    }
  })
})

describe('spine consistency (2: produce-ref ↔ tool tag)', () => {
  // Build phase ← ref index from FRAMEWORK_PHASES[p].produce. A produce-ref is a
  // pointer to a concrete surface; where that ref names a business tool id, the
  // tool's own frameworkPhase must match the phase that claims to produce it.
  const refToPhase = new Map<string, PhaseId>()
  for (const id of PHASE_ORDER) {
    for (const surface of FRAMEWORK_PHASES[id].produce ?? []) {
      // A given ref should not be produced by two different phases; if the model
      // ever does that, surface it loudly rather than silently overwriting.
      const prior = refToPhase.get(surface.ref)
      expect(
        prior === undefined || prior === id,
        `ref "${surface.ref}" claimed by ${prior} and ${id}`
      ).toBe(true)
      refToPhase.set(surface.ref, id)
    }
  }

  const toolById = new Map(BUSINESS_TOOLS.map((t) => [t.id, t]))

  it('the phase model produces at least one business-tool ref (guard is live)', () => {
    const matched = [...refToPhase.keys()].filter((ref) => toolById.has(ref))
    expect(matched.length).toBeGreaterThan(0)
  })

  it('every business tool that is a produce-ref carries the producing phase tag', () => {
    for (const [ref, phase] of refToPhase) {
      const tool = toolById.get(ref)
      if (!tool) continue // produce-ref is a non-tool surface (e.g. a page route)
      expect(
        tool.frameworkPhase,
        `tool "${ref}" tag drifted from FRAMEWORK_PHASES.${phase}.produce`
      ).toBe(phase)
    }
  })
})

describe('completeness (3: nothing untagged)', () => {
  it('every BUSINESS_TOOLS entry has a frameworkPhase', () => {
    for (const tool of BUSINESS_TOOLS) {
      expect(tool.frameworkPhase, `${tool.id} untagged`).toBeDefined()
    }
  })

  it('every ASSESS_STEP_MAPPINGS entry has a frameworkPhase', () => {
    for (const [key, m] of Object.entries(ASSESS_STEP_MAPPINGS)) {
      expect(m.frameworkPhase, `${key} untagged`).toBeDefined()
    }
  })

  it('every REPORT_SECTION_TO_CSWP39 entry has a frameworkPhase', () => {
    for (const [key, s] of Object.entries(REPORT_SECTION_TO_CSWP39)) {
      expect(s.frameworkPhase, `${key} untagged`).toBeDefined()
      expect(asList(s.frameworkPhase).length, `${key} empty tag`).toBeGreaterThan(0)
    }
  })

  it('every MIGRATION_STEPS entry has a frameworkPhase', () => {
    for (const step of MIGRATION_STEPS) {
      expect(step.frameworkPhase, `${step.id} untagged`).toBeDefined()
      expect(asList(step.frameworkPhase).length).toBeGreaterThan(0)
    }
  })

  it('every PQC_TIMELINE_EVENTS entry has a frameworkPhase', () => {
    for (const e of PQC_TIMELINE_EVENTS) {
      expect(e.frameworkPhase, `${e.event} untagged`).toBeDefined()
    }
  })

  it('every MODULE_CATALOG entry has a frameworkPhase', () => {
    for (const [key, m] of Object.entries(MODULE_CATALOG)) {
      expect(m.frameworkPhase, `${key} untagged`).toBeDefined()
      expect(asList(m.frameworkPhase).length, `${key} empty tag`).toBeGreaterThan(0)
    }
  })
})
