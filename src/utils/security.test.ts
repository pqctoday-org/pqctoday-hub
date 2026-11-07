// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getSecurityLevel } from './security'
import { loadPQCAlgorithmsData } from '../data/pqcAlgorithmsData'

describe('getSecurityLevel', () => {
  it('shows ML-DSA-44 as category 2, not category 1', () => {
    for (const name of [
      'ml-dsa-44.key',
      'mldsa44_priv.pem',
      'MLDSA-44-cert.pem',
      'dilithium2.key',
    ]) {
      expect(getSecurityLevel(name)).toBe(2)
    }
  })

  it('reads every FIPS 203/204/205 parameter set from its algorithm and parameter', () => {
    expect(getSecurityLevel('mlkem512.key')).toBe(1)
    expect(getSecurityLevel('ml-kem-768.pub')).toBe(3)
    expect(getSecurityLevel('mlkem1024_priv.pem')).toBe(5)
    expect(getSecurityLevel('ml-dsa-65.pem')).toBe(3)
    expect(getSecurityLevel('mldsa87.key')).toBe(5)
    expect(getSecurityLevel('slh-dsa-sha2-128s.pem')).toBe(1)
    expect(getSecurityLevel('slh-dsa-shake-192f.key')).toBe(3)
    expect(getSecurityLevel('slhdsa256s.key')).toBe(5)
    expect(getSecurityLevel('falcon-512.key')).toBe(1)
    expect(getSecurityLevel('fn-dsa-1024.key')).toBe(5)
    expect(getSecurityLevel('frodokem-976.key')).toBe(3)
    expect(getSecurityLevel('hqc-256.key')).toBe(5)
  })

  it('reads the parameter, not the SHAKE width, from a round-three SPHINCS+ name', () => {
    expect(getSecurityLevel('sphincs+-shake256-128s-simple.key')).toBe(1)
    expect(getSecurityLevel('slh-dsa-shake256-192f.pem')).toBe(3)
    expect(getSecurityLevel('sphincs+-sha256-256s.key')).toBe(5)
    expect(getSecurityLevel('slh-dsa-shake-256s.key')).toBe(5)
  })

  it('does not let an arbitrary 512, 768 or 1024 in a filename set the category', () => {
    for (const name of [
      'backup-512.pem',
      'invoice_768.csr',
      'server-1024.key',
      'rsa-1024.key',
      'report-2024-1024-final.pem',
      'photo640.pem',
      'cert-1344.pem',
      'user128.key',
    ]) {
      expect(getSecurityLevel(name)).toBeNull()
    }
  })

  it('gives no badge to a file with an unrecognised algorithm or an unlisted parameter', () => {
    expect(getSecurityLevel('server.pem')).toBeNull()
    expect(getSecurityLevel('ed25519.key')).toBeNull()
    expect(getSecurityLevel('ml-dsa-99.key')).toBeNull()
    expect(getSecurityLevel('ml-kem-2048.pub')).toBeNull()
    // Digits that continue past a parameter token are a different number.
    expect(getSecurityLevel('mlkem5120.key')).toBeNull()
  })

  it('does not attach a parameter from one algorithm to another algorithm name', () => {
    // 44 is an ML-DSA parameter, not an ML-KEM one; 512 is an ML-KEM parameter, not an ML-DSA one.
    expect(getSecurityLevel('ml-kem-44.key')).toBeNull()
    expect(getSecurityLevel('ml-dsa-512.key')).toBeNull()
  })

  it('agrees with the published category of every algorithm in the reference data it recognises', async () => {
    const data = await loadPQCAlgorithmsData()
    const parsed = data
      .map((a) => ({ name: a.name, level: getSecurityLevel(a.name), stated: a.securityLevel }))
      .filter((a) => a.level !== null)
    // The reference data contains the NIST-standardised parameter sets, so the parser must
    // recognise a meaningful number of them...
    expect(parsed.length).toBeGreaterThanOrEqual(20)
    // ...and must never disagree with the category the data states for the same name.
    const mismatches = parsed.filter((a) => a.stated !== null && a.level !== a.stated)
    expect(mismatches).toEqual([])
    // ML-DSA-44 in particular is the category the data states (2).
    expect(data.find((a) => a.name === 'ML-DSA-44')?.securityLevel).toBe(2)
  })
})
