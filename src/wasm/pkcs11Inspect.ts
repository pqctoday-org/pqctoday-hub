// SPDX-License-Identifier: GPL-3.0-only
/**
 * PKCS#11 v3.2 parameter decoder — no React, no side effects.
 *
 * Reads WASM heap memory to decode CK_MECHANISM, CK_ATTRIBUTE templates, and
 * CK_SIGN_ADDITIONAL_CONTEXT into human-readable structures for the inspect panel.
 *
 * All WASM memory reads are wrapped in try/catch — the heap may have been freed
 * by the time the UI renders, so failures degrade gracefully to 'unknown'.
 *
 * Memory layout (32-bit Emscripten WASM):
 *   CK_ATTRIBUTE:               12 bytes  { type i32 @0, pValue i32 @4, ulValueLen i32 @8 }
 *   CK_MECHANISM:               12 bytes  { mechanism i32 @0, pParameter i32 @4, ulParameterLen i32 @8 }
 *   CK_SIGN_ADDITIONAL_CONTEXT: 12 bytes  { hedgeVariant i32 @0, pContext i32 @4, ulContextLen i32 @8 }
 */

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

// ── Exported types ────────────────────────────────────────────────────────────

export interface DecodedValue {
  kind: 'bool' | 'ulong' | 'constant' | 'bytes' | 'null'
  display: string // e.g. "CKO_PUBLIC_KEY (0x02)", "true", "1088 bytes"
  description?: string
}

export interface DecodedAttribute {
  typeHex: string // "0x00000000"
  typeName: string // "CKA_CLASS"
  typeDescription?: string
  value: DecodedValue
}

export interface DecodedSignParam {
  hedgeName: string
  hedgeDescription: string
  contextLen: number
  contextHex?: string // first 16 hex chars if contextLen > 0
}

export interface DecodedMechanism {
  typeHex: string
  name: string
  description?: string
  param?: DecodedSignParam
}

export interface InspectSection {
  label: string
  mechanism?: DecodedMechanism
  attributes?: DecodedAttribute[]
  primitives?: Array<{ name: string; value: string; note?: string }>
}

export interface Pkcs11LogInspect {
  inputs: InspectSection[]
  outputs?: Array<{ name: string; value: string; note?: string }>
  spec?: string
}

// ── Private constant tables ───────────────────────────────────────────────────

interface ConstEntry {
  name: string
  description?: string
}

