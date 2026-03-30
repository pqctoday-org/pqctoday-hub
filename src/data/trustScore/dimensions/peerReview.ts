// SPDX-License-Identifier: GPL-3.0-only
import type { DimensionResult, PeerReviewStatus } from '../types'

const PEER_REVIEW_SCORES: Record<PeerReviewStatus, number> = {
  yes: 100,
  partial: 60,
  no: 10,
}

/** Document types that imply formal peer review for library items. */
const PEER_REVIEWED_DOC_TYPES = new Set([
  'fips standard',
  'nist standard',
  'rfc',
  'iso standard',
  'ieee standard',
  'etsi standard',
])

/** Document types that imply partial review. */
const PARTIAL_REVIEW_DOC_TYPES = new Set([
  'technical report',
  'draft',
  'nist special publication',
  'guidance',
])

export function scorePeerReview(
  peerReviewed: PeerReviewStatus | undefined,
  documentType?: string
): DimensionResult {
  const status = peerReviewed ?? 'no'
  let score = PEER_REVIEW_SCORES[status] ?? 10

  // Apply document type inference bonus for library items
  if (documentType) {
    const lowerType = documentType.toLowerCase()
    if (score < 100 && PEER_REVIEWED_DOC_TYPES.has(lowerType)) {
      score = Math.min(100, score + 20)
    } else if (score < 60 && PARTIAL_REVIEW_DOC_TYPES.has(lowerType)) {
      score = Math.min(100, score + 10)
    }
  }

  const rationale =
    status === 'yes'
      ? 'Peer-reviewed'
      : status === 'partial'
        ? 'Partially peer-reviewed'
        : documentType
          ? `Not peer-reviewed (${documentType})`
          : 'Not peer-reviewed'

  return { rawScore: score, rationale }
}
