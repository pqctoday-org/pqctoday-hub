// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tile configuration for the Algorithms › Validation › KAT view. Moved out of
 * KATView.tsx (ACVP remediation WS-A, 2026-09-24) so the evidence-label static
 * test (src/utils/katEvidence.test.ts) can inspect every tile. Tiles carry the
 * operation and the specs only; which evidence class a spec rests on comes
 * from the generated per-case record of the exact case it runs (manifest +
 * registry, katEvidence.ts), so no tile can claim "ACVP" for a test that reads
 * an RFC example, an oracle value or nothing at all.
 */
import type { KatTestSpec, SlhDsaVariant } from '@/utils/katRunner'

export const FIPS_203_URL = 'https://csrc.nist.gov/pubs/fips/203/final'
export const FIPS_204_URL = 'https://csrc.nist.gov/pubs/fips/204/final'
export const FIPS_205_URL = 'https://csrc.nist.gov/pubs/fips/205/final'
export const SP_800_38D_URL = 'https://csrc.nist.gov/pubs/sp/800/38/d/final'
export const SP_800_38A_URL = 'https://csrc.nist.gov/pubs/sp/800/38/a/final'
export const RFC_3394_URL = 'https://www.rfc-editor.org/rfc/rfc3394'
export const FIPS_198_URL = 'https://csrc.nist.gov/pubs/fips/198-1/final'
export const FIPS_180_URL = 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final'
export const FIPS_202_URL = 'https://csrc.nist.gov/pubs/fips/202/final'
export const FIPS_186_URL = 'https://csrc.nist.gov/pubs/fips/186-5/final'
export const RFC_8032_URL = 'https://www.rfc-editor.org/rfc/rfc8032'
export const RFC_8018_URL = 'https://www.rfc-editor.org/rfc/rfc8018'
export const RFC_5869_URL = 'https://www.rfc-editor.org/rfc/rfc5869'

export interface KATTileConfig {
  id: string
  name: string
  standard: string
  fipsUrl: string
  /** NIST level (1-5) for PQC, or bit strength (128/192/256) for classical */
  securityLevel: number
  /**
   * Operation label per spec, index-aligned with `specs` (operation only —
   * the evidence class shown next to it is derived by katEvidence.ts from the
   * vector file the spec reads, never written here).
   */
  operations: string[]
  specs: KatTestSpec[]
}

export const ML_KEM_TILES: KATTileConfig[] = [
  {
    id: 'mlkem-512',
    name: 'ML-KEM-512',
    standard: 'FIPS 203',
    fipsUrl: FIPS_203_URL,
    securityLevel: 1,
    operations: ['Decapsulation', 'Encap+decap round-trip'],
    specs: [
      {
        id: 'kat-algo-mlkem512-decap',
        useCase: 'ML-KEM-512 decapsulation',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-decap', variant: 512 },
      },
      {
        id: 'kat-algo-mlkem512-rt',
        useCase: 'ML-KEM-512 encap+decap round-trip',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-encap-roundtrip', variant: 512 },
      },
    ],
  },
  {
    id: 'mlkem-768',
    name: 'ML-KEM-768',
    standard: 'FIPS 203',
    fipsUrl: FIPS_203_URL,
    securityLevel: 3,
    operations: ['Decapsulation', 'Encap+decap round-trip'],
    specs: [
      {
        id: 'kat-algo-mlkem768-decap',
        useCase: 'ML-KEM-768 decapsulation',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-decap', variant: 768 },
      },
      {
        id: 'kat-algo-mlkem768-rt',
        useCase: 'ML-KEM-768 encap+decap round-trip',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
      },
    ],
  },
  {
    id: 'mlkem-1024',
    name: 'ML-KEM-1024',
    standard: 'FIPS 203',
    fipsUrl: FIPS_203_URL,
    securityLevel: 5,
    operations: ['Decapsulation', 'Encap+decap round-trip'],
    specs: [
      {
        id: 'kat-algo-mlkem1024-decap',
        useCase: 'ML-KEM-1024 decapsulation',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-decap', variant: 1024 },
      },
      {
        id: 'kat-algo-mlkem1024-rt',
        useCase: 'ML-KEM-1024 encap+decap round-trip',
        standard: 'FIPS 203',
        referenceUrl: FIPS_203_URL,
        kind: { type: 'mlkem-encap-roundtrip', variant: 1024 },
      },
    ],
  },
]

