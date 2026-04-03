// ── Inline PKCS#11 constants ─────────────────────────────────────────────────
// Values from PKCS#11 v3.2 + softhsmv3 constants.js

export const CKF_RW_SESSION = 0x0002
export const CKF_SERIAL_SESSION = 0x0004
export const CKU_SO = 0
export const CKU_USER = 1
export const CKO_PUBLIC_KEY = 0x02
export const CKO_PRIVATE_KEY = 0x03
export const CKO_SECRET_KEY = 0x04
export const CKK_ML_KEM = 0x49 // PKCS#11 v3.2
export const CKK_ML_DSA = 0x4a // PKCS#11 v3.2
export const CKM_ML_KEM_KEY_PAIR_GEN = 0x0000000f
export const CKM_ML_KEM = 0x00000017
export const CKM_ML_DSA_KEY_PAIR_GEN = 0x0000001c
export const CKM_ML_DSA = 0x0000001d

// Attributes
export const CKA_CLASS = 0x00000000
export const CKA_TOKEN = 0x00000001
export const CKA_PRIVATE = 0x00000002
export const CKA_LABEL = 0x00000003
export const CKA_SENSITIVE = 0x00000103
export const CKA_SIGN = 0x00000108
export const CKA_VERIFY = 0x0000010a
export const CKA_EXTRACTABLE = 0x00000162
export const CKA_VALUE_LEN = 0x00000161
export const CKA_VALUE = 0x00000011
export const CKA_KEY_TYPE = 0x00000100
export const CKA_PARAMETER_SET = 0x0000061d
export const CKA_LOCAL = 0x00000163
export const CKA_NEVER_EXTRACTABLE = 0x00000164
export const CKA_ALWAYS_SENSITIVE = 0x00000165
export const CKA_KEY_GEN_MECHANISM = 0x00000166
export const CKA_ENCAPSULATE = 0x00000633
export const CKA_DECAPSULATE = 0x00000634

// ML-DSA pre-hash mechanisms (CKM_HASH_ML_DSA_*, PKCS#11 v3.2, pkcs11t.h:1221-1231)
export const CKM_HASH_ML_DSA_SHA224 = 0x23
export const CKM_HASH_ML_DSA_SHA256 = 0x24
export const CKM_HASH_ML_DSA_SHA384 = 0x25
export const CKM_HASH_ML_DSA_SHA512 = 0x26
export const CKM_HASH_ML_DSA_SHA3_224 = 0x27
export const CKM_HASH_ML_DSA_SHA3_256 = 0x28
export const CKM_HASH_ML_DSA_SHA3_384 = 0x29
export const CKM_HASH_ML_DSA_SHA3_512 = 0x2a
export const CKM_HASH_ML_DSA_SHAKE128 = 0x2b
export const CKM_HASH_ML_DSA_SHAKE256 = 0x2c

// SLH-DSA pre-hash mechanisms (CKM_HASH_SLH_DSA_SHA*, PKCS#11 v3.2, pkcs11t.h:1235-1245)
export const CKM_HASH_SLH_DSA_SHA224 = 0x36
export const CKM_HASH_SLH_DSA_SHA256 = 0x37
export const CKM_HASH_SLH_DSA_SHA384 = 0x38
export const CKM_HASH_SLH_DSA_SHA512 = 0x39
export const CKM_HASH_SLH_DSA_SHA3_224 = 0x3a
export const CKM_HASH_SLH_DSA_SHA3_256 = 0x3b
export const CKM_HASH_SLH_DSA_SHA3_384 = 0x3c
export const CKM_HASH_SLH_DSA_SHA3_512 = 0x3d
export const CKM_HASH_SLH_DSA_SHAKE128 = 0x3e
export const CKM_HASH_SLH_DSA_SHAKE256 = 0x3f

// Hedge types (PKCS#11 v3.2)
export const CKH_HEDGE_PREFERRED = 0x00000000
export const CKH_HEDGE_REQUIRED = 0x00000001
export const CKH_DETERMINISTIC_REQUIRED = 0x00000002

