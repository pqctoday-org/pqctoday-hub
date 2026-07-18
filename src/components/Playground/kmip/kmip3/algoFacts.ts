// SPDX-License-Identifier: GPL-3.0-only
//
// algoFacts.ts — real published algorithm size/security facts (FIPS 203/204/
//205 parameter tables; classical sizes are the standard textbook figures),
// ported from the design handoff's cacp3-glossary.js `ALGO_INFO`. Drives
// Learn's classical↔PQC comparison tables. Kept as its own file, keyed by
// algorithm string — NOT merged into `kmipMeta.ts`'s `AlgoChoice.sizes`,
// which is a different concept (picker bit-length options, e.g. RSA's
// 2048/3072/4096 choices) from these byte-size facts. All sizes in bytes
// unless noted.
export interface AlgoFacts {
  family: 'classical' | 'symmetric' | 'pqc' | 'hybrid'
  kind: 'signature' | 'kem' | 'symmetric'
  standard: string
  basis: string
  pub?: number
  priv?: number
  sig?: number
  sigNote?: string
  ct?: number
  secret?: number
  key?: number
  tag?: number
  iv?: number
  /** ECDH/X25519: no KMIP wire operation carries the agreement itself. */
  noWireOp?: boolean
  composedOf?: [string, string]
}

export const ALGO_FACTS: Record<string, AlgoFacts> = {
  'RSA-2048': {
    family: 'classical',
    kind: 'signature',
    standard: 'PKCS#1 v1.5 / FIPS 186-5',
    basis: 'Integer factorization',
    pub: 256,
    priv: 1192,
    sig: 256,
  },
  'RSA-3072': {
    family: 'classical',
    kind: 'signature',
    standard: 'PKCS#1 v1.5 / FIPS 186-5',
    basis: 'Integer factorization',
    pub: 384,
    priv: 1770,
    sig: 384,
  },
  'RSA-4096': {
    family: 'classical',
    kind: 'signature',
    standard: 'PKCS#1 v1.5 / FIPS 186-5',
    basis: 'Integer factorization',
    pub: 512,
    priv: 2348,
    sig: 512,
  },
  'ECDSA-P256': {
    family: 'classical',
    kind: 'signature',
    standard: 'FIPS 186-5 / SEC1',
    basis: 'Elliptic-curve discrete log',
    pub: 64,
    sig: 70,
    sigNote: '~70, DER-encoded (64 raw r‖s)',
  },
  'ECDH-P256': {
    family: 'classical',
    kind: 'kem',
    standard: 'SP 800-56A',
    basis: 'Elliptic-curve Diffie-Hellman',
    pub: 64,
    secret: 32,
    noWireOp: true,
  },
  X25519: {
    family: 'classical',
    kind: 'kem',
    standard: 'RFC 7748',
    basis: 'Curve25519 Diffie-Hellman',
    pub: 32,
    secret: 32,
    noWireOp: true,
  },
  'AES-256': {
    family: 'symmetric',
    kind: 'symmetric',
    standard: 'FIPS 197 + SP 800-38D (GCM)',
    basis: 'Symmetric block cipher (Grover-resistant at 256-bit)',
    key: 32,
    tag: 16,
    iv: 12,
  },
  'ML-DSA-44': {
    family: 'pqc',
    kind: 'signature',
    standard: 'FIPS 204',
    basis: 'Module-lattice (Fiat-Shamir with Aborts)',
    pub: 1312,
    priv: 2560,
    sig: 2420,
  },
  'ML-DSA-65': {
    family: 'pqc',
    kind: 'signature',
    standard: 'FIPS 204',
    basis: 'Module-lattice (Fiat-Shamir with Aborts)',
    pub: 1952,
    priv: 4032,
    sig: 3309,
  },
  'ML-DSA-87': {
    family: 'pqc',
    kind: 'signature',
    standard: 'FIPS 204',
    basis: 'Module-lattice (Fiat-Shamir with Aborts)',
    pub: 2592,
    priv: 4896,
    sig: 4627,
  },
  'ML-KEM-512': {
    family: 'pqc',
    kind: 'kem',
    standard: 'FIPS 203',
    basis: 'Module-lattice (Learning With Errors)',
    pub: 800,
    priv: 1632,
    ct: 768,
    secret: 32,
  },
  'ML-KEM-768': {
    family: 'pqc',
    kind: 'kem',
    standard: 'FIPS 203',
    basis: 'Module-lattice (Learning With Errors)',
    pub: 1184,
    priv: 2400,
    ct: 1088,
    secret: 32,
  },
  'ML-KEM-1024': {
    family: 'pqc',
    kind: 'kem',
    standard: 'FIPS 203',
    basis: 'Module-lattice (Learning With Errors)',
    pub: 1568,
    priv: 3168,
    ct: 1568,
    secret: 32,
  },
  'SLH-DSA-SHA2-128f': {
    family: 'pqc',
    kind: 'signature',
    standard: 'FIPS 205',
    basis: 'Hash-based (stateless: FORS + WOTS+ + Merkle)',
    pub: 32,
    priv: 64,
    sig: 17088,
  },
  'SLH-DSA-SHA2-128s': {
    family: 'pqc',
    kind: 'signature',
    standard: 'FIPS 205',
    basis: 'Hash-based (stateless: FORS + WOTS+ + Merkle)',
    pub: 32,
    priv: 64,
    sig: 7856,
  },
  'SLH-DSA-SHA2-192s': {
    family: 'pqc',
    kind: 'signature',
    standard: 'FIPS 205',
    basis: 'Hash-based (stateless: FORS + WOTS+ + Merkle)',
    pub: 48,
    priv: 96,
    sig: 16224,
  },
  'SLH-DSA-SHA2-256s': {
    family: 'pqc',
    kind: 'signature',
    standard: 'FIPS 205',
    basis: 'Hash-based (stateless: FORS + WOTS+ + Merkle)',
    pub: 64,
    priv: 128,
    sig: 29792,
  },
  X25519MLKEM768: {
    family: 'hybrid',
    kind: 'kem',
    standard:
      'KMIP 3.0 WD19 draft codepoint 0x5C; public-key/ciphertext sizes per draft-ietf-tls-ecdhe-mlkem',
    // The IETF draft itself specifies a 64 B raw concatenation (32 B ML-KEM
    // || 32 B X25519), no KDF — the 32 B combined secret below is this
    // engine's own construction, not the draft's.
    basis: 'Hybrid: X25519 + ML-KEM-768; this engine combines both secrets via a KDF into 32 B',
    pub: 1216,
    ct: 1120,
    secret: 32,
    composedOf: ['X25519', 'ML-KEM-768'],
  },
}

export const fmtBytes = (n: number | undefined): string =>
  n === undefined ? '—' : `${n.toLocaleString('en-US')} B`
