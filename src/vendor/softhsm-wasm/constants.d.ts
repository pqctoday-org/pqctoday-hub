// PKCS#11 v3.2 constants for @pqctoday/softhsm-wasm

// ── Return values (CKR_*) ────────────────────────────────────────────────────
export declare const CKR_OK: 0x00000000
export declare const CKR_CANCEL: number
export declare const CKR_HOST_MEMORY: number
export declare const CKR_SLOT_ID_INVALID: number
export declare const CKR_GENERAL_ERROR: number
export declare const CKR_FUNCTION_FAILED: number
export declare const CKR_ARGUMENTS_BAD: number
export declare const CKR_NO_EVENT: number
export declare const CKR_NEED_TO_CREATE_THREADS: number
export declare const CKR_CANT_LOCK: number
export declare const CKR_ATTRIBUTE_READ_ONLY: number
export declare const CKR_ATTRIBUTE_SENSITIVE: number
export declare const CKR_ATTRIBUTE_TYPE_INVALID: number
export declare const CKR_ATTRIBUTE_VALUE_INVALID: number
export declare const CKR_ACTION_PROHIBITED: number
export declare const CKR_DATA_INVALID: number
export declare const CKR_DATA_LEN_RANGE: number
export declare const CKR_DEVICE_ERROR: number
export declare const CKR_DEVICE_MEMORY: number
export declare const CKR_DEVICE_REMOVED: number
export declare const CKR_ENCRYPTED_DATA_INVALID: number
export declare const CKR_ENCRYPTED_DATA_LEN_RANGE: number
export declare const CKR_AEAD_DECRYPT_FAILED: number
export declare const CKR_FUNCTION_CANCELED: number
export declare const CKR_FUNCTION_NOT_PARALLEL: number
export declare const CKR_FUNCTION_NOT_SUPPORTED: number
export declare const CKR_KEY_HANDLE_INVALID: number
export declare const CKR_KEY_SIZE_RANGE: number
export declare const CKR_KEY_TYPE_INCONSISTENT: number
export declare const CKR_KEY_NOT_NEEDED: number
export declare const CKR_KEY_CHANGED: number
export declare const CKR_KEY_NEEDED: number
export declare const CKR_KEY_INDIGESTIBLE: number
export declare const CKR_KEY_FUNCTION_NOT_PERMITTED: number
export declare const CKR_KEY_NOT_WRAPPABLE: number
export declare const CKR_KEY_UNEXTRACTABLE: number
export declare const CKR_MECHANISM_INVALID: number
export declare const CKR_MECHANISM_PARAM_INVALID: number
export declare const CKR_OBJECT_HANDLE_INVALID: number
export declare const CKR_OPERATION_ACTIVE: number
export declare const CKR_OPERATION_NOT_INITIALIZED: number
export declare const CKR_PIN_INCORRECT: number
export declare const CKR_PIN_INVALID: number
export declare const CKR_PIN_LEN_RANGE: number
export declare const CKR_PIN_EXPIRED: number
export declare const CKR_PIN_LOCKED: number
export declare const CKR_SESSION_CLOSED: number
export declare const CKR_SESSION_COUNT: number
export declare const CKR_SESSION_HANDLE_INVALID: number
export declare const CKR_SESSION_PARALLEL_NOT_SUPPORTED: number
export declare const CKR_SESSION_READ_ONLY: number
export declare const CKR_SESSION_EXISTS: number
export declare const CKR_SESSION_READ_ONLY_EXISTS: number
export declare const CKR_SESSION_READ_WRITE_SO_EXISTS: number
export declare const CKR_SIGNATURE_INVALID: number
export declare const CKR_SIGNATURE_LEN_RANGE: number
export declare const CKR_TEMPLATE_INCOMPLETE: number
export declare const CKR_TEMPLATE_INCONSISTENT: number
export declare const CKR_TOKEN_NOT_PRESENT: number
export declare const CKR_TOKEN_NOT_RECOGNIZED: number
export declare const CKR_TOKEN_WRITE_PROTECTED: number
export declare const CKR_UNWRAPPING_KEY_HANDLE_INVALID: number
export declare const CKR_UNWRAPPING_KEY_SIZE_RANGE: number
export declare const CKR_UNWRAPPING_KEY_TYPE_INCONSISTENT: number
export declare const CKR_USER_ALREADY_LOGGED_IN: number
export declare const CKR_USER_NOT_LOGGED_IN: number
export declare const CKR_USER_PIN_NOT_INITIALIZED: number
export declare const CKR_USER_TYPE_INVALID: number
export declare const CKR_USER_ANOTHER_ALREADY_LOGGED_IN: number
export declare const CKR_USER_TOO_MANY_TYPES: number
export declare const CKR_WRAPPED_KEY_INVALID: number
export declare const CKR_WRAPPED_KEY_LEN_RANGE: number
export declare const CKR_WRAPPING_KEY_HANDLE_INVALID: number
export declare const CKR_WRAPPING_KEY_SIZE_RANGE: number
export declare const CKR_WRAPPING_KEY_TYPE_INCONSISTENT: number
export declare const CKR_RANDOM_SEED_NOT_SUPPORTED: number
export declare const CKR_RANDOM_NO_RNG: number
export declare const CKR_DOMAIN_PARAMS_INVALID: number
export declare const CKR_CURVE_NOT_SUPPORTED: number
export declare const CKR_BUFFER_TOO_SMALL: number
export declare const CKR_SAVED_STATE_INVALID: number
export declare const CKR_INFORMATION_SENSITIVE: number
export declare const CKR_STATE_UNSAVEABLE: number
export declare const CKR_CRYPTOKI_NOT_INITIALIZED: number
export declare const CKR_CRYPTOKI_ALREADY_INITIALIZED: number
export declare const CKR_MUTEX_BAD: number
export declare const CKR_MUTEX_NOT_LOCKED: number
export declare const CKR_NEW_PIN_MODE: number
export declare const CKR_NEXT_OTP: number
export declare const CKR_EXCEEDED_MAX_ITERATIONS: number
export declare const CKR_FIPS_SELF_TEST_FAILED: number
export declare const CKR_LIBRARY_LOAD_FAILED: number
export declare const CKR_PIN_TOO_WEAK: number
export declare const CKR_PUBLIC_KEY_INVALID: number
export declare const CKR_FUNCTION_REJECTED: number
export declare const CKR_TOKEN_RESOURCE_EXCEEDED: number
export declare const CKR_OPERATION_CANCEL_FAILED: number
export declare const CKR_KEY_EXHAUSTED: number
export declare const CKR_VENDOR_DEFINED: number

