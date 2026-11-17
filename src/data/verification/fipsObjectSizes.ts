// SPDX-License-Identifier: AGPL-3.0-only
/** Independently transcribed raw object lengths, not derived from the Hub registry.
 * FIPS 203 (2024), Table 3; FIPS 204 (2024), Table 2.
 * Encoded certificates, protocol messages and signing-key seeds are different claims.
 */
export const FIPS_OBJECT_SIZES = {
  'ML-KEM-512': {
    publicKeyBytes: 800,
    privateKeyBytes: 1632,
    signatureOrCiphertextBytes: 768,
    securityLevel: 1,
    fipsStandard: 'FIPS 203',
  },
  'ML-KEM-768': {
    publicKeyBytes: 1184,
    privateKeyBytes: 2400,
    signatureOrCiphertextBytes: 1088,
    securityLevel: 3,
    fipsStandard: 'FIPS 203',
  },
  'ML-KEM-1024': {
    publicKeyBytes: 1568,
    privateKeyBytes: 3168,
    signatureOrCiphertextBytes: 1568,
    securityLevel: 5,
    fipsStandard: 'FIPS 203',
  },
  'ML-DSA-44': {
    publicKeyBytes: 1312,
    privateKeyBytes: 2560,
    signatureOrCiphertextBytes: 2420,
    securityLevel: 2,
    fipsStandard: 'FIPS 204',
  },
  'ML-DSA-65': {
    publicKeyBytes: 1952,
    privateKeyBytes: 4032,
    signatureOrCiphertextBytes: 3309,
    securityLevel: 3,
    fipsStandard: 'FIPS 204',
  },
  'ML-DSA-87': {
    publicKeyBytes: 2592,
    privateKeyBytes: 4896,
    signatureOrCiphertextBytes: 4627,
    securityLevel: 5,
    fipsStandard: 'FIPS 204',
  },
} as const
export const FIPS_OBJECT_SIZE_SOURCES = [
  'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf',
  'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf',
]
