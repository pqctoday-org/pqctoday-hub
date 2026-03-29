import type { type SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { ecCurveOID } from './classical'
import {
  CKA_CLASS,
  CKA_DECRYPT,
  CKA_DERIVE,
  CKA_EC_PARAMS,
  CKA_EC_POINT,
  CKA_ENCRYPT,
  CKA_EXTRACTABLE,
  CKA_KEY_TYPE,
  CKA_MODULUS,
  CKA_PUBLIC_EXPONENT,
  CKA_SENSITIVE,
  CKA_SIGN,
  CKA_TOKEN,
  CKA_UNWRAP,
  CKA_VALUE,
  CKA_VALUE_LEN,
  CKA_VERIFY,
  CKA_WRAP,
  CKK_AES,
  CKK_EC,
  CKK_GENERIC_SECRET,
  CKK_RSA,
  CKM_AES_CBC_PAD,
  CKM_AES_CMAC,
  CKM_AES_CTR,
  CKM_AES_GCM,
  CKM_AES_KEY_GEN,
  CKM_AES_KEY_WRAP,
  CKM_GENERIC_SECRET_KEY_GEN,
  CKM_KMAC_256,
  CKM_SHA256,
  CKM_SHA256_HMAC,
  CKO_PUBLIC_KEY,
  CKO_SECRET_KEY,
} from './constants'
import {
  type AttrDef,
  allocUlong,
  buildGCMParams,
  buildMech,
  buildTemplate,
  checkRV,
  freeTemplate,
  readUlong,
  writeBytes,
  writeUlong,
} from './helpers'

// ── AES helpers ───────────────────────────────────────────────────────────────

/** Generate an AES symmetric key (128/192/256 bits). Returns CKO_SECRET_KEY handle.
 *  Boolean params map 1:1 to PKCS#11 v3.2 CKA_* template attributes (Table 14). */
export const hsm_generateAESKey = (
  M: SoftHSMModule,
  hSession: number,
  keyBits: 128 | 192 | 256,
  encrypt = true,
  decrypt = true,
  wrap = true,
  unwrap = true,
  derive = true,
  extractable = true
): number => {
  const mech = buildMech(M, CKM_AES_KEY_GEN)
  const tpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_ENCRYPT, boolVal: encrypt },
    { type: CKA_DECRYPT, boolVal: decrypt },
    { type: CKA_WRAP, boolVal: wrap },
    { type: CKA_UNWRAP, boolVal: unwrap },
    { type: CKA_DERIVE, boolVal: derive },
    { type: CKA_VALUE_LEN, ulongVal: keyBits / 8 },
  ])
  const hKeyPtr = allocUlong(M)
  try {
    checkRV(M._C_GenerateKey(hSession, mech, tpl.ptr, 11, hKeyPtr), 'C_GenerateKey(AES)')
    return readUlong(M, hKeyPtr)
  } finally {
    M._free(mech)
    freeTemplate(M, tpl, 11)
    M._free(hKeyPtr)
  }
}

/** Import raw bytes as a CKK_GENERIC_SECRET with CKA_DERIVE=true. For HKDF input or seed wrapping. */
export const hsm_importGenericSecret = (
  M: SoftHSMModule,
  hSession: number,
  secretBytes: Uint8Array
): number => {
  const ptr = M._malloc(secretBytes.length)
  M.HEAPU8.set(secretBytes, ptr)

  const tpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_DERIVE, boolVal: true },
    { type: CKA_VALUE, bytesPtr: ptr, bytesLen: secretBytes.length },
    // CKA_VALUE_LEN omitted — read-only during C_CreateObject (auto-computed from CKA_VALUE)
  ])
  const hKeyPtr = allocUlong(M)
  try {
    checkRV(
      M._C_CreateObject(hSession, tpl.ptr, 7, hKeyPtr),
      'C_CreateObject(Import GenericSecret)'
    )
    return readUlong(M, hKeyPtr)
  } finally {
    freeTemplate(M, tpl, 7)
    M._free(hKeyPtr)
    M._free(ptr)
  }
}

/** Import an AES symmetric key. Returns CKO_SECRET_KEY handle.
 *  Optional boolean params control CKA_* attributes (all default true for backward compat). */
