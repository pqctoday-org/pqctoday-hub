import type { type SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  CKA_CLASS,
  CKA_DECRYPT,
  CKA_ENCRYPT,
  CKA_EXTRACTABLE,
  CKA_KEY_TYPE,
  CKA_MODULUS_BITS,
  CKA_PRIVATE,
  CKA_PUBLIC_EXPONENT,
  CKA_SENSITIVE,
  CKA_TOKEN,
  CKA_UNWRAP,
  CKA_WRAP,
  CKK_RSA,
  CKM_AES_GCM,
  CKM_RSA_PKCS_KEY_PAIR_GEN,
  CKM_RSA_PKCS_OAEP,
  CKO_PRIVATE_KEY,
  CKO_PUBLIC_KEY,
} from './constants'
import {
  type AttrDef,
  allocUlong,
  buildGCMParams,
  buildMech,
  buildOAEPParams,
  buildTemplate,
  checkRV,
  freeTemplate,
  readUlong,
  writeBytes,
  writeUlong,
} from './helpers'
import { hsm_generateRandom } from './session'

// ── Key Wrap/Unwrap extension — FIPS 140-3 L3 approved mechanisms ─────────────

/**
 * Generate an RSA key pair with CKA_WRAP (public) and CKA_UNWRAP (private) enabled.
 * Suitable for RSA-OAEP indirect key transport / key wrapping.
 */
export const hsm_generateRSAWrapKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  keyBits: 2048 | 3072 | 4096
): { pubHandle: number; privHandle: number } => {
  const mech = buildMech(M, CKM_RSA_PKCS_KEY_PAIR_GEN)
  const exp = new Uint8Array([0x01, 0x00, 0x01]) // e=65537
  const expPtr = writeBytes(M, exp)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_MODULUS_BITS, ulongVal: keyBits },
    { type: CKA_PUBLIC_EXPONENT, bytesPtr: expPtr, bytesLen: 3 },
    { type: CKA_ENCRYPT, boolVal: true },
    { type: CKA_WRAP, boolVal: true },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: false },
    { type: CKA_DECRYPT, boolVal: true },
    { type: CKA_UNWRAP, boolVal: true },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 7, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(RSA-wrap)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    M._free(expPtr)
    freeTemplate(M, pubTpl, 7)
    freeTemplate(M, prvTpl, 8)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/**
 * Generalized AES key wrap (no extra mechanism parameters).
 * Supports CKM_AES_KEY_WRAP (0x2109 / RFC 3394) and CKM_AES_KEY_WRAP_KWP (0x210A / RFC 5649).
 */
