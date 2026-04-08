import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  CKA_CLASS,
  CKA_DECRYPT,
  CKA_DERIVE,
  CKA_EC_PARAMS,
  CKA_EC_POINT,
  CKA_ENCRYPT,
  CKA_EXTRACTABLE,
  CKA_KEY_TYPE,
  CKA_MODULUS_BITS,
  CKA_PRIVATE,
  CKA_PUBLIC_EXPONENT,
  CKA_SENSITIVE,
  CKA_SIGN,
  CKA_TOKEN,
  CKA_VALUE,
  CKA_VERIFY,
  CKD_NULL,
  CKK_EC,
  CKK_EC_EDWARDS,
  CKK_RSA,
  CKM_ECDH1_COFACTOR_DERIVE,
  CKM_ECDH1_DERIVE,
  CKM_ECDSA_SHA256,
  CKM_EC_EDWARDS_KEY_PAIR_GEN,
  CKM_EC_KEY_PAIR_GEN,
  CKM_EDDSA,
  CKM_RSA_PKCS_KEY_PAIR_GEN,
  CKM_RSA_PKCS_OAEP,
  CKM_SHA256_RSA_PKCS,
  CKM_SHA256_RSA_PKCS_PSS,
  CKM_SHA384_RSA_PKCS_PSS,
  CKM_SHA512_RSA_PKCS_PSS,
  CKO_PRIVATE_KEY,
  CKO_PUBLIC_KEY,
  EC_OID_ED25519,
  EC_OID_ED448,
  EC_OID_P256,
  EC_OID_P384,
  EC_OID_P521,
  EC_OID_X25519,
  CKK_EC_MONTGOMERY,
  CKM_EC_MONTGOMERY_KEY_PAIR_GEN,
  EC_OID_SECP256K1,
  CKM_BIP32_MASTER_DERIVE,
  CKM_BIP32_CHILD_DERIVE,
} from './constants'
import {
  type AttrDef,
  type DerivedKeyProfile,
  allocUlong,
  buildBIP32ChildDeriveParams,
  buildDerivedKeyTemplate,
  buildECDH1DeriveParams,
  buildEdDSAParams,
  buildMech,
  buildOAEPParams,
  buildPSSParams,
  buildTemplate,
  checkRV,
  freeTemplate,
  readUlong,
  writeBytes,
  writeUlong,
} from './helpers'

// ── RSA helpers ───────────────────────────────────────────────────────────────

/** Generate an RSA key pair via CKM_RSA_PKCS_KEY_PAIR_GEN. */
export const hsm_generateRSAKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  keyBits: 1024 | 2048 | 3072 | 4096,
  extractable: boolean,
  keyUsage: 'sign' | 'decrypt'
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
    { type: CKA_ENCRYPT, boolVal: keyUsage === 'decrypt' },
    { type: CKA_VERIFY, boolVal: keyUsage === 'sign' },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_DECRYPT, boolVal: keyUsage === 'decrypt' },
    { type: CKA_SIGN, boolVal: keyUsage === 'sign' },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 7, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(RSA)'
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

/** RSA sign via C_SignInit + C_Sign (PKCS#1 v1.5 or PSS). */
export const hsm_rsaSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string,
  mechType: number = CKM_SHA256_RSA_PKCS
): Uint8Array => {
  const isPSS =
    mechType === CKM_SHA256_RSA_PKCS_PSS ||
    mechType === CKM_SHA384_RSA_PKCS_PSS ||
    mechType === CKM_SHA512_RSA_PKCS_PSS
  let pssParams: { ptr: number; len: number } | null = null
  if (isPSS) pssParams = buildPSSParams(M, mechType)
  const mech = buildMech(M, mechType, pssParams?.ptr ?? 0, pssParams?.len ?? 0)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(RSA)')
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(RSA,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign(RSA)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
    if (pssParams) M._free(pssParams.ptr)
  }
}

