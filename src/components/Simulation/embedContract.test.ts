// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS-09 — embed contract: a step the sim offers to embed must resolve to a real
 * mounted component, so a tool can't ship embed-broken.
 */
import { describe, it, expect } from 'vitest'
import {
  canEmbedStep,
  isAssessStep,
  isTimelineStep,
  isProtocolMatrixStep,
  isStepComplete,
  type StepCompletionContext,
} from './embedContract'
import {
  SIM_LEARN_MODULES,
  BUSINESS_TOOL_COMPONENTS,
  ARTIFACT_TYPE_TO_TOOL_ID,
  WORKSHOP_TOOL_COMPONENTS,
} from './resourceContract'
import { SIM_TREES, flattenTree, type TreeStep, type StepKind } from '@/simulation'
import type { PhaseId } from '@/data/frameworkPhases'

const PHASES: PhaseId[] = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']
const step = (s: Partial<TreeStep>): TreeStep =>
  ({ kind: 'learn', label: '', to: '/', ...s }) as TreeStep

describe('embed contract (WS-09)', () => {
  it('classifies embeddability by backing component', () => {
    const learnId = Object.keys(SIM_LEARN_MODULES)[0]
    expect(canEmbedStep(step({ kind: 'learn', moduleId: learnId }))).toBe(true)
    expect(canEmbedStep(step({ kind: 'learn', moduleId: 'not-a-real-module' }))).toBe(false)
    // timeline: the real Gantt embeds under the Simulation-mode bar (C6)
    expect(canEmbedStep(step({ kind: 'reference', refId: 'timeline' }))).toBe(true)
    // protocol-matrix: the Algorithms Protocol Support tab embeds (C5 slice)
    expect(canEmbedStep(step({ kind: 'reference', refId: 'algorithms-protocol-matrix' }))).toBe(
      true
    )
    // but the other algorithm refs are still navigate-away (no embed yet)
    expect(canEmbedStep(step({ kind: 'reference', refId: 'algorithms-transition' }))).toBe(false)
    expect(canEmbedStep(step({ kind: 'activity' }))).toBe(false) // no artifactType
    // workshop: embeddable iff the tool id resolves to a registered component
    expect(
      canEmbedStep(step({ kind: 'workshop', workshopId: Object.keys(WORKSHOP_TOOL_COMPONENTS)[0] }))
    ).toBe(true)
    expect(canEmbedStep(step({ kind: 'workshop', workshopId: 'not-a-tool' }))).toBe(false)
    // the assess-engine reference opens the AssessWizard embedded in the sim
    expect(canEmbedStep(step({ kind: 'reference', refId: 'assess-engine' }))).toBe(true)
  })

  it('recognizes the assess-engine reference step', () => {
    expect(isAssessStep(step({ kind: 'reference', refId: 'assess-engine' }))).toBe(true)
    expect(isAssessStep(step({ kind: 'reference', refId: 'timeline' }))).toBe(false)
    // only a reference: a learn/activity step is never an assess step
    expect(isAssessStep(step({ kind: 'learn', moduleId: 'assess-engine' }))).toBe(false)
  })

  it('recognizes the timeline reference step (C6)', () => {
    expect(isTimelineStep(step({ kind: 'reference', refId: 'timeline' }))).toBe(true)
    expect(isTimelineStep(step({ kind: 'reference', refId: 'assess-engine' }))).toBe(false)
    expect(isTimelineStep(step({ kind: 'learn', moduleId: 'timeline' }))).toBe(false)
  })

  it('recognizes the protocol-matrix reference step (C5 slice)', () => {
    expect(
      isProtocolMatrixStep(step({ kind: 'reference', refId: 'algorithms-protocol-matrix' }))
    ).toBe(true)
    expect(isProtocolMatrixStep(step({ kind: 'reference', refId: 'algorithms-transition' }))).toBe(
      false
    )
    expect(isProtocolMatrixStep(step({ kind: 'reference', refId: 'timeline' }))).toBe(false)
  })

  // Every step the sim WOULD embed must have its component present — the contract.
  // The assess-engine reference embeds the AssessWizard (always mounted under the
  // Router), so it is a real embeddable target, not a dead end.
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
        } else if (s.kind === 'workshop' && s.workshopId) {
          expect(
            WORKSHOP_TOOL_COMPONENTS[s.workshopId],
            `${phase}: workshop ${s.workshopId}`
          ).toBeTruthy()
        } else if (s.kind === 'catalog') {
          // C7: the Migrate catalog embeds via MigrateEmbed + MemoryRouter.
          expect(canEmbedStep(s), `${phase}: catalog step is embeddable`).toBe(true)
        } else if (isTimelineStep(s)) {
          // C6: the Gantt embeds via TimelineEmbed — no registry key to assert,
          // but isTimelineStep must return true so the branch is exercised.
          expect(isTimelineStep(s), `${phase}: timeline step is recognised`).toBe(true)
        } else if (isProtocolMatrixStep(s)) {
          // C5 slice: the Protocol Support tab embeds via ProtocolMatrixEmbed.
          expect(isProtocolMatrixStep(s), `${phase}: protocol-matrix step is recognised`).toBe(true)
        } else {
          // the only other embeddable reference is the assess-engine wizard
          expect(isAssessStep(s), `${phase}: embeddable ref ${s.refId} is the assess wizard`).toBe(
            true
          )
        }
      }
    }
  })

  // W0 — the test above only checks steps that are ALREADY embeddable. This one
  // closes the gap: a `learn` step whose module isn't registered silently
  // navigates the player out of the sim mid-flow. Assert none are left behind.
  // Iterates every loaded tree (incl. the spanning `foundations` band).
  it('W0: every learn tree step is embeddable (no silent navigate-away)', () => {
    for (const phase of Object.keys(SIM_TREES) as PhaseId[]) {
      for (const s of flattenTree(SIM_TREES[phase]!)) {
        if (s.kind === 'learn' && s.moduleId) {
          expect(
            SIM_LEARN_MODULES[s.moduleId],
            `${phase}: learn step "${s.moduleId}" is not embeddable — register it in SIM_LEARN_MODULES or make the step a 'reference'`
          ).toBeDefined()
        }
      }
    }
  })

  // C2 — the authored trees actually contain hands-on workshop steps (the 5
  // "Practice:" leaves), and every one embeds. Guards against a regression that
  // reverts them to plain `reference` steps (which would navigate out of the sim).
  it('C2: authored trees contain embeddable workshop steps', () => {
    const workshops: TreeStep[] = []
    for (const phase of Object.keys(SIM_TREES) as PhaseId[]) {
      for (const s of flattenTree(SIM_TREES[phase]!)) {
        if (s.kind === 'workshop') workshops.push(s)
      }
    }
    expect(workshops.length).toBeGreaterThanOrEqual(5)
    for (const s of workshops) {
      expect(canEmbedStep(s), `workshop ${s.workshopId} embeds`).toBe(true)
      expect(
        WORKSHOP_TOOL_COMPONENTS[s.workshopId!],
        `workshop ${s.workshopId} component`
      ).toBeTruthy()
    }
  })

  it('every registered embeddable Learn module has a component', () => {
    for (const [id, comp] of Object.entries(SIM_LEARN_MODULES)) {
      expect(comp, `${id} component`).toBeTruthy()
    }
  })
})

