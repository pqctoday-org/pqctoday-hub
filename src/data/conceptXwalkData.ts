// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV } from './csvUtils'

export type XwalkRelationshipType =
  | 'subset_of'
  | 'superset_of'
  | 'equivalent'
  | 'intersects_with'
  | 'not_related'

export type XwalkRationaleType =
  | 'technical_dependency'
  | 'policy_reference'
  | 'implementation_guidance'
  | 'equivalence'
  | 'specialization'
  | 'timeline_anchor'

export type XwalkConfidenceLabel = 'high' | 'medium' | 'low'

export interface ConceptXwalkRecord {
  xwalkId: string
  fromConcept: string
  toConcept: string
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
  relationship_type: string
  rationale_type: string
  evidence: string
  verified_date: string
  verified_by: string
  confidence: string
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
  'technical_dependency',
  'policy_reference',
  'implementation_guidance',
  'equivalence',
  'specialization',
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
  if (!VALID_RELATIONSHIP_TYPES.has(row.relationship_type)) return null
  if (!VALID_RATIONALE_TYPES.has(row.rationale_type)) return null

  const confidenceLabel = (row.confidence?.toLowerCase() ?? 'low') as XwalkConfidenceLabel
  const confidenceScore = LABEL_TO_SCORE[confidenceLabel] ?? 30

  return {
    xwalkId: row.xwalk_id,
    fromConcept: row.from_concept,
    toConcept: row.to_concept,
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
