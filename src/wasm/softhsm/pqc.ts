import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  CKA_CLASS,
  CKA_DECAPSULATE,
  CKA_DECRYPT,
  CKA_DERIVE,
  CKA_EC_POINT,
  CKA_ENCAPSULATE,
  CKA_ENCRYPT,
  CKA_EXTRACTABLE,
  CKA_ID,
  CKA_KEY_TYPE,
  CKA_PARAMETER_SET,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_SIGN,
  CKA_TOKEN,
  CKA_VALUE,
  CKA_VALUE_LEN,
  CKA_VERIFY,
  CKA_UNWRAP,
  CKA_WRAP,
  CKH_DETERMINISTIC_REQUIRED,
  CKH_HEDGE_PREFERRED,
  CKH_HEDGE_REQUIRED,
  CKK_ML_DSA,
  CKK_ML_KEM,
  CKK_PQCTODAY_FRODOKEM,
  CKK_PQCTODAY_CLASSIC_MCELIECE,
  CKK_SLH_DSA,
  CKM_ECDSA_SHA256,
  CKM_HASH_ML_DSA_SHA224,
  CKM_HASH_ML_DSA_SHA256,
  CKM_HASH_ML_DSA_SHA384,
  CKM_HASH_ML_DSA_SHA3_224,
  CKM_HASH_ML_DSA_SHA3_256,
  CKM_HASH_ML_DSA_SHA3_384,
  CKM_HASH_ML_DSA_SHA3_512,
  CKM_HASH_ML_DSA_SHA512,
  CKM_HASH_ML_DSA_SHAKE128,
  CKM_HASH_ML_DSA_SHAKE256,
  CKM_HASH_SLH_DSA_SHA224,
  CKM_HASH_SLH_DSA_SHA256,
  CKM_HASH_SLH_DSA_SHA384,
  CKM_HASH_SLH_DSA_SHA3_224,
  CKM_HASH_SLH_DSA_SHA3_256,
  CKM_HASH_SLH_DSA_SHA3_384,
  CKM_HASH_SLH_DSA_SHA3_512,
  CKM_HASH_SLH_DSA_SHA512,
  CKM_HASH_SLH_DSA_SHAKE128,
  CKM_HASH_SLH_DSA_SHAKE256,
  CKM_ML_DSA,
  CKM_ML_DSA_KEY_PAIR_GEN,
  CKM_ML_KEM,
  CKM_ML_KEM_KEY_PAIR_GEN,
  CKM_PQCTODAY_FRODOKEM_KEY_PAIR_GEN,
  CKM_PQCTODAY_FRODOKEM_ENCAPSULATE,
  CKM_PQCTODAY_CLASSIC_MCELIECE_KEY_PAIR_GEN,
  CKM_PQCTODAY_CLASSIC_MCELIECE_ENCAPSULATE,
  CKP_FRODOKEM_1344_AES,
  CKP_CLASSIC_MCELIECE_6688128,
  CKM_SLH_DSA,
  CKM_SLH_DSA_KEY_PAIR_GEN,
  CKO_PRIVATE_KEY,
  CKO_PUBLIC_KEY,
  CKO_SECRET_KEY,
  CKP_SLH_DSA_SHA2_128S,
} from './constants'
import {
  allocUlong,
  buildMech,
  buildTemplate,
  checkRV,
  freeTemplate,
  readUlong,
  writeBytes,
  writeUlong,
} from './helpers'
import { dsaParamSet, kemParamSet } from './session'

export const hsm_generateMLKEMKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  variant: 512 | 768 | 1024,
  extractable = false
): { pubHandle: number; privHandle: number } => {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_KEM_KEY_PAIR_GEN, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  const ps = kemParamSet(variant)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: false },
    { type: CKA_ENCRYPT, boolVal: false },
    { type: CKA_WRAP, boolVal: false },
    { type: CKA_ENCAPSULATE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: ps },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_SIGN, boolVal: false },
    { type: CKA_DECRYPT, boolVal: false },
    { type: CKA_UNWRAP, boolVal: false },
    { type: CKA_DERIVE, boolVal: false },
    { type: CKA_DECAPSULATE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: ps },
  ])

  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 8, prvTpl.ptr, 12, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(ML-KEM)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, pubTpl, 8)
    freeTemplate(M, prvTpl, 12)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** Import an ML-KEM public key. Returns the new pubHandle. */
export const hsm_importMLKEMPublicKey = (
  M: SoftHSMModule,
  hSession: number,
  variant: 512 | 768 | 1024,
  pubKeyBytes: Uint8Array
): number => {
  const ps = kemParamSet(variant)
  const pubPtr = M._malloc(pubKeyBytes.length)
  M.HEAPU8.set(pubKeyBytes, pubPtr)

  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: false },
    { type: CKA_ENCAPSULATE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: ps },
    { type: CKA_VALUE, bytesPtr: pubPtr, bytesLen: pubKeyBytes.length },
  ])

  const pubHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_CreateObject(hSession, pubTpl.ptr, 7, pubHPtr),
      'C_CreateObject(Import ML-KEM PubKey)'
    )
    return readUlong(M, pubHPtr)
  } finally {
    freeTemplate(M, pubTpl, 7)
    M._free(pubHPtr)
    M._free(pubPtr)
  }
}

/** Import an ML-KEM private key. Returns the new privHandle.
 * Used for ACVP decapsulation KAT testing with NIST reference vectors. */