// Parameter sets
export const CKP_ML_KEM_512 = 0x1
export const CKP_ML_KEM_768 = 0x2
export const CKP_ML_KEM_1024 = 0x3
export const CKP_ML_DSA_44 = 0x1
export const CKP_ML_DSA_65 = 0x2
export const CKP_ML_DSA_87 = 0x3

export const CK_ATTRIBUTE_SIZE = 12 // sizeof(CK_ATTRIBUTE) on 32-bit WASM

// ── Additional PKCS#11 constants (exported for HSM panel UI) ─────────────────

// Key types
export const CKK_RSA = 0x00
export const CKK_EC = 0x03
export const CKK_GENERIC_SECRET = 0x10
export const CKK_AES = 0x1f
export const CKK_EC_EDWARDS = 0x40
/** PKCS#11 v3.2 §6.7 — X25519/X448 Montgomery-curve DH keys.
 * Value 0x41 per PKCS#11 v3.2 pkcs11t.h (CKK_EC_EDWARDS=0x40, CKK_EC_MONTGOMERY=0x41).
 * Supported as of @pqctoday/softhsm-wasm 0.4.3. */
export const CKK_EC_MONTGOMERY = 0x41
export const CKM_EC_MONTGOMERY_KEY_PAIR_GEN = 0x00001056
export const CKK_SLH_DSA = 0x4b

// RSA mechanisms
export const CKM_RSA_PKCS_KEY_PAIR_GEN = 0x00
export const CKM_RSA_PKCS_OAEP = 0x09
export const CKM_SHA256_RSA_PKCS = 0x40
export const CKM_SHA384_RSA_PKCS = 0x41
export const CKM_SHA512_RSA_PKCS = 0x42
export const CKM_SHA256_RSA_PKCS_PSS = 0x43
export const CKM_SHA384_RSA_PKCS_PSS = 0x44
export const CKM_SHA512_RSA_PKCS_PSS = 0x45

// EC mechanisms
export const CKM_EC_KEY_PAIR_GEN = 0x1040
export const CKM_ECDSA_SHA256 = 0x1044
export const CKM_ECDSA_SHA384 = 0x1045
export const CKM_ECDSA_SHA512 = 0x1046
export const CKM_ECDSA_SHA3_224 = 0x1047 // PKCS#11 v3.2 §6.3
export const CKM_ECDSA_SHA3_256 = 0x1048
export const CKM_ECDSA_SHA3_384 = 0x1049
export const CKM_ECDSA_SHA3_512 = 0x104a
export const CKM_ECDH1_DERIVE = 0x1050
export const CKM_ECDH1_COFACTOR_DERIVE = 0x1051 // PKCS#11 v3.2 §2.3.2 — cofactor ECDH
export const CKM_EC_EDWARDS_KEY_PAIR_GEN = 0x1055
export const CKM_EDDSA = 0x1057

// PBKDF2 (PKCS#11 v3.2 §5.7.3.1)
export const CKM_PKCS5_PBKD2 = 0x3b0
export const CKP_PKCS5_PBKD2_HMAC_SHA1 = 0x01
export const CKP_PKCS5_PBKD2_HMAC_SHA224 = 0x03
export const CKP_PKCS5_PBKD2_HMAC_SHA256 = 0x04
export const CKP_PKCS5_PBKD2_HMAC_SHA384 = 0x05
export const CKP_PKCS5_PBKD2_HMAC_SHA512 = 0x06

// Symmetric / HMAC / digest mechanisms
export const CKM_GENERIC_SECRET_KEY_GEN = 0x350
export const CKM_AES_KEY_GEN = 0x1080
export const CKM_AES_ECB = 0x1081 // PKCS#11 v3.2 §2.14.1 — MILENAGE f1–f5
export const CKM_AES_CTR = 0x1086 // PKCS#11 v3.2 §2.14.3 — SUCI MSIN encryption (TS 33.501)
export const CKM_AES_CBC_PAD = 0x1085
export const CKM_AES_GCM = 0x1087
export const CKM_AES_CMAC = 0x108a
export const CKM_AES_KEY_WRAP = 0x2109
export const CKM_AES_KEY_WRAP_KWP = 0x210a // RFC 5649 / NIST SP 800-38F (PKCS#11 v3.2 CKM_AES_KEY_WRAP_PAD)
export const CKM_SHA256_HMAC = 0x251
export const CKM_SHA384_HMAC = 0x261
export const CKM_SHA512_HMAC = 0x271
export const CKM_SHA3_256_HMAC = 0x2b1
export const CKM_SHA3_512_HMAC = 0x2d1
export const CKM_SHA256 = 0x250
export const CKM_SHA384 = 0x260
export const CKM_SHA512 = 0x270
export const CKM_SHA3_256 = 0x2b0
export const CKM_SHA3_512 = 0x2d0