// CKA_ attribute types
const CKA_TABLE: Record<number, ConstEntry> = {
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

// CKM_ mechanism types
const CKM_TABLE: Record<number, ConstEntry> = {
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

// CKO_ object classes
const CKO_TABLE: Record<number, ConstEntry> = {
  0x00: { name: 'CKO_DATA', description: 'Opaque data object' },
  0x01: { name: 'CKO_CERTIFICATE', description: 'Certificate object' },
  0x02: { name: 'CKO_PUBLIC_KEY', description: 'Public key — encapsulate / verify operations' },
  0x03: { name: 'CKO_PRIVATE_KEY', description: 'Private key — decapsulate / sign operations' },
  0x04: { name: 'CKO_SECRET_KEY', description: 'Symmetric / shared-secret key' },
}

// CKK_ key types
const CKK_TABLE: Record<number, ConstEntry> = {
  0x00: { name: 'CKK_RSA' },
  0x03: { name: 'CKK_EC' },
  0x10: { name: 'CKK_GENERIC_SECRET', description: 'Generic secret key (HMAC, KDF base)' },
  0x1f: { name: 'CKK_AES', description: 'AES symmetric key' },
  0x40: { name: 'CKK_EC_EDWARDS', description: 'Edwards-curve key (Ed25519/Ed448)' },
  0x49: { name: 'CKK_ML_KEM', description: 'ML-KEM (FIPS 203)' },
  0x4a: { name: 'CKK_ML_DSA', description: 'ML-DSA (FIPS 204)' },
  0x4b: { name: 'CKK_SLH_DSA', description: 'SLH-DSA (FIPS 205)' },
}

// CKH_ hedging variants
const CKH_TABLE: Record<number, ConstEntry> = {
  0x00: {
    name: 'CKH_HEDGE_PREFERRED',
    description: 'Hedged randomness used if available; deterministic fallback allowed',
  },
  0x01: {
    name: 'CKH_HEDGE_REQUIRED',
    description: 'Hedged randomness required — deterministic forbidden (FIPS 204 §3.5)',
  },
  0x02: {
    name: 'CKH_DETERMINISTIC_REQUIRED',
    description: 'Deterministic signing required — no randomness injected',
  },
}

// CKU_ user types
const CKU_TABLE: Record<number, ConstEntry> = {
  0: { name: 'CKU_SO', description: 'Security Officer — initialises tokens and user PINs' },
  1: { name: 'CKU_USER', description: 'Normal user — cryptographic operations' },
  2: { name: 'CKU_CONTEXT_SPECIFIC', description: 'Context-specific login (two-factor)' },
}

// CKP_ ML-KEM parameter sets (FIPS 203 Table 3: ct, ek, dk sizes)
const CKP_ML_KEM: Record<number, ConstEntry> = {
  0x1: {
    name: 'CKP_ML_KEM_512',
    description: 'NIST Level 1 — 768-byte ct, 800-byte ek, 1632-byte dk',
  },
  0x2: {
    name: 'CKP_ML_KEM_768',
    description: 'NIST Level 3 — 1088-byte ct, 1184-byte ek, 2400-byte dk',
  },
  0x3: {
    name: 'CKP_ML_KEM_1024',
    description: 'NIST Level 5 — 1568-byte ct, 1568-byte ek, 3168-byte dk',
  },
}

// CKP_ ML-DSA parameter sets
const CKP_ML_DSA: Record<number, ConstEntry> = {
  0x1: { name: 'CKP_ML_DSA_44', description: 'NIST Level 2 — 2420-byte signature' },
  0x2: { name: 'CKP_ML_DSA_65', description: 'NIST Level 3 — 3309-byte signature' },
  0x3: { name: 'CKP_ML_DSA_87', description: 'NIST Level 5 — 4627-byte signature' },
}

// CKP_ SLH-DSA parameter sets (pkcs11t.h ordering: interleaved SHA2/SHAKE per security level)
const CKP_SLH_DSA: Record<number, ConstEntry> = {
  0x1: { name: 'CKP_SLH_DSA_SHA2_128S', description: 'NIST Level 1 — 7856-byte signature, SHA2' },
  0x2: { name: 'CKP_SLH_DSA_SHAKE_128S', description: 'NIST Level 1 — 7856-byte signature, SHAKE' },
  0x3: {
    name: 'CKP_SLH_DSA_SHA2_128F',
    description: 'NIST Level 1 — 17088-byte signature, SHA2 (fast)',
  },
  0x4: {
    name: 'CKP_SLH_DSA_SHAKE_128F',
    description: 'NIST Level 1 — 17088-byte signature, SHAKE (fast)',
  },
  0x5: { name: 'CKP_SLH_DSA_SHA2_192S', description: 'NIST Level 3 — 16224-byte signature, SHA2' },
  0x6: {
    name: 'CKP_SLH_DSA_SHAKE_192S',
    description: 'NIST Level 3 — 16224-byte signature, SHAKE',
  },
  0x7: {
    name: 'CKP_SLH_DSA_SHA2_192F',
    description: 'NIST Level 3 — 35664-byte signature, SHA2 (fast)',
  },
  0x8: {
    name: 'CKP_SLH_DSA_SHAKE_192F',
    description: 'NIST Level 3 — 35664-byte signature, SHAKE (fast)',
  },
  0x9: { name: 'CKP_SLH_DSA_SHA2_256S', description: 'NIST Level 5 — 29792-byte signature, SHA2' },
  0xa: {
    name: 'CKP_SLH_DSA_SHAKE_256S',
    description: 'NIST Level 5 — 29792-byte signature, SHAKE',
  },
  0xb: {
    name: 'CKP_SLH_DSA_SHA2_256F',
    description: 'NIST Level 5 — 49856-byte signature, SHA2 (fast)',
  },
  0xc: {
    name: 'CKP_SLH_DSA_SHAKE_256F',
    description: 'NIST Level 5 — 49856-byte signature, SHAKE (fast)',
  },
}

// CKF_ session flags bitmask (CK_FLAGS)
const CKF_SESSION_FLAGS: Array<{ bit: number; name: string; description?: string }> = [
  { bit: 0x0002, name: 'CKF_RW_SESSION', description: 'Read/write session' },
  { bit: 0x0004, name: 'CKF_SERIAL_SESSION', description: 'Serial session (required by PKCS#11)' },
]

// CKR_ return value descriptions (for PkcsLogPanel error display)
export const CKR_TABLE: Record<number, { name: string; description: string; hint?: string }> = {
  0x00: { name: 'CKR_OK', description: 'Operation succeeded' },
  0x01: { name: 'CKR_CANCEL', description: 'Operation was cancelled' },
  0x02: { name: 'CKR_HOST_MEMORY', description: 'Insufficient host memory', hint: 'Try a smaller key size or free browser memory' },
  0x03: { name: 'CKR_SLOT_ID_INVALID', description: 'Slot ID does not exist', hint: 'Initialize the module first via C_Initialize' },
  0x05: { name: 'CKR_GENERAL_ERROR', description: 'Unspecified internal error', hint: 'Re-initialize the module and retry' },
  0x06: { name: 'CKR_FUNCTION_FAILED', description: 'Function failed for an internal reason', hint: 'Check the PKCS#11 log for preceding calls that may have left bad state' },
  0x07: { name: 'CKR_ARGUMENTS_BAD', description: 'Invalid arguments passed to the function', hint: 'Verify all parameters: handles, buffers, and template attributes' },
  0x10: { name: 'CKR_ATTRIBUTE_READ_ONLY', description: 'Attribute cannot be modified', hint: 'This attribute was set at key creation and is immutable' },
  0x11: { name: 'CKR_ATTRIBUTE_SENSITIVE', description: 'Attribute cannot be read (sensitive)', hint: 'The key has CKA_SENSITIVE=true — extracting its value is not allowed' },
  0x12: { name: 'CKR_ATTRIBUTE_TYPE_INVALID', description: 'Unknown or unsupported attribute type', hint: 'Check that the CKA_* type is supported by this mechanism' },
  0x13: { name: 'CKR_ATTRIBUTE_VALUE_INVALID', description: 'Attribute value is out of range or malformed', hint: 'Verify the attribute value matches the expected type and constraints' },
  0x1b: { name: 'CKR_ACTION_PROHIBITED', description: 'Action not allowed by token policy' },
  0x20: { name: 'CKR_DATA_INVALID', description: 'Input data is invalid for this operation' },
  0x21: { name: 'CKR_DATA_LEN_RANGE', description: 'Input data length is outside allowed range', hint: 'Check minimum/maximum data length for this mechanism' },
  0x40: { name: 'CKR_ENCRYPTED_DATA_INVALID', description: 'Ciphertext is corrupted or invalid' },
  0x41: { name: 'CKR_ENCRYPTED_DATA_LEN_RANGE', description: 'Ciphertext length is outside allowed range' },
  0x42: { name: 'CKR_AEAD_DECRYPT_FAILED', description: 'AEAD authentication tag verification failed', hint: 'The ciphertext was modified or the wrong key/IV was used' },
  0x54: { name: 'CKR_FUNCTION_NOT_SUPPORTED', description: 'This PKCS#11 function is not implemented', hint: 'The HSM module does not support this operation' },
  0x60: { name: 'CKR_KEY_HANDLE_INVALID', description: 'Key handle does not exist or has been destroyed', hint: 'Generate a new key or check the key store' },
  0x62: { name: 'CKR_KEY_SIZE_RANGE', description: 'Key size is outside the allowed range for this mechanism', hint: 'Check CKA_VALUE_LEN against the mechanism\'s supported key sizes' },
  0x63: { name: 'CKR_KEY_TYPE_INCONSISTENT', description: 'Key type does not match the mechanism', hint: 'Use a key type that matches the algorithm (e.g., CKK_AES for AES mechanisms)' },
  0x68: { name: 'CKR_KEY_FUNCTION_NOT_PERMITTED', description: 'Key attributes do not permit this operation', hint: 'Check CKA_ENCRYPT, CKA_DECRYPT, CKA_SIGN, CKA_VERIFY, CKA_WRAP, CKA_UNWRAP flags on the key' },
  0x6a: { name: 'CKR_KEY_UNEXTRACTABLE', description: 'Key has CKA_EXTRACTABLE=false', hint: 'Generate a new key with CKA_EXTRACTABLE=true if you need to export it' },
  0x70: { name: 'CKR_MECHANISM_INVALID', description: 'Mechanism is not supported by this token', hint: 'Check supported mechanisms via C_GetMechanismList' },
  0x71: { name: 'CKR_MECHANISM_PARAM_INVALID', description: 'Mechanism parameters are invalid', hint: 'Verify the parameter struct matches what the mechanism expects' },
  0x82: { name: 'CKR_OBJECT_HANDLE_INVALID', description: 'Object handle does not exist' },
  0x90: { name: 'CKR_OPERATION_ACTIVE', description: 'An operation is already active on this session', hint: 'Finalize or cancel the current operation before starting a new one' },
  0x91: { name: 'CKR_OPERATION_NOT_INITIALIZED', description: 'No operation was initialized', hint: 'Call the Init function (e.g., C_SignInit) before the operation function' },
  0xa0: { name: 'CKR_PIN_INCORRECT', description: 'PIN is wrong', hint: 'Use the correct user PIN (default: "1234" for this HSM emulator)' },
  0xa1: { name: 'CKR_PIN_INVALID', description: 'PIN format is invalid' },
  0xb0: { name: 'CKR_SESSION_CLOSED', description: 'Session has been closed', hint: 'Open a new session with C_OpenSession' },
  0xb3: { name: 'CKR_SESSION_HANDLE_INVALID', description: 'Session handle does not exist', hint: 'Open a new session or verify the handle from C_OpenSession' },
  0xb5: { name: 'CKR_SESSION_READ_ONLY', description: 'Session is read-only but a write operation was attempted', hint: 'Open a R/W session with CKF_RW_SESSION flag' },
  0xc0: { name: 'CKR_SIGNATURE_INVALID', description: 'Signature verification failed', hint: 'The data, key, or signature may have been modified' },
  0xc1: { name: 'CKR_SIGNATURE_LEN_RANGE', description: 'Signature length is outside allowed range' },
  0xd0: { name: 'CKR_TEMPLATE_INCOMPLETE', description: 'Required attributes are missing from the template', hint: 'Add all required CKA_* attributes for this object type' },
  0xd1: { name: 'CKR_TEMPLATE_INCONSISTENT', description: 'Template attributes conflict with each other' },
  0xe0: { name: 'CKR_TOKEN_NOT_PRESENT', description: 'Token is not present in the slot', hint: 'Initialize the module first' },
  0x100: { name: 'CKR_USER_ALREADY_LOGGED_IN', description: 'A user is already logged in to this session' },
  0x101: { name: 'CKR_USER_NOT_LOGGED_IN', description: 'Login required before this operation', hint: 'Call C_Login with CKU_USER and your PIN' },
  0x150: { name: 'CKR_BUFFER_TOO_SMALL', description: 'Output buffer is too small for the result', hint: 'This is normal for two-pass calls — the first call returns the required size' },
  0x190: { name: 'CKR_CRYPTOKI_NOT_INITIALIZED', description: 'C_Initialize has not been called', hint: 'Call C_Initialize before any other PKCS#11 function' },
  0x191: { name: 'CKR_CRYPTOKI_ALREADY_INITIALIZED', description: 'C_Initialize was already called' },
  0x200: { name: 'CKR_FUNCTION_REJECTED', description: 'Function was rejected by policy' },
}

/** Look up a CKR_* return value. Returns name, description, and optional remediation hint. */
export const lookupCkr = (rv: number): { name: string; description: string; hint?: string } => {
  const entry = CKR_TABLE[rv]
  if (entry) return entry
  return { name: `CKR_UNKNOWN (0x${rv.toString(16).padStart(8, '0')})`, description: 'Unknown return value' }
}

// ── Private helpers ───────────────────────────────────────────────────────────

/** Safely read a 32-bit little-endian integer from WASM heap. Returns null on failure. */
const safeRead32 = (M: SoftHSMModule, ptr: number): number | null => {
  try {
    if (!ptr || !M.HEAPU8) return null
    return M.getValue(ptr, 'i32') >>> 0
  } catch {
    return null
  }
}

/** Decode a CK_FLAGS bitmask into flag names. */
const decodeFlagsBitmask = (flags: number): string => {
  const active = CKF_SESSION_FLAGS.filter((f) => flags & f.bit).map((f) => f.name)
  const raw = `0x${flags.toString(16).padStart(8, '0')}`
  return active.length > 0 ? `${active.join(' | ')} (${raw})` : raw
}

/** Determine algo context from mechanism type (for CKP_ dispatch). */
type AlgoContext = 'ml-kem' | 'ml-dsa' | 'slh-dsa' | undefined

const algoFromMechType = (mechType: number): AlgoContext => {
  if (mechType === 0x0000000f || mechType === 0x00000017) return 'ml-kem'
  if (mechType >= 0x0000001c && mechType <= 0x0000002c) return 'ml-dsa'
  if (mechType >= 0x0000002d && mechType <= 0x0000003f) return 'slh-dsa'
  return undefined
}

/**
 * Module-level state: tracks the algorithm used by the last C_MessageSignInit /
 * C_MessageVerifyInit so that subsequent C_SignMessage / C_VerifyMessage decoders
 * can display the correct FIPS spec reference (204 for ML-DSA, 205 for SLH-DSA).
 */
let _lastMessageAlgo: AlgoContext = undefined

/**
 * Decode a ulong attribute value into a symbolic constant where applicable.
 * `algo` provides context for CKA_PARAMETER_SET dispatch.
 */
const decodeUlongAttr = (attrType: number, v: number, algo: AlgoContext): DecodedValue => {
  const hex = `0x${v.toString(16).padStart(2, '0')}`
  if (attrType === 0x00000000 /* CKA_CLASS */) {
    const entry = CKO_TABLE[v]
    return entry
      ? { kind: 'constant', display: `${entry.name} (${hex})`, description: entry.description }
      : { kind: 'ulong', display: hex }
  }
  if (attrType === 0x00000100 /* CKA_KEY_TYPE */) {
    const entry = CKK_TABLE[v]
    return entry
      ? { kind: 'constant', display: `${entry.name} (${hex})`, description: entry.description }
      : { kind: 'ulong', display: hex }
  }
  if (attrType === 0x0000061d /* CKA_PARAMETER_SET */) {
    const table =
      algo === 'ml-kem'
        ? CKP_ML_KEM
        : algo === 'ml-dsa'
          ? CKP_ML_DSA
          : algo === 'slh-dsa'
            ? CKP_SLH_DSA
            : null
    const entry = table ? table[v] : null
    return entry
      ? { kind: 'constant', display: `${entry.name} (${hex})`, description: entry.description }
      : { kind: 'ulong', display: hex }
  }
  return { kind: 'ulong', display: `${v} (${hex})` }
}

/** Return true if the mechanism type uses CK_SIGN_ADDITIONAL_CONTEXT as its parameter. */
const isPqcSignMech = (mechType: number): boolean =>
  (mechType >= 0x0000001c && mechType <= 0x0000002c) || // ML-DSA range
  (mechType >= 0x0000002d && mechType <= 0x0000003f) // SLH-DSA range

// ── WASM memory readers ───────────────────────────────────────────────────────

/**
 * Read a CK_SIGN_ADDITIONAL_CONTEXT from WASM heap.
 * Layout: hedgeVariant i32 @0, pContext i32 @4, ulContextLen i32 @8
 */
const readSignParam = (M: SoftHSMModule, ptr: number, len: number): DecodedSignParam | null => {
  if (!ptr || len < 12) return null
  try {
    const hedgeVariant = safeRead32(M, ptr)
    const contextPtr = safeRead32(M, ptr + 4)
    const contextLen = safeRead32(M, ptr + 8)
    if (hedgeVariant === null || contextLen === null) return null

    const hedgeEntry = CKH_TABLE[hedgeVariant]
    const result: DecodedSignParam = {
      hedgeName: hedgeEntry?.name ?? `0x${hedgeVariant.toString(16).padStart(2, '0')}`,
      hedgeDescription: hedgeEntry?.description ?? 'Unknown hedge variant',
      contextLen: contextLen ?? 0,
    }

    if (contextLen && contextLen > 0 && contextPtr) {
      try {
        const bytes = M.HEAPU8.slice(contextPtr, contextPtr + Math.min(contextLen, 8))
        result.contextHex = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      } catch {
        // context bytes unavailable
      }
    }

    return result
  } catch {
    return null
  }
}

/**
 * Read a CK_MECHANISM struct from WASM heap.
 * Layout: mechanism i32 @0, pParameter i32 @4, ulParameterLen i32 @8
 *
 * Only decodes CK_SIGN_ADDITIONAL_CONTEXT for PQC signing mechanisms (ML-DSA/SLH-DSA).
 * Other mechanism parameters (RSA-OAEP, AES-GCM, ECDH, etc.) have different layouts.
 */
const readMechanism = (M: SoftHSMModule, ptr: number): DecodedMechanism | null => {
  if (!ptr) return null
  try {
    const mechType = safeRead32(M, ptr)
    const paramPtr = safeRead32(M, ptr + 4)
    const paramLen = safeRead32(M, ptr + 8)
    if (mechType === null) return null

    const mechHex = `0x${mechType.toString(16).padStart(8, '0')}`
    const entry = CKM_TABLE[mechType]
    const result: DecodedMechanism = {
      typeHex: mechHex,
      name: entry?.name ?? mechHex,
      description: entry?.description,
    }

    // Only decode CK_SIGN_ADDITIONAL_CONTEXT for PQC signing mechanisms
    if (paramPtr && paramLen && paramLen >= 12 && isPqcSignMech(mechType)) {
      result.param = readSignParam(M, paramPtr, paramLen) ?? undefined
    }

    return result
  } catch {
    return null
  }
}

/**
 * Read N × CK_ATTRIBUTE structs from WASM heap.
 * Layout per entry: type i32 @0, pValue i32 @4, ulValueLen i32 @8
 */
const CK_ATTR_SIZE = 12
const readTemplate = (
  M: SoftHSMModule,
  ptr: number,
  count: number,
  algo: AlgoContext = undefined
): DecodedAttribute[] => {
  if (!ptr || count <= 0 || count > 64) return []
  const result: DecodedAttribute[] = []
  try {
    for (let i = 0; i < count; i++) {
      const base = ptr + i * CK_ATTR_SIZE
      const attrType = safeRead32(M, base)
      const valPtr = safeRead32(M, base + 4)
      const valLen = safeRead32(M, base + 8)
      if (attrType === null) continue

      const typeHex = `0x${attrType.toString(16).padStart(8, '0')}`
      const typeEntry = CKA_TABLE[attrType]
      let value: DecodedValue

      if (valLen === null || valLen === 0 || !valPtr) {
        value = { kind: 'null', display: '— (size query / empty)' }
      } else if (valLen === 1) {
        // bool
        try {
          const b = M.HEAPU8[valPtr]
          value = { kind: 'bool', display: b ? 'true' : 'false' }
        } catch {
          value = { kind: 'null', display: 'unreadable' }
        }
      } else if (valLen === 4) {
        // ulong — may encode a constant
        const v = safeRead32(M, valPtr)
        if (v !== null) {
          value = decodeUlongAttr(attrType, v, algo)
        } else {
          value = { kind: 'null', display: 'unreadable' }
        }
      } else {
        // raw bytes
        const maxPreview = 8
        const preview = Math.min(valLen, maxPreview)
        let hexSnippet = ''
        try {
          hexSnippet = Array.from(M.HEAPU8.slice(valPtr, valPtr + preview))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          if (valLen > maxPreview) hexSnippet += '…'
        } catch {
          hexSnippet = '(unreadable)'
        }
        value = { kind: 'bytes', display: `${valLen} bytes  [${hexSnippet}]` }
      }

      result.push({
        typeHex,
        typeName: typeEntry?.name ?? `CKA_0x${attrType.toString(16)}`,
        typeDescription: typeEntry?.description,
        value,
      })
    }
  } catch {
    // partial read — return what we have
  }
  return result
}

// ── Spec reference helpers ────────────────────────────────────────────────────

/** Return the appropriate spec string for message-based signing based on algo context. */
const signSpec = (algo: AlgoContext, isVerify: boolean): string => {
  const section = isVerify ? '§5.21' : '§5.20'
  if (algo === 'ml-dsa')
    return `PKCS#11 v3.2 ${section} · FIPS 204 Algorithm ${isVerify ? '3 (ML-DSA.Verify)' : '2 (ML-DSA.Sign)'}`
  if (algo === 'slh-dsa')
    return `PKCS#11 v3.2 ${section} · FIPS 205 (SLH-DSA.${isVerify ? 'Verify' : 'Sign'})`
  return `PKCS#11 v3.2 ${section}`
}

// ── Per-function decoders ─────────────────────────────────────────────────────

/** C_OpenSession(slotID, flags, pApp, Notify, phSession) */
const decodeOpenSession = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const flags = args[1] ?? 0
  const phSession = args[4] ?? 0
  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'slotID', value: String(args[0] ?? '?') },
        { name: 'flags', value: decodeFlagsBitmask(flags) },
      ],
    },
  ]
  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0 && phSession) {
    const hSession = safeRead32(M, phSession)
    if (hSession !== null) outputs.push({ name: '*phSession', value: String(hSession) })
  }
  return { inputs, outputs: outputs.length ? outputs : undefined }
}

