// SPDX-License-Identifier: GPL-3.0-only
import type { ConstEntry } from './types'

export const CKA_TABLE: Record<number, ConstEntry> = {
  0x00000000: { name: 'CKA_CLASS', description: 'Object class (CKO_*)' },
  0x00000001: { name: 'CKA_TOKEN', description: 'Persistent token object vs session object' },
  0x00000002: { name: 'CKA_PRIVATE', description: 'Access requires authentication' },
  0x00000011: { name: 'CKA_VALUE', description: 'Raw key bytes' },
  0x00000100: { name: 'CKA_KEY_TYPE', description: 'Key type (CKK_*)' },
  0x00000103: { name: 'CKA_SENSITIVE', description: 'Key cannot be extracted in plaintext' },
  0x00000104: { name: 'CKA_ENCRYPT', description: 'Key can be used for encryption' },
  0x00000105: { name: 'CKA_DECRYPT', description: 'Key can be used for decryption' },
  0x00000106: { name: 'CKA_WRAP', description: 'Key can be used to wrap other keys' },
  0x00000107: { name: 'CKA_UNWRAP', description: 'Key can be used to unwrap other keys' },
  0x00000108: { name: 'CKA_SIGN', description: 'Key can be used to create signatures' },
  0x0000010a: { name: 'CKA_VERIFY', description: 'Key can be used to verify signatures' },
  0x0000010c: { name: 'CKA_DERIVE', description: 'Key can be used for key derivation' },
  0x00000121: { name: 'CKA_MODULUS_BITS', description: 'RSA modulus length in bits' },
  0x00000122: { name: 'CKA_PUBLIC_EXPONENT', description: 'RSA public exponent (usually 65537)' },
  0x00000161: { name: 'CKA_VALUE_LEN', description: 'Key length in bytes' },
  0x00000162: { name: 'CKA_EXTRACTABLE', description: 'Key can be wrapped and extracted' },
  0x00000180: { name: 'CKA_EC_PARAMS', description: 'DER-encoded EC domain parameters (OID)' },
  0x00000181: { name: 'CKA_EC_POINT', description: 'DER-encoded EC public key point' },
  0x0000061d: { name: 'CKA_PARAMETER_SET', description: 'PQC parameter set (CKP_*)' },
  0x00000633: {
    name: 'CKA_ENCAPSULATE',
    description: 'Key can be used for encapsulation (ML-KEM)',
  },
  0x00000634: {
    name: 'CKA_DECAPSULATE',
    description: 'Key can be used for decapsulation (ML-KEM)',
  },
  0x0000062a: {
    name: 'CKA_ENCAPSULATE_TEMPLATE',
    description: 'Template for auto-generated shared-secret key (ML-KEM encapsulate)',
  },
  0x0000062b: {
    name: 'CKA_DECAPSULATE_TEMPLATE',
    description: 'Template for auto-generated shared-secret key (ML-KEM decapsulate)',
  },
}