export const hsm_importMLKEMPrivateKey = (
  M: SoftHSMModule,
  hSession: number,
  variant: 512 | 768 | 1024,
  privKeyBytes: Uint8Array
): number => {
  const ps = kemParamSet(variant)
  const privPtr = M._malloc(privKeyBytes.length)
  M.HEAPU8.set(privKeyBytes, privPtr)

  const privTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_DECAPSULATE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: ps },
    { type: CKA_VALUE, bytesPtr: privPtr, bytesLen: privKeyBytes.length },
  ])

  const privHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_CreateObject(hSession, privTpl.ptr, 8, privHPtr),
      'C_CreateObject(Import ML-KEM PrivKey)'
    )
    return readUlong(M, privHPtr)
  } finally {
    freeTemplate(M, privTpl, 8)
    M._free(privHPtr)
    M._free(privPtr)
  }
}

/** C_EncapsulateKey → {ciphertextBytes, secretHandle}
 * variant is used to validate the returned ciphertext length. */
export const hsm_encapsulate = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  variant: 512 | 768 | 1024
): { ciphertextBytes: Uint8Array; secretHandle: number } => {
  const expectedCtLen: Record<number, number> = { 512: 768, 768: 1088, 1024: 1568 }
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_KEM, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  // CKA_VALUE_LEN is ck3 (mandatory in OBJECT_OP_GENERATE) for CKK_GENERIC_SECRET.
  // ML-KEM shared secret is always 32 bytes for all parameter sets (FIPS 203 §7).
  const secretTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_VALUE_LEN, ulongVal: 32 },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
  ])
  const ctLenPtr = allocUlong(M)
  const secretHPtr = allocUlong(M)

  // First call: size query (ctPtr = 0)
  checkRV(
    M._C_EncapsulateKey(hSession, mech, pubHandle, secretTpl.ptr, 4, 0, ctLenPtr, secretHPtr),
    'C_EncapsulateKey(size)'
  )
  const ctLen = readUlong(M, ctLenPtr)
  if (ctLen !== expectedCtLen[variant]) {
    throw new Error(
      `ML-KEM-${variant}: unexpected ciphertext length ${ctLen} (expected ${expectedCtLen[variant]})`
    )
  }
  const ctPtr = M._malloc(ctLen)

  // Second call: actual encapsulation
  try {
    writeUlong(M, ctLenPtr, ctLen)
    checkRV(
      M._C_EncapsulateKey(hSession, mech, pubHandle, secretTpl.ptr, 4, ctPtr, ctLenPtr, secretHPtr),
      'C_EncapsulateKey'
    )
    const ciphertextBytes = M.HEAPU8.slice(ctPtr, ctPtr + readUlong(M, ctLenPtr))
    return { ciphertextBytes, secretHandle: readUlong(M, secretHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, secretTpl, 4)
    M._free(ctLenPtr)
    M._free(ctPtr)
    M._free(secretHPtr)
  }
}

/** C_DecapsulateKey → secretHandle
 * variant is used to validate the ciphertext length before calling into WASM. */
export const hsm_decapsulate = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  ciphertextBytes: Uint8Array,
  variant: 512 | 768 | 1024
): number => {
  const expectedCtLen: Record<number, number> = { 512: 768, 768: 1088, 1024: 1568 }
  if (ciphertextBytes.length !== expectedCtLen[variant]) {
    throw new Error(
      `ML-KEM-${variant}: ciphertext length ${ciphertextBytes.length} does not match expected ${expectedCtLen[variant]}`
    )
  }
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_KEM, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  // CKA_VALUE_LEN is ck3 (mandatory in OBJECT_OP_GENERATE) for CKK_GENERIC_SECRET.
  const secretTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_VALUE_LEN, ulongVal: 32 },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
  ])

  const ctPtr = M._malloc(ciphertextBytes.length)
  M.HEAPU8.set(ciphertextBytes, ctPtr)
  const secretHPtr = allocUlong(M)

  try {
    checkRV(
      M._C_DecapsulateKey(
        hSession,
        mech,
        privHandle,
        secretTpl.ptr,
        4,
        ctPtr,
        ciphertextBytes.length,
        secretHPtr
      ),
      'C_DecapsulateKey'
    )
    return readUlong(M, secretHPtr)
  } finally {
    M._free(mech)
    freeTemplate(M, secretTpl, 4)
    M._free(ctPtr)
    M._free(secretHPtr)
  }
}

// ── Vendor PQC KEMs (BSI TR-02102-1 §2.4.1/§2.4.2) — Rust engine only ──────
// FrodoKEM and Classic McEliece are NOT implemented in the C++ engine; these
// functions throw if called against a C++ `SoftHSMModule`. Scoped to the
// single preset parameter set each showcase uses (FrodoKEM-1344-AES,
// mceliece6688128) — see rust/src/ffi.rs for the full parameter-set table.

/** C_GenerateKeyPair(CKM_PQCTODAY_FRODOKEM_KEY_PAIR_GEN, FrodoKEM-1344-AES). */
export const hsm_generateFrodoKEMKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  extractable = false
): { pubHandle: number; privHandle: number } => {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_PQCTODAY_FRODOKEM_KEY_PAIR_GEN, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_PQCTODAY_FRODOKEM },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_ENCAPSULATE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: CKP_FRODOKEM_1344_AES },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_PQCTODAY_FRODOKEM },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_DECAPSULATE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: CKP_FRODOKEM_1344_AES },
  ])

  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 5, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(FrodoKEM-1344-AES)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, pubTpl, 5)
    freeTemplate(M, prvTpl, 8)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** C_GenerateKeyPair(CKM_PQCTODAY_CLASSIC_MCELIECE_KEY_PAIR_GEN, mceliece6688128).
 * Slower than the other keygens here — a large Goppa-code public key. */
