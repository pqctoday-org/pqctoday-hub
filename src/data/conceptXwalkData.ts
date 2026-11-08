// SPDX-License-Identifier: AGPL-3.0-only
import { loadLatestCSV } from './csvUtils'
import { dropUndrawableLifecycleLinks, type RejectedLifecycleLink } from './conceptLifecycleLinks'

/**
 * `scheme_under`, `part_of_series`, `published_by` and `supersedes` are
 * structural links between two different documents, schemes or organisations,
 * never sameness:
 * - `scheme_under`: from = a national certification scheme, to = the umbrella
 *   scheme it operates under (e.g. a national Common Criteria scheme under the
 *   Common Criteria umbrella).
 * - `part_of_series`: from = a volume, amendment or companion, to = the main
 *   document or series it belongs to.
 * - `published_by`: from = a document, to = the organisation that published
 *   it. The organisation is a `concept_only` registry row built from the
 *   curated source-organisations list (`sourceOrganizations.ts`).
 * - `supersedes`: from = the newer edition, to = the older edition it
 *   replaces. Never drawn while the newer edition is still a draft.
 * None of them makes two concepts equivalent, and none carries applicability.
 */
export type XwalkRelationshipType =
  | 'subset_of'
  | 'superset_of'
  | 'equivalent'
  | 'intersects_with'
  | 'scheme_under'
  | 'part_of_series'
  | 'published_by'
  | 'supersedes'
  | 'not_related'

/**
 * Closed set per NIST IR 8477 §3.2 (trust-engine-explainability.md).
 * Aligned 2026-05-11: previous `equivalence` / `specialization` values were
 * rewritten to `semantic` / `functional` via the one-shot migration.
 * CM-RATIONALE validator enforces this set going forward.
 */
export type XwalkRationaleType =
  | 'syntactic'
  | 'semantic'
  | 'functional'
  | 'technical_dependency'
  | 'policy_reference'
  | 'implementation_guidance'
  | 'timeline_anchor'

export type XwalkConfidenceLabel = 'high' | 'medium' | 'low'

export interface ConceptXwalkRecord {
  xwalkId: string
  /** Human-readable label preserved verbatim from the CSV. */
  fromConcept: string
  toConcept: string
  /**
   * Canonical concept-id from concept_registry, e.g. `framework:nist-cswp-39`.
   * Populated in concept_xwalks_05112026_r1+ (PR 3b migration). Empty string
   * means the endpoint could not be auto-resolved to a registry row —
   * CM-CONCEPT WARNS on these for SME review.
   */
  fromConceptId: string
  toConceptId: string
  relationshipType: XwalkRelationshipType
  rationaleType: XwalkRationaleType
  evidence: string
  verifiedDate: string
  verifiedBy: string
  confidence: XwalkConfidenceLabel
  /** Integer 0-100 derived from the confidence label via CONFIDENCE_SCALE */
  confidenceScore: number
}

export interface RawXwalkRow {
  xwalk_id: string
  from_concept: string
  to_concept: string
  from_concept_id?: string
  to_concept_id?: string
  relationship_type: string
  rationale_type: string
  evidence: string
  verified_date: string
  verified_by: string
  confidence: string
  status?: string
}

const LABEL_TO_SCORE: Record<XwalkConfidenceLabel, number> = {
  high: 85,
  medium: 60,
  low: 30,
}

const VALID_RELATIONSHIP_TYPES = new Set<string>([
  'subset_of',
  'superset_of',
  'equivalent',
  'intersects_with',
  'scheme_under',
  'part_of_series',
  'published_by',
  'supersedes',
  'not_related',
])

/**
 * Relationship types that only say how two different documents, schemes or
 * organisations belong together. They are shown as relationships, but they
 * never merge two concepts into one and never make one document apply because
 * the other does.
 */
export const STRUCTURAL_RELATIONSHIP_TYPES: ReadonlySet<XwalkRelationshipType> = new Set([
  'scheme_under',
  'part_of_series',
  'published_by',
  'supersedes',
])

/**
 * The two life-cycle links: who published a document, and which older edition
 * a newer one replaces. Rows of these types are checked again after loading
 * (see `conceptLifecycleLinks.ts`) and are dropped, not drawn, when the check
 * fails.
 */
export const LIFECYCLE_RELATIONSHIP_TYPES: ReadonlySet<XwalkRelationshipType> = new Set([
  'published_by',
  'supersedes',
])

const VALID_RATIONALE_TYPES = new Set<string>([
  'syntactic',
  'semantic',
  'functional',
  'technical_dependency',
  'policy_reference',
  'implementation_guidance',
  'timeline_anchor',
])

const XWALK_REGEX = /concept_xwalks_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/

const modules = import.meta.glob('./concept_xwalks_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export function transformRow(row: RawXwalkRow): ConceptXwalkRecord | null {
  if (!row.xwalk_id || !row.from_concept || !row.to_concept) return null
  const rowStatus = row.status?.trim().toLowerCase()
  if (rowStatus === 'deprecated' || rowStatus === 'obsolete') return null
  if (!VALID_RELATIONSHIP_TYPES.has(row.relationship_type)) return null
  if (!VALID_RATIONALE_TYPES.has(row.rationale_type)) return null

  // trim() is load-bearing: a quoted CSV cell can carry a trailing newline
  // ("high\n" shipped live in concept_xwalks_08122026.csv and silently scored
  // 30 instead of 85 — 2026-08-12), and LABEL_TO_SCORE lookup misses then.
  const confidenceLabel = (row.confidence?.trim().toLowerCase() ?? 'low') as XwalkConfidenceLabel
  const confidenceScore = LABEL_TO_SCORE[confidenceLabel] ?? 30

  return {
    xwalkId: row.xwalk_id,
    fromConcept: row.from_concept,
    toConcept: row.to_concept,
    fromConceptId: row.from_concept_id ?? '',
    toConceptId: row.to_concept_id ?? '',
    relationshipType: row.relationship_type as XwalkRelationshipType,
    rationaleType: row.rationale_type as XwalkRationaleType,
    evidence: row.evidence ?? '',
    verifiedDate: row.verified_date ?? '',
    verifiedBy: row.verified_by ?? '',
    confidence: confidenceLabel,
    confidenceScore,
  }
}

const loaded = (() => {
  const { data } = loadLatestCSV<RawXwalkRow, ConceptXwalkRecord>(
    modules,
    XWALK_REGEX,
    transformRow
  )
  // A "replaces" link is never drawn for a draft, and a "published by" link only
  // ever points at a curated organisation. Rows that fail are kept out of every
  // view; `conceptXwalkRejectedLifecycleLinks` lists them for the data checks.
  return dropUndrawableLifecycleLinks(data)
})()

export const conceptXwalkData: ConceptXwalkRecord[] = loaded.kept

/** Life-cycle rows in the latest file that were not drawn, each with the plain reason. */
export const conceptXwalkRejectedLifecycleLinks: readonly RejectedLifecycleLink[] = loaded.rejected