/** C_Login(hSession, userType, pPin, ulPinLen) */
const decodeLogin = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const userType = args[1] ?? 0
  const entry = CKU_TABLE[userType]
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [
          { name: 'hSession', value: String(args[0] ?? '?') },
          {
            name: 'userType',
            value: entry ? `${entry.name} (${userType})` : `${userType}`,
            note: entry?.description,
          },
          { name: 'ulPinLen', value: String(args[3] ?? '?') },
        ],
      },
    ],
  }
}

/** C_InitToken(slotID, pPin, ulPinLen, pLabel) */
const decodeInitToken = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const labelPtr = args[3] ?? 0
  let label = '?'
  if (labelPtr) {
    try {
      const bytes = M.HEAPU8.slice(labelPtr, labelPtr + 32)
      label = `"${new TextDecoder().decode(bytes).replace(/\x00/g, '').trimEnd()}"`
    } catch {
      label = '(unreadable)'
    }
  }
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [
          { name: 'slotID', value: String(args[0] ?? '?') },
          { name: 'ulPinLen', value: String(args[2] ?? '?') },
          { name: 'pLabel', value: label, note: '32-byte blank-padded UTF-8 field' },
        ],
      },
    ],
  }
}

/**
 * C_GenerateKeyPair(hSession, pMechanism, pPubTemplate, ulPubCount,
 *                   pPrvTemplate, ulPrvCount, phPubKey, phPrvKey)
 */