// KMAC mechanisms — vendor-defined (NIST SP 800-185, softhsmv3 extension)
export const CKM_KMAC_128 = 0x80000100
export const CKM_KMAC_256 = 0x80000101

// SLH-DSA mechanisms (PKCS#11 v3.2, FIPS 205, pkcs11t.h:1232-1245)
export const CKM_SLH_DSA_KEY_PAIR_GEN = 0x2d
export const CKM_SLH_DSA = 0x2e

// SLH-DSA parameter sets — pkcs11t.h ordering (interleaved SHA2/SHAKE per security level)
export const CKP_SLH_DSA_SHA2_128S = 0x01
export const CKP_SLH_DSA_SHAKE_128S = 0x02
export const CKP_SLH_DSA_SHA2_128F = 0x03
export const CKP_SLH_DSA_SHAKE_128F = 0x04
export const CKP_SLH_DSA_SHA2_192S = 0x05
export const CKP_SLH_DSA_SHAKE_192S = 0x06
export const CKP_SLH_DSA_SHA2_192F = 0x07
export const CKP_SLH_DSA_SHAKE_192F = 0x08
export const CKP_SLH_DSA_SHA2_256S = 0x09
export const CKP_SLH_DSA_SHAKE_256S = 0x0a
export const CKP_SLH_DSA_SHA2_256F = 0x0b
export const CKP_SLH_DSA_SHAKE_256F = 0x0c

// Additional attributes
export const CKA_MODULUS = 0x120
export const CKA_MODULUS_BITS = 0x121
export const CKA_PUBLIC_EXPONENT = 0x122
export const CKA_ENCRYPT = 0x104
export const CKA_DECRYPT = 0x105
export const CKA_WRAP = 0x106
export const CKA_UNWRAP = 0x107
export const CKA_DERIVE = 0x10c
export const CKA_EC_PARAMS = 0x180
export const CKA_EC_POINT = 0x181 // DER-encoded ECPoint (uncompressed or compressed)
export const CKA_PUBLIC_KEY_INFO = 0x248 // SPKI-encoded public key (PKCS#11 v3.2)

// SLH-DSA signature and public key sizes (bytes), keyed by CKP_SLH_DSA_* constant
// Ordering follows pkcs11t.h: interleaved SHA2/SHAKE per security level
export const SLH_DSA_SIG_BYTES: Record<number, number> = {
  0x01: 7856, // SHA2-128s
  0x02: 7856, // SHAKE-128s
  0x03: 17088, // SHA2-128f
  0x04: 17088, // SHAKE-128f
  0x05: 16224, // SHA2-192s
  0x06: 16224, // SHAKE-192s
  0x07: 35664, // SHA2-192f
  0x08: 35664, // SHAKE-192f
  0x09: 29792, // SHA2-256s
  0x0a: 29792, // SHAKE-256s
  0x0b: 49856, // SHA2-256f
  0x0c: 49856, // SHAKE-256f
}

export const SLH_DSA_PUB_BYTES: Record<number, number> = {
  0x01: 32, // SHA2-128s
  0x02: 32, // SHAKE-128s
  0x03: 32, // SHA2-128f
  0x04: 32, // SHAKE-128f
  0x05: 48, // SHA2-192s
  0x06: 48, // SHAKE-192s
  0x07: 48, // SHA2-192f
  0x08: 48, // SHAKE-192f
  0x09: 64, // SHA2-256s
  0x0a: 64, // SHAKE-256s
  0x0b: 64, // SHA2-256f
  0x0c: 64, // SHAKE-256f
}

