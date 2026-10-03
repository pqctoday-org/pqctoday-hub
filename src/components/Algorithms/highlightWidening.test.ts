// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  planHighlightWidening,
  WIDE_OPEN_FILTERS,
  type ExplorerFilterState,
} from './useAlgorithmExplorer'
import {
  algoMatchesHighlight,
  findTransitionRows,
  highlightNameMatches,
  parseHighlight,
  transitionMatchesHighlight,
  transitionRowId,
  transitionRowSlug,
} from './highlightMatch'
import { algorithmsData } from '@/data/algorithmsData'

type Row = { name: string; nist: boolean; certified: boolean }
const rows: Row[] = [
  { name: 'ML-KEM-768', nist: true, certified: true },
  { name: 'HQC-128', nist: false, certified: true },
  { name: 'Some-Candidate', nist: false, certified: false },
]
const passes = (r: Row, f: ExplorerFilterState) =>
  (f.quickView !== 'nist-picks' || r.nist) && (f.status !== 'Certified' || r.certified)
const matches = (r: Row, n: string) => algoMatchesHighlight(r.name, n)
const defaults: ExplorerFilterState = {
  ...WIDE_OPEN_FILTERS,
  quickView: 'nist-picks',
  status: 'Certified',
}

describe('planHighlightWidening', () => {
  it('does nothing when every highlighted row is already visible', () => {
    expect(planHighlightWidening(['ML-KEM-768'], rows, defaults, passes, matches)).toEqual({
      unknown: [],
      widenTo: null,
    })
  })

  it('drops only the quick view when that is enough', () => {
    const plan = planHighlightWidening(['HQC-128'], rows, defaults, passes, matches)
    expect(plan.widenTo).toEqual({ ...defaults, quickView: 'none' })
  })

  it('clears every filter when dropping the quick view is not enough', () => {
    const plan = planHighlightWidening(['Some-Candidate'], rows, defaults, passes, matches)
    expect(plan.widenTo).toEqual(WIDE_OPEN_FILTERS)
  })

  it('reports names that match no row, without widening for them', () => {
    const plan = planHighlightWidening(
      ['Falcon-512', 'ML-KEM-768'],
      rows,
      defaults,
      passes,
      matches
    )
    expect(plan).toEqual({ unknown: ['Falcon-512'], widenTo: null })
  })
})

describe('highlightMatch', () => {
  it('parses a comma list', () => {
    expect(parseHighlight(' ML-KEM-768, ,HQC-128 ')).toEqual(['ML-KEM-768', 'HQC-128'])
    expect(parseHighlight(null)).toEqual([])
  })

  it('matches transition rows on either column with the same token rule', () => {
    const t = { function: 'KEM', classical: 'RSA', pqc: 'ML-KEM-768 (FIPS 203)' }
    expect(transitionMatchesHighlight(t, 'RSA-2048')).toBe(true)
    expect(transitionMatchesHighlight(t, 'ml-kem-768')).toBe(true)
    // A family name now reaches its parameter sets on this tab too.
    expect(transitionMatchesHighlight(t, 'ML-KEM')).toBe(true)
    expect(transitionMatchesHighlight(t, 'RSA-PSS')).toBe(false)
    expect(transitionRowId(t)).toBe('KEM|RSA|ML-KEM-768 (FIPS 203)')
  })
})

