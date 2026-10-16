// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { answerImpacts } from './answerImpact'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import type { AssessmentInput } from '@/hooks/assessmentTypes'

const INPUT: AssessmentInput = {
  industry: 'Finance & Banking',
  currentCrypto: ['RSA-2048'],
  dataSensitivity: ['high'],
  complianceRequirements: ['PCI DSS'],
  migrationStatus: 'planning',
  country: 'United States',
  dataRetention: ['25-plus'],
  cryptoAgility: 'hardcoded',
  vendorUnknown: true,
}

describe('answerImpacts', () => {
  const result = computeAssessment(INPUT)
  const rows = answerImpacts(INPUT, result, computeAssessment)!

  it("measures each answer as the score minus the score with that answer 'don't know'", () => {
    const agility = rows.find((r) => r.question === 'Crypto agility')!
    const without = computeAssessment({ ...INPUT, cryptoAgility: 'unknown', agilityUnknown: true })
    expect(agility.source).toBe('yours')
    expect(agility.points).toBe(result.riskScore - without.riskScore)
  })

  it('says where each value came from', () => {
    const by = Object.fromEntries(rows.map((r) => [r.question, r.source]))
    expect(by['Data sensitivity']).toBe('yours')
    expect(by['Vendor dependency']).toBe('not-known')
    expect(by['Infrastructure']).toBe('not-answered')
    expect(rows.find((r) => r.question === 'Country')?.publishedData).toMatch(/timeline/)
  })

  it('gives no points to an answer the reader did not give', () => {
    expect(rows.filter((r) => r.source !== 'yours').every((r) => r.points === 0)).toBe(true)
  })

  it('lists the largest effect first', () => {
    const sizes = rows.map((r) => Math.abs(r.points))
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a))
  })

  it('shows nothing when the stored answers do not reproduce the score (shared or example report)', () => {
    const other = computeAssessment({
      ...INPUT,
      dataSensitivity: ['low'],
      cryptoAgility: 'fully-abstracted',
    })
    expect(other.riskScore).not.toBe(result.riskScore)
    expect(answerImpacts(INPUT, other, computeAssessment)).toBeNull()
  })
})
