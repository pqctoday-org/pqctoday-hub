// SPDX-License-Identifier: AGPL-3.0-only
//
// The hybrid-versus-pure-PQC rows summarise position documents. Each one must
// name its document and date, keep the scope it covers, and keep a
// recommendation apart from an approval and from a mandate.
import { describe, it, expect } from 'vitest'
import { HYBRID_ROWS } from './cswp39RedesignData'

const row = (regime: RegExp) => {
  const found = HYBRID_ROWS.find((r) => regime.test(r.regime))
  if (!found) throw new Error(`no row for ${regime}`)
  return found
}

describe('HYBRID_ROWS', () => {
  it('cites a dated document and states the scope in every row', () => {
    for (const r of HYBRID_ROWS) {
      expect(r.position, r.regime).toMatch(/20\d\d/)
      expect(r.position, r.regime).toMatch(/guideline|FAQ|guidance/i)
      expect(r.jurisdiction.length, r.regime).toBeGreaterThan(0)
    }
  })

  it('does not call any national position a blanket mandate', () => {
    for (const r of HYBRID_ROWS) {
      expect(r.stance, r.regime).not.toMatch(/^hybrid mandated$/i)
    }
  })

  it('treats BSI TR-02102-1 as a recommendation, not a law', () => {
    const bsi = row(/BSI/)
    expect(bsi.stance).toBe('Hybrid recommended')
    expect(bsi.position).toMatch(/not a law/)
    expect(bsi.position).toMatch(/Version 2026-01/)
    // Hash-based signatures are the stated exception to hybrid-only.
    expect(bsi.position).toMatch(/hash-based signatures may in principle be used alone/)
  })

  it('limits the ANSSI mandatory hybrid to the regulated perimeter', () => {
    const anssi = row(/ANSSI/)
    expect(anssi.stance).toMatch(/mandatory in regulated scope/)
    expect(anssi.position).toMatch(/mandatory only in the regulated perimeter/)
    expect(anssi.position).toMatch(/not a regulatory obligation/)
    expect(anssi.position).toMatch(/SLH-DSA, XMSS, LMS/)
  })

  it('does not describe NSA as tolerating hybrids as an interim step', () => {
    const nsa = row(/NSA/)
    expect(nsa.stance).toBe('No hybrid requirement')
    expect(`${nsa.stance} ${nsa.position}`).not.toMatch(/interim|tolerated/i)
    expect(nsa.jurisdiction).toMatch(/national security systems only/)
    expect(nsa.position).toMatch(/does not require hybrid products/)
    expect(nsa.position).toMatch(/mandates nothing outside them/)
  })

  it('does not say NCSC prefers pure PQC outright', () => {
    const ncsc = row(/NCSC/)
    expect(ncsc.stance).not.toMatch(/pure pqc preferred/i)
    expect(ncsc.position).toMatch(
      /interoperability, implementation security or protocol constraints/
    )
    expect(ncsc.position).toMatch(/interim measure/)
    expect(ncsc.position).toMatch(/August 2024/)
    expect(ncsc.position).toMatch(/15 October 2026 recommends both hybrid and pure post-quantum/)
  })
})