export const hsm_importAESKey = (
  M: SoftHSMModule,
  hSession: number,
  keyBytes: Uint8Array,
  encrypt = true,
  decrypt = true,
  wrap = true,
  unwrap = true,
  derive = true,
  extractable = true,
  sign = false,
  verify = false
): number => {
  const keyPtr = M._malloc(keyBytes.length)
  M.HEAPU8.set(keyBytes, keyPtr)

  const tpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_ENCRYPT, boolVal: encrypt },
    { type: CKA_DECRYPT, boolVal: decrypt },
    { type: CKA_WRAP, boolVal: wrap },
    { type: CKA_UNWRAP, boolVal: unwrap },
    { type: CKA_DERIVE, boolVal: derive },
    { type: CKA_SIGN, boolVal: sign },
    { type: CKA_VERIFY, boolVal: verify },
    { type: CKA_VALUE, bytesPtr: keyPtr, bytesLen: keyBytes.length },
  ])
  const hKeyPtr = allocUlong(M)
  try {
    checkRV(M._C_CreateObject(hSession, tpl.ptr, 13, hKeyPtr), 'C_CreateObject(Import AES)')
    return readUlong(M, hKeyPtr)
  } finally {
    freeTemplate(M, tpl, 13)
    M._free(hKeyPtr)
    M._free(keyPtr)
  }
}

/** Import an HMAC key (CKK_GENERIC_SECRET with CKA_SIGN + CKA_VERIFY). Returns handle.
 *  Optional boolean params control CKA_SIGN/CKA_VERIFY (both default true for backward compat). */
export const hsm_importHMACKey = (
  M: SoftHSMModule,
  hSession: number,
  keyBytes: Uint8Array,
  sign = true,
  verify = true
): number => {
  const keyPtr = M._malloc(keyBytes.length)
  M.HEAPU8.set(keyBytes, keyPtr)

  const tpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_SIGN, boolVal: sign },
    { type: CKA_VERIFY, boolVal: verify },
    { type: CKA_VALUE, bytesPtr: keyPtr, bytesLen: keyBytes.length },
  ])
  const hKeyPtr = allocUlong(M)
  try {
    checkRV(M._C_CreateObject(hSession, tpl.ptr, 8, hKeyPtr), 'C_CreateObject(Import HMAC)')
    return readUlong(M, hKeyPtr)
  } finally {
    freeTemplate(M, tpl, 8)
    M._free(hKeyPtr)
    M._free(keyPtr)
  }
}

/** Import an RSA public key from raw modulus + exponent bytes. Returns CKO_PUBLIC_KEY handle.
 *  Optional encrypt param controls CKA_ENCRYPT (default true). CKA_VERIFY is always true. */
export const hsm_importRSAPublicKey = (
  M: SoftHSMModule,
  hSession: number,
  modulusBytes: Uint8Array,
  exponentBytes: Uint8Array,
  encrypt = true
): number => {
  const modPtr = M._malloc(modulusBytes.length)
  M.HEAPU8.set(modulusBytes, modPtr)
  const expPtr = M._malloc(exponentBytes.length)
  M.HEAPU8.set(exponentBytes, expPtr)

  // CKA_VALUE in Rust engine format: [n_len:4LE][n_bytes][e_bytes]
  const ckValue = new Uint8Array(4 + modulusBytes.length + exponentBytes.length)
  new DataView(ckValue.buffer).setUint32(0, modulusBytes.length, true)
  ckValue.set(modulusBytes, 4)
  ckValue.set(exponentBytes, 4 + modulusBytes.length)
  const valPtr = writeBytes(M, ckValue)

  const baseAttrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: encrypt },
    { type: CKA_MODULUS, bytesPtr: modPtr, bytesLen: modulusBytes.length },
    { type: CKA_PUBLIC_EXPONENT, bytesPtr: expPtr, bytesLen: exponentBytes.length },
  ]
  const hKeyPtr = allocUlong(M)
  try {
    // Try with CKA_VALUE (Rust engine needs it); fall back without it (C++ rejects it on public keys)
    const tplFull = buildTemplate(M, [
      ...baseAttrs,
      { type: CKA_VALUE, bytesPtr: valPtr, bytesLen: ckValue.length },
    ])
    const rv = M._C_CreateObject(hSession, tplFull.ptr, 8, hKeyPtr) >>> 0
    freeTemplate(M, tplFull, 8)
    if (rv === 0x12) {
      // CKR_ATTRIBUTE_TYPE_INVALID — retry without CKA_VALUE
      const tplStd = buildTemplate(M, baseAttrs)
      checkRV(
        M._C_CreateObject(hSession, tplStd.ptr, 7, hKeyPtr),
        'C_CreateObject(Import RSA PubKey)'
      )
      freeTemplate(M, tplStd, 7)
    } else {
      checkRV(rv, 'C_CreateObject(Import RSA PubKey)')
    }
    return readUlong(M, hKeyPtr)
  } finally {
    M._free(hKeyPtr)
    M._free(modPtr)
    M._free(expPtr)
    M._free(valPtr)
  }
}