export const CKM_TABLE: Record<number, ConstEntry> = {
  // RSA (§2.1)
  0x00000000: { name: 'CKM_RSA_PKCS_KEY_PAIR_GEN', description: 'RSA key pair generation' },
  0x00000009: {
    name: 'CKM_RSA_PKCS_OAEP',
    description: 'RSA-OAEP encryption/decryption (PKCS#1 v2.x)',
  },
  0x00000040: {
    name: 'CKM_SHA256_RSA_PKCS',
    description: 'SHA-256 with RSA PKCS#1 v1.5 signature',
  },
  0x00000041: { name: 'CKM_SHA384_RSA_PKCS', description: 'SHA-384 with RSA PKCS#1 v1.5' },
  0x00000042: { name: 'CKM_SHA512_RSA_PKCS', description: 'SHA-512 with RSA PKCS#1 v1.5' },
  0x00000043: { name: 'CKM_SHA256_RSA_PKCS_PSS', description: 'SHA-256 with RSA-PSS signature' },
  0x00000044: { name: 'CKM_SHA384_RSA_PKCS_PSS', description: 'SHA-384 with RSA-PSS' },
  0x00000045: { name: 'CKM_SHA512_RSA_PKCS_PSS', description: 'SHA-512 with RSA-PSS' },
  // ML-KEM — FIPS 203
  0x0000000f: {
    name: 'CKM_ML_KEM_KEY_PAIR_GEN',
    description: 'ML-KEM key pair generation (FIPS 203 Algorithm 15/16)',
  },
  0x00000017: {
    name: 'CKM_ML_KEM',
    description: 'ML-KEM encapsulation / decapsulation (FIPS 203 Algorithm 17/18)',
  },
  // ML-DSA — FIPS 204
  0x0000001c: {
    name: 'CKM_ML_DSA_KEY_PAIR_GEN',
    description: 'ML-DSA key pair generation (FIPS 204 Algorithm 6/7)',
  },
  0x0000001d: {
    name: 'CKM_ML_DSA',
    description: 'ML-DSA pure signing / verification (FIPS 204 Algorithm 2/3)',
  },
  0x0000001f: {
    name: 'CKM_HASH_ML_DSA',
    description: 'HashML-DSA generic pre-hash (FIPS 204 Algorithm 4/5)',
  },
  0x00000023: {
    name: 'CKM_HASH_ML_DSA_SHA224',
    description: 'HashML-DSA with SHA-224 (FIPS 204 Algorithm 4/5)',
  },
  0x00000024: {
    name: 'CKM_HASH_ML_DSA_SHA256',
    description: 'HashML-DSA with SHA-256 (FIPS 204 Algorithm 4/5)',
  },
  0x00000025: {
    name: 'CKM_HASH_ML_DSA_SHA384',
    description: 'HashML-DSA with SHA-384 (FIPS 204 Algorithm 4/5)',
  },
  0x00000026: {
    name: 'CKM_HASH_ML_DSA_SHA512',
    description: 'HashML-DSA with SHA-512 (FIPS 204 Algorithm 4/5)',
  },
  0x00000027: {
    name: 'CKM_HASH_ML_DSA_SHA3_224',
    description: 'HashML-DSA with SHA3-224 (FIPS 204 Algorithm 4/5)',
  },
  0x00000028: {
    name: 'CKM_HASH_ML_DSA_SHA3_256',
    description: 'HashML-DSA with SHA3-256 (FIPS 204 Algorithm 4/5)',
  },
  0x00000029: {
    name: 'CKM_HASH_ML_DSA_SHA3_384',
    description: 'HashML-DSA with SHA3-384 (FIPS 204 Algorithm 4/5)',
  },
  0x0000002a: {
    name: 'CKM_HASH_ML_DSA_SHA3_512',
    description: 'HashML-DSA with SHA3-512 (FIPS 204 Algorithm 4/5)',
  },
  0x0000002b: {
    name: 'CKM_HASH_ML_DSA_SHAKE128',
    description: 'HashML-DSA with SHAKE128 (FIPS 204 Algorithm 4/5)',
  },
  0x0000002c: {
    name: 'CKM_HASH_ML_DSA_SHAKE256',
    description: 'HashML-DSA with SHAKE256 (FIPS 204 Algorithm 4/5)',
  },
  // SLH-DSA — FIPS 205
  0x0000002d: {
    name: 'CKM_SLH_DSA_KEY_PAIR_GEN',
    description: 'SLH-DSA key pair generation (FIPS 205)',
  },
  0x0000002e: {
    name: 'CKM_SLH_DSA',
    description: 'SLH-DSA pure signing / verification (FIPS 205)',
  },
  0x00000034: {
    name: 'CKM_HASH_SLH_DSA',
    description: 'HashSLH-DSA generic pre-hash (FIPS 205)',
  },
  0x00000036: { name: 'CKM_HASH_SLH_DSA_SHA224', description: 'HashSLH-DSA with SHA-224' },
  0x00000037: { name: 'CKM_HASH_SLH_DSA_SHA256', description: 'HashSLH-DSA with SHA-256' },
  0x00000038: { name: 'CKM_HASH_SLH_DSA_SHA384', description: 'HashSLH-DSA with SHA-384' },
  0x00000039: { name: 'CKM_HASH_SLH_DSA_SHA512', description: 'HashSLH-DSA with SHA-512' },
  0x0000003a: { name: 'CKM_HASH_SLH_DSA_SHA3_224', description: 'HashSLH-DSA with SHA3-224' },
  0x0000003b: { name: 'CKM_HASH_SLH_DSA_SHA3_256', description: 'HashSLH-DSA with SHA3-256' },
  0x0000003c: { name: 'CKM_HASH_SLH_DSA_SHA3_384', description: 'HashSLH-DSA with SHA3-384' },
  0x0000003d: { name: 'CKM_HASH_SLH_DSA_SHA3_512', description: 'HashSLH-DSA with SHA3-512' },
  0x0000003e: { name: 'CKM_HASH_SLH_DSA_SHAKE128', description: 'HashSLH-DSA with SHAKE128' },
  0x0000003f: { name: 'CKM_HASH_SLH_DSA_SHAKE256', description: 'HashSLH-DSA with SHAKE256' },
  // Hash / Digest (§2.17)
  0x00000250: { name: 'CKM_SHA256', description: 'SHA-256 digest' },
  0x00000251: { name: 'CKM_SHA256_HMAC', description: 'HMAC-SHA-256' },
  0x00000260: { name: 'CKM_SHA384', description: 'SHA-384 digest' },
  0x00000261: { name: 'CKM_SHA384_HMAC', description: 'HMAC-SHA-384' },
  0x00000270: { name: 'CKM_SHA512', description: 'SHA-512 digest' },
  0x00000271: { name: 'CKM_SHA512_HMAC', description: 'HMAC-SHA-512' },
  0x000002b0: { name: 'CKM_SHA3_256', description: 'SHA3-256 digest' },
  0x000002b1: { name: 'CKM_SHA3_256_HMAC', description: 'HMAC-SHA3-256' },
  0x000002d0: { name: 'CKM_SHA3_512', description: 'SHA3-512 digest' },
  0x000002d1: { name: 'CKM_SHA3_512_HMAC', description: 'HMAC-SHA3-512' },
  // Symmetric / Key Gen
  0x00000350: { name: 'CKM_GENERIC_SECRET_KEY_GEN', description: 'Generic secret key generation' },
  0x000003ac: {
    name: 'CKM_SP800_108_COUNTER_KDF',
    description: 'NIST SP 800-108 Counter mode KBKDF (§2.44)',
  },
  0x000003ad: {
    name: 'CKM_SP800_108_FEEDBACK_KDF',
    description: 'NIST SP 800-108 Feedback mode KBKDF (§2.44)',
  },
  0x000003ae: {
    name: 'CKM_SP800_108_DOUBLE_PIPELINE_KDF',
    description: 'NIST SP 800-108 Double-Pipeline KBKDF (§2.44)',
  },
  0x000003b0: { name: 'CKM_PKCS5_PBKD2', description: 'PBKDF2 key derivation (RFC 8018)' },
  // EC (§2.3)
  0x00001040: {
    name: 'CKM_EC_KEY_PAIR_GEN',
    description: 'EC key pair generation (P-256/P-384/P-521)',
  },
  0x00001044: { name: 'CKM_ECDSA_SHA256', description: 'ECDSA with SHA-256' },
  0x00001045: { name: 'CKM_ECDSA_SHA384', description: 'ECDSA with SHA-384' },
  0x00001046: { name: 'CKM_ECDSA_SHA512', description: 'ECDSA with SHA-512' },
  0x00001047: { name: 'CKM_ECDSA_SHA3_224', description: 'ECDSA with SHA3-224 (v3.2)' },
  0x00001048: { name: 'CKM_ECDSA_SHA3_256', description: 'ECDSA with SHA3-256 (v3.2)' },
  0x00001049: { name: 'CKM_ECDSA_SHA3_384', description: 'ECDSA with SHA3-384 (v3.2)' },
  0x0000104a: { name: 'CKM_ECDSA_SHA3_512', description: 'ECDSA with SHA3-512 (v3.2)' },
  0x00001050: { name: 'CKM_ECDH1_DERIVE', description: 'ECDH key agreement (ANSI X9.63)' },
  0x00001051: {
    name: 'CKM_ECDH1_COFACTOR_DERIVE',
    description: 'ECDH cofactor key agreement (§2.3.2)',
  },
  0x00001055: {
    name: 'CKM_EC_EDWARDS_KEY_PAIR_GEN',
    description: 'Ed25519/Ed448 key pair generation',
  },
  0x00001057: { name: 'CKM_EDDSA', description: 'EdDSA signature (Ed25519/Ed448)' },
  // AES (§2.14)
  0x00001080: { name: 'CKM_AES_KEY_GEN', description: 'AES key generation' },
  0x00001081: { name: 'CKM_AES_ECB', description: 'AES-ECB (no padding)' },
  0x00001085: { name: 'CKM_AES_CBC_PAD', description: 'AES-CBC with PKCS#7 padding' },
  0x00001086: { name: 'CKM_AES_CTR', description: 'AES-CTR counter mode (§2.14.3)' },
  0x00001087: { name: 'CKM_AES_GCM', description: 'AES-GCM authenticated encryption' },
  0x0000108a: { name: 'CKM_AES_CMAC', description: 'AES-CMAC (NIST SP 800-38B)' },
  0x00002109: { name: 'CKM_AES_KEY_WRAP', description: 'AES Key Wrap (RFC 3394)' },
  // HKDF (§2.43)
  0x0000402a: { name: 'CKM_HKDF_DERIVE', description: 'HKDF key derivation (RFC 5869)' },
}

