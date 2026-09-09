// SPDX-License-Identifier: GPL-3.0-only
/**
 * Simulation activity-tree types.
 *
 * A PhaseTree is the per-phase, per-maturity-level "run the play" the player
 * works through in the Simulation. It mirrors the Applied Quantum PQC Migration
 * Framework: each phase → maturity-level bands (L1–L4) → the framework's own
 * numbered Activities (0.1 … 7.7) → concrete leaf steps that map to REAL hub
 * resources (a Learn module, a Command-Center tool that emits an artifact, or a
 * reference page).
 *
 * Trees are date-stamped, self-contained snapshots under ./trees, emitted by
 * scripts/gen-sim-trees.mjs and loaded latest-date-wins by ./index.ts. They
 * evolve as hub coverage and/or the framework evolve — re-run the generator,
 * archive the older dated files.
 */
import type { PhaseId } from '@/data/frameworkPhases'
import type { MaturityLevelId } from '@/data/phaseMaturity'
import type { ExecutiveDocumentType } from '@/services/storage/types'

export type StepKind =
  | 'learn'
  | 'reference'
  | 'activity'
  | 'workshop'
  | 'catalog'
  | 'scenario'
  | 'architecture'
  | 'recurrence'
  | 'measure'

/** A concrete, real-hub-backed leaf step. Completion is read from hub state. */
export interface TreeStep {
  kind: StepKind
  label: string
  /** Deep link into the real hub resource. */
  to: string
  /** learn: module id → completion via module progress. */
  moduleId?: string
  /** activity: artifact type this tool emits → completion via the artifact store. */
  artifactType?: ExecutiveDocumentType
  /** reference: stable id → completion via the visited-refs set. */
  refId?: string
  /** workshop: playground/workshop tool id (WORKSHOP_TOOL_COMPONENTS) → completion
   *  via the visited-workshops set. */
  workshopId?: string
  /** catalog: the product-catalog layer scope (C7 — embed the Migrate catalog in
   *  the sim). Reserved for an optional focus filter. */
  catalogLayer?: string
  /** catalog: stable id of this catalog task (C7) — completion is per-task and
   *  earned when the embed is opened (reviewed-on-open). The id also selects which
   *  real workbench view the embed opens on (e.g. 'discovery' → the discovery
   *  domain, 'pilots' → the asset picker). */
  catalogId?: string
  /** scenario: sandbox scenario id (C3 — embed a live sandbox lab in the sim).
   *  Completion via the visited-scenarios set, set when the lab reports done. */
  scenarioId?: string
  /** architecture: the ArchitecturePanel embeds in-place (WS-04 edge migration).
   *  Completion is cumulative — the player's total edge decisions across the
   *  whole run must reach this threshold (capped against the run's actual
   *  migratable-edge count, so a fixed number can never make the step
   *  unreachable for a smaller architecture). Not per-step tracked: a second,
   *  higher-threshold architecture step later in the same phase is satisfied
   *  by the same growing decision count, the same way other kinds share one
   *  underlying resource. */
  minDecisions?: number
  /** recurrence (W2.4): the maturity criterion this step represents is an
   *  EXISTING activity operated again over time — "QRA updated quarterly",
   *  "roadmap ... with quarterly updates", "auto-updated on deployment". It
   *  cannot be satisfied by opening a page, so completion requires the
   *  prerequisite artifact to exist AND the run to have reached a later
   *  reporting period than the one it was first recorded in. */
  recurrenceOf?: ExecutiveDocumentType
  /** How many reporting periods (quarters) must pass after the prerequisite
   *  was first recorded before this step can clear. */
  recurrenceQuarters?: number
  /** measure (W2.5): the criterion states a MEASURABLE operating condition —
   *  "Year 1 budget secured", "≥70% Tier-1 coverage", "2+ production pilots".
   *  Producing a document does not evidence any of those. A measure step reads
   *  a real value out of the run and clears only when it crosses the threshold
   *  the framework states, so the band evidences the condition rather than the
   *  existence of an artifact about it. */
  metricId?: string
  /** The threshold the metric must reach, in the metric's own units. */
  minValue?: number
  /** True for a step sourced from an activity's `deepDive` array. Stamped
   *  automatically by `flattenTree` (never hand-authored) so `isGatingStep`
   *  excludes it, same as `scenario` — this is what keeps deep-dive content
   *  non-gating even after `flattenTree` merges it in with the required `steps`,
   *  so consumers that do `flattenTree(tree).filter(isGatingStep)` (auto-run's
   *  `gatingStepsForPhase`, the board's step-count denominator) don't silently
   *  start treating optional content as required. */
  optional?: boolean
}

