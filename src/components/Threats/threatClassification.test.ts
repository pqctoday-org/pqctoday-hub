// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { threatsData, type ThreatItem } from '@/data/threatsData'
import { SOC_IR_PLAYBOOKS, SOC_USE_CASES } from '@/data/socQuantumPlaybook'
import { DETECTION_USE_CASES } from '@/components/PKILearning/modules/SocImplementationPqc/detectionUseCases'
import {
  getThreatClass,
  guessThreatClass,
  threatMatchesClass,
  getShorTier,
  getSocUseCases,
  getIrPlaybooks,
  type ThreatClass,
} from './threatClassification'

function threat(partial: Partial<ThreatItem>): ThreatItem {
  return {
    industry: 'Test',
    threatId: 'THR-X',
    description: '',
    criticality: 'Medium',
    cryptoAtRisk: '',
    pqcReplacement: '',
    mainSource: '',
    sourceUrl: '',
    relatedModules: [],
    ...partial,
  }
}

describe('getThreatClass (ruling R1) — the reviewed threat_class, never a guess', () => {
  it('returns the row’s reviewed class even when the keywords would say otherwise', () => {
    // Encryption keywords, reviewed as forge-later: the reviewed value wins.
    expect(getThreatClass(threat({ cryptoAtRisk: 'TLS key wrapping', threatClass: 'hnfl' }))).toBe(
      'hnfl'
    )
    expect(getThreatClass(threat({ cryptoAtRisk: 'ECDSA signing', threatClass: 'hndl' }))).toBe(
      'hndl'
    )
  })

  it('has no "unclassified" state — a row without a reviewed class shows as both', () => {
    expect(getThreatClass(threat({ cryptoAtRisk: 'something unrecognised' }))).toBe('both')
  })
})

describe('threatMatchesClass (UX-15) — one meaning on desktop and mobile', () => {
  const hndl = threat({ threatClass: 'hndl' })
  const hnfl = threat({ threatClass: 'hnfl' })
  const both = threat({ threatClass: 'both' })

  it('HNDL shows hndl + both', () => {
    expect([hndl, hnfl, both].map((t) => threatMatchesClass(t, 'hndl'))).toEqual([
      true,
      false,
      true,
    ])
  })

  it('HNFL shows hnfl + both', () => {
    expect([hndl, hnfl, both].map((t) => threatMatchesClass(t, 'hnfl'))).toEqual([
      false,
      true,
      true,
    ])
  })

  it('an old ?class=both link shows only the rows classed both', () => {
    expect([hndl, hnfl, both].map((t) => threatMatchesClass(t, 'both'))).toEqual([
      false,
      false,
      true,
    ])
  })
})

describe('guessThreatClass — the keyword checker (never shown to readers)', () => {
  it('guesses signature/PKI crypto as forge-later (HNFL)', () => {
    expect(guessThreatClass(threat({ cryptoAtRisk: 'ECDSA firmware signing certificate' }))).toBe(
      'hnfl'
    )
  })

  it('guesses key-wrapping / TLS encryption as decrypt-later (HNDL)', () => {
    expect(
      guessThreatClass(threat({ cryptoAtRisk: 'TLS key wrapping for backup encryption' }))
    ).toBe('hndl')
  })

  it('guesses a mixed PKI+encryption estate as both', () => {
    expect(
      guessThreatClass(threat({ cryptoAtRisk: 'RSA key management and ECDSA code signing' }))
    ).toBe('both')
  })

  it('returns null — no guess — when no signal fires', () => {
    expect(guessThreatClass(threat({ cryptoAtRisk: 'something unrecognised' }))).toBeNull()
  })

  it('does not match "dsa"/"kem" substrings inside the pqcReplacement algorithm name', () => {
    const t = threat({
      cryptoAtRisk: 'something unrecognised',
      pqcReplacement: 'ML-DSA-65, ML-KEM-768',
      description: 'Recommend migrating to ML-KEM and ML-DSA per FIPS 203/204.',
    })
    expect(guessThreatClass(t)).toBeNull()
  })

  it('does not read "unencrypted" as encryption (AERO-003: ADS-B is sent in the clear)', () => {
    expect(
      guessThreatClass(threat({ cryptoAtRisk: 'ADS-B (unencrypted), Mode S, ATC data links' }))
    ).toBeNull()
    expect(guessThreatClass(threat({ cryptoAtRisk: 'encrypted archives' }))).toBe('hndl')
  })

  it('does not read symmetric MACs (KMAC, AES-CMAC) as forge-later signature crypto', () => {
    expect(guessThreatClass(threat({ cryptoAtRisk: 'KMAC, AES-CMAC session keys' }))).toBeNull()
  })

  it('reads PQC algorithm names in cryptoAtRisk as real signal', () => {
    expect(
      guessThreatClass(threat({ cryptoAtRisk: 'ML-KEM private key generation in HSMs' }))
    ).toBe('hndl')
    expect(guessThreatClass(threat({ cryptoAtRisk: 'ML-DSA private key during signing' }))).toBe(
      'hnfl'
    )
  })
})