export const CKO_TABLE: Record<number, ConstEntry> = {
  0x00: { name: 'CKO_DATA', description: 'Opaque data object' },
  0x01: { name: 'CKO_CERTIFICATE', description: 'Certificate object' },
  0x02: { name: 'CKO_PUBLIC_KEY', description: 'Public key — encapsulate / verify operations' },
  0x03: { name: 'CKO_PRIVATE_KEY', description: 'Private key — decapsulate / sign operations' },
  0x04: { name: 'CKO_SECRET_KEY', description: 'Symmetric / shared-secret key' },
}

export const CKK_TABLE: Record<number, ConstEntry> = {
  0x00: { name: 'CKK_RSA' },
  0x03: { name: 'CKK_EC' },
  0x10: { name: 'CKK_GENERIC_SECRET', description: 'Generic secret key (HMAC, KDF base)' },
  0x1f: { name: 'CKK_AES', description: 'AES symmetric key' },
  0x40: { name: 'CKK_EC_EDWARDS', description: 'Edwards-curve key (Ed25519/Ed448)' },
  0x49: { name: 'CKK_ML_KEM', description: 'ML-KEM (FIPS 203)' },
  0x4a: { name: 'CKK_ML_DSA', description: 'ML-DSA (FIPS 204)' },
  0x4b: { name: 'CKK_SLH_DSA', description: 'SLH-DSA (FIPS 205)' },
}
