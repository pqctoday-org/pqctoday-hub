import type { type SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  CKA_CLASS,
  CKA_EXTRACTABLE,
  CKA_KEY_TYPE,
  CKA_SENSITIVE,
  CKA_TOKEN,
  CKA_VALUE_LEN,
  CKF_HKDF_SALT_DATA,
  CKF_HKDF_SALT_NULL,
  CKK_GENERIC_SECRET,
  CKM_HKDF_DERIVE,
  CKM_PKCS5_PBKD2,
  CKM_SP800_108_COUNTER_KDF,
  CKM_SP800_108_FEEDBACK_KDF,
  CKO_SECRET_KEY,
  CKP_PKCS5_PBKD2_HMAC_SHA512,
  CK_SP800_108_BYTE_ARRAY,
  CK_SP800_108_ITERATION_VARIABLE,
} from './constants'
import {
  allocUlong,
  buildMech,
  buildTemplate,
  checkRV,
  freeTemplate,
  readUlong,
  writeBytes,
} from './helpers'
import { hsm_extractKeyValue } from './pqc'

// ── PBKDF2 helpers ────────────────────────────────────────────────────────────

/**
 * PBKDF2 key derivation via C_DeriveKey(CKM_PKCS5_PBKD2) (PKCS#11 v3.2 §5.7.3.1).
 * prf defaults to CKP_PKCS5_PBKD2_HMAC_SHA512 (BIP39 / SLIP-0010 standard).
 * Returns a Uint8Array of the derived key bytes.
 */
export const hsm_pbkdf2 = (
  M: SoftHSMModule,
  hSession: number,
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
  keyLen: number,
  prf: number = CKP_PKCS5_PBKD2_HMAC_SHA512
): Uint8Array => {
  const CKZ_SALT_SPECIFIED = 0x00000001
  const saltPtr = M._malloc(Math.max(salt.length, 1))
  if (salt.length > 0) M.HEAPU8.set(salt, saltPtr)
  const passPtr = M._malloc(Math.max(password.length, 1))
  if (password.length > 0) M.HEAPU8.set(password, passPtr)

  // CK_PKCS5_PBKD2_PARAMS2: 9 × CK_ULONG/CK_VOID_PTR (4 bytes each) = 36 bytes
  const params = M._malloc(36)
  M.setValue(params + 0, CKZ_SALT_SPECIFIED, 'i32') // saltSource
  M.setValue(params + 4, saltPtr, 'i32') // pSaltSourceData
  M.setValue(params + 8, salt.length, 'i32') // ulSaltSourceDataLen
  M.setValue(params + 12, iterations, 'i32') // iterations
  M.setValue(params + 16, prf, 'i32') // prf
  M.setValue(params + 20, 0, 'i32') // pPrfData (null)
  M.setValue(params + 24, 0, 'i32') // ulPrfDataLen
  M.setValue(params + 28, passPtr, 'i32') // pPassword
  M.setValue(params + 32, password.length, 'i32') // ulPasswordLen

  const mech = buildMech(M, CKM_PKCS5_PBKD2, params, 36)
  const derivedTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyLen },
  ])
  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, 0, derivedTpl.ptr, 6, derivedHPtr),
      'C_DeriveKey(PBKDF2)'
    )
    const keyHandle = readUlong(M, derivedHPtr)
    return hsm_extractKeyValue(M, hSession, keyHandle)
  } finally {
    M._free(mech)
    M._free(params)
    M._free(saltPtr)
    M._free(passPtr)
    freeTemplate(M, derivedTpl, 6)
    M._free(derivedHPtr)
  }
}

// ── HKDF helpers ──────────────────────────────────────────────────────────────

