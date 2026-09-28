// SPDX-License-Identifier: GPL-3.0-only
/**
 * 09-28 nav remediation (WP2) — the ONE definition of "this run has started".
 *
 * Difficulty may only change in place on a fresh run; after that, changing it
 * starts a new run. The Mode dial, the store's own guard and the seed/challenge
 * deep-link all read this, so there is no shorter UI-only proxy to drift.
 *
 * Counted: anything the run itself produced — turns and events, decisions and
 * evidence, visited resources, architecture choices, catalog picks/completion,
 * delegation, spend, traps, objectives, the run-complete ceremony.
 * Not counted: navigation-only state (selected phase/tab, an open pane, the
 * auto-run playhead) and `securedBudgetM`, which the view derives from hub
 * progress that can predate the run.
 *
 * The start turn is passed in (rather than imported from the store) so the
 * store can use this in its own guard without an import cycle.
 */
export interface RunStartedFields {
  year: number
  q: number
  crqcShift: number
  events: readonly unknown[]
  attempts: Record<string, unknown>
  evidence: readonly unknown[]
  visitedRefs: readonly string[]
  visitedWorkshops: readonly string[]
  visitedScenarios: readonly string[]
  edgeDecisions: Record<string, unknown>
  picks: readonly string[]
  catalogCompleted: readonly string[]
  auto: readonly string[]
  spentBudgetM: number
  trapsThisRun: number
  objectiveAchievedYears: Record<string, number>
  runCompleteSeen: boolean
}

export function hasRunStarted(s: RunStartedFields, start: { year: number; q: number }): boolean {
  return (
    s.year !== start.year ||
    s.q !== start.q ||
    s.crqcShift !== 0 ||
    s.events.length > 0 ||
    Object.keys(s.attempts).length > 0 ||
    s.evidence.length > 0 ||
    s.visitedRefs.length > 0 ||
    s.visitedWorkshops.length > 0 ||
    s.visitedScenarios.length > 0 ||
    Object.keys(s.edgeDecisions).length > 0 ||
    s.picks.length > 0 ||
    s.catalogCompleted.length > 0 ||
    s.auto.length > 0 ||
    s.spentBudgetM > 0 ||
    s.trapsThisRun > 0 ||
    Object.keys(s.objectiveAchievedYears).length > 0 ||
    s.runCompleteSeen
  )
}
