// SPDX-License-Identifier: GPL-3.0-only
/**
 * mechanismTable.ts — the single source of truth mapping CKM_ mechanism type
 * codes to their canonical name / description / family for the Mechanism
 * Discovery pane (and any other surface decoding C_GetMechanismList output).
 *
 * History: this table used to exist as two independent inline copies (in
 * softhsm.ts and softhsm/session.ts) that both drifted behind the engines —
 * the 2026-08-13 audit (N13) found ~37 Rust / ~21 C++ advertised mechanism
 * IDs rendering as "CKM_UNKNOWN" + raw hex, including standard v3.2 values
 * and the engines' own vendor-defined PQC KEMs. Now there is exactly one
 * table, and mechanismNames.local.test.ts drift-guards it against BOTH real
 * wasm engines' advertised lists.
 *
 * Sources of truth:
 *  - Standard values: the canonical OASIS PKCS#11 v3.2 header vendored in
 *    the pqctoday-hsm repo (docs/refs/pkcs11t-canonical-v3.2.h).
 *  - Vendor values (0x80000000+): the engines' own constant tables
 *    (pqctoday-hsm rust/src/constants.rs and src/lib/vendor_mechanisms.h).
 */

export type MechanismFamily = 'pqc' | 'asymmetric' | 'symmetric' | 'hash' | 'kdf' | 'other'

export interface MechEntry {
  name: string
  description: string
  family: MechanismFamily
}

