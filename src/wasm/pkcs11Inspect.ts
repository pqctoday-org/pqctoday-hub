// SPDX-License-Identifier: AGPL-3.0-only
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
import { MECH_TABLE } from './softhsm/mechanismTable'
import { COMPOSITE_KEM_SETS, COMPOSITE_SIG_SETS } from './softhsm/compositeParams'

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
  /** Set when this function's decoder threw — shown instead of hiding the drawer. */
  decodeError?: string
}

// ── Private constant tables ───────────────────────────────────────────────────

export interface ConstEntry {
  name: string
  description?: string
}

// CKA_ attribute types
export const CKA_TABLE: Record<number, ConstEntry> = {
  0x00000000: { name: 'CKA_CLASS', description: 'Object class (CKO_*)' },
  0x00000001: { name: 'CKA_TOKEN', description: 'Persistent token object vs session object' },
  0x00000002: { name: 'CKA_PRIVATE', description: 'Access requires authentication' },
  0x00000003: { name: 'CKA_LABEL', description: 'Human-readable object label' },
  0x00000004: {
    name: 'CKA_UNIQUE_ID',
    description: 'Durable object identity, valid across sessions (v3.2 §3.2)',
  },
  0x00000011: { name: 'CKA_VALUE', description: 'Raw key bytes' },
  0x00000100: { name: 'CKA_KEY_TYPE', description: 'Key type (CKK_*)' },
  0x00000102: {
    name: 'CKA_ID',
    description: 'Key identifier for pairing/lookup (application-defined)',
  },
  0x00000103: { name: 'CKA_SENSITIVE', description: 'Key cannot be extracted in plaintext' },
  0x00000104: { name: 'CKA_ENCRYPT', description: 'Key can be used for encryption' },
  0x00000105: { name: 'CKA_DECRYPT', description: 'Key can be used for decryption' },
  0x00000106: { name: 'CKA_WRAP', description: 'Key can be used to wrap other keys' },
  0x00000107: { name: 'CKA_UNWRAP', description: 'Key can be used to unwrap other keys' },
  0x00000108: { name: 'CKA_SIGN', description: 'Key can be used to create signatures' },
  0x0000010a: { name: 'CKA_VERIFY', description: 'Key can be used to verify signatures' },
  0x0000010c: { name: 'CKA_DERIVE', description: 'Key can be used for key derivation' },
  0x00000110: { name: 'CKA_START_DATE', description: 'Date the key becomes valid' },
  0x00000111: { name: 'CKA_END_DATE', description: 'Date the key expires' },
  0x00000120: { name: 'CKA_MODULUS', description: 'RSA public modulus' },
  0x00000121: { name: 'CKA_MODULUS_BITS', description: 'RSA modulus length in bits' },
  0x00000122: { name: 'CKA_PUBLIC_EXPONENT', description: 'RSA public exponent (usually 65537)' },
  0x00000129: { name: 'CKA_PUBLIC_KEY_INFO', description: 'DER-encoded SubjectPublicKeyInfo' },
  0x00000161: { name: 'CKA_VALUE_LEN', description: 'Key length in bytes' },
  0x00000162: { name: 'CKA_EXTRACTABLE', description: 'Key can be wrapped and extracted' },
  0x00000163: {
    name: 'CKA_LOCAL',
    description: 'True if the key was generated locally, not imported',
  },
  0x00000164: {
    name: 'CKA_NEVER_EXTRACTABLE',
    description: 'True if the key has never been extractable',
  },
  0x00000165: {
    name: 'CKA_ALWAYS_SENSITIVE',
    description: 'True if the key has always been sensitive',
  },
  0x00000166: {
    name: 'CKA_KEY_GEN_MECHANISM',
    description: 'Mechanism used to generate the key (CKM_*)',
  },
  0x00000170: {
    name: 'CKA_MODIFIABLE',
    description: 'Object attributes can be changed after creation',
  },
  0x00000171: { name: 'CKA_COPYABLE', description: 'Object can be duplicated via C_CopyObject' },
  0x00000172: {
    name: 'CKA_DESTROYABLE',
    description: 'Object can be destroyed via C_DestroyObject',
  },
  0x00000180: { name: 'CKA_EC_PARAMS', description: 'DER-encoded EC domain parameters (OID)' },
  0x00000181: { name: 'CKA_EC_POINT', description: 'DER-encoded EC public key point' },
  0x00000202: {
    name: 'CKA_ALWAYS_AUTHENTICATE',
    description: 'Requires C_Login re-authentication before each use (v3.2 §4.4)',
  },
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
    description:
      'Template for the shared-secret key an encapsulation creates (ML-KEM or composite KEM). v3.2 value; the PKCS#11 v3.3 working draft sets CKF_ARRAY_ATTRIBUTE (0x4000062a)',
  },
  0x0000062b: {
    name: 'CKA_DECAPSULATE_TEMPLATE',
    description:
      'Template for the shared-secret key a decapsulation creates (ML-KEM or composite KEM). v3.2 value; the PKCS#11 v3.3 working draft sets CKF_ARRAY_ATTRIBUTE (0x4000062b)',
  },
  0x4000062a: {
    name: 'CKA_ENCAPSULATE_TEMPLATE',
    description:
      'Template for the shared-secret key an encapsulation creates (ML-KEM or composite KEM). PKCS#11 v3.3 working draft value (CKF_ARRAY_ATTRIBUTE | 0x62a)',
  },
  0x4000062b: {
    name: 'CKA_DECAPSULATE_TEMPLATE',
    description:
      'Template for the shared-secret key a decapsulation creates (ML-KEM or composite KEM). PKCS#11 v3.3 working draft value (CKF_ARRAY_ATTRIBUTE | 0x62b)',
  },
  0x00000618: { name: 'CKA_HSS_LMS_TYPE', description: 'HSS parameter set types (FIPS 208)' },
  0x00000619: { name: 'CKA_HSS_LMOTS_TYPE', description: 'LM-OTS parameter set types (FIPS 208)' },
  0x0000061c: {
    name: 'CKA_KEYS_REMAINING',
    description:
      'Signatures remaining on a stateful key (HSS, XMSS, XMSS^MT). PKCS#11 v3.3 working-draft name; v3.2 called it CKA_HSS_KEYS_REMAINING (same value)',
  },
  0x00000601: { name: 'CKA_PROFILE_ID', description: 'Conformance profile identifier (v3.2 §3)' },
  0x00000086: {
    name: 'CKA_TRUSTED',
    description: 'SO-only trust flag (v3.2 §4.2 Table 13 footnote 10)',
  },
  0x00000210: {
    name: 'CKA_WRAP_WITH_TRUSTED',
    description: 'Key may only be wrapped by a CKA_TRUSTED wrapping key (v3.2 §4.8/§4.10)',
  },
  0x40000600: {
    name: 'CKA_ALLOWED_MECHANISMS',
    description: 'Pins a key to a fixed set of mechanisms (v3.2 §4.8 Table 13)',
  },
}

// CKO_ object classes
export const CKO_TABLE: Record<number, ConstEntry> = {
  0x00: { name: 'CKO_DATA', description: 'Opaque data object' },
  0x01: { name: 'CKO_CERTIFICATE', description: 'Certificate object' },
  0x02: { name: 'CKO_PUBLIC_KEY', description: 'Public key — encapsulate / verify operations' },
  0x03: { name: 'CKO_PRIVATE_KEY', description: 'Private key — decapsulate / sign operations' },
  0x04: { name: 'CKO_SECRET_KEY', description: 'Symmetric / shared-secret key' },
  0x09: { name: 'CKO_PROFILE', description: 'Conformance profile the token claims (v3.2 §3)' },
}

