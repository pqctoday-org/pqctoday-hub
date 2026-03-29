// SPDX-License-Identifier: GPL-3.0-only
/**
 * Authoritative algorithm properties registry.
 *
 * Single source of truth for key sizes, security levels, and FIPS mappings.
 * All learn modules and workshop components should import from here instead
 * of hardcoding algorithm parameters.
 *
 * Data sourced from:
 *   - scripts/fact_allowlists.json (size_map, security_level_map, fips_to_algorithm)
 *   - src/data/pqc_complete_algorithm_reference_*.csv (family, fipsStandard)
 *
 * To update: modify the algorithm CSV or fact_allowlists.json, then regenerate
 * this file with: npx tsx scripts/generate-algorithm-properties.ts
 */

export interface AlgorithmProps {
  /** Canonical algorithm name (e.g., 'ML-KEM-768') */
  name: string
  /** Algorithm family from CSV (e.g., 'KEM', 'Signature', 'Classical KEM') */
  family: string
  /** Public key size in bytes */
  publicKeyBytes: number
  /** Private key size in bytes */
  privateKeyBytes: number
  /** Signature or ciphertext size in bytes */
  signatureOrCiphertextBytes: number
  /** Shared secret size in bytes (KEM algorithms only) */
  sharedSecretBytes?: number
  /** NIST security level (1, 2, 3, or 5) */
  securityLevel: number | null
  /** FIPS standard reference (e.g., 'FIPS 203') or null */
  fipsStandard: string | null
}

// ── Registry (auto-generated from fact_allowlists.json) ──────────────────

