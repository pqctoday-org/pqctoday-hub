// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { decodeShareToken, encodeShareToken } from './reportShareToken'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { EXAMPLE_REPORT_SHARE_PAYLOAD } from '@/data/exampleReport'

describe('report share links carry the frameworks that were left out', () => {
  it('round-trips omittedCompliance inside the shared result', () => {
    const result = computeAssessment({
      ...EXAMPLE_REPORT_SHARE_PAYLOAD,
      complianceRequirements: ['PCI DSS', 'DORA (EU Digital Operational Resilience)'],
    })
    expect(result.omittedCompliance).toEqual(['DORA (EU Digital Operational Resilience)'])

    const decoded = decodeShareToken(encodeShareToken({ result }))
    expect(decoded?.v).toBe(2)
    if (decoded?.v !== 2) throw new Error('expected a v2 token')
    expect(decoded.result.omittedCompliance).toEqual(['DORA (EU Digital Operational Resilience)'])
  })

  it('a link made before the field existed decodes with none left out', () => {
    const result = computeAssessment(EXAMPLE_REPORT_SHARE_PAYLOAD)
    const { omittedCompliance: _unused, ...older } = result
    void _unused
    const decoded = decodeShareToken(encodeShareToken({ result: older }))
    if (decoded?.v !== 2) throw new Error('expected a v2 token')
    expect(decoded.result.omittedCompliance).toBeUndefined()
  })
})

describe('report share links: profile lists are checked on the way in', () => {
  it('drops a list field that is not a list of strings and keeps the report readable', () => {
    const result = computeAssessment({
      industry: 'Finance & Banking',
      country: 'United States',
      currentCrypto: [],
      dataSensitivity: ['high'],
      complianceRequirements: [],
      migrationStatus: 'planning',
    })
    const tampered = {
      ...result,
      assessmentProfile: {
        ...result.assessmentProfile!,
        algorithmsSelected: { length: 1 },
        algorithmsImplied: { length: 1 },
        cryptoLibraries: [1, 2],
        infraAutomation: 'None',
        scenarioEstateId: 42,
      },
    } as unknown as typeof result
    const decoded = decodeShareToken(encodeShareToken({ result: tampered }))
    expect(decoded && decoded.v === 2).toBe(true)
    const profile = (decoded as { result: typeof result }).result.assessmentProfile!
    expect(profile.algorithmsSelected).toEqual([])
    expect(profile).not.toHaveProperty('algorithmsImplied')
    expect(profile).not.toHaveProperty('cryptoLibraries')
    expect(profile).not.toHaveProperty('infraAutomation')
    expect(profile).not.toHaveProperty('scenarioEstateId')
  })

  it('keeps well-formed lists and the estate id', () => {
    const result = computeAssessment({
      industry: 'Finance & Banking',
      country: 'United States',
      currentCrypto: [],
      currentCryptoCategories: ['Key Exchange'],
      dataSensitivity: ['high'],
      complianceRequirements: [],
      migrationStatus: 'planning',
      cryptoLibraries: ['OpenSSL'],
      infraAutomation: ['None'],
      scenarioEstateId: 'retail-bank',
    } as never)
    const decoded = decodeShareToken(encodeShareToken({ result })) as { result: typeof result }
    const profile = decoded.result.assessmentProfile!
    expect(profile.cryptoLibraries).toEqual(['OpenSSL'])
    expect(profile.infraAutomation).toEqual(['None'])
    expect(profile.algorithmsImplied?.length).toBeGreaterThan(0)
    expect(profile.scenarioEstateId).toBe('retail-bank')
  })
})