// Owner decision 2026-10-03: ?highlight matches at token boundaries, not as a
// two-way substring (which let `3des` tint DES and `ML-KEM-768` tint the
// ML-KEM-768-ECDH-P256 composite). [name, highlight, expected]
describe('highlightNameMatches — token-boundary rule', () => {
  it.each([
    ['ML-KEM-768', 'ML-KEM', true],
    ['ML-KEM-512', 'ml-kem', true],
    ['ML-KEM-768', 'ML-KEM-768', true],
    ['ML-KEM-768-ECDH-P256', 'ML-KEM-768', false],
    ['ML-KEM-768', 'ML-KEM-768-ECDH-P256', false],
    ['ML-KEM-768-RSA-OAEP-2048', 'ML-KEM-768', false],
    ['X25519MLKEM768', 'ML-KEM-768', false],
    ['DES', '3DES', false],
    ['3DES', 'DES', false],
    ['DES', 'des', true],
    ['RSA-2048', 'RSA', true],
    ['RSA', 'RSA-2048', true],
    ['RSA-PSS', 'RSA', false],
    ['ML-KEM-768', 'ML-KEM-768 (FIPS 203)', true],
    ['FN-DSA-512', 'fn-dsa', true],
    ['FN-DSA-1024', 'FN-DSA', true],
    ['Falcon-512', 'Falcon', true],
    ['Falcon-1024', 'falcon-1024', true],
    ['FN-DSA-512', 'Falcon-512', false],
    ['Falcon-512', 'Falcon-1024', false],
    ['HQC-128', 'HQC', true],
    ['HQC-128', 'HQC-1', false],
    ['SLH-DSA-SHA2-128s', 'SLH-DSA', true],
    ['SLH-DSA-SHA2-128s', 'SLH-DSA-SHA2-128', false],
    ['LMS-SHA256 (H20/W8)', 'LMS', true],
    ['XMSS-SHA2_20', 'XMSS', true],
    ['Classic-McEliece-348864', 'Classic McEliece', true],
    ['Aigis-enc-L1', 'Aigis-enc', true],
    ['NTRU+-768', 'NTRU+', true],
    ['ECDH P-256', 'ECDH', true],
    ['ECDSA P-384', 'ECDSA', true],
    ['ECDH P-256', 'ECDSA', false],
    ['DH (Diffie-Hellman)', 'DH', true],
    ['DH (Diffie-Hellman)', 'diffie-hellman', true],
    ['ECDH (P-256)', 'P-256', true],
    ['DH (Diffie-Hellman)', 'ECDH', false],
    ['X25519', 'X448', false],
    ['', 'RSA', false],
    ['RSA', '', false],
  ])('%s ← ?highlight=%s → %s', (name, h, expected) => {
    expect(highlightNameMatches(name, h)).toBe(expected)
    expect(algoMatchesHighlight(name, h)).toBe(expected)
  })
})

describe('?transition row slug', () => {
  const t = {
    function: 'Encryption/KEM',
    classical: 'ECDH (P-256)',
    pqc: 'ML-KEM-512 (NIST Level 1)',
  }

  it('is the kebab-case of function, classical and PQC', () => {
    expect(transitionRowSlug(t)).toBe('encryption-kem-ecdh-p-256-ml-kem-512-nist-level-1')
    expect(transitionRowSlug({ function: 'Key Agreement', classical: 'DH', pqc: '' })).toBe(
      'key-agreement-dh'
    )
  })

  it('finds rows case-insensitively and nothing for an unknown or empty value', () => {
    const rows = [t, { ...t, pqc: 'HQC-128 (NIST Level 1)' }]
    expect(findTransitionRows(rows, transitionRowSlug(t).toUpperCase())).toEqual([t])
    expect(findTransitionRows(rows, 'nope')).toEqual([])
    expect(findTransitionRows(rows, null)).toEqual([])
  })

  it('maps one-to-one onto transitionRowId across the wired transitions CSV', () => {
    const bySlug = new Map<string, Set<string>>()
    for (const r of algorithmsData) {
      const slug = transitionRowSlug(r)
      expect(slug, transitionRowId(r)).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      bySlug.set(slug, (bySlug.get(slug) ?? new Set()).add(transitionRowId(r)))
    }
    const collisions = [...bySlug].filter(([, ids]) => ids.size > 1)
    expect(collisions).toEqual([])
  })

  it('every wired transition row is highlighted by its own PQC name', () => {
    for (const r of algorithmsData.filter((x) => x.pqc)) {
      const pqcName = r.pqc.split(/\s*\(/)[0].trim()
      expect(transitionMatchesHighlight(r, pqcName), transitionRowId(r)).toBe(true)
    }
  })
})