/**
 * HKDF key derivation via C_DeriveKey(CKM_HKDF_DERIVE) (PKCS#11 v3.0+ §2.43).
 *
 * @param baseKeyHandle  Key handle providing IKM (input key material).
 * @param prf            Hash mechanism for HMAC PRF: CKM_SHA256 | CKM_SHA384 | CKM_SHA512 | CKM_SHA3_256 | CKM_SHA3_512
 * @param bExtract       Run HKDF-Extract step (use true for full HKDF or extract-only).
 * @param bExpand        Run HKDF-Expand step (use true for full HKDF or expand-only).
 * @param salt           Optional salt bytes (CKF_HKDF_SALT_DATA). Omit for CKF_HKDF_SALT_NULL.
 * @param info           Optional context/info bytes for HKDF-Expand.
 * @param keyLen         Output key length in bytes (default 32). Must be ≤ 512.
 * @returns Derived key bytes (Uint8Array of length keyLen).
 *
 * CK_HKDF_PARAMS layout in WASM (32 bytes total, 32-bit pointers):
 *   +0  CK_BBOOL bExtract        (1 byte, offset 0)
 *   +1  CK_BBOOL bExpand         (1 byte, offset 1)
 *   +2  padding                  (2 bytes)
 *   +4  CK_MECHANISM_TYPE prf    (4 bytes)
 *   +8  CK_ULONG ulSaltType      (4 bytes)
 *   +12 CK_BYTE_PTR pSalt        (4 bytes)
 *   +16 CK_ULONG ulSaltLen       (4 bytes)
 *   +20 CK_OBJECT_HANDLE hSaltKey(4 bytes)
 *   +24 CK_BYTE_PTR pInfo        (4 bytes)
 *   +28 CK_ULONG ulInfoLen       (4 bytes)
 */
export const hsm_hkdf = (
  M: SoftHSMModule,
  hSession: number,
  baseKeyHandle: number,
  prf: number,
  bExtract: boolean,
  bExpand: boolean,
  salt?: Uint8Array,
  info?: Uint8Array,
  keyLen = 32
): Uint8Array => {
  const saltPtr = salt && salt.length > 0 ? writeBytes(M, salt) : 0
  const infoPtr = info && info.length > 0 ? writeBytes(M, info) : 0
  const saltType = saltPtr > 0 ? CKF_HKDF_SALT_DATA : CKF_HKDF_SALT_NULL

  // Allocate and zero the 32-byte CK_HKDF_PARAMS struct
  const params = M._malloc(32)
  M.HEAPU8.fill(0, params, params + 32)
  M.HEAPU8[params + 0] = bExtract ? 1 : 0 // bExtract
  M.HEAPU8[params + 1] = bExpand ? 1 : 0 // bExpand
  M.setValue(params + 4, prf, 'i32') // prfHashMechanism
  M.setValue(params + 8, saltType, 'i32') // ulSaltType
  M.setValue(params + 12, saltPtr, 'i32') // pSalt
  M.setValue(params + 16, salt ? salt.length : 0, 'i32') // ulSaltLen
  M.setValue(params + 20, 0, 'i32') // hSaltKey (unused)
  M.setValue(params + 24, infoPtr, 'i32') // pInfo
  M.setValue(params + 28, info ? info.length : 0, 'i32') // ulInfoLen

  const mech = buildMech(M, CKM_HKDF_DERIVE, params, 32)
  const derivedTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyLen },
  ])
  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, baseKeyHandle, derivedTpl.ptr, 6, derivedHPtr),
      'C_DeriveKey(HKDF)'
    )
    const keyHandle = readUlong(M, derivedHPtr)
    return hsm_extractKeyValue(M, hSession, keyHandle)
  } finally {
    M._free(mech)
    M._free(params)
    if (saltPtr) M._free(saltPtr)
    if (infoPtr) M._free(infoPtr)
    freeTemplate(M, derivedTpl, 6)
    M._free(derivedHPtr)
  }
}

/**
 * NIST SP 800-108 Counter KDF via C_DeriveKey(CKM_SP800_108_COUNTER_KDF) (PKCS#11 v3.2 §2.44).
 *
 * Builds a minimal CK_SP800_108_KDF_PARAMS with:
 *   - prfType: hash mechanism (CKM_SHA256 | CKM_SHA384 | CKM_SHA512) or CKM_AES_CMAC.
 *     NOTE: SoftHSM3 ckmToDigestName() maps hash IDs only — do NOT pass CKM_SHA256_HMAC etc.
 *   - Data params: [ITERATION_VARIABLE(32-bit counter)] + optional [BYTE_ARRAY(fixedInput)]
 *
 * @param M             SoftHSM WASM module
 * @param hSession      Session handle
 * @param baseKeyHandle Key handle for the base key (Ki)
 * @param prfType       PRF hash mechanism (CKM_SHA256, CKM_SHA384, CKM_SHA512, or CKM_AES_CMAC)
 * @param fixedInput    Optional label/context bytes concatenated as fixed input
 * @param keyLen        Output key length in bytes (must match CKA_VALUE_LEN in template)
 * @returns             Derived key bytes as Uint8Array
 */
