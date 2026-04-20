// SPDX-License-Identifier: GPL-3.0-only
/**
 * Reference sizes and performance characteristics for certificate lifecycle capacity planning.
 *
 * Size sources:
 * - RSA-2048 / ECDSA-P256: RFC 5280, RFC 3279, RFC 5480
 * - ML-DSA variants: NIST FIPS 204, Table 1
 * - SLH-DSA: NIST FIPS 205, Table 2 (SLH-DSA-SHA2-128s)
 *
 * Performance sources (all AVX2-optimised, 3 GHz x86-64):
 * - RSA-2048: OpenSSL 3.x with CRT + AVX2 (Haswell-class server)
 * - ECDSA P-256: OpenSSL 3.x with AVX2 scalar-multiplication optimisations
 * - ML-DSA-44/65/87: CRYSTALS-Dilithium AVX2 implementation, Haswell benchmarks
 *   published in the NIST PQC Round 3 submission package (Appendix B).
 *   Cycle counts: ML-DSA-44 sign 86 252 / verify 57 789;
 *                 ML-DSA-65 sign 130 676 / verify 84 906;
 *                 ML-DSA-87 sign 197 960 / verify 126 839.
 * - SLH-DSA-128s: reference impl (SIMD gives negligible speedup for hash-tree traversal)
 */

export interface AlgoCapacityProfile {
  /** Human-readable algorithm name */
  name: string
  /** NIST security level (1 = AES-128 equivalent) */
  securityLevel: 1 | 3 | 5
  /** Public key size in bytes */
  publicKeyBytes: number
  /** Private key size in bytes */
  privateKeyBytes: number
  /** Signature / ciphertext size in bytes */
  signatureBytes: number
  /** AVX2-optimised sign latency (µs on a 3 GHz x86-64) */
  signCpuMicros: number
  /** AVX2-optimised verify latency (µs) */
  verifyCpuMicros: number
  /** Approximate TLS Certificate message overhead vs RSA-2048 baseline (bytes, metadata only) */
  tlsCertOverheadBytes: number
  /** Citation for sizes */
  sizeSource: string
  /** Citation for performance */
  perfSource: string
}

export const CERT_CAPACITY_DEFAULTS: AlgoCapacityProfile[] = [
  {
    name: 'RSA-2048',
    securityLevel: 1,
    publicKeyBytes: 256,
    privateKeyBytes: 1192,
    signatureBytes: 256,
    signCpuMicros: 400, // OpenSSL 3.x + CRT + AVX2, ~2500 sign/s at 3 GHz
    verifyCpuMicros: 5, // e=65537 — single modexp, very fast
    tlsCertOverheadBytes: 0, // baseline
    sizeSource: 'RFC 3447, RFC 5280',
    perfSource: 'OpenSSL 3.x + AVX2 + CRT, 3 GHz x86-64 (Haswell-class)',
  },
  {
    name: 'ECDSA P-256',
    securityLevel: 1,
    publicKeyBytes: 64,
    privateKeyBytes: 32,
    signatureBytes: 72,
    signCpuMicros: 40, // OpenSSL 3.x + AVX2 scalar-mult, ~25 000 sign/s at 3 GHz
    verifyCpuMicros: 80, // two scalar multiplications
    tlsCertOverheadBytes: -184,
    sizeSource: 'RFC 5480, RFC 3279',
    perfSource: 'OpenSSL 3.x + AVX2, 3 GHz x86-64 (Haswell-class)',
  },
  {
    name: 'ML-DSA-44',
    securityLevel: 1,
    publicKeyBytes: 1312,
    privateKeyBytes: 2560,
    signatureBytes: 2420,
    signCpuMicros: 29, // 86 252 cycles ÷ 3 GHz — CRYSTALS Dilithium2 AVX2, Haswell
    verifyCpuMicros: 19, // 57 789 cycles ÷ 3 GHz
    tlsCertOverheadBytes: 2164,
    sizeSource: 'NIST FIPS 204, Table 1',
    perfSource: 'CRYSTALS-Dilithium AVX2, Haswell — NIST PQC Round 3 submission Appendix B',
  },
  {
    name: 'ML-DSA-65',
    securityLevel: 3,
    publicKeyBytes: 1952,
    privateKeyBytes: 4032,
    signatureBytes: 3293,
    signCpuMicros: 44, // 130 676 cycles ÷ 3 GHz
    verifyCpuMicros: 28, // 84 906 cycles ÷ 3 GHz
    tlsCertOverheadBytes: 3037,
    sizeSource: 'NIST FIPS 204, Table 1',
    perfSource: 'CRYSTALS-Dilithium AVX2, Haswell — NIST PQC Round 3 submission Appendix B',
  },
  {
    name: 'ML-DSA-87',
    securityLevel: 5,
    publicKeyBytes: 2592,
    privateKeyBytes: 4896,
    signatureBytes: 4595,
    signCpuMicros: 66, // 197 960 cycles ÷ 3 GHz
    verifyCpuMicros: 42, // 126 839 cycles ÷ 3 GHz
    tlsCertOverheadBytes: 4339,
    sizeSource: 'NIST FIPS 204, Table 1',
    perfSource: 'CRYSTALS-Dilithium AVX2, Haswell — NIST PQC Round 3 submission Appendix B',
  },
  {
    name: 'SLH-DSA-128s',
    securityLevel: 1,
    publicKeyBytes: 32,
    privateKeyBytes: 64,
    signatureBytes: 7856,
    signCpuMicros: 280000, // ~280 ms — hash-tree traversal; SIMD gives negligible speedup
    verifyCpuMicros: 1200,
    tlsCertOverheadBytes: 7600,
    sizeSource: 'NIST FIPS 205, Table 2 (SLH-DSA-SHA2-128s)',
    perfSource: 'NIST FIPS 205 reference implementation benchmarks',
  },
]

export const BASELINE_ALGO = CERT_CAPACITY_DEFAULTS[0] // RSA-2048