export const hsm_generateClassicMcElieceKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  extractable = false
): { pubHandle: number; privHandle: number } => {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_PQCTODAY_CLASSIC_MCELIECE_KEY_PAIR_GEN, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_PQCTODAY_CLASSIC_MCELIECE },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_ENCAPSULATE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: CKP_CLASSIC_MCELIECE_6688128 },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_PQCTODAY_CLASSIC_MCELIECE },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_DECAPSULATE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: CKP_CLASSIC_MCELIECE_6688128 },
  ])

  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 5, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(Classic-McEliece-6688128)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, pubTpl, 5)
    freeTemplate(M, prvTpl, 8)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** Shared C_EncapsulateKey query-then-call pattern for the vendor KEMs.
 * Unlike ML-KEM's `hsm_encapsulate` above, these pass NO secret template
 * (`pTemplate=NULL, ulCount=0`) — matching rust/src/ffi.rs's own
 * `round_trip` conformance test exactly; the engine derives the secret
 * object's attributes itself for these two mechanisms. Passing a
 * template here (as ML-KEM's own call requires) traps with "memory
 * access out of bounds", since this dispatch path doesn't expect one. */
const encapsulatePqcKem = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  mechanism: number
): { ciphertextBytes: Uint8Array; secretHandle: number } => {
  const mech = M._malloc(12)
  M.setValue(mech, mechanism, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  const ctLenPtr = allocUlong(M)
  const secretHPtr = allocUlong(M)

  checkRV(
    M._C_EncapsulateKey(hSession, mech, pubHandle, 0, 0, 0, ctLenPtr, secretHPtr),
    'C_EncapsulateKey(size)'
  )
  const ctLen = readUlong(M, ctLenPtr)
  const ctPtr = M._malloc(ctLen)

  try {
    writeUlong(M, ctLenPtr, ctLen)
    checkRV(
      M._C_EncapsulateKey(hSession, mech, pubHandle, 0, 0, ctPtr, ctLenPtr, secretHPtr),
      'C_EncapsulateKey'
    )
    const ciphertextBytes = M.HEAPU8.slice(ctPtr, ctPtr + readUlong(M, ctLenPtr))
    return { ciphertextBytes, secretHandle: readUlong(M, secretHPtr) }
  } finally {
    M._free(mech)
    M._free(ctLenPtr)
    M._free(ctPtr)
    M._free(secretHPtr)
  }
}

/** Shared C_DecapsulateKey call for the vendor KEMs — see `encapsulatePqcKem`
 * for why no secret template is passed. */
const decapsulatePqcKem = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  ciphertextBytes: Uint8Array,
  mechanism: number
): number => {
  const mech = M._malloc(12)
  M.setValue(mech, mechanism, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  const ctPtr = M._malloc(ciphertextBytes.length)
  M.HEAPU8.set(ciphertextBytes, ctPtr)
  const secretHPtr = allocUlong(M)

  try {
    checkRV(
      M._C_DecapsulateKey(
        hSession,
        mech,
        privHandle,
        0,
        0,
        ctPtr,
        ciphertextBytes.length,
        secretHPtr
      ),
      'C_DecapsulateKey'
    )
    return readUlong(M, secretHPtr)
  } finally {
    M._free(mech)
    M._free(ctPtr)
    M._free(secretHPtr)
  }
}

export const hsm_encapsulateFrodoKEM = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number
): { ciphertextBytes: Uint8Array; secretHandle: number } =>
  encapsulatePqcKem(M, hSession, pubHandle, CKM_PQCTODAY_FRODOKEM_ENCAPSULATE)

export const hsm_decapsulateFrodoKEM = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  ciphertextBytes: Uint8Array
): number =>
  decapsulatePqcKem(M, hSession, privHandle, ciphertextBytes, CKM_PQCTODAY_FRODOKEM_ENCAPSULATE)

export const hsm_encapsulateClassicMcEliece = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number
): { ciphertextBytes: Uint8Array; secretHandle: number } =>
  encapsulatePqcKem(M, hSession, pubHandle, CKM_PQCTODAY_CLASSIC_MCELIECE_ENCAPSULATE)

export const hsm_decapsulateClassicMcEliece = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  ciphertextBytes: Uint8Array
): number =>
  decapsulatePqcKem(
    M,
    hSession,
    privHandle,
    ciphertextBytes,
    CKM_PQCTODAY_CLASSIC_MCELIECE_ENCAPSULATE
  )

/** C_GetAttributeValue(CKA_VALUE) → Uint8Array */
export const hsm_extractKeyValue = (
  M: SoftHSMModule,
  hSession: number,
  keyHandle: number
): Uint8Array => {
  // First call: get length
  const lenTpl = buildTemplate(M, [{ type: CKA_VALUE }])
  checkRV(M._C_GetAttributeValue(hSession, keyHandle, lenTpl.ptr, 1), 'C_GetAttributeValue(len)')
  const len = readUlong(M, lenTpl.ptr + 8)
  freeTemplate(M, lenTpl, 1)

  // Second call: get value
  const valPtr = M._malloc(len)
  const valTpl = buildTemplate(M, [{ type: CKA_VALUE, bytesPtr: valPtr, bytesLen: len }])
  try {
    checkRV(M._C_GetAttributeValue(hSession, keyHandle, valTpl.ptr, 1), 'C_GetAttributeValue')
    return M.HEAPU8.slice(valPtr, valPtr + len)
  } finally {
    freeTemplate(M, valTpl, 1)
    M._free(valPtr)
  }
}

