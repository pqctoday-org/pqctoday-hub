// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Step status, Next gating, Back rules and the completion check (UX handoff 5.2, 6.5). Pure
 * functions: the same objective and the same completion signal always give the same answer.
 *
 * "Done" is a predicate the caller supplies. The journey passes the tags the learner marked
 * complete plus the Hub's own completion signal for a finished lesson; comments, saved answers and
 * tracked outputs never come into it (they are never proof, decisions J04, C04, O05).
 */
import type { JourneyOrigin, Objective, Step, StepStatus } from './types'

export type IsDone = (resourceTag: string) => boolean

/** Copy that the rules return verbatim (UX handoff copy deck, section 12). */
export const COPY = {
  stepHint: 'Mark this step complete to unlock Next.',
  stepAhead: 'Not started. You can read it, but it only counts once the earlier steps are done.',
  stepLastBlocked: 'Finish the earlier steps first.',
  stepLast: 'Complete the objective… →',
  paused: 'This objective is paused. Resume it to continue.',
  completed: 'This objective is complete. Reopen it to continue.',
  completeBlockedReview:
    'The module steps are not complete yet, so this objective cannot be completed.',
  completeBlocked: 'Finish the earlier required steps first, then confirm the last one.',
  completeAllowed: 'All other required steps are done. Confirm the last one yourself.',
} as const

/** The steps shown in the step bar: the required ones, in order. */
export function barSteps(obj: Objective): Step[] {
  return obj.steps.filter((s) => s.required).sort((a, b) => a.position - b.position)
}

/** The optional steps, in order. They are listed apart and never counted in "n of m required". */
export function optionalSteps(obj: Objective): Step[] {
  return obj.steps.filter((s) => !s.required).sort((a, b) => a.position - b.position)
}

/** Required steps that count: the deferred ones are listed but do not block. */
export function countedSteps(obj: Objective): Step[] {
  return barSteps(obj).filter((s) => !s.deferred)
}

/** The step marked "Now": the first counted step that is not done. Null when every counted step is done. */
export function nowStep(obj: Objective, isDone: IsDone): Step | null {
  return countedSteps(obj).find((s) => !isDone(s.resourceTag)) ?? null
}

/** Completed, Now or Not started for every step of the bar. Exactly one step is Now while any is open. */
export function stepStatuses(obj: Objective, isDone: IsDone): Map<string, StepStatus> {
  const now = nowStep(obj, isDone)
  const out = new Map<string, StepStatus>()
  for (const s of barSteps(obj)) {
    out.set(s.id, isDone(s.resourceTag) ? 'completed' : s.id === now?.id ? 'now' : 'not-started')
  }
  return out
}

/** "2 of 4 required": done and total over the counted steps. */
export function requiredProgress(obj: Objective, isDone: IsDone): { done: number; total: number } {
  const counted = countedSteps(obj)
  return { done: counted.filter((s) => isDone(s.resourceTag)).length, total: counted.length }
}

export interface NextControl {
  /** `next` moves to another step; `complete` opens the complete panel from the last step. */
  kind: 'next' | 'complete'
  enabled: boolean
  /** The step Next opens; null for `complete`. */
  targetStepId: string | null
  /** The line shown under the bar when Next is off or the step is last and blocked. */
  hint: string | null
}

/**
 * What Next does on `currentStepId`. Enabled only when the current step is done; on the last step
 * it becomes "Complete the objective…" and opens the complete panel. A paused or completed
 * objective keeps its steps readable and says why Next is off.
 */