export const ML_DSA_TILES: KATTileConfig[] = [
  {
    id: 'mldsa-44',
    name: 'ML-DSA-44',
    standard: 'FIPS 204',
    fipsUrl: FIPS_204_URL,
    securityLevel: 2,
    operations: [
      'Signature verification',
      'Sign+verify round-trip',
      'Dedicated sigVer — valid signature accepted',
      'Dedicated sigVer — modified input rejected',
    ],
    specs: [
      {
        id: 'kat-algo-mldsa44-sigver',
        useCase: 'ML-DSA-44 signature verification',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver', variant: 44 },
      },
      {
        id: 'kat-algo-mldsa44-rt',
        useCase: 'ML-DSA-44 sign+verify round-trip',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-functional', variant: 44 },
      },
      {
        id: 'kat-algo-mldsa44-sigver-nist-valid',
        useCase: 'ML-DSA-44 dedicated sigVer, valid case',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver-nist', variant: 44, expect: 'valid' },
      },
      {
        id: 'kat-algo-mldsa44-sigver-nist-invalid',
        useCase: 'ML-DSA-44 dedicated sigVer, invalid case',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver-nist', variant: 44, expect: 'invalid' },
      },
    ],
  },
  {
    id: 'mldsa-65',
    name: 'ML-DSA-65',
    standard: 'FIPS 204',
    fipsUrl: FIPS_204_URL,
    securityLevel: 3,
    operations: [
      'Signature verification',
      'Sign+verify round-trip',
      'Dedicated sigVer — valid signature accepted',
      'Dedicated sigVer — modified input rejected',
    ],
    specs: [
      {
        id: 'kat-algo-mldsa65-sigver',
        useCase: 'ML-DSA-65 signature verification',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver', variant: 65 },
      },
      {
        id: 'kat-algo-mldsa65-rt',
        useCase: 'ML-DSA-65 sign+verify round-trip',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-functional', variant: 65 },
      },
      {
        id: 'kat-algo-mldsa65-sigver-nist-valid',
        useCase: 'ML-DSA-65 dedicated sigVer, valid case',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver-nist', variant: 65, expect: 'valid' },
      },
      {
        id: 'kat-algo-mldsa65-sigver-nist-invalid',
        useCase: 'ML-DSA-65 dedicated sigVer, invalid case',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver-nist', variant: 65, expect: 'invalid' },
      },
    ],
  },
  {
    id: 'mldsa-87',
    name: 'ML-DSA-87',
    standard: 'FIPS 204',
    fipsUrl: FIPS_204_URL,
    securityLevel: 5,
    operations: [
      'Signature verification',
      'Sign+verify round-trip',
      'Dedicated sigVer — valid signature accepted',
      'Dedicated sigVer — modified input rejected',
    ],
    specs: [
      {
        id: 'kat-algo-mldsa87-sigver',
        useCase: 'ML-DSA-87 signature verification',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver', variant: 87 },
      },
      {
        id: 'kat-algo-mldsa87-rt',
        useCase: 'ML-DSA-87 sign+verify round-trip',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-functional', variant: 87 },
      },
      {
        id: 'kat-algo-mldsa87-sigver-nist-valid',
        useCase: 'ML-DSA-87 dedicated sigVer, valid case',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver-nist', variant: 87, expect: 'valid' },
      },
      {
        id: 'kat-algo-mldsa87-sigver-nist-invalid',
        useCase: 'ML-DSA-87 dedicated sigVer, invalid case',
        standard: 'FIPS 204',
        referenceUrl: FIPS_204_URL,
        kind: { type: 'mldsa-sigver-nist', variant: 87, expect: 'invalid' },
      },
    ],
  },
]

// ── SLH-DSA variant data ────────────────────────────────────────────────────

