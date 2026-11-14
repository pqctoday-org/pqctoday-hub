// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { generateNiceGapReport } from './niceGapReport'
import type { AssessmentInput, AssessmentResult } from '../hooks/assessmentTypes'

const base: AssessmentInput = {
  industry: 'Technology',
  currentCrypto: [],
  dataSensitivity: [],
  complianceRequirements: [],
  migrationStatus: 'planning',
}
const result: AssessmentResult = {
  riskScore: 40,
  riskLevel: 'medium',
  algorithmMigrations: [],
  complianceImpacts: [],
  recommendedActions: [],
  narrative: '',
  generatedAt: '2026-11-05T00:00:00Z',
}
const cryptoGap = (extra: Partial<AssessmentInput>) =>
  generateNiceGapReport({ ...base, ...extra }, result).competencyGaps.find(
    (g) => g.competencyAreaId === 'CA-CRYPTO'
  )

describe('NICE gap report counts algorithms a family-only selection stands for', () => {
  it('treats a ticked family with no specific algorithm as its implied algorithms', () => {
    // Signatures implies 8 classical algorithms, so the breadth rationale applies.
    expect(cryptoGap({ currentCryptoCategories: ['Signatures'] })?.rationale).toContain(
      'spans 8 cryptographic algorithms'
    )
  })

  it('does not expand when the reader narrowed the family to specific algorithms', () => {
    const gap = cryptoGap({
      currentCryptoCategories: ['Signatures'],
      currentCrypto: ['ECDSA P-256'],
    })
    expect(gap?.rationale).not.toContain('spans')
  })

  it('does not expand when the reader does not know their algorithms', () => {
    const gap = cryptoGap({ currentCryptoCategories: ['Signatures'], currentCryptoUnknown: true })
    expect(gap?.rationale).not.toContain('spans')
  })

  it('with no categories the count is unchanged', () => {
    expect(cryptoGap({})?.rationale).not.toContain('spans')
  })
})