/** RSA verify via C_VerifyInit + C_Verify. Returns true if valid. */
export const hsm_rsaVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string,
  sigBytes: Uint8Array,
  mechType: number = CKM_SHA256_RSA_PKCS
): boolean => {
  const isPSS =
    mechType === CKM_SHA256_RSA_PKCS_PSS ||
    mechType === CKM_SHA384_RSA_PKCS_PSS ||
    mechType === CKM_SHA512_RSA_PKCS_PSS
  let pssParams: { ptr: number; len: number } | null = null
  if (isPSS) pssParams = buildPSSParams(M, mechType)
  const mech = buildMech(M, mechType, pssParams?.ptr ?? 0, pssParams?.len ?? 0)
  const msgBytes = new TextEncoder().encode(message)
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit(RSA)')
    const rv = M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
    if (pssParams) M._free(pssParams.ptr)
  }
}

/** RSA-OAEP encrypt via C_EncryptInit + C_Encrypt. */
export const hsm_rsaEncrypt = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  plaintext: string,
  hashAlgo: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): Uint8Array => {
  const oaepParams = buildOAEPParams(M, hashAlgo)
  const mech = buildMech(M, CKM_RSA_PKCS_OAEP, oaepParams.ptr, oaepParams.len)
  const plain = new TextEncoder().encode(plaintext)
  const plainPtr = writeBytes(M, plain)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_EncryptInit(hSession, mech, pubHandle), 'C_EncryptInit(RSA-OAEP)')
    checkRV(M._C_Encrypt(hSession, plainPtr, plain.length, 0, outLenPtr), 'C_Encrypt(RSA-OAEP,len)')
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(
      M._C_Encrypt(hSession, plainPtr, plain.length, outPtr, outLenPtr),
      'C_Encrypt(RSA-OAEP)'
    )
    return M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr))
  } finally {
    M._free(mech)
    M._free(oaepParams.ptr)
    M._free(plainPtr)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
  }
}

/** RSA-OAEP decrypt via C_DecryptInit + C_Decrypt. */
export const hsm_rsaDecrypt = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  ciphertext: Uint8Array,
  hashAlgo: 'sha256' | 'sha384' | 'sha512' = 'sha256'
): Uint8Array => {
  const oaepParams = buildOAEPParams(M, hashAlgo)
  const mech = buildMech(M, CKM_RSA_PKCS_OAEP, oaepParams.ptr, oaepParams.len)
  const ctPtr = writeBytes(M, ciphertext)
  const outLenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(M._C_DecryptInit(hSession, mech, privHandle), 'C_DecryptInit(RSA-OAEP)')
    checkRV(
      M._C_Decrypt(hSession, ctPtr, ciphertext.length, 0, outLenPtr),
      'C_Decrypt(RSA-OAEP,len)'
    )
    const outLen = readUlong(M, outLenPtr)
    outPtr = M._malloc(outLen)
    writeUlong(M, outLenPtr, outLen)
    checkRV(
      M._C_Decrypt(hSession, ctPtr, ciphertext.length, outPtr, outLenPtr),
      'C_Decrypt(RSA-OAEP)'
    )
    return M.HEAPU8.slice(outPtr, outPtr + readUlong(M, outLenPtr))
  } finally {
    M._free(mech)
    M._free(oaepParams.ptr)
    M._free(ctPtr)
    M._free(outLenPtr)
    if (outPtr) M._free(outPtr)
  }
}

// ── EC / ECDSA / ECDH helpers ─────────────────────────────────────────────────

export const ecCurveOID = (curve: 'P-256' | 'P-384' | 'P-521' | 'secp256k1'): Uint8Array => {
  if (curve === 'secp256k1') return EC_OID_SECP256K1
  if (curve === 'P-384') return EC_OID_P384
  if (curve === 'P-521') return EC_OID_P521
  return EC_OID_P256
}

