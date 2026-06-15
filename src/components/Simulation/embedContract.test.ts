// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS-09 — embed contract: a step the sim offers to embed must resolve to a real
 * mounted component, so a tool can't ship embed-broken.
 */
import { describe, it, expect } from 'vitest'
import { canEmbedStep } from './embedContract'
import {
  SIM_LEARN_MODULES,
  BUSINESS_TOOL_COMPONENTS,
  ARTIFACT_TYPE_TO_TOOL_ID,
} from './resourceContract'
import { SIM_TREES, flattenTree, type TreeStep } from '@/simulation'
import type { PhaseId } from '@/data/frameworkPhases'

const PHASES: PhaseId[] = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
const step = (s: Partial<TreeStep>): TreeStep =>
  ({ kind: 'learn', label: '', to: '/', ...s }) as TreeStep

describe('embed contract (WS-09)', () => {
  it('classifies embeddability by backing component', () => {
    const learnId = Object.keys(SIM_LEARN_MODULES)[0]
    expect(canEmbedStep(step({ kind: 'learn', moduleId: learnId }))).toBe(true)
    expect(canEmbedStep(step({ kind: 'learn', moduleId: 'not-a-real-module' }))).toBe(false)
    expect(canEmbedStep(step({ kind: 'reference', refId: 'timeline' }))).toBe(false)
    expect(canEmbedStep(step({ kind: 'activity' }))).toBe(false) // no artifactType
  })

  // Every step the sim WOULD embed must have its component present — the contract.
  it('every embeddable tree step resolves to a mounted component', () => {
    for (const phase of PHASES) {
      for (const s of flattenTree(SIM_TREES[phase]!)) {
        if (!canEmbedStep(s)) continue
        if (s.kind === 'learn' && s.moduleId) {
          expect(SIM_LEARN_MODULES[s.moduleId], `${phase}: learn ${s.moduleId}`).toBeDefined()
        } else if (s.kind === 'activity' && s.artifactType) {
          const toolId = ARTIFACT_TYPE_TO_TOOL_ID[s.artifactType]
          expect(
            toolId ? BUSINESS_TOOL_COMPONENTS[toolId] : undefined,
            `${phase}: activity ${s.artifactType}`
          ).toBeTruthy()
        }
      }
    }
  })

  it('every registered embeddable Learn module has a component', () => {
    for (const [id, comp] of Object.entries(SIM_LEARN_MODULES)) {
      expect(comp, `${id} component`).toBeTruthy()
    }
  })
})