// ── Session flags (CKF_*) ───────────────────────────────────────────────────
export declare const CKF_RW_SESSION: number
export declare const CKF_SERIAL_SESSION: number
export declare const CKF_TOKEN_INITIALIZED: number
export declare const CKF_USER_PIN_INITIALIZED: number
export declare const CKF_PROTECTED_AUTHENTICATION_PATH: number
export declare const CKF_LOGIN_REQUIRED: number
export declare const CKF_RESTORE_KEY_NOT_NEEDED: number
export declare const CKF_CLOCK_ON_TOKEN: number
export declare const CKF_DUAL_CRYPTO_OPERATIONS: number
export declare const CKF_SO_PIN_COUNT_LOW: number
export declare const CKF_SO_PIN_FINAL_TRY: number
export declare const CKF_SO_PIN_LOCKED: number
export declare const CKF_SO_PIN_TO_BE_CHANGED: number
export declare const CKF_ERROR_STATE: number

// ── User types (CKU_*) ──────────────────────────────────────────────────────
export declare const CKU_SO: 0
export declare const CKU_USER: 1
export declare const CKU_CONTEXT_SPECIFIC: 2

// ── Object classes (CKO_*) ──────────────────────────────────────────────────
export declare const CKO_DATA: number
export declare const CKO_CERTIFICATE: number
export declare const CKO_PUBLIC_KEY: number
export declare const CKO_PRIVATE_KEY: number
export declare const CKO_SECRET_KEY: number
export declare const CKO_HW_FEATURE: number
export declare const CKO_DOMAIN_PARAMETERS: number
export declare const CKO_MECHANISM: number
export declare const CKO_OTP_KEY: number
export declare const CKO_PROFILE: number
export declare const CKO_VENDOR_DEFINED: number

// ── Key types (CKK_*) ───────────────────────────────────────────────────────
export declare const CKK_RSA: number
export declare const CKK_DSA: number
export declare const CKK_DH: number
export declare const CKK_EC: number
export declare const CKK_ECDSA: number
export declare const CKK_GENERIC_SECRET: number
export declare const CKK_AES: number
export declare const CKK_EC_EDWARDS: number
export declare const CKK_EC_MONTGOMERY: number
export declare const CKK_HKDF: number
export declare const CKK_HSS: number
/** ML-DSA (FIPS 204) key type — PKCS#11 v3.2 */
export declare const CKK_ML_DSA: number
/** SLH-DSA (FIPS 205) key type — PKCS#11 v3.2 */
export declare const CKK_SLH_DSA: number
/** ML-KEM (FIPS 203) key type — PKCS#11 v3.2 */
export declare const CKK_ML_KEM: number
export declare const CKK_VENDOR_DEFINED: number

