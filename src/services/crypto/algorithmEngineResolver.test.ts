// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  resolveEngine,
  getEngineLabel,
  runBenchmark,
  getBenchmarkUnavailableReason,
} from './algorithmEngineResolver'

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
    'Classic-McEliece-6688128',
    'Classic-McEliece-6960119',
  ])('routes %s to liboqs', (algo) => {
    expect(resolveEngine(algo)).toBe('liboqs')
  })

  // ── not benchmarkable (no standalone in-browser engine) ──
  it.each([
    'LMS-SHA256 (H20/W8)',
    'XMSS-SHA2_20',
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

// Reject these before loading any engine. A prefix/parseInt fallback would run
// another algorithm and produce plausible but misattributed measurements.
describe('exact benchmark identity', () => {
  it.each([
    'ML-KEM-768-ECDH-P256',
    'ML-KEM-768-RSA-OAEP-2048',
    ...['SHA2', 'SHAKE'].flatMap((hash) =>
      [128, 192, 256].map((level) => `SLH-DSA-${hash}-${level}-24`)
    ),
    'LMS-SHA256 (H20/W8)',
    'XMSS-SHA2_20',
    'ML-KEM-999',
    'ML-DSA-65-composite',
    'ECDSA unknown',
    'ECDH unknown',
  ])('refuses unsupported exact identity %s', async (name) => {
    expect(resolveEngine(name)).toBeNull()
    expect(getBenchmarkUnavailableReason(name)).toBeTruthy()
    await expect(runBenchmark(name)).rejects.toThrow(`No engine available for ${name}`)
  })
  it('explains reduced stateful demos without attributing their timings to H20', () => {
    expect(getBenchmarkUnavailableReason('XMSS-SHA2_20')).toContain('smaller demonstration tree')
    expect(getBenchmarkUnavailableReason('ML-KEM-768')).toBeNull()
  })
})