export const hsm_kbkdf = (
  M: SoftHSMModule,
  hSession: number,
  baseKeyHandle: number,
  prfType: number,
  fixedInput?: Uint8Array,
  keyLen = 32
): Uint8Array => {
  // CK_SP800_108_COUNTER_FORMAT: bLittleEndian(CK_BBOOL=1B) + pad(3B) + ulWidthInBits(CK_ULONG=4B) = 8 bytes
  const counterFmt = M._malloc(8)
  M.HEAPU8[counterFmt + 0] = 0 // bLittleEndian = CK_FALSE (big-endian)
  M.HEAPU8[counterFmt + 1] = 0
  M.HEAPU8[counterFmt + 2] = 0
  M.HEAPU8[counterFmt + 3] = 0
  M.setValue(counterFmt + 4, 32, 'i32') // ulWidthInBits = 32

  // CK_PRF_DATA_PARAM: type(4B) + pValue ptr(4B) + ulValueLen(4B) = 12 bytes each
  const numParams = fixedInput && fixedInput.length > 0 ? 2 : 1
  const dataParams = M._malloc(numParams * 12)

  // Param[0]: ITERATION_VARIABLE with counter format
  M.setValue(dataParams + 0, CK_SP800_108_ITERATION_VARIABLE, 'i32')
  M.setValue(dataParams + 4, counterFmt, 'i32')
  M.setValue(dataParams + 8, 8, 'i32')

  let fixedPtr = 0
  if (fixedInput && fixedInput.length > 0) {
    fixedPtr = M._malloc(fixedInput.length)
    M.HEAPU8.set(fixedInput, fixedPtr)
    // Param[1]: BYTE_ARRAY with fixed input (label/context)
    M.setValue(dataParams + 12, CK_SP800_108_BYTE_ARRAY, 'i32')
    M.setValue(dataParams + 16, fixedPtr, 'i32')
    M.setValue(dataParams + 20, fixedInput.length, 'i32')
  }

  // CK_SP800_108_KDF_PARAMS: prfType(4B) + ulNumberOfDataParams(4B) + pDataParams ptr(4B)
  //                        + ulAdditionalDerivedKeys(4B) + pAdditionalDerivedKeys ptr(4B) = 20 bytes
  const kdfParams = M._malloc(20)
  M.setValue(kdfParams + 0, prfType, 'i32')
  M.setValue(kdfParams + 4, numParams, 'i32')
  M.setValue(kdfParams + 8, dataParams, 'i32')
  M.setValue(kdfParams + 12, 0, 'i32') // ulAdditionalDerivedKeys = 0
  M.setValue(kdfParams + 16, 0, 'i32') // pAdditionalDerivedKeys = NULL

  const mech = buildMech(M, CKM_SP800_108_COUNTER_KDF, kdfParams, 20)
  const derivedTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyLen },
  ])
  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, baseKeyHandle, derivedTpl.ptr, 6, derivedHPtr),
      'C_DeriveKey(SP800-108 Counter KDF)'
    )
    const keyHandle = readUlong(M, derivedHPtr)
    return hsm_extractKeyValue(M, hSession, keyHandle)
  } finally {
    M._free(mech)
    M._free(kdfParams)
    M._free(dataParams)
    M._free(counterFmt)
    if (fixedPtr) M._free(fixedPtr)
    freeTemplate(M, derivedTpl, 6)
    M._free(derivedHPtr)
  }
}

