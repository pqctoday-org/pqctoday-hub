// SPDX-License-Identifier: AGPL-3.0-only
/**
 * An EUCC record's `id` is a generated key; the certificate number a reader can look up at
 * ENISA is `euccCertificateId`. The screens print the second, so every shipped EUCC record
 * must carry it.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { schemeCertificateId } from '@/components/Compliance/recordSemantics'

interface Rec {
  id: string
  type: string
  euccCertificateId?: string
}

const records: Rec[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/compliance-data.json'), 'utf-8')
)
const eucc = records.filter((r) => r.type === 'EUCC')

describe('EUCC certificate numbers in the shipped records', () => {
  it('has EUCC records, each with a certificate number of its own', () => {
    expect(eucc.length).toBeGreaterThan(0)
    // The formats differ by certification body (for example 'EUCC-3089-2026-002'), so only
    // presence is pinned here.
    const bad = eucc.filter((r) => !(r.euccCertificateId ?? '').trim())
    expect(bad.map((r) => r.id)).toEqual([])
  })

  it('every EUCC certificate number is unique to one record', () => {
    expect(new Set(eucc.map((r) => r.euccCertificateId)).size).toBe(eucc.length)
  })

  it('the number shown for each record is that certificate number, not its id', () => {
    for (const r of eucc) {
      expect(schemeCertificateId(r), r.id).toBe(r.euccCertificateId)
      expect(schemeCertificateId(r), r.id).not.toBe(r.id)
    }
  })
})