export const hsm_wrapKeyMech = (
  M: SoftHSMModule,
  hSession: number,
  mechType: number,
  wrappingHandle: number,
  targetHandle: number
): Uint8Array => {
  const mech = buildMech(M, mechType)
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

/**
 * AES-GCM key wrap via C_WrapKeyAuthenticated(CKM_AES_GCM, CK_GCM_PARAMS).
 * Returns both the wrapped blob and the IV (both required for unwrap).
 * If iv has length 0 a fresh 12-byte IV is generated automatically.
 */
export const hsm_aesGcmWrapKey = (
  M: SoftHSMModule,
  hSession: number,
  wrappingHandle: number,
  targetHandle: number,
  iv: Uint8Array
): { wrapped: Uint8Array; iv: Uint8Array } => {
  const actualIv = iv.length === 12 ? iv : hsm_generateRandom(M, hSession, 12)
  const gcmP = buildGCMParams(M, actualIv)
  const mech = buildMech(M, CKM_AES_GCM, gcmP.ptr, gcmP.len)
  const wrappedLenPtr = allocUlong(M)
  let wrappedPtr = 0
  try {
    checkRV(
      M._C_WrapKeyAuthenticated(
        hSession,
        mech,
        wrappingHandle,
        targetHandle,
        0,
        0,
        0,
        wrappedLenPtr
      ),
      'C_WrapKeyAuthenticated(GCM,len)'
    )
    const wrappedLen = readUlong(M, wrappedLenPtr)
    wrappedPtr = M._malloc(wrappedLen)
    writeUlong(M, wrappedLenPtr, wrappedLen)
    checkRV(
      M._C_WrapKeyAuthenticated(
        hSession,
        mech,
        wrappingHandle,
        targetHandle,
        0,
        0,
        wrappedPtr,
        wrappedLenPtr
      ),
      'C_WrapKeyAuthenticated(GCM)'
    )
    return {
      wrapped: M.HEAPU8.slice(wrappedPtr, wrappedPtr + readUlong(M, wrappedLenPtr)),
      iv: actualIv,
    }
  } finally {
    gcmP.allocPtrs.forEach((p) => M._free(p))
    M._free(mech)
    M._free(wrappedLenPtr)
    if (wrappedPtr) M._free(wrappedPtr)
  }
}

/**
 * RSA-OAEP key wrap via C_WrapKey(CKM_RSA_PKCS_OAEP).
 * The RSA public key must have CKA_WRAP=true (use hsm_generateRSAWrapKeyPair).
 */
export const hsm_rsaOaepWrapKey = (
  M: SoftHSMModule,
  hSession: number,
  rsaPubHandle: number,
  targetHandle: number,
  hashAlgo: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): Uint8Array => {
  const oaepParams = buildOAEPParams(M, hashAlgo)
  const mech = buildMech(M, CKM_RSA_PKCS_OAEP, oaepParams.ptr, oaepParams.len)
  const wrappedLenPtr = allocUlong(M)
  let wrappedPtr = 0
  try {
    checkRV(
      M._C_WrapKey(hSession, mech, rsaPubHandle, targetHandle, 0, wrappedLenPtr),
      'C_WrapKey(RSA-OAEP,len)'
    )
    const wrappedLen = readUlong(M, wrappedLenPtr)
    wrappedPtr = M._malloc(wrappedLen)
    writeUlong(M, wrappedLenPtr, wrappedLen)
    checkRV(
      M._C_WrapKey(hSession, mech, rsaPubHandle, targetHandle, wrappedPtr, wrappedLenPtr),
      'C_WrapKey(RSA-OAEP)'
    )
    return M.HEAPU8.slice(wrappedPtr, wrappedPtr + readUlong(M, wrappedLenPtr))
  } finally {
    M._free(oaepParams.ptr)
    M._free(mech)
    M._free(wrappedLenPtr)
    if (wrappedPtr) M._free(wrappedPtr)
  }
}

/**
 * RSA-OAEP key unwrap via C_UnwrapKey(CKM_RSA_PKCS_OAEP).
 * The RSA private key must have CKA_UNWRAP=true. Returns the new key handle.
 */
export const hsm_rsaOaepUnwrapKey = (
  M: SoftHSMModule,
  hSession: number,
  rsaPrivHandle: number,
  wrappedBytes: Uint8Array,
  template: AttrDef[],
  hashAlgo: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): number => {
  const oaepParams = buildOAEPParams(M, hashAlgo)
  const mech = buildMech(M, CKM_RSA_PKCS_OAEP, oaepParams.ptr, oaepParams.len)
  const pWrapped = writeBytes(M, wrappedBytes)
  const tpl = buildTemplate(M, template)
  const phKey = allocUlong(M)
  try {
    checkRV(
      M._C_UnwrapKey(
        hSession,
        mech,
        rsaPrivHandle,
        pWrapped,
        wrappedBytes.length,
        tpl.ptr,
        template.length,
        phKey
      ),
      'C_UnwrapKey(RSA-OAEP)'
    )
    return readUlong(M, phKey)
  } finally {
    M._free(oaepParams.ptr)
    M._free(mech)
    M._free(pWrapped)
    freeTemplate(M, tpl, template.length)
    M._free(phKey)
  }
}

/**
 * Generalized AES key unwrap (no extra mechanism parameters).
 * Supports CKM_AES_KEY_WRAP and CKM_AES_KEY_WRAP_KWP. Returns new key handle.
 */
export const hsm_unwrapKeyMech = (
  M: SoftHSMModule,
  hSession: number,
  mechType: number,
  hUnwrapKey: number,
  wrappedBytes: Uint8Array,
  template: AttrDef[]
): number => {
  const mech = buildMech(M, mechType)
  const pWrapped = writeBytes(M, wrappedBytes)
  const tpl = buildTemplate(M, template)
  const phKey = allocUlong(M)
  try {
    checkRV(
      M._C_UnwrapKey(
        hSession,
        mech,
        hUnwrapKey,
        pWrapped,
        wrappedBytes.length,
        tpl.ptr,
        template.length,
        phKey
      ),
      'C_UnwrapKey'
    )
    return readUlong(M, phKey)
  } finally {
    M._free(mech)
    M._free(pWrapped)
    freeTemplate(M, tpl, template.length)
    M._free(phKey)
  }
}

/**
 * AES-GCM key unwrap via C_UnwrapKeyAuthenticated(CKM_AES_GCM, CK_GCM_PARAMS).
 * @param iv  The 12-byte IV that was used during wrapping.
 */
export const hsm_aesGcmUnwrapKey = (
  M: SoftHSMModule,
  hSession: number,
  hUnwrapKey: number,
  wrappedBytes: Uint8Array,
  iv: Uint8Array,
  template: AttrDef[]
): number => {
  const gcmP = buildGCMParams(M, iv)
  const mech = buildMech(M, CKM_AES_GCM, gcmP.ptr, gcmP.len)
  const pWrapped = writeBytes(M, wrappedBytes)
  const tpl = buildTemplate(M, template)
  const phKey = allocUlong(M)
  try {
    checkRV(
      M._C_UnwrapKeyAuthenticated(
        hSession,
        mech,
        hUnwrapKey,
        pWrapped,
        wrappedBytes.length,
        tpl.ptr,
        template.length,
        0,
        0,
        phKey
      ),
      'C_UnwrapKeyAuthenticated(GCM)'
    )
    return readUlong(M, phKey)
  } finally {
    gcmP.allocPtrs.forEach((p) => M._free(p))
    M._free(mech)
    M._free(pWrapped)
    freeTemplate(M, tpl, template.length)
    M._free(phKey)
  }
}