export function nextControl(obj: Objective, currentStepId: string, isDone: IsDone): NextControl {
  const bar = barSteps(obj)
  const at = bar.findIndex((s) => s.id === currentStepId)
  const here = bar[at] // eslint-disable-line security/detect-object-injection
  const last = at === bar.length - 1
  if (obj.state !== 'active') {
    return {
      kind: last ? 'complete' : 'next',
      enabled: false,
      targetStepId: null,
      hint: obj.state === 'paused' ? COPY.paused : COPY.completed,
    }
  }
  if (last) {
    const earlierOpen = bar.slice(0, -1).some((s) => !s.deferred && !isDone(s.resourceTag))
    return {
      kind: 'complete',
      enabled: true,
      targetStepId: null,
      hint: earlierOpen ? COPY.stepLastBlocked : null,
    }
  }
  const done = here ? isDone(here.resourceTag) : false
  return {
    kind: 'next',
    enabled: done,
    targetStepId: done ? (bar[at + 1]?.id ?? null) : null,
    hint: done ? null : COPY.stepHint,
  }
}

/** The step before `currentStepId` in the bar, or null on the first. */
export function previousStep(obj: Objective, currentStepId: string): Step | null {
  const bar = barSteps(obj)
  const at = bar.findIndex((s) => s.id === currentStepId)
  return at > 0 ? (bar[at - 1] ?? null) : null
}

/** The step after `currentStepId` in the bar, or null on the last. */
export function followingStep(obj: Objective, currentStepId: string): Step | null {
  const bar = barSteps(obj)
  const at = bar.findIndex((s) => s.id === currentStepId)
  return at >= 0 ? (bar[at + 1] ?? null) : null
}

/** True when the step is read ahead of the earlier ones ("Not started. You can read it, but ..."). */
export function isReadingAhead(obj: Objective, stepId: string, isDone: IsDone): boolean {
  const statuses = stepStatuses(obj, isDone)
  return statuses.get(stepId) === 'not-started' && !obj.steps.find((s) => s.id === stepId)?.deferred
}

/**
 * Back goes to where the learner started, never to the previous step (UX handoff 5.2). The
 * returned `to` is an address; `history` means the browser's own Back.
 */
export function backTarget(origin: JourneyOrigin): { to: string | 'history'; label: string } {
  if (origin === 'journey') return { to: '/learn?mode=journey', label: 'Back to Your journey' }
  if (origin === 'all-modules') return { to: '/learn?mode=browse', label: 'Back to All modules' }
  return { to: 'history', label: 'Back' }
}

export type CompleteState = 'blocked-review' | 'blocked' | 'allowed'

export interface CompleteCheck {
  state: CompleteState
  /** Required steps (other than the last, self-assessed one) that are not done. */
  blockers: Step[]
  /** The first unfinished required step: where the "go" button leads. */
  goStep: Step | null
  /** The last step, which the learner confirms in the panel itself. */
  confirmStep: Step | null
  note: string
}

/**
 * The complete panel's state. Allowed only when every other required step is done and the
 * learner then confirms the last one; blocked otherwise, with the first unfinished step named.
 */
export function completeCheck(obj: Objective, isDone: IsDone): CompleteCheck {
  const counted = countedSteps(obj)
  const lastStep = counted[counted.length - 1] ?? null
  const confirmStep = lastStep?.kind === 'self-assessed' ? lastStep : null
  const rest = confirmStep ? counted.slice(0, -1) : counted
  const blockers = rest.filter((s) => !isDone(s.resourceTag))
  if (blockers.length === 0) {
    return {
      state: 'allowed',
      blockers,
      goStep: null,
      confirmStep,
      note: COPY.completeAllowed,
    }
  }
  const onlyModules = blockers.every((s) => s.kind === 'module')
  return {
    state: onlyModules ? 'blocked-review' : 'blocked',
    blockers,
    goStep: blockers[0] ?? null,
    confirmStep,
    note: onlyModules ? COPY.completeBlockedReview : COPY.completeBlocked,
  }
}

/** True when an objective of this state shows its steps read-only. */
export function isReadOnly(obj: Objective): boolean {
  return obj.state !== 'active'
}

/** The objective to focus after `pausedId` is paused: the next active one, or null when none is left. */
export function focusAfterPause(objectives: readonly Objective[], pausedId: string): string | null {
  const paused = objectives.find((o) => o.id === pausedId)
  if (!paused) return null
  return (
    objectives.find((o) => o.id !== pausedId && o.role === paused.role && o.state === 'active')
      ?.id ?? null
  )
}