// ── Mechanisms (CKM_*) ──────────────────────────────────────────────────────
export declare const CKM_RSA_PKCS_KEY_PAIR_GEN: number
export declare const CKM_RSA_PKCS: number
export declare const CKM_RSA_PKCS_OAEP: number
export declare const CKM_RSA_PKCS_PSS: number
export declare const CKM_SHA256_RSA_PKCS: number
export declare const CKM_SHA384_RSA_PKCS: number
export declare const CKM_SHA512_RSA_PKCS: number
export declare const CKM_SHA256_RSA_PKCS_PSS: number
export declare const CKM_SHA384_RSA_PKCS_PSS: number
export declare const CKM_SHA512_RSA_PKCS_PSS: number
export declare const CKM_DSA_KEY_PAIR_GEN: number
export declare const CKM_DSA: number
export declare const CKM_DH_PKCS_KEY_PAIR_GEN: number
export declare const CKM_DH_PKCS_DERIVE: number
export declare const CKM_SHA_1: number
export declare const CKM_SHA_1_HMAC: number
export declare const CKM_SHA256: number
export declare const CKM_SHA256_HMAC: number
export declare const CKM_SHA384: number
export declare const CKM_SHA384_HMAC: number
export declare const CKM_SHA512: number
export declare const CKM_SHA512_HMAC: number
export declare const CKM_SHA3_256: number
export declare const CKM_SHA3_256_HMAC: number
export declare const CKM_SHA3_384: number
export declare const CKM_SHA3_384_HMAC: number
export declare const CKM_SHA3_512: number
export declare const CKM_SHA3_512_HMAC: number
export declare const CKM_EC_KEY_PAIR_GEN: number
export declare const CKM_ECDSA: number
export declare const CKM_ECDSA_SHA256: number
export declare const CKM_ECDSA_SHA384: number
export declare const CKM_ECDSA_SHA512: number
export declare const CKM_ECDH1_DERIVE: number
export declare const CKM_EDDSA: number
/** Ed25519ph pre-hash signing (RFC 8032 §5.1, PKCS#11 v3.2 §6.3.15) */
export declare const CKM_EDDSA_PH: number
export declare const CKM_AES_KEY_GEN: number
export declare const CKM_AES_ECB: number
export declare const CKM_AES_CBC: number
export declare const CKM_AES_CBC_PAD: number
export declare const CKM_AES_GCM: number
export declare const CKM_AES_CTR: number
export declare const CKM_AES_CMAC: number
export declare const CKM_AES_KEY_WRAP: number
export declare const CKM_AES_KEY_WRAP_KWP: number
export declare const CKM_PKCS5_PBKD2: number
export declare const CKM_EC_EDWARDS_KEY_PAIR_GEN: number
export declare const CKM_GENERIC_SECRET_KEY_GEN: number
export declare const CKM_HKDF_DERIVE: number
/** ML-KEM key pair generation (FIPS 203) — PKCS#11 v3.2 */
export declare const CKM_ML_KEM_KEY_PAIR_GEN: number
/** ML-KEM encapsulation/decapsulation (FIPS 203) — PKCS#11 v3.2 */
export declare const CKM_ML_KEM: number
/** ML-DSA key pair generation (FIPS 204) — PKCS#11 v3.2 */
export declare const CKM_ML_DSA_KEY_PAIR_GEN: number
/** ML-DSA pure sign/verify (FIPS 204) — PKCS#11 v3.2 */
export declare const CKM_ML_DSA: number
/** HashML-DSA pre-hash sign/verify (FIPS 204) — PKCS#11 v3.2 */
export declare const CKM_HASH_ML_DSA: number
/** SLH-DSA key pair generation (FIPS 205) — PKCS#11 v3.2 */
export declare const CKM_SLH_DSA_KEY_PAIR_GEN: number
/** SLH-DSA pure sign/verify (FIPS 205) — PKCS#11 v3.2 */
export declare const CKM_SLH_DSA: number
/** HSS / LMS key pair generation — RFC 8554 + SP 800-208, PKCS#11 v3.2 */
export declare const CKM_HSS_KEY_PAIR_GEN: number
/** HSS / LMS sign / verify — RFC 8554 + SP 800-208 */
export declare const CKM_HSS: number
/** HashML-DSA specific pre-hash variants (FIPS 204, PKCS#11 v3.2) */
export declare const CKM_HASH_ML_DSA_SHA224: number
export declare const CKM_HASH_ML_DSA_SHA256: number
export declare const CKM_HASH_ML_DSA_SHA384: number
export declare const CKM_HASH_ML_DSA_SHA512: number
export declare const CKM_HASH_ML_DSA_SHA3_224: number
export declare const CKM_HASH_ML_DSA_SHA3_256: number
export declare const CKM_HASH_ML_DSA_SHA3_384: number
export declare const CKM_HASH_ML_DSA_SHA3_512: number
export declare const CKM_HASH_ML_DSA_SHAKE128: number
export declare const CKM_HASH_ML_DSA_SHAKE256: number
/** HashSLH-DSA pre-hash sign/verify (FIPS 205) — PKCS#11 v3.2 */
export declare const CKM_HASH_SLH_DSA: number
/** HashSLH-DSA specific pre-hash variants (FIPS 205, PKCS#11 v3.2) */
export declare const CKM_HASH_SLH_DSA_SHA224: number
export declare const CKM_HASH_SLH_DSA_SHA256: number
export declare const CKM_HASH_SLH_DSA_SHA384: number
export declare const CKM_HASH_SLH_DSA_SHA512: number
export declare const CKM_HASH_SLH_DSA_SHA3_224: number
export declare const CKM_HASH_SLH_DSA_SHA3_256: number
export declare const CKM_HASH_SLH_DSA_SHA3_384: number
export declare const CKM_HASH_SLH_DSA_SHA3_512: number
export declare const CKM_HASH_SLH_DSA_SHAKE128: number
export declare const CKM_HASH_SLH_DSA_SHAKE256: number
/** SHA3-256 digest (FIPS 202) */
export declare const CKM_SHA3_256: number
/** HMAC-SHA3-256 (FIPS 202) */
export declare const CKM_SHA3_256_HMAC: number
/** KMAC-128 — keyed MAC using KECCAK-128 XOF (FIPS 202 / SP 800-185) */
export declare const CKM_KMAC_128: number
/** KMAC-256 — keyed MAC using KECCAK-256 XOF (FIPS 202 / SP 800-185) */
export declare const CKM_KMAC_256: number
export declare const CKM_VENDOR_DEFINED: number