/** Generate an EC key pair (P-256, P-384, P-521, or secp256k1) for ECDSA and ECDH. */
export const hsm_generateECKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  curve: 'P-256' | 'P-384' | 'P-521' | 'secp256k1',
  extractable: boolean,
  keyUsage: 'sign' | 'derive'
): { pubHandle: number; privHandle: number } => {
  const mech = buildMech(M, CKM_EC_KEY_PAIR_GEN)
  const oid = ecCurveOID(curve)
  const oidPtr = writeBytes(M, oid)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_EC_PARAMS, bytesPtr: oidPtr, bytesLen: oid.length },
    { type: CKA_VERIFY, boolVal: keyUsage === 'sign' },
    { type: CKA_ENCRYPT, boolVal: false },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_SIGN, boolVal: keyUsage === 'sign' },
    { type: CKA_DERIVE, boolVal: keyUsage === 'derive' },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 6, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(EC)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    M._free(oidPtr)
    freeTemplate(M, pubTpl, 6)
    freeTemplate(M, prvTpl, 8)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** ECDSA sign via C_SignInit + C_Sign. mechType defaults to CKM_ECDSA_SHA256. */
export const hsm_ecdsaSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string | Uint8Array,
  mechType: number = CKM_ECDSA_SHA256
): Uint8Array => {
  const mech = buildMech(M, mechType)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(ECDSA)')
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(ECDSA,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign(ECDSA)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

/** ECDSA verify via C_VerifyInit + C_Verify. Returns true if valid. */
export const hsm_ecdsaVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string | Uint8Array,
  sigBytes: Uint8Array,
  mechType: number = CKM_ECDSA_SHA256
): boolean => {
  const mech = buildMech(M, mechType)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit(ECDSA)')
    const rv = M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

/**
 * ECDH1 key derivation via C_DeriveKey (PKCS#11 v3.2 §2.3.5).
 * peerPubBytes: DER-encoded EC point from peer's CKA_EC_POINT attribute.
 * kdf: CKD_NULL (raw Z, default) or CKD_SHA256_KDF etc. for ANSI X9.63 KDF.
 * sharedData: optional SharedInfo for X9.63 KDF.
 * derivedKeyProfile: PKCS#11 v3.2 attribute profile for the derived key object.
 *   Pass { keyLen: 32, derive: true } when the result will be used as HKDF base key.
 *   Pass { keyLen: 32, encrypt: true, decrypt: true } for a direct-use AES key.
 *   Defaults to { keyLen: 32, extractable: true } (generic secret, extract-only).
 * Returns handle to derived key object.
 */
export const hsm_ecdhDerive = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  peerPubBytes: Uint8Array,
  kdf: number = CKD_NULL,
  sharedData?: Uint8Array,
  derivedKeyProfile: DerivedKeyProfile = { keyLen: 32, extractable: true }
): number => {
  const dp = buildECDH1DeriveParams(M, peerPubBytes, kdf, sharedData)
  const mech = buildMech(M, CKM_ECDH1_DERIVE, dp.ptr, dp.len)
  const { tpl: derivedTpl, attrCount } = buildDerivedKeyTemplate(M, derivedKeyProfile)
  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, privHandle, derivedTpl.ptr, attrCount, derivedHPtr),
      'C_DeriveKey(ECDH1)'
    )
    return readUlong(M, derivedHPtr)
  } finally {
    M._free(mech)
    dp.allocPtrs.forEach((p) => M._free(p))
    freeTemplate(M, derivedTpl, attrCount)
    M._free(derivedHPtr)
  }
}

/**
 * ECDH1 cofactor key derivation via C_DeriveKey(CKM_ECDH1_COFACTOR_DERIVE) (PKCS#11 v3.2 §2.3.2).
 * Same parameters as hsm_ecdhDerive() but uses cofactor multiplication.
 * For NIST P-curves (cofactor = 1) the result is identical to standard ECDH.
 */