/**
 * Import an EC public key from raw (qx, qy) coordinates. Returns CKO_PUBLIC_KEY handle.
 * Builds the DER-encoded CKA_EC_POINT (OCTET STRING wrapping 04 || x || y).
 */
export const hsm_importECPublicKey = (
  M: SoftHSMModule,
  hSession: number,
  qx: Uint8Array,
  qy: Uint8Array,
  curve: 'P-256' | 'P-384' | 'P-521' = 'P-256'
): number => {
  const oid = ecCurveOID(curve)
  const oidPtr = writeBytes(M, oid)

  // Build DER-encoded uncompressed EC point: OCTET STRING { 04 || x || y }
  const pointLen = 1 + qx.length + qy.length // 04 prefix + coordinates
  const derPoint = new Uint8Array(2 + pointLen)
  derPoint[0] = 0x04 // OCTET STRING tag
  derPoint[1] = pointLen
  derPoint[2] = 0x04 // uncompressed point prefix
  derPoint.set(qx, 3)
  derPoint.set(qy, 3 + qx.length)
  const pointPtr = writeBytes(M, derPoint)

  // Build CKA_VALUE as raw SEC1 uncompressed point for Rust engine: 04 || x || y
  const sec1Point = new Uint8Array(1 + qx.length + qy.length)
  sec1Point[0] = 0x04
  sec1Point.set(qx, 1)
  sec1Point.set(qy, 1 + qx.length)
  const valPtr = writeBytes(M, sec1Point)

  const baseAttrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_EC_PARAMS, bytesPtr: oidPtr, bytesLen: oid.length },
    { type: CKA_EC_POINT, bytesPtr: pointPtr, bytesLen: derPoint.length },
  ]
  const hKeyPtr = allocUlong(M)
  try {
    // Try with CKA_VALUE (Rust engine needs it); fall back without it (C++ rejects it on public keys)
    const tplFull = buildTemplate(M, [
      ...baseAttrs,
      { type: CKA_VALUE, bytesPtr: valPtr, bytesLen: sec1Point.length },
    ])
    const rv = M._C_CreateObject(hSession, tplFull.ptr, 7, hKeyPtr) >>> 0
    freeTemplate(M, tplFull, 7)
    if (rv === 0x12) {
      // CKR_ATTRIBUTE_TYPE_INVALID — retry without CKA_VALUE
      const tplStd = buildTemplate(M, baseAttrs)
      checkRV(
        M._C_CreateObject(hSession, tplStd.ptr, 6, hKeyPtr),
        'C_CreateObject(Import EC PubKey)'
      )
      freeTemplate(M, tplStd, 6)
    } else {
      checkRV(rv, 'C_CreateObject(Import EC PubKey)')
    }
    return readUlong(M, hKeyPtr)
  } finally {
    M._free(hKeyPtr)
    M._free(oidPtr)
    M._free(pointPtr)
    M._free(valPtr)
  }
}

/**
 * AES encrypt (GCM or CBC-PAD). A random IV is generated internally.
 * GCM output: ciphertext bytes include the 16-byte auth tag appended by SoftHSM.
 * Returns { ciphertext, iv }.
 */