const decodeGenerateKeyPair = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const algo = mech ? algoFromMechType(parseInt(mech.typeHex, 16)) : undefined

  const pubTmpl = readTemplate(M, args[2] ?? 0, args[3] ?? 0, algo)
  const prvTmpl = readTemplate(M, args[4] ?? 0, args[5] ?? 0, algo)

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  if (pubTmpl.length) inputs.push({ label: 'Public Key Template', attributes: pubTmpl })
  if (prvTmpl.length) inputs.push({ label: 'Private Key Template', attributes: prvTmpl })

  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0) {
    const phPub = args[6] ?? 0
    const phPrv = args[7] ?? 0
    if (phPub) {
      const h = safeRead32(M, phPub)
      if (h !== null) outputs.push({ name: '*phPubKey', value: String(h) })
    }
    if (phPrv) {
      const h = safeRead32(M, phPrv)
      if (h !== null) outputs.push({ name: '*phPrivKey', value: String(h) })
    }
  }

  const algoSpecMap: Record<string, string> = {
    'ml-kem': 'PKCS#11 v3.2 §5.14 · FIPS 203 §4 (ML-KEM key generation)',
    'ml-dsa': 'PKCS#11 v3.2 §5.14 · FIPS 204 §5 (ML-DSA key generation)',
    'slh-dsa': 'PKCS#11 v3.2 §5.14 · FIPS 205 (SLH-DSA key generation)',
  }
  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: algo ? algoSpecMap[algo] : 'PKCS#11 v3.2 §5.14',
  }
}

