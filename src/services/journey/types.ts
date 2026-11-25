// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The journey's data shapes (design note 5.1, section 10; UX handoff section 14). Objectives and
 * their steps are stored by canonical tag, never by route. Text that the Hub already holds
 * (a lesson's title, a stage's name) is not copied here: it is read again when it is shown.
 */

export type ObjectiveState = 'active' | 'paused' | 'completed'

/** Module: a lesson. Answer: a saved Assistant answer. Business tool: a Business Center tool. Self-assessed: the learner confirms it. */
export type StepKind = 'module' | 'answer' | 'business-tool' | 'self-assessed'

export type StepStatus = 'completed' | 'now' | 'not-started'

/** Why a step is in an objective: it matches the goal, or it is a "take first" lesson of another step. */
export type StepOrigin = { type: 'match' } | { type: 'take-first'; for: string }

export interface Step {
  id: string
  position: number
  kind: StepKind
  /** The canonical tag of the thing the step is: `LM-008` for a lesson. */
  resourceTag: string
  required: boolean
  /** The learner put this step off in this objective; it does not block completion and stays listed. */
  deferred?: boolean
  origin: StepOrigin
}

export interface Checkpoint {
  /** Where the learner is in the objective, as the views it passed through. */
  path: string[]
  stepId: string | null
  /** The tag of the section the learner was reading (`LM-008/s:<id>`), if any. */
  sectionTag?: string
  /** Where Back goes: where the learner started from. */
  returnTo?: string
}

export interface Objective {
  id: string
  /** The persona id the objective belongs to, or `none` when no role was set. */
  role: string
  /** The learner's own words. */
  goal: string
  state: ObjectiveState
  steps: Step[]
  checkpoint: Checkpoint
  createdAt: number
  updatedAt: number
  completedAt?: number
}

/** A lesson or step the learner has completed. Shared by every objective that holds the same tag. */
export interface Completion {
  tag: string
  kind: 'completed'
  source: 'self' | 'objective'
  at: number
  /** The lesson's content version when it was completed, so a later revision can be told from it. */
  revision?: number
}

/** The role switch the learner just made, kept for the undo note (not stored on the device). */
export interface RoleSwitchNote {
  from: string | null
  to: string | null
  at: number
}

/** Where a page was opened from, for Back (UX handoff 5.2: Back never goes to the previous step). */
export type JourneyOrigin = 'journey' | 'all-modules' | 'link'

export const NO_ROLE = 'none'
