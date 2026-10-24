// SPDX-License-Identifier: AGPL-3.0-only
//
// NIST entropy source validations (ESV, SP 800-90B) as a first-class record type:
// label, status, "PQC does not apply", the `?rtab=esv` tab, the facets that must not
// empty it, and the export.
import { describe, expect, it } from 'vitest'
import { recordFilterExclusions, matchesCertType, matchesRecordText } from './recordFilters'
import {
  buildEntropyIndex,
  isCurrentRecord,
  isPqcApplicable,
  pqcCoverageSummary,
  RECORD_TYPE_TABS,
  recordPath,
  recordTypeDescription,
  recordTypeLabel,
  schemeCertificateId,
  scopeNotice,
  snapshotRetrievalEntries,
} from './recordSemantics'
import { buildComplianceCsv } from './recordsExport'
import type { ComplianceMeta, ComplianceRecord } from './types'

const esv: ComplianceRecord = {
  id: 'E321',
  source: 'NIST',
  date: '2026-03-11',
  link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations/certificate/321',
  type: 'ESV',
  status: 'Validated',
  pqcCoverage: '',
  productName: 'BoringCrypto Jitter Entropy',
  productCategory: 'Entropy Source',
  vendor: 'Google, LLC',
  lab: 'EWA - Canada',
  esvStandard: 'SP 800-90B',
  esvNoiseSourceClassification: 'Non-Physical',
  esvReuseStatus: 'Open for Reuse',
  esvFirstValidated: '2026-03-11',
}
const fips: ComplianceRecord = {
  ...esv,
  id: '5300',
  type: 'FIPS 140-3',
  status: 'Active',
  productName: 'Luna M7',
  vendor: 'Thales',
  pqcCoverage: 'LMS',
}

const NO_FACETS = {
  scope: 'current' as const,
  text: '',
  pqc: [] as string[],
  category: [] as string[],
  source: [] as string[],
  vendor: [] as string[],
  migrateCat: [] as string[],
}

describe('ESV record type', () => {
  it('has its own reader-facing label and description', () => {
    expect(recordTypeLabel('ESV')).toBe('Entropy (ESV)')
    expect(recordTypeDescription('ESV')).toMatch(/entropy source validation/i)
    expect(recordTypeDescription('ESV')).toMatch(/not a module or an algorithm/)
  })

  it('is current when NIST lists it (status Validated), like a CAVP validation', () => {
    expect(isCurrentRecord(esv)).toBe(true)
  })

  it('shows its own certificate number: E321 is the scheme number', () => {
    expect(schemeCertificateId(esv)).toBe('E321')
  })

  it('says PQC does not apply — neither "unknown" nor "none"', () => {
    expect(isPqcApplicable('ESV')).toBe(false)
    for (const t of ['FIPS 140-3', 'ACVP', 'Common Criteria', 'EUCC', 'CSPN']) {
      expect(isPqcApplicable(t)).toBe(true)
    }
    expect(pqcCoverageSummary(esv)).toBe('Not applicable (entropy source validation)')
    expect(pqcCoverageSummary(esv)).not.toMatch(/unknown|none/i)
  })

  it('is found by certificate number, vendor, name and type label', () => {
    for (const q of ['e321', 'google', 'jitter', 'entropy', 'esv']) {
      expect(matchesRecordText(esv, q)).toBe(true)
    }
    expect(matchesRecordText(esv, 'thales')).toBe(false)
  })
})

describe('the Entropy (ESV) tab', () => {
  it('is the last tab, and desktop and phone read the same list', () => {
    expect(RECORD_TYPE_TABS.map((t) => t.id)).toEqual(['all', 'fips', 'acvp', 'cc', 'cspn', 'esv'])
    expect(RECORD_TYPE_TABS.at(-1)).toEqual({ id: 'esv', label: 'Entropy (ESV)' })
  })

  it('selects ESV records only; ESV rows appear on All but on no other tab', () => {
    expect(matchesCertType(esv, 'esv')).toBe(true)
    expect(matchesCertType(fips, 'esv')).toBe(false)
    expect(matchesCertType(esv, 'ESV')).toBe(true)
    expect(matchesCertType(esv, 'all')).toBe(true)
    for (const tab of ['fips', 'acvp', 'cc', 'cspn']) expect(matchesCertType(esv, tab)).toBe(false)
  })

  it('ignores the PQC and Migrate-category facets, which would silently empty it', () => {
    const withFacets = { ...NO_FACETS, pqc: ['ML-KEM'], migrateCat: ['CSC-001'] }
    expect(recordFilterExclusions(esv, { ...withFacets, certType: 'esv' })).toEqual([])
    // on the All tab a PQC filter correctly hides a record that names no PQC algorithm
    expect(recordFilterExclusions(esv, { ...withFacets, certType: 'all' })).toEqual(
      expect.arrayContaining(['pqc'])
    )
    // other facets still apply on the tab
    expect(
      recordFilterExclusions(esv, { ...NO_FACETS, certType: 'esv', vendor: ['Thales'] })
    ).toEqual(['vendor'])
  })

  it('reports the type tab as the filter hiding an ESV record on another tab', () => {
    expect(recordFilterExclusions(esv, { ...NO_FACETS, certType: 'fips' })).toEqual(['rtab'])
  })
})

