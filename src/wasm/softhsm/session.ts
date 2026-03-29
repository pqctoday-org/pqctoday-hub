import type { type SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  CKF_RW_SESSION,
  CKF_SERIAL_SESSION,
  CKM_AES_KEY_WRAP_KWP,
  CKP_ML_DSA_44,
  CKP_ML_DSA_65,
  CKP_ML_DSA_87,
  CKP_ML_KEM_1024,
  CKP_ML_KEM_512,
  CKP_ML_KEM_768,
  CKU_SO,
  CKU_USER,
} from './constants'
import {
  type AttrDef,
  allocUlong,
  buildTemplate,
  checkRV,
  freeTemplate,
  readUlong,
  writeStr,
  writeUlong,
} from './helpers'

export const hsm_initialize = (M: SoftHSMModule, testSeed?: Uint8Array): void => {
  if (testSeed) {
    const seedPtr = M._malloc(testSeed.length)
    M.HEAPU8.set(testSeed, seedPtr)

    const acvpPtr = M._malloc(8)
    M.setValue(acvpPtr, seedPtr, 'i32')
    M.setValue(acvpPtr + 4, testSeed.length, 'i32')

    const initArgsPtr = M._malloc(24)
    for (let i = 0; i < 24; i++) M.HEAPU8[initArgsPtr + i] = 0 // Zero out
    M.setValue(initArgsPtr + 20, acvpPtr, 'i32')

    try {
      checkRV(M._C_Initialize(initArgsPtr), 'C_Initialize(ACVP_MODE)')
    } finally {
      M._free(initArgsPtr)
      M._free(acvpPtr)
      M._free(seedPtr)
    }
  } else {
    checkRV(M._C_Initialize(0), 'C_Initialize')
  }
}

/** C_GetSlotList → first slot id (two-step: count then fill) */
export const hsm_getFirstSlot = (M: SoftHSMModule): number => {
  const countPtr = allocUlong(M)
  try {
    // Step 1: pSlotList=NULL → get count (required; passing non-NULL with count=0 → CKR_BUFFER_TOO_SMALL)
    checkRV(M._C_GetSlotList(0, 0, countPtr), 'C_GetSlotList(count)')
    const count = readUlong(M, countPtr)
    if (count === 0) throw new Error('C_GetSlotList: no slots available')
    // Step 2: allocate slot list and fill
    const slotListPtr = M._malloc(count * 4)
    writeUlong(M, countPtr, count)
    try {
      checkRV(M._C_GetSlotList(0, slotListPtr, countPtr), 'C_GetSlotList')
      return readUlong(M, slotListPtr)
    } finally {
      M._free(slotListPtr)
    }
  } finally {
    M._free(countPtr)
  }
}

/** C_InitToken → re-enumerate slots → return new slot id */
export const hsm_initToken = (
  M: SoftHSMModule,
  slot: number,
  soPin: string,
  label: string
): number => {
  const labelPtr = M._malloc(32)
  M.HEAPU8.fill(0x20, labelPtr, labelPtr + 32) // blank-pad
  const lb = new TextEncoder().encode(label.slice(0, 32))
  M.HEAPU8.set(lb, labelPtr)
  const pinPtr = writeStr(M, soPin)
  try {
    const initRv = M._C_InitToken(slot, pinPtr, soPin.length, labelPtr)
    // CKR_SESSION_EXISTS (0xb6): token is already initialized with active sessions;
    // skip re-initialization and fall through to re-enumerate the existing slot.
    if (initRv !== 0 && initRv >>> 0 !== 0x000000b6) checkRV(initRv, 'C_InitToken')
  } finally {
    M._free(labelPtr)
    M._free(pinPtr)
  }

  // Re-enumerate: initialized token appears in a new slot (two-step)
  const countPtr = allocUlong(M)
  try {
    checkRV(M._C_GetSlotList(1, 0, countPtr), 'C_GetSlotList(initialized,count)')
    const slotCount = readUlong(M, countPtr)
    const slotListPtr = M._malloc(slotCount * 4)
    writeUlong(M, countPtr, slotCount)
    try {
      checkRV(M._C_GetSlotList(1, slotListPtr, countPtr), 'C_GetSlotList(initialized)')
      return readUlong(M, slotListPtr)
    } finally {
      M._free(slotListPtr)
    }
  } finally {
    M._free(countPtr)
  }
}

/**
 * Open RW session, log in as SO, init user PIN, re-login as user.
 * Returns hSession.
 */
