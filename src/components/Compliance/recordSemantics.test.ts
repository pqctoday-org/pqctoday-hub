// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  applyRecordScope,
  isCurrentStatus,
  pqcCoverageState,
  pqcCoverageSummary,
  recordTypeLabel,
  scopeNotice,
  snapshotRetrievalEntries,
  statusTone,
} from './recordSemantics'
import { buildComplianceCsv } from './recordsExport'
import type { ComplianceMeta, ComplianceRecord } from './types'

const rec = (overrides: Partial<ComplianceRecord>): ComplianceRecord => ({
  id: '1',
  source: 'NIST',
  date: '2026-01-01',
  link: '',
  type: 'FIPS 140-3',
  status: 'Active',
  pqcCoverage: '',
  productName: 'P',
  productCategory: 'C',
  vendor: 'V',
  ...overrides,
})

describe('status semantics', () => {
  it('treats only Active and Validated as current', () => {
    expect(isCurrentStatus('Active')).toBe(true)
    expect(isCurrentStatus('Validated')).toBe(true)
    for (const s of ['Historical', 'Revoked', 'Archived', 'Expired', 'Withdrawn', 'Pending']) {
      expect(isCurrentStatus(s)).toBe(false)
    }
  })

  it('never defaults an unknown status to current', () => {
    expect(isCurrentStatus('Under Review')).toBe(false)
    expect(isCurrentStatus('')).toBe(false)
    expect(isCurrentStatus(undefined)).toBe(false)
    expect(statusTone('Under Review')).toBe('unknown')
  })

  it('keeps Validated CAVP rows in the current scope and drops historical ones', () => {
    const records = [
      rec({ id: 'a', status: 'Active' }),
      rec({ id: 'b', type: 'ACVP', status: 'Validated' }),
      rec({ id: 'c', status: 'Historical' }),
      rec({ id: 'd', type: 'Common Criteria', status: 'Archived' }),
      rec({ id: 'e', status: 'Mystery' }),
    ]
    expect(applyRecordScope(records, 'current').map((r) => r.id)).toEqual(['a', 'b'])
    expect(applyRecordScope(records, 'all')).toHaveLength(5)
  })
})

describe('type labels', () => {
  it('shows ACVP rows as NIST CAVP and CSPN as CSPN (ANSSI)', () => {
    expect(recordTypeLabel('ACVP')).toBe('NIST CAVP')
    expect(recordTypeLabel('CSPN')).toBe('CSPN (ANSSI)')
    expect(recordTypeLabel('Common Criteria')).toBe('Common Criteria')
    expect(recordTypeLabel('Something')).toBe('Something')
  })
})

describe('pqcCoverage semantics', () => {
  it("distinguishes '' (not read) from none", () => {
    expect(pqcCoverageState('')).toBe('not-read')
    expect(pqcCoverageState('No PQC Mechanisms Detected')).toBe('none')
    expect(pqcCoverageState('ML-KEM, ML-DSA')).toBe('named')
  })

  it('labels Security Target PQC names as named, not validated', () => {
    expect(pqcCoverageSummary(rec({ type: 'Common Criteria', pqcCoverage: 'ML-KEM' }))).toBe(
      'Named in the Security Target: ML-KEM'
    )
    expect(pqcCoverageSummary(rec({ type: 'CSPN', pqcCoverage: 'ML-DSA' }))).toBe(
      'Named in the Security Target: ML-DSA'
    )
    expect(pqcCoverageSummary(rec({ pqcCoverage: '' }))).toMatch(/^Not read/)
  })
})

describe('sidecar helpers', () => {
  const meta: ComplianceMeta = {
    schemaVersion: 1,
    publicationId: 'abc123',
    scope: { excluded: ['FIPS 140-2'] },
    partitions: {
      cc: { label: 'CC Portal', retrievedAt: '2026-09-24T10:00:00Z' },
      fips: { label: 'NIST CMVP', retrievedAt: '2026-09-25T01:00:00Z' },
      cavp: { label: 'NIST CAVP', retrievedAt: '2026-09-25' },
      eucc: { label: 'ENISA EUCC' },
    },
  }

  it('orders partitions and skips ones without a retrieval date', () => {
    const entries = snapshotRetrievalEntries(meta)
    expect(entries.map((e) => e.key)).toEqual(['fips', 'cavp', 'cc'])
    expect(entries[0].date).toBe('25 Sep 2026')
  })

  it('returns no retrieval entries without a sidecar', () => {
    expect(snapshotRetrievalEntries(null)).toEqual([])
  })

  it('mentions FIPS 140-3 only, CAVP, ANSSI (CC and CSPN) and EUCC in the scope notice', () => {
    const notice = scopeNotice(meta)
    expect(notice).toMatch(/FIPS 140-3 modules only/)
    expect(notice).toMatch(/NIST CAVP/)
    expect(notice).toMatch(/ANSSI \(CC and CSPN\)/)
    expect(notice).toMatch(/EUCC/)
    expect(notice).toMatch(/Excluded: FIPS 140-2/)
  })

  it('exports carry the scope preamble and respect the record scope', () => {
    const csv = buildComplianceCsv(
      [
        rec({ id: 'cur', status: 'Active' }),
        rec({ id: 'old', status: 'Historical' }),
        rec({ id: 'A9', type: 'ACVP', status: 'Validated', pqcCoverage: 'ML-KEM' }),
      ],
      { meta, scope: 'current' }
    )
    const lines = csv.split('\n')
    expect(lines[0]).toBe('# PQC Today certification records export')
    expect(csv).toMatch(/Dataset scope: FIPS 140-3 modules only/)
    expect(csv).toMatch(/Records: current only/)
    expect(csv).toMatch(/Publication: abc123/)
    expect(csv).toMatch(/\ncur,/)
    expect(csv).not.toMatch(/\nold,/)
    expect(csv).toMatch(/NIST CAVP/)
    expect(csv).not.toMatch(/,ACVP,/)
  })
})