/** C_GetAttributeValue(CKA_EC_POINT) → DER-encoded EC point bytes for an EC public key. */
export const hsm_extractECPoint = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number
): Uint8Array => {
  const lenTpl = buildTemplate(M, [{ type: CKA_EC_POINT }])
  checkRV(
    M._C_GetAttributeValue(hSession, pubHandle, lenTpl.ptr, 1),
    'C_GetAttributeValue(EC_POINT,len)'
  )
  const len = readUlong(M, lenTpl.ptr + 8)
  freeTemplate(M, lenTpl, 1)

  const valPtr = M._malloc(len)
  const valTpl = buildTemplate(M, [{ type: CKA_EC_POINT, bytesPtr: valPtr, bytesLen: len }])
  try {
    checkRV(
      M._C_GetAttributeValue(hSession, pubHandle, valTpl.ptr, 1),
      'C_GetAttributeValue(EC_POINT)'
    )
    return M.HEAPU8.slice(valPtr, valPtr + len)
  } finally {
    freeTemplate(M, valTpl, 1)
    M._free(valPtr)
  }
}

/** Generate an ML-DSA key pair. Returns {pubHandle, privHandle}.
 *  @param token  true → token object (cross-session visible; required when a PKCS#11
 *                daemon like charon must locate the key via C_FindObjects in its own session).
 *  @param keyId  Optional CKA_ID bytes embedded at keygen time. Must match the
 *                SubjectKeyIdentifier extension in the corresponding X.509 cert so that
 *                strongSwan's pkcs11 plugin can locate the private key via C_FindObjects.
 */
export const hsm_generateMLDSAKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  variant: 44 | 65 | 87,
  extractable = false,
  token = false,
  keyId?: Uint8Array
): { pubHandle: number; privHandle: number } => {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_DSA_KEY_PAIR_GEN, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  const keyIdPtr = keyId && keyId.length ? writeBytes(M, keyId) : 0

  const ps = dsaParamSet(variant)
  const pubDefs = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
    { type: CKA_TOKEN, boolVal: token },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: false },
    { type: CKA_WRAP, boolVal: false },
    { type: CKA_PARAMETER_SET, ulongVal: ps },
    ...(keyIdPtr && keyId ? [{ type: CKA_ID, bytesPtr: keyIdPtr, bytesLen: keyId.length }] : []),
  ]
  // Per spec §6.67.4: CKA_PARAMETER_SET goes in the public key template only.
  // The mechanism infers the parameter set for the private key from the public key template.
  const prvDefs = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
    { type: CKA_TOKEN, boolVal: token },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_DECRYPT, boolVal: false },
    { type: CKA_UNWRAP, boolVal: false },
    { type: CKA_DERIVE, boolVal: false },
    ...(keyIdPtr && keyId ? [{ type: CKA_ID, bytesPtr: keyIdPtr, bytesLen: keyId.length }] : []),
  ]
  const pubTpl = buildTemplate(M, pubDefs)
  const prvTpl = buildTemplate(M, prvDefs)

  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(
        hSession,
        mech,
        pubTpl.ptr,
        pubDefs.length,
        prvTpl.ptr,
        prvDefs.length,
        pubHPtr,
        prvHPtr
      ),
      'C_GenerateKeyPair(ML-DSA)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, pubTpl, pubDefs.length)
    freeTemplate(M, prvTpl, prvDefs.length)
    M._free(pubHPtr)
    M._free(prvHPtr)
    if (keyIdPtr) M._free(keyIdPtr)
  }
}

/** Import an ML-DSA public key. Returns the new pubHandle. */
export const hsm_importMLDSAPublicKey = (
  M: SoftHSMModule,
  hSession: number,
  variant: 44 | 65 | 87,
  pubKeyBytes: Uint8Array
): number => {
  const ps = dsaParamSet(variant)
  const pubPtr = M._malloc(pubKeyBytes.length)
  M.HEAPU8.set(pubKeyBytes, pubPtr)

  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: ps },
    { type: CKA_VALUE, bytesPtr: pubPtr, bytesLen: pubKeyBytes.length },
  ])

  const pubHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_CreateObject(hSession, pubTpl.ptr, 6, pubHPtr),
      'C_CreateObject(Import ML-DSA PubKey)'
    )
    return readUlong(M, pubHPtr)
  } finally {
    freeTemplate(M, pubTpl, 6)
    M._free(pubHPtr)
    M._free(pubPtr)
  }
}

/**
 * ML-DSA sign/verify options (PKCS#11 v3.2 context string + hedging + pre-hash).
 * All fields optional — defaults to pure ML-DSA with hedge-preferred, no context.
 */
export type MLDSAPreHash =
  | 'sha224'
  | 'sha256'
  | 'sha384'
  | 'sha512'
  | 'sha3-224'
  | 'sha3-256'
  | 'sha3-384'
  | 'sha3-512'
  | 'shake128'
  | 'shake256'