export const hsm_openUserSession = (
  M: SoftHSMModule,
  slot: number,
  soPin: string,
  userPin: string
): number => {
  const sessionPtr = allocUlong(M)
  try {
    checkRV(
      M._C_OpenSession(slot, CKF_RW_SESSION | CKF_SERIAL_SESSION, 0, 0, sessionPtr),
      'C_OpenSession'
    )
  } catch (e) {
    M._free(sessionPtr)
    throw e
  }
  const hSession = readUlong(M, sessionPtr)
  M._free(sessionPtr)

  // Login as SO to set user PIN.
  // CKR_USER_ANOTHER_ALREADY_LOGGED_IN (0x104): another session already has USER logged in at
  // the token level. PKCS#11 login is per-token, so the new session inherits the logged-in state
  // — skip the SO→InitPIN→Logout→Login(USER) sequence and return the session directly.
  const soPinPtr = writeStr(M, soPin)
  let soLoginRv: number
  try {
    soLoginRv = M._C_Login(hSession, CKU_SO, soPinPtr, soPin.length)
    if (soLoginRv !== 0 && soLoginRv >>> 0 !== 0x00000104) checkRV(soLoginRv, 'C_Login(SO)')
  } finally {
    M._free(soPinPtr)
  }
  if (soLoginRv! >>> 0 === 0x00000104) return hSession

  const userPinPtr = writeStr(M, userPin)
  try {
    checkRV(M._C_InitPIN(hSession, userPinPtr, userPin.length), 'C_InitPIN')
  } finally {
    M._free(userPinPtr)
  }

  checkRV(M._C_Logout(hSession), 'C_Logout')

  // Re-login as normal user
  const uPinPtr = writeStr(M, userPin)
  try {
    checkRV(M._C_Login(hSession, CKU_USER, uPinPtr, userPin.length), 'C_Login(USER)')
  } finally {
    M._free(uPinPtr)
  }

  return hSession
}

export const kemParamSet = (variant: 512 | 768 | 1024): number => {
  if (variant === 512) return CKP_ML_KEM_512
  if (variant === 1024) return CKP_ML_KEM_1024
  return CKP_ML_KEM_768
}

export const dsaParamSet = (variant: 44 | 65 | 87): number => {
  if (variant === 44) return CKP_ML_DSA_44
  if (variant === 87) return CKP_ML_DSA_87
  return CKP_ML_DSA_65
}

/** Generate an ML-KEM key pair. Returns {pubHandle, privHandle}. */
// ── Mechanism Discovery ───────────────────────────────────────────────────────

export type MechanismFamily = 'pqc' | 'asymmetric' | 'symmetric' | 'hash' | 'kdf' | 'other'

export interface MechanismInfo {
  /** Numeric CKM_ type value returned by C_GetMechanismList */
  type: number
  /** Zero-padded hex, e.g. "0x0000001d" */
  typeHex: string
  /** Canonical PKCS#11 constant name, e.g. "CKM_ML_DSA" */
  name: string
  /** Human-readable description of the mechanism */
  description: string
  /** Minimum key size in bits (from CK_MECHANISM_INFO) */
  ulMinKeySize: number
  /** Maximum key size in bits (from CK_MECHANISM_INFO) */
  ulMaxKeySize: number
  /** Raw CKF_ flags bitmask (from CK_MECHANISM_INFO) */
  flags: number
  /** Decoded flag names, e.g. ["SIGN", "VERIFY"] */
  flagNames: string[]
  /** Classified algorithm family */
  family: MechanismFamily
}

/** CKF_ flag bit → short display name */
const CKF_FLAG_NAMES: Array<[number, string]> = [
  [0x00000400, 'DIGEST'],
  [0x00000800, 'SIGN'],
  [0x00002000, 'VERIFY'],
  [0x00000100, 'ENCRYPT'],
  [0x00000200, 'DECRYPT'],
  [0x00008000, 'GENERATE'],
  [0x00010000, 'KEY_PAIR_GEN'],
  [0x00020000, 'WRAP'],
  [0x00040000, 'UNWRAP'],
  [0x00080000, 'DERIVE'],
  [0x10000000, 'ENCAPSULATE'],
  [0x20000000, 'DECAPSULATE'],
]

interface MechEntry {
  name: string
  description: string
  family: MechanismFamily
}