// CKK_ key types
export const CKK_TABLE: Record<number, ConstEntry> = {
  0x00: { name: 'CKK_RSA' },
  0x03: { name: 'CKK_EC' },
  0x10: { name: 'CKK_GENERIC_SECRET', description: 'Generic secret key (HMAC, KDF base)' },
  0x1f: { name: 'CKK_AES', description: 'AES symmetric key' },
  0x33: { name: 'CKK_CHACHA20', description: 'ChaCha20 symmetric key' },
  0x40: { name: 'CKK_EC_EDWARDS', description: 'Edwards-curve key (Ed25519/Ed448)' },
  0x41: { name: 'CKK_EC_MONTGOMERY', description: 'Montgomery-curve key (X25519/X448)' },
  0x46: { name: 'CKK_HSS', description: 'HSS / LMS stateful signature key (RFC 8554, SP 800-208)' },
  0x47: { name: 'CKK_XMSS', description: 'XMSS stateful signature key (RFC 8391, SP 800-208)' },
  0x48: {
    name: 'CKK_XMSSMT',
    description: 'XMSS^MT multi-tree stateful signature key (RFC 8391, SP 800-208)',
  },
  0x49: { name: 'CKK_ML_KEM', description: 'ML-KEM (FIPS 203)' },
  0x4a: { name: 'CKK_ML_DSA', description: 'ML-DSA (FIPS 204)' },
  0x4b: { name: 'CKK_SLH_DSA', description: 'SLH-DSA (FIPS 205)' },
  0x4c: {
    name: 'CKK_COMP_KEM',
    description: 'Composite ML-KEM key, both halves in one object (PKCS#11 v3.3 working draft)',
  },
  0x4d: {
    name: 'CKK_COMP_SIG',
    description: 'Composite ML-DSA key, both halves in one object (PKCS#11 v3.3 working draft)',
  },
  0x80000003: {
    name: 'CKK_HPKE_KEM',
    description: 'HPKE KEM key — classical DHKEM, ML-KEM or PQ/T hybrid such as X-Wing (vendor)',
  },
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
export const CKP_ML_KEM: Record<number, ConstEntry> = {
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
export const CKP_ML_DSA: Record<number, ConstEntry> = {
  0x1: { name: 'CKP_ML_DSA_44', description: 'NIST Level 2 — 2420-byte signature' },
  0x2: { name: 'CKP_ML_DSA_65', description: 'NIST Level 3 — 3309-byte signature' },
  0x3: { name: 'CKP_ML_DSA_87', description: 'NIST Level 5 — 4627-byte signature' },
}

// CKP_ SLH-DSA parameter sets (pkcs11t.h ordering: interleaved SHA2/SHAKE per security level)
export const CKP_SLH_DSA: Record<number, ConstEntry> = {
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

// CKP_ XMSS parameter sets (RFC 8391 / SP 800-208) — single-tree.
// Name encodes tree height and hash output size; 2^height one-time
// signatures are available before the key is exhausted.
export const CKP_XMSS: Record<number, ConstEntry> = {
  0x1: { name: 'CKP_XMSS_SHA2_10_256', description: 'Height 10 — 1024 signatures, SHA2-256' },
  0x2: { name: 'CKP_XMSS_SHA2_16_256', description: 'Height 16 — 65536 signatures, SHA2-256' },
  0x3: { name: 'CKP_XMSS_SHA2_20_256', description: 'Height 20 — ~1M signatures, SHA2-256' },
  0x7: { name: 'CKP_XMSS_SHAKE_10_256', description: 'Height 10 — 1024 signatures, SHAKE128' },
  0x8: { name: 'CKP_XMSS_SHAKE_16_256', description: 'Height 16 — 65536 signatures, SHAKE128' },
  0x9: { name: 'CKP_XMSS_SHAKE_20_256', description: 'Height 20 — ~1M signatures, SHAKE128' },
  // RFC 8391's "_512" SHAKE sets use SHAKE256 with n=64 — the name suffix is
  // the digest size, NOT the XOF. Only the "_256" sets above (0x7-0x9) are
  // SHAKE128. Mislabelling these as SHAKE128 is easy and was wrong here until
  // 2026-09-03; confirmed against the RFC 8391 reference implementation, which
  // maps 0xa-0xc to XMSS_SHAKE256 alongside SP 800-208's 0x10-0x15.
  // SP 800-208 Tables 14/16 — the SHAKE256 sets, the only SHAKE sets NIST
  // approves (the SHAKE128 sets above are RFC 8391 only).
  0x10: {
    name: 'CKP_XMSS_SHAKE256_10_256',
    description: 'Height 10 — 1024 signatures, SHAKE256 (SP 800-208)',
  },
  0x11: {
    name: 'CKP_XMSS_SHAKE256_16_256',
    description: 'Height 16 — 65536 signatures, SHAKE256 (SP 800-208)',
  },
  0x12: {
    name: 'CKP_XMSS_SHAKE256_20_256',
    description: 'Height 20 — ~1M signatures, SHAKE256 (SP 800-208)',
  },
  0x13: {
    name: 'CKP_XMSS_SHAKE256_10_192',
    description: 'Height 10 — 1024 signatures, SHAKE256/192 (SP 800-208)',
  },
  0x14: {
    name: 'CKP_XMSS_SHAKE256_16_192',
    description: 'Height 16 — 65536 signatures, SHAKE256/192 (SP 800-208)',
  },
  0x15: {
    name: 'CKP_XMSS_SHAKE256_20_192',
    description: 'Height 20 — ~1M signatures, SHAKE256/192 (SP 800-208)',
  },
}

// CKP_ XMSS^MT parameter sets (RFC 8391 / SP 800-208) — multi-tree.
// Name encodes total height, layer count, and hash output size.
export const CKP_XMSSMT: Record<number, ConstEntry> = {
  0x1: {
    name: 'CKP_XMSSMT_SHA2_20_2_256',
    description: 'Height 20, 2 layers — ~1M signatures, SHA2-256',
  },
  0x2: {
    name: 'CKP_XMSSMT_SHA2_20_4_256',
    description: 'Height 20, 4 layers — ~1M signatures, SHA2-256',
  },
  0x3: {
    name: 'CKP_XMSSMT_SHA2_40_2_256',
    description: 'Height 40, 2 layers — ~1T signatures, SHA2-256',
  },
  0x4: {
    name: 'CKP_XMSSMT_SHA2_40_4_256',
    description: 'Height 40, 4 layers — ~1T signatures, SHA2-256',
  },
  0x5: {
    name: 'CKP_XMSSMT_SHA2_40_8_256',
    description: 'Height 40, 8 layers — ~1T signatures, SHA2-256',
  },
  0x6: {
    name: 'CKP_XMSSMT_SHA2_60_3_256',
    description: 'Height 60, 3 layers — ~1P signatures, SHA2-256',
  },
  0x7: {
    name: 'CKP_XMSSMT_SHA2_60_6_256',
    description: 'Height 60, 6 layers — ~1P signatures, SHA2-256',
  },
  0x8: {
    name: 'CKP_XMSSMT_SHA2_60_12_256',
    description: 'Height 60, 12 layers — ~1P signatures, SHA2-256',
  },
}

// CKP_ FrodoKEM / Classic McEliece parameter sets — vendor-defined (neither
// family has a v3.2 CKK_*/CKP_* assignment). Reusing small ordinals here is
// consistent with how the spec's own ML-KEM/ML-DSA/SLH-DSA families already
// share the same 0x1-0xC range, disambiguated only by CKA_KEY_TYPE — see
// `describeParameterSetByKeyType` below, which is exactly that dispatch.
export const CKP_FRODOKEM: Record<number, ConstEntry> = {
  0x5: { name: 'CKP_FRODOKEM_1344_AES', description: 'NIST Level 5 — FrodoKEM-1344-AES' },
}

// CKP_ composite parameter sets (PKCS#11 v3.3 working draft, pkcs11t.h:2780-2812),
// built from the single table in softhsm/compositeParams.ts.
export const CKP_COMP_SIG: Record<number, ConstEntry> = Object.fromEntries(
  COMPOSITE_SIG_SETS.map((s) => [
    s.ckp,
    {
      name: s.ckpName,
      description: `${s.ml} + ${s.trad}, pre-hash ${s.preHash} — ${s.draftName} (${s.oid}); signature ${s.signatureIsMax ? 'up to ' : ''}${s.signatureBytes} B`,
    },
  ])
)

export const CKP_COMP_KEM: Record<number, ConstEntry> = Object.fromEntries(
  COMPOSITE_KEM_SETS.map((s) => [
    s.ckp,
    {
      name: s.ckpName,
      description: `${s.ml} + ${s.trad} — ${s.draftName} (${s.oid}); ciphertext ${s.ciphertextBytes} B, 32-byte secret`,
    },
  ])
)

export const CKP_CLASSIC_MCELIECE: Record<number, ConstEntry> = {
  0x1: {
    name: 'CKP_CLASSIC_MCELIECE_6688128',
    description: 'NIST Level 5 — Classic McEliece 6688128',
  },
}

/**
 * Resolve a CKA_PARAMETER_SET value given the object's CKA_KEY_TYPE — the
 * signal HsmKeyAttrDisplay's modal has on hand directly (unlike the log
 * decoder below, which only sees the mechanism used, tracked separately).
 * Returns null for a key type that doesn't carry a named parameter set
 * (e.g. HSS, whose LMS/LMOTS shape travels in the mechanism parameter, not
 * CKA_PARAMETER_SET) or an unrecognized value.
 */
// CK_HPKE_KEM_PARAMETER_SET_TYPE (CKM_HPKE vendor family) — equal to the
// RFC 9180 §7.1 / draft-ietf-hpke-pq kem_id; values as softhsm.ts CKP_HPKE_KEM_*.
export const CKP_HPKE_KEM: Record<number, ConstEntry> = {
  0x0010: { name: 'DHKEM(P-256, HKDF-SHA256)', description: 'RFC 9180 classical' },
  0x0011: { name: 'DHKEM(P-384, HKDF-SHA384)', description: 'RFC 9180 classical' },
  0x0012: { name: 'DHKEM(P-521, HKDF-SHA512)', description: 'RFC 9180 classical' },
  0x0020: { name: 'DHKEM(X25519, HKDF-SHA256)', description: 'RFC 9180 classical' },
  0x0021: { name: 'DHKEM(X448, HKDF-SHA512)', description: 'RFC 9180 classical' },
  0x0040: { name: 'ML-KEM-512', description: 'Pure ML-KEM (draft-ietf-hpke-pq)' },
  0x0041: { name: 'ML-KEM-768', description: 'Pure ML-KEM (draft-ietf-hpke-pq)' },
  0x0042: { name: 'ML-KEM-1024', description: 'Pure ML-KEM (draft-ietf-hpke-pq)' },
  0x0050: { name: 'MLKEM768-P256', description: 'PQ/T hybrid (draft-ietf-hpke-pq)' },
  0x0051: { name: 'MLKEM1024-P384', description: 'PQ/T hybrid (draft-ietf-hpke-pq)' },
  0x647a: {
    name: 'MLKEM768-X25519 (X-Wing)',
    description: 'PQ/T hybrid — X-Wing (draft-connolly-cfrg-xwing-kem)',
  },
}

export const describeParameterSetByKeyType = (
  ckKeyType: number,
  paramSet: number
): ConstEntry | null => {
  const table =
    ckKeyType === 0x49 // CKK_ML_KEM
      ? CKP_ML_KEM
      : ckKeyType === 0x4a // CKK_ML_DSA
        ? CKP_ML_DSA
        : ckKeyType === 0x4b // CKK_SLH_DSA
          ? CKP_SLH_DSA
          : ckKeyType === 0x47 // CKK_XMSS
            ? CKP_XMSS
            : ckKeyType === 0x48 // CKK_XMSSMT
              ? CKP_XMSSMT
              : ckKeyType === 0x4c // CKK_COMP_KEM
                ? CKP_COMP_KEM
                : ckKeyType === 0x4d // CKK_COMP_SIG
                  ? CKP_COMP_SIG
                  : ckKeyType === 0x80000001 // CKK_PQCTODAY_FRODOKEM
                    ? CKP_FRODOKEM
                    : ckKeyType === 0x80000002 // CKK_PQCTODAY_CLASSIC_MCELIECE
                      ? CKP_CLASSIC_MCELIECE
                      : ckKeyType === 0x80000003 // CKK_HPKE_KEM
                        ? CKP_HPKE_KEM
                        : null
  return table?.[paramSet] ?? null
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
  0x02: {
    name: 'CKR_HOST_MEMORY',
    description: 'Insufficient host memory',
    hint: 'Try a smaller key size or free browser memory',
  },
  0x03: {
    name: 'CKR_SLOT_ID_INVALID',
    description: 'Slot ID does not exist',
    hint: 'Initialize the module first via C_Initialize',
  },
  0x05: {
    name: 'CKR_GENERAL_ERROR',
    description: 'Unspecified internal error',
    hint: 'Re-initialize the module and retry',
  },
  0x06: {
    name: 'CKR_FUNCTION_FAILED',
    description: 'Function failed for an internal reason',
    hint: 'Check the PKCS#11 log for preceding calls that may have left bad state',
  },
  0x07: {
    name: 'CKR_ARGUMENTS_BAD',
    description: 'Invalid arguments passed to the function',
    hint: 'Verify all parameters: handles, buffers, and template attributes',
  },
  0x10: {
    name: 'CKR_ATTRIBUTE_READ_ONLY',
    description: 'Attribute cannot be modified',
    hint: 'This attribute was set at key creation and is immutable',
  },
  0x11: {
    name: 'CKR_ATTRIBUTE_SENSITIVE',
    description: 'Attribute cannot be read (sensitive)',
    hint: 'The key has CKA_SENSITIVE=true — extracting its value is not allowed',
  },
  0x12: {
    name: 'CKR_ATTRIBUTE_TYPE_INVALID',
    description: 'Unknown or unsupported attribute type',
    hint: 'Check that the CKA_* type is supported by this mechanism',
  },
  0x13: {
    name: 'CKR_ATTRIBUTE_VALUE_INVALID',
    description: 'Attribute value is out of range or malformed',
    hint: 'Verify the attribute value matches the expected type and constraints',
  },
  0x1b: { name: 'CKR_ACTION_PROHIBITED', description: 'Action not allowed by token policy' },
  0x20: { name: 'CKR_DATA_INVALID', description: 'Input data is invalid for this operation' },
  0x21: {
    name: 'CKR_DATA_LEN_RANGE',
    description: 'Input data length is outside allowed range',
    hint: 'Check minimum/maximum data length for this mechanism',
  },
  0x40: { name: 'CKR_ENCRYPTED_DATA_INVALID', description: 'Ciphertext is corrupted or invalid' },
  0x41: {
    name: 'CKR_ENCRYPTED_DATA_LEN_RANGE',
    description: 'Ciphertext length is outside allowed range',
  },
  0x42: {
    name: 'CKR_AEAD_DECRYPT_FAILED',
    description: 'AEAD authentication tag verification failed',
    hint: 'The ciphertext was modified or the wrong key/IV was used',
  },
  0x54: {
    name: 'CKR_FUNCTION_NOT_SUPPORTED',
    description: 'This PKCS#11 function is not implemented',
    hint: 'The HSM module does not support this operation',
  },
  0x60: {
    name: 'CKR_KEY_HANDLE_INVALID',
    description: 'Key handle does not exist or has been destroyed',
    hint: 'Generate a new key or check the key store',
  },
  0x62: {
    name: 'CKR_KEY_SIZE_RANGE',
    description: 'Key size is outside the allowed range for this mechanism',
    hint: "Check CKA_VALUE_LEN against the mechanism's supported key sizes",
  },
  0x63: {
    name: 'CKR_KEY_TYPE_INCONSISTENT',
    description: 'Key type does not match the mechanism',
    hint: 'Use a key type that matches the algorithm (e.g., CKK_AES for AES mechanisms)',
  },
  0x68: {
    name: 'CKR_KEY_FUNCTION_NOT_PERMITTED',
    description: 'Key attributes do not permit this operation',
    hint: 'Check CKA_ENCRYPT, CKA_DECRYPT, CKA_SIGN, CKA_VERIFY, CKA_WRAP, CKA_UNWRAP flags on the key',
  },
  0x69: {
    name: 'CKR_KEY_NOT_WRAPPABLE',
    description: 'This key cannot be wrapped by the given wrapping key',
    hint: 'The target has CKA_WRAP_WITH_TRUSTED=true, but the wrapping key lacks CKA_TRUSTED=true',
  },
  0x6a: {
    name: 'CKR_KEY_UNEXTRACTABLE',
    description: 'Key has CKA_EXTRACTABLE=false',
    hint: 'Generate a new key with CKA_EXTRACTABLE=true if you need to export it',
  },
  0x70: {
    name: 'CKR_MECHANISM_INVALID',
    description: 'Mechanism is not supported by this token',
    hint: 'Check supported mechanisms via C_GetMechanismList',
  },
  0x71: {
    name: 'CKR_MECHANISM_PARAM_INVALID',
    description: 'Mechanism parameters are invalid',
    hint: 'Verify the parameter struct matches what the mechanism expects',
  },
  0x82: { name: 'CKR_OBJECT_HANDLE_INVALID', description: 'Object handle does not exist' },
  0x90: {
    name: 'CKR_OPERATION_ACTIVE',
    description: 'An operation is already active on this session',
    hint: 'Finalize or cancel the current operation before starting a new one',
  },
  0x91: {
    name: 'CKR_OPERATION_NOT_INITIALIZED',
    description: 'No operation was initialized',
    hint: 'Call the Init function (e.g., C_SignInit) before the operation function',
  },
  0xa0: {
    name: 'CKR_PIN_INCORRECT',
    description: 'PIN is wrong',
    hint: 'Use the correct user PIN (default: "1234" for this HSM emulator)',
  },
  0xa1: { name: 'CKR_PIN_INVALID', description: 'PIN format is invalid' },
  0xb0: {
    name: 'CKR_SESSION_CLOSED',
    description: 'Session has been closed',
    hint: 'Open a new session with C_OpenSession',
  },
  0xb3: {
    name: 'CKR_SESSION_HANDLE_INVALID',
    description: 'Session handle does not exist',
    hint: 'Open a new session or verify the handle from C_OpenSession',
  },
  0xb5: {
    name: 'CKR_SESSION_READ_ONLY',
    description: 'Session is read-only but a write operation was attempted',
    hint: 'Open a R/W session with CKF_RW_SESSION flag',
  },
  0xc0: {
    name: 'CKR_SIGNATURE_INVALID',
    description: 'Signature verification failed',
    hint: 'The data, key, or signature may have been modified',
  },
  0xc1: {
    name: 'CKR_SIGNATURE_LEN_RANGE',
    description: 'Signature length is outside allowed range',
  },
  0xd0: {
    name: 'CKR_TEMPLATE_INCOMPLETE',
    description: 'Required attributes are missing from the template',
    hint: 'Add all required CKA_* attributes for this object type',
  },
  0xd1: {
    name: 'CKR_TEMPLATE_INCONSISTENT',
    description: 'Template attributes conflict with each other',
  },
  0xe0: {
    name: 'CKR_TOKEN_NOT_PRESENT',
    description: 'Token is not present in the slot',
    hint: 'Initialize the module first',
  },
  0x100: {
    name: 'CKR_USER_ALREADY_LOGGED_IN',
    description: 'A user is already logged in to this session',
  },
  0x101: {
    name: 'CKR_USER_NOT_LOGGED_IN',
    description: 'Login required before this operation',
    hint: 'Call C_Login with CKU_USER and your PIN',
  },
  0x104: {
    name: 'CKR_USER_ANOTHER_ALREADY_LOGGED_IN',
    description: 'A different role is already logged in on this token',
    hint: 'PKCS#11 login is per-token, not per-session — call C_Logout first',
  },
  0x150: {
    name: 'CKR_BUFFER_TOO_SMALL',
    description: 'Output buffer is too small for the result',
    hint: 'This is normal for two-pass calls — the first call returns the required size',
  },
  0x190: {
    name: 'CKR_CRYPTOKI_NOT_INITIALIZED',
    description: 'C_Initialize has not been called',
    hint: 'Call C_Initialize before any other PKCS#11 function',
  },
  0x191: {
    name: 'CKR_CRYPTOKI_ALREADY_INITIALIZED',
    description: 'C_Initialize was already called',
  },
  0x200: { name: 'CKR_FUNCTION_REJECTED', description: 'Function was rejected by policy' },
  0x201: {
    name: 'CKR_TOKEN_RESOURCE_EXCEEDED',
    description: 'Token lacks the resources to perform the requested action',
    hint: 'Free session objects or reduce concurrent operations and retry',
  },
  0x203: {
    name: 'CKR_KEY_EXHAUSTED',
    description: "Stateful key's remaining-signatures budget is depleted (v3.2 §6.14, SP 800-208)",
    hint: 'HSS/XMSS/XMSS-MT keys are single-use-budgeted — generate a new key pair',
  },
}

/** Look up a CKR_* return value. Returns name, description, and optional remediation hint. */
export const lookupCkr = (rv: number): { name: string; description: string; hint?: string } => {
  const entry = CKR_TABLE[rv]
  if (entry) return entry
  return {
    name: `CKR_UNKNOWN (0x${rv.toString(16).padStart(8, '0')})`,
    description: 'Unknown return value',
  }
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

/** Safely read up to maxBytes from WASM heap and return a hex string. */
const safeReadBytesAsHex = (M: SoftHSMModule, ptr: number, len: number, maxBytes = 64): string => {
  if (!ptr || len <= 0) return ''
  try {
    const preview = Math.min(len, maxBytes)
    let hexSequence = Array.from(M.HEAPU8.slice(ptr, ptr + preview))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    if (len > maxBytes) hexSequence += '…'
    return hexSequence
  } catch {
    return '(unreadable)'
  }
}

/** Decode a CK_FLAGS bitmask into flag names. */
const decodeFlagsBitmask = (flags: number): string => {
  const active = CKF_SESSION_FLAGS.filter((f) => flags & f.bit).map((f) => f.name)
  const raw = `0x${flags.toString(16).padStart(8, '0')}`
  return active.length > 0 ? `${active.join(' | ')} (${raw})` : raw
}

/** Determine algo context from mechanism type (for CKP_ dispatch). */
type AlgoContext =
  | 'ml-kem'
  | 'ml-dsa'
  | 'slh-dsa'
  | 'xmss'
  | 'xmssmt'
  | 'comp-sig'
  | 'comp-kem'
  | 'hpke-kem'
  | undefined

const algoFromMechType = (mechType: number): AlgoContext => {
  if (mechType === 0x0000000f || mechType === 0x00000017) return 'ml-kem'
  if (mechType >= 0x0000001c && mechType <= 0x0000002c) return 'ml-dsa'
  if (mechType >= 0x0000002d && mechType <= 0x0000003f) return 'slh-dsa'
  if (mechType === 0x00004034) return 'xmss' // CKM_XMSS_KEY_PAIR_GEN
  if (mechType === 0x00004035) return 'xmssmt' // CKM_XMSSMT_KEY_PAIR_GEN
  // PKCS#11 v3.3 working draft: CKM_COMP_SIG_KEY_PAIR_GEN / _SIG / _SIG_EXTERNAL_HASH
  if (mechType >= 0x0000403d && mechType <= 0x0000403f) return 'comp-sig'
  // CKM_COMP_KEM_KEY_PAIR_GEN / CKM_COMP_KEM
  if (mechType === 0x00004040 || mechType === 0x00004041) return 'comp-kem'
  // CKM_HPKE_KEM_KEY_PAIR_GEN / CKM_HPKE (vendor) — X-Wing and the other HPKE KEMs
  if (mechType === 0x80000013 || mechType === 0x80000014) return 'hpke-kem'
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
            : algo === 'xmss'
              ? CKP_XMSS
              : algo === 'xmssmt'
                ? CKP_XMSSMT
                : algo === 'comp-sig'
                  ? CKP_COMP_SIG
                  : algo === 'comp-kem'
                    ? CKP_COMP_KEM
                    : algo === 'hpke-kem'
                      ? CKP_HPKE_KEM
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
  (mechType >= 0x0000002d && mechType <= 0x0000003f) || // SLH-DSA range
  mechType === 0x0000403c || // CKM_ML_DSA_EXTERNAL_MU (v3.3 draft, same struct as ML-DSA)
  mechType === 0x0000403e || // CKM_COMP_SIG (v3.3 draft, same struct as ML-DSA)
  mechType === 0x0000403f // CKM_COMP_SIG_EXTERNAL_HASH

// ── PKCS#11 v3.3 working draft: composite and external-µ helpers ─────────────

const CKM_ML_DSA_EXTERNAL_MU_GEN = 0x0000403b
const CKM_COMP_SIG = 0x0000403e
const CKM_COMP_SIG_EXTERNAL_HASH = 0x0000403f
const CKM_COMP_KEM = 0x00004041
const CKA_PARAMETER_SET = 0x0000061d
const V33_DRAFT = 'PKCS#11 v3.3 working draft'

export interface CompositeSplit {
  /** Parameter set the split was taken from, or null when only the ML part is certain. */
  ckpName: string | null
  mlName: string
  mlBytes: number
  tradName: string
  tradBytes: number
  /** 'key' = from the key's CKA_PARAMETER_SET; 'length' = inferred from the length. */
  source: 'key' | 'length'
}

/**
 * Split a composite ML-DSA signature (ML-DSA half || classical half). The
 * ML-DSA half has a fixed length for its level; the classical half is the rest.
 * With the key's parameter set the split is exact; otherwise the sets whose
 * size fits the length are tried, and a split is returned only when all of
 * them agree on the ML-DSA length.
 */
export const splitCompositeSignature = (
  len: number,
  ckp?: number | null
): CompositeSplit | null => {
  const known = ckp != null ? COMPOSITE_SIG_SETS.find((x) => x.ckp === ckp) : undefined
  const fits = known
    ? [known]
    : COMPOSITE_SIG_SETS.filter((x) =>
        x.signatureIsMax
          ? len > x.mlSignatureBytes && len <= x.signatureBytes
          : len === x.signatureBytes
      )
  if (!fits.length || len <= fits[0].mlSignatureBytes) return null
  if (fits.some((x) => x.mlSignatureBytes !== fits[0].mlSignatureBytes)) return null
  const one = fits.length === 1 ? fits[0] : null
  return {
    ckpName: one?.ckpName ?? null,
    mlName: fits[0].ml,
    mlBytes: fits[0].mlSignatureBytes,
    tradName: one?.trad ?? 'classical',
    tradBytes: len - fits[0].mlSignatureBytes,
    source: known ? 'key' : 'length',
  }
}

/**
 * Split a composite ML-KEM ciphertext (ML-KEM part || classical part), from
 * the key's parameter set or, failing that, the sets whose ciphertext length
 * equals `len` (returned only when they agree on the ML-KEM length).
 */
export const splitCompositeCiphertext = (
  len: number,
  ckp?: number | null
): CompositeSplit | null => {
  const known = ckp != null ? COMPOSITE_KEM_SETS.find((x) => x.ckp === ckp) : undefined
  const fits = known ? [known] : COMPOSITE_KEM_SETS.filter((x) => x.ciphertextBytes === len)
  if (!fits.length || len <= fits[0].mlCiphertextBytes) return null
  if (fits.some((x) => x.mlCiphertextBytes !== fits[0].mlCiphertextBytes)) return null
  const one = fits.length === 1 ? fits[0] : null
  return {
    ckpName: one?.ckpName ?? null,
    mlName: fits[0].ml,
    mlBytes: fits[0].mlCiphertextBytes,
    tradName: one?.trad ?? 'classical',
    tradBytes: len - fits[0].mlCiphertextBytes,
    source: known ? 'key' : 'length',
  }
}

const splitRows = (
  what: 'Signature' | 'Ciphertext',
  sp: CompositeSplit
): Array<{ name: string; value: string; note?: string }> => [
  {
    name: `${what} split`,
    value: `${sp.mlName} ${sp.mlBytes} B + ${sp.tradName} ${sp.tradBytes} B`,
    note: `${V33_DRAFT}: composite ${what.toLowerCase()} = ${sp.mlName} part || classical part${
      sp.ckpName ? ` (${sp.ckpName}` : ' ('
    }${sp.source === 'key' ? 'from the key’s CKA_PARAMETER_SET)' : sp.ckpName ? ', inferred from the length)' : 'inferred from the length)'}`,
  },
]

/**
 * Read a key's CKA_PARAMETER_SET through the live module (not the logging
 * proxy, so the read is not itself logged). Returns null on any failure.
 */
const readKeyParamSet = (M: SoftHSMModule, hSession: number, hKey: number): number | null => {
  if (!hKey || typeof M._malloc !== 'function' || typeof M._C_GetAttributeValue !== 'function')
    return null
  let tpl = 0
  try {
    tpl = M._malloc(16)
    const val = tpl + 12
    M.setValue(tpl, CKA_PARAMETER_SET, 'i32')
    M.setValue(tpl + 4, val, 'i32')
    M.setValue(tpl + 8, 4, 'i32')
    if (M._C_GetAttributeValue(hSession, hKey, tpl, 1) >>> 0 !== 0) return null
    return safeRead32(M, val)
  } catch {
    return null
  } finally {
    try {
      if (tpl) M._free(tpl)
    } catch {
      // ignore
    }
  }
}

/**
 * Mechanism and key parameter set of the active C_SignInit / C_VerifyInit per
 * session, so C_Sign / C_Verify (which carry no mechanism) can split a
 * composite signature.
 */
const _signVerifyOp = new Map<string, { mech: number; ckp: number | null }>()
const isCompSigMech = (m: number) => m === CKM_COMP_SIG || m === CKM_COMP_SIG_EXTERNAL_HASH

const noteSignVerifyInit = (
  M: SoftHSMModule,
  kind: 'sign' | 'verify',
  hSession: number,
  mechType: number | null,
  hKey: number
) => {
  const key = `${kind}:${hSession}`
  if (mechType === null || !isCompSigMech(mechType)) {
    _signVerifyOp.delete(key)
    return
  }
  _signVerifyOp.set(key, { mech: mechType, ckp: readKeyParamSet(M, hSession, hKey) })
}

const compositeSignatureRows = (kind: 'sign' | 'verify', hSession: number, sigLen: number) => {
  const op = _signVerifyOp.get(`${kind}:${hSession}`)
  if (!op) return []
  const sp = splitCompositeSignature(sigLen, op.ckp)
  return sp ? splitRows('Signature', sp) : []
}

/**
 * CK_MU_GEN_PARAMS (PKCS#11 v3.3 working draft, CKM_ML_DSA_EXTERNAL_MU_GEN).
 * wasm32 layout: hKey @0, pTR @4, ulTRLen @8, pContext @12, ulContextLen @16.
 * Exactly one of hKey / pTR is meant to be given.
 */
const readMuGenParams = (
  M: SoftHSMModule,
  ptr: number,
  len: number
): Array<{ name: string; value: string; note?: string }> | null => {
  if (!ptr || len < 20) return null
  const hKey = safeRead32(M, ptr)
  const pTR = safeRead32(M, ptr + 4)
  const trLen = safeRead32(M, ptr + 8)
  const pCtx = safeRead32(M, ptr + 12)
  const ctxLen = safeRead32(M, ptr + 16)
  if (hKey === null || trLen === null || ctxLen === null) return null
  const rows: Array<{ name: string; value: string; note?: string }> = []
  if (hKey)
    rows.push({ name: 'hKey', value: String(hKey), note: 'tr is computed from this public key' })
  if (pTR && trLen)
    rows.push({
      name: 'pTR',
      value: `precomputed tr (${trLen} bytes)`,
      note: trLen === 64 ? 'tr = H(pk), 64 bytes (FIPS 204)' : 'FIPS 204 tr is 64 bytes',
    })
  if (!hKey && !(pTR && trLen)) rows.push({ name: 'hKey / pTR', value: 'neither given' })
  rows.push({
    name: 'Context',
    value:
      ctxLen && pCtx ? `${ctxLen} bytes [${safeReadBytesAsHex(M, pCtx, ctxLen, 16)}]` : 'empty',
  })
  return rows
}

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
    const entry = MECH_TABLE[mechType]
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
    'comp-sig':
      'PKCS#11 v3.3 working draft comp_sig.md · draft-ietf-lamps-pq-composite-sigs (composite ML-DSA key generation)',
    'comp-kem':
      'PKCS#11 v3.3 working draft comp_kem.md · draft-ietf-lamps-pq-composite-kem (composite ML-KEM key generation)',
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
  const mechType = safeRead32(M, mechPtr)
  const isCompKem = mechType === CKM_COMP_KEM
  const hPublicKey = args[2] ?? 0
  const secretTmpl = readTemplate(M, args[3] ?? 0, args[4] ?? 0)
  const ctPtr = args[5] ?? 0
  const ctLenPtr = args[6] ?? 0

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  const hpke = readHpkeParamsSection(M, mechPtr)
  if (hpke) inputs.push(hpke)
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
    if (ctLen !== null) {
      outputs.push({ name: '*pulCiphertextLen', value: `${ctLen} bytes` })
      if (isCompKem) {
        const sp = splitCompositeCiphertext(ctLen, readKeyParamSet(M, args[0] ?? 0, hPublicKey))
        if (sp) outputs.push(...splitRows('Ciphertext', sp))
      }
    }
  }
  if (rv === 0 && args[7]) {
    const phKey = safeRead32(M, args[7])
    if (phKey !== null)
      outputs.push({
        name: '*phKey',
        value: String(phKey),
        note: 'Shared secret handle (the secret value is never shown)',
      })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: isCompKem
      ? `${V33_DRAFT} (CKM_COMP_KEM, C_EncapsulateKey) · draft-ietf-lamps-pq-composite-kem`
      : 'PKCS#11 v3.2 §5.25 (new in v3.2) · FIPS 203 Algorithm 17 (ML-KEM.Encaps)',
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
  const mechType = safeRead32(M, mechPtr)
  const isCompKem = mechType === CKM_COMP_KEM
  const hPrivateKey = args[2] ?? 0
  const secretTmpl = readTemplate(M, args[3] ?? 0, args[4] ?? 0)
  const ctLen = args[6] ?? 0 // direct value, not pointer
  const split = isCompKem
    ? splitCompositeCiphertext(ctLen, readKeyParamSet(M, args[0] ?? 0, hPrivateKey))
    : null

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  const hpke = readHpkeParamsSection(M, mechPtr)
  if (hpke) inputs.push(hpke)
  inputs.push({
    label: 'Parameters',
    primitives: [
      { name: 'hPrivateKey', value: String(hPrivateKey) },
      { name: 'ulCiphertextLen', value: `${ctLen} bytes` },
      ...(split ? splitRows('Ciphertext', split) : []),
    ],
  })
  if (secretTmpl.length) inputs.push({ label: 'Secret Key Template', attributes: secretTmpl })

  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0 && args[7]) {
    const phKey = safeRead32(M, args[7])
    if (phKey !== null)
      outputs.push({
        name: '*phKey',
        value: String(phKey),
        note: 'Shared secret handle (the secret value is never shown)',
      })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: isCompKem
      ? `${V33_DRAFT} (CKM_COMP_KEM, C_DecapsulateKey) · draft-ietf-lamps-pq-composite-kem`
      : 'PKCS#11 v3.2 §5.26 (new in v3.2) · FIPS 203 Algorithm 18 (ML-KEM.Decaps)',
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

/** C_SetAttributeValue(hSession, hObject, pTemplate, ulCount) — §4.1.2 */
const decodeSetAttributeValue = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const hObject = args[1] ?? 0
  const tmpl = readTemplate(M, args[2] ?? 0, args[3] ?? 0)
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [{ name: 'hObject', value: String(hObject) }],
      },
      ...(tmpl.length ? [{ label: 'Requested Attribute Values', attributes: tmpl }] : []),
    ],
    spec: 'PKCS#11 v3.2 §4.1.2 (Modifying objects)',
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
const decodeSignMessage = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const pData = args[3] ?? 0
  const dataLen = args[4] ?? 0
  const pSignature = args[5] ?? 0
  const sigLenPtr = args[6] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        { name: 'Data Payload', value: safeReadBytesAsHex(M, pData, dataLen) },
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
    const sigLen = safeRead32(M, sigLenPtr)
    if (sigLen !== null) {
      outputs.push({ name: '*pulSignatureLen', value: `${sigLen} bytes` })
      if (pSignature !== 0 && rv === 0) {
        outputs.push({
          name: 'Signature Payload',
          value: safeReadBytesAsHex(M, pSignature, sigLen),
        })
      }
    }
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
const decodeVerifyMessage = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const pData = args[3] ?? 0
  const dataLen = args[4] ?? 0
  const pSignature = args[5] ?? 0
  const sigLen = args[6] ?? 0
  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        { name: 'Data Payload', value: safeReadBytesAsHex(M, pData, dataLen) },
        { name: 'ulSignatureLen', value: `${sigLen} bytes` },
        { name: 'Signature Payload', value: safeReadBytesAsHex(M, pSignature, sigLen) },
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

/** C_GetSessionValidationFlags(hSession, flagsType, pulFlags) — §5.6.9 (v3.2) */
const decodeGetSessionValidationFlags = (
  M: SoftHSMModule,
  args: number[],
  rv: number
): Pkcs11LogInspect => {
  const flagsType = args[1] ?? 0
  const pulFlags = args[2] ?? 0
  const flags = rv === 0 ? safeRead32(M, pulFlags) : null
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [
          {
            name: 'flagsType',
            value: flagsType === 1 ? 'CKS_LAST_VALIDATION_OK (1)' : String(flagsType),
          },
        ],
      },
    ],
    outputs:
      flags !== null
        ? [
            {
              name: '*pulFlags',
              value: `0x${flags.toString(16)}`,
              note: 'Bitmask of validation flags (this build performs no FIPS/validation-authority checks, so this is always empty)',
            },
          ]
        : undefined,
    spec: 'PKCS#11 v3.2 §5.6.9 (C_GetSessionValidationFlags)',
  }
}

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
  noteSignVerifyInit(M, 'sign', args[0] ?? 0, safeRead32(M, mechPtr), hKey)
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
  const pData = args[1] ?? 0
  const dataLen = args[2] ?? 0
  const pSignature = args[3] ?? 0
  const sigLenPtr = args[4] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        { name: 'Data Payload', value: safeReadBytesAsHex(M, pData, dataLen) },
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
    if (sigLen !== null) {
      outputs.push({ name: '*pulSignatureLen', value: `${sigLen} bytes` })
      if (pSignature !== 0 && rv === 0) {
        outputs.push({
          name: 'Signature Payload',
          value: safeReadBytesAsHex(M, pSignature, sigLen),
        })
        outputs.push(...compositeSignatureRows('sign', args[0] ?? 0, sigLen))
      }
    }
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
  noteSignVerifyInit(M, 'verify', args[0] ?? 0, safeRead32(M, mechPtr), hKey)
  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [{ name: 'hKey', value: String(hKey) }],
  })
  return { inputs, spec: 'PKCS#11 v3.2 §5.19 (C_VerifyInit)' }
}

