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

export type StepKind = 'learn' | 'reference' | 'activity' | 'workshop' | 'catalog' | 'scenario'

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
  /** catalog: stable id of this catalog task (C7) — completion is per-task: the
   *  step is done when the player picks a PQC-capable product while it is open. */
  catalogId?: string
  /** scenario: sandbox scenario id (C3 — embed a live sandbox lab in the sim).
   *  Completion via the visited-scenarios set, set when the lab reports done. */
  scenarioId?: string
}

/** A framework Activity (e.g. "1.2 Deploy Cryptographic Discovery") + its leaves. */
export interface TreeActivity {
  /** Framework activity id, verbatim — e.g. '1.2', '4.5–4.6'. */
  id: string
  /** Framework activity title. */
  title: string
  /** One-line "what you do", paraphrased from the framework prose. */
  do?: string
  /** The deliverable the framework says this activity produces, if any. */
  output?: string
  /** Leaf steps that clear this activity, in unlock order. */
  steps: TreeStep[]
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
  /** Framework gate (G0–G7) + the criterion it certifies. */
  gate: { id: string; criterion: string }
  /** MMDDYYYY snapshot date this tree was generated. */
  generated: string
  /** Framework source/version this snapshot was derived from. */
  source: string
  /** Maturity-level bands, ascending. Levels with no activity are omitted. */
  levels: LevelBand[]
  /** Framework "Common Failures" — the wrong moves a player can make this phase. */
  pitfalls: Pitfall[]
}

/** Flatten a tree's steps in level → activity → step order (the unlock order). */
export function flattenTree(tree: PhaseTree): TreeStep[] {
  return tree.levels.flatMap((b) => b.activities.flatMap((a) => a.steps))
}

/**
 * The maturity level the player has EARNED from real hub state — the highest
 * present band whose activities are all complete, requiring lower present bands
 * first. Levels absent from the tree are skipped (not required). Returns 0 if
 * the lowest present band is incomplete.
 */
export function achievedTreeLevel(
  tree: PhaseTree,
  isDone: (s: TreeStep) => boolean
): MaturityLevelId | 0 {
  let achieved: MaturityLevelId | 0 = 0
  for (const band of tree.levels) {
    const allDone = band.activities.every((a) => a.steps.every(isDone))
    if (!allDone) break
    achieved = band.level
  }
  return achieved
}