/** C_GenerateKey(hSession, pMechanism, pTemplate, ulCount, phKey) */
const decodeGenerateKey = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const tmpl = readTemplate(M, args[2] ?? 0, args[3] ?? 0)

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  if (tmpl.length) inputs.push({ label: 'Key Template', attributes: tmpl })

  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0 && args[4]) {
    const h = safeRead32(M, args[4])
    if (h !== null) outputs.push({ name: '*phKey', value: String(h) })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.14 (C_GenerateKey)',
  }
}

/**
 * C_EncapsulateKey(hSession, pMechanism, hPublicKey, pTemplate, ulAttrCount,
 *                  pCiphertext, pulCiphertextLen, phKey)
 * Note: pCiphertext=0 on the size-query call; pulCiphertextLen is always a valid pointer.
 */
const decodeEncapsulateKey = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hPublicKey = args[2] ?? 0
  const secretTmpl = readTemplate(M, args[3] ?? 0, args[4] ?? 0, 'ml-kem')
  const ctPtr = args[5] ?? 0
  const ctLenPtr = args[6] ?? 0

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [
      { name: 'hPublicKey', value: String(hPublicKey) },
      {
        name: 'pCiphertext',
        value: ctPtr === 0 ? 'NULL (size query)' : `0x${ctPtr.toString(16)}`,
        note: ctPtr === 0 ? 'Two-step: call with NULL first to get ciphertext length' : undefined,
      },
    ],
  })
  if (secretTmpl.length) inputs.push({ label: 'Secret Key Template', attributes: secretTmpl })

  const outputs: Pkcs11LogInspect['outputs'] = []
  // rv=0 (CKR_OK) on real encapsulation; rv=0x150 (CKR_BUFFER_TOO_SMALL) on size query
  const isOk = rv === 0 || rv === 0x150
  if (isOk && ctLenPtr) {
    const ctLen = safeRead32(M, ctLenPtr)
    if (ctLen !== null) outputs.push({ name: '*pulCiphertextLen', value: `${ctLen} bytes` })
  }
  if (rv === 0 && args[7]) {
    const phKey = safeRead32(M, args[7])
    if (phKey !== null)
      outputs.push({ name: '*phKey', value: String(phKey), note: 'Shared secret handle' })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.25 (new in v3.2) · FIPS 203 Algorithm 17 (ML-KEM.Encaps)',
  }
}

/**
 * C_DecapsulateKey(hSession, pMechanism, hPrivateKey, pTemplate, ulAttrCount,
 *                  pCiphertext, ulCiphertextLen, phKey)
 * Note: args[6] is a VALUE (not a pointer) — direct ciphertext length.
 */
