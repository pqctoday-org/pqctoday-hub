// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Pins the values the lesson quotes from its sources, so that an edit which drifts from a
 * source fails a test instead of quietly teaching the wrong figure.
 */
import { describe, it, expect } from 'vitest'
import { C2PA_ALLOWED, CANDIDATES } from './data/provenanceData'
import { RFC_10024 } from './data/streamingData'
import { LADDER_RUNGS, NIST_TRANSITION, RUNGS_BY_SCHEME } from './data/ladderData'
import { EDITIONS } from './data/editionData'
import { ECP_PRACTICES } from './data/ecpData'

describe('C2PA 2.4 allowed list', () => {
  it('has exactly the seven algorithms the specification lists', () => {
    expect(C2PA_ALLOWED.map((a) => a.id)).toEqual([
      'ES256',
      'ES384',
      'ES512',
      'PS256',
      'PS384',
      'PS512',
      'EdDSA',
    ])
  })

  it('allows only the Ed25519 instance of EdDSA', () => {
    const eddsa = C2PA_ALLOWED.find((a) => a.id === 'EdDSA')
    expect(eddsa?.note).toMatch(/Ed25519 instance only/)
    expect(CANDIDATES.find((c) => c.id === 'ed448')?.onC2paList).toBe(false)
  })

  it('lists no post-quantum algorithm', () => {
    for (const id of ['ml-dsa-65', 'slh-dsa-128s']) {
      expect(CANDIDATES.find((c) => c.id === id)?.onC2paList, id).toBe(false)
    }
    expect(C2PA_ALLOWED.some((a) => /ML-DSA|SLH-DSA/.test(a.id))).toBe(false)
  })
})

describe('RFC 10024', () => {
  it('names the three hybrid mechanisms', () => {
    expect(RFC_10024.mechanisms).toEqual([
      'X25519MLKEM768',
      'SecP256r1MLKEM768',
      'SecP384r1MLKEM1024',
    ])
  })
})

describe('key ladders', () => {
  it('has six AACS rungs and five CI Plus rungs, in order', () => {
    expect(RUNGS_BY_SCHEME('AACS').map((r) => r.order)).toEqual([1, 2, 3, 4, 5, 6])
    expect(RUNGS_BY_SCHEME('CI Plus').map((r) => r.order)).toEqual([1, 2, 3, 4, 5])
  })

  it('marks as public-key exactly the rungs a NIST table lists', () => {
    for (const r of LADDER_RUNGS) {
      expect(r.kind === 'public-key', r.id).toBe(r.nistTable !== null)
    }
  })

  it('records SHA-1 as the CI Plus certificate signature hash, not SHA-256', () => {
    const sig = LADDER_RUNGS.find((r) => r.id === 'ci-certificates')
    expect(sig?.primitive).toMatch(/SHA-1/)
    expect(sig?.what).toMatch(/Table 9\.1/)
  })

  it('makes DES-56 the mandatory CI Plus scrambler and AES-128-CBC the optional one', () => {
    const des = LADDER_RUNGS.find((r) => r.id === 'ci-scrambler-des')
    const aes = LADDER_RUNGS.find((r) => r.id === 'ci-scrambler-aes')
    expect(des?.what).toMatch(/mandatory/)
    expect(aes?.what).toMatch(/optional for the CICAM/)
  })
})

describe('NIST IR 8547 and the editions', () => {
  it('carries the 2030 and 2035 dates and scopes them to NIST', () => {
    expect(NIST_TRANSITION.summary).toMatch(/after 2030/)
    expect(NIST_TRANSITION.summary).toMatch(/after 2035/)
    expect(NIST_TRANSITION.scope).toMatch(/NIST/)
    expect(NIST_TRANSITION.date).toBe('October 2026')
  })

  it('says of every edition that its text does not mention quantum computing', () => {
    expect(EDITIONS.length).toBe(4)
    for (const e of EDITIONS) expect(e.mentionsQuantum, e.id).toBe(false)
  })

  it('states the CI Plus scope as the 2015 edition', () => {
    const ci = EDITIONS.find((e) => e.id === 'ci-plus')
    expect(ci?.edition).toMatch(/v1\.3\.2 \(March 2015\)/)
    expect(ci?.scope).toMatch(/Other editions are not covered/)
  })
})

describe('ECP practices', () => {
  it('describes ECP as asking, not requiring, and carries the HDCP wording', () => {
    const hdcp = ECP_PRACTICES.find((p) => p.id === 'hdcp')
    expect(hdcp?.text).toMatch(/ECP asks that the system support a requirement of HDCP 2\.2/)
    for (const p of ECP_PRACTICES) expect(p.text, p.id).not.toMatch(/ECP requires/)
  })
})