export const hsm_ecdhCofactorDerive = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  peerPubBytes: Uint8Array,
  kdf: number = CKD_NULL,
  sharedData?: Uint8Array,
  derivedKeyProfile: DerivedKeyProfile = { keyLen: 32, extractable: true }
): number => {
  const dp = buildECDH1DeriveParams(M, peerPubBytes, kdf, sharedData)
  const mech = buildMech(M, CKM_ECDH1_COFACTOR_DERIVE, dp.ptr, dp.len)
  const { tpl: derivedTpl, attrCount } = buildDerivedKeyTemplate(M, derivedKeyProfile)
  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, privHandle, derivedTpl.ptr, attrCount, derivedHPtr),
      'C_DeriveKey(ECDH1_COFACTOR)'
    )
    return readUlong(M, derivedHPtr)
  } finally {
    M._free(mech)
    dp.allocPtrs.forEach((p) => M._free(p))
    freeTemplate(M, derivedTpl, attrCount)
    M._free(derivedHPtr)
  }
}

/**
 * BIP32/SLIP10 Master Node Derivation.
 * Returns handle to the newly derived CKO_PRIVATE_KEY.
 */
export const hsm_bip32MasterDerive = (
  M: SoftHSMModule,
  hSession: number,
  hSeedKey: number,
  curve: 'P-256' | 'ed25519' | 'secp256k1',
  extractable = false
): number => {
  const mech = buildMech(M, CKM_BIP32_MASTER_DERIVE)
  const actualOid = curve === 'ed25519' ? EC_OID_ED25519 : ecCurveOID(curve)
  const oidPtr = writeBytes(M, actualOid)

  const derivedProfile: DerivedKeyProfile = {
    keyType: curve === 'ed25519' ? CKK_EC_EDWARDS : CKK_EC,
    keyLen: 32,
    extractable,
    derive: true,
    sign: true,
  }

  const { tpl: derivedTpl, attrCount } = buildDerivedKeyTemplate(M, derivedProfile)

  // Re-build template manually with EC_PARAMS. Actually it is simpler:
  freeTemplate(M, derivedTpl, attrCount)
  const newTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: derivedProfile.keyType },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_DERIVE, boolVal: true },
    { type: CKA_EC_PARAMS, bytesPtr: oidPtr, bytesLen: actualOid.length },
  ])

  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, hSeedKey, newTpl.ptr, 8, derivedHPtr),
      'C_DeriveKey(BIP32_MASTER_DERIVE)'
    )
    return readUlong(M, derivedHPtr)
  } finally {
    M._free(mech)
    M._free(oidPtr)
    freeTemplate(M, newTpl, 8)
    M._free(derivedHPtr)
  }
}

/**
 * BIP32/SLIP10 Child Node Derivation.
 * Returns handle to the newly derived child CKO_PRIVATE_KEY.
 */
export const hsm_bip32ChildDerive = (
  M: SoftHSMModule,
  hSession: number,
  hParentKey: number,
  index: number,
  hardened: boolean,
  curve: 'P-256' | 'ed25519' | 'secp256k1',
  extractable = false
): number => {
  const dp = buildBIP32ChildDeriveParams(M, index, hardened)
  const mech = buildMech(M, CKM_BIP32_CHILD_DERIVE, dp.ptr, dp.len)
  const actualOid = curve === 'ed25519' ? EC_OID_ED25519 : ecCurveOID(curve)
  const oidPtr = writeBytes(M, actualOid)

  const newTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: curve === 'ed25519' ? CKK_EC_EDWARDS : CKK_EC },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_DERIVE, boolVal: true },
    { type: CKA_EC_PARAMS, bytesPtr: oidPtr, bytesLen: actualOid.length },
  ])

  const derivedHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, hParentKey, newTpl.ptr, 8, derivedHPtr),
      'C_DeriveKey(BIP32_CHILD_DERIVE)'
    )
    return readUlong(M, derivedHPtr)
  } finally {
    M._free(mech)
    dp.allocPtrs.forEach((p) => M._free(p))
    M._free(oidPtr)
    freeTemplate(M, newTpl, 8)
    M._free(derivedHPtr)
  }
}