export interface MLDSASignOptions {
  hedging?: 'preferred' | 'required' | 'deterministic'
  context?: Uint8Array // 0-255 bytes (FIPS 204 max context length)
  preHash?: MLDSAPreHash // all PKCS#11 v3.2 CKM_HASH_ML_DSA_* variants
}

// Map preHash option to CKM mechanism constant (PKCS#11 v3.2 §6.x, FIPS 204 HashML-DSA)
// Lazy functions, not top-level literals: the production build wraps this
// module's own softhsm-constants import in vite-plugin-top-level-await, so a
// top-level literal here would capture every CKM_HASH_*_DSA_* mechanism as
// `undefined` (assigned only once that chunk's own top-level await resolves,
// which happens AFTER this module's top-level runs). Dev/vitest don't use
// that plugin, so this bug is invisible outside a real production build. See
// pqctoday-priv/design/design_handoff_kmip_pkcs11_playground/GAPS-CLOSEOUT-PLAN-2026-09-02.md §2.1.
const prehashMech = (): Record<string, number> => ({
  sha224: CKM_HASH_ML_DSA_SHA224,
  sha256: CKM_HASH_ML_DSA_SHA256,
  sha384: CKM_HASH_ML_DSA_SHA384,
  sha512: CKM_HASH_ML_DSA_SHA512,
  'sha3-224': CKM_HASH_ML_DSA_SHA3_224,
  'sha3-256': CKM_HASH_ML_DSA_SHA3_256,
  'sha3-384': CKM_HASH_ML_DSA_SHA3_384,
  'sha3-512': CKM_HASH_ML_DSA_SHA3_512,
  shake128: CKM_HASH_ML_DSA_SHAKE128,
  shake256: CKM_HASH_ML_DSA_SHAKE256,
})

export type SLHDSAPreHash =
  | 'sha224'
  | 'sha256'
  | 'sha384'
  | 'sha512'
  | 'sha3-224'
  | 'sha3-256'
  | 'sha3-384'
  | 'sha3-512'
  | 'shake128'
  | 'shake256'

export interface SLHDSASignOptions {
  preHash?: SLHDSAPreHash // all PKCS#11 v3.2 CKM_HASH_SLH_DSA_* variants
}

// Map preHash option to CKM mechanism constant (PKCS#11 v3.2 §6.x, FIPS 205 HashSLH-DSA).
// Lazy for the same reason as prehashMech() above.
const slhDsaPrehashMech = (): Record<string, number> => ({
  sha224: CKM_HASH_SLH_DSA_SHA224,
  sha256: CKM_HASH_SLH_DSA_SHA256,
  sha384: CKM_HASH_SLH_DSA_SHA384,
  sha512: CKM_HASH_SLH_DSA_SHA512,
  'sha3-224': CKM_HASH_SLH_DSA_SHA3_224,
  'sha3-256': CKM_HASH_SLH_DSA_SHA3_256,
  'sha3-384': CKM_HASH_SLH_DSA_SHA3_384,
  'sha3-512': CKM_HASH_SLH_DSA_SHA3_512,
  shake128: CKM_HASH_SLH_DSA_SHAKE128,
  shake256: CKM_HASH_SLH_DSA_SHAKE256,
})

/**
 * Allocate CK_SIGN_ADDITIONAL_CONTEXT in WASM memory.
 * Layout (WASM32, 12 bytes):
 *   offset 0: CK_HEDGE_TYPE hedgeVariant  (4 bytes)
 *   offset 4: CK_BYTE_PTR  pContext       (4 bytes pointer)
 *   offset 8: CK_ULONG     ulContextLen   (4 bytes)
 * Returns { paramPtr, paramLen, allocPtrs } — caller must free allocPtrs.
 */
export const buildSignContext = (
  M: SoftHSMModule,
  opts: MLDSASignOptions
): { paramPtr: number; paramLen: number; allocPtrs: number[] } => {
  const allocPtrs: number[] = []
  const paramPtr = M._malloc(12)
  allocPtrs.push(paramPtr)

  // Hedge variant
  const hedge =
    opts.hedging === 'required'
      ? CKH_HEDGE_REQUIRED
      : opts.hedging === 'deterministic'
        ? CKH_DETERMINISTIC_REQUIRED
        : CKH_HEDGE_PREFERRED
  M.setValue(paramPtr, hedge, 'i32')

  // Context string
  if (opts.context && opts.context.length > 0) {
    const ctxPtr = M._malloc(opts.context.length)
    M.HEAPU8.set(opts.context, ctxPtr)
    allocPtrs.push(ctxPtr)
    M.setValue(paramPtr + 4, ctxPtr, 'i32')
    M.setValue(paramPtr + 8, opts.context.length, 'i32')
  } else {
    M.setValue(paramPtr + 4, 0, 'i32') // pContext = NULL
    M.setValue(paramPtr + 8, 0, 'i32') // ulContextLen = 0
  }

  return { paramPtr, paramLen: 12, allocPtrs }
}