/** Comprehensive mechanism name / description / family table (PKCS#11 v3.2) */
export const MECH_TABLE: Record<number, MechEntry> = {
  // ── RSA ──────────────────────────────────────────────────────────────────
  0x00000000: {
    name: 'CKM_RSA_PKCS_KEY_PAIR_GEN',
    description: 'RSA key pair generation (PKCS #1)',
    family: 'asymmetric',
  },
  0x00000001: {
    name: 'CKM_RSA_PKCS',
    description: 'RSA PKCS#1 v1.5 sign & encrypt',
    family: 'asymmetric',
  },
  0x00000003: {
    name: 'CKM_RSA_X_509',
    description: 'Raw RSA operation (X.509)',
    family: 'asymmetric',
  },
  0x00000006: {
    name: 'CKM_SHA1_RSA_PKCS',
    description: 'RSA PKCS#1 v1.5 with SHA-1',
    family: 'asymmetric',
  },
  0x00000009: {
    name: 'CKM_RSA_PKCS_OAEP',
    description: 'RSA-OAEP encryption (PKCS #1 §7.1)',
    family: 'asymmetric',
  },
  0x0000000e: {
    name: 'CKM_SHA1_RSA_PKCS_PSS',
    description: 'RSA-PSS with SHA-1 (PKCS #1 §8.1)',
    family: 'asymmetric',
  },
  0x00000040: {
    name: 'CKM_SHA256_RSA_PKCS',
    description: 'RSA PKCS#1 v1.5 with SHA-256',
    family: 'asymmetric',
  },
  0x00000041: {
    name: 'CKM_SHA384_RSA_PKCS',
    description: 'RSA PKCS#1 v1.5 with SHA-384',
    family: 'asymmetric',
  },
  0x00000042: {
    name: 'CKM_SHA512_RSA_PKCS',
    description: 'RSA PKCS#1 v1.5 with SHA-512',
    family: 'asymmetric',
  },
  0x00000043: {
    name: 'CKM_SHA256_RSA_PKCS_PSS',
    description: 'RSA-PSS with SHA-256 (PKCS #1 §8.1)',
    family: 'asymmetric',
  },
  0x00000044: {
    name: 'CKM_SHA384_RSA_PKCS_PSS',
    description: 'RSA-PSS with SHA-384',
    family: 'asymmetric',
  },
  0x00000045: {
    name: 'CKM_SHA512_RSA_PKCS_PSS',
    description: 'RSA-PSS with SHA-512',
    family: 'asymmetric',
  },
  0x00000046: {
    name: 'CKM_SHA224_RSA_PKCS',
    description: 'RSA PKCS#1 v1.5 with SHA-224',
    family: 'asymmetric',
  },
  0x00000047: {
    name: 'CKM_SHA224_RSA_PKCS_PSS',
    description: 'RSA-PSS with SHA-224',
    family: 'asymmetric',
  },
  0x00000060: {
    name: 'CKM_SHA3_256_RSA_PKCS',
    description: 'RSA PKCS#1 v1.5 with SHA3-256',
    family: 'asymmetric',
  },
  0x00000062: {
    name: 'CKM_SHA3_512_RSA_PKCS',
    description: 'RSA PKCS#1 v1.5 with SHA3-512',
    family: 'asymmetric',
  },
  0x00000063: {
    name: 'CKM_SHA3_256_RSA_PKCS_PSS',
    description: 'RSA-PSS with SHA3-256',
    family: 'asymmetric',
  },
  0x00000065: {
    name: 'CKM_SHA3_512_RSA_PKCS_PSS',
    description: 'RSA-PSS with SHA3-512',
    family: 'asymmetric',
  },
  0x00000066: {
    name: 'CKM_SHA3_224_RSA_PKCS',
    description: 'RSA PKCS#1 v1.5 with SHA3-224',
    family: 'asymmetric',
  },
  0x00000067: {
    name: 'CKM_SHA3_224_RSA_PKCS_PSS',
    description: 'RSA-PSS with SHA3-224',
    family: 'asymmetric',
  },
  0x00001054: {
    name: 'CKM_RSA_AES_KEY_WRAP',
    description: 'RSA-OAEP + AES key wrapping (PKCS#11 v3.2)',
    family: 'asymmetric',
  },
  // ── ML-KEM (PKCS#11 v3.2 — FIPS 203) ────────────────────────────────────
  0x0000000f: {
    name: 'CKM_ML_KEM_KEY_PAIR_GEN',
    description: 'ML-KEM key pair generation (FIPS 203 §7)',
    family: 'pqc',
  },
  0x00000017: {
    name: 'CKM_ML_KEM',
    description: 'ML-KEM encapsulation / decapsulation (FIPS 203 §6)',
    family: 'pqc',
  },
  // ── ML-DSA (PKCS#11 v3.2 — FIPS 204) ────────────────────────────────────
  0x0000001c: {
    name: 'CKM_ML_DSA_KEY_PAIR_GEN',
    description: 'ML-DSA key pair generation (FIPS 204 §6)',
    family: 'pqc',
  },
  0x0000001d: {
    name: 'CKM_ML_DSA',
    description: 'ML-DSA pure signing / verification (FIPS 204 §5.2/5.3)',
    family: 'pqc',
  },
  0x0000403b: {
    name: 'CKM_ML_DSA_EXTERNAL_MU_GEN',
    description: 'ML-DSA external-mu generation (vendor extension, src/lib/vendor_mechanisms.h)',
    family: 'pqc',
  },
  0x0000403c: {
    name: 'CKM_ML_DSA_EXTERNAL_MU',
    description:
      'ML-DSA signing/verification from a precomputed external mu (vendor extension, src/lib/vendor_mechanisms.h)',
    family: 'pqc',
  },
  0x0000001f: {
    name: 'CKM_HASH_ML_DSA',
    description: 'HashML-DSA generic pre-hash (FIPS 204 §5.4/5.5)',
    family: 'pqc',
  },
  0x00000023: {
    name: 'CKM_HASH_ML_DSA_SHA224',
    description: 'HashML-DSA with SHA-224 pre-hash',
    family: 'pqc',
  },
  0x00000024: {
    name: 'CKM_HASH_ML_DSA_SHA256',
    description: 'HashML-DSA with SHA-256 pre-hash',
    family: 'pqc',
  },
  0x00000025: {
    name: 'CKM_HASH_ML_DSA_SHA384',
    description: 'HashML-DSA with SHA-384 pre-hash',
    family: 'pqc',
  },
  0x00000026: {
    name: 'CKM_HASH_ML_DSA_SHA512',
    description: 'HashML-DSA with SHA-512 pre-hash',
    family: 'pqc',
  },
  0x00000027: {
    name: 'CKM_HASH_ML_DSA_SHA3_224',
    description: 'HashML-DSA with SHA3-224 pre-hash',
    family: 'pqc',
  },
  0x00000028: {
    name: 'CKM_HASH_ML_DSA_SHA3_256',
    description: 'HashML-DSA with SHA3-256 pre-hash',
    family: 'pqc',
  },
  0x00000029: {
    name: 'CKM_HASH_ML_DSA_SHA3_384',
    description: 'HashML-DSA with SHA3-384 pre-hash',
    family: 'pqc',
  },
  0x0000002a: {
    name: 'CKM_HASH_ML_DSA_SHA3_512',
    description: 'HashML-DSA with SHA3-512 pre-hash',
    family: 'pqc',
  },
  0x0000002b: {
    name: 'CKM_HASH_ML_DSA_SHAKE128',
    description: 'HashML-DSA with SHAKE128 pre-hash',
    family: 'pqc',
  },
  0x0000002c: {
    name: 'CKM_HASH_ML_DSA_SHAKE256',
    description: 'HashML-DSA with SHAKE256 pre-hash',
    family: 'pqc',
  },
  // ── SLH-DSA (PKCS#11 v3.2 — FIPS 205) ───────────────────────────────────
  0x0000002d: {
    name: 'CKM_SLH_DSA_KEY_PAIR_GEN',
    description: 'SLH-DSA key pair generation (FIPS 205 §10)',
    family: 'pqc',
  },
  0x0000002e: {
    name: 'CKM_SLH_DSA',
    description: 'SLH-DSA pure signing / verification (FIPS 205 §9.2/9.3)',
    family: 'pqc',
  },
  0x00000034: {
    name: 'CKM_HASH_SLH_DSA',
    description: 'HashSLH-DSA generic pre-hash (FIPS 205 §9.4/9.5)',
    family: 'pqc',
  },
  0x00000036: {
    name: 'CKM_HASH_SLH_DSA_SHA224',
    description: 'HashSLH-DSA with SHA-224 pre-hash',
    family: 'pqc',
  },
  0x00000037: {
    name: 'CKM_HASH_SLH_DSA_SHA256',
    description: 'HashSLH-DSA with SHA-256 pre-hash',
    family: 'pqc',
  },
  0x00000038: {
    name: 'CKM_HASH_SLH_DSA_SHA384',
    description: 'HashSLH-DSA with SHA-384 pre-hash',
    family: 'pqc',
  },
  0x00000039: {
    name: 'CKM_HASH_SLH_DSA_SHA512',
    description: 'HashSLH-DSA with SHA-512 pre-hash',
    family: 'pqc',
  },
  0x0000003a: {
    name: 'CKM_HASH_SLH_DSA_SHA3_224',
    description: 'HashSLH-DSA with SHA3-224 pre-hash',
    family: 'pqc',
  },
  0x0000003b: {
    name: 'CKM_HASH_SLH_DSA_SHA3_256',
    description: 'HashSLH-DSA with SHA3-256 pre-hash',
    family: 'pqc',
  },
  0x0000003c: {
    name: 'CKM_HASH_SLH_DSA_SHA3_384',
    description: 'HashSLH-DSA with SHA3-384 pre-hash',
    family: 'pqc',
  },
  0x0000003d: {
    name: 'CKM_HASH_SLH_DSA_SHA3_512',
    description: 'HashSLH-DSA with SHA3-512 pre-hash',
    family: 'pqc',
  },
  0x0000003e: {
    name: 'CKM_HASH_SLH_DSA_SHAKE128',
    description: 'HashSLH-DSA with SHAKE128 pre-hash',
    family: 'pqc',
  },
  0x0000003f: {
    name: 'CKM_HASH_SLH_DSA_SHAKE256',
    description: 'HashSLH-DSA with SHAKE256 pre-hash',
    family: 'pqc',
  },
  // ── SHA hash & HMAC ──────────────────────────────────────────────────────
  0x00000220: { name: 'CKM_SHA_1', description: 'SHA-1 digest (FIPS 180-4)', family: 'hash' },
  0x00000221: { name: 'CKM_SHA_1_HMAC', description: 'HMAC-SHA-1 (RFC 2104)', family: 'hash' },
  0x00000222: {
    name: 'CKM_SHA_1_HMAC_GENERAL',
    description: 'HMAC-SHA-1 with truncated output length',
    family: 'hash',
  },
  0x00000250: { name: 'CKM_SHA256', description: 'SHA-256 digest (FIPS 180-4)', family: 'hash' },
  0x00000251: { name: 'CKM_SHA256_HMAC', description: 'HMAC-SHA-256 (RFC 2104)', family: 'hash' },
  0x00000255: { name: 'CKM_SHA224', description: 'SHA-224 digest (FIPS 180-4)', family: 'hash' },
  0x00000256: { name: 'CKM_SHA224_HMAC', description: 'HMAC-SHA-224 (RFC 2104)', family: 'hash' },
  0x00000257: {
    name: 'CKM_SHA224_HMAC_GENERAL',
    description: 'HMAC-SHA-224 with truncated output length',
    family: 'hash',
  },
  0x00000260: { name: 'CKM_SHA384', description: 'SHA-384 digest (FIPS 180-4)', family: 'hash' },
  0x00000261: { name: 'CKM_SHA384_HMAC', description: 'HMAC-SHA-384 (RFC 2104)', family: 'hash' },
  0x00000270: { name: 'CKM_SHA512', description: 'SHA-512 digest (FIPS 180-4)', family: 'hash' },
  0x00000271: { name: 'CKM_SHA512_HMAC', description: 'HMAC-SHA-512 (RFC 2104)', family: 'hash' },
  0x00000048: {
    name: 'CKM_SHA512_224',
    description: 'SHA-512/224 digest (FIPS 180-4)',
    family: 'hash',
  },
  0x00000049: {
    name: 'CKM_SHA512_224_HMAC',
    description: 'HMAC-SHA-512/224 (RFC 2104)',
    family: 'hash',
  },
  0x0000004a: {
    name: 'CKM_SHA512_224_HMAC_GENERAL',
    description: 'HMAC-SHA-512/224 with truncated output length',
    family: 'hash',
  },
  0x0000004b: {
    name: 'CKM_SHA512_224_KEY_DERIVATION',
    description: 'Key derivation from a SHA-512/224 digest',
    family: 'kdf',
  },
  0x0000004c: {
    name: 'CKM_SHA512_256',
    description: 'SHA-512/256 digest (FIPS 180-4)',
    family: 'hash',
  },
  0x0000004d: {
    name: 'CKM_SHA512_256_HMAC',
    description: 'HMAC-SHA-512/256 (RFC 2104)',
    family: 'hash',
  },
  0x0000004e: {
    name: 'CKM_SHA512_256_HMAC_GENERAL',
    description: 'HMAC-SHA-512/256 with truncated output length',
    family: 'hash',
  },
  0x0000004f: {
    name: 'CKM_SHA512_256_KEY_DERIVATION',
    description: 'Key derivation from a SHA-512/256 digest',
    family: 'kdf',
  },
  0x000002b0: { name: 'CKM_SHA3_256', description: 'SHA3-256 digest (FIPS 202)', family: 'hash' },
  0x000002b1: {
    name: 'CKM_SHA3_256_HMAC',
    description: 'HMAC-SHA3-256 (RFC 2104 + FIPS 202)',
    family: 'hash',
  },
  0x000002b5: { name: 'CKM_SHA3_224', description: 'SHA3-224 digest (FIPS 202)', family: 'hash' },
  0x000002b6: {
    name: 'CKM_SHA3_224_HMAC',
    description: 'HMAC-SHA3-224 (RFC 2104 + FIPS 202)',
    family: 'hash',
  },
  0x000002b7: {
    name: 'CKM_SHA3_224_HMAC_GENERAL',
    description: 'HMAC-SHA3-224 with truncated output length',
    family: 'hash',
  },
  0x000002c0: { name: 'CKM_SHA3_384', description: 'SHA3-384 digest (FIPS 202)', family: 'hash' },
  0x000002c1: {
    name: 'CKM_SHA3_384_HMAC',
    description: 'HMAC-SHA3-384 (RFC 2104 + FIPS 202)',
    family: 'hash',
  },
  0x000002c2: {
    name: 'CKM_SHA3_384_HMAC_GENERAL',
    description: 'HMAC-SHA3-384 with truncated output length',
    family: 'hash',
  },
  0x000002d0: { name: 'CKM_SHA3_512', description: 'SHA3-512 digest (FIPS 202)', family: 'hash' },
  0x000002d1: {
    name: 'CKM_SHA3_512_HMAC',
    description: 'HMAC-SHA3-512 (RFC 2104 + FIPS 202)',
    family: 'hash',
  },
  // ── Symmetric ─────────────────────────────────────────────────────────────
  0x00000350: {
    name: 'CKM_GENERIC_SECRET_KEY_GEN',
    description: 'Generic secret key generation',
    family: 'symmetric',
  },
  0x00001080: { name: 'CKM_AES_KEY_GEN', description: 'AES key generation', family: 'symmetric' },
  0x00001081: {
    name: 'CKM_AES_ECB',
    description: 'AES-ECB encryption / decryption (FIPS 197)',
    family: 'symmetric',
  },
  0x00001082: {
    name: 'CKM_AES_CBC',
    description: 'AES-CBC encryption / decryption (FIPS 197)',
    family: 'symmetric',
  },
  0x00001085: {
    name: 'CKM_AES_CBC_PAD',
    description: 'AES-CBC with PKCS#7 padding',
    family: 'symmetric',
  },
  0x00001086: {
    name: 'CKM_AES_CTR',
    description: 'AES-CTR stream cipher (NIST SP 800-38A)',
    family: 'symmetric',
  },
  0x00001087: {
    name: 'CKM_AES_GCM',
    description: 'AES-GCM authenticated encryption (NIST SP 800-38D)',
    family: 'symmetric',
  },
  0x00001071: {
    name: 'CKM_AES_XTS',
    description: 'AES-XTS encryption / decryption (IEEE 1619)',
    family: 'symmetric',
  },
  0x00001072: {
    name: 'CKM_AES_XTS_KEY_GEN',
    description: 'AES-XTS key generation (IEEE 1619)',
    family: 'symmetric',
  },
  0x00001088: {
    name: 'CKM_AES_CCM',
    description: 'AES-CCM authenticated encryption (NIST SP 800-38C)',
    family: 'symmetric',
  },
  0x0000108e: {
    name: 'CKM_AES_GMAC',
    description: 'AES-GMAC message authentication (NIST SP 800-38D)',
    family: 'symmetric',
  },
  0x0000108a: {
    name: 'CKM_AES_CMAC',
    description: 'AES-CMAC message authentication (NIST SP 800-38B)',
    family: 'symmetric',
  },
  0x00002104: {
    name: 'CKM_AES_OFB',
    description: 'AES-OFB stream cipher mode (NIST SP 800-38A)',
    family: 'symmetric',
  },
  0x00002106: {
    name: 'CKM_AES_CFB8',
    description: 'AES-CFB, 8-bit feedback (NIST SP 800-38A)',
    family: 'symmetric',
  },
  0x00002107: {
    name: 'CKM_AES_CFB128',
    description: 'AES-CFB, 128-bit feedback (NIST SP 800-38A)',
    family: 'symmetric',
  },
  0x00002108: {
    name: 'CKM_AES_CFB1',
    description: 'AES-CFB, 1-bit feedback (NIST SP 800-38A)',
    family: 'symmetric',
  },
  0x00002109: {
    name: 'CKM_AES_KEY_WRAP',
    description: 'AES key wrapping (RFC 3394 / NIST SP 800-38F)',
    family: 'symmetric',
  },
  0x0000210a: {
    name: 'CKM_AES_KEY_WRAP_PAD',
    description: 'AES key wrapping with padding (NIST SP 800-38F §6.3)',
    family: 'symmetric',
  },
  0x00001104: {
    name: 'CKM_AES_ECB_ENCRYPT_DATA',
    description: 'AES-ECB encrypt-data key derivation',
    family: 'symmetric',
  },
  0x00001105: {
    name: 'CKM_AES_CBC_ENCRYPT_DATA',
    description: 'AES-CBC encrypt-data key derivation',
    family: 'symmetric',
  },
  // ── KDF / Key Agreement ───────────────────────────────────────────────────
  0x00001050: {
    name: 'CKM_ECDH1_DERIVE',
    description: 'ECDH key agreement (PKCS#11 §2.3.1)',
    family: 'kdf',
  },
  0x00001051: {
    name: 'CKM_ECDH1_COFACTOR_DERIVE',
    description: 'ECDH cofactor key agreement (PKCS#11 v3.2 §6.3.18)',
    family: 'kdf',
  },
  0x00000360: {
    name: 'CKM_CONCATENATE_BASE_AND_KEY',
    description: 'Key derivation: base key || key (PKCS#11 §2.38.1)',
    family: 'kdf',
  },
  0x00000362: {
    name: 'CKM_CONCATENATE_BASE_AND_DATA',
    description: 'Key derivation: base key || data (PKCS#11 §2.38.2)',
    family: 'kdf',
  },
  0x00000363: {
    name: 'CKM_CONCATENATE_DATA_AND_BASE',
    description: 'Key derivation: data || base key (PKCS#11 §2.38.3)',
    family: 'kdf',
  },
  0x000003ac: {
    name: 'CKM_SP800_108_COUNTER_KDF',
    description: 'NIST SP 800-108 counter-mode KBKDF',
    family: 'kdf',
  },
  0x000003ad: {
    name: 'CKM_SP800_108_FEEDBACK_KDF',
    description: 'NIST SP 800-108 feedback-mode KBKDF',
    family: 'kdf',
  },
  0x000003ae: {
    name: 'CKM_SP800_108_DOUBLE_PIPELINE_KDF',
    description: 'NIST SP 800-108 double-pipeline KBKDF',
    family: 'kdf',
  },
  0x000003b0: {
    name: 'CKM_PKCS5_PBKD2',
    description: 'PBKDF2 password-based key derivation (RFC 8018 §5.2)',
    family: 'kdf',
  },
  0x0000402a: {
    name: 'CKM_HKDF_DERIVE',
    description: 'HKDF key derivation (RFC 5869)',
    family: 'kdf',
  },
  0x0000402b: {
    name: 'CKM_HKDF_DATA',
    description: 'HKDF applied to raw data rather than a key object (PKCS#11 v3.2 §6.62)',
    family: 'kdf',
  },
  // ── EC / ECDSA / EdDSA ────────────────────────────────────────────────────
  0x00001040: {
    name: 'CKM_EC_KEY_PAIR_GEN',
    description: 'EC key pair generation (FIPS 186-5)',
    family: 'asymmetric',
  },
  0x0000140b: {
    name: 'CKM_EC_KEY_PAIR_GEN_W_EXTRA_BITS',
    description: 'EC key pair generation with extra random bits (PKCS#11 v3.2 §6.3.3)',
    family: 'asymmetric',
  },
  0x00001041: {
    name: 'CKM_ECDSA',
    description: 'ECDSA raw signing / verification (FIPS 186-5)',
    family: 'asymmetric',
  },
  0x00001042: {
    name: 'CKM_ECDSA_SHA1',
    description: 'ECDSA with SHA-1 (FIPS 186-5)',
    family: 'asymmetric',
  },
  0x00001043: {
    name: 'CKM_ECDSA_SHA224',
    description: 'ECDSA with SHA-224 (FIPS 186-5)',
    family: 'asymmetric',
  },
  0x00001044: {
    name: 'CKM_ECDSA_SHA256',
    description: 'ECDSA with SHA-256 (FIPS 186-5)',
    family: 'asymmetric',
  },
  0x00001045: {
    name: 'CKM_ECDSA_SHA384',
    description: 'ECDSA with SHA-384 (FIPS 186-5)',
    family: 'asymmetric',
  },
  0x00001046: {
    name: 'CKM_ECDSA_SHA512',
    description: 'ECDSA with SHA-512 (FIPS 186-5)',
    family: 'asymmetric',
  },
  0x00001047: {
    name: 'CKM_ECDSA_SHA3_224',
    description: 'ECDSA with SHA3-224 (PKCS#11 v3.2 §6.3)',
    family: 'asymmetric',
  },
  0x00001048: {
    name: 'CKM_ECDSA_SHA3_256',
    description: 'ECDSA with SHA3-256 (PKCS#11 v3.2 §6.3)',
    family: 'asymmetric',
  },
  0x00001049: {
    name: 'CKM_ECDSA_SHA3_384',
    description: 'ECDSA with SHA3-384 (PKCS#11 v3.2 §6.3)',
    family: 'asymmetric',
  },
  0x0000104a: {
    name: 'CKM_ECDSA_SHA3_512',
    description: 'ECDSA with SHA3-512 (PKCS#11 v3.2 §6.3)',
    family: 'asymmetric',
  },
  0x00001055: {
    name: 'CKM_EC_EDWARDS_KEY_PAIR_GEN',
    description: 'Ed25519 / Ed448 key pair generation (RFC 8032)',
    family: 'asymmetric',
  },
  0x00001056: {
    name: 'CKM_EC_MONTGOMERY_KEY_PAIR_GEN',
    description: 'X25519 / X448 key pair generation (RFC 7748)',
    family: 'asymmetric',
  },
  0x00001057: {
    name: 'CKM_EDDSA',
    description: 'EdDSA signing / verification (RFC 8032)',
    family: 'asymmetric',
  },
  // ── Vendor-defined (softhsmv3 extensions) ────────────────────────────────
  0x80000100: {
    name: 'CKM_KMAC_128',
    description: 'KMAC-128 message authentication (NIST SP 800-185)',
    family: 'symmetric',
  },
  0x80000101: {
    name: 'CKM_KMAC_256',
    description: 'KMAC-256 message authentication (NIST SP 800-185)',
    family: 'symmetric',
  },
  // ── Additions from the 2026-08-13 mechanism-name audit (N13) ─────────────
  // Standard PKCS#11 v3.2 values verified against the canonical OASIS header
  // (pqctoday-hsm docs/refs/pkcs11t-canonical-v3.2.h); vendor values verified
  // against the engines' own sources (rust/src/constants.rs,
  // src/lib/vendor_mechanisms.h). The mechanismNames.local.test.ts driftguard
  // asserts this table covers every ID both engines actually advertise.
  0x00000005: {
    name: 'CKM_MD5_RSA_PKCS',
    description: 'RSA PKCS#1 v1.5 with MD5 (historical)',
    family: 'asymmetric',
  },
  0x0000000d: {
    name: 'CKM_RSA_PKCS_PSS',
    description: 'RSA-PSS raw signing (PKCS #1 §8.1)',
    family: 'asymmetric',
  },
  0x00000061: {
    name: 'CKM_SHA3_384_RSA_PKCS',
    description: 'RSA PKCS#1 v1.5 with SHA3-384',
    family: 'asymmetric',
  },
  0x00000064: {
    name: 'CKM_SHA3_384_RSA_PKCS_PSS',
    description: 'RSA-PSS with SHA3-384',
    family: 'asymmetric',
  },
  0x00000210: {
    name: 'CKM_MD5',
    description: 'MD5 message digest (historical)',
    family: 'hash',
  },
  0x00000211: {
    name: 'CKM_MD5_HMAC',
    description: 'HMAC with MD5 (historical)',
    family: 'hash',
  },
  0x00000212: {
    name: 'CKM_MD5_HMAC_GENERAL',
    description: 'HMAC with MD5, truncated output length (historical)',
    family: 'hash',
  },
  0x00000240: {
    name: 'CKM_RIPEMD160',
    description: 'RIPEMD-160 message digest (historical)',
    family: 'hash',
  },
  0x00000241: {
    name: 'CKM_RIPEMD160_HMAC',
    description: 'HMAC with RIPEMD-160 (historical)',
    family: 'hash',
  },
  0x00000252: {
    name: 'CKM_SHA256_HMAC_GENERAL',
    description: 'HMAC-SHA-256 with truncated output length',
    family: 'hash',
  },
  0x00000262: {
    name: 'CKM_SHA384_HMAC_GENERAL',
    description: 'HMAC-SHA-384 with truncated output length',
    family: 'hash',
  },
  0x00000272: {
    name: 'CKM_SHA512_HMAC_GENERAL',
    description: 'HMAC-SHA-512 with truncated output length',
    family: 'hash',
  },
  0x000002b2: {
    name: 'CKM_SHA3_256_HMAC_GENERAL',
    description: 'HMAC-SHA3-256 with truncated output length',
    family: 'hash',
  },
  0x000002d2: {
    name: 'CKM_SHA3_512_HMAC_GENERAL',
    description: 'HMAC-SHA3-512 with truncated output length',
    family: 'hash',
  },
  // Full 0x390–0x39c digest-KDF block: the C++ engine's advertised list is
  // environment-dependent (OpenSSL probing) — the browser build advertises
  // CKM_SHAKE_256_KEY_DERIVATION where the Node build does not, so cover the
  // whole standard block rather than only the IDs one environment showed.
  0x00000390: {
    name: 'CKM_MD5_KEY_DERIVATION',
    description: 'Key derivation via MD5 digest (historical)',
    family: 'kdf',
  },
  0x00000391: {
    name: 'CKM_MD2_KEY_DERIVATION',
    description: 'Key derivation via MD2 digest (historical)',
    family: 'kdf',
  },
  0x00000392: {
    name: 'CKM_SHA1_KEY_DERIVATION',
    description: 'Key derivation via SHA-1 digest (PKCS#11 §2.42)',
    family: 'kdf',
  },
  0x00000393: {
    name: 'CKM_SHA256_KEY_DERIVATION',
    description: 'Key derivation via SHA-256 digest (PKCS#11 §2.42)',
    family: 'kdf',
  },
  0x00000396: {
    name: 'CKM_SHA224_KEY_DERIVATION',
    description: 'Key derivation via SHA-224 digest (PKCS#11 §2.42)',
    family: 'kdf',
  },
  0x00000398: {
    name: 'CKM_SHA3_224_KEY_DERIVATION',
    description: 'Key derivation via SHA3-224 digest (PKCS#11 §2.42)',
    family: 'kdf',
  },
  0x0000039b: {
    name: 'CKM_SHAKE_128_KEY_DERIVATION',
    description: 'Key derivation via SHAKE-128 XOF (PKCS#11 v3.2 §6.42)',
    family: 'kdf',
  },
  0x0000039c: {
    name: 'CKM_SHAKE_256_KEY_DERIVATION',
    description: 'Key derivation via SHAKE-256 XOF (PKCS#11 v3.2 §6.42)',
    family: 'kdf',
  },
  0x00000394: {
    name: 'CKM_SHA384_KEY_DERIVATION',
    description: 'Key derivation via SHA-384 digest (PKCS#11 §2.42)',
    family: 'kdf',
  },
  0x00000395: {
    name: 'CKM_SHA512_KEY_DERIVATION',
    description: 'Key derivation via SHA-512 digest (PKCS#11 §2.42)',
    family: 'kdf',
  },
  0x00000397: {
    name: 'CKM_SHA3_256_KEY_DERIVATION',
    description: 'Key derivation via SHA3-256 digest (PKCS#11 §2.42)',
    family: 'kdf',
  },
  0x00000399: {
    name: 'CKM_SHA3_384_KEY_DERIVATION',
    description: 'Key derivation via SHA3-384 digest (PKCS#11 §2.42)',
    family: 'kdf',
  },
  0x0000039a: {
    name: 'CKM_SHA3_512_KEY_DERIVATION',
    description: 'Key derivation via SHA3-512 digest (PKCS#11 §2.42)',
    family: 'kdf',
  },
  0x00001225: {
    name: 'CKM_CHACHA20_KEY_GEN',
    description: 'ChaCha20 key generation (RFC 8439)',
    family: 'symmetric',
  },
  0x00001226: {
    name: 'CKM_CHACHA20',
    description: 'ChaCha20 stream cipher (RFC 8439)',
    family: 'symmetric',
  },
  0x0000210b: {
    name: 'CKM_AES_KEY_WRAP_KWP',
    description: 'AES key wrapping with padding (NIST SP 800-38F §6.3, KWP)',
    family: 'symmetric',
  },
  0x00004021: {
    name: 'CKM_CHACHA20_POLY1305',
    description: 'ChaCha20-Poly1305 AEAD (RFC 8439)',
    family: 'symmetric',
  },
  0x00004032: {
    name: 'CKM_HSS_KEY_PAIR_GEN',
    description: 'HSS/LMS stateful hash-based key pair generation (PKCS#11 v3.2 §6.65)',
    family: 'pqc',
  },
  0x00004033: {
    name: 'CKM_HSS',
    description: 'HSS/LMS stateful hash-based signatures (RFC 8554, SP 800-208)',
    family: 'pqc',
  },
  0x00004034: {
    name: 'CKM_XMSS_KEY_PAIR_GEN',
    description: 'XMSS stateful hash-based key pair generation (PKCS#11 v3.2 §6.66)',
    family: 'pqc',
  },
  0x00004035: {
    name: 'CKM_XMSSMT_KEY_PAIR_GEN',
    description: 'XMSS^MT multi-tree key pair generation (PKCS#11 v3.2 §6.66)',
    family: 'pqc',
  },
  0x00004036: {
    name: 'CKM_XMSS',
    description: 'XMSS stateful hash-based signatures (RFC 8391, SP 800-208)',
    family: 'pqc',
  },
  0x00004037: {
    name: 'CKM_XMSSMT',
    description: 'XMSS^MT multi-tree stateful hash-based signatures (RFC 8391)',
    family: 'pqc',
  },
  // ── Vendor-defined: PQCToday KEMs (BSI TR-02102-1 §2.4) — Rust engine ────
  0x80000001: {
    name: 'CKM_PQCTODAY_FRODOKEM_KEY_PAIR_GEN',
    description: 'FrodoKEM key pair generation (BSI TR-02102-1 §2.4.1, vendor)',
    family: 'pqc',
  },
  0x80000002: {
    name: 'CKM_PQCTODAY_FRODOKEM_ENCAPSULATE',
    description: 'FrodoKEM encapsulation/decapsulation (BSI TR-02102-1 §2.4.1, vendor)',
    family: 'pqc',
  },
  0x80000003: {
    name: 'CKM_PQCTODAY_CLASSIC_MCELIECE_KEY_PAIR_GEN',
    description: 'Classic McEliece key pair generation (BSI TR-02102-1 §2.4.2, vendor)',
    family: 'pqc',
  },
  0x80000004: {
    name: 'CKM_PQCTODAY_CLASSIC_MCELIECE_ENCAPSULATE',
    description: 'Classic McEliece encapsulation/decapsulation (BSI TR-02102-1 §2.4.2, vendor)',
    family: 'pqc',
  },
  // ── Vendor-defined: digest / DH / HD-wallet extensions ───────────────────
  0x80000010: {
    name: 'CKM_KECCAK_256',
    description: 'Keccak-256 digest (Ethereum address derivation, vendor)',
    family: 'hash',
  },
  0x80000011: {
    name: 'CKM_EC_MONTGOMERY_KEY_DERIVE',
    description: 'ECDH derive for Montgomery-curve (X25519) keys (vendor alias)',
    family: 'kdf',
  },
  0x80001057: {
    name: 'CKM_EDDSA_PH',
    description: 'Ed25519ph prehashed EdDSA (RFC 8032; pkcs11t.h vendor codepoint)',
    family: 'asymmetric',
  },
  0x80001058: {
    name: 'CKM_X25519',
    description: 'X25519 key agreement (PKCS#11 v3.2 §6.7 vendor codepoint, RFC 7748)',
    family: 'kdf',
  },
  0x80001059: {
    name: 'CKM_X448',
    description: 'X448 key agreement (PKCS#11 v3.2 §6.7 vendor codepoint, RFC 7748)',
    family: 'kdf',
  },
  0x8000105b: {
    name: 'CKM_BIP32_MASTER_DERIVE',
    description: 'BIP32 master key derivation from seed (vendor)',
    family: 'kdf',
  },
  0x8000105c: {
    name: 'CKM_BIP32_CHILD_DERIVE',
    description: 'BIP32 hierarchical child key derivation (vendor)',
    family: 'kdf',
  },
}
