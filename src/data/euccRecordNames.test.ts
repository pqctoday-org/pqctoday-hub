// SPDX-License-Identifier: AGPL-3.0-only
/**
 * EUCC record names (release 4.181.0).
 *
 * The Nokia Lightspan Access Node MF-2 certificate was published with a misspelt product name
 * ("Lightstpan"). The ENISA certificate page for EUCC-3089-2026-000002-I-00 reads "Nokia Lightspan
 * Access Node MF-2"; the record must match it.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

interface Rec {
  id: string
  productName: string
  euccCertificateId?: string
}

const records: Rec[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'compliance-data.json'), 'utf-8')
)

describe('EUCC record product names', () => {
  it('spells the Nokia Lightspan Access Node MF-2 name as ENISA does', () => {
    const rec = records.find((r) => r.id === 'enisa-eucc-3089-2026-000002-i-00')
    expect(rec?.euccCertificateId).toBe('EUCC-3089-2026-002')
    expect(rec?.productName).toBe('Nokia Lightspan Access Node MF-2')
  })

  it('no record carries the misspelling', () => {
    expect(records.filter((r) => r.productName.includes('Lightstpan'))).toEqual([])
  })
})