/** C_MessageSignInit(ML-DSA) + C_SignMessage + C_MessageSignFinal → sigBytes (PKCS#11 v3.2) */
export const hsm_sign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string,
  opts?: MLDSASignOptions
): Uint8Array => {
  // Determine mechanism: pure ML-DSA or pre-hash variant
  const mechType = opts?.preHash ? (prehashMech()[opts.preHash] ?? CKM_ML_DSA) : CKM_ML_DSA

  // Build CK_SIGN_ADDITIONAL_CONTEXT if hedging or context specified
  const hasParams = opts && (opts.hedging || (opts.context && opts.context.length > 0))
  const ctxAlloc = hasParams ? buildSignContext(M, opts) : null

  const mech = M._malloc(12)
  M.setValue(mech, mechType, 'i32')
  M.setValue(mech + 4, ctxAlloc ? ctxAlloc.paramPtr : 0, 'i32') // pParameter
  M.setValue(mech + 8, ctxAlloc ? ctxAlloc.paramLen : 0, 'i32') // ulParameterLen

  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = M._malloc(msgBytes.length)
  M.HEAPU8.set(msgBytes, msgPtr)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0

  // C_MessageSignInit opens a multi-message signing context — MUST be closed with C_MessageSignFinal
  checkRV(M._C_MessageSignInit(hSession, mech, privHandle), 'C_MessageSignInit')
  try {
    // First call: size query (pSignature = 0)
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, msgBytes.length, 0, sigLenPtr),
      'C_SignMessage(len)'
    )
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, msgBytes.length, sigPtr, sigLenPtr),
      'C_SignMessage'
    )
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._C_MessageSignFinal(hSession) // close multi-message context; ignore RV in cleanup
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
    if (ctxAlloc) ctxAlloc.allocPtrs.forEach((p) => M._free(p))
  }
}

/**
 * ML-DSA sign raw bytes (for X.509 TBS certificate signing).
 * Same as hsm_sign but accepts Uint8Array directly instead of string.
 *
 * `opts.context` carries the PKCS#11 v3.2 CK_SIGN_ADDITIONAL_CONTEXT context
 * string (FIPS 204 Algorithm 2 `ctx`). Composite ML-DSA requires it: the
 * signature label MUST be passed verbatim as ctx, or draft-19 verifiers reject
 * the signature — see certBuilder.ts buildCompositeCertDraft19.
 */
export const hsm_signBytesMLDSA = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  data: Uint8Array,
  opts?: MLDSASignOptions
): Uint8Array => {
  const mechType = opts?.preHash ? (prehashMech()[opts.preHash] ?? CKM_ML_DSA) : CKM_ML_DSA

  const hasParams = opts && (opts.hedging || (opts.context && opts.context.length > 0))
  const ctxAlloc = hasParams ? buildSignContext(M, opts) : null

  const mech = M._malloc(12)
  M.setValue(mech, mechType, 'i32')
  M.setValue(mech + 4, ctxAlloc ? ctxAlloc.paramPtr : 0, 'i32') // pParameter
  M.setValue(mech + 8, ctxAlloc ? ctxAlloc.paramLen : 0, 'i32') // ulParameterLen

  const msgPtr = writeBytes(M, data)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0

  checkRV(M._C_MessageSignInit(hSession, mech, privHandle), 'C_MessageSignInit(ML-DSA,bytes)')
  try {
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, data.length, 0, sigLenPtr),
      'C_SignMessage(ML-DSA,len)'
    )
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, data.length, sigPtr, sigLenPtr),
      'C_SignMessage(ML-DSA,bytes)'
    )
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._C_MessageSignFinal(hSession)
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
    if (ctxAlloc) ctxAlloc.allocPtrs.forEach((p) => M._free(p))
  }
}

/**
 * SLH-DSA sign raw bytes (for X.509 TBS certificate signing).
 * Same as hsm_slhdsaSign but accepts Uint8Array directly instead of string.
 */
export const hsm_signBytesSLHDSA = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  data: Uint8Array
): Uint8Array => {
  const mech = buildMech(M, CKM_SLH_DSA)
  const msgPtr = writeBytes(M, data)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0

  checkRV(M._C_MessageSignInit(hSession, mech, privHandle), 'C_MessageSignInit(SLH-DSA,bytes)')
  try {
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, data.length, 0, sigLenPtr),
      'C_SignMessage(SLH-DSA,len)'
    )
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, data.length, sigPtr, sigLenPtr),
      'C_SignMessage(SLH-DSA,bytes)'
    )
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._C_MessageSignFinal(hSession)
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

/**
 * ECDSA sign raw bytes (for X.509 TBS certificate signing).
 * Same as hsm_ecdsaSign but accepts Uint8Array directly instead of string.
 */