export const hsm_aesEncrypt = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  plaintext: Uint8Array,
  mode: 'gcm' | 'cbc' = 'gcm',
  forcedIv?: Uint8Array,
  aad?: Uint8Array
): { ciphertext: Uint8Array; iv: Uint8Array } => {
  const iv = forcedIv || new Uint8Array(mode === 'gcm' ? 12 : 16)
  if (!forcedIv) crypto.getRandomValues(iv)
  let mech: number
  const allocPtrs: number[] = []
  if (mode === 'gcm') {
    const gcmP = buildGCMParams(M, iv, aad)
    gcmP.allocPtrs.forEach((p) => allocPtrs.push(p))
    mech = buildMech(M, CKM_AES_GCM, gcmP.ptr, gcmP.len)
  } else {
    const ivPtr = writeBytes(M, iv)
    allocPtrs.push(ivPtr)
    mech = buildMech(M, CKM_AES_CBC_PAD, ivPtr, 16)
  }
  const plainPtr = writeBytes(M, plaintext)
  allocPtrs.push(plainPtr)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_EncryptInit(hSession, mech, keyHandle), 'C_EncryptInit(AES)')
    checkRV(M._C_Encrypt(hSession, plainPtr, plaintext.length, 0, outLenPtr), 'C_Encrypt(AES,len)')
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(M._C_Encrypt(hSession, plainPtr, plaintext.length, outPtr, outLenPtr), 'C_Encrypt(AES)')
    return { ciphertext: M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr)), iv }
  } finally {
    M._free(mech)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
    allocPtrs.forEach((p) => M._free(p))
  }
}

/**
 * AES decrypt (GCM or CBC-PAD).
 * For GCM: ciphertext must include the 16-byte auth tag at the end (as returned by hsm_aesEncrypt).
 */
export const hsm_aesDecrypt = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  ciphertext: Uint8Array,
  iv: Uint8Array,
  mode: 'gcm' | 'cbc' = 'gcm'
): Uint8Array => {
  let mech: number
  const allocPtrs: number[] = []
  if (mode === 'gcm') {
    const gcmP = buildGCMParams(M, iv)
    gcmP.allocPtrs.forEach((p) => allocPtrs.push(p))
    mech = buildMech(M, CKM_AES_GCM, gcmP.ptr, gcmP.len)
  } else {
    const ivPtr = writeBytes(M, iv)
    allocPtrs.push(ivPtr)
    mech = buildMech(M, CKM_AES_CBC_PAD, ivPtr, 16)
  }
  const ctPtr = writeBytes(M, ciphertext)
  allocPtrs.push(ctPtr)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_DecryptInit(hSession, mech, keyHandle), 'C_DecryptInit(AES)')
    checkRV(M._C_Decrypt(hSession, ctPtr, ciphertext.length, 0, outLenPtr), 'C_Decrypt(AES,len)')
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(M._C_Decrypt(hSession, ctPtr, ciphertext.length, outPtr, outLenPtr), 'C_Decrypt(AES)')
    return M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr))
  } finally {
    M._free(mech)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
    allocPtrs.forEach((p) => M._free(p))
  }
}

/** AES-CMAC via C_SignInit(CKM_AES_CMAC) + C_Sign. Returns 16-byte MAC. */
export const hsm_aesCmac = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  data: Uint8Array
): Uint8Array => {
  const mech = buildMech(M, CKM_AES_CMAC)
  const dataPtr = writeBytes(M, data)
  const macLenPtr = allocUlong(M)
  let macPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, keyHandle), 'C_SignInit(AES-CMAC)')
    checkRV(M._C_Sign(hSession, dataPtr, data.length, 0, macLenPtr), 'C_Sign(AES-CMAC,len)')
    const macLen = readUlong(M, macLenPtr)
    macPtr = M._malloc(macLen)
    writeUlong(M, macLenPtr, macLen)
    checkRV(M._C_Sign(hSession, dataPtr, data.length, macPtr, macLenPtr), 'C_Sign(AES-CMAC)')
    return M.HEAPU8.slice(macPtr, macPtr + readUlong(M, macLenPtr))
  } finally {
    M._free(mech)
    M._free(dataPtr)
    M._free(macLenPtr)
    if (macPtr) M._free(macPtr)
  }
}

