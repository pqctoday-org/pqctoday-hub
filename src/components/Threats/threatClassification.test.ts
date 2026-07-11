// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { ThreatItem } from '@/data/threatsData'
import {
  getThreatClass,
  threatMatchesClass,
  getShorTier,
  getSocUseCases,
  getIrPlaybook,
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
})

describe('getSocUseCases (Threats #3)', () => {
  it('always surfaces the handshake + CTI use cases', () => {
    const ids = getSocUseCases(threat({ cryptoAtRisk: 'TLS' })).map((u) => u.id)
    expect(ids).toContain('UC1')
    expect(ids).toContain('UC5')
  })

  it('routes forge-later threats to the signature-forgery use case (UC3)', () => {
    const ids = getSocUseCases(threat({ cryptoAtRisk: 'ECDSA code signing' })).map((u) => u.id)
    expect(ids).toContain('UC3')
  })

  it('routes decrypt-later threats to the HNDL exfiltration use case (UC2)', () => {
    const ids = getSocUseCases(threat({ cryptoAtRisk: 'TLS encryption key wrapping' })).map(
      (u) => u.id
    )
    expect(ids).toContain('UC2')
  })
})

describe('getIrPlaybook (Threats #6)', () => {
  it('maps each threat class to a distinct playbook with a Command-Center link', () => {
    const hndl = getIrPlaybook(threat({ cryptoAtRisk: 'TLS encryption' }))
    const hnfl = getIrPlaybook(threat({ cryptoAtRisk: 'ECDSA signing' }))
    expect(hndl.href).toContain('/business?tool=ir-playbook')
    expect(hnfl.href).toContain('/business?tool=ir-playbook')
    expect(hndl.id).not.toBe(hnfl.id)
  })
})
