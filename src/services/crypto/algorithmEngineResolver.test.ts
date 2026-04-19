// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { resolveEngine, getEngineLabel } from './algorithmEngineResolver'

describe('resolveEngine', () => {
  // ── softhsm (primary engine for all supported algorithms) ──
  it.each([
    // ML-KEM / ML-DSA
    'ML-KEM-512',
    'ML-KEM-768',
    'ML-KEM-1024',
    'ML-DSA-44',
    'ML-DSA-65',
    'ML-DSA-87',
    // SLH-DSA (softhsmv3 Rust supports all param sets)
    'SLH-DSA-SHA2-128f',
    'SLH-DSA-SHA2-256s',
    'SLH-DSA-SHAKE-192f',
    // RSA
    'RSA-2048',
    'RSA-3072',
    'RSA-4096',
    // ECDSA
    'ECDSA P-256',
    'ECDSA P-384',
    'ECDSA P-521',
    // EdDSA
    'Ed25519',
    // ECDH
    'ECDH P-256',
    'ECDH P-384',
    'ECDH P-521',
    // Montgomery DH
    'X25519',
    'X448',
    // secp256k1
    'secp256k1',
    // Stateful hash-based
    'LMS-SHA256 (H20/W8)',
    'XMSS-SHA2_20',
  ])('routes %s to softhsm', (algo) => {
    expect(resolveEngine(algo)).toBe('softhsm')
  })

  // ── liboqs (algorithms not yet in softhsmv3) ──
  it.each([
    'FN-DSA-512',
    'FN-DSA-1024',
    'HQC-128',
    'HQC-192',
    'HQC-256',
    'FrodoKEM-640',
    'FrodoKEM-976',
    'FrodoKEM-1344',
    'Classic-McEliece-348864',
    'Classic-McEliece-460896',
    'Classic-McEliece-8192128',
  ])('routes %s to liboqs', (algo) => {
    expect(resolveEngine(algo)).toBe('liboqs')
  })

  // ── not benchmarkable (no standalone in-browser engine) ──
  it.each([
    'Ed448',
    'DH (Diffie-Hellman)',
    'X25519MLKEM768',
    'SecP256r1MLKEM768',
    'SecP384r1MLKEM1024',
  ])('returns null for %s (not benchmarkable)', (algo) => {
    expect(resolveEngine(algo)).toBeNull()
  })

  it('returns null for unknown algorithm', () => {
    expect(resolveEngine('UNKNOWN-ALGO')).toBeNull()
  })
})

describe('getEngineLabel', () => {
  it.each([
    ['softhsm', 'SoftHSM'],
    ['liboqs', 'liboqs'],
    ['webcrypto', 'WebCrypto'],
    ['noble', '@noble'],
  ] as const)('returns %s label as %s', (engine, label) => {
    expect(getEngineLabel(engine)).toBe(label)
  })
})