/**
 * AES-CTR encrypt via C_EncryptInit(CKM_AES_CTR) + C_Encrypt.
 * CK_AES_CTR_PARAMS: ulCounterBits (4 bytes) + cb[16] (counter block / IV).
 * For SUCI (TS 33.501): counterBits=128, ctrIv=16×0x00 (zero IV).
 */
export const hsm_aesCtrEncrypt = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  ctrIv: Uint8Array,
  counterBits: number,
  data: Uint8Array
): Uint8Array => {
  // Build CK_AES_CTR_PARAMS (20 bytes): ulCounterBits[4] + cb[16]
  const paramsPtr = M._malloc(20)
  M.setValue(paramsPtr, counterBits, 'i32') // ulCounterBits
  M.HEAPU8.set(ctrIv.slice(0, 16), paramsPtr + 4) // cb[16]
  const mech = buildMech(M, CKM_AES_CTR, paramsPtr, 20)
  const dataPtr = writeBytes(M, data)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_EncryptInit(hSession, mech, keyHandle), 'C_EncryptInit(AES-CTR)')
    checkRV(M._C_Encrypt(hSession, dataPtr, data.length, 0, outLenPtr), 'C_Encrypt(AES-CTR,len)')
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(M._C_Encrypt(hSession, dataPtr, data.length, outPtr, outLenPtr), 'C_Encrypt(AES-CTR)')
    return M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr))
  } finally {
    M._free(mech)
    M._free(paramsPtr)
    M._free(dataPtr)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
  }
}

/**
 * AES-CTR decrypt via C_DecryptInit(CKM_AES_CTR) + C_Decrypt.
 * CTR mode is symmetric — encrypt and decrypt use the same operation.
 */
export const hsm_aesCtrDecrypt = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  ctrIv: Uint8Array,
  counterBits: number,
  ciphertext: Uint8Array
): Uint8Array => {
  const paramsPtr = M._malloc(20)
  M.setValue(paramsPtr, counterBits, 'i32')
  M.HEAPU8.set(ctrIv.slice(0, 16), paramsPtr + 4)
  const mech = buildMech(M, CKM_AES_CTR, paramsPtr, 20)
  const ctPtr = writeBytes(M, ciphertext)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_DecryptInit(hSession, mech, keyHandle), 'C_DecryptInit(AES-CTR)')
    checkRV(
      M._C_Decrypt(hSession, ctPtr, ciphertext.length, 0, outLenPtr),
      'C_Decrypt(AES-CTR,len)'
    )
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(
      M._C_Decrypt(hSession, ctPtr, ciphertext.length, outPtr, outLenPtr),
      'C_Decrypt(AES-CTR)'
    )
    return M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr))
  } finally {
    M._free(mech)
    M._free(paramsPtr)
    M._free(ctPtr)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
  }
}

/** Wrap a key with an AES wrapping key via C_WrapKey(CKM_AES_KEY_WRAP). */
export const hsm_aesWrapKey = (
  M: SoftHSMModule,
  hSession: number,
  wrappingHandle: number,
  targetHandle: number
): Uint8Array => {
  const mech = buildMech(M, CKM_AES_KEY_WRAP)
  const wrappedLenPtr = allocUlong(M)
  let wrappedPtr = 0
  try {
    checkRV(
      M._C_WrapKey(hSession, mech, wrappingHandle, targetHandle, 0, wrappedLenPtr),
      'C_WrapKey(len)'
    )
    const wrappedLen = readUlong(M, wrappedLenPtr)
    wrappedPtr = M._malloc(wrappedLen)
    writeUlong(M, wrappedLenPtr, wrappedLen)
    checkRV(
      M._C_WrapKey(hSession, mech, wrappingHandle, targetHandle, wrappedPtr, wrappedLenPtr),
      'C_WrapKey'
    )
    return M.HEAPU8.slice(wrappedPtr, wrappedPtr + readUlong(M, wrappedLenPtr))
  } finally {
    M._free(mech)
    M._free(wrappedLenPtr)
    if (wrappedPtr) M._free(wrappedPtr)
  }
}

// ── HMAC helpers ──────────────────────────────────────────────────────────────