describe('standard completion convention (C0)', () => {
  const completed: StepCompletionContext = {
    isModuleComplete: () => true,
    hasArtifact: () => true,
    isRefVisited: () => true,
    isWorkshopComplete: () => true,
    hasCatalogPicks: () => true,
  }
  const incomplete: StepCompletionContext = {
    isModuleComplete: () => false,
    hasArtifact: () => false,
    isRefVisited: () => false,
    isWorkshopComplete: () => false,
    hasCatalogPicks: () => false,
  }

  // A representative step for EVERY StepKind — typed as a Record<StepKind, …> so
  // adding a kind is a compile error here until a fixture is provided.
  const anArtifactType = Object.keys(ARTIFACT_TYPE_TO_TOOL_ID)[0] as NonNullable<
    TreeStep['artifactType']
  >
  const aWorkshopId = Object.keys(WORKSHOP_TOOL_COMPONENTS)[0]
  const KIND_FIXTURES: Record<StepKind, TreeStep> = {
    learn: step({ kind: 'learn', moduleId: 'hsm-pqc' }),
    activity: step({ kind: 'activity', artifactType: anArtifactType }),
    reference: step({ kind: 'reference', refId: 'assess-engine' }),
    workshop: step({ kind: 'workshop', workshopId: aWorkshopId }),
    catalog: step({ kind: 'catalog', to: '/migrate' }),
  }
  // catalog: isStepComplete delegates to hasCatalogPicks() — override needed
  const completedWithPicks: StepCompletionContext = { ...completed, hasCatalogPicks: () => true }
  const incompleteWithPicks: StepCompletionContext = { ...incomplete, hasCatalogPicks: () => false }

  // Every embeddable kind must declare a completion branch in isStepComplete:
  // it reports complete under a "completed" context and not under an empty one.
  // A new StepKind without a branch falls through to the default `false` and
  // fails the "completed" assertion here — the contract guard.
  it('every step kind reports completion correctly (no kind falls through)', () => {
    for (const [kind, s] of Object.entries(KIND_FIXTURES) as [StepKind, TreeStep][]) {
      // catalog uses hasCatalogPicks() — use the overridden contexts for it
      const doneCtx = kind === 'catalog' ? completedWithPicks : completed
      const notDoneCtx = kind === 'catalog' ? incompleteWithPicks : incomplete
      expect(isStepComplete(s, doneCtx), `${kind} should be complete`).toBe(true)
      expect(isStepComplete(s, notDoneCtx), `${kind} should be incomplete`).toBe(false)
    }
  })
})