/**
 * NIST SP 800-108 Feedback KDF via C_DeriveKey(CKM_SP800_108_FEEDBACK_KDF) (PKCS#11 v3.2 §2.44.2).
 * prfType: hash mechanism — CKM_SHA256 | CKM_SHA384 | CKM_SHA512 | CKM_AES_CMAC.
 * NOTE: SoftHSM3 ckmToDigestName() maps hash IDs only — do NOT pass CKM_SHA256_HMAC etc.
 * fixedInput: optional label/context bytes (CK_SP800_108_BYTE_ARRAY data params).
 * iv: optional feedback seed/IV (maps to CK_SP800_108_FEEDBACK_KDF_PARAMS.pIV).
 * keyLen: derived key length in bytes (default 32).
 * Returns derived key as Uint8Array.
 */
export const hsm_kbkdfFeedback = (
  M: SoftHSMModule,
  hSession: number,
  baseKeyHandle: number,
  prfType: number,
  fixedInput?: Uint8Array,
  iv?: Uint8Array,
  keyLen = 32
): Uint8Array => {
  // CK_SP800_108_FEEDBACK_KDF_PARAMS layout (28 bytes on 32-bit WASM):
  //   prfType          CK_ULONG  (4)
  //   ulNumberOfDataParams CK_ULONG (4)
  //   pDataParams      CK_VOID_PTR (4)
  //   ulIVLen          CK_ULONG  (4)
  //   pIV              CK_BYTE_PTR (4)
  //   ulAdditionalDerivedKeys CK_ULONG (4)
  //   pAdditionalDerivedKeys  CK_VOID_PTR (4)
  // Total: 28 bytes

  // Build data params array (1 BYTE_ARRAY entry if fixedInput provided)
  const CK_SP800_108_BYTE_ARRAY = 0x00000004
  let dataParams = 0
  let numDataParams = 0
  let fixedPtr = 0
  if (fixedInput && fixedInput.length > 0) {
    numDataParams = 1
    // CK_PRF_DATA_PARAM: type(4) + pValue(4) + ulValueLen(4) = 12 bytes
    dataParams = M._malloc(12)
    fixedPtr = M._malloc(fixedInput.length)
    M.HEAPU8.set(fixedInput, fixedPtr)
    M.setValue(dataParams + 0, CK_SP800_108_BYTE_ARRAY, 'i32')
    M.setValue(dataParams + 4, fixedPtr, 'i32')
    M.setValue(dataParams + 8, fixedInput.length, 'i32')
  }

  // Write IV if provided
  let ivPtr = 0
  const ivLen = iv ? iv.length : 0
  if (iv && iv.length > 0) {
    ivPtr = M._malloc(iv.length)
    M.HEAPU8.set(iv, ivPtr)
  }

  // Build CK_SP800_108_FEEDBACK_KDF_PARAMS (28 bytes)
  const kdfParams = M._malloc(28)
  M.setValue(kdfParams + 0, prfType, 'i32') // prfType
  M.setValue(kdfParams + 4, numDataParams, 'i32') // ulNumberOfDataParams
  M.setValue(kdfParams + 8, dataParams, 'i32') // pDataParams
  M.setValue(kdfParams + 12, ivLen, 'i32') // ulIVLen
  M.setValue(kdfParams + 16, ivPtr, 'i32') // pIV
  M.setValue(kdfParams + 20, 0, 'i32') // ulAdditionalDerivedKeys = 0
  M.setValue(kdfParams + 24, 0, 'i32') // pAdditionalDerivedKeys = NULL

  const mech = buildMech(M, CKM_SP800_108_FEEDBACK_KDF, kdfParams, 28)
  const derivedTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_VALUE_LEN, ulongVal: keyLen },
  ])
  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, baseKeyHandle, derivedTpl.ptr, 6, derivedHPtr),
      'C_DeriveKey(SP800-108 Feedback KDF)'
    )
    const keyHandle = readUlong(M, derivedHPtr)
    return hsm_extractKeyValue(M, hSession, keyHandle)
  } finally {
    M._free(mech)
    M._free(kdfParams)
    if (dataParams) M._free(dataParams)
    if (fixedPtr) M._free(fixedPtr)
    if (ivPtr) M._free(ivPtr)
    freeTemplate(M, derivedTpl, 6)
    M._free(derivedHPtr)
  }
}