describe('snapshot scope and export', () => {
  it('names entropy source validations in the scope notice', () => {
    expect(scopeNotice(null)).toMatch(/entropy source validations \(SP 800-90B\)/)
  })

  it('lists the ESV retrieval date right after CAVP', () => {
    const meta: ComplianceMeta = {
      schemaVersion: 1,
      partitions: {
        eucc: { label: 'ENISA EUCC', retrievedAt: '2026-10-23T02:00:00+00:00' },
        esv: {
          label: 'NIST CMVP — Entropy Source Validations',
          retrievedAt: '2026-10-24T02:47:02+00:00',
        },
        cavp: { label: 'NIST CAVP', retrievedAt: '2026-10-23T02:00:00+00:00' },
        fips: { label: 'NIST CMVP — FIPS 140-3', retrievedAt: '2026-10-23T02:00:00+00:00' },
      },
    }
    expect(snapshotRetrievalEntries(meta).map((e) => e.key)).toEqual([
      'fips',
      'cavp',
      'esv',
      'eucc',
    ])
  })

  it('exports ESV rows with their own facts and PQC "not applicable"', () => {
    const csv = buildComplianceCsv([esv], { scope: 'current' })
    expect(csv).toMatch(/Entropy Noise Source/)
    const line = csv.split('\n').find((l) => l.startsWith('E321,'))
    expect(line).toBeDefined()
    expect(line).toContain('Entropy (ESV)')
    expect(line).toContain('Not applicable (entropy source validation)')
    expect(line).toContain('Non-Physical')
    expect(line).toContain('Open for Reuse')
    expect(csv).toMatch(/Entropy \(ESV\) rows are NIST entropy source validations/)
  })
})

describe('links between FIPS 140-3 modules and the entropy certificates their Security Policy names', () => {
  const luna: ComplianceRecord = {
    ...fips,
    id: '5450',
    productName: 'Luna T7',
    entropyCertificates: ['E252', 'E63'],
  }
  const other: ComplianceRecord = { ...fips, id: '5300', entropyCertificates: ['E63', 'E999'] }
  const acvp: ComplianceRecord = { ...fips, id: 'A1', type: 'ACVP', entropyCertificates: ['E63'] }
  const e252: ComplianceRecord = { ...esv, id: 'E252' }
  const e63: ComplianceRecord = { ...esv, id: 'E63' }
  const index = buildEntropyIndex([luna, other, acvp, e252, e63, fips])

  it('knows which ESV records exist and which modules name each certificate', () => {
    expect([...index.esv.keys()].sort()).toEqual(['E252', 'E63'])
    expect(index.usedBy.get('E252')?.map((m) => m.id)).toEqual(['5450'])
    // certificate order, not input order
    expect(index.usedBy.get('E63')?.map((m) => m.id)).toEqual(['5300', '5450'])
  })

  it('never attaches ESV to an algorithm (CAVP) record, which has no module', () => {
    expect(index.usedBy.get('E63')?.some((m) => m.type === 'ACVP')).toBe(false)
  })

  it('keeps a number that is not in the ESV list, so the page can say so', () => {
    expect(index.usedBy.get('E999')?.map((m) => m.id)).toEqual(['5300'])
    expect(index.esv.has('E999')).toBe(false)
  })

  it('infers nothing for a module with no table in its policy', () => {
    expect(
      [...index.usedBy.values()].flat().some((m) => m.id === fips.id && m !== luna && m !== other)
    ).toBe(false)
  })

  it('opens a record on its own tab', () => {
    expect(recordPath({ id: 'E252', type: 'ESV' })).toBe(
      '/compliance?tab=records&rtab=esv&cert=E252'
    )
    expect(recordPath({ id: '5450', type: 'FIPS 140-3' })).toBe(
      '/compliance?tab=records&rtab=fips&cert=5450'
    )
  })

  it('exports the certificates a module names', () => {
    const csv = buildComplianceCsv([luna], { scope: 'current' })
    expect(csv).toMatch(/Entropy Certificates \(Security Policy\)/)
    expect(csv.split('\n').find((l) => l.startsWith('5450,'))).toContain('E252 E63')
  })
})
