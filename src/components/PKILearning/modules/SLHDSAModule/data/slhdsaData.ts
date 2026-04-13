// SPDX-License-Identifier: GPL-3.0-only
// FIPS 205 Table 2 — SLH-DSA parameter sets

export type HashFamily = 'SHA-2' | 'SHAKE'
export type SpeedVariant = 's' | 'f'
export type SecurityLevel = 1 | 3 | 5

export interface SLHDSAParameterSet {
  /** Canonical FIPS 205 name, e.g. "SLH-DSA-SHA2-128s" */
  id: string
  /** Short label used in UI dropdowns */
  label: string
  /** Underlying hash family */
  hashFamily: HashFamily
  /** Security level: s = small signature, f = fast signing */
  variant: SpeedVariant
  /** NIST security level (1, 3, or 5) */
  securityLevel: SecurityLevel
  /** Claimed classical security in bits */
  classicalBits: number
  /** n: security parameter (bytes) */
  n: number
  /** h: total hypertree height */
  h: number
  /** d: number of hypertree layers */
  d: number
  /** a: FORS tree height */
  a: number
  /** k: number of FORS trees */
  k: number
  /** lg_w: Winternitz parameter (log2); fixed at 4 in FIPS 205 */
  lgW: number
  /** m: message digest length (bytes) */
  m: number
  /** Signature size in bytes (FIPS 205 Table 2) */
  sigBytes: number
  /** Public key size in bytes */
  pkBytes: number
  /** Secret key size in bytes */
  skBytes: number
  /** PKCS#11 v3.2 mechanism for Pure SLH-DSA */
  ckm: string
  /** Human-readable description of the tradeoff */
  tradeoffNote: string
}

export const SLH_DSA_PARAMETER_SETS: SLHDSAParameterSet[] = [
  // ── SHA-2 family ──────────────────────────────────────────────────────────
  {
    id: 'SLH-DSA-SHA2-128s',
    label: 'SHA2-128s',
    hashFamily: 'SHA-2',
    variant: 's',
    securityLevel: 1,
    classicalBits: 128,
    n: 16,
    h: 63,
    d: 7,
    a: 12,
    k: 14,
    lgW: 4,
    m: 30,
    sigBytes: 7856,
    pkBytes: 32,
    skBytes: 64,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote: 'Smallest signature (7,856 B) at NIST Level 1; slower signing due to d=7 layers.',
  },
  {
    id: 'SLH-DSA-SHA2-128f',
    label: 'SHA2-128f',
    hashFamily: 'SHA-2',
    variant: 'f',
    securityLevel: 1,
    classicalBits: 128,
    n: 16,
    h: 66,
    d: 22,
    a: 6,
    k: 33,
    lgW: 4,
    m: 34,
    sigBytes: 17088,
    pkBytes: 32,
    skBytes: 64,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote: 'Faster signing (d=22 layers) at the cost of a larger signature (17,088 B).',
  },
  {
    id: 'SLH-DSA-SHA2-192s',
    label: 'SHA2-192s',
    hashFamily: 'SHA-2',
    variant: 's',
    securityLevel: 3,
    classicalBits: 192,
    n: 24,
    h: 63,
    d: 7,
    a: 14,
    k: 17,
    lgW: 4,
    m: 39,
    sigBytes: 16224,
    pkBytes: 48,
    skBytes: 96,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote:
      'Smallest signature (16,224 B) at NIST Level 3; recommended by BSI TR-02102 for government use.',
  },
  {
    id: 'SLH-DSA-SHA2-192f',
    label: 'SHA2-192f',
    hashFamily: 'SHA-2',
    variant: 'f',
    securityLevel: 3,
    classicalBits: 192,
    n: 24,
    h: 66,
    d: 22,
    a: 8,
    k: 33,
    lgW: 4,
    m: 42,
    sigBytes: 35664,
    pkBytes: 48,
    skBytes: 96,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote: 'Faster signing at NIST Level 3; signature grows to 35,664 B.',
  },
  {
    id: 'SLH-DSA-SHA2-256s',
    label: 'SHA2-256s',
    hashFamily: 'SHA-2',
    variant: 's',
    securityLevel: 5,
    classicalBits: 256,
    n: 32,
    h: 64,
    d: 8,
    a: 14,
    k: 22,
    lgW: 4,
    m: 47,
    sigBytes: 29792,
    pkBytes: 64,
    skBytes: 128,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote:
      'Smallest signature (29,792 B) at NIST Level 5; highest security, slower signing.',
  },
  {
    id: 'SLH-DSA-SHA2-256f',
    label: 'SHA2-256f',
    hashFamily: 'SHA-2',
    variant: 'f',
    securityLevel: 5,
    classicalBits: 256,
    n: 32,
    h: 68,
    d: 17,
    a: 9,
    k: 35,
    lgW: 4,
    m: 49,
    sigBytes: 49856,
    pkBytes: 64,
    skBytes: 128,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote: 'Fastest signing at NIST Level 5; largest signature in the standard (49,856 B).',
  },

  // ── SHAKE family ──────────────────────────────────────────────────────────
  {
    id: 'SLH-DSA-SHAKE-128s',
    label: 'SHAKE-128s',
    hashFamily: 'SHAKE',
    variant: 's',
    securityLevel: 1,
    classicalBits: 128,
    n: 16,
    h: 63,
    d: 7,
    a: 12,
    k: 14,
    lgW: 4,
    m: 30,
    sigBytes: 7856,
    pkBytes: 32,
    skBytes: 64,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote: 'SHAKE256 variant of SHA2-128s; identical sizes, different PRF instantiation.',
  },
  {
    id: 'SLH-DSA-SHAKE-128f',
    label: 'SHAKE-128f',
    hashFamily: 'SHAKE',
    variant: 'f',
    securityLevel: 1,
    classicalBits: 128,
    n: 16,
    h: 66,
    d: 22,
    a: 6,
    k: 33,
    lgW: 4,
    m: 34,
    sigBytes: 17088,
    pkBytes: 32,
    skBytes: 64,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote:
      'SHAKE256 variant of SHA2-128f; faster signing at the cost of 17,088 B signature.',
  },
  {
    id: 'SLH-DSA-SHAKE-192s',
    label: 'SHAKE-192s',
    hashFamily: 'SHAKE',
    variant: 's',
    securityLevel: 3,
    classicalBits: 192,
    n: 24,
    h: 63,
    d: 7,
    a: 14,
    k: 17,
    lgW: 4,
    m: 39,
    sigBytes: 16224,
    pkBytes: 48,
    skBytes: 96,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote: 'SHAKE256 variant of SHA2-192s; same sizes, SHAKE256 PRF.',
  },
  {
    id: 'SLH-DSA-SHAKE-192f',
    label: 'SHAKE-192f',
    hashFamily: 'SHAKE',
    variant: 'f',
    securityLevel: 3,
    classicalBits: 192,
    n: 24,
    h: 66,
    d: 22,
    a: 8,
    k: 33,
    lgW: 4,
    m: 42,
    sigBytes: 35664,
    pkBytes: 48,
    skBytes: 96,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote: 'SHAKE256 fast variant at Level 3; 35,664 B signature.',
  },
  {
    id: 'SLH-DSA-SHAKE-256s',
    label: 'SHAKE-256s',
    hashFamily: 'SHAKE',
    variant: 's',
    securityLevel: 5,
    classicalBits: 256,
    n: 32,
    h: 64,
    d: 8,
    a: 14,
    k: 22,
    lgW: 4,
    m: 47,
    sigBytes: 29792,
    pkBytes: 64,
    skBytes: 128,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote: 'SHAKE256 small variant at Level 5; 29,792 B signature.',
  },
  {
    id: 'SLH-DSA-SHAKE-256f',
    label: 'SHAKE-256f',
    hashFamily: 'SHAKE',
    variant: 'f',
    securityLevel: 5,
    classicalBits: 256,
    n: 32,
    h: 68,
    d: 17,
    a: 9,
    k: 35,
    lgW: 4,
    m: 49,
    sigBytes: 49856,
    pkBytes: 64,
    skBytes: 128,
    ckm: 'CKM_SLH_DSA',
    tradeoffNote: 'SHAKE256 fast variant at Level 5; largest signature in the standard (49,856 B).',
  },
]

