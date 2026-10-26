// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  describeExclusions,
  matchesCertType,
  matchesRecordText,
  recordFilterExclusions,
  restoreRecordParams,
  widenRecordParams,
  type RecordFilterState,
} from './recordFilters'
import type { ComplianceRecord } from './types'

const record: ComplianceRecord = {
  id: '4967',
  source: 'NIST',
  date: '2020-01-01',
  link: 'https://example.test',
  type: 'FIPS 140-3',
  status: 'Historical',
  pqcCoverage: 'No PQC Mechanisms Detected',
  productName: 'Old Module',
  productCategory: 'HSM',
  vendor: 'Acme',
}

const none: RecordFilterState = {
  scope: 'all',
  certType: 'all',
  text: '',
  pqc: [],
  category: [],
  source: [],
  vendor: [],
  migrateCat: [],
}

describe('recordFilterExclusions', () => {
  it('is empty when nothing excludes the record', () => {
    expect(recordFilterExclusions(record, none)).toEqual([])
  })

  it('names the default current-only scope for a historical record', () => {
    expect(recordFilterExclusions(record, { ...none, scope: 'current' })).toEqual(['rstatus'])
  })

  it('names each excluding same-URL filter, and only those', () => {
    const keys = recordFilterExclusions(record, {
      ...none,
      certType: 'cc',
      text: 'zzz',
      pqc: ['ML-KEM'],
      vendor: ['Acme'],
    })
    expect(keys).toEqual(['rtab', 'q', 'pqc'])
  })
})

describe('widen / restore', () => {
  it('relaxes only the excluding filters and keeps cert, tab and the rest', () => {
    const before = new URLSearchParams('tab=records&cert=4967&rtab=cc&vendor=Acme&page=3')
    const widened = widenRecordParams(before, ['rstatus', 'rtab'])
    expect(widened.get('rstatus')).toBe('all')
    expect(widened.get('rtab')).toBeNull()
    expect(widened.get('vendor')).toBe('Acme')
    expect(widened.get('cert')).toBe('4967')
    expect(widened.get('tab')).toBe('records')
    expect(widened.get('page')).toBeNull()
  })

  it('undo puts back exactly the relaxed filters on top of the current URL', () => {
    const before = new URLSearchParams('tab=records&cert=4967&rtab=cc')
    const now = new URLSearchParams('tab=records&rstatus=all') // record since closed
    const restored = restoreRecordParams(now, before, ['rstatus', 'rtab'])
    expect(restored.get('rstatus')).toBeNull()
    expect(restored.get('rtab')).toBe('cc')
    expect(restored.get('cert')).toBeNull()
  })

  it('describes the relaxed filters in a sentence', () => {
    expect(describeExclusions(['rstatus'])).toBe('the current-only scope')
    expect(describeExclusions(['q', 'pqc', 'tier'])).toBe(
      'the search, the PQC filter and the trust-tier filter'
    )
  })
})

describe('EUCC certificates in the record search and tabs', () => {
  const nokia: ComplianceRecord = {
    id: 'enisa-eucc-3089-2026-000002-i-00',
    euccCertificateId: 'EUCC-3089-2026-002',
    source: 'ENISA',
    date: '2026-09-10',
    link: 'https://certification.enisa.europa.eu/certificates/eucc-3089-2026-000002-i-00_en',
    type: 'EUCC',
    status: 'Active',
    pqcCoverage: '',
    productName: 'Nokia Lightspan Access Node MF-2',
    productCategory: 'Network device',
    vendor: 'Nokia Solutions and Networks Oy',
  }
  const commonCriteria: ComplianceRecord = {
    ...record,
    id: 'cc-gamma-smart-card-3881cf5c',
    source: 'Common Criteria',
    type: 'Common Criteria',
    status: 'Active',
    productName: 'Gamma Smart Card',
    vendor: 'Gamma',
  }

  it('finds an EUCC record by the certificate number the table shows, whole or in part', () => {
    expect(matchesRecordText(nokia, 'EUCC-3089-2026-002')).toBe(true)
    expect(matchesRecordText(nokia, 'eucc-3089-2026-002')).toBe(true)
    expect(matchesRecordText(nokia, '3089-2026-002')).toBe(true)
    // The Common Criteria row has no such number and is not matched by it.
    expect(matchesRecordText(commonCriteria, 'EUCC-3089-2026-002')).toBe(false)
    expect(matchesRecordText(commonCriteria, 'gamma')).toBe(true)
  })

  it('the EUCC tab holds EUCC records only; Common Criteria holds none of them', () => {
    expect(matchesCertType(nokia, 'eucc')).toBe(true)
    expect(matchesCertType(nokia, 'EUCC')).toBe(true)
    expect(matchesCertType(commonCriteria, 'eucc')).toBe(false)
    expect(matchesCertType(nokia, 'cc')).toBe(false)
    expect(matchesCertType(nokia, 'all')).toBe(true)
    expect(recordFilterExclusions(commonCriteria, { ...none, certType: 'eucc' })).toEqual(['rtab'])
    expect(recordFilterExclusions(nokia, { ...none, certType: 'eucc' })).toEqual([])
  })
})