export const ALGORITHM_REGISTRY: Record<string, AlgorithmProps> = {
  // ── ML-KEM (FIPS 203) ──────────────────────────────────────────────────
  'ML-KEM-512': {
    name: 'ML-KEM-512',
    family: 'KEM',
    publicKeyBytes: 800,
    privateKeyBytes: 1632,
    signatureOrCiphertextBytes: 768,
    sharedSecretBytes: 32,
    securityLevel: 1,
    fipsStandard: 'FIPS 203',
  },
  'ML-KEM-768': {
    name: 'ML-KEM-768',
    family: 'KEM',
    publicKeyBytes: 1184,
    privateKeyBytes: 2400,
    signatureOrCiphertextBytes: 1088,
    sharedSecretBytes: 32,
    securityLevel: 3,
    fipsStandard: 'FIPS 203',
  },
  'ML-KEM-1024': {
    name: 'ML-KEM-1024',
    family: 'KEM',
    publicKeyBytes: 1568,
    privateKeyBytes: 3168,
    signatureOrCiphertextBytes: 1568,
    sharedSecretBytes: 32,
    securityLevel: 5,
    fipsStandard: 'FIPS 203',
  },

  // ── ML-DSA (FIPS 204) ─────────────────────────────────────────────────
  'ML-DSA-44': {
    name: 'ML-DSA-44',
    family: 'Signature',
    publicKeyBytes: 1312,
    privateKeyBytes: 2560,
    signatureOrCiphertextBytes: 2420,
    securityLevel: 2,
    fipsStandard: 'FIPS 204',
  },
  'ML-DSA-65': {
    name: 'ML-DSA-65',
    family: 'Signature',
    publicKeyBytes: 1952,
    privateKeyBytes: 4032,
    signatureOrCiphertextBytes: 3309,
    securityLevel: 3,
    fipsStandard: 'FIPS 204',
  },
  'ML-DSA-87': {
    name: 'ML-DSA-87',
    family: 'Signature',
    publicKeyBytes: 2592,
    privateKeyBytes: 4896,
    signatureOrCiphertextBytes: 4627,
    securityLevel: 5,
    fipsStandard: 'FIPS 204',
  },

  // ── SLH-DSA (FIPS 205) ────────────────────────────────────────────────
  'SLH-DSA-SHA2-128s': {
    name: 'SLH-DSA-SHA2-128s',
    family: 'Signature',
    publicKeyBytes: 32,
    privateKeyBytes: 64,
    signatureOrCiphertextBytes: 7856,
    securityLevel: 1,
    fipsStandard: 'FIPS 205',
  },
  'SLH-DSA-SHA2-128f': {
    name: 'SLH-DSA-SHA2-128f',
    family: 'Signature',
    publicKeyBytes: 32,
    privateKeyBytes: 64,
    signatureOrCiphertextBytes: 17088,
    securityLevel: 1,
    fipsStandard: 'FIPS 205',
  },
  'SLH-DSA-SHA2-192s': {
    name: 'SLH-DSA-SHA2-192s',
    family: 'Signature',
    publicKeyBytes: 48,
    privateKeyBytes: 96,
    signatureOrCiphertextBytes: 16224,
    securityLevel: 3,
    fipsStandard: 'FIPS 205',
  },
  'SLH-DSA-SHA2-192f': {
    name: 'SLH-DSA-SHA2-192f',
    family: 'Signature',
    publicKeyBytes: 48,
    privateKeyBytes: 96,
    signatureOrCiphertextBytes: 35664,
    securityLevel: 3,
    fipsStandard: 'FIPS 205',
  },
  'SLH-DSA-SHA2-256s': {
    name: 'SLH-DSA-SHA2-256s',
    family: 'Signature',
    publicKeyBytes: 64,
    privateKeyBytes: 128,
    signatureOrCiphertextBytes: 29792,
    securityLevel: 5,
    fipsStandard: 'FIPS 205',
  },
  'SLH-DSA-SHA2-256f': {
    name: 'SLH-DSA-SHA2-256f',
    family: 'Signature',
    publicKeyBytes: 64,
    privateKeyBytes: 128,
    signatureOrCiphertextBytes: 49856,
    securityLevel: 5,
    fipsStandard: 'FIPS 205',
  },
  'SLH-DSA-SHAKE-128s': {
    name: 'SLH-DSA-SHAKE-128s',
    family: 'Signature',
    publicKeyBytes: 32,
    privateKeyBytes: 64,
    signatureOrCiphertextBytes: 7856,
    securityLevel: 1,
    fipsStandard: 'FIPS 205',
  },
  'SLH-DSA-SHAKE-128f': {
    name: 'SLH-DSA-SHAKE-128f',
    family: 'Signature',
    publicKeyBytes: 32,
    privateKeyBytes: 64,
    signatureOrCiphertextBytes: 17088,
    securityLevel: 1,
    fipsStandard: 'FIPS 205',
  },
  'SLH-DSA-SHAKE-192s': {
    name: 'SLH-DSA-SHAKE-192s',
    family: 'Signature',
    publicKeyBytes: 48,
    privateKeyBytes: 96,
    signatureOrCiphertextBytes: 16224,
    securityLevel: 3,
    fipsStandard: 'FIPS 205',
  },
  'SLH-DSA-SHAKE-192f': {
    name: 'SLH-DSA-SHAKE-192f',
    family: 'Signature',
    publicKeyBytes: 48,
    privateKeyBytes: 96,
    signatureOrCiphertextBytes: 35664,
    securityLevel: 3,
    fipsStandard: 'FIPS 205',
  },
  'SLH-DSA-SHAKE-256s': {
    name: 'SLH-DSA-SHAKE-256s',
    family: 'Signature',
    publicKeyBytes: 64,
    privateKeyBytes: 128,
    signatureOrCiphertextBytes: 29792,
    securityLevel: 5,
    fipsStandard: 'FIPS 205',
  },
  'SLH-DSA-SHAKE-256f': {
    name: 'SLH-DSA-SHAKE-256f',
    family: 'Signature',
    publicKeyBytes: 64,
    privateKeyBytes: 128,
    signatureOrCiphertextBytes: 49856,
    securityLevel: 5,
    fipsStandard: 'FIPS 205',
  },

  // ── FN-DSA (FIPS 206, draft) ──────────────────────────────────────────
  'FN-DSA-512': {
    name: 'FN-DSA-512',
    family: 'Signature',
    publicKeyBytes: 897,
    privateKeyBytes: 1281,
    signatureOrCiphertextBytes: 666,
    securityLevel: 1,
    fipsStandard: 'FIPS 206',
  },
  'FN-DSA-1024': {
    name: 'FN-DSA-1024',
    family: 'Signature',
    publicKeyBytes: 1793,
    privateKeyBytes: 2305,
    signatureOrCiphertextBytes: 1280,
    securityLevel: 5,
    fipsStandard: 'FIPS 206',
  },

  // ── FrodoKEM (not NIST-selected) ──────────────────────────────────────
  'FrodoKEM-640': {
    name: 'FrodoKEM-640',
    family: 'KEM',
    publicKeyBytes: 9616,
    privateKeyBytes: 19888,
    signatureOrCiphertextBytes: 9752,
    sharedSecretBytes: 16,
    securityLevel: 1,
    fipsStandard: null,
  },
  'FrodoKEM-976': {
    name: 'FrodoKEM-976',
    family: 'KEM',
    publicKeyBytes: 15632,
    privateKeyBytes: 31296,
    signatureOrCiphertextBytes: 15792,
    sharedSecretBytes: 24,
    securityLevel: 3,
    fipsStandard: null,
  },
  'FrodoKEM-1344': {
    name: 'FrodoKEM-1344',
    family: 'KEM',
    publicKeyBytes: 21520,
    privateKeyBytes: 43088,
    signatureOrCiphertextBytes: 21696,
    sharedSecretBytes: 32,
    securityLevel: 5,
    fipsStandard: null,
  },

  // ── HQC (selected for standardization 2025) ──────────────────────────
  'HQC-128': {
    name: 'HQC-128',
    family: 'KEM',
    publicKeyBytes: 2249,
    privateKeyBytes: 2305,
    signatureOrCiphertextBytes: 4433,
    sharedSecretBytes: 64,
    securityLevel: 1,
    fipsStandard: null,
  },
  'HQC-192': {
    name: 'HQC-192',
    family: 'KEM',
    publicKeyBytes: 4522,
    privateKeyBytes: 4586,
    signatureOrCiphertextBytes: 8978,
    sharedSecretBytes: 64,
    securityLevel: 3,
    fipsStandard: null,
  },
  'HQC-256': {
    name: 'HQC-256',
    family: 'KEM',
    publicKeyBytes: 7245,
    privateKeyBytes: 7317,
    signatureOrCiphertextBytes: 14421,
    sharedSecretBytes: 64,
    securityLevel: 5,
    fipsStandard: null,
  },

  // ── Classic McEliece ──────────────────────────────────────────────────
  'Classic-McEliece-348864': {
    name: 'Classic-McEliece-348864',
    family: 'KEM',
    publicKeyBytes: 261120,
    privateKeyBytes: 6492,
    signatureOrCiphertextBytes: 96,
    sharedSecretBytes: 32,
    securityLevel: 1,
    fipsStandard: null,
  },
  'Classic-McEliece-460896': {
    name: 'Classic-McEliece-460896',
    family: 'KEM',
    publicKeyBytes: 524160,
    privateKeyBytes: 13608,
    signatureOrCiphertextBytes: 156,
    sharedSecretBytes: 32,
    securityLevel: 3,
    fipsStandard: null,
  },
  'Classic-McEliece-8192128': {
    name: 'Classic-McEliece-8192128',
    family: 'KEM',
    publicKeyBytes: 1357824,
    privateKeyBytes: 14120,
    signatureOrCiphertextBytes: 208,
    sharedSecretBytes: 32,
    securityLevel: 5,
    fipsStandard: null,
  },

  // ── Stateful hash-based signatures ────────────────────────────────────
  'LMS-SHA256 (H20/W8)': {
    name: 'LMS-SHA256 (H20/W8)',
    family: 'Signature',
    publicKeyBytes: 60,
    privateKeyBytes: 64,
    signatureOrCiphertextBytes: 1776,
    securityLevel: null,
    fipsStandard: 'NIST SP 800-208',
  },
  'XMSS-SHA2_20': {
    name: 'XMSS-SHA2_20',
    family: 'Signature',
    publicKeyBytes: 64,
    privateKeyBytes: 2573,
    signatureOrCiphertextBytes: 2820,
    securityLevel: null,
    fipsStandard: 'NIST SP 800-208',
  },

  // ── Classical algorithms (for comparison) ─────────────────────────────
  'RSA-2048': {
    name: 'RSA-2048',
    family: 'Classical Sig',
    publicKeyBytes: 270,
    privateKeyBytes: 1190,
    signatureOrCiphertextBytes: 256,
    sharedSecretBytes: 256,
    securityLevel: null,
    fipsStandard: 'FIPS 186',
  },
  'RSA-3072': {
    name: 'RSA-3072',
    family: 'Classical Sig',
    publicKeyBytes: 398,
    privateKeyBytes: 1770,
    signatureOrCiphertextBytes: 384,
    sharedSecretBytes: 384,
    securityLevel: null,
    fipsStandard: 'FIPS 186',
  },
  'RSA-4096': {
    name: 'RSA-4096',
    family: 'Classical Sig',
    publicKeyBytes: 526,
    privateKeyBytes: 2350,
    signatureOrCiphertextBytes: 512,
    sharedSecretBytes: 512,
    securityLevel: null,
    fipsStandard: 'FIPS 186',
  },
  'ECDSA P-256': {
    name: 'ECDSA P-256',
    family: 'Classical Sig',
    publicKeyBytes: 64,
    privateKeyBytes: 32,
    signatureOrCiphertextBytes: 64,
    securityLevel: null,
    fipsStandard: 'FIPS 186',
  },
  'ECDSA P-384': {
    name: 'ECDSA P-384',
    family: 'Classical Sig',
    publicKeyBytes: 96,
    privateKeyBytes: 48,
    signatureOrCiphertextBytes: 96,
    securityLevel: null,
    fipsStandard: 'FIPS 186',
  },
  Ed25519: {
    name: 'Ed25519',
    family: 'Classical Sig',
    publicKeyBytes: 32,
    privateKeyBytes: 64,
    signatureOrCiphertextBytes: 64,
    securityLevel: null,
    fipsStandard: null,
  },
  X25519: {
    name: 'X25519',
    family: 'Classical KEM',
    publicKeyBytes: 32,
    privateKeyBytes: 32,
    sharedSecretBytes: 32,
    signatureOrCiphertextBytes: 0,
    securityLevel: null,
    fipsStandard: null,
  },
  'ECDH P-256': {
    name: 'ECDH P-256',
    family: 'Classical KEM',
    publicKeyBytes: 64,
    privateKeyBytes: 32,
    sharedSecretBytes: 32,
    signatureOrCiphertextBytes: 0,
    securityLevel: null,
    fipsStandard: null,
  },
  'ECDH P-384': {
    name: 'ECDH P-384',
    family: 'Classical KEM',
    publicKeyBytes: 96,
    privateKeyBytes: 48,
    sharedSecretBytes: 48,
    signatureOrCiphertextBytes: 0,
    securityLevel: null,
    fipsStandard: null,
  },
}

// ── Lookup function ──────────────────────────────────────────────────────

/**
 * Look up algorithm properties by canonical name.
 * Throws if the algorithm is not in the registry — this is intentional:
 * a build-time error is better than a silent wrong value.
 */
export function getAlgorithm(name: string): AlgorithmProps {
  const algo = ALGORITHM_REGISTRY[name]
  if (!algo) {
    throw new Error(
      `[algorithmProperties] Unknown algorithm: "${name}". ` +
        'Add it to the algorithm CSV or fact_allowlists.json, then regenerate this registry.'
    )
  }
  return algo
}

/** Get all algorithms matching a family (e.g., 'KEM', 'Signature') */
export function getAlgorithmsByFamily(family: string): AlgorithmProps[] {
  return Object.values(ALGORITHM_REGISTRY).filter((a) => a.family === family)
}

/** Get all algorithms for a FIPS standard (e.g., 'FIPS 203') */
export function getAlgorithmsByFips(fips: string): AlgorithmProps[] {
  return Object.values(ALGORITHM_REGISTRY).filter((a) => a.fipsStandard === fips)
}