export const hsm_signBytesECDSA = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  data: Uint8Array,
  mechType: number = CKM_ECDSA_SHA256
): Uint8Array => {
  const mech = buildMech(M, mechType)
  const msgPtr = writeBytes(M, data)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(ECDSA,bytes)')
    checkRV(M._C_Sign(hSession, msgPtr, data.length, 0, sigLenPtr), 'C_Sign(ECDSA,bytes,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, data.length, sigPtr, sigLenPtr), 'C_Sign(ECDSA,bytes)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

/** C_MessageVerifyInit(ML-DSA) + C_VerifyMessage + C_MessageVerifyFinal → boolean (PKCS#11 v3.2) */
export const hsm_verify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string,
  sigBytes: Uint8Array,
  opts?: MLDSASignOptions
): boolean => {
  // Determine mechanism: must match the mechanism used during signing
  const mechType = opts?.preHash ? (prehashMech()[opts.preHash] ?? CKM_ML_DSA) : CKM_ML_DSA

  const hasParams = opts && (opts.hedging || (opts.context && opts.context.length > 0))
  const ctxAlloc = hasParams ? buildSignContext(M, opts) : null

  const mech = M._malloc(12)
  M.setValue(mech, mechType, 'i32')
  M.setValue(mech + 4, ctxAlloc ? ctxAlloc.paramPtr : 0, 'i32')
  M.setValue(mech + 8, ctxAlloc ? ctxAlloc.paramLen : 0, 'i32')

  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = M._malloc(msgBytes.length)
  M.HEAPU8.set(msgBytes, msgPtr)
  const sigPtr = M._malloc(sigBytes.length)
  M.HEAPU8.set(sigBytes, sigPtr)

  // C_MessageVerifyInit opens a multi-message verify context — MUST be closed with C_MessageVerifyFinal
  checkRV(M._C_MessageVerifyInit(hSession, mech, pubHandle), 'C_MessageVerifyInit')
  try {
    const rv =
      M._C_VerifyMessage(hSession, 0, 0, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._C_MessageVerifyFinal(hSession) // close multi-message context; ignore RV in cleanup
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
    if (ctxAlloc) ctxAlloc.allocPtrs.forEach((p) => M._free(p))
  }
}

/** Verify a binary message (Uint8Array) against a signature — for ACVP KAT testing. */
export const hsm_verifyBytes = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  msgBytes: Uint8Array,
  sigBytes: Uint8Array
): boolean => {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_DSA, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')

  const msgPtr = M._malloc(msgBytes.length)
  M.HEAPU8.set(msgBytes, msgPtr)
  const sigPtr = M._malloc(sigBytes.length)
  M.HEAPU8.set(sigBytes, sigPtr)

  checkRV(M._C_MessageVerifyInit(hSession, mech, pubHandle), 'C_MessageVerifyInit')
  try {
    const rv =
      M._C_VerifyMessage(hSession, 0, 0, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._C_MessageVerifyFinal(hSession)
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

/** C_CloseSession + C_Finalize */
export const hsm_finalize = (M: SoftHSMModule, hSession: number): void => {
  try {
    M._C_CloseSession(hSession)
  } catch {
    // ignore
  }
  try {
    M._C_Finalize(0)
  } catch {
    // ignore
  }
}

/** CK_SESSION_INFO fields returned by C_GetSessionInfo. */
export interface SessionInfo {
  slotID: number
  state: number
  flags: number
  ulDeviceError: number
}

/** CK_TOKEN_INFO fields returned by C_GetTokenInfo. */
export interface TokenInfo {
  label: string
  manufacturerID: string
  model: string
  serialNumber: string
  flags: number
  ulMaxPinLen: number
  ulMinPinLen: number
  hardwareVersion: { major: number; minor: number }
  firmwareVersion: { major: number; minor: number }
}

/** Read CK_SESSION_INFO via C_GetSessionInfo. */
export const hsm_getSessionInfo = (M: SoftHSMModule, hSession: number): SessionInfo => {
  // CK_SESSION_INFO: slotID(4) + state(4) + flags(4) + ulDeviceError(4) = 16 bytes
  const infoPtr = M._malloc(16)
  try {
    checkRV(M._C_GetSessionInfo(hSession, infoPtr), 'C_GetSessionInfo')
    return {
      slotID: readUlong(M, infoPtr),
      state: readUlong(M, infoPtr + 4),
      flags: readUlong(M, infoPtr + 8),
      ulDeviceError: readUlong(M, infoPtr + 12),
    }
  } finally {
    M._free(infoPtr)
  }
}

/** Read CK_TOKEN_INFO via C_GetTokenInfo. */
export const hsm_getTokenInfo = (M: SoftHSMModule, slotId: number): TokenInfo => {
  // CK_TOKEN_INFO layout (PKCS#11 v3.2):
  //   label[32] + manufacturerID[32] + model[16] + serialNumber[16] = 96 bytes of char arrays
  //   flags(4) + ulMaxSessionCount(4) + ulSessionCount(4) + ulMaxRwSessionCount(4)
  //   + ulRwSessionCount(4) + ulMaxPinLen(4) + ulMinPinLen(4)
  //   + ulTotalPublicMemory(4) + ulFreePublicMemory(4)
  //   + ulTotalPrivateMemory(4) + ulFreePrivateMemory(4) = 44 bytes at offset 96
  //   hardwareVersion(2) + firmwareVersion(2) = 4 bytes at offset 140
  //   utcTime[16] = 16 bytes at offset 144
  //   Total = 160 bytes
  const TOKEN_INFO_SIZE = 160
  const infoPtr = M._malloc(TOKEN_INFO_SIZE)
  try {
    checkRV(M._C_GetTokenInfo(slotId, infoPtr), 'C_GetTokenInfo')
    const readFixedStr = (offset: number, len: number): string => {
      const bytes = M.HEAPU8.subarray(infoPtr + offset, infoPtr + offset + len)
      return new TextDecoder().decode(bytes).replace(/\s+$/, '')
    }
    return {
      label: readFixedStr(0, 32),
      manufacturerID: readFixedStr(32, 32),
      model: readFixedStr(64, 16),
      serialNumber: readFixedStr(80, 16),
      flags: readUlong(M, infoPtr + 96),
      ulMaxPinLen: readUlong(M, infoPtr + 116),
      ulMinPinLen: readUlong(M, infoPtr + 120),
      hardwareVersion: { major: M.HEAPU8[infoPtr + 140], minor: M.HEAPU8[infoPtr + 141] },
      firmwareVersion: { major: M.HEAPU8[infoPtr + 142], minor: M.HEAPU8[infoPtr + 143] },
    }
  } finally {
    M._free(infoPtr)
  }
}

/** Destroy a PKCS#11 object via C_DestroyObject. */
// ── SLH-DSA helpers ───────────────────────────────────────────────────────────

/**
 * Generate an SLH-DSA key pair.
 * paramSet: one of the CKP_SLH_DSA_* constants (defaults to SHA2-128s).
 * extractable: if true, CKA_EXTRACTABLE=true + CKA_SENSITIVE=false (key value readable via C_GetAttributeValue).
 *              if false (default), CKA_EXTRACTABLE=false + CKA_SENSITIVE=true (production-safe).
 */
export const hsm_generateSLHDSAKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  paramSet: number = CKP_SLH_DSA_SHA2_128S,
  extractable = false
): { pubHandle: number; privHandle: number } => {
  const mech = buildMech(M, CKM_SLH_DSA_KEY_PAIR_GEN)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_SLH_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_ENCRYPT, boolVal: false },
    { type: CKA_WRAP, boolVal: false },
    { type: CKA_PARAMETER_SET, ulongVal: paramSet },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_SLH_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_DECRYPT, boolVal: false },
    { type: CKA_UNWRAP, boolVal: false },
    { type: CKA_DERIVE, boolVal: false },
    { type: CKA_PARAMETER_SET, ulongVal: paramSet },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 7, prvTpl.ptr, 11, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(SLH-DSA)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    freeTemplate(M, pubTpl, 7)
    freeTemplate(M, prvTpl, 11)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** Import an SLH-DSA public key. Returns the new pubHandle. */
export const hsm_importSLHDSAPublicKey = (
  M: SoftHSMModule,
  hSession: number,
  paramSet: number,
  pubKeyBytes: Uint8Array
): number => {
  const pubPtr = M._malloc(pubKeyBytes.length)
  M.HEAPU8.set(pubKeyBytes, pubPtr)

  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_SLH_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: paramSet },
    { type: CKA_VALUE, bytesPtr: pubPtr, bytesLen: pubKeyBytes.length },
  ])

  const pubHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_CreateObject(hSession, pubTpl.ptr, 6, pubHPtr),
      'C_CreateObject(Import SLH-DSA PubKey)'
    )
    return readUlong(M, pubHPtr)
  } finally {
    freeTemplate(M, pubTpl, 6)
    M._free(pubHPtr)
    M._free(pubPtr)
  }
}

