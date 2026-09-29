// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  planHighlightWidening,
  WIDE_OPEN_FILTERS,
  type ExplorerFilterState,
} from './useAlgorithmExplorer'
import {
  algoMatchesHighlight,
  parseHighlight,
  transitionMatchesHighlight,
  transitionRowId,
} from './highlightMatch'

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

  it('matches transition rows on classical substring or exact PQC name', () => {
    const t = { function: 'KEM', classical: 'RSA', pqc: 'ML-KEM-768 (FIPS 203)' }
    expect(transitionMatchesHighlight(t, 'RSA-2048')).toBe(true)
    expect(transitionMatchesHighlight(t, 'ml-kem-768')).toBe(true)
    expect(transitionMatchesHighlight(t, 'ML-KEM')).toBe(false)
    expect(transitionRowId(t)).toBe('KEM|RSA|ML-KEM-768 (FIPS 203)')
  })
})