const decodeDecapsulateKey = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hPrivateKey = args[2] ?? 0
  const secretTmpl = readTemplate(M, args[3] ?? 0, args[4] ?? 0, 'ml-kem')
  const ctLen = args[6] ?? 0 // direct value, not pointer

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [
      { name: 'hPrivateKey', value: String(hPrivateKey) },
      { name: 'ulCiphertextLen', value: `${ctLen} bytes` },
    ],
  })
  if (secretTmpl.length) inputs.push({ label: 'Secret Key Template', attributes: secretTmpl })

  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0 && args[7]) {
    const phKey = safeRead32(M, args[7])
    if (phKey !== null)
      outputs.push({ name: '*phKey', value: String(phKey), note: 'Shared secret handle' })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.26 (new in v3.2) · FIPS 203 Algorithm 18 (ML-KEM.Decaps)',
  }
}

/**
 * C_GetAttributeValue(hSession, hObject, pTemplate, ulCount)
 * Reads the template attributes (post-call, may contain output sizes).
 */
const decodeGetAttributeValue = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const hObject = args[1] ?? 0
  const tmpl = readTemplate(M, args[2] ?? 0, args[3] ?? 0)
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [{ name: 'hObject', value: String(hObject) }],
      },
      ...(tmpl.length ? [{ label: 'Attribute Template', attributes: tmpl }] : []),
    ],
  }
}

/**
 * C_MessageSignInit(hSession, pMechanism, hKey)
 * C_MessageVerifyInit(hSession, pMechanism, hKey)
 * The CK_SIGN_ADDITIONAL_CONTEXT (hedge + context) is embedded in pMechanism.pParameter.
 */
const decodeMessageSignVerifyInit = (
  M: SoftHSMModule,
  args: number[],
  isVerify: boolean
): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hKey = args[2] ?? 0
  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [{ name: isVerify ? 'hVerifyKey' : 'hSignKey', value: String(hKey) }],
  })

  // Track the algorithm for subsequent C_SignMessage/C_VerifyMessage decoders
  const algo = mech ? algoFromMechType(parseInt(mech.typeHex, 16)) : undefined
  _lastMessageAlgo = algo

  return {
    inputs,
    spec: signSpec(algo, isVerify),
  }
}

/**
 * C_SignMessage(hSession, pParameter, ulParameterLen, pData, ulDataLen, pSignature, pulSignatureLen)
 * In this codebase pParameter=0/ulParameterLen=0 (sign context is in mechanism, not here).
 */
const decodeSignMessage = (_M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const dataLen = args[4] ?? 0
  const pSignature = args[5] ?? 0
  const sigLenPtr = args[6] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        {
          name: 'pSignature',
          value: pSignature === 0 ? 'NULL (size query)' : `0x${pSignature.toString(16)}`,
          note:
            pSignature === 0
              ? 'Two-step: call with NULL pSignature first to get signature length'
              : undefined,
        },
      ],
    },
  ]

  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && sigLenPtr) {
    const sigLen = safeRead32(_M, sigLenPtr)
    if (sigLen !== null) outputs.push({ name: '*pulSignatureLen', value: `${sigLen} bytes` })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: signSpec(_lastMessageAlgo, false),
  }
}

/**
 * C_VerifyMessage(hSession, pParameter, ulParameterLen, pData, ulDataLen, pSignature, ulSignatureLen)
 */
const decodeVerifyMessage = (_M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const dataLen = args[4] ?? 0
  const sigLen = args[6] ?? 0
  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        { name: 'ulSignatureLen', value: `${sigLen} bytes` },
      ],
    },
  ]
  return {
    inputs,
    outputs:
      rv === 0
        ? [{ name: 'Verification', value: 'VALID — signature matches message', note: 'CKR_OK' }]
        : rv === 0xc0
          ? [
              {
                name: 'Verification',
                value: 'INVALID — signature does not match',
                note: 'CKR_SIGNATURE_INVALID',
              },
            ]
          : undefined,
    spec: signSpec(_lastMessageAlgo, true),
  }
}

/**
 * C_MessageSignFinal(hSession, pParameter, ulParameterLen, pulSignatureLen)
 * Completes a multi-part message signing sequence.
 */
const decodeSignFinal = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const sigLenPtr = args[3] ?? 0
  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && sigLenPtr) {
    const sigLen = safeRead32(M, sigLenPtr)
    if (sigLen !== null) outputs.push({ name: '*pulSignatureLen', value: `${sigLen} bytes` })
  }
  return {
    inputs: [{ label: 'Parameters', primitives: [{ name: '(multi-part finalize)', value: '' }] }],
    outputs: outputs.length ? outputs : undefined,
    spec: signSpec(_lastMessageAlgo, false),
  }
}

// ── Session lifecycle decoders ────────────────────────────────────────────────

/** C_Initialize(pInitArgs) — §5.1 */
const decodeInitialize = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [
        {
          name: 'pInitArgs',
          value: args[0] ? `0x${(args[0] >>> 0).toString(16)}` : 'NULL',
          note: args[0]
            ? 'CK_C_INITIALIZE_ARGS pointer'
            : 'Default initialization (no threading callbacks)',
        },
      ],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.1 (C_Initialize)',
})

/** C_Finalize(pReserved) — §5.2 */
const decodeFinalize = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [
        {
          name: 'pReserved',
          value: args[0] ? `0x${(args[0] >>> 0).toString(16)}` : 'NULL',
          note: 'Must be NULL in PKCS#11 v3.2',
        },
      ],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.2 (C_Finalize)',
})

/** C_GetSlotList(tokenPresent, pSlotList, pulCount) — §5.3 */
const decodeGetSlotList = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const tokenPresent = args[0] ?? 0
  const pSlotList = args[1] ?? 0
  const pulCount = args[2] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        {
          name: 'tokenPresent',
          value: tokenPresent ? 'CK_TRUE' : 'CK_FALSE',
          note: tokenPresent ? 'Only slots with initialized tokens' : 'All slots',
        },
        {
          name: 'pSlotList',
          value: pSlotList === 0 ? 'NULL (count query)' : `0x${pSlotList.toString(16)}`,
          note: pSlotList === 0 ? 'Two-step: call with NULL first to get slot count' : undefined,
        },
      ],
    },
  ]

  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && pulCount) {
    const count = safeRead32(M, pulCount)
    if (count !== null)
      outputs.push({ name: '*pulCount', value: String(count), note: 'Number of slots' })
  }
  if (rv === 0 && pSlotList) {
    const firstSlot = safeRead32(M, pSlotList)
    if (firstSlot !== null) outputs.push({ name: 'pSlotList[0]', value: String(firstSlot) })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.3 (C_GetSlotList)',
  }
}

