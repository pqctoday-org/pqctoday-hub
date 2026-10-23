// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { TestResult } from '../../../hsm/acvp/useAcvpSuite'
import type { EvidenceClassId } from '@/data/validation/evidenceClasses'
import {
  NO_FILTER,
  applyResultFilter,
  classesByRow,
  countByClass,
  isFiltered,
} from './acvpResultFilter'

const row = (id: string, status: TestResult['status']): TestResult => ({
  id,
  algorithm: 'A',
  testCase: id,
  referenceUrl: '',
  status,
  details: '',
  category: 'kdf',
})

const results = [
  row('a', 'pass'),
  row('b', 'pass'),
  row('c', 'fail'),
  row('d', 'skip'),
  row('e', 'pass'),
]

const classes: Record<string, EvidenceClassId[]> = {
  a: ['nist-acvp-reference-sample'],
  b: ['published-standard-kat'],
  c: ['published-standard-kat', 'independent-oracle'],
  e: ['published-standard-kat', 'published-standard-kat'],
}
const rowClasses = classesByRow(results, (id) => classes[id] ?? [])
const ids = (rs: readonly TestResult[]) => rs.map((r) => r.id)

describe('acvpResultFilter', () => {
  it('returns the same array when nothing is filtered', () => {
    expect(isFiltered(NO_FILTER)).toBe(false)
    expect(applyResultFilter(results, NO_FILTER, rowClasses)).toBe(results)
  })

  it('filters by status', () => {
    expect(
      ids(applyResultFilter(results, { status: 'fail', evidenceClass: null }, rowClasses))
    ).toEqual(['c'])
    expect(
      ids(applyResultFilter(results, { status: 'skip', evidenceClass: null }, rowClasses))
    ).toEqual(['d'])
    expect(
      ids(applyResultFilter(results, { status: 'pass', evidenceClass: null }, rowClasses))
    ).toEqual(['a', 'b', 'e'])
  })

  it('filters by evidence class, and a row with two classes shows under each', () => {
    const f = (evidenceClass: Parameters<typeof applyResultFilter>[1]['evidenceClass']) =>
      ids(applyResultFilter(results, { status: 'all', evidenceClass }, rowClasses))
    expect(f('published-standard-kat')).toEqual(['b', 'c', 'e'])
    expect(f('independent-oracle')).toEqual(['c'])
    expect(f('nist-acvp-reference-sample')).toEqual(['a'])
  })

  it('"none" selects the rows with no evidence badge', () => {
    expect(
      ids(applyResultFilter(results, { status: 'all', evidenceClass: 'none' }, rowClasses))
    ).toEqual(['d'])
  })

  it('combines status and class', () => {
    expect(
      ids(
        applyResultFilter(
          results,
          { status: 'pass', evidenceClass: 'published-standard-kat' },
          rowClasses
        )
      )
    ).toEqual(['b', 'e'])
  })

  it('does not apply the class filter while the run is still streaming (no class map yet)', () => {
    expect(
      ids(applyResultFilter(results, { status: 'fail', evidenceClass: 'independent-oracle' }, null))
    ).toEqual(['c'])
    expect(ids(applyResultFilter(results, { status: 'all', evidenceClass: 'none' }, null))).toEqual(
      ['a', 'b', 'c', 'd', 'e']
    )
  })

  it('counts rows per class, with no-badge rows under "none" and duplicates counted once per row', () => {
    const counts = countByClass(rowClasses)
    expect(counts.get('published-standard-kat')).toBe(3)
    expect(counts.get('nist-acvp-reference-sample')).toBe(1)
    expect(counts.get('independent-oracle')).toBe(1)
    expect(counts.get('none')).toBe(1)
  })
})