/** C_Verify(hSession, pData, ulDataLen, pSignature, ulSignatureLen) — §5.19 */
const decodeVerify = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const pData = args[1] ?? 0
  const dataLen = args[2] ?? 0
  const pSignature = args[3] ?? 0
  const sigLen = args[4] ?? 0

  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [
          { name: 'ulDataLen', value: `${dataLen} bytes` },
          { name: 'Data Payload', value: safeReadBytesAsHex(M, pData, dataLen) },
          { name: 'ulSignatureLen', value: `${sigLen} bytes` },
          { name: 'Signature Payload', value: safeReadBytesAsHex(M, pSignature, sigLen) },
          ...compositeSignatureRows('verify', args[0] ?? 0, sigLen),
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
  const pData = args[1] ?? 0
  const dataLen = args[2] ?? 0
  const pOut = args[3] ?? 0
  const outLenPtr = args[4] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        { name: 'Plaintext Payload', value: safeReadBytesAsHex(M, pData, dataLen) },
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
    if (outLen !== null) {
      outputs.push({ name: '*pulEncryptedDataLen', value: `${outLen} bytes` })
      if (pOut !== 0 && rv === 0) {
        outputs.push({ name: 'Ciphertext Payload', value: safeReadBytesAsHex(M, pOut, outLen) })
      }
    }
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
  const pEncData = args[1] ?? 0
  const encDataLen = args[2] ?? 0
  const pOut = args[3] ?? 0
  const outLenPtr = args[4] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulEncryptedDataLen', value: `${encDataLen} bytes` },
        { name: 'Ciphertext Payload', value: safeReadBytesAsHex(M, pEncData, encDataLen) },
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
    if (outLen !== null) {
      outputs.push({ name: '*pulDataLen', value: `${outLen} bytes` })
      if (pOut !== 0 && rv === 0) {
        outputs.push({ name: 'Plaintext Payload', value: safeReadBytesAsHex(M, pOut, outLen) })
      }
    }
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
  if (safeRead32(M, mechPtr) === CKM_ML_DSA_EXTERNAL_MU_GEN) {
    const rows = readMuGenParams(
      M,
      safeRead32(M, mechPtr + 4) ?? 0,
      safeRead32(M, mechPtr + 8) ?? 0
    )
    if (rows) inputs.push({ label: `CK_MU_GEN_PARAMS (${V33_DRAFT})`, primitives: rows })
    return {
      inputs,
      spec: `PKCS#11 v3.2 §5.17 (C_DigestInit) · ${V33_DRAFT} CKM_ML_DSA_EXTERNAL_MU_GEN · FIPS 204 µ`,
    }
  }
  return { inputs, spec: 'PKCS#11 v3.2 §5.17 (C_DigestInit)' }
}