/** Generate an HMAC key (generic secret). keyBytes defaults to 32 (256-bit). */
export const hsm_generateHMACKey = (M: SoftHSMModule, hSession: number, keyBytes = 32): number => {
  const mech = buildMech(M, CKM_GENERIC_SECRET_KEY_GEN)
  const tpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyBytes },
  ])
  const hKeyPtr = allocUlong(M)
  try {
    checkRV(M._C_GenerateKey(hSession, mech, tpl.ptr, 8, hKeyPtr), 'C_GenerateKey(HMAC)')
    return readUlong(M, hKeyPtr)
  } finally {
    M._free(mech)
    freeTemplate(M, tpl, 8)
    M._free(hKeyPtr)
  }
}

/** Compute HMAC via C_SignInit + C_Sign. mechType: CKM_SHA256_HMAC, etc. */
export const hsm_hmac = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  data: Uint8Array,
  mechType: number = CKM_SHA256_HMAC
): Uint8Array => {
  const mech = buildMech(M, mechType)
  const dataPtr = writeBytes(M, data)
  const macLenPtr = allocUlong(M)
  let macPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, keyHandle), 'C_SignInit(HMAC)')
    checkRV(M._C_Sign(hSession, dataPtr, data.length, 0, macLenPtr), 'C_Sign(HMAC,len)')
    const macLen = readUlong(M, macLenPtr)
    macPtr = M._malloc(macLen)
    writeUlong(M, macLenPtr, macLen)
    checkRV(M._C_Sign(hSession, dataPtr, data.length, macPtr, macLenPtr), 'C_Sign(HMAC)')
    return M.HEAPU8.slice(macPtr, macPtr + readUlong(M, macLenPtr))
  } finally {
    M._free(mech)
    M._free(dataPtr)
    M._free(macLenPtr)
    if (macPtr) M._free(macPtr)
  }
}

/** Verify HMAC via C_VerifyInit + C_Verify. Returns true if MAC matches. */
export const hsm_hmacVerify = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  data: Uint8Array,
  mac: Uint8Array,
  mechType: number = CKM_SHA256_HMAC
): boolean => {
  const mech = buildMech(M, mechType)
  const dataPtr = writeBytes(M, data)
  const macPtr = writeBytes(M, mac)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, keyHandle), 'C_VerifyInit(HMAC)')
    const rv = M._C_Verify(hSession, dataPtr, data.length, macPtr, mac.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(dataPtr)
    M._free(macPtr)
  }
}

// ── SHA digest helper ─────────────────────────────────────────────────────────

/**
 * Compute a SHA digest via C_DigestInit + C_Digest (two-step: size query then actual).
 * mechType: CKM_SHA256 | CKM_SHA384 | CKM_SHA512 | CKM_SHA3_256 | CKM_SHA3_512
 */
export const hsm_digest = (
  M: SoftHSMModule,
  hSession: number,
  data: Uint8Array,
  mechType: number = CKM_SHA256
): Uint8Array => {
  const mech = buildMech(M, mechType)
  const dataPtr = writeBytes(M, data)
  const digestLenPtr = allocUlong(M)
  let digestPtr = 0
  try {
    checkRV(M._C_DigestInit(hSession, mech), 'C_DigestInit')
    // Size query: pDigest=0 returns required length without advancing state (PKCS#11 §5.2)
    checkRV(M._C_Digest(hSession, dataPtr, data.length, 0, digestLenPtr), 'C_Digest(len)')
    const digestLen = readUlong(M, digestLenPtr)
    digestPtr = M._malloc(digestLen)
    writeUlong(M, digestLenPtr, digestLen)
    checkRV(M._C_Digest(hSession, dataPtr, data.length, digestPtr, digestLenPtr), 'C_Digest')
    return M.HEAPU8.slice(digestPtr, digestPtr + readUlong(M, digestLenPtr))
  } finally {
    M._free(mech)
    M._free(dataPtr)
    M._free(digestLenPtr)
    if (digestPtr) M._free(digestPtr)
  }
}

/**
 * Compute a SHA digest via C_DigestInit + C_DigestUpdate × N + C_DigestFinal.
 * mechType: CKM_SHA256 | CKM_SHA384 | CKM_SHA512 | CKM_SHA3_256 | CKM_SHA3_512
 */