// Live data: every published row carries a reviewed class, and the keyword
// checker's disagreements with it are REPORTED (in the test name), not
// asserted — a disagreement is a prompt to look again at the row or the rules,
// and the reviewed value is what the page shows either way.
const liveDisagreements = threatsData.filter((t) => {
  const guess = guessThreatClass(t)
  return guess !== null && guess !== t.threatClass
})
const liveNoGuess = threatsData.filter((t) => guessThreatClass(t) === null)

describe('reviewed threat_class over the real threats CSV', () => {
  it(`every published row has a reviewed class (keyword checker disagrees on ${liveDisagreements.length}, has no guess for ${liveNoGuess.length}, of ${threatsData.length})`, () => {
    expect(threatsData.length).toBeGreaterThan(0)
    const missing = threatsData.filter((t) => !t.threatClass).map((t) => t.threatId)
    expect(missing).toEqual([])
    if (liveDisagreements.length > 0) {
      console.warn(
        `[threat_class checker] keyword guess differs from the reviewed class on: ${liveDisagreements
          .map((t) => `${t.threatId} (reviewed ${t.threatClass}, guessed ${guessThreatClass(t)})`)
          .join(', ')}`
      )
    }
  })
})

describe('getShorTier (Threats #4)', () => {
  it('grades ECC-256 as imminent — same urgency as RSA-2048', () => {
    expect(getShorTier(threat({ cryptoAtRisk: 'ECDSA P-256 certificates' }))).toBe('imminent')
    expect(getShorTier(threat({ cryptoAtRisk: 'RSA-2048' }))).toBe('imminent')
  })

  it('grades symmetric/hash crypto as Grover-weakened', () => {
    expect(getShorTier(threat({ cryptoAtRisk: 'AES-128 bulk encryption' }))).toBe('grover')
  })

  it('grades PQC parameter sets as safe', () => {
    expect(getShorTier(threat({ cryptoAtRisk: 'ML-KEM-768' }))).toBe('safe')
  })

  it('returns unknown when no algorithm token is present', () => {
    expect(getShorTier(threat({ cryptoAtRisk: 'unspecified legacy crypto' }))).toBe('unknown')
  })

  it('ignores the description — a description naming the PQC fix does not make the row PQC-safe', () => {
    // CLOUD-004 / CROSS-007 / GOV-005 shape: no algorithm in cryptoAtRisk, the
    // PQC replacement named in the description.
    const t = threat({
      cryptoAtRisk: 'All public-key cryptography in NC3 systems',
      description: 'Migrate to ML-KEM-1024 and ML-DSA-87 per CNSA 2.0; PQC mandated.',
    })
    expect(getShorTier(t)).toBe('unknown')
  })

  it('never grades the generic word "PQC" as safe', () => {
    expect(getShorTier(threat({ cryptoAtRisk: 'systems not yet migrated to PQC' }))).toBe('unknown')
  })

  it('does not read the "dsa" in ML-DSA / SLH-DSA as classical DSA', () => {
    expect(getShorTier(threat({ cryptoAtRisk: 'ML-DSA and SLH-DSA signing keys' }))).toBe('safe')
  })

  it('grades by the classical family when a row names both it and a PQC set', () => {
    expect(getShorTier(threat({ cryptoAtRisk: 'RSA key transport alongside ML-KEM-768' }))).toBe(
      'imminent'
    )
  })
})

// Real data: after grading from cryptoAtRisk only, no High/Critical row shows
// "PQC-safe" unless the crypto it lists is PQC and nothing else.
const CLASSICAL_TOKEN =
  /(?<![\w-])(rsa|dsa|ecdsa|ecdh|ecc|dh|diffie|x25519|ed25519|p-?\d{3}|aes|3des|des|sha-?\d|sha3|md5|hmac|ripemd)\b/i
const PQC_TOKEN = /\b(ml-kem|ml-dsa|slh-dsa|fn-dsa|kyber|dilithium|sphincs|falcon|hqc)\b/i

describe('getShorTier over the real threats CSV', () => {
  it('no active High/Critical row is PQC-safe unless its at-risk crypto names only PQC algorithms', () => {
    const safeHighRows = threatsData.filter(
      (t) => (t.criticality === 'High' || t.criticality === 'Critical') && getShorTier(t) === 'safe'
    )
    for (const t of safeHighRows) {
      expect({ id: t.threatId, pqc: PQC_TOKEN.test(t.cryptoAtRisk) }).toEqual({
        id: t.threatId,
        pqc: true,
      })
      expect({ id: t.threatId, classical: CLASSICAL_TOKEN.test(t.cryptoAtRisk) }).toEqual({
        id: t.threatId,
        classical: false,
      })
    }
  })
})

