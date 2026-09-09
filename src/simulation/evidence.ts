// SPDX-License-Identifier: GPL-3.0-only
/**
 * evidence — run-scoped records of what actually happened, and how.
 *
 * The defect this replaces: completion was a single undifferentiated flag.
 * Watching a narrated demonstration, reading a page, passing a comprehension
 * check, producing a document, and demonstrating an organisational outcome all
 * wrote the same "done", into GLOBAL stores shared with Learn. An automated
 * walkthrough could therefore complete a learner's curriculum, and any document
 * of a matching TYPE — whoever made it, for whatever organisation — cleared a
 * gate.
 *
 * The model here keeps four things apart:
 *   - WHAT was touched          → `kind` + `resourceId`
 *   - HOW FAR the learner got   → `status`
 *   - WHO/WHAT produced it      → `origin`
 *   - WHICH WORLD it belongs to → `runId` + `fingerprint`
 *
 * Nothing in this file is a claim about a real organisation. A simulated record
 * describes an exercise, never a verified state.
 */
import type { PhaseId } from '@/data/frameworkPhases'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import type { AssessedLevel } from './frameworkCoverage'

/** Who produced this evidence. The distinction the audit found missing. */
export type EvidenceOrigin =
  /** The learner did the work themselves in this run. */
  | 'learner'
  /** Restored from an imported run save. */
  | 'imported'
  /** Produced while watching an automated walkthrough — a worked example. */
  | 'narrated-example'
  /** Delegated to the simulated AI team. */
  | 'ai-delegated'

/** How far the learner actually got. Deliberately ordered weakest → strongest. */
export type EvidenceStatus =
  /** Opened / read. No claim of understanding. */
  | 'viewed'
  /** Answered a real comprehension check about it. */
  | 'comprehension-checked'
  /** Used the actual tool or produced the actual output. */
  | 'practiced'
  /** The scenario criterion for a maturity cell was met. */
  | 'criterion-met'
  /** Recorded, but something about it needs a human look. */
  | 'review-required'

export const STATUS_RANK: Record<EvidenceStatus, number> = {
  'review-required': 0,
  viewed: 1,
  'comprehension-checked': 2,
  practiced: 3,
  'criterion-met': 4,
}

/** What kind of thing the evidence is about. Mirrors the tree's StepKind plus
 *  `check`, which has no step of its own (a quiz taken against a module). */
export type EvidenceKind =
  | 'learn'
  | 'reference'
  | 'artifact'
  | 'workshop'
  | 'catalog'
  | 'scenario'
  | 'architecture'
  | 'check'

/** A maturity cell id, e.g. 'p3/L2'. */
export type CriterionId = `${string}/L${AssessedLevel}`

export const criterionId = (phase: string, level: AssessedLevel): CriterionId =>
  `${phase}/L${level}` as CriterionId

export interface SimEvidenceRecord {
  /** Stable within a run: re-recording the same thing updates, never duplicates. */
  id: string
  runId: string
  phase: PhaseId
  /** Framework activity id ('3.4', '1.4–1.5') when the evidence belongs to one. */
  activityId?: string
  /** Maturity cell this was recorded against, when known. */
  criterionId?: CriterionId
  /** Module id / ref id / workshop id / artifact type / catalog id. */
  resourceId: string
  kind: EvidenceKind
  origin: EvidenceOrigin
  status: EvidenceStatus
  /** The world this evidence belongs to — org size/country/sector. Evidence from
   *  a different scenario is not silently reused as if it described this one. */
  fingerprint: string
  createdAt: number
  /** W2.4 — the RUN's reporting period this was recorded in (e.g. 'Q1 2026').
   *  Wall-clock `createdAt` cannot express "updated quarterly" in a simulated
   *  timeline; this can. */
  runQuarter?: string
  reviewedAt?: number
  /** For artifact evidence: the document it points at. */
  artifactId?: string
  artifactType?: ExecutiveDocumentType
}

/** The run's organisation/scenario fingerprint. */
export const runFingerprint = (size: string, country: string, sector: string): string =>
  `${size}/${country}/${sector}`

/** Deterministic, collision-free within a run — so replay produces the same
 *  ids and re-recording updates in place rather than appending duplicates. */
export const evidenceId = (
  runId: string,
  phase: string,
  kind: EvidenceKind,
  resourceId: string,
  /** W2.4 — recurrence needs one record PER reporting period, so the period is
   *  part of the identity. Without it the upsert would collapse a quarterly
   *  cadence into a single record and "operated again" could never be shown. */
  runQuarter?: string
): string =>
  runQuarter
    ? `${runId}:${phase}:${kind}:${resourceId}:${runQuarter}`
    : `${runId}:${phase}:${kind}:${resourceId}`

/** Origins that represent the learner's own work. A demonstration is not one. */
export const isLearnerWork = (o: EvidenceOrigin): boolean => o === 'learner'

/** Upsert by id, keeping the STRONGEST status seen and the earliest createdAt.
 *  A later `viewed` never downgrades an earlier `practiced`. */
export function upsertEvidence(
  records: readonly SimEvidenceRecord[],
  next: SimEvidenceRecord
): SimEvidenceRecord[] {
  const idx = records.findIndex((r) => r.id === next.id)
  if (idx < 0) return [...records, next]
  const prev = records[idx]!
  const keepPrevStatus = STATUS_RANK[prev.status] >= STATUS_RANK[next.status]
  const merged: SimEvidenceRecord = {
    ...prev,
    ...next,
    createdAt: prev.createdAt,
    status: keepPrevStatus ? prev.status : next.status,
    // Provenance never launders itself: once a record is a demonstration, real
    // learner work on the same resource UPGRADES it, but a demonstration can
    // never overwrite learner-authored provenance.
    origin: isLearnerWork(prev.origin) ? prev.origin : next.origin,
  }
  return records.map((r, i) => (i === idx ? merged : r))
}

