// SPDX-License-Identifier: GPL-3.0-only
/**
 * qualityIndicators (W7.5) — how this run actually went, as opposed to how far
 * it got.
 *
 * The plan asks for three product-quality signals, "without treating clicks as
 * competence":
 *   1. COMPLETION TYPE — did the learner do the work, or watch it being done?
 *   2. RETURN-PATH FAILURES — how often did leaving for a resource fail to
 *      bring them back?
 *   3. UNRESOLVED EVIDENCE — what did they start and leave unevidenced?
 *
 * None of these is a competence measure and none should ever be presented as
 * one. They say what KIND of run happened, which is the thing the old
 * completion flag could not distinguish: a narrated demonstration and a
 * worked-through programme both ended at "done".
 */
import type { SimEvidenceRecord } from './evidence'

export type CompletionType = 'practised' | 'mixed' | 'demonstrated' | 'empty'

export interface RunQualityIndicators {
  /** What kind of run this was. */
  completionType: CompletionType
  /** Fraction of this run's evidence the learner produced themselves (0–1).
   *  `null` when there is no evidence at all — an empty run has no ratio, and
   *  0 would wrongly read as "watched everything". */
  learnerShare: number | null
  /** Evidence records produced, of any origin. */
  evidenceTotal: number
  /** Records whose origin is a narrated demonstration or AI delegation. */
  demonstratedCount: number
  /** Times a resource excursion failed to return the learner to their phase. */
  returnPathFailures: number
  /** Required steps left undone in phases the learner actually started.
   *  Deliberately scoped to STARTED phases: counting untouched phases would
   *  report a beginner as having a large unresolved backlog, which says
   *  nothing about the product. */
  unresolvedInStartedPhases: number
}

export function completionTypeOf(learnerShare: number | null): CompletionType {
  if (learnerShare === null) return 'empty'
  if (learnerShare >= 0.8) return 'practised'
  if (learnerShare >= 0.4) return 'mixed'
  return 'demonstrated'
}

export function runQualityIndicators(input: {
  evidence: readonly SimEvidenceRecord[]
  returnPathFailures: number
  /** Per started phase: [required steps total, required steps done]. */
  startedPhaseSteps: readonly [number, number][]
}): RunQualityIndicators {
  const evidenceTotal = input.evidence.length
  const byLearner = input.evidence.filter((e) => e.origin === 'learner').length
  const demonstratedCount = input.evidence.filter(
    (e) => e.origin === 'narrated-example' || e.origin === 'ai-delegated'
  ).length
  const learnerShare = evidenceTotal > 0 ? byLearner / evidenceTotal : null
  const unresolved = input.startedPhaseSteps.reduce(
    (n, [total, done]) => n + Math.max(0, total - done),
    0
  )
  return {
    completionType: completionTypeOf(learnerShare),
    learnerShare,
    evidenceTotal,
    demonstratedCount,
    returnPathFailures: input.returnPathFailures,
    unresolvedInStartedPhases: unresolved,
  }
}

/** Compact, non-identifying summary for an analytics label. */
export function indicatorsLabel(i: RunQualityIndicators): string {
  const share = i.learnerShare === null ? 'na' : Math.round(i.learnerShare * 100)
  return [
    `type=${i.completionType}`,
    `own=${share}`,
    `ev=${i.evidenceTotal}`,
    `demo=${i.demonstratedCount}`,
    `rpf=${i.returnPathFailures}`,
    `unres=${i.unresolvedInStartedPhases}`,
  ].join('|')
}