export const SLH_DSA_VARIANTS: { value: SlhDsaVariant; label: string; level: number }[] = [
  { value: 'SHA2-128s', label: 'SHA2-128s', level: 1 },
  { value: 'SHA2-128f', label: 'SHA2-128f', level: 1 },
  { value: 'SHA2-192s', label: 'SHA2-192s', level: 3 },
  { value: 'SHA2-192f', label: 'SHA2-192f', level: 3 },
  { value: 'SHA2-256s', label: 'SHA2-256s', level: 5 },
  { value: 'SHA2-256f', label: 'SHA2-256f', level: 5 },
  { value: 'SHAKE-128s', label: 'SHAKE-128s', level: 1 },
  { value: 'SHAKE-128f', label: 'SHAKE-128f', level: 1 },
  { value: 'SHAKE-192s', label: 'SHAKE-192s', level: 3 },
  { value: 'SHAKE-192f', label: 'SHAKE-192f', level: 3 },
  { value: 'SHAKE-256s', label: 'SHAKE-256s', level: 5 },
  { value: 'SHAKE-256f', label: 'SHAKE-256f', level: 5 },
]

export const SLH_DSA_DROPDOWN_ITEMS = SLH_DSA_VARIANTS.map((v) => ({
  id: v.value,
  label: `SLH-DSA-${v.label} (Level ${v.level})`,
}))

// ── AES Symmetric tiles ─────────────────────────────────────────────────────

export const AES_TILES: KATTileConfig[] = [
  {
    id: 'aesgcm',
    name: 'AES-256-GCM',
    standard: 'SP 800-38D',
    fipsUrl: SP_800_38D_URL,
    securityLevel: 256,
    operations: ['Decryption'],
    specs: [
      {
        id: 'kat-algo-aesgcm',
        useCase: 'AES-256-GCM decryption',
        standard: 'SP 800-38D',
        referenceUrl: SP_800_38D_URL,
        kind: { type: 'aesgcm-decrypt' },
      },
    ],
  },
  {
    id: 'aescbc',
    name: 'AES-256-CBC',
    standard: 'SP 800-38A',
    fipsUrl: SP_800_38A_URL,
    securityLevel: 256,
    operations: ['Decryption'],
    specs: [
      {
        id: 'kat-algo-aescbc',
        useCase: 'AES-256-CBC decryption',
        standard: 'SP 800-38A',
        referenceUrl: SP_800_38A_URL,
        kind: { type: 'aescbc-decrypt' },
      },
    ],
  },
  {
    id: 'aesctr',
    name: 'AES-256-CTR',
    standard: 'SP 800-38A',
    fipsUrl: SP_800_38A_URL,
    securityLevel: 256,
    operations: ['Encrypt+decrypt'],
    specs: [
      {
        id: 'kat-algo-aesctr',
        useCase: 'AES-256-CTR encrypt+decrypt round-trip',
        standard: 'SP 800-38A',
        referenceUrl: SP_800_38A_URL,
        kind: { type: 'aesctr-roundtrip' },
      },
    ],
  },
  {
    id: 'aeskw',
    name: 'AES Key Wrap',
    standard: 'RFC 3394',
    fipsUrl: RFC_3394_URL,
    securityLevel: 256,
    operations: ['Key wrap'],
    specs: [
      {
        id: 'kat-algo-aeskw',
        useCase: 'AES Key Wrap',
        standard: 'RFC 3394',
        referenceUrl: RFC_3394_URL,
        kind: { type: 'aeskw-wrap' },
      },
    ],
  },
]

// ── HMAC / Hash tiles ───────────────────────────────────────────────────────

