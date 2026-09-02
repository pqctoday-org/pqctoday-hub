// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  buildMonthlyPqcCertificationTrend,
  isAmbiguousPqcMatch,
  isConfirmedPqcAlgorithm,
} from './pqcCertificationTrendModel'
import type { ComplianceRecord } from './types'

function makeRecord(overrides: Partial<ComplianceRecord>): ComplianceRecord {
  return {
    id: 'x',
    source: 'NIST',
    date: '2024-06-15',
    link: 'https://example.com',
    type: 'ACVP',
    status: 'Active',
    pqcCoverage: 'ML-KEM',
    productName: 'Test',
    productCategory: 'Algorithm Implementation',
    vendor: 'Test Vendor',
    ...overrides,
  }
}

describe('isConfirmedPqcAlgorithm', () => {
  it('excludes non-PQC and ambiguous coverage values', () => {
    expect(isConfirmedPqcAlgorithm(false)).toBe(false)
    expect(isConfirmedPqcAlgorithm('')).toBe(false)
    expect(isConfirmedPqcAlgorithm('No PQC Mechanisms Detected')).toBe(false)
    expect(isConfirmedPqcAlgorithm('Potentially PQC (Name Match)')).toBe(false)
  })

  it('includes each confirmed algorithm keyword', () => {
    for (const keyword of ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS', 'HSS', 'XMSS', 'Falcon']) {
      expect(isConfirmedPqcAlgorithm(keyword)).toBe(true)
    }
  })

  it('includes comma-combined algorithm values', () => {
    expect(isConfirmedPqcAlgorithm('ML-DSA, ML-KEM')).toBe(true)
  })
})

describe('isAmbiguousPqcMatch', () => {
  it('matches only the name-match flag, case-insensitively', () => {
    expect(isAmbiguousPqcMatch('Potentially PQC (Name Match)')).toBe(true)
    expect(isAmbiguousPqcMatch('Potentially PQC (name match)')).toBe(true)
    expect(isAmbiguousPqcMatch('ML-KEM')).toBe(false)
    expect(isAmbiguousPqcMatch(false)).toBe(false)
  })
})

describe('buildMonthlyPqcCertificationTrend', () => {
  const referenceDate = new Date('2024-08-15T00:00:00Z')

  it('buckets FIPS 140-2 and FIPS 140-3 together', () => {
    const records = [
      makeRecord({ type: 'FIPS 140-3', date: '2024-05-01', pqcCoverage: 'ML-KEM' }),
      // Raw compliance-data.json carries 'FIPS 140-2' even though it's outside the
      // narrower ComplianceType union — the model must still bucket it correctly.
      makeRecord({
        type: 'FIPS 140-2' as ComplianceRecord['type'],
        date: '2024-05-02',
        pqcCoverage: 'ML-DSA',
      }),
    ]
    const trend = buildMonthlyPqcCertificationTrend(records, referenceDate)
    expect(trend.find((t) => t.month === '2024-05')?.fips).toBe(2)
  })

  it('buckets EUCC with Common Criteria', () => {
    const records = [
      makeRecord({ type: 'Common Criteria', date: '2024-05-01', pqcCoverage: 'ML-KEM' }),
      makeRecord({ type: 'EUCC', date: '2024-05-02', pqcCoverage: 'ML-DSA' }),
    ]
    const trend = buildMonthlyPqcCertificationTrend(records, referenceDate)
    expect(trend.find((t) => t.month === '2024-05')?.cc).toBe(2)
  })

  it('zero-fills months with no confirmed-PQC certs', () => {
    const records = [makeRecord({ date: '2024-05-01' }), makeRecord({ date: '2024-08-01' })]
    const trend = buildMonthlyPqcCertificationTrend(records, referenceDate)
    expect(trend.map((t) => t.month)).toEqual([
      '2024-01',
      '2024-02',
      '2024-03',
      '2024-04',
      '2024-05',
      '2024-06',
      '2024-07',
      '2024-08',
    ])
    expect(trend.find((t) => t.month === '2024-06')?.total).toBe(0)
  })

  it('drops records after the reference month', () => {
    const records = [makeRecord({ date: '2024-09-01' })]
    const trend = buildMonthlyPqcCertificationTrend(records, referenceDate)
    expect(trend.some((t) => t.month === '2024-09')).toBe(false)
    expect(trend.reduce((sum, t) => sum + t.total, 0)).toBe(0)
  })

  it('drops records before startMonth', () => {
    const records = [makeRecord({ date: '2023-12-01' })]
    const trend = buildMonthlyPqcCertificationTrend(records, referenceDate)
    expect(trend.reduce((sum, t) => sum + t.total, 0)).toBe(0)
  })

  it('excludes unconfirmed pqcCoverage from every bucket', () => {
    const records = [
      makeRecord({ date: '2024-05-01', pqcCoverage: 'No PQC Mechanisms Detected' }),
      makeRecord({ date: '2024-05-01', pqcCoverage: 'Potentially PQC (Name Match)' }),
      makeRecord({ date: '2024-05-01', pqcCoverage: false }),
    ]
    const trend = buildMonthlyPqcCertificationTrend(records, referenceDate)
    expect(trend.reduce((sum, t) => sum + t.total, 0)).toBe(0)
  })

  it('respects a custom startMonth', () => {
    const records = [makeRecord({ date: '2024-03-01' })]
    const trend = buildMonthlyPqcCertificationTrend(records, referenceDate, '2024-03')
    expect(trend[0].month).toBe('2024-03')
    expect(trend.find((t) => t.month === '2024-03')?.total).toBe(1)
  })
})
