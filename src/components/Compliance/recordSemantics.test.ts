// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  applyRecordScope,
  isCurrentStatus,
  pqcCoverageState,
  pqcCoverageSummary,
  pqcStageSummary,
  pqcStageSummaryLine,
  pqcUnknownReason,
  recordTypeLabel,
  scopeNotice,
  retrievalSummary,
  schemeCertificateId,
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
    expect(pqcCoverageSummary(rec({ pqcCoverage: '' }))).toMatch(/^Unknown/)
  })

  it('distinguishes "the page lists no algorithms" from "we could not read it"', () => {
    // NIST publishes some certificate pages (every "Classified Module", the AMD
    // ASP CoProcessors) with no Approved Algorithms section at all. Those pages
    // were read; saying they "could not be read" about them is wrong.
    const readNoList = {
      type: 'FIPS 140-3',
      cmvpDetailsFetchedAt: '2026-09-25T02:40:28+00:00',
    } as Parameters<typeof pqcUnknownReason>[0]
    const neverRead = { type: 'FIPS 140-3' } as Parameters<typeof pqcUnknownReason>[0]
    expect(pqcUnknownReason(readNoList)).toBe('source-lists-none')
    expect(pqcUnknownReason(neverRead)).toBe('source-not-read')
    expect(pqcCoverageSummary({ ...readNoList, pqcCoverage: '' })).toBe(
      'Unknown (the certificate page lists no algorithms)'
    )
    expect(pqcCoverageSummary({ ...neverRead, pqcCoverage: '' })).toBe(
      'Unknown (source page could not be read)'
    )
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

  it('labels the retrieval dates as UTC (a late-evening Central retrieval reads as the next day)', () => {
    const late: ComplianceMeta = {
      schemaVersion: 1,
      publicationId: 'x',
      partitions: { fips: { label: 'NIST CMVP', retrievedAt: '2026-10-23T02:05:53+00:00' } },
    }
    const line = retrievalSummary(snapshotRetrievalEntries(late))
    expect(line).toBe('NIST CMVP retrieved 23 Oct 2026 (dates in UTC)')
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

describe('schemeCertificateId', () => {
  it('hides the generated slug of a Common Criteria Portal listing', () => {
    expect(
      schemeCertificateId(rec({ type: 'Common Criteria', id: 'cc-hsm-firmware-2-0-3881cf5c' }))
    ).toBeNull()
  })

  it('keeps a real scheme certificate number', () => {
    expect(schemeCertificateId(rec({ type: 'Common Criteria', id: 'anssi-cc-2024-39' }))).toBe(
      'anssi-cc-2024-39'
    )
    expect(schemeCertificateId(rec({ type: 'FIPS 140-3', id: '4875' }))).toBe('4875')
  })

  it('does not treat a slug-shaped id of another record type as generated', () => {
    expect(schemeCertificateId(rec({ type: 'EUCC', id: 'cc-abc-0123abcd' }))).toBe(
      'cc-abc-0123abcd'
    )
  })
})

describe('pqcStageSummary', () => {
  const records = [
    rec({ id: 'a', type: 'FIPS 140-3', pqcCoverage: 'ML-KEM, ML-DSA' }),
    rec({ id: 'b', type: 'FIPS 140-3', pqcCoverage: 'No PQC Mechanisms Detected' }),
    rec({ id: 'c', type: 'FIPS 140-3', pqcCoverage: 'Potentially PQC (Name Match)' }),
    rec({ id: 'd', type: 'ACVP', pqcCoverage: 'ML-DSA' }),
    rec({ id: 'e', type: 'Common Criteria', pqcCoverage: 'ML-KEM' }),
  ]

  it('counts confirmed PQC on the FIPS 140-3 track only (no name matches, no CC)', () => {
    expect(pqcStageSummary(records)).toEqual({
      fipsCertificates: 3,
      fipsWithPqc: 1,
      cavpPqcValidations: 1,
    })
  })

  it('words the counts as one sentence, and says nothing when there is nothing to count', () => {
    expect(pqcStageSummaryLine(pqcStageSummary(records))).toBe(
      'PQC in this snapshot: 1 of 3 FIPS 140-3 certificates · 1 CAVP validations.'
    )
    expect(pqcStageSummaryLine(pqcStageSummary([]))).toBeNull()
  })
})