export const HMAC_HASH_TILES: KATTileConfig[] = [
  {
    id: 'hmac-sha256',
    name: 'HMAC-SHA-256',
    standard: 'FIPS 198-1',
    fipsUrl: FIPS_198_URL,
    securityLevel: 128,
    operations: ['MAC verification'],
    specs: [
      {
        id: 'kat-algo-hmac256',
        useCase: 'HMAC-SHA-256 verification',
        standard: 'FIPS 198-1',
        referenceUrl: FIPS_198_URL,
        kind: { type: 'hmac-verify', hashAlg: 'SHA-256' },
      },
    ],
  },
  {
    id: 'hmac-sha384',
    name: 'HMAC-SHA-384',
    standard: 'FIPS 198-1',
    fipsUrl: FIPS_198_URL,
    securityLevel: 192,
    operations: ['MAC verification'],
    specs: [
      {
        id: 'kat-algo-hmac384',
        useCase: 'HMAC-SHA-384 verification',
        standard: 'FIPS 198-1',
        referenceUrl: FIPS_198_URL,
        kind: { type: 'hmac-verify', hashAlg: 'SHA-384' },
      },
    ],
  },
  {
    id: 'hmac-sha512',
    name: 'HMAC-SHA-512',
    standard: 'FIPS 198-1',
    fipsUrl: FIPS_198_URL,
    securityLevel: 256,
    operations: ['MAC verification'],
    specs: [
      {
        id: 'kat-algo-hmac512',
        useCase: 'HMAC-SHA-512 verification',
        standard: 'FIPS 198-1',
        referenceUrl: FIPS_198_URL,
        kind: { type: 'hmac-verify', hashAlg: 'SHA-512' },
      },
    ],
  },
  {
    id: 'sha256',
    name: 'SHA-256',
    standard: 'FIPS 180-4',
    fipsUrl: FIPS_180_URL,
    securityLevel: 128,
    operations: ['Digest'],
    specs: [
      {
        id: 'kat-algo-sha256',
        useCase: 'SHA-256 hash',
        standard: 'FIPS 180-4',
        referenceUrl: FIPS_180_URL,
        kind: { type: 'sha256-hash' },
      },
    ],
  },
  {
    id: 'sha384',
    name: 'SHA-384',
    standard: 'FIPS 180-4',
    fipsUrl: FIPS_180_URL,
    securityLevel: 192,
    operations: ['Digest'],
    specs: [
      {
        id: 'kat-algo-sha384',
        useCase: 'SHA-384 hash',
        standard: 'FIPS 180-4',
        referenceUrl: FIPS_180_URL,
        kind: { type: 'sha384-hash' },
      },
    ],
  },
  {
    id: 'sha512',
    name: 'SHA-512',
    standard: 'FIPS 180-4',
    fipsUrl: FIPS_180_URL,
    securityLevel: 256,
    operations: ['Digest'],
    specs: [
      {
        id: 'kat-algo-sha512',
        useCase: 'SHA-512 hash',
        standard: 'FIPS 180-4',
        referenceUrl: FIPS_180_URL,
        kind: { type: 'sha512-hash' },
      },
    ],
  },
  {
    id: 'sha3-256',
    name: 'SHA3-256',
    standard: 'FIPS 202',
    fipsUrl: FIPS_202_URL,
    securityLevel: 128,
    operations: ['Digest'],
    specs: [
      {
        id: 'kat-algo-sha3-256',
        useCase: 'SHA3-256 hash',
        standard: 'FIPS 202',
        referenceUrl: FIPS_202_URL,
        kind: { type: 'sha3-256-hash' },
      },
    ],
  },
  {
    id: 'sha3-512',
    name: 'SHA3-512',
    standard: 'FIPS 202',
    fipsUrl: FIPS_202_URL,
    securityLevel: 256,
    operations: ['Digest'],
    specs: [
      {
        id: 'kat-algo-sha3-512',
        useCase: 'SHA3-512 hash',
        standard: 'FIPS 202',
        referenceUrl: FIPS_202_URL,
        kind: { type: 'sha3-512-hash' },
      },
    ],
  },
]

// ── Classical Signature tiles ───────────────────────────────────────────────