// ── EdDSA helpers ─────────────────────────────────────────────────────────────

/** Generate an EdDSA key pair (Ed25519 or Ed448). */
export const hsm_generateEdDSAKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  curve: 'Ed25519' | 'Ed448',
  extractable = false
): { pubHandle: number; privHandle: number } => {
  const mech = buildMech(M, CKM_EC_EDWARDS_KEY_PAIR_GEN)
  const oid = curve === 'Ed448' ? EC_OID_ED448 : EC_OID_ED25519
  const oidPtr = writeBytes(M, oid)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC_EDWARDS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_EC_PARAMS, bytesPtr: oidPtr, bytesLen: oid.length },
    { type: CKA_VERIFY, boolVal: true },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC_EDWARDS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_EC_PARAMS, bytesPtr: oidPtr, bytesLen: oid.length },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_SIGN, boolVal: true },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 5, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(EdDSA)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    M._free(oidPtr)
    freeTemplate(M, pubTpl, 5)
    freeTemplate(M, prvTpl, 8)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/** Generate an X25519 key pair for ECDH. */
export const hsm_generateX25519KeyPair = (
  M: SoftHSMModule,
  hSession: number,
  extractable = false
): { pubHandle: number; privHandle: number } => {
  const mech = buildMech(M, CKM_EC_MONTGOMERY_KEY_PAIR_GEN)
  const oidPtr = writeBytes(M, EC_OID_X25519)
  const pubTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC_MONTGOMERY },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_EC_PARAMS, bytesPtr: oidPtr, bytesLen: EC_OID_X25519.length },
    { type: CKA_VERIFY, boolVal: false },
    { type: CKA_ENCRYPT, boolVal: false },
  ])
  const prvTpl = buildTemplate(M, [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC_MONTGOMERY },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    { type: CKA_SIGN, boolVal: false },
    { type: CKA_DERIVE, boolVal: true },
  ])
  const pubHPtr = allocUlong(M)
  const prvHPtr = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(hSession, mech, pubTpl.ptr, 6, prvTpl.ptr, 8, pubHPtr, prvHPtr),
      'C_GenerateKeyPair(X25519)'
    )
    return { pubHandle: readUlong(M, pubHPtr), privHandle: readUlong(M, prvHPtr) }
  } finally {
    M._free(mech)
    M._free(oidPtr)
    freeTemplate(M, pubTpl, 6)
    freeTemplate(M, prvTpl, 8)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

/**
 * Import an EdDSA public key from raw key bytes. Returns CKO_PUBLIC_KEY handle.
 * Used for ACVP SigVer KAT against NIST/RFC 8032 Ed25519 reference vectors.
 */
export const hsm_importEdDSAPublicKey = (
  M: SoftHSMModule,
  hSession: number,
  pubKeyBytes: Uint8Array,
  curve: 'Ed25519' | 'Ed448' = 'Ed25519'
): number => {
  const oid = curve === 'Ed448' ? EC_OID_ED448 : EC_OID_ED25519
  const oidPtr = writeBytes(M, oid)

  // CKA_EC_POINT: DER OCTET STRING wrapping the raw point — required by C++ SoftHSM
  const derPoint = new Uint8Array(2 + pubKeyBytes.length)
  derPoint[0] = 0x04 // OCTET STRING tag
  derPoint[1] = pubKeyBytes.length
  derPoint.set(pubKeyBytes, 2)
  const pointPtr = writeBytes(M, derPoint)

  // CKA_VALUE: raw key bytes — accepted by Rust engine, rejected by C++ (0x12)
  const valPtr = writeBytes(M, pubKeyBytes)

  const baseAttrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC_EDWARDS },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_EC_PARAMS, bytesPtr: oidPtr, bytesLen: oid.length },
    { type: CKA_EC_POINT, bytesPtr: pointPtr, bytesLen: derPoint.length },
  ]
  const pubHPtr = allocUlong(M)
  try {
    // Try with CKA_VALUE (Rust engine needs it); fall back without it (C++ rejects it)
    const tplFull = buildTemplate(M, [
      ...baseAttrs,
      { type: CKA_VALUE, bytesPtr: valPtr, bytesLen: pubKeyBytes.length },
    ])
    const rv = M._C_CreateObject(hSession, tplFull.ptr, 7, pubHPtr) >>> 0
    freeTemplate(M, tplFull, 7)
    if (rv === 0x12) {
      // CKR_ATTRIBUTE_TYPE_INVALID — retry without CKA_VALUE
      const tplStd = buildTemplate(M, baseAttrs)
      checkRV(
        M._C_CreateObject(hSession, tplStd.ptr, 6, pubHPtr),
        'C_CreateObject(Import EdDSA PubKey)'
      )
      freeTemplate(M, tplStd, 6)
    } else {
      checkRV(rv, 'C_CreateObject(Import EdDSA PubKey)')
    }
    return readUlong(M, pubHPtr)
  } finally {
    M._free(pubHPtr)
    M._free(oidPtr)
    M._free(pointPtr)
    M._free(valPtr)
  }
}