/** C_CloseSession(hSession) — §5.6 */
const decodeCloseSession = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [{ name: 'hSession', value: String(args[0] ?? '?') }],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.6 (C_CloseSession)',
})

/** C_InitPIN(hSession, pPin, ulPinLen) — §5.8 */
const decodeInitPIN = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [
        { name: 'hSession', value: String(args[0] ?? '?') },
        { name: 'ulPinLen', value: String(args[2] ?? '?') },
      ],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.8 (C_InitPIN — sets normal user PIN)',
})

/** C_Logout(hSession) — §5.10 */
const decodeLogout = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [{ name: 'hSession', value: String(args[0] ?? '?') }],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.10 (C_Logout)',
})

/** C_MessageVerifyFinal(hSession) — §5.21 */
const decodeVerifyFinal = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [{ name: 'hSession', value: String(args[0] ?? '?') }],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.21 (C_MessageVerifyFinal — closes multi-message verify context)',
})

// ── Classical crypto decoders ─────────────────────────────────────────────────

/** C_SignInit(hSession, pMechanism, hKey) — §5.18 */
const decodeSignInit = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hKey = args[2] ?? 0
  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [{ name: 'hKey', value: String(hKey) }],
  })
  return { inputs, spec: 'PKCS#11 v3.2 §5.18 (C_SignInit)' }
}

/** C_Sign(hSession, pData, ulDataLen, pSignature, pulSignatureLen) — §5.18 */
const decodeSign = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const dataLen = args[2] ?? 0
  const pSignature = args[3] ?? 0
  const sigLenPtr = args[4] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        {
          name: 'pSignature',
          value: pSignature === 0 ? 'NULL (size query)' : `0x${pSignature.toString(16)}`,
          note:
            pSignature === 0 ? 'Two-step: call with NULL first to get signature length' : undefined,
        },
      ],
    },
  ]

  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && sigLenPtr) {
    const sigLen = safeRead32(M, sigLenPtr)
    if (sigLen !== null) outputs.push({ name: '*pulSignatureLen', value: `${sigLen} bytes` })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.18 (C_Sign)',
  }
}

/** C_VerifyInit(hSession, pMechanism, hKey) — §5.19 */
const decodeVerifyInit = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hKey = args[2] ?? 0
  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [{ name: 'hKey', value: String(hKey) }],
  })
  return { inputs, spec: 'PKCS#11 v3.2 §5.19 (C_VerifyInit)' }
}

/** C_Verify(hSession, pData, ulDataLen, pSignature, ulSignatureLen) — §5.19 */
const decodeVerify = (_M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const dataLen = args[2] ?? 0
  const sigLen = args[4] ?? 0

  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [
          { name: 'ulDataLen', value: `${dataLen} bytes` },
          { name: 'ulSignatureLen', value: `${sigLen} bytes` },
        ],
      },
    ],
    outputs:
      rv === 0
        ? [{ name: 'Verification', value: 'VALID — signature matches', note: 'CKR_OK' }]
        : rv === 0xc0
          ? [
              {
                name: 'Verification',
                value: 'INVALID — signature does not match',
                note: 'CKR_SIGNATURE_INVALID',
              },
            ]
          : undefined,
    spec: 'PKCS#11 v3.2 §5.19 (C_Verify)',
  }
}

/** C_EncryptInit(hSession, pMechanism, hKey) — §5.15 */
const decodeEncryptInit = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hKey = args[2] ?? 0
  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [{ name: 'hKey', value: String(hKey) }],
  })
  return { inputs, spec: 'PKCS#11 v3.2 §5.15 (C_EncryptInit)' }
}

/** C_Encrypt(hSession, pData, ulDataLen, pEncryptedData, pulEncryptedDataLen) — §5.15 */
const decodeEncrypt = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const dataLen = args[2] ?? 0
  const pOut = args[3] ?? 0
  const outLenPtr = args[4] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        {
          name: 'pEncryptedData',
          value: pOut === 0 ? 'NULL (size query)' : `0x${pOut.toString(16)}`,
          note: pOut === 0 ? 'Two-step: call with NULL first to get output length' : undefined,
        },
      ],
    },
  ]

  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && outLenPtr) {
    const outLen = safeRead32(M, outLenPtr)
    if (outLen !== null) outputs.push({ name: '*pulEncryptedDataLen', value: `${outLen} bytes` })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.15 (C_Encrypt)',
  }
}

/** C_DecryptInit(hSession, pMechanism, hKey) — §5.16 */
const decodeDecryptInit = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hKey = args[2] ?? 0
  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [{ name: 'hKey', value: String(hKey) }],
  })
  return { inputs, spec: 'PKCS#11 v3.2 §5.16 (C_DecryptInit)' }
}

/** C_Decrypt(hSession, pEncryptedData, ulEncryptedDataLen, pData, pulDataLen) — §5.16 */
const decodeDecrypt = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const encDataLen = args[2] ?? 0
  const pOut = args[3] ?? 0
  const outLenPtr = args[4] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulEncryptedDataLen', value: `${encDataLen} bytes` },
        {
          name: 'pData',
          value: pOut === 0 ? 'NULL (size query)' : `0x${pOut.toString(16)}`,
          note: pOut === 0 ? 'Two-step: call with NULL first to get plaintext length' : undefined,
        },
      ],
    },
  ]

  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && outLenPtr) {
    const outLen = safeRead32(M, outLenPtr)
    if (outLen !== null) outputs.push({ name: '*pulDataLen', value: `${outLen} bytes` })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.16 (C_Decrypt)',
  }
}

