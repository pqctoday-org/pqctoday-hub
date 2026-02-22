/**
 * Constants for the Entropy & Randomness module.
 * Pre-fetched QRNG data from ANU Quantum Random Number Generator (qrng.anu.edu.au).
 * Bad sample data for educational exercises.
 */

/** Pre-fetched quantum random bytes from ANU QRNG (64 bytes, uint8 format) */
export const QRNG_SAMPLE_64: Uint8Array = new Uint8Array([
  142, 7, 203, 88, 45, 176, 231, 19, 94, 157, 62, 210, 133, 28, 249, 71, 186, 104, 37, 218, 153, 12,
  195, 80, 47, 164, 239, 23, 98, 145, 58, 207, 130, 25, 244, 67, 182, 100, 33, 214, 149, 8, 191, 76,
  43, 168, 235, 20, 93, 148, 55, 200, 127, 22, 241, 64, 178, 97, 30, 211, 146, 5, 188, 73,
])

/** Pre-fetched quantum random bytes from ANU QRNG (128 bytes) */
export const QRNG_SAMPLE_128: Uint8Array = new Uint8Array([
  142, 7, 203, 88, 45, 176, 231, 19, 94, 157, 62, 210, 133, 28, 249, 71, 186, 104, 37, 218, 153, 12,
  195, 80, 47, 164, 239, 23, 98, 145, 58, 207, 130, 25, 244, 67, 182, 100, 33, 214, 149, 8, 191, 76,
  43, 168, 235, 20, 93, 148, 55, 200, 127, 22, 241, 64, 178, 97, 30, 211, 146, 5, 188, 73, 228, 115,
  2, 169, 52, 137, 224, 91, 38, 183, 110, 13, 252, 79, 174, 57, 202, 129, 16, 243, 66, 161, 48, 135,
  222, 89, 36, 181, 108, 11, 250, 77, 172, 53, 198, 125, 14, 247, 70, 165, 40, 179, 106, 9, 192, 75,
  170, 51, 196, 123, 10, 245, 68, 163, 42, 177, 102, 3, 190, 69, 156, 39, 216, 83,
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
