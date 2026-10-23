// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { CHANGE_CASES } from './sharedData'

const byId = (id: string) => {
  const c = CHANGE_CASES.find((x) => x.id === id)
  if (!c) throw new Error(`no change case ${id}`)
  return c
}

describe('PQC change analyzer — Common Criteria and EUCC answers', () => {
  it('tells the learner that adding ML-KEM is a typical major change', () => {
    const cc = byId('add-mlkem').cc.candidates
    expect(cc).toMatch(/major change and re-evaluation/)
    expect(cc).toMatch(/CCDB-015/)
    expect(cc).toMatch(/post-quantum cryptography/)
  })

  it('keeps the exact Update rule: under 30% overall, no category above 30%', () => {
    const fips = byId('add-mlkem').fips.candidates
    expect(fips).toMatch(/under 30% overall/)
    expect(fips).toMatch(/none of the five categories/)
    expect(fips).toMatch(/CVE changes may not introduce new features or cryptography/)
  })

  it('does not call a vulnerability fix, a tamper-sensor change or an RNG change minor for EUCC', () => {
    expect(byId('patch-cve').cc.candidates).toMatch(/exploitable vulnerability as major/)
    expect(byId('enclosure').cc.candidates).toMatch(/^Major change/)
    expect(byId('change-drbg').cc.candidates).toMatch(/^Major change/)
    expect(byId('multi-tenancy').cc.candidates).toMatch(/^Major change/)
  })

  it('limits PHYS to enclosure-only changes with no operational impact', () => {
    const fips = byId('enclosure').fips.candidates
    expect(fips).toMatch(/confined to the physical enclosure/)
    expect(fips).toMatch(/no operational impact/)
  })

  it('names both firmware and hardware treatment for an FPGA image', () => {
    const affected = byId('fpga-image').fips.affected
    expect(affected).toMatch(/IG 10\.3\.F/)
    expect(affected).toMatch(/IG 2\.3\.A/)
  })

  it('accepts both a bounded and a broad answer where the schemes differ', () => {
    for (const id of ['add-mlkem', 'store-seeds', 'enclosure']) {
      expect(byId(id).likely).toEqual(expect.arrayContaining(['bounded', 'broad']))
    }
  })
})