// ── Attributes (CKA_*) ──────────────────────────────────────────────────────
export declare const CKA_CLASS: number
export declare const CKA_TOKEN: number
export declare const CKA_PRIVATE: number
export declare const CKA_LABEL: number
export declare const CKA_VALUE: number
export declare const CKA_VALUE_LEN: number
export declare const CKA_KEY_TYPE: number
export declare const CKA_ID: number
export declare const CKA_SENSITIVE: number
export declare const CKA_ENCRYPT: number
export declare const CKA_DECRYPT: number
export declare const CKA_WRAP: number
export declare const CKA_UNWRAP: number
export declare const CKA_SIGN: number
export declare const CKA_VERIFY: number
export declare const CKA_DERIVE: number
export declare const CKA_EXTRACTABLE: number
export declare const CKA_LOCAL: number
export declare const CKA_NEVER_EXTRACTABLE: number
export declare const CKA_ALWAYS_SENSITIVE: number
export declare const CKA_MODIFIABLE: number
export declare const CKA_COPYABLE: number
export declare const CKA_DESTROYABLE: number
export declare const CKA_EC_PARAMS: number
export declare const CKA_EC_POINT: number
export declare const CKA_ALWAYS_AUTHENTICATE: number
export declare const CKA_WRAP_WITH_TRUSTED: number
export declare const CKA_PUBLIC_KEY_INFO: number
export declare const CKA_MODULUS: number
export declare const CKA_MODULUS_BITS: number
export declare const CKA_PUBLIC_EXPONENT: number
/** PQC parameter set selector (e.g. CKP_ML_KEM_768) — PKCS#11 v3.2 */
export declare const CKA_PARAMETER_SET: number
/** Number of HSS levels — PKCS#11 v3.2 §6.14 */
export declare const CKA_HSS_LEVELS: number
/** LMS algorithm type (single-level) — PKCS#11 v3.2 §6.14 */
export declare const CKA_HSS_LMS_TYPE: number
/** LMOTS algorithm type (single-level) — PKCS#11 v3.2 §6.14 */
export declare const CKA_HSS_LMOTS_TYPE: number
/** LMS algorithm types array (multi-level) — PKCS#11 v3.2 §6.14 */
export declare const CKA_HSS_LMS_TYPES: number
/** LMOTS algorithm types array (multi-level) — PKCS#11 v3.2 §6.14 */
export declare const CKA_HSS_LMOTS_TYPES: number
/** Remaining HSS signature uses — PKCS#11 v3.2 §6.14 */
export declare const CKA_HSS_KEYS_REMAINING: number
/** Allow key to be used for encapsulation — PKCS#11 v3.2 */
export declare const CKA_ENCAPSULATE: number
/** Allow key to be used for decapsulation — PKCS#11 v3.2 */
export declare const CKA_DECAPSULATE: number
/** Optional KEM seed — PKCS#11 v3.2 */
export declare const CKA_SEED: number
export declare const CKA_VENDOR_DEFINED: number