/** Lookup by canonical FIPS 205 id */
export const SLH_DSA_PARAM_BY_ID: Record<string, SLHDSAParameterSet> = Object.fromEntries(
  SLH_DSA_PARAMETER_SETS.map((p) => [p.id, p])
)

/** All SHA-2 parameter sets */
export const SHA2_PARAMS = SLH_DSA_PARAMETER_SETS.filter((p) => p.hashFamily === 'SHA-2')

/** All SHAKE parameter sets */
export const SHAKE_PARAMS = SLH_DSA_PARAMETER_SETS.filter((p) => p.hashFamily === 'SHAKE')

/** Parameter sets grouped by NIST security level */
export const PARAMS_BY_LEVEL: Record<SecurityLevel, SLHDSAParameterSet[]> = {
  1: SLH_DSA_PARAMETER_SETS.filter((p) => p.securityLevel === 1),
  3: SLH_DSA_PARAMETER_SETS.filter((p) => p.securityLevel === 3),
  5: SLH_DSA_PARAMETER_SETS.filter((p) => p.securityLevel === 5),
}

/** PKCS#11 v3.2 HashSLH-DSA mechanisms (FIPS 205 §11) */
export const HASH_SLH_DSA_MECHANISMS = [
  { id: 'CKM_HASH_SLH_DSA_SHA256', label: 'HashSLH-DSA-SHA256', hashAlg: 'SHA-256' },
  { id: 'CKM_HASH_SLH_DSA_SHA384', label: 'HashSLH-DSA-SHA384', hashAlg: 'SHA-384' },
  { id: 'CKM_HASH_SLH_DSA_SHA512', label: 'HashSLH-DSA-SHA512', hashAlg: 'SHA-512' },
  { id: 'CKM_HASH_SLH_DSA_SHAKE128', label: 'HashSLH-DSA-SHAKE128', hashAlg: 'SHAKE-128' },
  { id: 'CKM_HASH_SLH_DSA_SHAKE256', label: 'HashSLH-DSA-SHAKE256', hashAlg: 'SHAKE-256' },
] as const
