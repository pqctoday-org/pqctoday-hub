// SPDX-License-Identifier: GPL-3.0-only
import type { DimensionResult, ScoredResourceType } from '../types'

/** Well-known standards and compliance bodies — bonus for recognized names. */
const RECOGNIZED_BODIES = new Set([
  'NIST',
  'IETF',
  'ISO',
  'IEEE',
  'ETSI',
  'ANSSI',
  'BSI',
  'CCCS',
  'NCSC',
  'NSA',
  'ENISA',
  'OASIS',
  'W3C',
  'ITU',
  'CISA',
  'Common Criteria',
  'ASC X9',
  'CA/Browser Forum',
  'TCG',
  'GlobalPlatform',
  'MAS',
  'PCI SSC',
  'AICPA',
])

export function scoreOrgVetting(
  vettingBodies: string[],
  resourceType: ScoredResourceType
): DimensionResult {
  if (vettingBodies.length === 0) {
    return { rawScore: 10, rationale: 'No organizational vetting' }
  }

  // Base score by count
  let score: number
  if (vettingBodies.length >= 3) score = 95
  else if (vettingBodies.length === 2) score = 80
  else score = 60

  // Compliance resources naturally have an enforcement body — higher floor
  if (resourceType === 'compliance' && score < 70) {
    score = 70
  }

  // Bonus for recognized standardization/compliance bodies
  const hasRecognized = vettingBodies.some((b) => RECOGNIZED_BODIES.has(b.trim()))
  if (hasRecognized) {
    score = Math.min(100, score + 10)
  }

  const names = vettingBodies.slice(0, 3).join(', ')
  const suffix = vettingBodies.length > 3 ? ` + ${vettingBodies.length - 3} more` : ''

  return {
    rawScore: score,
    rationale: `Vetted by ${names}${suffix}`,
  }
}