// ── Parameter sets (CKP_*) ──────────────────────────────────────────────────
// ML-DSA (FIPS 204)
export declare const CKP_ML_DSA_44: number
export declare const CKP_ML_DSA_65: number
export declare const CKP_ML_DSA_87: number
// ML-KEM (FIPS 203)
export declare const CKP_ML_KEM_512: number
export declare const CKP_ML_KEM_768: number
export declare const CKP_ML_KEM_1024: number
// SLH-DSA (FIPS 205) — 12 parameter sets
export declare const CKP_SLH_DSA_SHA2_128S: number
export declare const CKP_SLH_DSA_SHA2_128F: number
export declare const CKP_SLH_DSA_SHA2_192S: number
export declare const CKP_SLH_DSA_SHA2_192F: number
export declare const CKP_SLH_DSA_SHA2_256S: number
export declare const CKP_SLH_DSA_SHA2_256F: number
export declare const CKP_SLH_DSA_SHAKE_128S: number
export declare const CKP_SLH_DSA_SHAKE_128F: number
export declare const CKP_SLH_DSA_SHAKE_192S: number
export declare const CKP_SLH_DSA_SHAKE_192F: number
export declare const CKP_SLH_DSA_SHAKE_256S: number
export declare const CKP_SLH_DSA_SHAKE_256F: number

// ── LMS parameter sets (RFC 8554 + SP 800-208) ───────────────────────────────
/** LMS SHA-256/N32, tree height H=5 (RFC 8554) */
export declare const CKP_LMS_SHA256_M32_H5: number
export declare const CKP_LMS_SHA256_M32_H10: number
export declare const CKP_LMS_SHA256_M32_H15: number
export declare const CKP_LMS_SHA256_M32_H20: number
export declare const CKP_LMS_SHA256_M32_H25: number
/** LMS SHAKE-256/N32, tree height H=5 (SP 800-208) */
export declare const CKP_LMS_SHAKE_M32_H5: number
export declare const CKP_LMS_SHAKE_M32_H10: number
export declare const CKP_LMS_SHAKE_M32_H15: number
export declare const CKP_LMS_SHAKE_M32_H20: number
export declare const CKP_LMS_SHAKE_M32_H25: number

// ── LMOTS parameter sets (RFC 8554 + SP 800-208) ─────────────────────────────
/** LMOTS SHA-256/N32, Winternitz width W=1 (RFC 8554) */
export declare const CKP_LMOTS_SHA256_N32_W1: number
export declare const CKP_LMOTS_SHA256_N32_W2: number
export declare const CKP_LMOTS_SHA256_N32_W4: number
export declare const CKP_LMOTS_SHA256_N32_W8: number
/** LMOTS SHAKE-256/N32, Winternitz width W=1 (SP 800-208) */
export declare const CKP_LMOTS_SHAKE_N32_W1: number
export declare const CKP_LMOTS_SHAKE_N32_W2: number
export declare const CKP_LMOTS_SHAKE_N32_W4: number
export declare const CKP_LMOTS_SHAKE_N32_W8: number

// ── Struct sizes ─────────────────────────────────────────────────────────────
/** sizeof(CK_ATTRIBUTE) = 12 bytes on 32-bit WASM target */
export declare const CK_ATTRIBUTE_SIZE: 12
/** sizeof(CK_MECHANISM) = 12 bytes on 32-bit WASM target */
export declare const CK_MECHANISM_SIZE: 12

// Grouped default export for convenience
declare const CK: Readonly<Record<string, number>>
export default CK
