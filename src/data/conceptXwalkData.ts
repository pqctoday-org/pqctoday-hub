// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV } from './csvUtils'

export type XwalkRelationshipType =
  | 'subset_of'
  | 'superset_of'
  | 'equivalent'
  | 'intersects_with'
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

interface RawXwalkRow {
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
  'not_related',
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

function transformRow(row: RawXwalkRow): ConceptXwalkRecord | null {
  if (!row.xwalk_id || !row.from_concept || !row.to_concept) return null
  const rowStatus = row.status?.trim().toLowerCase()
  if (rowStatus === 'deprecated' || rowStatus === 'obsolete') return null
  if (!VALID_RELATIONSHIP_TYPES.has(row.relationship_type)) return null
  if (!VALID_RATIONALE_TYPES.has(row.rationale_type)) return null

  const confidenceLabel = (row.confidence?.toLowerCase() ?? 'low') as XwalkConfidenceLabel
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

function loadXwalkData(): ConceptXwalkRecord[] {
  const { data } = loadLatestCSV<RawXwalkRow, ConceptXwalkRecord>(
    modules,
    XWALK_REGEX,
    transformRow
  )
  return data
}

export const conceptXwalkData: ConceptXwalkRecord[] = loadXwalkData()