export const hsm_digestMultiPart = (
  M: SoftHSMModule,
  hSession: number,
  chunks: Uint8Array[],
  mechType: number = CKM_SHA256
): Uint8Array => {
  const mech = buildMech(M, mechType)
  const digestLenPtr = allocUlong(M)
  let digestPtr = 0
  const chunkPtrs: number[] = []
  try {
    checkRV(M._C_DigestInit(hSession, mech), 'C_DigestInit')
    for (const chunk of chunks) {
      const ptr = writeBytes(M, chunk)
      chunkPtrs.push(ptr)
      checkRV(M._C_DigestUpdate(hSession, ptr, chunk.length), 'C_DigestUpdate')
    }
    // Size query: pDigest=0 returns required length without consuming state
    checkRV(M._C_DigestFinal(hSession, 0, digestLenPtr), 'C_DigestFinal(len)')
    const digestLen = readUlong(M, digestLenPtr)
    digestPtr = M._malloc(digestLen)
    writeUlong(M, digestLenPtr, digestLen)
    checkRV(M._C_DigestFinal(hSession, digestPtr, digestLenPtr), 'C_DigestFinal')
    return M.HEAPU8.slice(digestPtr, digestPtr + readUlong(M, digestLenPtr))
  } finally {
    M._free(mech)
    M._free(digestLenPtr)
    for (const ptr of chunkPtrs) M._free(ptr)
    if (digestPtr) M._free(digestPtr)
  }
}

// ── KMAC helpers (NIST SP 800-185, softhsmv3 vendor extension) ───────────────

/** Generate a GENERIC_SECRET key for KMAC-128/256 operations. Returns key handle. */
export const hsm_generateKMACKey = (M: SoftHSMModule, hSession: number, keyBytes = 32): number => {
  const mech = buildMech(M, CKM_GENERIC_SECRET_KEY_GEN)
  const tpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyBytes },
  ])
  const hKeyPtr = allocUlong(M)
  try {
    checkRV(M._C_GenerateKey(hSession, mech, tpl.ptr, 8, hKeyPtr), 'C_GenerateKey(KMAC)')
    return readUlong(M, hKeyPtr)
  } finally {
    M._free(mech)
    freeTemplate(M, tpl, 8)
    M._free(hKeyPtr)
  }
}

/** Compute KMAC via C_SignInit + C_Sign. mechType: CKM_KMAC_128 or CKM_KMAC_256. */
export const hsm_kmac = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  data: Uint8Array,
  mechType: number = CKM_KMAC_256
): Uint8Array => {
  const mech = buildMech(M, mechType)
  const dataPtr = writeBytes(M, data)
  const macLenPtr = allocUlong(M)
  let macPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, keyHandle), 'C_SignInit(KMAC)')
    checkRV(M._C_Sign(hSession, dataPtr, data.length, 0, macLenPtr), 'C_Sign(KMAC,len)')
    const macLen = readUlong(M, macLenPtr)
    macPtr = M._malloc(macLen)
    writeUlong(M, macLenPtr, macLen)
    checkRV(M._C_Sign(hSession, dataPtr, data.length, macPtr, macLenPtr), 'C_Sign(KMAC)')
    return M.HEAPU8.slice(macPtr, macPtr + readUlong(M, macLenPtr))
  } finally {
    M._free(mech)
    M._free(dataPtr)
    M._free(macLenPtr)
    if (macPtr) M._free(macPtr)
  }
}

/** Verify KMAC via C_VerifyInit + C_Verify. Returns true if MAC matches. */
export const hsm_kmacVerify = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number,
  data: Uint8Array,
  mac: Uint8Array,
  mechType: number = CKM_KMAC_256
): boolean => {
  const mech = buildMech(M, mechType)
  const dataPtr = writeBytes(M, data)
  const macPtr = writeBytes(M, mac)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, keyHandle), 'C_VerifyInit(KMAC)')
    const rv = M._C_Verify(hSession, dataPtr, data.length, macPtr, mac.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(dataPtr)
    M._free(macPtr)
  }
}