export const CLASSICAL_SIG_TILES: KATTileConfig[] = [
  {
    id: 'ecdsa-p256',
    name: 'ECDSA P-256',
    standard: 'FIPS 186-5',
    fipsUrl: FIPS_186_URL,
    securityLevel: 128,
    operations: ['Signature verification'],
    specs: [
      {
        id: 'kat-algo-ecdsa-p256',
        useCase: 'ECDSA P-256 signature verification',
        standard: 'FIPS 186-5',
        referenceUrl: FIPS_186_URL,
        kind: { type: 'ecdsa-sigver', curve: 'P-256' },
      },
    ],
  },
  {
    id: 'ecdsa-p384',
    name: 'ECDSA P-384',
    standard: 'FIPS 186-5',
    fipsUrl: FIPS_186_URL,
    securityLevel: 192,
    operations: ['Signature verification'],
    specs: [
      {
        id: 'kat-algo-ecdsa-p384',
        useCase: 'ECDSA P-384 signature verification',
        standard: 'FIPS 186-5',
        referenceUrl: FIPS_186_URL,
        kind: { type: 'ecdsa-sigver', curve: 'P-384' },
      },
    ],
  },
  {
    id: 'ecdsa-p521',
    name: 'ECDSA P-521',
    standard: 'FIPS 186-5',
    fipsUrl: FIPS_186_URL,
    securityLevel: 256,
    operations: ['Signature verification'],
    specs: [
      {
        id: 'kat-algo-ecdsa-p521',
        useCase: 'ECDSA P-521 (SHA-512) signature verification',
        standard: 'FIPS 186-5',
        referenceUrl: FIPS_186_URL,
        kind: { type: 'ecdsa-sigver', curve: 'P-521' },
      },
    ],
  },
  {
    id: 'eddsa',
    name: 'EdDSA (Ed25519)',
    standard: 'RFC 8032',
    fipsUrl: RFC_8032_URL,
    securityLevel: 128,
    operations: ['Signature verification'],
    specs: [
      {
        id: 'kat-algo-eddsa',
        useCase: 'EdDSA Ed25519 signature verification',
        standard: 'RFC 8032',
        referenceUrl: RFC_8032_URL,
        kind: { type: 'eddsa-sigver' },
      },
    ],
  },
  {
    id: 'eddsa-ed448',
    name: 'EdDSA (Ed448)',
    standard: 'FIPS 186-5',
    fipsUrl: FIPS_186_URL,
    securityLevel: 224,
    operations: ['Signature verification'],
    specs: [
      {
        id: 'kat-algo-eddsa-ed448',
        useCase: 'EdDSA Ed448 signature verification',
        standard: 'FIPS 186-5',
        referenceUrl: FIPS_186_URL,
        kind: { type: 'eddsa-sigver', curve: 'Ed448' },
      },
    ],
  },
  {
    id: 'rsapss',
    name: 'RSA-PSS',
    standard: 'FIPS 186-5',
    fipsUrl: FIPS_186_URL,
    securityLevel: 112,
    operations: ['Signature verification'],
    specs: [
      {
        id: 'kat-algo-rsapss',
        useCase: 'RSA-PSS signature verification',
        standard: 'FIPS 186-5',
        referenceUrl: FIPS_186_URL,
        kind: { type: 'rsapss-sigver' },
      },
    ],
  },
]

// ── Key Derivation tiles ────────────────────────────────────────────────────

export const KDF_TILES: KATTileConfig[] = [
  {
    id: 'pbkdf2',
    name: 'PBKDF2-SHA-256',
    standard: 'RFC 8018',
    fipsUrl: RFC_8018_URL,
    securityLevel: 128,
    operations: ['Key derivation'],
    specs: [
      {
        id: 'kat-algo-pbkdf2',
        useCase: 'PBKDF2-HMAC-SHA-256 key derivation',
        standard: 'RFC 8018',
        referenceUrl: RFC_8018_URL,
        kind: { type: 'pbkdf2-derive', prf: 'SHA-256' },
      },
    ],
  },
  {
    id: 'hkdf',
    name: 'HKDF-SHA-256',
    standard: 'RFC 5869',
    fipsUrl: RFC_5869_URL,
    securityLevel: 128,
    operations: ['Key derivation'],
    specs: [
      {
        id: 'kat-algo-hkdf',
        useCase: 'HKDF-SHA-256 extract+expand',
        standard: 'RFC 5869',
        referenceUrl: RFC_5869_URL,
        kind: { type: 'hkdf-derive' },
      },
    ],
  },
]

export const ALL_KAT_TILES: KATTileConfig[] = [
  ...ML_KEM_TILES,
  ...ML_DSA_TILES,
  ...AES_TILES,
  ...HMAC_HASH_TILES,
  ...CLASSICAL_SIG_TILES,
  ...KDF_TILES,
]