/**
 * SLH-DSA sign via C_MessageSignInit + C_SignMessage + C_MessageSignFinal (PKCS#11 v3.2).
 * Supports both pure SLH-DSA (CKM_SLH_DSA) and pre-hash variants (CKM_HASH_SLH_DSA_*).
 * opts.preHash selects a fixed-hash variant per FIPS 205 HashSLH-DSA; omit for pure mode.
 */
export const hsm_slhdsaSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string,
  opts?: SLHDSASignOptions
): Uint8Array => {
  const mechType = opts?.preHash ? (slhDsaPrehashMech()[opts.preHash] ?? CKM_SLH_DSA) : CKM_SLH_DSA
  const mech = buildMech(M, mechType)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  checkRV(M._C_MessageSignInit(hSession, mech, privHandle), 'C_MessageSignInit(SLH-DSA)')
  try {
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, msgBytes.length, 0, sigLenPtr),
      'C_SignMessage(SLH-DSA,len)'
    )
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(
      M._C_SignMessage(hSession, 0, 0, msgPtr, msgBytes.length, sigPtr, sigLenPtr),
      'C_SignMessage(SLH-DSA)'
    )
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._C_MessageSignFinal(hSession) // close multi-message context; ignore RV in cleanup
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

/**
 * SLH-DSA verify via C_MessageVerifyInit + C_VerifyMessage + C_MessageVerifyFinal (PKCS#11 v3.2).
 * opts.preHash must match the mechanism used during signing.
 */
export const hsm_slhdsaVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string,
  sigBytes: Uint8Array,
  opts?: SLHDSASignOptions
): boolean => {
  const mechType = opts?.preHash ? (slhDsaPrehashMech()[opts.preHash] ?? CKM_SLH_DSA) : CKM_SLH_DSA
  const mech = buildMech(M, mechType)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  checkRV(M._C_MessageVerifyInit(hSession, mech, pubHandle), 'C_MessageVerifyInit(SLH-DSA)')
  try {
    const rv =
      M._C_VerifyMessage(hSession, 0, 0, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._C_MessageVerifyFinal(hSession) // close multi-message context; ignore RV in cleanup
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

/**
 * Stateful hash-based signatures (HSS/LMS, XMSS, XMSS-MT).
 *
 * These used to be implemented here as well as in `./stateful` and in
 * `../softhsm.ts` — three forks of one feature, which is how the copy here came
 * to pass the XMSS parameter set through pMechanism->pParameter (where §6.66.6
 * says nothing travels) and to set CKA_SENSITIVE=false / CKA_EXTRACTABLE=true
 * on a key whose whole point is that its one-time state must not leave the
 * token. Both are hard errors on the conformant engines.
 *
 * `./stateful` is now the single implementation. This re-export exists so the
 * StatefulSignatures workshops keep importing from the path they always have.
 */
export {
  hsm_generateStatefulKeyPair,
  hsm_statefulSignBytes,
  hsm_statefulVerifyBytes,
  hsm_getKeysRemaining,
} from './stateful'