/** C_Digest(hSession, pData, ulDataLen, pDigest, pulDigestLen) — §5.17 */
const decodeDigest = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const pData = args[1] ?? 0
  const dataLen = args[2] ?? 0
  const pDigest = args[3] ?? 0
  const digestLenPtr = args[4] ?? 0

  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'ulDataLen', value: `${dataLen} bytes` },
        { name: 'Data Payload', value: safeReadBytesAsHex(M, pData, dataLen) },
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
    if (digestLen !== null) {
      outputs.push({ name: '*pulDigestLen', value: `${digestLen} bytes` })
      if (pDigest !== 0 && rv === 0) {
        outputs.push({ name: 'Digest Payload', value: safeReadBytesAsHex(M, pDigest, digestLen) })
      }
    }
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
    if (outLen !== null) {
      outputs.push({ name: '*pulWrappedKeyLen', value: `${outLen} bytes` })
      if (pOut !== 0 && rv === 0) {
        outputs.push({ name: 'Wrapped Key Payload', value: safeReadBytesAsHex(M, pOut, outLen) })
      }
    }
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.14 (C_WrapKey)',
  }
}

/** C_UnwrapKey(hSession, pMechanism, hUnwrappingKey, pWrappedKey, ulWrappedKeyLen, pTemplate, ulAttributeCount, phKey) — §5.14 */
const decodeUnwrapKey = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hUnwrappingKey = args[2] ?? 0
  const pWrappedKey = args[3] ?? 0
  const wrappedKeyLen = args[4] ?? 0
  const tmpl = readTemplate(M, args[5] ?? 0, args[6] ?? 0)

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [
      { name: 'hUnwrappingKey', value: String(hUnwrappingKey) },
      { name: 'ulWrappedKeyLen', value: `${wrappedKeyLen} bytes` },
      { name: 'Wrapped Key Payload', value: safeReadBytesAsHex(M, pWrappedKey, wrappedKeyLen) },
    ],
  })
  if (tmpl.length) inputs.push({ label: 'Unwrapped Key Template', attributes: tmpl })

  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0 && args[7]) {
    const h = safeRead32(M, args[7])
    if (h !== null) outputs.push({ name: '*phKey', value: String(h), note: 'Unwrapped key handle' })
  }

  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.14 (C_UnwrapKey)',
  }
}

// ── Object management ────────────────────────────────────────────────────────

/** C_CreateObject(hSession, pTemplate, ulCount, phObject) — §5.7.1 */
const decodeCreateObject = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const tmpl = readTemplate(M, args[1] ?? 0, args[2] ?? 0)
  const inputs: InspectSection[] = []
  if (tmpl.length) inputs.push({ label: 'Object Template', attributes: tmpl })
  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0 && args[3]) {
    const h = safeRead32(M, args[3])
    if (h !== null)
      outputs.push({ name: '*phObject', value: String(h), note: 'Created object handle' })
  }
  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.7.1 (C_CreateObject)',
  }
}

/** C_DestroyObject(hSession, hObject) — §5.7.3 */
const decodeDestroyObject = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [{ name: 'hObject', value: String(args[1] ?? '?'), note: 'Object to destroy' }],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.7.3 (C_DestroyObject)',
})

/** C_FindObjectsInit(hSession, pTemplate, ulCount) — §5.7.7 */
const decodeFindObjectsInit = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const tmpl = readTemplate(M, args[1] ?? 0, args[2] ?? 0)
  const inputs: InspectSection[] = []
  if (tmpl.length) {
    inputs.push({ label: 'Search Template', attributes: tmpl })
  } else {
    inputs.push({
      label: 'Parameters',
      primitives: [{ name: 'pTemplate', value: 'NULL', note: 'Match all objects in session' }],
    })
  }
  return { inputs, spec: 'PKCS#11 v3.2 §5.7.7 (C_FindObjectsInit)' }
}

/** C_FindObjects(hSession, phObject, ulMaxObjectCount, pulObjectCount) — §5.7.8 */
const decodeFindObjects = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const phObject = args[1] ?? 0
  const ulMax = args[2] ?? 0
  const pulCount = args[3] ?? 0
  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [{ name: 'ulMaxObjectCount', value: String(ulMax) }],
    },
  ]
  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0 && pulCount) {
    const count = safeRead32(M, pulCount)
    if (count !== null) {
      outputs.push({ name: '*pulObjectCount', value: String(count) })
      for (let i = 0; i < count && i < 8; i++) {
        const h = safeRead32(M, phObject + i * 4)
        if (h !== null)
          outputs.push({ name: `phObject[${i}]`, value: String(h), note: 'Object handle' })
      }
    }
  }
  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.7.8 (C_FindObjects)',
  }
}

/** C_FindObjectsFinal(hSession) — §5.7.9 */
const decodeFindObjectsFinal = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
  inputs: [
    {
      label: 'Parameters',
      primitives: [{ name: 'hSession', value: String(args[0] ?? '?') }],
    },
  ],
  spec: 'PKCS#11 v3.2 §5.7.9 (C_FindObjectsFinal)',
})

// ── Mechanism & token info ────────────────────────────────────────────────────

/** C_GetMechanismList(slotID, pMechanismList, pulCount) — §5.5.5 */
const decodeGetMechanismList = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const slotID = args[0] ?? 0
  const pList = args[1] ?? 0
  const pulCount = args[2] ?? 0
  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
        { name: 'slotID', value: String(slotID) },
        {
          name: 'pMechanismList',
          value: pList === 0 ? 'NULL (count query)' : `0x${pList.toString(16)}`,
          note: pList === 0 ? 'Two-step: call with NULL first to get mechanism count' : undefined,
        },
      ],
    },
  ]
  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && pulCount) {
    const count = safeRead32(M, pulCount)
    if (count !== null) {
      outputs.push({ name: '*pulCount', value: String(count), note: 'Number of mechanisms' })
      if (pList !== 0 && rv === 0) {
        const named: string[] = []
        for (let i = 0; i < count && i < 16; i++) {
          const ckm = safeRead32(M, pList + i * 4)
          if (ckm !== null) {
            const entry = MECH_TABLE[ckm >>> 0]
            named.push(entry ? entry.name : `0x${(ckm >>> 0).toString(16)}`)
          }
        }
        if (named.length) {
          outputs.push({
            name: 'Mechanisms',
            value: named.join(', ') + (count > 16 ? ` … +${count - 16} more` : ''),
          })
        }
      }
    }
  }
  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.5.5 (C_GetMechanismList)',
  }
}

/** C_GetMechanismInfo(slotID, type, pInfo) — §5.5.6 */
const decodeGetMechanismInfo = (_M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const slotID = args[0] ?? 0
  const ckmType = args[1] ?? 0
  const entry = MECH_TABLE[ckmType >>> 0]
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [
          { name: 'slotID', value: String(slotID) },
          {
            name: 'type',
            value: entry
              ? `${entry.name} (0x${(ckmType >>> 0).toString(16)})`
              : `0x${(ckmType >>> 0).toString(16)}`,
            note: entry?.description,
          },
        ],
      },
    ],
    spec: 'PKCS#11 v3.2 §5.5.6 (C_GetMechanismInfo)',
  }
}

// ── Multi-part digest ─────────────────────────────────────────────────────────

/** C_DigestUpdate(hSession, pPart, ulPartLen) — §5.12.3 */
const decodeDigestUpdate = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const pPart = args[1] ?? 0
  const partLen = args[2] ?? 0
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [
          { name: 'ulPartLen', value: `${partLen} bytes` },
          { name: 'Data Part', value: safeReadBytesAsHex(M, pPart, partLen) },
        ],
      },
    ],
    spec: 'PKCS#11 v3.2 §5.12.3 (C_DigestUpdate)',
  }
}

/** C_DigestFinal(hSession, pDigest, pulDigestLen) — §5.12.5 */
const decodeDigestFinal = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const pDigest = args[1] ?? 0
  const digestLenPtr = args[2] ?? 0
  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
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
    if (digestLen !== null) {
      outputs.push({ name: '*pulDigestLen', value: `${digestLen} bytes` })
      if (pDigest !== 0 && rv === 0)
        outputs.push({ name: 'Digest Payload', value: safeReadBytesAsHex(M, pDigest, digestLen) })
    }
  }
  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.12.5 (C_DigestFinal)',
  }
}

