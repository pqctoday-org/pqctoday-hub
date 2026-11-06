// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { algorithmsData, getCryptoFamilyFromPQCName } from './algorithmsData'

describe('getCryptoFamilyFromPQCName: compound constructions', () => {
  it('classifies the same construction as Composite however its name is punctuated', () => {
    for (const name of [
      'ML-DSA-44-RSA2048-PSS (IETF Composite Sig)',
      'MLDSA44-RSA2048-PSS',
      'id-MLDSA44-RSA2048-PSS-SHA256',
      'ML-KEM-768-ECDH-P256 (IETF Composite KEM)',
      'MLKEM768-ECDH-P256',
      'ML-KEM-768-RSA-OAEP-2048 (IETF Composite KEM)',
      'X25519MLKEM768 (Hybrid Level 3)',
      'SecP256r1MLKEM768 (Hybrid Level 3)',
      'ML-KEM (hybrid with ECDHE)',
    ]) {
      expect(getCryptoFamilyFromPQCName(name), name).toBe('Composite')
    }
  })

  it('does not let a leading lattice prefix turn a compound name into a plain lattice scheme', () => {
    expect(getCryptoFamilyFromPQCName('ML-DSA-44-RSA2048-PSS')).not.toBe('Lattice')
    expect(getCryptoFamilyFromPQCName('ML-KEM-768-ECDH-P256')).not.toBe('Lattice')
  })

  it('keeps single-primitive names in their own mathematical family', () => {
    expect(getCryptoFamilyFromPQCName('ML-KEM-768')).toBe('Lattice')
    expect(getCryptoFamilyFromPQCName('ML-DSA-44')).toBe('Lattice')
    expect(getCryptoFamilyFromPQCName('FrodoKEM-640')).toBe('Lattice')
    expect(getCryptoFamilyFromPQCName('HQC-128')).toBe('Code-based')
    expect(getCryptoFamilyFromPQCName('Classic-McEliece-460896')).toBe('Code-based')
    expect(getCryptoFamilyFromPQCName('SLH-DSA-SHA2-128s')).toBe('Hash-based')
    expect(getCryptoFamilyFromPQCName('LMS-SHA256-M32-H10')).toBe('Hash-based')
    expect(getCryptoFamilyFromPQCName('SQIsign')).toBe('Isogeny')
    expect(getCryptoFamilyFromPQCName('UOV-Is')).toBe('Multivariate')
    expect(getCryptoFamilyFromPQCName('AES-256')).toBe('N/A')
  })

  it('every transition row that names a post-quantum and a classical algorithm filters as Composite', () => {
    const pq = /(mlkem|mldsa|slhdsa|fndsa|falcon|dilithium|kyber|frodokem|hqc|mceliece|sphincs)/
    const classical = /(rsa|ecdsa|ecdh|ed25519|ed448|x25519|x448|secp\d|p256|p384|p521)/
    const mixed = algorithmsData
      .map((t) => t.pqc)
      .filter((name) => {
        const compact = name.toLowerCase().replace(/[^a-z0-9]/g, '')
        return pq.test(compact) && classical.test(compact)
      })
    expect(mixed.length).toBeGreaterThan(0)
    for (const name of mixed) expect(getCryptoFamilyFromPQCName(name), name).toBe('Composite')
  })
})
