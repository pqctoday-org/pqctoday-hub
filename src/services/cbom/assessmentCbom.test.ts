// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildAssessmentCbom } from './assessmentCbom'

const bank = [
  { storedKey: 'RSA-2048', classical: 'RSA', keySize: '2048-bit', pqc: 'ML-KEM-512' },
  { storedKey: 'ECDH P-256', classical: 'ECDH (P-256)', keySize: '256-bit', pqc: 'ML-KEM-512' },
  { storedKey: 'AES-256', classical: 'AES-256', keySize: '256-bit', pqc: 'AES-256' },
]

describe('assessment CBOM scope', () => {
  it('exports exactly the declared bank algorithms and known parameters, without catalogue or replacement claims', () => {
    const output = buildAssessmentCbom(bank)
    const doc = JSON.parse(output.json)
    expect(doc.specVersion).toBe('1.7')
    expect(doc.components.map((c: { name: string }) => c.name)).toEqual([
      'RSA (2048-bit)',
      'ECDH (P-256) (256-bit)',
      'AES-256 (256-bit)',
    ])
    expect(doc.components.every((c: { type: string }) => c.type === 'cryptographic-asset')).toBe(
      true
    )
    const [rsa, ecdh, aes] = doc.components.map(
      (c: { cryptoProperties: unknown }) => c.cryptoProperties
    )
    expect(rsa.algorithmProperties).toEqual({
      primitive: 'unknown',
      parameterSetIdentifier: '2048',
    })
    expect(ecdh.algorithmProperties.ellipticCurve).toBe('nist/P-256')
    expect(aes.algorithmProperties.parameterSetIdentifier).toBe('256')
    expect(output.json).not.toMatch(
      /OpenSSL|ML-KEM|ML-DSA|software-plain-ram|providedBy|certification-report/
    )
    expect(output.summary).toMatchObject({
      basis: 'assessment-self-report',
      componentCount: 3,
      cryptoAssetCount: 3,
      quantumUnassessedCount: 3,
      quantumSafeCount: 0,
      quantumVulnerableCount: 0,
      byType: { 'cryptographic-asset': 3 },
    })
    expect(output.summary.algorithms.map((a) => a.name)).toEqual(
      doc.components.map((c: { name: string }) => c.name)
    )
  })

  it('updates scope and identifiers when selections change, including empty selections', () => {
    const smaller = JSON.parse(buildAssessmentCbom([bank[2]]).json)
    expect(smaller.components).toHaveLength(1)
    const sizes = JSON.parse(
      buildAssessmentCbom([
        bank[0],
        { storedKey: 'RSA-4096', classical: 'RSA', keySize: '4096-bit' },
      ]).json
    )
    expect(new Set(sizes.components.map((c: { 'bom-ref': string }) => c['bom-ref'])).size).toBe(2)
    expect(JSON.parse(buildAssessmentCbom([]).json).components).toEqual([])
    expect(buildAssessmentCbom([]).summary.cryptoAssetCount).toBe(0)
  })

  it('keeps unspecified curves and algorithm details unknown instead of guessing from key length', () => {
    const output = buildAssessmentCbom([
      { storedKey: 'ec', classical: 'ECDH', keySize: '256-bit' },
      { storedKey: 'unknown', classical: 'Unspecified algorithm' },
    ])
    const doc = JSON.parse(output.json)
    expect(doc.components[0].cryptoProperties.algorithmProperties.ellipticCurve).toBeUndefined()
    expect(doc.components[1].cryptoProperties.algorithmProperties).toEqual({ primitive: 'unknown' })
    expect(output.summary.algorithms[1].classical).toBeUndefined()
    expect(output.summary.quantumUnassessedCount).toBe(2)
  })
})