/** Human-readable SLH-DSA parameter set descriptors for UI selectors. */
export const SLH_DSA_PARAM_SETS: Array<{ value: number; label: string; sigBytes: number }> = [
  { value: 0x01, label: 'SLH-DSA-SHA2-128s', sigBytes: 7856 },
  { value: 0x02, label: 'SLH-DSA-SHAKE-128s', sigBytes: 7856 },
  { value: 0x03, label: 'SLH-DSA-SHA2-128f', sigBytes: 17088 },
  { value: 0x04, label: 'SLH-DSA-SHAKE-128f', sigBytes: 17088 },
  { value: 0x05, label: 'SLH-DSA-SHA2-192s', sigBytes: 16224 },
  { value: 0x06, label: 'SLH-DSA-SHAKE-192s', sigBytes: 16224 },
  { value: 0x07, label: 'SLH-DSA-SHA2-192f', sigBytes: 35664 },
  { value: 0x08, label: 'SLH-DSA-SHAKE-192f', sigBytes: 35664 },
  { value: 0x09, label: 'SLH-DSA-SHA2-256s', sigBytes: 29792 },
  { value: 0x0a, label: 'SLH-DSA-SHAKE-256s', sigBytes: 29792 },
  { value: 0x0b, label: 'SLH-DSA-SHA2-256f', sigBytes: 49856 },
  { value: 0x0c, label: 'SLH-DSA-SHAKE-256f', sigBytes: 49856 },
]

// ── Internal crypto constants ─────────────────────────────────────────────────

// MGF types (RSA-OAEP / PSS)
export const CKG_MGF1_SHA256_NEW = 0x00000002
export const CKG_MGF1_SHA384_NEW = 0x00000003
export const CKG_MGF1_SHA512_NEW = 0x00000004
export const CKZ_DATA_SPECIFIED = 0x00000001
export const CKD_NULL = 0x00000001
export const CKD_SHA1_KDF = 0x00000002 // ANSI X9.63 KDF with SHA-1
export const CKD_SHA256_KDF = 0x00000006 // ANSI X9.63 KDF with SHA-256 (SUCI Profile A/B)
export const CKD_SHA384_KDF = 0x00000007 // ANSI X9.63 KDF with SHA-384
export const CKD_SHA512_KDF = 0x00000008 // ANSI X9.63 KDF with SHA-512

// HKDF derive (PKCS#11 v3.0+ §2.43)
export const CKM_HKDF_DERIVE = 0x0000402a // PKCS#11 v3.0 §2.43
export const CKF_HKDF_SALT_NULL = 0x00000001 // No salt
export const CKF_HKDF_SALT_DATA = 0x00000002 // Salt as explicit bytes

// NIST SP 800-108 KBKDF (PKCS#11 v3.2 §2.44)
export const CKM_SP800_108_COUNTER_KDF = 0x000003ac // Counter mode KBKDF
export const CKM_SP800_108_FEEDBACK_KDF = 0x000003ad // Feedback mode KBKDF
export const CKM_SP800_108_DOUBLE_PIPELINE_KDF = 0x000003ae // Double-pipeline KBKDF
// CK_PRF_DATA_TYPE constants (CK_SP800_108_* in PKCS#11 v3.2 §2.44)
export const CK_SP800_108_ITERATION_VARIABLE = 0x00000001 // Counter/IV position marker
export const CK_SP800_108_BYTE_ARRAY = 0x00000004 // Arbitrary byte data (label/context)

// DER-encoded NamedCurve OID bytes used as CKA_EC_PARAMS value
export const EC_OID_P256 = new Uint8Array([
  0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
])
export const EC_OID_P384 = new Uint8Array([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x22])
export const EC_OID_P521 = new Uint8Array([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23])
export const EC_OID_ED25519 = new Uint8Array([0x06, 0x03, 0x2b, 0x65, 0x70])
export const EC_OID_ED448 = new Uint8Array([0x06, 0x03, 0x2b, 0x65, 0x71])
export const EC_OID_X25519 = new Uint8Array([0x06, 0x03, 0x2b, 0x65, 0x6e])
