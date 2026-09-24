// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { threatsData, type ThreatItem } from '@/data/threatsData'
import { SOC_IR_PLAYBOOKS, SOC_USE_CASES } from '@/data/socQuantumPlaybook'
import { DETECTION_USE_CASES } from '@/components/PKILearning/modules/SocImplementationPqc/detectionUseCases'
import {
  getThreatClass,
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

describe('getThreatClass (Threats #2)', () => {
  it('classifies signature/PKI crypto as forge-later (HNFL)', () => {
    expect(getThreatClass(threat({ cryptoAtRisk: 'ECDSA firmware signing certificate' }))).toBe(
      'hnfl'
    )
  })

  it('classifies key-wrapping / TLS encryption as decrypt-later (HNDL)', () => {
    expect(getThreatClass(threat({ cryptoAtRisk: 'TLS key wrapping for backup encryption' }))).toBe(
      'hndl'
    )
  })

  it('classifies a mixed PKI+encryption estate as both', () => {
    expect(
      getThreatClass(threat({ cryptoAtRisk: 'RSA key management and ECDSA code signing' }))
    ).toBe('both')
  })

  it('renders as unclassified — not silently HNDL — when no signal fires', () => {
    expect(getThreatClass(threat({ cryptoAtRisk: 'something unrecognised' }))).toBe('unclassified')
  })

  it('a "both" threat matches either class filter', () => {
    const t = threat({ cryptoAtRisk: 'RSA key management and ECDSA signing' })
    expect(threatMatchesClass(t, 'hndl')).toBe(true)
    expect(threatMatchesClass(t, 'hnfl')).toBe(true)
  })

  it('does not match "dsa"/"kem" substrings inside the pqcReplacement algorithm name', () => {
    // cryptoAtRisk has no signature/encryption signal of its own; pqcReplacement
    // names ML-DSA / ML-KEM, which used to leak into the match via the old
    // combined-corpus lookup ("dsa" inside "ML-DSA", "kem" inside "ML-KEM").
    const t = threat({
      cryptoAtRisk: 'something unrecognised',
      pqcReplacement: 'ML-DSA-65, ML-KEM-768',
      description: 'Recommend migrating to ML-KEM and ML-DSA per FIPS 203/204.',
    })
    expect(getThreatClass(t)).toBe('unclassified')
  })

  it('does not read "unencrypted" as encryption (AERO-003: ADS-B is sent in the clear)', () => {
    expect(
      getThreatClass(threat({ cryptoAtRisk: 'ADS-B (unencrypted), Mode S, ATC data links' }))
    ).toBe('unclassified')
    // …while a real "encrypted" still counts as decrypt-later exposure.
    expect(getThreatClass(threat({ cryptoAtRisk: 'encrypted archives' }))).toBe('hndl')
  })

  it('does not read symmetric MACs (KMAC, AES-CMAC) as forge-later signature crypto', () => {
    expect(getThreatClass(threat({ cryptoAtRisk: 'KMAC, AES-CMAC session keys' }))).toBe(
      'unclassified'
    )
  })

  it('still classifies correctly when cryptoAtRisk genuinely contains PQC algorithm names', () => {
    // A threat ABOUT the PQC replacement itself (e.g. an implementation attack)
    // legitimately has ML-KEM/ML-DSA in cryptoAtRisk — that is real signal, not
    // pollution, since cryptoAtRisk is the one field the classifier reads.
    expect(getThreatClass(threat({ cryptoAtRisk: 'ML-KEM private key generation in HSMs' }))).toBe(
      'hndl'
    )
    expect(getThreatClass(threat({ cryptoAtRisk: 'ML-DSA private key during signing' }))).toBe(
      'hnfl'
    )
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

const byClass: Record<Exclude<ThreatClass, 'unclassified'>, string> = {
  hndl: 'TLS key wrapping for backup encryption',
  hnfl: 'ECDSA firmware signing certificate',
  both: 'RSA key management and ECDSA code signing',
}

describe('getSocUseCases (Threats #3) — the Applied Quantum v3.0 use cases', () => {
  it('uses the shared SOC module’s titles — the same ones the SOC Learn module renders', () => {
    const titles = new Set(SOC_USE_CASES.map((u) => u.title))
    for (const crypto of Object.values(byClass)) {
      for (const uc of getSocUseCases(threat({ cryptoAtRisk: crypto }))) {
        expect(titles.has(uc.title)).toBe(true)
      }
    }
    expect(DETECTION_USE_CASES.map((u) => u.title)).toEqual(SOC_USE_CASES.map((u) => u.title))
  })

  it('maps decrypt-later to drift + hybrid downgrade + horizon-weighted exfiltration (UC-2, UC-1, UC-5)', () => {
    expect(getSocUseCases(threat({ cryptoAtRisk: byClass.hndl })).map((u) => u.code)).toEqual([
      'UC-1',
      'UC-2',
      'UC-5',
    ])
  })

  it('maps forge-later to drift + certificate lifecycle + signature integrity (UC-2, UC-3, UC-4)', () => {
    expect(getSocUseCases(threat({ cryptoAtRisk: byClass.hnfl })).map((u) => u.code)).toEqual([
      'UC-2',
      'UC-3',
      'UC-4',
    ])
  })

  it('maps "both" to the union — all five use cases', () => {
    expect(getSocUseCases(threat({ cryptoAtRisk: byClass.both })).map((u) => u.code)).toEqual([
      'UC-1',
      'UC-2',
      'UC-3',
      'UC-4',
      'UC-5',
    ])
  })

  it('gives an unclassified threat drift monitoring only', () => {
    expect(
      getSocUseCases(threat({ cryptoAtRisk: 'something unrecognised' })).map((u) => u.code)
    ).toEqual(['UC-2'])
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

// Live data: every active row of the real latest threats CSV either gets at
// least one class-specific use case or is honestly unclassified. The
// unclassified count is reported, not asserted — deciding a stored class
// column is a pending data decision, and until then an unclassified row is a
// review signal, not a test failure.
const liveUnclassified = threatsData.filter((t) => getThreatClass(t) === 'unclassified')

describe('getSocUseCases over the real threats CSV', () => {
  it(`every active row gets ≥1 class-specific use case or is unclassified (${liveUnclassified.length} of ${threatsData.length} unclassified)`, () => {
    expect(threatsData.length).toBeGreaterThan(0)
    for (const t of threatsData) {
      const codes = getSocUseCases(t).map((u) => u.code)
      expect(codes).toContain('UC-2')
      const classSpecific = codes.filter((c) => c !== 'UC-2')
      if (getThreatClass(t) === 'unclassified') expect(classSpecific).toEqual([])
      else expect(classSpecific.length).toBeGreaterThan(0)
    }
  })
})

describe('getIrPlaybooks (Threats #6) — the four v3.0 playbooks', () => {
  it('offers Confirmed Hybrid Downgrade only to decrypt-later exposure', () => {
    const ids = (crypto: string) =>
      getIrPlaybooks(threat({ cryptoAtRisk: crypto })).map((p) => p.id)
    expect(ids(byClass.hndl)).toContain('confirmed-hybrid-downgrade')
    expect(ids(byClass.both)).toContain('confirmed-hybrid-downgrade')
    expect(ids(byClass.hnfl)).not.toContain('confirmed-hybrid-downgrade')
    expect(ids('something unrecognised')).not.toContain('confirmed-hybrid-downgrade')
  })

  it('always offers vulnerability disclosure, CRQC announcement and emergency rotation', () => {
    for (const crypto of [...Object.values(byClass), 'something unrecognised']) {
      const ids = getIrPlaybooks(threat({ cryptoAtRisk: crypto })).map((p) => p.id)
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
    const titles = getIrPlaybooks(threat({ cryptoAtRisk: byClass.both })).map((p) => p.title)
    for (const invented of ['Decrypt-Later', 'Signature-Forgery', 'Combined', 'Manual Triage']) {
      expect(titles.some((t) => t.includes(invented))).toBe(false)
    }
  })
})
