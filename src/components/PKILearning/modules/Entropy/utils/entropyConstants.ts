// SPDX-License-Identifier: GPL-3.0-only
/**
 * Constants for the Entropy & Randomness module.
 * Reference random samples generated via Node.js crypto.randomBytes() to serve as
 * high-quality classical reference data for educational QRNG comparison exercises.
 * These are NOT from a quantum source — see QRNGDemo.tsx for full disclosure.
 * Bad sample data for educational exercises.
 */

/** Reference quantum random bytes (64 bytes) — generated via crypto.randomBytes()
 * to represent a QRNG-quality sample for educational comparison. */
export const QRNG_SAMPLE_64: Uint8Array = new Uint8Array([
  181, 246, 163, 78, 5, 146, 4, 25, 72, 205, 103, 32, 107, 64, 139, 252, 80, 1, 101, 233, 39, 245,
  81, 209, 30, 155, 85, 24, 117, 107, 76, 86, 147, 97, 138, 196, 102, 79, 43, 95, 135, 106, 240, 39,
  102, 54, 196, 198, 212, 207, 48, 119, 114, 156, 170, 143, 12, 128, 84, 57, 159, 186, 78, 248,
])

/** Reference quantum random bytes (128 bytes) — generated via crypto.randomBytes()
 * to represent a QRNG-quality sample for educational comparison. */
export const QRNG_SAMPLE_128: Uint8Array = new Uint8Array([
  47, 197, 177, 153, 212, 75, 203, 109, 228, 85, 22, 109, 226, 59, 216, 230, 246, 246, 51, 124, 253,
  4, 8, 183, 2, 141, 208, 60, 105, 76, 228, 79, 95, 57, 162, 91, 198, 46, 138, 139, 26, 188, 14, 63,
  214, 252, 170, 37, 107, 42, 27, 77, 176, 82, 236, 205, 0, 40, 11, 185, 78, 236, 251, 74, 218, 203,
  59, 243, 72, 86, 174, 162, 164, 4, 129, 149, 119, 75, 68, 110, 88, 165, 89, 82, 224, 211, 162,
  154, 85, 221, 177, 115, 18, 192, 210, 176, 227, 32, 38, 78, 25, 25, 163, 79, 114, 134, 205, 159,
  97, 89, 148, 229, 190, 83, 56, 203, 103, 64, 231, 118, 197, 221, 96, 250, 9, 199, 240, 52,
])

/** Bad sample: all zeros (stuck-at failure) */
export const BAD_SAMPLE_ZEROS: Uint8Array = new Uint8Array(64).fill(0)

/** Bad sample: repeating 4-byte pattern */
export const BAD_SAMPLE_PATTERN: Uint8Array = (() => {
  const arr = new Uint8Array(64)
  const pattern = [0xde, 0xad, 0xbe, 0xef]
  for (let i = 0; i < arr.length; i++) {
    arr[i] = pattern[i % 4]
  }
  return arr
})()

/** Bad sample: incrementing sequence */
export const BAD_SAMPLE_INCREMENT: Uint8Array = (() => {
  const arr = new Uint8Array(64)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = i % 256
  }
  return arr
})()

/** Sample byte count options for the workshop */
export const BYTE_COUNT_OPTIONS = [16, 32, 64, 128] as const

/** ESV walkthrough steps */
export const ESV_STEPS = [
  {
    id: 'description',
    title: 'Entropy Source Description',
    description:
      'Document the physical noise source type (thermal, shot noise, ring oscillator, etc.), its operating parameters, and expected entropy rate.',
  },
  {
    id: 'noise-model',
    title: 'Noise Source Model',
    description:
      'Provide a stochastic model for the noise source explaining how physical randomness is converted to digital output. Include analysis of failure modes.',
  },
  {
    id: 'raw-samples',
    title: 'Raw Noise Samples',
    description:
      'Submit 1,000,000+ raw (unconditioned) noise samples to the ESV Server for SP 800-90B min-entropy assessment.',
  },
  {
    id: 'health-tests',
    title: 'Health Test Configuration',
    description:
      'Specify repetition count and adaptive proportion test parameters. These run continuously to detect entropy source degradation.',
  },
  {
    id: 'conditioning',
    title: 'Conditioning Component',
    description:
      'Document the conditioning function (e.g., HMAC, hash, CBC-MAC) that processes raw noise into full-entropy output for the DRBG.',
  },
] as const

/** DRBG mechanism descriptions for Learn tab */
export const DRBG_MECHANISMS = [
  {
    name: 'CTR_DRBG',
    basis: 'AES (block cipher)',
    description:
      'Most widely deployed. Default in OpenSSL and Linux kernel. Uses AES in counter mode.',
    strengths:
      'Fast on hardware with AES-NI. Well-studied. FIPS-validated implementations widely available.',
  },
  {
    name: 'Hash_DRBG',
    basis: 'SHA-256 / SHA-512',
    description:
      'Uses hash functions for state update and output. Simpler construction with larger internal state.',
    strengths:
      'No block cipher dependency. Larger state resists state compromise. Good for resource-constrained devices.',
  },
  {
    name: 'HMAC_DRBG',
    basis: 'HMAC-SHA-256 / HMAC-SHA-384',
    description:
      'Used in deterministic signatures (RFC 6979). Strongest security proof of the three mechanisms.',
    strengths:
      'Provable security reduction to HMAC. Used for deterministic ECDSA. Clean extract-then-expand design.',
  },
  {
    name: 'XOF_DRBG',
    basis: 'SHAKE128 / SHAKE256',
    description:
      'Added in SP 800-90A Rev 2. Uses extendable-output functions (XOFs) for state update and output.',
    strengths:
      'Ideal synergy with PQC algorithms (like ML-KEM and ML-DSA) that heavily utilize SHAKE. Highly parallelizable.',
  },
] as const

/** TRNG vs QRNG comparison data */
export const RNG_COMPARISON = [
  {
    property: 'Physical Source',
    trng: 'Thermal noise, shot noise, clock jitter',
    qrng: 'Photon detection, vacuum fluctuations, beam splitting',
  },
  {
    property: 'Randomness Basis',
    trng: 'Classical physics (chaotic/unpredictable processes)',
    qrng: 'Quantum mechanics (Born rule, measurement uncertainty)',
  },
  {
    property: 'Common Hardware',
    trng: 'Intel RDRAND/RDSEED, ARM RNDR, TPM RNG',
    qrng: 'ID Quantique Quantis, Toshiba QRNG, ANU vacuum source',
  },
  {
    property: 'Throughput',
    trng: '~1-3 Gbps (Intel RDRAND)',
    qrng: '~1-4 Gbps (commercial devices)',
  },
  {
    property: 'Quantum-Safe',
    trng: 'Yes — not based on computational assumptions',
    qrng: 'Yes — guaranteed by quantum physics',
  },
  {
    property: 'Availability',
    trng: 'Built into most modern CPUs and security chips',
    qrng: 'Standalone devices or cloud API services',
  },
  {
    property: 'Cost',
    trng: 'Included in CPU (no additional cost)',
    qrng: '$500-5,000+ for hardware; cloud API pricing varies',
  },
  {
    property: 'Certification',
    trng: 'NIST ESV, FIPS 140-3, Common Criteria',
    qrng: 'NIST ESV (emerging), BSI AIS 31, proprietary certification',
  },
] as const
