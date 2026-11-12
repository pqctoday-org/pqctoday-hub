// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { normalizeCavpParameterSets, resolveCavpParameterSets } from './cavpParameterSets'
import { fetchStaticComplianceData } from './complianceDataLoader'
import type { ComplianceRecord } from './types'
const sample = (): ComplianceRecord => ({
  id: 'A6462',
  source: 'NIST',
  type: 'ACVP',
  status: 'Validated',
  date: '2025-01-06',
  link: 'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=19197',
  pqcCoverage: 'ML-DSA',
  productName: 'Sample captured record',
  productCategory: 'Algorithm Implementation',
  vendor: 'Sample',
  cavpCapabilities: [
    {
      algorithm: 'ML-DSA SigGen',
      operatingEnvironment: 'Sample environment A',
      parameterSets: [],
      functions: [],
      details: [
        'Signature Interfaces: external, internal',
        'Capabilities: Parameter Sets: ML-DSA-44, ML-DSA-65, ML-DSA-87',
        'Message Length: 8-65536 Increment 8',
      ],
    },
    {
      algorithm: 'ML-DSA SigVer',
      operatingEnvironment: 'Sample environment B',
      parameterSets: [],
      functions: [],
      details: ['Message Length: 8-65536 Increment 8'],
    },
  ],
})
afterEach(() => vi.unstubAllGlobals())
describe('CAVP captured parameters shared by desktop and phone', () => {
  it('fills only an explicit same-row parsing gap while retaining publication and provenance', () => {
    const original = sample(),
      before = JSON.stringify(original)
    const normalized = normalizeCavpParameterSets(original)
    expect(normalized.cavpCapabilities![0].parameterSets).toEqual([
      'ML-DSA-44',
      'ML-DSA-65',
      'ML-DSA-87',
    ])
    expect(normalized.cavpCapabilities![1].parameterSets).toEqual([])
    expect(normalized.cavpCapabilities![0].details).toBe(original.cavpCapabilities![0].details)
    expect(normalized.cavpCapabilities![0].operatingEnvironment).toBe('Sample environment A')
    expect(normalized.link).toBe(original.link)
    expect(normalized.id).toBe(original.id)
    expect(JSON.stringify(original)).toBe(before)
    expect(normalizeCavpParameterSets(normalized)).toBe(normalized)
  })
  it('preserves structured values and literal legacy identifiers rather than inferring a modern equivalent', () => {
    expect(
      resolveCavpParameterSets({
        parameterSets: ['ML-DSA-44'],
        details: ['Parameter Sets: ML-DSA-65'],
      })
    ).toEqual(['ML-DSA-44'])
    expect(resolveCavpParameterSets({ details: ['Parameter Sets: Kyber-768, Kyber-768'] })).toEqual(
      ['Kyber-768']
    )
    expect(
      resolveCavpParameterSets({
        details: ['Note: Parameter Sets: ML-DSA-87', 'Message Length: 256'],
      })
    ).toEqual([])
  })
  it('feeds the existing record fields used by both shells without changing the publication or legacy-type filter', async () => {
    const original = sample()
    const historical = { ...sample(), id: 'legacy', type: 'FIPS 140-2' }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [original, historical] })
    )
    const rows = await fetchStaticComplianceData()
    expect(rows).toHaveLength(1)
    expect(rows[0].cavpCapabilities![0].parameterSets).toEqual([
      'ML-DSA-44',
      'ML-DSA-65',
      'ML-DSA-87',
    ])
    expect(rows[0].cavpCapabilities![1].parameterSets).toEqual([])
    expect(original.cavpCapabilities![0].parameterSets).toEqual([])
  })
})
