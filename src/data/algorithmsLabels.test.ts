// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { algorithmsData } from './algorithmsData'
import { loadPQCAlgorithmsData } from './pqcAlgorithmsData'

// Label and status corrections checked against primary sources on 2026-10-17:
// NIST IR 8545 (Round 4 outcome), NIST's 11 March 2025 HQC news release, NIST IR
// 8547 Table 4 (final, 27 October 2026), ANSSI PG-083 v3.00 section 2.2.3, NIST's Round 3
// additional-signatures page (14 May 2026), the IETF datatracker entries for the
// LAMPS composite drafts, kpqc.or.kr (final selection, 16 January 2025) and
// iso.org record 86890 (ISO/IEC 18033-2:2006/Amd 2:2026).

const NOT_SELECTED = 'Not selected by NIST (Round 4 concluded March 2025)'
const HQC_LABEL = 'Selected March 2025; draft FIPS not yet published; final expected 2027'
const ROUND3 = 'NIST Additional Signatures Round 3 (May 2026)'
const ROUND3_URL = 'https://csrc.nist.gov/projects/pqc-dig-sig/round-3-additional-signatures'
const KPQC_FINAL = 'KpqC final selection (January 2025)'

describe('transition guide labels', () => {
  it('shows BIKE and Classic McEliece as not selected, not as Round 4 candidates', () => {
    const rows = algorithmsData.filter(
      (r) => r.region === 'NIST' && /^(BIKE-|Classic-McEliece-)/.test(r.pqc)
    )
    expect(rows.length).toBe(6)
    for (const row of rows) {
      expect(row.statusTier, row.pqc).toBe('round4-not-selected')
      expect(row.status, row.pqc).toBe(NOT_SELECTED)
      expect(row.standardizationDate.startsWith(NOT_SELECTED), row.pqc).toBe(true)
      expect(row.statusUrl, row.pqc).toBe('https://csrc.nist.gov/pubs/ir/8545/final')
      if (row.pqc.startsWith('Classic-McEliece')) {
        expect(row.standardizationDate, row.pqc).toContain('ISO/IEC 18033-2:2006/Amd 2:2026')
      }
    }
    expect(algorithmsData.some((r) => r.standardizationDate === 'Round 4 Candidate')).toBe(false)
    expect(algorithmsData.some((r) => r.status === 'Round 4')).toBe(false)
  })

  it('gives 2048-bit finite-field DH the 2030 deprecation from IR 8547 Table 4', () => {
    const rows = algorithmsData.filter(
      (r) =>
        r.classical === 'DH (Diffie-Hellman)' && r.keySize === '2048-bit' && r.region === 'NIST'
    )
    expect(rows.length).toBe(2)
    for (const row of rows) {
      expect(row.deprecationDate, row.pqc).toBe('2030 (Deprecated) / 2035 (Disallowed)')
      expect(row.deprecationDateISO, row.pqc).toBe('2030-01-01')
    }
  })

  it('gives every NIST public-key row both IR 8547 steps, as the final report does', () => {
    // NIST IR 8547 final (27 Oct 2026), Tables 2 and 4: every quantum-vulnerable
    // public-key parameter set at 112 bits of security or more is deprecated after
    // 2030 and disallowed after 2035. The 2024 draft deprecated only the 112-bit
    // sets, so 128-bit-and-up rows read "2035 (Disallowed)" alone until then.
    const rows = algorithmsData.filter(
      (r) => r.region === 'NIST' && /^20(30|35) \((Deprecated|Disallowed)\)/.test(r.deprecationDate)
    )
    expect(rows.length).toBeGreaterThanOrEqual(69)
    for (const row of rows) {
      const id = `${row.classical} ${row.keySize} -> ${row.pqc}`
      expect(row.deprecationDate, id).toBe('2030 (Deprecated) / 2035 (Disallowed)')
      expect(row.deprecationDateISO, id).toBe('2030-01-01')
    }
  })

  it('describes HQC as selected with no draft FIPS yet', () => {
    const rows = algorithmsData.filter((r) => r.pqc.startsWith('HQC-'))
    expect(rows.length).toBeGreaterThanOrEqual(10)
    for (const row of rows) {
      expect(row.standardizationDate, row.pqc).toBe(HQC_LABEL)
      expect(row.statusTier, row.pqc).toBe('fips-draft')
    }
  })

  it('records ANSSI allowing standalone SLH-DSA now, not only from 2030', () => {
    const anssi = algorithmsData.filter((r) => r.region === 'ANSSI' && r.pqc.startsWith('SLH-DSA'))
    expect(anssi.map((r) => r.pqc)).toEqual(['SLH-DSA (standalone permitted; hybrid optional)'])
    expect(algorithmsData.some((r) => r.pqc.includes('from 2030'))).toBe(false)
  })

  it('labels the NIST additional-signature rows with their Round 3 outcome', () => {
    const advanced = algorithmsData.filter((r) =>
      /^(UOV|MAYO|SQIsign|FAEST|SNOVA) \(NIST Sig/.test(r.pqc)
    )
    expect(advanced.length).toBe(5)
    for (const row of advanced) {
      expect(row.standardizationDate, row.pqc).toBe(ROUND3)
      expect(row.statusUrl, row.pqc).toBe(ROUND3_URL)
      expect(row.statusTier, row.pqc).toBe('round2-candidate')
    }
    const dropped = algorithmsData.filter((r) => /^(CROSS|LESS) \(NIST Sig/.test(r.pqc))
    expect(dropped.length).toBe(2)
    for (const row of dropped) {
      expect(row.standardizationDate, row.pqc).toMatch(/^Did not advance to NIST .* Round 3/)
      expect(row.statusTier, row.pqc).toBe('eliminated')
    }
    const mayo = algorithmsData.filter((r) => /^MAYO-\d$/.test(r.pqc))
    expect(mayo.length).toBe(4)
    for (const row of mayo) {
      expect(row.status, row.pqc).toBe('Round 3')
      expect(row.standardizationDate, row.pqc).toBe(ROUND3)
      expect(row.statusTier, row.pqc).toBe('round2-candidate')
    }
    expect(
      algorithmsData.some((r) =>
        /NIST (On-Ramp|Additional Sig) Round 2/.test(r.standardizationDate)
      )
    ).toBe(false)
  })

  it('names the current LAMPS composite draft revisions', () => {
    const sigs = algorithmsData.filter((r) => r.pqc.endsWith('(IETF Composite Sig)'))
    expect(sigs.length).toBe(3)
    for (const row of sigs) expect(row.standardizationDate).toContain('composite-sigs-19')
    const kems = algorithmsData.filter((r) => r.pqc.endsWith('(IETF Composite KEM)'))
    expect(kems.length).toBe(2)
    for (const row of kems) expect(row.standardizationDate).toContain('composite-kem-23')
  })

  it('labels the KpqC winners as the January 2025 final selection', () => {
    expect(algorithmsData.some((r) => r.status === 'KpqC Round 2')).toBe(false)
    const kr = algorithmsData.filter((r) => r.status === KPQC_FINAL)
    expect(kr.length).toBe(12)
    for (const row of kr) {
      expect(row.standardizationDate, row.pqc).toBe(KPQC_FINAL)
      expect(row.statusTier, row.pqc).toBe('regional')
      expect(row.statusUrl, row.pqc).toBe('https://www.kpqc.or.kr/competition_02.html')
    }
  })
})

describe('algorithm catalogue labels', () => {
  it('describes HQC as selected with no draft FIPS yet, linked to the NIST announcement', async () => {
    const catalogue = await loadPQCAlgorithmsData()
    const hqc = catalogue.filter((a) => a.name.startsWith('HQC-'))
    expect(hqc.length).toBe(3)
    for (const a of hqc) {
      expect(a.fipsStandard, a.name).toBe(HQC_LABEL)
      expect(a.statusTier, a.name).toBe('fips-draft')
      expect(a.statusUrl, a.name).toBe(
        'https://www.nist.gov/news-events/news/2025/03/nist-selects-hqc-fifth-algorithm-post-quantum-encryption'
      )
    }
  })

  it('links FN-DSA to the page that states FIPS 206 is in development', async () => {
    const catalogue = await loadPQCAlgorithmsData()
    const fn = catalogue.filter((a) => a.name.startsWith('FN-DSA-'))
    expect(fn.length).toBe(2)
    for (const a of fn) {
      expect(a.statusUrl, a.name).toBe(
        'https://csrc.nist.gov/projects/post-quantum-cryptography/post-quantum-cryptography-standardization'
      )
    }
  })

  it('names Round 3 for the advancing additional-signature candidates it shows', async () => {
    const catalogue = await loadPQCAlgorithmsData()
    // MQOM, QR-UOV and SDitH are stub rows without a family yet, so the loader
    // does not show them; their CSV text is corrected the same way.
    const names = ['MAYO-1', 'MAYO-2', 'MAYO-3', 'MAYO-5', 'UOV', 'SQIsign', 'FAEST', 'SNOVA']
    for (const name of names) {
      const a = catalogue.find((x) => x.name === name)
      expect(a, name).toBeDefined()
      expect(a!.fipsStandard, name).toBe(ROUND3)
      expect(a!.statusTier, name).toBe('round2-candidate')
      expect(a!.useCaseNotes, name).not.toMatch(/Round 2 (advancing|candidate)|^NIST Sig Round 2/)
    }
  })

  it('treats Classic McEliece as an ISO standard that NIST did not select', async () => {
    const catalogue = await loadPQCAlgorithmsData()
    for (const name of [
      'Classic-McEliece-348864',
      'Classic-McEliece-460896',
      'Classic-McEliece-8192128',
    ]) {
      const a = catalogue.find((x) => x.name === name)
      expect(a, name).toBeDefined()
      expect(a!.fipsStandard, name).toBe('NIST PQC Round 4 (concluded 2025; not selected)')
      expect(a!.statusTier, name).toBe('final')
    }
  })

  it('names the current composite ML-KEM draft revision', async () => {
    const catalogue = await loadPQCAlgorithmsData()
    const kem = catalogue.filter((a) => a.name.startsWith('id-MLKEM'))
    expect(kem.length).toBe(12)
    for (const a of kem) {
      expect(a.fipsStandard, a.name).toBe('draft-ietf-lamps-pq-composite-kem-23')
      expect(a.statusTier, a.name).toBe('ietf-draft')
    }
  })

  it('cites the ISO/IEC 18033-2 Amd 2 record for FrodoKEM, vetted by ISO/IEC JTC 1', async () => {
    const catalogue = await loadPQCAlgorithmsData()
    const frodo = catalogue.filter((a) => a.name.startsWith('FrodoKEM-'))
    expect(frodo.length).toBe(3)
    for (const a of frodo) {
      expect(a.statusUrl, a.name).toBe('https://www.iso.org/standard/86890.html')
      expect(a.vettingBody, a.name).toBe('ISO/IEC JTC 1')
    }
    const transitions = algorithmsData.filter((r) => r.pqc.startsWith('FrodoKEM-'))
    for (const row of transitions) {
      expect(row.statusUrl, row.pqc).not.toBe('https://www.iso.org/standard/85646.html')
    }
  })
})
