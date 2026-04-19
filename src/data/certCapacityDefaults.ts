// SPDX-License-Identifier: GPL-3.0-only
/**
 * Reference sizes and performance characteristics for certificate lifecycle capacity planning.
 *
 * Sources:
 * - RSA-2048 / ECDSA-P256: RFC 5280, RFC 3279, typical TLS cert measurements
 * - ML-DSA variants: NIST FIPS 204 (Table 1 and Table 2)
 * - SLH-DSA: NIST FIPS 205 (Table 2 — SLH-DSA-SHA2-128s)
 * - TLS handshake overhead: draft-ietf-tls-mldsa (Section 4)
 * - CPU estimates: NIST PQC Round 3 evaluation benchmarks (x86-64, cycles/op at 3 GHz)
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
  /** Estimated CPU time for one sign operation (microseconds on a 3 GHz x86-64) */
  signCpuMicros: number
  /** Estimated CPU time for one verify operation (microseconds) */
  verifyCpuMicros: number
  /** Approximate TLS Certificate message overhead vs baseline (bytes additional) */
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
    signCpuMicros: 700,
    verifyCpuMicros: 20,
    tlsCertOverheadBytes: 0, // baseline
    sizeSource: 'RFC 3447, RFC 5280',
    perfSource: 'OpenSSL speed benchmark average, 3 GHz x86-64',
  },
  {
    name: 'ECDSA P-256',
    securityLevel: 1,
    publicKeyBytes: 64,
    privateKeyBytes: 32,
    signatureBytes: 72,
    signCpuMicros: 100,
    verifyCpuMicros: 200,
    tlsCertOverheadBytes: -184, // smaller than RSA-2048
    sizeSource: 'RFC 5480, RFC 3279',
    perfSource: 'OpenSSL speed benchmark average, 3 GHz x86-64',
  },
  {
    name: 'ML-DSA-44',
    securityLevel: 1,
    publicKeyBytes: 1312,
    privateKeyBytes: 2560,
    signatureBytes: 2420,
    signCpuMicros: 110,
    verifyCpuMicros: 70,
    tlsCertOverheadBytes: 2164, // sig delta vs RSA-2048 baseline in cert
    sizeSource: 'NIST FIPS 204, Table 1',
    perfSource: 'NIST PQC Round 3 evaluation, x86-64 reference',
  },
  {
    name: 'ML-DSA-65',
    securityLevel: 3,
    publicKeyBytes: 1952,
    privateKeyBytes: 4032,
    signatureBytes: 3293,
    signCpuMicros: 190,
    verifyCpuMicros: 100,
    tlsCertOverheadBytes: 3037,
    sizeSource: 'NIST FIPS 204, Table 1',
    perfSource: 'NIST PQC Round 3 evaluation, x86-64 reference',
  },
  {
    name: 'ML-DSA-87',
    securityLevel: 5,
    publicKeyBytes: 2592,
    privateKeyBytes: 4896,
    signatureBytes: 4595,
    signCpuMicros: 280,
    verifyCpuMicros: 130,
    tlsCertOverheadBytes: 4339,
    sizeSource: 'NIST FIPS 204, Table 1',
    perfSource: 'NIST PQC Round 3 evaluation, x86-64 reference',
  },
  {
    name: 'SLH-DSA-128s',
    securityLevel: 1,
    publicKeyBytes: 32,
    privateKeyBytes: 64,
    signatureBytes: 7856,
    signCpuMicros: 280000, // ~280ms — stateless hash-based, very slow sign
    verifyCpuMicros: 1200,
    tlsCertOverheadBytes: 7600,
    sizeSource: 'NIST FIPS 205, Table 2 (SLH-DSA-SHA2-128s)',
    perfSource: 'NIST FIPS 205 reference implementation benchmarks',
  },
]

export const BASELINE_ALGO = CERT_CAPACITY_DEFAULTS[0] // RSA-2048