// ── Multi-part sign ───────────────────────────────────────────────────────────

/** C_SignUpdate(hSession, pPart, ulPartLen) — §5.13.3 */
const decodeSignUpdate = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const pPart = args[1] ?? 0
  const partLen = args[2] ?? 0
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [
          { name: 'ulPartLen', value: `${partLen} bytes` },
          { name: 'Data Part', value: safeReadBytesAsHex(M, pPart, partLen) },
        ],
      },
    ],
    spec: 'PKCS#11 v3.2 §5.13.3 (C_SignUpdate)',
  }
}

/** C_SignFinal(hSession, pSignature, pulSignatureLen) — §5.13.4 */
const decodeClassicSignFinal = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const pSignature = args[1] ?? 0
  const sigLenPtr = args[2] ?? 0
  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [
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
    if (sigLen !== null) {
      outputs.push({ name: '*pulSignatureLen', value: `${sigLen} bytes` })
      if (pSignature !== 0 && rv === 0)
        outputs.push({
          name: 'Signature Payload',
          value: safeReadBytesAsHex(M, pSignature, sigLen),
        })
      if (pSignature !== 0 && rv === 0)
        outputs.push(...compositeSignatureRows('sign', args[0] ?? 0, sigLen))
    }
  }
  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.13.4 (C_SignFinal)',
  }
}

// ── Random / utility ─────────────────────────────────────────────────────────

/** C_SeedRandom(hSession, pSeed, ulSeedLen) — §5.19.1 */
const decodeSeedRandom = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const pSeed = args[1] ?? 0
  const seedLen = args[2] ?? 0
  return {
    inputs: [
      {
        label: 'Parameters',
        primitives: [
          { name: 'ulSeedLen', value: `${seedLen} bytes` },
          { name: 'Seed', value: safeReadBytesAsHex(M, pSeed, seedLen) },
        ],
      },
    ],
    spec: 'PKCS#11 v3.2 §5.19.1 (C_SeedRandom)',
  }
}

// ── Authenticated key wrapping (§5.18.6–7) ───────────────────────────────────

/**
 * C_WrapKeyAuthenticated(hSession, pMechanism, hWrappingKey, hKey,
 *   pAssociatedData, ulAssociatedDataLen, pWrappedKey, pulWrappedKeyLen) — §5.18.6
 */
const decodeWrapKeyAuthenticated = (
  M: SoftHSMModule,
  args: number[],
  rv: number
): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hWrappingKey = args[2] ?? 0
  const hKey = args[3] ?? 0
  const pAad = args[4] ?? 0
  const aadLen = args[5] ?? 0
  const pOut = args[6] ?? 0
  const outLenPtr = args[7] ?? 0

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [
      { name: 'hWrappingKey', value: String(hWrappingKey) },
      { name: 'hKey', value: String(hKey), note: 'Key to wrap' },
      {
        name: 'pWrappedKey',
        value: pOut === 0 ? 'NULL (size query)' : `0x${pOut.toString(16)}`,
        note: pOut === 0 ? 'Two-step: call with NULL first to get output length' : undefined,
      },
      ...(aadLen > 0
        ? [{ name: 'AAD', value: safeReadBytesAsHex(M, pAad, aadLen) }]
        : [{ name: 'pAssociatedData', value: 'NULL', note: 'No additional authenticated data' }]),
    ],
  })

  const outputs: Pkcs11LogInspect['outputs'] = []
  if ((rv === 0 || rv === 0x150) && outLenPtr) {
    const outLen = safeRead32(M, outLenPtr)
    if (outLen !== null) {
      outputs.push({ name: '*pulWrappedKeyLen', value: `${outLen} bytes` })
      if (pOut !== 0 && rv === 0)
        outputs.push({ name: 'Wrapped Key Payload', value: safeReadBytesAsHex(M, pOut, outLen) })
    }
  }
  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.18.6 (C_WrapKeyAuthenticated)',
  }
}

/**
 * C_UnwrapKeyAuthenticated(hSession, pMechanism, hUnwrappingKey, pWrappedKey,
 *   ulWrappedKeyLen, pTemplate, ulAttributeCount,
 *   pAssociatedData, ulAssociatedDataLen, phKey) — §5.18.7
 */
const decodeUnwrapKeyAuthenticated = (
  M: SoftHSMModule,
  args: number[],
  rv: number
): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const hUnwrappingKey = args[2] ?? 0
  const pWrappedKey = args[3] ?? 0
  const wrappedKeyLen = args[4] ?? 0
  const tmpl = readTemplate(M, args[5] ?? 0, args[6] ?? 0)
  const pAad = args[7] ?? 0
  const aadLen = args[8] ?? 0

  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({
    label: 'Parameters',
    primitives: [
      { name: 'hUnwrappingKey', value: String(hUnwrappingKey) },
      { name: 'ulWrappedKeyLen', value: `${wrappedKeyLen} bytes` },
      { name: 'Wrapped Key Payload', value: safeReadBytesAsHex(M, pWrappedKey, wrappedKeyLen) },
      ...(aadLen > 0
        ? [{ name: 'AAD', value: safeReadBytesAsHex(M, pAad, aadLen) }]
        : [{ name: 'pAssociatedData', value: 'NULL', note: 'No additional authenticated data' }]),
    ],
  })
  if (tmpl.length) inputs.push({ label: 'Unwrapped Key Template', attributes: tmpl })

  const outputs: Pkcs11LogInspect['outputs'] = []
  if (rv === 0 && args[9]) {
    const h = safeRead32(M, args[9])
    if (h !== null) outputs.push({ name: '*phKey', value: String(h), note: 'Unwrapped key handle' })
  }
  return {
    inputs,
    outputs: outputs.length ? outputs : undefined,
    spec: 'PKCS#11 v3.2 §5.18.7 (C_UnwrapKeyAuthenticated)',
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

// ── PKCS#11 v3.x coverage: multi-part, Message API, recover, info structs ────
//
// Signatures from pqctoday-hsm src/lib/pkcs11/pkcs11f.h; struct offsets are
// the wasm32 ABI (4-byte CK_ULONG and pointers, CK_VERSION = 2 bytes), the
// same offsets softhsm.ts's hsm_get*Info readers use.

type Row = { name: string; value: string; note?: string }

const paramsOnly = (rows: Row[], spec: string, outputs?: Row[]): Pkcs11LogInspect => ({
  inputs: [{ label: 'Parameters', primitives: rows }],
  outputs: outputs && outputs.length ? outputs : undefined,
  spec,
})

const outPtrRow = (name: string, p: number): Row => ({
  name,
  value: p === 0 ? 'NULL (size query)' : `0x${p.toString(16)}`,
  note: p === 0 ? 'Two-step: call with NULL first to get the output length' : undefined,
})

/** Output length (+ payload when written) behind a CK_ULONG_PTR length. */
const lenAndPayload = (
  M: SoftHSMModule,
  rv: number,
  pOut: number,
  pulLen: number,
  lenName: string,
  payloadName: string
): Row[] => {
  const rows: Row[] = []
  if ((rv === 0 || rv === 0x150) && pulLen) {
    const n = safeRead32(M, pulLen)
    if (n !== null) {
      rows.push({ name: lenName, value: `${n} bytes` })
      if (pOut !== 0 && rv === 0 && n > 0)
        rows.push({ name: payloadName, value: safeReadBytesAsHex(M, pOut, n) })
    }
  }
  return rows
}

const verificationRow = (rv: number): Row[] =>
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
      : []

/** Blank-padded fixed-width UTF-8 field (CK_INFO / CK_TOKEN_INFO strings). */
const readFixedText = (M: SoftHSMModule, ptr: number, len: number): string => {
  try {
    return `"${new TextDecoder().decode(M.HEAPU8.slice(ptr, ptr + len)).replace(/[\s\x00]+$/, '')}"`
  } catch {
    return '(unreadable)'
  }
}

/** NUL-terminated UTF-8 string (CK_UTF8CHAR_PTR names), capped at `max`. */
const readCString = (M: SoftHSMModule, ptr: number, max = 64): string => {
  if (!ptr) return 'NULL'
  try {
    const bytes = M.HEAPU8.slice(ptr, ptr + max)
    const end = bytes.indexOf(0)
    return `"${new TextDecoder().decode(end === -1 ? bytes : bytes.slice(0, end))}"`
  } catch {
    return '(unreadable)'
  }
}

const readVersion = (M: SoftHSMModule, ptr: number): string => {
  try {
    return `${M.HEAPU8[ptr]}.${M.HEAPU8[ptr + 1]}`
  } catch {
    return '?'
  }
}

const flagNames = (flags: number, table: Array<[number, string]>): string => {
  const names = table.filter(([bit]) => flags & bit).map(([, n]) => n)
  const raw = `0x${flags.toString(16).padStart(8, '0')}`
  return names.length ? `${names.join(' | ')} (${raw})` : raw
}

const CKF_SLOT_FLAGS: Array<[number, string]> = [
  [0x1, 'CKF_TOKEN_PRESENT'],
  [0x2, 'CKF_REMOVABLE_DEVICE'],
  [0x4, 'CKF_HW_SLOT'],
]

const CKF_TOKEN_FLAGS: Array<[number, string]> = [
  [0x1, 'CKF_RNG'],
  [0x2, 'CKF_WRITE_PROTECTED'],
  [0x4, 'CKF_LOGIN_REQUIRED'],
  [0x8, 'CKF_USER_PIN_INITIALIZED'],
  [0x20, 'CKF_RESTORE_KEY_NOT_NEEDED'],
  [0x40, 'CKF_CLOCK_ON_TOKEN'],
  [0x100, 'CKF_PROTECTED_AUTHENTICATION_PATH'],
  [0x200, 'CKF_DUAL_CRYPTO_OPERATIONS'],
  [0x400, 'CKF_TOKEN_INITIALIZED'],
  [0x800, 'CKF_SECONDARY_AUTHENTICATION'],
  [0x10000, 'CKF_USER_PIN_COUNT_LOW'],
  [0x20000, 'CKF_USER_PIN_FINAL_TRY'],
  [0x40000, 'CKF_USER_PIN_LOCKED'],
  [0x80000, 'CKF_USER_PIN_TO_BE_CHANGED'],
  [0x100000, 'CKF_SO_PIN_COUNT_LOW'],
  [0x200000, 'CKF_SO_PIN_FINAL_TRY'],
  [0x400000, 'CKF_SO_PIN_LOCKED'],
  [0x800000, 'CKF_SO_PIN_TO_BE_CHANGED'],
  [0x1000000, 'CKF_ERROR_STATE'],
  [0x2000000, 'CKF_SEED_RANDOM_REQUIRED'],
]

const CKF_SESSION_INFO_FLAGS: Array<[number, string]> = [
  [0x2, 'CKF_RW_SESSION'],
  [0x4, 'CKF_SERIAL_SESSION'],
  [0x8, 'CKF_ASYNC_SESSION'],
]

/** Operation flags (CK_MECHANISM_INFO.flags bits) — C_SessionCancel's mask. */
const CKF_OPERATION_FLAGS: Array<[number, string]> = [
  [0x2, 'CKF_MESSAGE_ENCRYPT'],
  [0x4, 'CKF_MESSAGE_DECRYPT'],
  [0x8, 'CKF_MESSAGE_SIGN'],
  [0x10, 'CKF_MESSAGE_VERIFY'],
  [0x100, 'CKF_ENCRYPT'],
  [0x200, 'CKF_DECRYPT'],
  [0x400, 'CKF_DIGEST'],
  [0x800, 'CKF_SIGN'],
  [0x1000, 'CKF_SIGN_RECOVER'],
  [0x2000, 'CKF_VERIFY'],
  [0x4000, 'CKF_VERIFY_RECOVER'],
  [0x8000, 'CKF_GENERATE'],
  [0x10000, 'CKF_GENERATE_KEY_PAIR'],
  [0x20000, 'CKF_WRAP'],
  [0x40000, 'CKF_UNWRAP'],
  [0x80000, 'CKF_DERIVE'],
  [0x10000000, 'CKF_ENCAPSULATE'],
  [0x20000000, 'CKF_DECAPSULATE'],
]

const CKS_TABLE: Record<number, string> = {
  0: 'CKS_RO_PUBLIC_SESSION',
  1: 'CKS_RO_USER_FUNCTIONS',
  2: 'CKS_RW_PUBLIC_SESSION',
  3: 'CKS_RW_USER_FUNCTIONS',
  4: 'CKS_RW_SO_FUNCTIONS',
}

const CKG_TABLE: Record<number, string> = {
  0: 'CKG_NO_GENERATE',
  1: 'CKG_GENERATE',
  2: 'CKG_GENERATE_COUNTER',
  3: 'CKG_GENERATE_RANDOM',
  4: 'CKG_GENERATE_COUNTER_XOR',
}

// ── HPKE (CKM_HPKE, PQCToday vendor) — the X-Wing / PQ-T hybrid path ─────────

const CKD_HPKE_TABLE: Record<number, string> = {
  0x0001: 'HKDF-SHA256',
  0x0002: 'HKDF-SHA384',
  0x0003: 'HKDF-SHA512',
  0x0011: 'SHAKE256 (one-stage, draft-ietf-hpke-pq)',
}
const CKZ_HPKE_AEAD_TABLE: Record<number, string> = {
  0x0001: 'AES-128-GCM',
  0x0002: 'AES-256-GCM',
  0x0003: 'ChaCha20-Poly1305',
  0xffff: 'Export-only (no AEAD)',
}
const CKZ_HPKE_MODE_TABLE: Record<number, string> = {
  0: 'Base',
  1: 'PSK',
  2: 'Auth',
  3: 'AuthPSK',
}

const idName = (table: Record<number, string>, v: number) => {
  const n = table[v]
  const hex = `0x${v.toString(16).padStart(4, '0')}`
  return n ? `${n} (${hex})` : hex
}

/**
 * CK_HPKE_PARAMS (68 bytes on wasm32 — 17 words; layout in softhsm.ts
 * buildHpkeParams): kemId, kdfId, aeadId, mode, hPsk, pPskId, ulPskIdLen,
 * pInfo, ulInfoLen, hSenderStaticKey, pSenderPk, ulSenderPkLen, pBaseNonce,
 * ulBaseNonceLen, pExporterKey, pEphemeralSeed, ulEphemeralSeedLen.
 */
const CKM_HPKE = 0x80000014
const readHpkeParamsSection = (M: SoftHSMModule, mechPtr: number): InspectSection | null => {
  if (safeRead32(M, mechPtr) !== CKM_HPKE) return null
  const p = safeRead32(M, mechPtr + 4)
  const len = safeRead32(M, mechPtr + 8)
  if (!p || len === null || len < 68) return null
  const w = (i: number) => safeRead32(M, p + i * 4) ?? 0
  const kem = CKP_HPKE_KEM[w(0)]
  const rows: Row[] = [
    {
      name: 'kemId',
      value: kem
        ? `${kem.name} (0x${w(0).toString(16).padStart(4, '0')})`
        : `0x${w(0).toString(16)}`,
      note: kem?.description,
    },
    { name: 'kdfId', value: idName(CKD_HPKE_TABLE, w(1)) },
    { name: 'aeadId', value: idName(CKZ_HPKE_AEAD_TABLE, w(2)) },
    { name: 'mode', value: idName(CKZ_HPKE_MODE_TABLE, w(3)) },
  ]
  if (w(4)) rows.push({ name: 'hPsk', value: String(w(4)) })
  if (w(6)) rows.push({ name: 'pskId', value: `${w(6)} bytes` })
  rows.push({
    name: 'info',
    value: w(8) ? `${w(8)} bytes  [${safeReadBytesAsHex(M, w(7), w(8), 16)}]` : 'empty',
  })
  if (w(9))
    rows.push({ name: 'hSenderStaticKey', value: String(w(9)), note: 'Auth mode sender key' })
  if (w(11))
    rows.push({ name: 'senderPk', value: `${w(11)} bytes`, note: 'Auth mode sender public key' })
  if (w(12) && w(13)) {
    const nonce = safeReadBytesAsHex(M, w(12), w(13))
    if (nonce && !/^0+$/.test(nonce))
      rows.push({ name: 'baseNonce', value: nonce, note: 'Written by the token' })
  }
  if (w(14))
    rows.push({
      name: 'pExporterKey',
      value: 'requested',
      note: 'CK_DERIVED_KEY for the exporter secret',
    })
  if (w(16))
    rows.push({
      name: 'ephemeralSeed',
      value: `${w(16)} bytes`,
      note: 'Fixed encapsulation randomness — known-answer tests only',
    })
  return { label: 'CK_HPKE_PARAMS', primitives: rows }
}

// ── Random ───────────────────────────────────────────────────────────────────

/** C_GenerateRandom(hSession, pRandomData, ulRandomLen) — §5.19 */
const decodeGenerateRandom = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const p = args[1] ?? 0
  const n = args[2] ?? 0
  return paramsOnly(
    [{ name: 'ulRandomLen', value: `${n} bytes` }],
    'PKCS#11 v3.2 §5.19 (C_GenerateRandom)',
    rv === 0 && p && n ? [{ name: 'Random Data', value: safeReadBytesAsHex(M, p, n) }] : undefined
  )
}

