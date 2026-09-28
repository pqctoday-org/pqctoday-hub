// SPDX-License-Identifier: GPL-3.0-only
//
// Multi-part message-signing targets: every mechanism × parameter set that
// sections/multiMessageSign.ts runs and testRegistry.ts registers. One table so
// row ids and capability cells cannot drift apart. Pure data (no wasm imports),
// so node scripts that load the registry can import it.

export type MultiPartFamily = 'hmac' | 'rsa' | 'ecdsa' | 'mldsa' | 'slhdsa'

export interface MultiPartTarget {
  mechanism: string
  family: MultiPartFamily
  /** Capability-matrix parameter sets; ['*'] for mechanisms without one. */
  paramSets: readonly string[]
}

/** HMAC output length in bytes, by the hash name in CKM_<hash>_HMAC. */
export const HMAC_LEN: Record<string, number> = {
  MD5: 16,
  SHA_1: 20,
  RIPEMD160: 20,
  SHA224: 28,
  SHA256: 32,
  SHA384: 48,
  SHA512: 64,
  SHA512_224: 28,
  SHA512_256: 32,
  SHA3_224: 28,
  SHA3_256: 32,
  SHA3_384: 48,
  SHA3_512: 64,
}

const EC_CURVES = ['P-256', 'P-384', 'P-521', 'secp256k1'] as const
const MLDSA_SETS = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'] as const
const SLHDSA_SETS: Record<string, number> = {
  'SLH-DSA-SHA2-128s': 0x01,
  'SLH-DSA-SHAKE-128s': 0x02,
  'SLH-DSA-SHA2-128f': 0x03,
  'SLH-DSA-SHAKE-128f': 0x04,
  'SLH-DSA-SHA2-192s': 0x05,
  'SLH-DSA-SHAKE-192s': 0x06,
  'SLH-DSA-SHA2-192f': 0x07,
  'SLH-DSA-SHAKE-192f': 0x08,
  'SLH-DSA-SHA2-256s': 0x09,
  'SLH-DSA-SHAKE-256s': 0x0a,
  'SLH-DSA-SHA2-256f': 0x0b,
  'SLH-DSA-SHAKE-256f': 0x0c,
}
const PQC_HASHES = [
  'SHA224',
  'SHA256',
  'SHA384',
  'SHA512',
  'SHA3_224',
  'SHA3_256',
  'SHA3_384',
  'SHA3_512',
  'SHAKE128',
  'SHAKE256',
]

/** Every mechanism × parameter set this section covers. The registry reads the
 *  same table, so row ids and capability cells cannot drift apart. */
export const MULTIPART_TARGETS: readonly MultiPartTarget[] = [
  ...Object.keys(HMAC_LEN).flatMap((h) => [
    { mechanism: `CKM_${h}_HMAC`, family: 'hmac' as const, paramSets: ['*'] },
    { mechanism: `CKM_${h}_HMAC_GENERAL`, family: 'hmac' as const, paramSets: ['*'] },
  ]),
  ...[
    'MD5',
    'SHA1',
    'SHA224',
    'SHA256',
    'SHA384',
    'SHA512',
    'SHA3_224',
    'SHA3_256',
    'SHA3_384',
    'SHA3_512',
  ].map((h) => ({ mechanism: `CKM_${h}_RSA_PKCS`, family: 'rsa' as const, paramSets: ['*'] })),
  { mechanism: 'CKM_RSA_PKCS_PSS', family: 'rsa', paramSets: ['*'] },
  ...[
    'SHA1',
    'SHA224',
    'SHA256',
    'SHA384',
    'SHA512',
    'SHA3_224',
    'SHA3_256',
    'SHA3_384',
    'SHA3_512',
  ].map((h) => ({ mechanism: `CKM_${h}_RSA_PKCS_PSS`, family: 'rsa' as const, paramSets: ['*'] })),
  { mechanism: 'CKM_ECDSA', family: 'ecdsa', paramSets: EC_CURVES },
  ...[
    'SHA1',
    'SHA224',
    'SHA256',
    'SHA384',
    'SHA512',
    'SHA3_224',
    'SHA3_256',
    'SHA3_384',
    'SHA3_512',
  ].map((h) => ({ mechanism: `CKM_ECDSA_${h}`, family: 'ecdsa' as const, paramSets: EC_CURVES })),
  { mechanism: 'CKM_ML_DSA', family: 'mldsa', paramSets: MLDSA_SETS },
  { mechanism: 'CKM_HASH_ML_DSA', family: 'mldsa', paramSets: MLDSA_SETS },
  ...PQC_HASHES.map((h) => ({
    mechanism: `CKM_HASH_ML_DSA_${h}`,
    family: 'mldsa' as const,
    paramSets: MLDSA_SETS,
  })),
  { mechanism: 'CKM_SLH_DSA', family: 'slhdsa', paramSets: Object.keys(SLHDSA_SETS) },
  { mechanism: 'CKM_HASH_SLH_DSA', family: 'slhdsa', paramSets: Object.keys(SLHDSA_SETS) },
  ...PQC_HASHES.map((h) => ({
    mechanism: `CKM_HASH_SLH_DSA_${h}`,
    family: 'slhdsa' as const,
    paramSets: Object.keys(SLHDSA_SETS),
  })),
]

/** Row-id stem shared with the registry: `msgmp-<mechanism>-<paramSet>`. */
export const multipartRowStem = (mechanism: string, ps: string) =>
  `msgmp-${mechanism}-${ps === '*' ? 'any' : ps}`