/** A framework Activity (e.g. "1.2 Deploy Cryptographic Discovery") + its leaves. */
export interface TreeActivity {
  /** Framework activity id, verbatim — e.g. '1.2', '4.5–4.6'.
   *
   *  For a SIMULATOR ADAPTATION (see `adaptationOf`) this is a derived id of
   *  the form `<sourceId>-<slug>` (e.g. '3.4-recurring'). It is deliberately
   *  NOT a framework activity number: the framework defines exactly 3.1–3.4
   *  for Phase 3 and 6.1–6.5 for Phase 6, and inventing a "3.5"/"6.6" to carry
   *  a higher maturity band would misrepresent the source. */
  id: string
  /**
   * Set when this activity is a simulator-authored exercise rather than one of
   * the framework's numbered activities, naming the SOURCE activity whose
   * later operating outcome it represents.
   *
   * The framework's higher maturity indicators mostly describe an existing
   * activity maturing over time — P3 L3 ("QRA updated quarterly") and L4
   * ("automated re-scoring when CBOM changes or regulatory deadlines shift")
   * are activity 3.4 recurring and becoming event-driven, not new activities.
   * Modelling them this way is what lets the full L1–L4 ladder exist without
   * fabricating framework content.
   */
  adaptationOf?: string
  /** WP2.6: the decision-card face for this activity's correct choice, phrased
   *  as a strategy statement (e.g. "Make the business case with real cost and
   *  urgency data before pitching leadership") rather than a task label like
   *  "Learn: PQC Business Case". Without this, DecisionSection falls back to
   *  the first required step's own label — which is how every wrong-answer
   *  trap became guessable by grammatical FORM alone (task-shaped correct vs
   *  strategy-shaped traps), independent of content. Optional and additive:
   *  an activity with no `decision` keeps today's fallback behavior. */
  decision?: string
  /** Framework activity title. */
  title: string
  /** One-line "what you do", paraphrased from the framework prose. */
  do?: string
  /** The deliverable the framework says this activity produces, if any. */
  output?: string
  /** Leaf steps that clear this activity, in unlock order. */
  steps: TreeStep[]
  /** Optional, non-gating extra steps — richer hands-on practice or further
   *  reading beyond what the framework requires. Never enters `isGatingStep` /
   *  `achievedTreeLevel` (both only ever read `steps`), so adding content here
   *  can never change a phase's maturity math. Included in `flattenTree` so the
   *  embed/drift-guard tests still validate these ids against the live registries. */
  deepDive?: TreeStep[]
}

/** All activities that deliver one maturity level, with the framework indicator. */
export interface LevelBand {
  level: MaturityLevelId
  /** Framework Maturity Indicator text for this level (verbatim snapshot). */
  indicator: string
  activities: TreeActivity[]
}

/** A documented failure mode from the framework's "Common Failures" section —
 *  used as a tempting-but-wrong move alongside the correct next step. */
export interface Pitfall {
  title: string
  why: string
}

/** A whole phase: its gate, its dated provenance, level bands, and pitfalls. */
export interface PhaseTree {
  phase: PhaseId
  /** Framework gate (G0–G6) + the criterion it certifies. Absent for CONTINUOUS
   *  phases (p7 Vendor & Supply Chain) which have no one-time gate. */
  gate?: { id: string; criterion: string }
  /** MMDDYYYY snapshot date this tree was generated. */
  generated: string
  /** Framework source/version this snapshot was derived from. */
  source: string
  /** Maturity-level bands, ascending. Levels with no activity are omitted. */
  levels: LevelBand[]
  /** Framework "Common Failures" — the wrong moves a player can make this phase. */
  pitfalls: Pitfall[]
}

/** Flatten a tree's steps in level → activity → step order (the unlock order).
 *  Includes `deepDive` steps (after each activity's required `steps`, stamped
 *  `optional: true`) so the embed/drift-guard tests validate them too — but
 *  every consumer that filters with `isGatingStep` still correctly excludes
 *  them, exactly like `scenario` steps. */
export function flattenTree(tree: PhaseTree): TreeStep[] {
  return tree.levels.flatMap((b) =>
    b.activities.flatMap((a) => [
      ...a.steps,
      ...(a.deepDive ?? []).map((s) => ({ ...s, optional: true })),
    ])
  )
}

/** Steps that GATE a band's completion. `scenario` (live sandbox lab) steps are
 *  BONUS: they require a running sandbox most players don't have, so they never
 *  block a maturity band — completing them is optional. Steps stamped
 *  `optional` (deep-dive content, flattened via `flattenTree`) are bonus too. */
export const isGatingStep = (s: TreeStep): boolean => s.kind !== 'scenario' && !s.optional

/**
 * The maturity level the player has EARNED from real hub state — the highest
 * present band whose (gating) activities are all complete, requiring lower present
 * bands first. Levels absent from the tree are skipped (not required). Bonus
 * `scenario` steps never gate. Returns 0 if the lowest present band is incomplete.
 */
export function achievedTreeLevel(
  tree: PhaseTree,
  isDone: (s: TreeStep) => boolean
): MaturityLevelId | 0 {
  let achieved: MaturityLevelId | 0 = 0
  for (const band of tree.levels) {
    const allDone = band.activities.every((a) =>
      a.steps.every((s) => !isGatingStep(s) || isDone(s))
    )
    if (!allDone) break
    achieved = band.level
  }
  return achieved
}