/** C_DeriveKey(hSession, pMechanism, hBaseKey, pTemplate, ulAttributeCount, phKey) — §5.14 */
const decodeDeriveKey = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hBaseKey = args[2] ?? 0
  const tmpl = readTemplate(M, args[3] ?? 0, args[4] ?? 0)

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [
      {
        name: 'hBaseKey',
        value: hBaseKey === 0 ? '0 (no base key)' : String(hBaseKey),
        note: hBaseKey === 0 ? 'PBKDF2 uses password from mechanism params instead' : undefined,
      },
    ],
  })
  if (tmpl.length) inputs.push({ label: 'Derived Key Template', attributes: tmpl })

  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0 && args[5]) {
    const h = safeRead32(M, args[5])
    if (h !== null) outputs.push({ name: '*phKey', value: String(h), note: 'Derived key handle' })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.14 (C_DeriveKey)',
  }
}

/** C_DigestInit(hSession, pMechanism) — §5.17 */
const decodeDigestInit = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  return { inputs, spec: 'PKCS#11 v3.2 §5.17 (C_DigestInit)' }
}

/** C_Digest(hSession, pData, ulDataLen, pDigest, pulDigestLen) — §5.17 */
const decodeDigest = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const dataLen = args[2] ?? 0
  const pDigest = args[3] ?? 0
  const digestLenPtr = args[4] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        {
          name: 'pDigest',
          value: pDigest === 0 ? 'NULL (size query)' : `0x${pDigest.toString(16)}`,
          note: pDigest === 0 ? 'Two-step: call with NULL first to get digest length' : undefined,
        },
      ],
    },
  ]

  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && digestLenPtr) {
    const digestLen = safeRead32(M, digestLenPtr)
    if (digestLen !== null) outputs.push({ name: '*pulDigestLen', value: `${digestLen} bytes` })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.17 (C_Digest)',
  }
}

/** C_WrapKey(hSession, pMechanism, hWrappingKey, hKey, pWrappedKey, pulWrappedKeyLen) — §5.14 */
const decodeWrapKey = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hWrappingKey = args[2] ?? 0
  const hKey = args[3] ?? 0
  const pOut = args[4] ?? 0
  const outLenPtr = args[5] ?? 0

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [
      { name: 'hWrappingKey', value: String(hWrappingKey) },
      { name: 'hKey', value: String(hKey), note: 'Key to be wrapped' },
      {
        name: 'pWrappedKey',
        value: pOut === 0 ? 'NULL (size query)' : `0x${pOut.toString(16)}`,
      },
    ],
  })

  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && outLenPtr) {
    const outLen = safeRead32(M, outLenPtr)
    if (outLen !== null) outputs.push({ name: '*pulWrappedKeyLen', value: `${outLen} bytes` })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.14 (C_WrapKey)',
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build a structured inspect payload for a PKCS#11 call.
 *
 * Called from `createLoggingProxy` in softhsm.ts BEFORE the TypeScript caller
 * frees WASM heap memory — so heap reads are valid at this point.
 *
 * @param M        Live SoftHSMModule (not the proxy wrapper)
 * @param fn       PKCS#11 function name e.g. "C_GenerateKeyPair"
 * @param args     Raw numeric arguments passed to the WASM function
 * @param rv       Return value (already unsigned)
 * @returns        Structured inspect data, or undefined for unhandled functions
 */
export const buildInspect = (
  M: SoftHSMModule,
  fn: string,
  args: number[],
  rv: number
): Pkcs11LogInspect | undefined => {
  try {
    switch (fn) {
      // Session lifecycle
      case 'C_Initialize':
        return decodeInitialize(M, args)
      case 'C_Finalize':
        return decodeFinalize(M, args)
      case 'C_GetSlotList':
        return decodeGetSlotList(M, args, rv)
      case 'C_OpenSession':
        return decodeOpenSession(M, args, rv)
      case 'C_CloseSession':
        return decodeCloseSession(M, args)
      case 'C_Login':
        return decodeLogin(M, args)
      case 'C_Logout':
        return decodeLogout(M, args)
      case 'C_InitToken':
        return decodeInitToken(M, args)
      case 'C_InitPIN':
        return decodeInitPIN(M, args)
      // Key generation
      case 'C_GenerateKeyPair':
        return decodeGenerateKeyPair(M, args, rv)
      case 'C_GenerateKey':
        return decodeGenerateKey(M, args, rv)
      // KEM (FIPS 203)
      case 'C_EncapsulateKey':
        return decodeEncapsulateKey(M, args, rv)
      case 'C_DecapsulateKey':
        return decodeDecapsulateKey(M, args, rv)
      // Attribute query
      case 'C_GetAttributeValue':
        return decodeGetAttributeValue(M, args)
      // Message signing / verification (FIPS 204/205)
      case 'C_MessageSignInit':
        return decodeMessageSignVerifyInit(M, args, false)
      case 'C_MessageVerifyInit':
        return decodeMessageSignVerifyInit(M, args, true)
      case 'C_SignMessage':
        return decodeSignMessage(M, args, rv)
      case 'C_VerifyMessage':
        return decodeVerifyMessage(M, args, rv)
      case 'C_MessageSignFinal':
        return decodeSignFinal(M, args, rv)
      case 'C_MessageVerifyFinal':
        return decodeVerifyFinal(M, args)
      // Classical sign / verify (RSA, ECDSA, EdDSA, HMAC, CMAC)
      case 'C_SignInit':
        return decodeSignInit(M, args)
      case 'C_Sign':
        return decodeSign(M, args, rv)
      case 'C_VerifyInit':
        return decodeVerifyInit(M, args)
      case 'C_Verify':
        return decodeVerify(M, args, rv)
      // Encrypt / decrypt (RSA-OAEP, AES-GCM/CBC/CTR)
      case 'C_EncryptInit':
        return decodeEncryptInit(M, args)
      case 'C_Encrypt':
        return decodeEncrypt(M, args, rv)
      case 'C_DecryptInit':
        return decodeDecryptInit(M, args)
      case 'C_Decrypt':
        return decodeDecrypt(M, args, rv)
      // Key derivation (ECDH, PBKDF2, HKDF, SP800-108)
      case 'C_DeriveKey':
        return decodeDeriveKey(M, args, rv)
      // Digest (SHA-256/384/512, SHA3)
      case 'C_DigestInit':
        return decodeDigestInit(M, args)
      case 'C_Digest':
        return decodeDigest(M, args, rv)
      // Key wrapping
      case 'C_WrapKey':
        return decodeWrapKey(M, args, rv)
      default:
        return undefined
    }
  } catch {
    // Never let inspect errors surface to users
    return undefined
  }
}