// ── Multi-part encrypt / decrypt / verify ────────────────────────────────────

/** C_EncryptUpdate / C_DecryptUpdate / dual-function updates:
 *  (hSession, pIn, ulInLen, pOut, pulOutLen) */
const decodeUpdateWithOutput =
  (fn: string, inName: string, outName: string, spec: string) =>
  (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
    const pIn = args[1] ?? 0
    const inLen = args[2] ?? 0
    const pOut = args[3] ?? 0
    return paramsOnly(
      [
        { name: 'ulPartLen', value: `${inLen} bytes` },
        { name: inName, value: safeReadBytesAsHex(M, pIn, inLen) },
        outPtrRow('pOutPart', pOut),
      ],
      `${spec} (${fn})`,
      lenAndPayload(M, rv, pOut, args[4] ?? 0, '*pulOutPartLen', outName)
    )
  }

/** C_EncryptFinal / C_DecryptFinal (hSession, pLastPart, pulLastPartLen) */
const decodeFinalWithOutput =
  (fn: string, outName: string, spec: string) =>
  (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
    const pOut = args[1] ?? 0
    return paramsOnly(
      [outPtrRow('pLastPart', pOut)],
      `${spec} (${fn})`,
      lenAndPayload(M, rv, pOut, args[2] ?? 0, '*pulLastPartLen', outName)
    )
  }

/** C_VerifyUpdate(hSession, pPart, ulPartLen) — §5.19 */
const decodeVerifyUpdate = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect =>
  paramsOnly(
    [
      { name: 'ulPartLen', value: `${args[2] ?? 0} bytes` },
      { name: 'Data Part', value: safeReadBytesAsHex(M, args[1] ?? 0, args[2] ?? 0) },
    ],
    'PKCS#11 v3.2 §5.19 (C_VerifyUpdate)'
  )

/** C_VerifyFinal(hSession, pSignature, ulSignatureLen) — §5.19 */
const decodeClassicVerifyFinal = (
  M: SoftHSMModule,
  args: number[],
  rv: number
): Pkcs11LogInspect => {
  const sigLen = args[2] ?? 0
  return paramsOnly(
    [
      { name: 'ulSignatureLen', value: `${sigLen} bytes` },
      { name: 'Signature Payload', value: safeReadBytesAsHex(M, args[1] ?? 0, sigLen) },
      ...compositeSignatureRows('verify', args[0] ?? 0, sigLen),
    ],
    'PKCS#11 v3.2 §5.19 (C_VerifyFinal)',
    verificationRow(rv)
  )
}

// ── v3.2 single-shot signature verification (§5.20) ─────────────────────────

/** C_VerifySignatureInit(hSession, pMechanism, hKey, pSignature, ulSignatureLen) */
const decodeVerifySignatureInit = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const mechPtr = args[1] ?? 0
  const mech = readMechanism(M, mechPtr)
  const mechType = safeRead32(M, mechPtr)
  const hKey = args[2] ?? 0
  const sigLen = args[4] ?? 0
  const rows: Row[] = [
    { name: 'hKey', value: String(hKey) },
    { name: 'ulSignatureLen', value: `${sigLen} bytes` },
    { name: 'Signature Payload', value: safeReadBytesAsHex(M, args[3] ?? 0, sigLen) },
  ]
  if (mechType !== null && isCompSigMech(mechType)) {
    const sp = splitCompositeSignature(sigLen, readKeyParamSet(M, args[0] ?? 0, hKey))
    if (sp) rows.push(...splitRows('Signature', sp))
  }
  const inputs: InspectSection[] = []
  if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
  inputs.push({ label: 'Parameters', primitives: rows })
  return {
    inputs,
    spec: 'PKCS#11 v3.2 §5.20 (C_VerifySignatureInit — the signature is supplied up front)',
  }
}

/** C_VerifySignature(hSession, pData, ulDataLen) */
const decodeVerifySignature = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect =>
  paramsOnly(
    [
      { name: 'ulDataLen', value: `${args[2] ?? 0} bytes` },
      { name: 'Data Payload', value: safeReadBytesAsHex(M, args[1] ?? 0, args[2] ?? 0) },
    ],
    'PKCS#11 v3.2 §5.20 (C_VerifySignature)',
    verificationRow(rv)
  )

/** C_VerifySignatureUpdate(hSession, pPart, ulPartLen) */
const decodeVerifySignatureUpdate = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect =>
  paramsOnly(
    [
      { name: 'ulPartLen', value: `${args[2] ?? 0} bytes` },
      { name: 'Data Part', value: safeReadBytesAsHex(M, args[1] ?? 0, args[2] ?? 0) },
    ],
    'PKCS#11 v3.2 §5.20 (C_VerifySignatureUpdate)'
  )

/** C_VerifySignatureFinal(hSession) */
const decodeVerifySignatureFinal = (_M: SoftHSMModule, args: number[], rv: number) =>
  paramsOnly(
    [{ name: 'hSession', value: String(args[0] ?? '?') }],
    'PKCS#11 v3.2 §5.20 (C_VerifySignatureFinal)',
    verificationRow(rv)
  )

// ── Sign / verify with recovery (§5.13, §5.14) ──────────────────────────────

/** C_SignRecoverInit / C_VerifyRecoverInit (hSession, pMechanism, hKey) */
const decodeRecoverInit =
  (fn: string, spec: string) =>
  (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
    const mech = readMechanism(M, args[1] ?? 0)
    const inputs: InspectSection[] = []
    if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
    inputs.push({
      label: 'Parameters',
      primitives: [{ name: 'hKey', value: String(args[2] ?? 0) }],
    })
    return { inputs, spec: `${spec} (${fn})` }
  }

/** C_SignRecover(hSession, pData, ulDataLen, pSignature, pulSignatureLen) */
const decodeSignRecover = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect =>
  paramsOnly(
    [
      { name: 'ulDataLen', value: `${args[2] ?? 0} bytes` },
      { name: 'Data Payload', value: safeReadBytesAsHex(M, args[1] ?? 0, args[2] ?? 0) },
      outPtrRow('pSignature', args[3] ?? 0),
    ],
    'PKCS#11 v3.2 §5.13 (C_SignRecover — data is recoverable from the signature)',
    lenAndPayload(M, rv, args[3] ?? 0, args[4] ?? 0, '*pulSignatureLen', 'Signature Payload')
  )

/** C_VerifyRecover(hSession, pSignature, ulSignatureLen, pData, pulDataLen) */
const decodeVerifyRecover = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect =>
  paramsOnly(
    [
      { name: 'ulSignatureLen', value: `${args[2] ?? 0} bytes` },
      { name: 'Signature Payload', value: safeReadBytesAsHex(M, args[1] ?? 0, args[2] ?? 0) },
      outPtrRow('pData', args[3] ?? 0),
    ],
    'PKCS#11 v3.2 §5.14 (C_VerifyRecover)',
    [
      ...lenAndPayload(M, rv, args[3] ?? 0, args[4] ?? 0, '*pulDataLen', 'Recovered Data'),
      ...(rv === 0xc0 ? verificationRow(rv) : []),
    ]
  )

// ── Message API: multi-part sign / verify (§5.20-5.21) ──────────────────────

const messageParamRows = (M: SoftHSMModule, p: number, len: number): Row[] => {
  if (!p || !len)
    return [{ name: 'pParameter', value: 'NULL', note: 'Per-message context unchanged' }]
  const sp = len >= 12 ? readSignParam(M, p, len) : null
  return sp
    ? [
        { name: 'hedgeVariant', value: sp.hedgeName, note: sp.hedgeDescription },
        { name: 'ulContextLen', value: `${sp.contextLen} bytes`, note: sp.contextHex },
      ]
    : [{ name: 'pParameter', value: `${len} bytes  [${safeReadBytesAsHex(M, p, len, 16)}]` }]
}

/** C_SignMessageBegin / C_VerifyMessageBegin (hSession, pParameter, ulParameterLen) */
const decodeMessageBegin =
  (isVerify: boolean) =>
  (M: SoftHSMModule, args: number[]): Pkcs11LogInspect =>
    paramsOnly(
      messageParamRows(M, args[1] ?? 0, args[2] ?? 0),
      `${signSpec(_lastMessageAlgo, isVerify)} (C_${isVerify ? 'Verify' : 'Sign'}MessageBegin — starts one message)`
    )

/** C_SignMessageNext(hSession, pParameter, ulParameterLen, pData, ulDataLen, pSignature, pulSignatureLen)
 *  pulSignatureLen = NULL means "more parts follow"; non-NULL finishes the message. */
const decodeSignMessageNext = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const pSig = args[5] ?? 0
  const pulSig = args[6] ?? 0
  return paramsOnly(
    [
      ...messageParamRows(M, args[1] ?? 0, args[2] ?? 0),
      { name: 'ulDataLen', value: `${args[4] ?? 0} bytes` },
      { name: 'Data Part', value: safeReadBytesAsHex(M, args[3] ?? 0, args[4] ?? 0) },
      {
        name: 'pulSignatureLen',
        value: pulSig ? 'set' : 'NULL',
        note: pulSig ? 'Last part — the signature is produced' : 'More parts follow',
      },
    ],
    `${signSpec(_lastMessageAlgo, false)} (C_SignMessageNext)`,
    pulSig ? lenAndPayload(M, rv, pSig, pulSig, '*pulSignatureLen', 'Signature Payload') : undefined
  )
}

/** C_VerifyMessageNext(hSession, pParameter, ulParameterLen, pData, ulDataLen, pSignature, ulSignatureLen)
 *  pSignature = NULL means "more parts follow". */
const decodeVerifyMessageNext = (
  M: SoftHSMModule,
  args: number[],
  rv: number
): Pkcs11LogInspect => {
  const pSig = args[5] ?? 0
  const sigLen = args[6] ?? 0
  const rows: Row[] = [
    ...messageParamRows(M, args[1] ?? 0, args[2] ?? 0),
    { name: 'ulDataLen', value: `${args[4] ?? 0} bytes` },
    { name: 'Data Part', value: safeReadBytesAsHex(M, args[3] ?? 0, args[4] ?? 0) },
  ]
  if (pSig) {
    rows.push({ name: 'ulSignatureLen', value: `${sigLen} bytes`, note: 'Last part — checked now' })
    rows.push({ name: 'Signature Payload', value: safeReadBytesAsHex(M, pSig, sigLen) })
  } else rows.push({ name: 'pSignature', value: 'NULL', note: 'More parts follow' })
  return paramsOnly(
    rows,
    `${signSpec(_lastMessageAlgo, true)} (C_VerifyMessageNext)`,
    pSig ? verificationRow(rv) : undefined
  )
}

// ── Message API: AEAD encrypt / decrypt (§5.16-5.17) ────────────────────────

/** C_MessageEncryptInit / C_MessageDecryptInit (hSession, pMechanism, hKey) */
const decodeMessageCipherInit =
  (fn: string) =>
  (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
    const mech = readMechanism(M, args[1] ?? 0)
    const inputs: InspectSection[] = []
    if (mech) inputs.push({ label: 'Mechanism', mechanism: mech })
    inputs.push({
      label: 'Parameters',
      primitives: [{ name: 'hKey', value: String(args[2] ?? 0) }],
    })
    return { inputs, spec: `PKCS#11 v3.2 §5.16 (${fn} — one key, many messages)` }
  }

/**
 * Per-message AEAD parameter, told apart by size (wasm32):
 *   CK_GCM_MESSAGE_PARAMS 24 B: pIv, ulIvLen, ulIvFixedBits, ivGenerator, pTag, ulTagBits
 *   CK_CCM_MESSAGE_PARAMS 28 B: ulDataLen, pNonce, ulNonceLen, ulNonceFixedBits, nonceGenerator, pMAC, ulMACLen
 *   CK_SALSA20_CHACHA20_POLY1305_MSG_PARAMS 12 B: pNonce, ulNonceLen, pTag
 * The IV/nonce and tag are read after the call, so token-generated values show.
 */