/** Comprehensive mechanism name / description / family table (PKCS#11 v3.2) */
const MECH_TABLE: Record<number, MechEntry> = {
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
  0x00000250: { name: 'CKM_SHA256', description: 'SHA-256 digest (FIPS 180-4)', family: 'hash' },
  0x00000251: { name: 'CKM_SHA256_HMAC', description: 'HMAC-SHA-256 (RFC 2104)', family: 'hash' },
  0x00000255: { name: 'CKM_SHA224', description: 'SHA-224 digest (FIPS 180-4)', family: 'hash' },
  0x00000256: { name: 'CKM_SHA224_HMAC', description: 'HMAC-SHA-224 (RFC 2104)', family: 'hash' },
  0x00000260: { name: 'CKM_SHA384', description: 'SHA-384 digest (FIPS 180-4)', family: 'hash' },
  0x00000261: { name: 'CKM_SHA384_HMAC', description: 'HMAC-SHA-384 (RFC 2104)', family: 'hash' },
  0x00000270: { name: 'CKM_SHA512', description: 'SHA-512 digest (FIPS 180-4)', family: 'hash' },
  0x00000271: { name: 'CKM_SHA512_HMAC', description: 'HMAC-SHA-512 (RFC 2104)', family: 'hash' },
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
  0x000002c0: { name: 'CKM_SHA3_384', description: 'SHA3-384 digest (FIPS 202)', family: 'hash' },
  0x000002c1: {
    name: 'CKM_SHA3_384_HMAC',
    description: 'HMAC-SHA3-384 (RFC 2104 + FIPS 202)',
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
  0x0000108a: {
    name: 'CKM_AES_CMAC',
    description: 'AES-CMAC message authentication (NIST SP 800-38B)',
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
    description: 'ECDH cofactor key agreement (PKCS#11 v3.2 §2.3.2)',
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
  // ── EC / ECDSA / EdDSA ────────────────────────────────────────────────────
  0x00001040: {
    name: 'CKM_EC_KEY_PAIR_GEN',
    description: 'EC key pair generation (FIPS 186-5)',
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
}

/** Decode a CKF_ flags bitmask into an array of short flag names. */
export const decodeMechFlags = (flags: number): string[] =>
  CKF_FLAG_NAMES.filter(([bit]) => (flags & bit) !== 0).map(([, name]) => name)

/**
 * Low-level: call C_GetMechanismList for a slot and return the array of
 * CKM_ type numbers. Uses the two-call pattern (first call to get count).
 */
export const hsm_getMechanismList = (M: SoftHSMModule, slotId: number): number[] => {
  const countPtr = allocUlong(M)
  try {
    // First call: pMechanismList = NULL → writes count into *pulCount
    if (M._C_GetMechanismList(slotId, 0, countPtr) >>> 0 !== 0) return []
    const count = readUlong(M, countPtr)
    if (count === 0) return []
    // Second call: allocate list buffer and fill
    const listPtr = M._malloc(count * 4) // CK_MECHANISM_TYPE is CK_ULONG (4 bytes on 32-bit WASM)
    writeUlong(M, countPtr, count)
    try {
      if (M._C_GetMechanismList(slotId, listPtr, countPtr) >>> 0 !== 0) return []
      const actual = readUlong(M, countPtr)
      const result: number[] = []
      for (let i = 0; i < actual; i++) {
        result.push(readUlong(M, listPtr + i * 4))
      }
      return result
    } finally {
      M._free(listPtr)
    }
  } finally {
    M._free(countPtr)
  }
}

/**
 * Low-level: call C_GetMechanismInfo for a single mechanism type.
 * Returns null if the token returns CKR_MECHANISM_INVALID or any error.
 *
 * CK_MECHANISM_INFO layout (32-bit WASM, all CK_ULONG = 4 bytes):
 *   @0  ulMinKeySize
 *   @4  ulMaxKeySize
 *   @8  flags
 */
export const hsm_getMechanismInfo = (
  M: SoftHSMModule,
  slotId: number,
  mechType: number
): { ulMinKeySize: number; ulMaxKeySize: number; flags: number } | null => {
  const infoPtr = M._malloc(12) // sizeof(CK_MECHANISM_INFO) = 3 × CK_ULONG
  try {
    const rv = M._C_GetMechanismInfo(slotId, mechType, infoPtr) >>> 0
    if (rv !== 0) return null
    return {
      ulMinKeySize: readUlong(M, infoPtr + 0),
      ulMaxKeySize: readUlong(M, infoPtr + 4),
      flags: readUlong(M, infoPtr + 8),
    }
  } finally {
    M._free(infoPtr)
  }
}

/**
 * High-level: query C_GetMechanismList + C_GetMechanismInfo for all mechanisms
 * on the given slot. Returns fully-resolved MechanismInfo[] sorted by family
 * then by type number.
 *
 * Mechanisms with no C_GetMechanismInfo entry (CKR_MECHANISM_INVALID) are
 * still included with zeroed info fields — useful for detecting the gap.
 */
export const hsm_getAllMechanisms = (M: SoftHSMModule, slotId: number): MechanismInfo[] => {
  const types = hsm_getMechanismList(M, slotId)
  const familyOrder: MechanismFamily[] = ['pqc', 'asymmetric', 'symmetric', 'hash', 'kdf', 'other']
  return types
    .map((type) => {
      const entry = MECH_TABLE[type]
      const info = hsm_getMechanismInfo(M, slotId, type)
      const flags = info?.flags ?? 0
      return {
        type,
        typeHex: `0x${type.toString(16).padStart(8, '0')}`,
        name: entry?.name ?? `CKM_UNKNOWN`,
        description: entry?.description ?? `Unknown mechanism (type 0x${type.toString(16)})`,
        ulMinKeySize: info?.ulMinKeySize ?? 0,
        ulMaxKeySize: info?.ulMaxKeySize ?? 0,
        flags,
        flagNames: decodeMechFlags(flags),
        family: entry?.family ?? 'other',
      } satisfies MechanismInfo
    })
    .sort((a, b) => {
      const fa = familyOrder.indexOf(a.family)
      const fb = familyOrder.indexOf(b.family)
      return fa !== fb ? fa - fb : a.type - b.type
    })
}

export const hsm_generateRandom = (
  M: SoftHSMModule,
  hSession: number,
  length: number
): Uint8Array => {
  const pRandom = M._malloc(length)
  const rv = M._C_GenerateRandom(hSession, pRandom, length)
  checkRV(rv, 'C_GenerateRandom')
  const result = new Uint8Array(M.HEAPU8.subarray(pRandom, pRandom + length).slice())
  M._free(pRandom)
  return result
}

export const hsm_seedRandom = (M: SoftHSMModule, hSession: number, seed: Uint8Array): void => {
  const pSeed = M._malloc(seed.length)
  M.HEAPU8.set(seed, pSeed)
  const rv = M._C_SeedRandom(hSession, pSeed, seed.length)
  M._free(pSeed)
  checkRV(rv, 'C_SeedRandom')
}

/** @deprecated Use hsm_wrapKeyMech(M, hSession, CKM_AES_KEY_WRAP_KWP, ...) instead */
export const hsm_aesWrapKeyKwp = (
  M: SoftHSMModule,
  hSession: number,
  hWrappingKey: number,
  hKey: number
): Uint8Array => {
  const pMechanism = M._malloc(8)
  writeUlong(M, pMechanism, CKM_AES_KEY_WRAP_KWP)
  writeUlong(M, pMechanism + 4, 0)

  let rv = M._C_WrapKey(hSession, pMechanism, hWrappingKey, hKey, 0, M.HEAPU8.buffer.byteLength - 8)
  checkRV(rv, 'C_WrapKey size')
  const wrappedLen = readUlong(M, M.HEAPU8.buffer.byteLength - 8)

  const pWrapped = M._malloc(wrappedLen)
  rv = M._C_WrapKey(
    hSession,
    pMechanism,
    hWrappingKey,
    hKey,
    pWrapped,
    M.HEAPU8.buffer.byteLength - 8
  )
  checkRV(rv, 'C_WrapKey')
  const result = new Uint8Array(
    M.HEAPU8.subarray(pWrapped, pWrapped + readUlong(M, M.HEAPU8.buffer.byteLength - 8)).slice()
  )
  M._free(pWrapped)
  M._free(pMechanism)
  return result
}

/** @deprecated Use hsm_unwrapKeyMech(M, hSession, mechType, ...) instead */
export const hsm_unwrapKey = (
  M: SoftHSMModule,
  hSession: number,
  hUnwrapKey: number,
  wrappedBytes: Uint8Array,
  template: AttrDef[]
): number => {
  const pMechanism = M._malloc(8)
  writeUlong(M, pMechanism, CKM_AES_KEY_WRAP_KWP)
  writeUlong(M, pMechanism + 4, 0)

  const pWrapped = M._malloc(wrappedBytes.length)
  M.HEAPU8.set(wrappedBytes, pWrapped)

  const tpl = buildTemplate(M, template)
  const phKey = M._malloc(4)

  const rv = M._C_UnwrapKey(
    hSession,
    pMechanism,
    hUnwrapKey,
    pWrapped,
    wrappedBytes.length,
    tpl.ptr,
    template.length,
    phKey
  )
  checkRV(rv, 'C_UnwrapKey')

  const hKey = readUlong(M, phKey)
  M._free(phKey)
  freeTemplate(M, tpl, template.length)
  M._free(pWrapped)
  M._free(pMechanism)
  return hKey
}