const CLASSES: ThreatClass[] = ['hndl', 'hnfl', 'both']
const ofClass = (threatClass: ThreatClass) => threat({ threatClass })

describe('getSocUseCases (Threats #3) — the Applied Quantum v3.0 use cases', () => {
  it('uses the shared SOC module’s titles — the same ones the SOC Learn module renders', () => {
    const titles = new Set(SOC_USE_CASES.map((u) => u.title))
    for (const cls of CLASSES) {
      for (const uc of getSocUseCases(ofClass(cls))) {
        expect(titles.has(uc.title)).toBe(true)
      }
    }
    expect(DETECTION_USE_CASES.map((u) => u.title)).toEqual(SOC_USE_CASES.map((u) => u.title))
  })

  it('maps decrypt-later to drift + hybrid downgrade + horizon-weighted exfiltration (UC-2, UC-1, UC-5)', () => {
    expect(getSocUseCases(ofClass('hndl')).map((u) => u.code)).toEqual(['UC-1', 'UC-2', 'UC-5'])
  })

  it('maps forge-later to drift + certificate lifecycle + signature integrity (UC-2, UC-3, UC-4)', () => {
    expect(getSocUseCases(ofClass('hnfl')).map((u) => u.code)).toEqual(['UC-2', 'UC-3', 'UC-4'])
  })

  it('maps "both" to the union — all five use cases', () => {
    expect(getSocUseCases(ofClass('both')).map((u) => u.code)).toEqual([
      'UC-1',
      'UC-2',
      'UC-3',
      'UC-4',
      'UC-5',
    ])
  })

  it('follows the reviewed class, not the at-risk keywords', () => {
    // Signing keywords, reviewed decrypt-later → the decrypt-later use cases.
    expect(
      getSocUseCases(threat({ cryptoAtRisk: 'ECDSA firmware signing', threatClass: 'hndl' })).map(
        (u) => u.code
      )
    ).toEqual(['UC-1', 'UC-2', 'UC-5'])
  })

  it('never offers CRQC tracking (threat intelligence) as a use case', () => {
    expect(SOC_USE_CASES).toHaveLength(5)
    const titles = SOC_USE_CASES.map((u) => u.title.toLowerCase())
    expect(titles.some((t) => t.includes('intelligence') || t.includes('crqc'))).toBe(false)
  })

  it('every use case carries a v3.0 page citation inside the SOC section (pp. 217–228)', () => {
    for (const uc of SOC_USE_CASES) {
      expect(uc.source.document).toBe('Applied Quantum PQC Migration Framework v3.0')
      expect(uc.source.page).toBeGreaterThanOrEqual(217)
      expect(uc.source.page).toBeLessThanOrEqual(228)
    }
  })
})

// Live data: every published row gets drift monitoring plus at least one
// class-specific use case — there is no unclassified row left to get UC-2 only.
describe('getSocUseCases over the real threats CSV', () => {
  it('every published row gets UC-2 and ≥1 class-specific use case', () => {
    expect(threatsData.length).toBeGreaterThan(0)
    for (const t of threatsData) {
      const codes = getSocUseCases(t).map((u) => u.code)
      expect(codes).toContain('UC-2')
      expect(codes.filter((c) => c !== 'UC-2').length).toBeGreaterThan(0)
    }
  })
})

describe('getIrPlaybooks (Threats #6) — the four v3.0 playbooks', () => {
  it('offers Confirmed Hybrid Downgrade only to decrypt-later exposure', () => {
    const ids = (cls: ThreatClass) => getIrPlaybooks(ofClass(cls)).map((p) => p.id)
    expect(ids('hndl')).toContain('confirmed-hybrid-downgrade')
    expect(ids('both')).toContain('confirmed-hybrid-downgrade')
    expect(ids('hnfl')).not.toContain('confirmed-hybrid-downgrade')
  })

  it('always offers vulnerability disclosure, CRQC announcement and emergency rotation', () => {
    for (const cls of CLASSES) {
      const ids = getIrPlaybooks(ofClass(cls)).map((p) => p.id)
      expect(ids).toEqual(
        expect.arrayContaining([
          'pqc-vulnerability-disclosure',
          'credible-crqc-announcement',
          'emergency-algorithm-rotation',
        ])
      )
    }
  })

  it('offers only the source’s playbooks, each with its page', () => {
    expect(SOC_IR_PLAYBOOKS.map((p) => [p.number, p.title, p.source.page])).toEqual([
      [1, 'PQC Algorithm Vulnerability Disclosure', 225],
      [2, 'Confirmed Hybrid Downgrade Attack', 226],
      [3, 'Credible CRQC Announcement', 227],
      [4, 'Emergency Algorithm Rotation', 227],
    ])
    const titles = getIrPlaybooks(ofClass('both')).map((p) => p.title)
    for (const invented of ['Decrypt-Later', 'Signature-Forgery', 'Combined', 'Manual Triage']) {
      expect(titles.some((t) => t.includes(invented))).toBe(false)
    }
  })
})