const aeadMessageParamRows = (M: SoftHSMModule, p: number, len: number): Row[] => {
  const w = (i: number) => safeRead32(M, p + i * 4) ?? 0
  if (!p) return [{ name: 'pParameter', value: 'NULL' }]
  if (len === 24) {
    const tagBytes = Math.floor(w(5) / 8)
    return [
      { name: 'IV', value: `${w(1)} bytes  [${safeReadBytesAsHex(M, w(0), w(1))}]` },
      { name: 'ulIvFixedBits', value: String(w(2)) },
      { name: 'ivGenerator', value: CKG_TABLE[w(3)] ?? `0x${w(3).toString(16)}` },
      { name: 'Tag', value: `${w(5)} bits  [${safeReadBytesAsHex(M, w(4), tagBytes)}]` },
    ]
  }
  if (len === 28)
    return [
      { name: 'ulDataLen', value: `${w(0)} bytes` },
      { name: 'Nonce', value: `${w(2)} bytes  [${safeReadBytesAsHex(M, w(1), w(2))}]` },
      { name: 'nonceGenerator', value: CKG_TABLE[w(4)] ?? `0x${w(4).toString(16)}` },
      { name: 'MAC', value: `${w(6)} bytes  [${safeReadBytesAsHex(M, w(5), w(6))}]` },
    ]
  if (len === 12)
    return [
      { name: 'Nonce', value: `${w(1)} bytes  [${safeReadBytesAsHex(M, w(0), w(1))}]` },
      { name: 'Tag', value: `16 bytes  [${safeReadBytesAsHex(M, w(2), 16)}]` },
    ]
  return [{ name: 'pParameter', value: `${len} bytes  [${safeReadBytesAsHex(M, p, len, 16)}]` }]
}

/** C_EncryptMessage(hSession, pParameter, ulParameterLen, pAssociatedData, ulAssociatedDataLen,
 *  pPlaintext, ulPlaintextLen, pCiphertext, pulCiphertextLen)
 *  C_DecryptMessage: same shape, ciphertext in / plaintext out. */
const decodeCipherMessage =
  (isDecrypt: boolean) =>
  (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
    const inName = isDecrypt ? 'Ciphertext' : 'Plaintext'
    const outName = isDecrypt ? 'Plaintext Payload' : 'Ciphertext Payload'
    return {
      inputs: [
        {
          label: 'Message parameter',
          primitives: aeadMessageParamRows(M, args[1] ?? 0, args[2] ?? 0),
        },
        {
          label: 'Parameters',
          primitives: [
            { name: 'ulAssociatedDataLen', value: `${args[4] ?? 0} bytes` },
            { name: 'Associated Data', value: safeReadBytesAsHex(M, args[3] ?? 0, args[4] ?? 0) },
            { name: `ul${inName}Len`, value: `${args[6] ?? 0} bytes` },
            { name: `${inName} Payload`, value: safeReadBytesAsHex(M, args[5] ?? 0, args[6] ?? 0) },
            outPtrRow(isDecrypt ? 'pPlaintext' : 'pCiphertext', args[7] ?? 0),
          ],
        },
      ],
      outputs: (() => {
        const o = lenAndPayload(
          M,
          rv,
          args[7] ?? 0,
          args[8] ?? 0,
          isDecrypt ? '*pulPlaintextLen' : '*pulCiphertextLen',
          outName
        )
        if (isDecrypt && rv === 0x42)
          o.push({
            name: 'Authentication',
            value: 'FAILED — tag does not match',
            note: 'CKR_AEAD_DECRYPT_FAILED',
          })
        return o.length ? o : undefined
      })(),
      spec: `PKCS#11 v3.2 §${isDecrypt ? '5.17' : '5.16'} (C_${isDecrypt ? 'Decrypt' : 'Encrypt'}Message)`,
    }
  }

/** C_EncryptMessageBegin / C_DecryptMessageBegin
 *  (hSession, pParameter, ulParameterLen, pAssociatedData, ulAssociatedDataLen) */
const decodeCipherMessageBegin =
  (fn: string) =>
  (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => ({
    inputs: [
      {
        label: 'Message parameter',
        primitives: aeadMessageParamRows(M, args[1] ?? 0, args[2] ?? 0),
      },
      {
        label: 'Parameters',
        primitives: [
          { name: 'ulAssociatedDataLen', value: `${args[4] ?? 0} bytes` },
          { name: 'Associated Data', value: safeReadBytesAsHex(M, args[3] ?? 0, args[4] ?? 0) },
        ],
      },
    ],
    spec: `PKCS#11 v3.2 §5.16 (${fn})`,
  })

/** C_EncryptMessageNext / C_DecryptMessageNext
 *  (hSession, pParameter, ulParameterLen, pIn, ulInLen, pOut, pulOutLen, flags) */
const decodeCipherMessageNext =
  (fn: string, isDecrypt: boolean) =>
  (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
    const last = ((args[7] ?? 0) & 0x1) !== 0
    return {
      inputs: [
        {
          label: 'Message parameter',
          primitives: aeadMessageParamRows(M, args[1] ?? 0, args[2] ?? 0),
        },
        {
          label: 'Parameters',
          primitives: [
            { name: 'ulPartLen', value: `${args[4] ?? 0} bytes` },
            { name: 'Data Part', value: safeReadBytesAsHex(M, args[3] ?? 0, args[4] ?? 0) },
            {
              name: 'flags',
              value: last ? 'CKF_END_OF_MESSAGE (0x1)' : '0',
              note: last ? 'Last part of this message' : 'More parts follow',
            },
          ],
        },
      ],
      outputs: (() => {
        const o = lenAndPayload(
          M,
          rv,
          args[5] ?? 0,
          args[6] ?? 0,
          '*pulOutPartLen',
          isDecrypt ? 'Plaintext Part' : 'Ciphertext Part'
        )
        return o.length ? o : undefined
      })(),
      spec: `PKCS#11 v3.2 §5.16 (${fn})`,
    }
  }

/** C_MessageEncryptFinal / C_MessageDecryptFinal (hSession) */
const decodeMessageCipherFinal = (fn: string) => (_M: SoftHSMModule, args: number[]) =>
  paramsOnly(
    [{ name: 'hSession', value: String(args[0] ?? '?') }],
    `PKCS#11 v3.2 §5.16 (${fn} — closes the message-based operation)`
  )

// ── Session, admin, info ────────────────────────────────────────────────────

/** C_LoginUser(hSession, userType, pPin, ulPinLen, pUsername, ulUsernameLen) — §5.6 */
const decodeLoginUser = (M: SoftHSMModule, args: number[]): Pkcs11LogInspect => {
  const userType = args[1] ?? 0
  const entry = CKU_TABLE[userType]
  const pUser = args[4] ?? 0
  const userLen = args[5] ?? 0
  let username = 'NULL'
  if (pUser && userLen) {
    try {
      username = `"${new TextDecoder().decode(M.HEAPU8.slice(pUser, pUser + Math.min(userLen, 64)))}"`
    } catch {
      username = '(unreadable)'
    }
  }
  return paramsOnly(
    [
      {
        name: 'userType',
        value: entry ? `${entry.name} (${userType})` : String(userType),
        note: entry?.description,
      },
      { name: 'ulPinLen', value: String(args[3] ?? '?'), note: 'PIN value never shown' },
      { name: 'pUsername', value: username },
    ],
    'PKCS#11 v3.2 §5.6 (C_LoginUser — named-user login)'
  )
}

/** C_SetPIN(hSession, pOldPin, ulOldLen, pNewPin, ulNewLen) — §5.6 */
const decodeSetPIN = (_M: SoftHSMModule, args: number[]) =>
  paramsOnly(
    [
      { name: 'ulOldLen', value: String(args[2] ?? '?') },
      { name: 'ulNewLen', value: String(args[4] ?? '?'), note: 'PIN values never shown' },
    ],
    'PKCS#11 v3.2 §5.6 (C_SetPIN)'
  )

const readInterface = (M: SoftHSMModule, p: number): Row[] => {
  const name = readCString(M, safeRead32(M, p) ?? 0)
  const fl = safeRead32(M, p + 4)
  const version = fl ? readVersion(M, fl) : '?'
  const flags = safeRead32(M, p + 8) ?? 0
  return [
    {
      name: `${name} ${version}`,
      value: flags & 0x1 ? 'CKF_INTERFACE_FORK_SAFE' : 'no flags',
    },
  ]
}

/** C_GetInterfaceList(pInterfacesList, pulCount) — §5.4 */
const decodeGetInterfaceList = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const pList = args[0] ?? 0
  const count = (rv === 0 || rv === 0x150) && args[1] ? safeRead32(M, args[1]) : null
  const outputs: Row[] = []
  if (count !== null) outputs.push({ name: '*pulCount', value: String(count) })
  if (rv === 0 && pList && count)
    for (let i = 0; i < Math.min(count, 8); i++) outputs.push(...readInterface(M, pList + i * 12))
  return paramsOnly(
    [outPtrRow('pInterfacesList', pList)],
    'PKCS#11 v3.2 §5.4 (C_GetInterfaceList)',
    outputs
  )
}

/** C_GetInterface(pInterfaceName, pVersion, ppInterface, flags) — §5.4 */
const decodeGetInterface = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const pName = args[0] ?? 0
  const pVer = args[1] ?? 0
  const outputs: Row[] = []
  if (rv === 0 && args[2]) {
    const pIface = safeRead32(M, args[2])
    if (pIface) outputs.push(...readInterface(M, pIface))
  }
  return paramsOnly(
    [
      {
        name: 'pInterfaceName',
        value: pName ? readCString(M, pName) : 'NULL',
        note: pName ? undefined : 'Default interface',
      },
      {
        name: 'pVersion',
        value: pVer ? readVersion(M, pVer) : 'NULL',
        note: pVer ? undefined : 'Any version',
      },
      { name: 'flags', value: (args[3] ?? 0) & 0x1 ? 'CKF_INTERFACE_FORK_SAFE' : '0' },
    ],
    'PKCS#11 v3.2 §5.4 (C_GetInterface)',
    outputs
  )
}

/** C_GetFunctionList(ppFunctionList) — §5.4 */
const decodeGetFunctionList = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const outputs: Row[] = []
  if (rv === 0 && args[0]) {
    const pList = safeRead32(M, args[0])
    if (pList) outputs.push({ name: 'CK_FUNCTION_LIST.version', value: readVersion(M, pList) })
  }
  return paramsOnly(
    [],
    'PKCS#11 v3.2 §5.4 (C_GetFunctionList — v2.x-compatible entry point)',
    outputs
  )
}

/** C_GetInfo(pInfo) — CK_INFO: version@0, manufacturerID[32]@2, flags@36,
 *  libraryDescription[32]@40, libraryVersion@72 */
const decodeGetInfo = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const p = args[0] ?? 0
  return paramsOnly(
    [],
    'PKCS#11 v3.2 §5.4 (C_GetInfo)',
    rv === 0 && p
      ? [
          { name: 'cryptokiVersion', value: readVersion(M, p) },
          { name: 'manufacturerID', value: readFixedText(M, p + 2, 32) },
          { name: 'libraryDescription', value: readFixedText(M, p + 40, 32) },
          { name: 'libraryVersion', value: readVersion(M, p + 72) },
        ]
      : undefined
  )
}

/** C_GetSlotInfo(slotID, pInfo) — CK_SLOT_INFO: slotDescription[64]@0,
 *  manufacturerID[32]@64, flags@96, hardwareVersion@100, firmwareVersion@102 */
const decodeGetSlotInfo = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const p = args[1] ?? 0
  return paramsOnly(
    [{ name: 'slotID', value: String(args[0] ?? '?') }],
    'PKCS#11 v3.2 §5.5 (C_GetSlotInfo)',
    rv === 0 && p
      ? [
          { name: 'slotDescription', value: readFixedText(M, p, 64) },
          { name: 'manufacturerID', value: readFixedText(M, p + 64, 32) },
          { name: 'flags', value: flagNames(safeRead32(M, p + 96) ?? 0, CKF_SLOT_FLAGS) },
          { name: 'hardwareVersion', value: readVersion(M, p + 100) },
          { name: 'firmwareVersion', value: readVersion(M, p + 102) },
        ]
      : undefined
  )
}

/** C_GetTokenInfo(slotID, pInfo) — CK_TOKEN_INFO (160 B; offsets as hsm_getTokenInfo) */
const decodeGetTokenInfo = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const p = args[1] ?? 0
  const u = (off: number) => {
    const v = safeRead32(M, p + off)
    return v === null
      ? '?'
      : v === 0xffffffff
        ? 'CK_UNAVAILABLE_INFORMATION'
        : v === 0
          ? '0'
          : String(v)
  }
  return paramsOnly(
    [{ name: 'slotID', value: String(args[0] ?? '?') }],
    'PKCS#11 v3.2 §5.5 (C_GetTokenInfo)',
    rv === 0 && p
      ? [
          { name: 'label', value: readFixedText(M, p, 32) },
          { name: 'manufacturerID', value: readFixedText(M, p + 32, 32) },
          { name: 'model', value: readFixedText(M, p + 64, 16) },
          { name: 'serialNumber', value: readFixedText(M, p + 80, 16) },
          { name: 'flags', value: flagNames(safeRead32(M, p + 96) ?? 0, CKF_TOKEN_FLAGS) },
          { name: 'sessions (open / max)', value: `${u(104)} / ${u(100)}` },
          { name: 'R/W sessions (open / max)', value: `${u(112)} / ${u(108)}` },
          { name: 'PIN length (min–max)', value: `${u(120)}–${u(116)}` },
          { name: 'hardwareVersion', value: readVersion(M, p + 140) },
          { name: 'firmwareVersion', value: readVersion(M, p + 142) },
        ]
      : undefined
  )
}

/** C_GetSessionInfo(hSession, pInfo) — CK_SESSION_INFO: slotID@0, state@4, flags@8, ulDeviceError@12 */
const decodeGetSessionInfo = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const p = args[1] ?? 0
  const state = safeRead32(M, p + 4) ?? 0
  return paramsOnly(
    [{ name: 'hSession', value: String(args[0] ?? '?') }],
    'PKCS#11 v3.2 §5.6 (C_GetSessionInfo)',
    rv === 0 && p
      ? [
          { name: 'slotID', value: String(safeRead32(M, p) ?? '?') },
          { name: 'state', value: `${CKS_TABLE[state] ?? '?'} (${state})` },
          { name: 'flags', value: flagNames(safeRead32(M, p + 8) ?? 0, CKF_SESSION_INFO_FLAGS) },
          { name: 'ulDeviceError', value: String(safeRead32(M, p + 12) ?? '?') },
        ]
      : undefined
  )
}

