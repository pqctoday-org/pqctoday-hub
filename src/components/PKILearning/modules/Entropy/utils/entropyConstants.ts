// SPDX-License-Identifier: GPL-3.0-only
/**
 * Constants for the Entropy & Randomness module.
 * Reference random samples generated via Node.js crypto.randomBytes() to serve as
 * high-quality classical reference data for educational QRNG comparison exercises.
 * These are NOT from a quantum source — see QRNGDemo.tsx for full disclosure.
 * Bad sample data for educational exercises.
 */

/** Stand-in for QRNG output (64 bytes). Classical bytes from crypto.randomBytes(),
 * NOT from a quantum source; used only to show the data flow. */
export const QRNG_SAMPLE_64: Uint8Array = new Uint8Array([
  181, 246, 163, 78, 5, 146, 4, 25, 72, 205, 103, 32, 107, 64, 139, 252, 80, 1, 101, 233, 39, 245,
  81, 209, 30, 155, 85, 24, 117, 107, 76, 86, 147, 97, 138, 196, 102, 79, 43, 95, 135, 106, 240, 39,
  102, 54, 196, 198, 212, 207, 48, 119, 114, 156, 170, 143, 12, 128, 84, 57, 159, 186, 78, 248,
])

/** Stand-in for QRNG output (128 bytes). Classical bytes from crypto.randomBytes(),
 * NOT from a quantum source; used only to show the data flow. */
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

/**
 * SP 800-90A Rev. 1 DRBG mechanisms, for the Learn tab.
 * Rev. 1 (June 2015) is the current final version and specifies exactly these
 * three mechanisms (§10.1.1, §10.1.2, §10.2.1). Do not add a SHAKE/XOF-based
 * entry here: see SP800_90A_REV2_STATUS — no draft of such a mechanism exists.
 */
export const DRBG_MECHANISMS = [
  {
    name: 'CTR_DRBG',
    section: 'SP 800-90A Rev. 1 §10.2.1',
    basis: 'Block cipher (AES; Rev. 1 also allows TDEA)',
    description: 'Uses an approved block cipher in counter mode for state update and output.',
    strengths:
      'Engineering note: fast where the platform has AES hardware support; widely implemented.',
  },
  {
    name: 'Hash_DRBG',
    section: 'SP 800-90A Rev. 1 §10.1.1',
    basis: 'Approved hash function (e.g. SHA-256, SHA-512)',
    description: 'Uses an approved hash function for state update and output.',
    strengths: 'Engineering note: no block-cipher dependency.',
  },
  {
    name: 'HMAC_DRBG',
    section: 'SP 800-90A Rev. 1 §10.1.2',
    basis: 'HMAC with an approved hash function',
    description:
      'Uses HMAC for state update and output. RFC 6979 deterministic (EC)DSA derives its per-signature k from HMAC_DRBG.',
    strengths: 'Engineering note: simple construction built only on HMAC.',
  },
] as const

/**
 * Status of SP 800-90A Rev. 2, checked 2026-09-24 against
 * https://csrc.nist.gov/pubs/sp/800/90/a/r2/iprd — an announced intention,
 * not a draft and not a standard.
 */
export const SP800_90A_REV2_STATUS = {
  url: 'https://csrc.nist.gov/pubs/sp/800/90/a/r2/iprd',
  checkedOn: '2026-09-24',
  stage: 'Pre-draft call for comments',
  published: '2025-09-04',
  commentsClosed: '2025-11-04',
  note: 'NIST has announced that the revision will introduce a DRBG construction based on the SHAKE extendable-output functions of FIPS 202. No draft text has been published, so no such mechanism is specified or approved yet.',
} as const

/**
 * TRNG vs QRNG, for the Learn tab. Both kinds are noise sources judged by the
 * same SP 800-90B criteria; the certificate numbers below were checked on the
 * CMVP entropy-validation search on 2026-09-24.
 */
export const RNG_COMPARISON = [
  {
    property: 'Noise source',
    trng: 'A classical physical or non-physical process, e.g. thermal noise, clock or CPU-timing jitter',
    qrng: 'A quantum process, e.g. photon detection or quantum tunnelling',
  },
  {
    property: 'Validation criteria (FIPS 140-3)',
    trng: 'SP 800-90B: noise-source model, entropy estimate from raw data, health tests',
    qrng: 'The same SP 800-90B requirements — no separate track for quantum sources',
  },
  {
    property: 'Example Entropy Validation Certificates',
    trng: 'E19 SUSE Kernel CPU Time Jitter RNG; E280 AWS-LC CPU Jitter RNG Entropy Source',
    qrng: 'E63 IDQ Quantis IID QRNG (QRNG chips); E145 QuintessenceLabs qStream 100',
  },
  {
    property: 'What security rests on',
    trng: 'The noise source really delivering its assessed min-entropy, checked in operation by health tests',
    qrng: 'The same. Quantum physics describes the ideal process; a real device can still fail or degrade, which is what health tests are for',
  },
  {
    property: 'What output statistics show',
    trng: 'Passing statistical tests on output is not an entropy estimate; SP 800-90B estimates come from raw noise-source data',
    qrng: 'Same — a working CSPRNG passes the same tests, so passing cannot tell the two apart',
  },
] as const
