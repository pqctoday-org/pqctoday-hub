// SPDX-License-Identifier: AGPL-3.0-only
// A "Certs" chip must open records from that certification body, not records whose
// text happens to contain the body's name (the old `q=` filter matched substrings:
// "NIS" returned 1,661 records).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { complianceFrameworks } from '@/data/complianceData'
import type { ComplianceRecord } from './types'
import { certRecordsHref, certRecordSourceFor } from './certRecordLinks'

const records: ComplianceRecord[] = JSON.parse(
  readFileSync(join(process.cwd(), 'public/data/compliance-data.json'), 'utf-8')
)

const certBodies = complianceFrameworks.filter(
  (f) => f.bodyType === 'certification_body' && f.status !== 'deprecated'
)

describe('Certs chip on certification-body rows', () => {
  it('links only to a record source that has records', () => {
    for (const fw of certBodies) {
      const source = certRecordSourceFor(fw.id)
      if (!source) continue
      const count = records.filter((r) => r.source === source).length
      expect(count, `${fw.id} links to ${source}, which has records`).toBeGreaterThan(0)
    }
  })

  it('filters by exact source, not by a substring of the enforcement body', () => {
    const href = certRecordsHref('KCMVP')
    expect(href).toBeNull() // no records of its own, so no chip (the old "NIS" link returned 1,661)
    expect(certRecordsHref('COMMON-CRITERIA')).toBe('/compliance?tab=records&src=Common%20Criteria')
  })

  it('shows a chip exactly for the rows with a mapped record source', () => {
    const withChip = certBodies.filter((f) => certRecordsHref(f.id) !== null).map((f) => f.id)
    expect(withChip.sort()).toEqual(
      ['ACVP', 'ANSSI-CERT', 'COMMON-CRITERIA', 'EUCC', 'EUCC-V2', 'FIPS-140-3'].sort()
    )
  })
})