/** EdDSA sign via C_SignInit(CKM_EDDSA) + C_Sign. */
export const hsm_eddsaSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: string | Uint8Array
): Uint8Array => {
  const params = buildEdDSAParams(M, false)
  const mech = buildMech(M, CKM_EDDSA, params.ptr, params.len)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(EdDSA)')
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, 0, sigLenPtr), 'C_Sign(EdDSA,len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_Sign(hSession, msgPtr, msgBytes.length, sigPtr, sigLenPtr), 'C_Sign(EdDSA)')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    params.allocPtrs.forEach((p) => M._free(p))
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

/** EdDSA verify via C_VerifyInit(CKM_EDDSA) + C_Verify. Returns true if valid. */
export const hsm_eddsaVerify = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: string | Uint8Array,
  sigBytes: Uint8Array
): boolean => {
  const params = buildEdDSAParams(M, false)
  const mech = buildMech(M, CKM_EDDSA, params.ptr, params.len)
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  const msgPtr = writeBytes(M, msgBytes)
  const sigPtr = writeBytes(M, sigBytes)
  try {
    checkRV(M._C_VerifyInit(hSession, mech, pubHandle), 'C_VerifyInit(EdDSA)')
    const rv = M._C_Verify(hSession, msgPtr, msgBytes.length, sigPtr, sigBytes.length) >>> 0
    return rv === 0
  } finally {
    params.allocPtrs.forEach((p) => M._free(p))
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

/**
 * Multi-part sign via C_SignInit + C_SignUpdate × N + C_SignFinal.
 * Works with RSA-PKCS, RSA-PSS, ECDSA, or any mechanism that supports streaming.
 * Note: Pure EdDSA strict PKCS#11 v3.2 does NOT support multi-part signing.
 */
export const hsm_signMultiPart = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  chunks: Uint8Array[],
  mechType: number
): Uint8Array => {
  const mech = buildMech(M, mechType)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  const chunkPtrs: number[] = []
  try {
    checkRV(M._C_SignInit(hSession, mech, privHandle), 'C_SignInit(multi-part)')
    for (const chunk of chunks) {
      const ptr = writeBytes(M, chunk)
      chunkPtrs.push(ptr)
      checkRV(M._C_SignUpdate(hSession, ptr, chunk.length), 'C_SignUpdate')
    }
    // Size query: pSignature=0 returns required length without consuming state
    checkRV(M._C_SignFinal(hSession, 0, sigLenPtr), 'C_SignFinal(len)')
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    checkRV(M._C_SignFinal(hSession, sigPtr, sigLenPtr), 'C_SignFinal')
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(sigLenPtr)
    for (const ptr of chunkPtrs) M._free(ptr)
    if (sigPtr) M._free(sigPtr)
  }
}
