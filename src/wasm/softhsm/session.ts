import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { MECH_TABLE, type MechanismFamily } from './mechanismTable'
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

export type { MechanismFamily } from './mechanismTable'

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
