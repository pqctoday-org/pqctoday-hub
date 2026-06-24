// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  ALGORITHM_FAMILIES,
  canonicalAlgorithmFamily,
  matchesAlgorithmFamilyFilter,
} from './AlgorithmFamilyFilter'

describe('canonicalAlgorithmFamily', () => {
  const cases: [string, string | null][] = [
    ['Lattice-based', 'Lattice-based'],
    ['Lattice', 'Lattice-based'],
    ['Lattice-based (NTRU)', 'Lattice-based'],
    ['ML-KEM', 'Lattice-based'],
    ['ML-KEM (CRYSTALS-Kyber)', 'Lattice-based'],
    ['ML-DSA', 'Lattice-based'],
    ['Falcon', 'Lattice-based'],
    ['Hash-based (stateful)', 'Hash-based'],
    ['SLH-DSA', 'Hash-based'],
    ['Code-based (Classic McEliece)', 'Code-based'],
    ['HQC', 'Code-based'],
    ['BIKE', 'Code-based'],
    ['Multivariate (UOV)', 'Multivariate / MPCitH'],
    ['MPC-in-the-Head (MQ)', 'Multivariate / MPCitH'],
    ['Isogeny', 'Isogeny-based'],
    ['CSIDH', 'Isogeny-based'],
    ['QKD', 'QKD / Quantum'],
    ['Symmetric', 'Symmetric'],
    ['AES-256', 'Symmetric'],
    ['RSA', 'Classical (RSA/ECC)'],
    ['ECDSA', 'Classical (RSA/ECC)'],
    ['X25519', 'Classical (RSA/ECC)'],
    // hybrid is checked first, even when a lattice keyword is also present
    ['Hybrid PQC', 'Hybrid PQ/Classical'],
    ['PQ/T Hybrid', 'Hybrid PQ/Classical'],
    ['ML-DSA (hybrid combiner)', 'Hybrid PQ/Classical'],
    // vague / non-family tokens carry no family
    ['N/A', null],
    ['Various', null],
    ['Protocol', null],
    ['Guidelines', null],
  ]

  it.each(cases)('maps %j → %j', (input, expected) => {
    expect(canonicalAlgorithmFamily(input)).toBe(expected)
  })

  it('only ever returns a value from the canonical family list (or null)', () => {
    const valid = new Set<string>([...ALGORITHM_FAMILIES])
    for (const [input] of cases) {
      const fam = canonicalAlgorithmFamily(input)
      if (fam !== null) expect(valid.has(fam)).toBe(true)
    }
  })
})

describe('matchesAlgorithmFamilyFilter', () => {
  it('returns true when no family is selected', () => {
    expect(matchesAlgorithmFamilyFilter([], ['ML-KEM'])).toBe(true)
  })
  it('matches when a token canonicalizes to a selected family', () => {
    expect(matchesAlgorithmFamilyFilter(['Lattice-based'], ['ML-KEM'])).toBe(true)
  })
  it('does not match an unrelated family', () => {
    expect(matchesAlgorithmFamilyFilter(['Hash-based'], ['ML-KEM'])).toBe(false)
  })
  it('does not match vague tokens that carry no family', () => {
    expect(matchesAlgorithmFamilyFilter(['Lattice-based'], ['N/A'])).toBe(false)
  })
  it('matches if ANY of several tokens hits a selected family (OR-within-item)', () => {
    expect(matchesAlgorithmFamilyFilter(['Code-based'], ['RSA', 'HQC'])).toBe(true)
  })
})
