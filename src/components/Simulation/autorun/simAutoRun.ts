// SPDX-License-Identifier: GPL-3.0-only
/**
 * simAutoRun — the director for the simulation auto-run.
 *
 * It walks the REAL phase trees and drives each GATING step to genuine completion
 * through the same store actions the player's clicks call, so the sim truly
 * progresses (phases reach their maturity bands, the run completes) rather than
 * being faked. The SAME walk is the backbone of the validation harness
 * (`simAutoRun.test.ts`): drive every gating step, assert each completes and every
 * lifecycle phase reaches the win level.
 *
 * Design facts it relies on (see the plan doc + embedContract.ts):
 *  - Completion is read from hub state via `isStepComplete` — the exact predicate
 *    the sim uses, reused here so the walk can't drift from the app.
 *  - Activity completion is keyed by artifact TYPE: one real document of a type
 *    satisfies every step of that type. The director records that real document
 *    via `addExecutiveDocument` (NOT the AI-delegation shortcut, which writes none).
 *  - `scenario` (sandbox-lab) steps are NON-gating and need a live sandbox, so the
 *    director SKIPS them; the run completes without them.
 *  - Org context is set on the reset-safe sim store — never on the user's
 *    persisted assessment / persona / Migrate selection.
 */
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import { SIM_TREES, flattenTree, isGatingStep, achievedTreeLevel } from '@/simulation'
import type { TreeStep, PhaseTree } from '@/simulation'
import { isStepComplete, type StepCompletionContext } from '../embedContract'
import { PHASE_ORDER, LIFECYCLE_PHASES, type PhaseId } from '@/data/frameworkPhases'
import { PHASE_WIN_LEVEL } from '@/data/phaseMaturity'
import { demoDocFor } from './demoDocs'

/** SIM_TREES is keyed by PhaseId; centralise the typed-key read so the safe
 *  dynamic index lives behind one suppression rather than scattered call sites. */
function treeFor(phase: PhaseId): PhaseTree | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return SIM_TREES[phase]
}
const hasTree = (phase: PhaseId): boolean => Boolean(treeFor(phase))

/** A live completion context read fresh from the hub stores on every call — the
 *  same six predicates the sim builds in `SimulationView`. */
export function liveCompletionContext(): StepCompletionContext {
  return {
    // eslint-disable-next-line security/detect-object-injection
    isModuleComplete: (id) => useModuleStore.getState().modules[id]?.status === 'completed',
    hasArtifact: (t) =>
      (useModuleStore.getState().artifacts.executiveDocuments ?? []).some((d) => d.type === t),
    isRefVisited: (id) => useSimulationStore.getState().visitedRefs.includes(id),
    isWorkshopComplete: (id) => useSimulationStore.getState().visitedWorkshops.includes(id),
    isCatalogStepDone: (id) => useSimulationStore.getState().catalogCompleted.includes(id),
    isScenarioComplete: (id) => useSimulationStore.getState().visitedScenarios.includes(id),
  }
}

/** The ordered, gating (non-scenario) steps of a phase, in unlock order. */
export function gatingStepsForPhase(phase: PhaseId): TreeStep[] {
  const tree = treeFor(phase)
  return tree ? flattenTree(tree).filter(isGatingStep) : []
}

/** The maturity level a phase has currently EARNED from live hub state. */
export function levelOfPhase(
  phase: PhaseId,
  ctx: StepCompletionContext = liveCompletionContext()
): number {
  const tree = treeFor(phase)
  return tree ? achievedTreeLevel(tree, (s) => isStepComplete(s, ctx)) : 0
}

/**
 * Genuinely complete one step via the real store action for its kind. Scenario
 * (sandbox-lab) steps are intentionally skipped — they are non-gating and require
 * a live sandbox. Returns true if an action was taken.
 */
export function completeStepGenuine(step: TreeStep): boolean {
  const sim = useSimulationStore.getState()
  const mod = useModuleStore.getState()
  switch (step.kind) {
    case 'learn':
      if (!step.moduleId) return false
      mod.updateModuleProgress(step.moduleId, { status: 'completed' })
      return true
    case 'reference':
      if (!step.refId) return false
      sim.markRefVisited(step.refId)
      return true
    case 'workshop':
      if (!step.workshopId) return false
      sim.markWorkshopVisited(step.workshopId)
      return true
    case 'catalog':
      if (!step.catalogId) return false
      sim.markCatalogStepDone(step.catalogId)
      return true
    case 'activity': {
      if (!step.artifactType) return false
      const doc = demoDocFor(step.artifactType)
      mod.addExecutiveDocument({
        id: `sim-autorun-${step.artifactType}`,
        moduleId: 'sim-autorun',
        type: step.artifactType,
        title: doc.title,
        data: doc.data,
        createdAt: Date.now(),
      })
      return true
    }
    case 'scenario':
      // Non-gating sandbox lab — needs a live sandbox; skipped on purpose.
      return false
    default:
      return false
  }
}

export interface PhaseRunResult {
  phase: PhaseId
  /** Maturity level earned after the walk. */
  level: number
  /** Number of gating steps in the phase. */
  gating: number
  /** Number of gating steps confirmed complete. */
  completed: number
  /** Whether the phase reached the run win level. */
  cleared: boolean
}

export interface AutoRunReport {
  phases: PhaseRunResult[]
  /** True when every lifecycle phase reached the win level (the run-end ceremony). */
  runComplete: boolean
}

/** One (phase, gating step) the live player walks, in unlock order. */
export interface AutoRunQueueItem {
  phase: PhaseId
  step: TreeStep
}

/** The full ordered list of gating steps across every phase that has a tree — the
 *  queue the live playthrough steps through (scenario steps are already excluded
 *  as non-gating). */
export function autoRunQueue(): AutoRunQueueItem[] {
  const items: AutoRunQueueItem[] = []
  for (const phase of PHASE_ORDER.filter(hasTree)) {
    for (const step of gatingStepsForPhase(phase)) items.push({ phase, step })
  }
  return items
}

export interface DriveOptions {
  /** Restrict the walk to these phases (default: every phase with a tree). */
  phases?: PhaseId[]
  /** Called after each step is driven — for live narration / progress. */
  onStep?: (step: TreeStep, phase: PhaseId, index: number, total: number) => void
}

/**
 * Drive the gating steps of the given phases (default: all) to genuine completion.
 * `setSel` is moved per phase so a live overlay shows the active phase; for the
 * headless validation walk this is harmless (completion is global state).
 */
export function driveAllPhases(opts: DriveOptions = {}): AutoRunReport {
  const phases = opts.phases ?? PHASE_ORDER.filter(hasTree)
  for (const phase of phases) {
    useSimulationStore.getState().setSel(phase)
    const steps = gatingStepsForPhase(phase)
    steps.forEach((step, i) => {
      completeStepGenuine(step)
      opts.onStep?.(step, phase, i, steps.length)
    })
  }

  const ctx = liveCompletionContext()
  const results: PhaseRunResult[] = PHASE_ORDER.filter(hasTree).map((phase) => {
    const gating = gatingStepsForPhase(phase)
    const completed = gating.filter((s) => isStepComplete(s, ctx)).length
    const level = levelOfPhase(phase, ctx)
    return { phase, level, gating: gating.length, completed, cleared: level >= PHASE_WIN_LEVEL }
  })
  const runComplete = LIFECYCLE_PHASES.every((p) => levelOfPhase(p, ctx) >= PHASE_WIN_LEVEL)
  return { phases: results, runComplete }
}