/** C_CloseAllSessions(slotID) — §5.6 */
const decodeCloseAllSessions = (_M: SoftHSMModule, args: number[]) =>
  paramsOnly(
    [{ name: 'slotID', value: String(args[0] ?? '?') }],
    'PKCS#11 v3.2 §5.6 (C_CloseAllSessions)'
  )

/** C_SessionCancel(hSession, flags) — §5.6, cancels the operations named in flags */
const decodeSessionCancel = (_M: SoftHSMModule, args: number[]) =>
  paramsOnly(
    [
      {
        name: 'flags',
        value: flagNames(args[1] ?? 0, CKF_OPERATION_FLAGS),
        note: 'Operations to cancel',
      },
    ],
    'PKCS#11 v3.2 §5.6 (C_SessionCancel)'
  )

/** C_GetOperationState(hSession, pOperationState, pulOperationStateLen) — §5.6 */
const decodeGetOperationState = (M: SoftHSMModule, args: number[], rv: number) =>
  paramsOnly(
    [outPtrRow('pOperationState', args[1] ?? 0)],
    'PKCS#11 v3.2 §5.6 (C_GetOperationState)',
    lenAndPayload(M, rv, args[1] ?? 0, args[2] ?? 0, '*pulOperationStateLen', 'Saved State')
  )

/** C_SetOperationState(hSession, pOperationState, ulLen, hEncryptionKey, hAuthenticationKey) — §5.6 */
const decodeSetOperationState = (_M: SoftHSMModule, args: number[]) =>
  paramsOnly(
    [
      { name: 'ulOperationStateLen', value: `${args[2] ?? 0} bytes` },
      { name: 'hEncryptionKey', value: String(args[3] ?? 0) },
      { name: 'hAuthenticationKey', value: String(args[4] ?? 0) },
    ],
    'PKCS#11 v3.2 §5.6 (C_SetOperationState)'
  )

/** C_CopyObject(hSession, hObject, pTemplate, ulCount, phNewObject) — §5.7 */
const decodeCopyObject = (M: SoftHSMModule, args: number[], rv: number): Pkcs11LogInspect => {
  const tmpl = readTemplate(M, args[2] ?? 0, args[3] ?? 0)
  const inputs: InspectSection[] = [
    {
      label: 'Parameters',
      primitives: [{ name: 'hObject', value: String(args[1] ?? 0), note: 'Source object' }],
    },
  ]
  if (tmpl.length) inputs.push({ label: 'Attribute overrides', attributes: tmpl })
  const h = rv === 0 && args[4] ? safeRead32(M, args[4]) : null
  return {
    inputs,
    outputs: h !== null ? [{ name: '*phNewObject', value: String(h) }] : undefined,
    spec: 'PKCS#11 v3.2 §5.7 (C_CopyObject)',
  }
}

/** C_GetObjectSize(hSession, hObject, pulSize) — §5.7 */
const decodeGetObjectSize = (M: SoftHSMModule, args: number[], rv: number) => {
  const n = rv === 0 && args[2] ? safeRead32(M, args[2]) : null
  return paramsOnly(
    [{ name: 'hObject', value: String(args[1] ?? 0) }],
    'PKCS#11 v3.2 §5.7 (C_GetObjectSize)',
    n !== null
      ? [
          {
            name: '*pulSize',
            value: n === 0xffffffff ? 'CK_UNAVAILABLE_INFORMATION' : `${n} bytes`,
          },
        ]
      : undefined
  )
}

/** C_DigestKey(hSession, hKey) — §5.12, digests a secret key's value inside the token */
const decodeDigestKey = (_M: SoftHSMModule, args: number[]) =>
  paramsOnly(
    [
      {
        name: 'hKey',
        value: String(args[1] ?? 0),
        note: 'Key value is digested inside the token, never exported',
      },
    ],
    'PKCS#11 v3.2 §5.12 (C_DigestKey)'
  )

/** C_GetFunctionStatus / C_CancelFunction (hSession) — legacy parallel-function calls */
const decodeLegacyParallel = (fn: string) => (_M: SoftHSMModule, args: number[]) =>
  paramsOnly(
    [
      {
        name: 'hSession',
        value: String(args[0] ?? '?'),
        note: 'Legacy call — a v2.20+ library returns CKR_FUNCTION_NOT_PARALLEL',
      },
    ],
    `PKCS#11 v3.2 §5.22 (${fn})`
  )

/** C_WaitForSlotEvent(flags, pSlot, pReserved) — §5.5 */
const decodeWaitForSlotEvent = (M: SoftHSMModule, args: number[], rv: number) => {
  const slot = rv === 0 && args[1] ? safeRead32(M, args[1]) : null
  return paramsOnly(
    [{ name: 'flags', value: (args[0] ?? 0) & 0x1 ? 'CKF_DONT_BLOCK (0x1)' : '0 (blocking)' }],
    'PKCS#11 v3.2 §5.5 (C_WaitForSlotEvent)',
    slot !== null ? [{ name: '*pSlot', value: String(slot), note: 'Slot that changed' }] : undefined
  )
}

/** C_AsyncComplete(hSession, pFunctionName, pResult) / C_AsyncGetID(hSession, pFunctionName, pulID)
 *  / C_AsyncJoin(hSession, pFunctionName, ulID, pData, ulData) — §5.23 */
const decodeAsync =
  (fn: 'C_AsyncComplete' | 'C_AsyncGetID' | 'C_AsyncJoin') =>
  (M: SoftHSMModule, args: number[], rv: number) => {
    const rows: Row[] = [{ name: 'pFunctionName', value: readCString(M, args[1] ?? 0) }]
    const outputs: Row[] = []
    if (fn === 'C_AsyncGetID' && rv === 0 && args[2]) {
      const id = safeRead32(M, args[2])
      if (id !== null) outputs.push({ name: '*pulID', value: String(id) })
    }
    if (fn === 'C_AsyncJoin') {
      rows.push({ name: 'ulID', value: String(args[2] ?? 0) })
      rows.push({ name: 'ulData', value: `${args[4] ?? 0} bytes` })
    }
    return paramsOnly(rows, `PKCS#11 v3.2 §5.23 (${fn})`, outputs)
  }

const decodeEncryptUpdate = decodeUpdateWithOutput(
  'C_EncryptUpdate',
  'Plaintext Part',
  'Ciphertext Part',
  'PKCS#11 v3.2 §5.15'
)
const decodeDecryptUpdate = decodeUpdateWithOutput(
  'C_DecryptUpdate',
  'Ciphertext Part',
  'Plaintext Part',
  'PKCS#11 v3.2 §5.16'
)
const decodeEncryptFinal = decodeFinalWithOutput(
  'C_EncryptFinal',
  'Last Ciphertext Part',
  'PKCS#11 v3.2 §5.15'
)
const decodeDecryptFinal = decodeFinalWithOutput(
  'C_DecryptFinal',
  'Last Plaintext Part',
  'PKCS#11 v3.2 §5.16'
)
const decodeDigestEncryptUpdate = decodeUpdateWithOutput(
  'C_DigestEncryptUpdate',
  'Plaintext Part',
  'Ciphertext Part',
  'PKCS#11 v3.2 §5.24'
)
const decodeDecryptDigestUpdate = decodeUpdateWithOutput(
  'C_DecryptDigestUpdate',
  'Ciphertext Part',
  'Plaintext Part',
  'PKCS#11 v3.2 §5.24'
)
const decodeSignEncryptUpdate = decodeUpdateWithOutput(
  'C_SignEncryptUpdate',
  'Plaintext Part',
  'Ciphertext Part',
  'PKCS#11 v3.2 §5.24'
)
const decodeDecryptVerifyUpdate = decodeUpdateWithOutput(
  'C_DecryptVerifyUpdate',
  'Ciphertext Part',
  'Plaintext Part',
  'PKCS#11 v3.2 §5.24'
)

/** Name → decoder for the functions above; buildInspect consults it after its switch. */
const V3X_DECODERS: Record<
  string,
  (M: SoftHSMModule, args: number[], rv: number) => Pkcs11LogInspect
> = {
  C_GenerateRandom: decodeGenerateRandom,
  C_EncryptUpdate: decodeEncryptUpdate,
  C_EncryptFinal: decodeEncryptFinal,
  C_DecryptUpdate: decodeDecryptUpdate,
  C_DecryptFinal: decodeDecryptFinal,
  C_VerifyUpdate: decodeVerifyUpdate,
  C_VerifyFinal: decodeClassicVerifyFinal,
  C_DigestEncryptUpdate: decodeDigestEncryptUpdate,
  C_DecryptDigestUpdate: decodeDecryptDigestUpdate,
  C_SignEncryptUpdate: decodeSignEncryptUpdate,
  C_DecryptVerifyUpdate: decodeDecryptVerifyUpdate,
  C_DigestKey: decodeDigestKey,
  C_VerifySignatureInit: decodeVerifySignatureInit,
  C_VerifySignature: decodeVerifySignature,
  C_VerifySignatureUpdate: decodeVerifySignatureUpdate,
  C_VerifySignatureFinal: decodeVerifySignatureFinal,
  C_SignRecoverInit: decodeRecoverInit('C_SignRecoverInit', 'PKCS#11 v3.2 §5.13'),
  C_SignRecover: decodeSignRecover,
  C_VerifyRecoverInit: decodeRecoverInit('C_VerifyRecoverInit', 'PKCS#11 v3.2 §5.14'),
  C_VerifyRecover: decodeVerifyRecover,
  C_SignMessageBegin: decodeMessageBegin(false),
  C_SignMessageNext: decodeSignMessageNext,
  C_VerifyMessageBegin: decodeMessageBegin(true),
  C_VerifyMessageNext: decodeVerifyMessageNext,
  C_MessageEncryptInit: decodeMessageCipherInit('C_MessageEncryptInit'),
  C_EncryptMessage: decodeCipherMessage(false),
  C_EncryptMessageBegin: decodeCipherMessageBegin('C_EncryptMessageBegin'),
  C_EncryptMessageNext: decodeCipherMessageNext('C_EncryptMessageNext', false),
  C_MessageEncryptFinal: decodeMessageCipherFinal('C_MessageEncryptFinal'),
  C_MessageDecryptInit: decodeMessageCipherInit('C_MessageDecryptInit'),
  C_DecryptMessage: decodeCipherMessage(true),
  C_DecryptMessageBegin: decodeCipherMessageBegin('C_DecryptMessageBegin'),
  C_DecryptMessageNext: decodeCipherMessageNext('C_DecryptMessageNext', true),
  C_MessageDecryptFinal: decodeMessageCipherFinal('C_MessageDecryptFinal'),
  C_LoginUser: decodeLoginUser,
  C_SetPIN: decodeSetPIN,
  C_GetInterfaceList: decodeGetInterfaceList,
  C_GetInterface: decodeGetInterface,
  C_GetFunctionList: decodeGetFunctionList,
  C_GetInfo: decodeGetInfo,
  C_GetSlotInfo: decodeGetSlotInfo,
  C_GetTokenInfo: decodeGetTokenInfo,
  C_GetSessionInfo: decodeGetSessionInfo,
  C_CloseAllSessions: decodeCloseAllSessions,
  C_SessionCancel: decodeSessionCancel,
  C_GetOperationState: decodeGetOperationState,
  C_SetOperationState: decodeSetOperationState,
  C_CopyObject: decodeCopyObject,
  C_GetObjectSize: decodeGetObjectSize,
  C_GetFunctionStatus: decodeLegacyParallel('C_GetFunctionStatus'),
  C_CancelFunction: decodeLegacyParallel('C_CancelFunction'),
  C_WaitForSlotEvent: decodeWaitForSlotEvent,
  C_AsyncComplete: decodeAsync('C_AsyncComplete'),
  C_AsyncGetID: decodeAsync('C_AsyncGetID'),
  C_AsyncJoin: decodeAsync('C_AsyncJoin'),
}

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
      case 'C_GetSessionValidationFlags':
        return decodeGetSessionValidationFlags(M, args, rv)
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
      // Attribute query / mutation
      case 'C_GetAttributeValue':
        return decodeGetAttributeValue(M, args)
      case 'C_SetAttributeValue':
        return decodeSetAttributeValue(M, args)
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
      // Object management
      case 'C_CreateObject':
        return decodeCreateObject(M, args, rv)
      case 'C_DestroyObject':
        return decodeDestroyObject(M, args)
      case 'C_FindObjectsInit':
        return decodeFindObjectsInit(M, args)
      case 'C_FindObjects':
        return decodeFindObjects(M, args, rv)
      case 'C_FindObjectsFinal':
        return decodeFindObjectsFinal(M, args)
      // Mechanism & token info
      case 'C_GetMechanismList':
        return decodeGetMechanismList(M, args, rv)
      case 'C_GetMechanismInfo':
        return decodeGetMechanismInfo(M, args)
      // Multi-part digest
      case 'C_DigestUpdate':
        return decodeDigestUpdate(M, args)
      case 'C_DigestFinal':
        return decodeDigestFinal(M, args, rv)
      // Multi-part sign
      case 'C_SignUpdate':
        return decodeSignUpdate(M, args)
      case 'C_SignFinal':
        return decodeClassicSignFinal(M, args, rv)
      // Random
      case 'C_SeedRandom':
        return decodeSeedRandom(M, args)
      // Key wrapping
      case 'C_WrapKey':
        return decodeWrapKey(M, args, rv)
      case 'C_UnwrapKey':
        return decodeUnwrapKey(M, args, rv)
      case 'C_WrapKeyAuthenticated':
        return decodeWrapKeyAuthenticated(M, args, rv)
      case 'C_UnwrapKeyAuthenticated':
        return decodeUnwrapKeyAuthenticated(M, args, rv)
      default: {
        const decode = V3X_DECODERS[fn]
        return decode ? decode(M, args, rv) : undefined
      }
    }
  } catch (err) {
    // A throwing decoder must never break the call it describes. Surface it in
    // the drawer (and the dev console) instead of looking like "no decoder".
    const message = err instanceof Error ? err.message : String(err)
    if (import.meta.env?.DEV) console.warn(`[pkcs11Inspect] ${fn} decoder failed:`, err)
    return { inputs: [], decodeError: message }
  }
}
