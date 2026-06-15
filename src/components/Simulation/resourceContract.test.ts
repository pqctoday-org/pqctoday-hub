// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS-07 — contract test for the sim's external dependencies. If an upstream
 * feature renames/removes a symbol the sim relies on, this fails CI instead of
 * a player's run breaking at runtime.
 */
import { describe, it, expect } from 'vitest'
import {
  BUSINESS_TOOLS,
  ARTIFACT_TYPE_TO_TOOL_ID,
  BUSINESS_TOOL_COMPONENTS,
  MODULE_CATALOG,
  SIM_LEARN_MODULES,
  isEmbeddableModule,
  EmbeddedLearnProvider,
  WORKSHOP_TOOLS,
} from './resourceContract'
import { SIM_TREES, flattenTree } from '@/simulation'
import type { PhaseId } from '@/data/frameworkPhases'

const PHASES: PhaseId[] = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']

describe('sim resource contract (WS-07)', () => {
  it('exposes the BusinessCenter surface with the expected shape', () => {
    expect(Array.isArray(BUSINESS_TOOLS)).toBe(true)
    expect(BUSINESS_TOOLS.length).toBeGreaterThan(0)
    expect(BUSINESS_TOOLS[0]).toHaveProperty('id')
    expect(BUSINESS_TOOLS[0]).toHaveProperty('name')
    expect(typeof ARTIFACT_TYPE_TO_TOOL_ID).toBe('object')
    expect(typeof BUSINESS_TOOL_COMPONENTS).toBe('object')
  })

  it('exposes the PKILearning surface with the expected shape', () => {
    expect(typeof MODULE_CATALOG).toBe('object')
    expect(Object.keys(MODULE_CATALOG).length).toBeGreaterThan(0)
    expect(typeof SIM_LEARN_MODULES).toBe('object')
    expect(typeof isEmbeddableModule).toBe('function')
    expect(typeof EmbeddedLearnProvider).toBe('function')
  })

  it('exposes the Playground surface with the expected shape', () => {
    expect(Array.isArray(WORKSHOP_TOOLS)).toBe(true)
    expect(WORKSHOP_TOOLS.length).toBeGreaterThan(0)
    expect(WORKSHOP_TOOLS[0]).toHaveProperty('id')
    expect(WORKSHOP_TOOLS[0]).toHaveProperty('name')
  })

  // The contract that actually matters: every dep the trees reference resolves
  // through the facade. This couples the guard to real sim usage.
  it('every tree learn module + activity artifact resolves through the contract', () => {
    for (const phase of PHASES) {
      for (const s of flattenTree(SIM_TREES[phase]!)) {
        if (s.kind === 'learn' && s.moduleId) {
          expect(MODULE_CATALOG[s.moduleId], `${phase}: module ${s.moduleId}`).toBeDefined()
        }
        if (s.kind === 'activity' && s.artifactType) {
          const toolId = ARTIFACT_TYPE_TO_TOOL_ID[s.artifactType]
          expect(toolId, `${phase}: artifact ${s.artifactType} → tool`).toBeTruthy()
        }
      }
    }
  })

  it('every embeddable learn module the sim registers is a real module', () => {
    for (const id of Object.keys(SIM_LEARN_MODULES)) {
      expect(isEmbeddableModule(id), `${id} embeddable`).toBe(true)
      expect(MODULE_CATALOG[id], `${id} in catalog`).toBeDefined()
    }
  })
})
