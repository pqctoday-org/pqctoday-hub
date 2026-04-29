// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { selectTransitionsForCrypto } from './useAlgorithmTransitionsForAssessment'
import type { AlgorithmTransition } from '@/data/algorithmsData'

const fixture: AlgorithmTransition[] = [
  {
    classical: 'RSA',
    keySize: '2048-bit',
    pqc: 'ML-KEM-512',
    function: 'Encryption/KEM',
    deprecationDate: '2030',
    standardizationDate: '2024',
    region: 'NIST',
    status: 'FIPS 203',
    statusUrl: 'https://example.test/fips203',
  },
  {
    classical: 'RSA',
    keySize: '3072-bit',
    pqc: 'ML-KEM-768',
    function: 'Encryption/KEM',
    deprecationDate: '2035',
    standardizationDate: '2024',
    region: 'NIST',
    status: 'FIPS 203',
  },
  {
    classical: 'ECDH (P-256)',
    pqc: 'ML-KEM-768',
    function: 'Encryption/KEM',
    deprecationDate: '2030',
    standardizationDate: '2024',
    region: 'NIST',
    status: 'FIPS 203',
  },
  {
    classical: 'Any (Stateless)',
    pqc: 'SLH-DSA',
    function: 'Signature',
    deprecationDate: '',
    standardizationDate: '2024',
    region: 'NIST',
    status: 'FIPS 205',
  },
]

describe('selectTransitionsForCrypto', () => {
  it('returns empty when no crypto reported', () => {
    expect(selectTransitionsForCrypto([], fixture)).toEqual([])
  })

  it('joins reported crypto keys to transition rows', () => {
    const result = selectTransitionsForCrypto(['RSA-2048', 'ECDH P-256'], fixture)
    expect(result.map((r) => r.storedKey)).toEqual(['RSA-2048', 'ECDH P-256'])
    expect(result[0].pqc).toBe('ML-KEM-512')
    expect(result[1].pqc).toBe('ML-KEM-768')
  })

  it('preserves transition fields needed for downstream artifacts', () => {
    const [row] = selectTransitionsForCrypto(['RSA-2048'], fixture)
    expect(row).toMatchObject({
      classical: 'RSA',
      keySize: '2048-bit',
      pqc: 'ML-KEM-512',
      deprecationDate: '2030',
      region: 'NIST',
      status: 'FIPS 203',
    })
  })

  it('skips placeholder "Any (...)" rows', () => {
    const result = selectTransitionsForCrypto(['Any Stateless'], fixture)
    expect(result).toEqual([])
  })

  it('deduplicates by storedKey when CSV has multiple region rows', () => {
    const dup: AlgorithmTransition[] = [...fixture, { ...fixture[0], region: 'CNSA 2.0' }]
    const result = selectTransitionsForCrypto(['RSA-2048'], dup)
    expect(result).toHaveLength(1)
  })

  it('ignores reported crypto with no matching transition', () => {
    const result = selectTransitionsForCrypto(['Made-Up-Algo'], fixture)
    expect(result).toEqual([])
  })
})