export interface EvidenceQuery {
  phase?: string
  criterionId?: CriterionId
  resourceId?: string
  kind?: EvidenceKind
  /** Only evidence belonging to this world. */
  fingerprint?: string
  /** Minimum status required to count. */
  atLeast?: EvidenceStatus
  /** Restrict to these origins (e.g. learner-only for a competence claim). */
  origins?: readonly EvidenceOrigin[]
}

export function selectEvidence(
  records: readonly SimEvidenceRecord[],
  q: EvidenceQuery
): SimEvidenceRecord[] {
  return records.filter((r) => {
    if (q.phase && r.phase !== q.phase) return false
    if (q.criterionId && r.criterionId !== q.criterionId) return false
    if (q.resourceId && r.resourceId !== q.resourceId) return false
    if (q.kind && r.kind !== q.kind) return false
    if (q.fingerprint && r.fingerprint !== q.fingerprint) return false
    if (q.atLeast && STATUS_RANK[r.status] < STATUS_RANK[q.atLeast]) return false
    if (q.origins && !q.origins.includes(r.origin)) return false
    return true
  })
}

/**
 * W2.4 — has this resource been recorded in MORE THAN ONE of the run's
 * reporting periods? That is what "operated again over time" means here, and
 * it is the thing a single visit or a single document cannot fake.
 */
export function distinctRunQuarters(
  records: readonly SimEvidenceRecord[],
  resourceId: string
): string[] {
  return [
    ...new Set(
      records.filter((r) => r.resourceId === resourceId && r.runQuarter).map((r) => r.runQuarter!)
    ),
  ]
}

/** Does any record satisfy this query? */
export const hasEvidence = (records: readonly SimEvidenceRecord[], q: EvidenceQuery): boolean =>
  selectEvidence(records, q).length > 0

/**
 * Is a referenced document usable as evidence for THIS run's criterion?
 *
 * Replaces `docTypes.has(type)`. A document of the right type still has to be
 * about the right world and carry acceptable provenance. Reuse across several
 * criteria is deliberately allowed — one real CBOM is one real deliverable —
 * so this asks about applicability, not exclusivity.
 */
export interface DocumentApplicability {
  /** The document exists and is of the required type. */
  present: boolean
  /** It describes this run's organisation/scenario. */
  matchesWorld: boolean
  /** It was produced by the learner rather than generated as an example. */
  learnerAuthored: boolean
}

export interface ApplicabilityInput {
  type?: ExecutiveDocumentType
  docs: ReadonlyArray<{
    id: string
    type: ExecutiveDocumentType
    moduleId?: string
    title?: string
  }>
  records: readonly SimEvidenceRecord[]
  fingerprint: string
}

/** Module ids used by generated/demonstration documents — never learner work. */
const DEMO_MODULE_IDS = new Set(['sim-autorun', 'sim-mobile-brief'])

export function documentApplicability(input: ApplicabilityInput): DocumentApplicability {
  const { type, docs, records, fingerprint } = input
  if (!type) return { present: false, matchesWorld: false, learnerAuthored: false }
  const matching = docs.filter((d) => d.type === type)
  if (matching.length === 0) return { present: false, matchesWorld: false, learnerAuthored: false }

  // A document is tied to a world through the evidence record that filed it.
  // Documents with no record at all are pre-existing hub work: usable, but not
  // attributable to this run's scenario.
  const recordsForType = records.filter((r) => r.artifactType === type)
  const inWorld = recordsForType.filter((r) => r.fingerprint === fingerprint)
  const matchesWorld = inWorld.length > 0 || recordsForType.length === 0

  const learnerAuthored =
    inWorld.some((r) => isLearnerWork(r.origin)) ||
    (recordsForType.length === 0 && matching.some((d) => !DEMO_MODULE_IDS.has(d.moduleId ?? '')))

  return { present: true, matchesWorld, learnerAuthored }
}

/**
 * The rubric a criterion applies to its evidence.
 *  - `demonstrated` accepts a worked example (the learner watched it happen).
 *  - `practised`    requires the learner to have done it themselves.
 *  - `outcome`      additionally requires the scenario criterion to be met.
 */
export type CriterionRubric = 'demonstrated' | 'practised' | 'outcome'

export const RUBRIC_MIN_STATUS: Record<CriterionRubric, EvidenceStatus> = {
  demonstrated: 'viewed',
  practised: 'practiced',
  outcome: 'criterion-met',
}

/** Does the evidence clear a criterion under its rubric? */
export function criterionSatisfied(
  records: readonly SimEvidenceRecord[],
  criterion: CriterionId,
  rubric: CriterionRubric,
  fingerprint: string
): boolean {
  const atLeast = RUBRIC_MIN_STATUS[rubric]
  const origins: readonly EvidenceOrigin[] | undefined =
    rubric === 'demonstrated' ? undefined : (['learner', 'imported'] as const)
  return hasEvidence(records, { criterionId: criterion, atLeast, fingerprint, origins })
}

/** A short, honest label for how a step was cleared — for UI that must not
 *  present a watched demonstration as the learner's own achievement. */
export function provenanceLabel(origin: EvidenceOrigin): string {
  switch (origin) {
    case 'learner':
      return 'You did this'
    case 'imported':
      return 'Restored from a saved run'
    case 'narrated-example':
      return 'Worked example — demonstration'
    case 'ai-delegated':
      return 'Delegated to the AI team'
  }
}
