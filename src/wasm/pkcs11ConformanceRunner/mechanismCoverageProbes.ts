// PKCS#11 v3.2 mechanism-behavior coverage — real mechanisms neither the
// OASIS Profiles Tier A/B conformance suite (profileConditions.ts) nor this
// app's own ACVP tab (HsmAcvpTesting.tsx) exercises anywhere (2026-08-31
// audit, done at the user's explicit request: "cover in conformance the
// tests that are not covered by the acvp test suites").
//
// NOT a "Tier C": that name is already reserved for porting the native
// engines' own 976/815-check conformance suites into the browser (see
// pkcs11-hsm-playground-ws11-conformance-runner-plan-08282026.md §3.3) — a
// much larger, separate undertaking. This is a narrower, product-specific
// gap-closure pass, surfaced in the UI as its own "Mechanism Coverage"
// section, not part of the OASIS A/B/C tier sequence at all.
//
// Gated purely on whether C_GetMechanismList actually advertises each
// mechanism — there is no "Profile claim" concept here, none of these
// mechanisms are tied to a Profiles v3.2 §5.x condition.

import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  buildTemplate,
  freeTemplate,
  checkRV,
  writeBytes,
  hsm_extractKeyValue,
  hsm_importGenericSecret,
  hsm_generateRSAKeyPair,
  hsm_generateECKeyPair,
  hsm_extractECPoint,
  hsm_ecdhCofactorDerive,
  hsm_getMechanismInfo,
  hsm_generateAESKey,
  hsm_aesEncrypt,
  hsm_aesDecrypt,
  hsm_wrapKeyMech,
  hsm_unwrapKeyMech,
  dsaParamSet,
  kemParamSet,
  CKA_CLASS,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_PARAMETER_SET,
  CKA_SEED,
  CKA_SIGN,
  CKA_SIGN_RECOVER,
  CKA_VERIFY,
  CKA_VERIFY_RECOVER,
  CKA_MODULUS_BITS,
  CKA_PUBLIC_EXPONENT,
  CKA_ENCAPSULATE,
  CKA_DECAPSULATE,
  CKA_DERIVE,
  CKA_EC_PARAMS,
  CKA_VALUE_LEN,
  CKA_KEY_TYPE,
  CKO_PUBLIC_KEY,
  CKO_PRIVATE_KEY,
  CKO_SECRET_KEY,
  CKK_EC,
  CKK_RSA,
  CKK_GENERIC_SECRET,
  CKM_ML_DSA_KEY_PAIR_GEN,
  CKM_ML_KEM_KEY_PAIR_GEN,
  CKM_SLH_DSA_KEY_PAIR_GEN,
  CKM_EC_KEY_PAIR_GEN,
  CKM_ECDH1_DERIVE,
  CKM_ECDH1_COFACTOR_DERIVE,
  CKM_CONCATENATE_BASE_AND_KEY,
  CKM_RSA_PKCS,
  CKM_RSA_X_509,
  CKM_RSA_PKCS_KEY_PAIR_GEN,
  CKM_SHA256_RSA_PKCS,
  CKM_ECDSA,
  CKM_SHA256,
  CKM_AES_CBC_PAD,
  CKM_AES_KEY_WRAP_PAD,
  CKP_SLH_DSA_SHA2_128S,
} from '../softhsm'

export interface MechanismProbeContext {
  M: SoftHSMModule
  hSession: number
  slotId: number
  /** From C_GetMechanismList — the only gate a probe here runs under. */
  mechs: Set<number>
}

export interface MechanismProbe {
  id: string
  mechanism: number
  mechanismName: string
  family: 'PQC' | 'Hybrid KEM' | 'Classical Asymmetric' | 'Symmetric/AEAD'
  /** Exact spec citation, e.g. "PKCS#11 v3.2 §6.67.4". */
  citation: string
  run: (ctx: MechanismProbeContext) => string
}

export interface MechanismProbeResult extends MechanismProbe {
  status: 'pass' | 'fail' | 'not-claimed'
  detail: string
}

const buildMechRaw = (M: SoftHSMModule, type: number): number => {
  const mech = M._malloc(12)
  M.setValue(mech, type, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')
  return mech
}

// ── PQC: deterministic key generation from CKA_SEED ────────────────────────
//
// §6.67.4 (ML-DSA), §6.68.4 (ML-KEM), §6.69.2 (SLH-DSA) all let a caller
// supply CKA_SEED in the private-key template of C_GenerateKeyPair for
// reproducible generation (verified against both engines' dispatch —
// pqctoday-hsm SoftHSM_keygen.cpp's extractSeed(pPrivateKeyTemplate, ...)
// call sites; Rust ffi.rs mirrors it). ACVP's KAT suites only ever import a
// pre-existing key or generate a random one — this path is untested
// anywhere. The real conformance claim here is determinism, not merely
// "the attribute was accepted": generate twice from the SAME seed and
// assert the two public keys are byte-identical.

type PqcSeedKind = 'ml-dsa' | 'ml-kem' | 'slh-dsa'

const seededKeygenOnce = (
  ctx: MechanismProbeContext,
  kind: PqcSeedKind,
  mechType: number,
  paramSet: number,
  seed: Uint8Array
): { pubHandle: number; privHandle: number } => {
  const { M, hSession } = ctx
  const mech = buildMechRaw(M, mechType)
  const seedPtr = M._malloc(seed.length)
  M.HEAPU8.set(seed, seedPtr)
  const pubAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_PARAMETER_SET, ulongVal: paramSet },
    kind === 'ml-kem'
      ? { type: CKA_ENCAPSULATE, boolVal: true }
      : { type: CKA_VERIFY, boolVal: true },
  ]
  const prvAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: paramSet },
    kind === 'ml-kem'
      ? { type: CKA_DECAPSULATE, boolVal: true }
      : { type: CKA_SIGN, boolVal: true },
    { type: CKA_SEED, bytesPtr: seedPtr, bytesLen: seed.length },
  ]
  const pubTpl = buildTemplate(M, pubAttrs)
  const prvTpl = buildTemplate(M, prvAttrs)
  const pubHPtr = M._malloc(4)
  const prvHPtr = M._malloc(4)
  try {
    checkRV(
      M._C_GenerateKeyPair(
        hSession,
        mech,
        pubTpl.ptr,
        pubAttrs.length,
        prvTpl.ptr,
        prvAttrs.length,
        pubHPtr,
        prvHPtr
      ),
      `C_GenerateKeyPair(${kind}, seeded)`
    )
    return {
      pubHandle: M.getValue(pubHPtr, 'i32') >>> 0,
      privHandle: M.getValue(prvHPtr, 'i32') >>> 0,
    }
  } finally {
    M._free(mech)
    M._free(seedPtr)
    freeTemplate(M, pubTpl, pubAttrs.length)
    freeTemplate(M, prvTpl, prvAttrs.length)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
}

const deterministicKeygenProbe =
  (kind: PqcSeedKind, mechType: number, paramSet: number, seedLen: number) =>
  (ctx: MechanismProbeContext): string => {
    const { M, hSession } = ctx
    // Fixed, reproducible byte pattern — not random. The claim under test is
    // "same seed in -> same key out", so the seed's own value is arbitrary
    // as long as it's identical across both calls.
    const seed = new Uint8Array(seedLen)
    for (let i = 0; i < seedLen; i++) seed[i] = (i * 37 + 11) & 0xff

    const first = seededKeygenOnce(ctx, kind, mechType, paramSet, seed)
    const firstPub = hsm_extractKeyValue(M, hSession, first.pubHandle)
    M._C_DestroyObject(hSession, first.pubHandle)
    M._C_DestroyObject(hSession, first.privHandle)

    const second = seededKeygenOnce(ctx, kind, mechType, paramSet, seed)
    const secondPub = hsm_extractKeyValue(M, hSession, second.pubHandle)
    M._C_DestroyObject(hSession, second.pubHandle)
    M._C_DestroyObject(hSession, second.privHandle)

    if (firstPub.length === 0 || firstPub.length !== secondPub.length)
      throw new Error(
        `public key length mismatch or empty: ${firstPub.length}B vs ${secondPub.length}B`
      )
    for (let i = 0; i < firstPub.length; i++) {
      if (firstPub[i] !== secondPub[i])
        throw new Error(`same ${seedLen}B CKA_SEED produced DIFFERENT public keys at byte ${i}`)
    }
    return `two independent C_GenerateKeyPair(${kind}) calls with the same ${seedLen}B CKA_SEED produced byte-identical ${firstPub.length}B public keys`
  }

// ── Hybrid KEM building blocks ──────────────────────────────────────────────
//
// There is no dedicated PKCS#11 "hybrid KEM" mechanism, in either engine or
// in the spec itself — a hybrid construction (e.g. X25519+ML-KEM-768) is
// built by the CALLER out of two ordinary KEMs plus a combiner (per both
// engines' own comments, e.g. pqctoday-hsm SoftHSM_kem.cpp:52-58). These are
// the two real PKCS#11-layer mechanisms that dependency actually rests on;
// ACVP exercises neither.

// DER OID for secp256r1/P-256 (RFC 5480), the same bytes
// pqctoday-hub's own ecCurveOID('P-256') helper produces — inlined here
// rather than exporting that private helper for one caller.
const P256_OID = new Uint8Array([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07])

/** CKM_ECDH1_DERIVE dispatched under C_EncapsulateKey/C_DecapsulateKey
 *  (PKCS#11 v3.2 §6.3.17 Table 78) — "ECDH-as-KEM", the classical half of a
 *  hybrid construction. Real round-trip proof: encapsulate to a real P-256
 *  public key (generates a fresh ephemeral pair internally, returns its
 *  public point as ciphertext), decapsulate with the matching private key,
 *  and assert the two derived shared secrets are byte-identical — the same
 *  proof ACVP's own "ML-KEM Encap+Decap Round-Trip" section uses, applied
 *  to the classical side of the hybrid pair. */
const hybridEcdhKemProbe = (ctx: MechanismProbeContext): string => {
  const { M, hSession } = ctx
  const oidPtr = writeBytes(M, P256_OID)
  const mech = buildMechRaw(M, CKM_EC_KEY_PAIR_GEN)
  // CKA_ENCAPSULATE/CKA_DECAPSULATE are NOT supplied in the generate
  // template here (2026-08-31 real-engine finding): PKCS#11 v3.2 Table 18
  // has C_GenerateKeyPair set these automatically, and both engines' own
  // attribute-validation tables mark them ck8 ("may be modified after
  // object is created with C_SetAttributeValue") — the C++ engine only
  // auto-sets them for its ML-KEM keygen branch specifically and rejects
  // them in an EC generate template with CKR_ATTRIBUTE_READ_ONLY (the Rust
  // engine is more permissive and accepts them there directly, which is
  // why this only failed on C++ during verification). Set both explicitly
  // via C_SetAttributeValue right after creation instead — works on both.
  const pubAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_EC_PARAMS, bytesPtr: oidPtr, bytesLen: P256_OID.length },
  ]
  // CKA_EC_PARAMS deliberately NOT repeated here — matching the proven-
  // working hsm_generateECKeyPair (softhsm.ts), the curve is specified on
  // the public template only; the mechanism infers it for the private key.
  const prvAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_EC },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_DERIVE, boolVal: true },
  ]
  const pubTpl = buildTemplate(M, pubAttrs)
  const prvTpl = buildTemplate(M, prvAttrs)
  const pubHPtr = M._malloc(4)
  const prvHPtr = M._malloc(4)
  let pubHandle = 0
  let privHandle = 0
  try {
    checkRV(
      M._C_GenerateKeyPair(
        hSession,
        mech,
        pubTpl.ptr,
        pubAttrs.length,
        prvTpl.ptr,
        prvAttrs.length,
        pubHPtr,
        prvHPtr
      ),
      'C_GenerateKeyPair(EC P-256)'
    )
    pubHandle = M.getValue(pubHPtr, 'i32') >>> 0
    privHandle = M.getValue(prvHPtr, 'i32') >>> 0
  } finally {
    M._free(mech)
    M._free(oidPtr)
    freeTemplate(M, pubTpl, pubAttrs.length)
    freeTemplate(M, prvTpl, prvAttrs.length)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }

  const encapTpl = buildTemplate(M, [{ type: CKA_ENCAPSULATE, boolVal: true }])
  try {
    checkRV(
      M._C_SetAttributeValue(hSession, pubHandle, encapTpl.ptr, 1),
      'C_SetAttributeValue(CKA_ENCAPSULATE)'
    )
  } finally {
    freeTemplate(M, encapTpl, 1)
  }
  const decapTpl = buildTemplate(M, [{ type: CKA_DECAPSULATE, boolVal: true }])
  try {
    checkRV(
      M._C_SetAttributeValue(hSession, privHandle, decapTpl.ptr, 1),
      'C_SetAttributeValue(CKA_DECAPSULATE)'
    )
  } finally {
    freeTemplate(M, decapTpl, 1)
  }

  const secretAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
  ]

  // C_EncapsulateKey — two-call size-then-fetch, same convention
  // hsm_encapsulate (softhsm.ts) uses for CKM_ML_KEM, no fixed-length
  // table here since a raw EC point's length isn't mechanism-agnostic.
  const encMech = buildMechRaw(M, CKM_ECDH1_DERIVE)
  const encTpl = buildTemplate(M, secretAttrs)
  const ctLenPtr = M._malloc(4)
  const encHPtr = M._malloc(4)
  let ciphertext: Uint8Array
  let encapSecretHandle: number
  try {
    checkRV(
      M._C_EncapsulateKey(
        hSession,
        encMech,
        pubHandle,
        encTpl.ptr,
        secretAttrs.length,
        0,
        ctLenPtr,
        encHPtr
      ),
      'C_EncapsulateKey(size)'
    )
    const ctLen = M.getValue(ctLenPtr, 'i32') >>> 0
    if (ctLen === 0) throw new Error('C_EncapsulateKey reported a 0-byte ciphertext')
    const ctPtr = M._malloc(ctLen)
    try {
      M.setValue(ctLenPtr, ctLen, 'i32')
      checkRV(
        M._C_EncapsulateKey(
          hSession,
          encMech,
          pubHandle,
          encTpl.ptr,
          secretAttrs.length,
          ctPtr,
          ctLenPtr,
          encHPtr
        ),
        'C_EncapsulateKey'
      )
      ciphertext = M.HEAPU8.slice(ctPtr, ctPtr + (M.getValue(ctLenPtr, 'i32') >>> 0))
      encapSecretHandle = M.getValue(encHPtr, 'i32') >>> 0
    } finally {
      M._free(ctPtr)
    }
  } finally {
    M._free(encMech)
    freeTemplate(M, encTpl, secretAttrs.length)
    M._free(ctLenPtr)
    M._free(encHPtr)
  }

  const encapSecret = hsm_extractKeyValue(M, hSession, encapSecretHandle)
  M._C_DestroyObject(hSession, encapSecretHandle)

  // C_DecapsulateKey with the matching private key + the ciphertext just produced.
  const decMech = buildMechRaw(M, CKM_ECDH1_DERIVE)
  const decTpl = buildTemplate(M, secretAttrs)
  const ctPtr2 = writeBytes(M, ciphertext)
  const decHPtr = M._malloc(4)
  let decapSecretHandle: number
  try {
    checkRV(
      M._C_DecapsulateKey(
        hSession,
        decMech,
        privHandle,
        decTpl.ptr,
        secretAttrs.length,
        ctPtr2,
        ciphertext.length,
        decHPtr
      ),
      'C_DecapsulateKey'
    )
    decapSecretHandle = M.getValue(decHPtr, 'i32') >>> 0
  } finally {
    M._free(decMech)
    freeTemplate(M, decTpl, secretAttrs.length)
    M._free(ctPtr2)
    M._free(decHPtr)
  }
  const decapSecret = hsm_extractKeyValue(M, hSession, decapSecretHandle)
  M._C_DestroyObject(hSession, decapSecretHandle)
  M._C_DestroyObject(hSession, pubHandle)
  M._C_DestroyObject(hSession, privHandle)

  if (encapSecret.length === 0 || encapSecret.length !== decapSecret.length)
    throw new Error(
      `shared-secret length mismatch or empty: encap=${encapSecret.length}B decap=${decapSecret.length}B`
    )
  for (let i = 0; i < encapSecret.length; i++) {
    if (encapSecret[i] !== decapSecret[i])
      throw new Error(`encapsulate/decapsulate shared secrets differ at byte ${i}`)
  }
  return `C_EncapsulateKey/C_DecapsulateKey(CKM_ECDH1_DERIVE) round-trip on a real P-256 key pair produced the same ${encapSecret.length}B shared secret; ciphertext=${ciphertext.length}B ephemeral public point`
}

/** CKM_CONCATENATE_BASE_AND_KEY (PKCS#11 v2.40 §2.31.3, still current in
 *  v3.2) — the literal combiner mechanism a hybrid construction's classical
 *  and PQC shared secrets would actually be joined with at the PKCS#11
 *  layer. Real correctness proof: import two known secret values, derive,
 *  and assert the result is exactly base‖other, not merely non-empty. */
const concatenateBaseAndKeyProbe = (ctx: MechanismProbeContext): string => {
  const { M, hSession } = ctx
  const baseBytes = new Uint8Array(8).fill(0xaa)
  const otherBytes = new Uint8Array(8).fill(0xbb)
  const baseHandle = hsm_importGenericSecret(M, hSession, baseBytes)
  const otherHandle = hsm_importGenericSecret(M, hSession, otherBytes)

  const otherHandlePtr = M._malloc(4)
  M.setValue(otherHandlePtr, otherHandle, 'i32')
  const mech = buildMechRaw(M, CKM_CONCATENATE_BASE_AND_KEY)
  // Overwrite the generic 12-byte mechanism buildMechRaw wrote: pParameter
  // must point at the CK_OBJECT_HANDLE of the "other" key, per §2.31.3.
  M.setValue(mech + 4, otherHandlePtr, 'i32')
  M.setValue(mech + 8, 4, 'i32')

  const derivedAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_DERIVE, boolVal: false },
    { type: CKA_VALUE_LEN, ulongVal: baseBytes.length + otherBytes.length },
  ]
  const derivedTpl = buildTemplate(M, derivedAttrs)
  const derivedHPtr = M._malloc(4)
  let derivedHandle: number
  try {
    checkRV(
      M._C_DeriveKey(hSession, mech, baseHandle, derivedTpl.ptr, derivedAttrs.length, derivedHPtr),
      'C_DeriveKey(CKM_CONCATENATE_BASE_AND_KEY)'
    )
    derivedHandle = M.getValue(derivedHPtr, 'i32') >>> 0
  } finally {
    M._free(mech)
    M._free(otherHandlePtr)
    freeTemplate(M, derivedTpl, derivedAttrs.length)
    M._free(derivedHPtr)
  }

  const derived = hsm_extractKeyValue(M, hSession, derivedHandle)
  M._C_DestroyObject(hSession, derivedHandle)
  M._C_DestroyObject(hSession, baseHandle)
  M._C_DestroyObject(hSession, otherHandle)

  const expected = new Uint8Array(baseBytes.length + otherBytes.length)
  expected.set(baseBytes, 0)
  expected.set(otherBytes, baseBytes.length)
  if (derived.length !== expected.length)
    throw new Error(`derived length ${derived.length}B, expected ${expected.length}B (base‖other)`)
  for (let i = 0; i < expected.length; i++) {
    if (derived[i] !== expected[i])
      throw new Error(
        `derived value is not base‖other at byte ${i} (got 0x${derived[i].toString(16)}, expected 0x${expected[i].toString(16)}) — check concatenation order`
      )
  }
  return `C_DeriveKey(CKM_CONCATENATE_BASE_AND_KEY) produced exactly base‖other (${derived.length}B)`
}

// ── Classical Asymmetric ─────────────────────────────────────────────────
//
// Mechanisms ACVP doesn't exercise: raw (un-hashed) PKCS#1 v1.5, unpadded
// RSA, and combined hash-then-sign PKCS#1v1.5 (ACVP's RSA coverage is PSS
// only — CKM_SHA256_RSA_PKCS_PSS etc). CKM_ECDSA (raw, pre-hashed) is also
// genuinely untested: every hsm_ecdsaVerify call site in
// HsmAcvpTesting.tsx uses a COMBINED CKM_ECDSA_SHA* mechanism (P-256
// defaults to it, P-384/secp256k1 pass it explicitly) — the opposite of
// what an earlier draft of this audit assumed. CKM_ECDH1_COFACTOR_DERIVE
// has a real, already-exported wrapper (hsm_ecdhCofactorDerive) that had
// zero callers anywhere in the app before this.

// CK_MECHANISM_INFO.flags bits (PKCS#11 v3.2 §4.4) needed to detect which
// of C_Sign/C_Verify vs C_SignRecover/C_VerifyRecover an engine actually
// exposes CKM_RSA_X_509 through — see rsaX509Probe below for why this
// matters (a real, measured divergence between the two engines).
const CKF_SIGN = 0x00000800
const CKF_SIGN_RECOVER = 0x00001000

/** Real RSA-2048 sign+verify round-trip for any of the three PKCS#1v1.5-
 *  family mechanisms — the message shape (short vs exactly-modulus-size)
 *  is the caller's job, since CKM_RSA_X_509 (unpadded) requires it. */
const rsaSignVerifyRoundTrip = (
  ctx: MechanismProbeContext,
  mechType: number,
  mechName: string,
  message: Uint8Array
): string => {
  const { M, hSession } = ctx
  const { pubHandle, privHandle } = hsm_generateRSAKeyPair(M, hSession, 2048, true)
  const sigLen = 256 // RSA-2048 modulus size — fixed, no size query needed

  const mech1 = buildMechRaw(M, mechType)
  const msgPtr = writeBytes(M, message)
  const sigPtr = M._malloc(sigLen)
  const sigLenPtr = M._malloc(4)
  M.setValue(sigLenPtr, sigLen, 'i32')
  let sigBytes: Uint8Array
  try {
    checkRV(M._C_SignInit(hSession, mech1, privHandle), `C_SignInit(${mechName})`)
    checkRV(M._C_Sign(hSession, msgPtr, message.length, sigPtr, sigLenPtr), `C_Sign(${mechName})`)
    sigBytes = M.HEAPU8.slice(sigPtr, sigPtr + (M.getValue(sigLenPtr, 'i32') >>> 0))
  } finally {
    M._free(mech1)
    M._free(msgPtr)
    M._free(sigPtr)
    M._free(sigLenPtr)
  }

  const mech2 = buildMechRaw(M, mechType)
  const msgPtr2 = writeBytes(M, message)
  const sigPtr2 = writeBytes(M, sigBytes)
  let verifyRv: number
  try {
    checkRV(M._C_VerifyInit(hSession, mech2, pubHandle), `C_VerifyInit(${mechName})`)
    verifyRv = M._C_Verify(hSession, msgPtr2, message.length, sigPtr2, sigBytes.length) >>> 0
  } finally {
    M._free(mech2)
    M._free(msgPtr2)
    M._free(sigPtr2)
    M._C_DestroyObject(hSession, pubHandle)
    M._C_DestroyObject(hSession, privHandle)
  }
  if (verifyRv !== 0)
    throw new Error(
      `C_Verify(${mechName}) → rv=0x${verifyRv.toString(16)} (sign succeeded, verify did not)`
    )
  return `${mechName} sign+verify round-trip on a real RSA-2048 key succeeded (${sigBytes.length}B signature)`
}

/** CKM_RSA_X_509 specifically: the two engines expose it through DIFFERENT
 *  PKCS#11 functions (measured, not assumed — see the module-header
 *  comment). C++ implements it via plain C_Sign/C_Verify; the Rust engine
 *  only via C_SignRecover/C_VerifyRecover (CKR_MECHANISM_INVALID on plain
 *  C_Sign there), matching standard PKCS#11 practice for raw/unpadded RSA
 *  signatures (RFC 8017 §5.2 RSASP1/RSAVP1 — there's no padding to give a
 *  Verify oracle a pass/fail signal, so Verify-with-recovery, which returns
 *  the recovered data for the caller to compare, is the conventional API).
 *  Checked via C_GetMechanismInfo's real flags, not hardcoded per engine. */
const rsaX509Probe = (ctx: MechanismProbeContext): string => {
  const { M, hSession, slotId } = ctx
  // A dedicated raw generate, not hsm_generateRSAKeyPair: that wrapper only
  // sets CKA_SIGN/CKA_VERIFY, but CKA_SIGN_RECOVER/CKA_VERIFY_RECOVER are
  // SEPARATE capability attributes a real engine checks independently
  // (measured: the Rust engine's C_SignRecoverInit returned
  // CKR_KEY_FUNCTION_NOT_PERMITTED on a key with only CKA_SIGN set). Set
  // all four so the key works whichever path the running engine uses.
  const genMech = buildMechRaw(M, CKM_RSA_PKCS_KEY_PAIR_GEN)
  const expBytes = new Uint8Array([0x01, 0x00, 0x01])
  const expPtr = writeBytes(M, expBytes)
  const pubAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_MODULUS_BITS, ulongVal: 2048 },
    { type: CKA_PUBLIC_EXPONENT, bytesPtr: expPtr, bytesLen: expBytes.length },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_VERIFY_RECOVER, boolVal: true },
  ]
  const prvAttrs = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_RSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_SIGN_RECOVER, boolVal: true },
  ]
  const pubTpl = buildTemplate(M, pubAttrs)
  const prvTpl = buildTemplate(M, prvAttrs)
  const pubHPtr = M._malloc(4)
  const prvHPtr = M._malloc(4)
  let pubHandle = 0
  let privHandle = 0
  try {
    checkRV(
      M._C_GenerateKeyPair(
        hSession,
        genMech,
        pubTpl.ptr,
        pubAttrs.length,
        prvTpl.ptr,
        prvAttrs.length,
        pubHPtr,
        prvHPtr
      ),
      'C_GenerateKeyPair(RSA-2048, sign+recover capable)'
    )
    pubHandle = M.getValue(pubHPtr, 'i32') >>> 0
    privHandle = M.getValue(prvHPtr, 'i32') >>> 0
  } finally {
    M._free(genMech)
    M._free(expPtr)
    freeTemplate(M, pubTpl, pubAttrs.length)
    freeTemplate(M, prvTpl, prvAttrs.length)
    M._free(pubHPtr)
    M._free(prvHPtr)
  }
  const data = new Uint8Array(256)
  data[0] = 0x00 // guarantees the value < modulus regardless of the actual modulus
  for (let i = 1; i < 256; i++) data[i] = (i * 17 + 3) & 0xff

  const info = hsm_getMechanismInfo(M, slotId, CKM_RSA_X_509)
  const useRecover = !((info?.flags ?? 0) & CKF_SIGN) && !!((info?.flags ?? 0) & CKF_SIGN_RECOVER)

  const mech1 = buildMechRaw(M, CKM_RSA_X_509)
  const dataPtr = writeBytes(M, data)
  const outLen = 256
  const outPtr = M._malloc(outLen)
  const outLenPtr = M._malloc(4)
  M.setValue(outLenPtr, outLen, 'i32')
  let sigBytes: Uint8Array
  try {
    if (useRecover) {
      checkRV(M._C_SignRecoverInit(hSession, mech1, privHandle), 'C_SignRecoverInit')
      checkRV(M._C_SignRecover(hSession, dataPtr, data.length, outPtr, outLenPtr), 'C_SignRecover')
    } else {
      checkRV(M._C_SignInit(hSession, mech1, privHandle), 'C_SignInit(CKM_RSA_X_509)')
      checkRV(M._C_Sign(hSession, dataPtr, data.length, outPtr, outLenPtr), 'C_Sign(CKM_RSA_X_509)')
    }
    sigBytes = M.HEAPU8.slice(outPtr, outPtr + (M.getValue(outLenPtr, 'i32') >>> 0))
  } finally {
    M._free(mech1)
    M._free(dataPtr)
    M._free(outPtr)
    M._free(outLenPtr)
  }

  const mech2 = buildMechRaw(M, CKM_RSA_X_509)
  const sigPtr2 = writeBytes(M, sigBytes)
  const recoveredPtr = M._malloc(256)
  const recoveredLenPtr = M._malloc(4)
  M.setValue(recoveredLenPtr, 256, 'i32')
  let ok: boolean
  let detail: string
  try {
    if (useRecover) {
      checkRV(M._C_VerifyRecoverInit(hSession, mech2, pubHandle), 'C_VerifyRecoverInit')
      checkRV(
        M._C_VerifyRecover(hSession, sigPtr2, sigBytes.length, recoveredPtr, recoveredLenPtr),
        'C_VerifyRecover'
      )
      const recovered = M.HEAPU8.slice(
        recoveredPtr,
        recoveredPtr + (M.getValue(recoveredLenPtr, 'i32') >>> 0)
      )
      // Compare as big-endian integers, not raw bytes: unpadded RSA is
      // fundamentally big-integer math, and the engine's own integer→bytes
      // conversion is free to drop data's deliberate leading 0x00 (added
      // only so the numeric value stays < the modulus) — a real, measured
      // difference from a byte-exact comparison, not a padding bug.
      const toBigInt = (b: Uint8Array): bigint =>
        b.reduce((acc, byte) => (acc << 8n) | BigInt(byte), 0n)
      ok = toBigInt(recovered) === toBigInt(data)
      detail = `C_SignRecover/C_VerifyRecover round-trip (engine exposes CKM_RSA_X_509 via recovery, not plain Sign/Verify): recovered value ${ok ? 'matches' : 'does NOT match'} the original (compared as big-endian integers — recovered=${recovered.length}B, original=${data.length}B)`
      if (!ok) throw new Error(detail)
    } else {
      const dataPtr2 = writeBytes(M, data)
      let verifyRv: number
      try {
        checkRV(M._C_VerifyInit(hSession, mech2, pubHandle), 'C_VerifyInit(CKM_RSA_X_509)')
        verifyRv = M._C_Verify(hSession, dataPtr2, data.length, sigPtr2, sigBytes.length) >>> 0
      } finally {
        M._free(dataPtr2)
      }
      ok = verifyRv === 0
      detail = `C_Sign/C_Verify round-trip on a real RSA-2048 key succeeded (${sigBytes.length}B signature)`
      if (!ok) throw new Error(`C_Verify(CKM_RSA_X_509) → rv=0x${verifyRv.toString(16)}`)
    }
  } finally {
    M._free(mech2)
    M._free(sigPtr2)
    M._free(recoveredPtr)
    M._free(recoveredLenPtr)
    M._C_DestroyObject(hSession, pubHandle)
    M._C_DestroyObject(hSession, privHandle)
  }
  return detail
}

/** CKM_ECDSA (raw, pre-hashed) — computes a real SHA-256 digest via the
 *  engine's own C_Digest, then signs/verifies that raw digest directly.
 *  Distinct from the CKM_ECDSA_SHA256 combined form ACVP already covers,
 *  which hashes the message internally in one call. */
const ecdsaRawProbe = (ctx: MechanismProbeContext): string => {
  const { M, hSession } = ctx
  const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, 'P-256', true)
  const message = new TextEncoder().encode('Mechanism Coverage probe: raw pre-hashed CKM_ECDSA')

  const digestMech = buildMechRaw(M, CKM_SHA256)
  const msgPtr = writeBytes(M, message)
  const digestPtr = M._malloc(32)
  const digestLenPtr = M._malloc(4)
  M.setValue(digestLenPtr, 32, 'i32')
  let digest: Uint8Array
  try {
    checkRV(M._C_DigestInit(hSession, digestMech), 'C_DigestInit(SHA-256)')
    checkRV(
      M._C_Digest(hSession, msgPtr, message.length, digestPtr, digestLenPtr),
      'C_Digest(SHA-256)'
    )
    digest = M.HEAPU8.slice(digestPtr, digestPtr + 32)
  } finally {
    M._free(digestMech)
    M._free(msgPtr)
    M._free(digestPtr)
    M._free(digestLenPtr)
  }

  const mech1 = buildMechRaw(M, CKM_ECDSA)
  const digestPtr2 = writeBytes(M, digest)
  const sigLen = 64 // P-256: raw r‖s, 32B each
  const sigPtr = M._malloc(sigLen)
  const sigLenPtr = M._malloc(4)
  M.setValue(sigLenPtr, sigLen, 'i32')
  let sigBytes: Uint8Array
  try {
    checkRV(M._C_SignInit(hSession, mech1, privHandle), 'C_SignInit(CKM_ECDSA)')
    checkRV(M._C_Sign(hSession, digestPtr2, digest.length, sigPtr, sigLenPtr), 'C_Sign(CKM_ECDSA)')
    sigBytes = M.HEAPU8.slice(sigPtr, sigPtr + (M.getValue(sigLenPtr, 'i32') >>> 0))
  } finally {
    M._free(mech1)
    M._free(digestPtr2)
    M._free(sigPtr)
    M._free(sigLenPtr)
  }

  const mech2 = buildMechRaw(M, CKM_ECDSA)
  const digestPtr3 = writeBytes(M, digest)
  const sigPtr2 = writeBytes(M, sigBytes)
  let verifyRv: number
  try {
    checkRV(M._C_VerifyInit(hSession, mech2, pubHandle), 'C_VerifyInit(CKM_ECDSA)')
    verifyRv = M._C_Verify(hSession, digestPtr3, digest.length, sigPtr2, sigBytes.length) >>> 0
  } finally {
    M._free(mech2)
    M._free(digestPtr3)
    M._free(sigPtr2)
    M._C_DestroyObject(hSession, pubHandle)
    M._C_DestroyObject(hSession, privHandle)
  }
  if (verifyRv !== 0)
    throw new Error(`C_Verify(CKM_ECDSA, raw pre-hashed) → rv=0x${verifyRv.toString(16)}`)
  return `CKM_ECDSA (raw, pre-hashed) sign+verify round-trip on a real P-256 key succeeded over a real SHA-256 digest computed via C_Digest — distinct from the combined CKM_ECDSA_SHA256 form ACVP already exercises`
}

/** CKM_ECDH1_COFACTOR_DERIVE — a real two-party round-trip using the
 *  already-exported hsm_ecdhCofactorDerive (previously zero callers
 *  anywhere in the app): both sides derive from the other's real public
 *  point, and the two shared secrets must match. */
const ecdhCofactorProbe = (ctx: MechanismProbeContext): string => {
  const { M, hSession } = ctx
  const a = hsm_generateECKeyPair(M, hSession, 'P-256', true)
  const b = hsm_generateECKeyPair(M, hSession, 'P-256', true)
  const aPub = hsm_extractECPoint(M, hSession, a.pubHandle)
  const bPub = hsm_extractECPoint(M, hSession, b.pubHandle)

  const secretAHandle = hsm_ecdhCofactorDerive(M, hSession, a.privHandle, bPub)
  const secretBHandle = hsm_ecdhCofactorDerive(M, hSession, b.privHandle, aPub)
  const secretA = hsm_extractKeyValue(M, hSession, secretAHandle)
  const secretB = hsm_extractKeyValue(M, hSession, secretBHandle)

  M._C_DestroyObject(hSession, secretAHandle)
  M._C_DestroyObject(hSession, secretBHandle)
  M._C_DestroyObject(hSession, a.pubHandle)
  M._C_DestroyObject(hSession, a.privHandle)
  M._C_DestroyObject(hSession, b.pubHandle)
  M._C_DestroyObject(hSession, b.privHandle)

  if (secretA.length === 0 || secretA.length !== secretB.length)
    throw new Error(
      `shared-secret length mismatch or empty: A=${secretA.length}B B=${secretB.length}B`
    )
  for (let i = 0; i < secretA.length; i++) {
    if (secretA[i] !== secretB[i])
      throw new Error(`cofactor ECDH derived DIFFERENT secrets on each side at byte ${i}`)
  }
  return `CKM_ECDH1_COFACTOR_DERIVE two-party round-trip on real P-256 keys produced the same ${secretA.length}B shared secret`
}

// ── Symmetric/AEAD ───────────────────────────────────────────────────────
//
// A representative slice of this family's real gap, not an exhaustive list
// of every named constant. Three mechanisms originally probed here —
// CKM_AES_CMAC, CKM_SP800_108_DOUBLE_PIPELINE_KDF, CKM_SHA224 — were
// dropped 2026-08-31 after real-engine verification:
//   - CKM_SP800_108_DOUBLE_PIPELINE_KDF: both vendored WASM bundles
//     (src/vendor/softhsm-wasm) predate the pqctoday-hsm commits that add
//     its advertisement (rust @ 34796e04, cpp @ 35cc1562 — neither is an
//     ancestor of the bundles' pinned hsmCommit in
//     public/wasm/wasm-provenance.json). Re-add once the bundles are
//     rebuilt from current hsm main.
//   - CKM_AES_CMAC: the Rust engine has no standalone C_SignInit dispatch
//     for it at all today (confirmed via rust/src/ffi.rs — it only appears
//     inside the SP800-108 KDF PRF-selection helpers, never in
//     C_SignInit's own switch) — a genuine capability gap, not staleness.
//   - CKM_SHA224: genuinely cpp-only (confirmed via a full
//     C_GetMechanismList dump from both engines) — Rust's digest coverage
//     is SHA-256/384/512 + SHA3-256/512 + RIPEMD160 only, no SHA-224 and,
//     it turns out, no SHA-1 either (checked as a replacement candidate
//     and also found cpp-only) — there is currently no "extra" digest
//     both engines advertise that ACVP doesn't already cover, so the
//     Digest family has no probe here for now.
// Replaced CMAC/double-pipeline with two mechanisms verified present in
// BOTH engines' CURRENT C_GetMechanismList (no rebuild required) and NOT
// exercised by the ACVP tab: PKCS#7-padded CBC (ACVP's own CKM_AES_CBC
// coverage is deliberately raw/block-aligned only — see hsm_aesDecrypt's
// 'cbc-raw' vs 'cbc' comment) and the legacy arbitrary-length AES key wrap
// (ACVP only exercises CKM_AES_KEY_WRAP + CKM_AES_KEY_WRAP_KWP). Also
// still open: AES-ECB/CCM/XTS/OFB/CFB, AES-GMAC, bare ChaCha20, RSA-AES
// hybrid wrap, CKM_HKDF_DATA as a standalone entry (already exercised via
// the HKDF TLS Token Tier B probes), CKM_SHAKE_256_KEY_DERIVATION — same
// pattern, add on request.

/** CKM_AES_CBC_PAD — PKCS#7-padded CBC (PKCS#11 v3.2 §6.10, RFC 5652
 *  §6.3). ACVP's own CKM_AES_CBC coverage is deliberately the RAW,
 *  block-aligned mechanism only (see hsm_aesDecrypt's own comment: "this is
 *  the mechanism NIST's ACVP-AES-CBC KATs actually test"), so it never
 *  exercises padding/unpadding at all. Real proof: round-trip a
 *  deliberately non-block-aligned (13-byte) plaintext — padding logic is
 *  invisible on block-aligned input, so an aligned plaintext wouldn't
 *  actually test anything CKM_AES_CBC doesn't already cover. */
const aesCbcPadProbe = (ctx: MechanismProbeContext): string => {
  const { M, hSession } = ctx
  const keyHandle = hsm_generateAESKey(M, hSession, 128, true, true, false, false, false, true)
  const plaintext = new TextEncoder().encode('13 raw bytes') // deliberately not a multiple of 16
  if (plaintext.length % 16 === 0) throw new Error('probe bug: plaintext must NOT be block-aligned')

  const { ciphertext, iv } = hsm_aesEncrypt(M, hSession, keyHandle, plaintext, 'cbc')
  const recovered = hsm_aesDecrypt(M, hSession, keyHandle, ciphertext, iv, 'cbc')
  M._C_DestroyObject(hSession, keyHandle)

  if (recovered.length !== plaintext.length)
    throw new Error(
      `recovered ${recovered.length}B, expected ${plaintext.length}B (PKCS#7 unpadding produced the wrong length)`
    )
  for (let i = 0; i < plaintext.length; i++) {
    if (recovered[i] !== plaintext[i])
      throw new Error(`recovered plaintext differs from the original at byte ${i}`)
  }
  return `CKM_AES_CBC_PAD encrypt/decrypt round-trip on a non-block-aligned ${plaintext.length}B plaintext (ciphertext=${ciphertext.length}B, correctly PKCS#7-padded to a 16B multiple) recovered the exact original`
}

/** CKM_AES_KEY_WRAP_PAD — the legacy arbitrary-length AES key wrap
 *  (PKCS#11 v3.2 §6.10.3), distinct from the RFC 5649/SP800-38F
 *  CKM_AES_KEY_WRAP_KWP mechanism ACVP already exercises and from the
 *  block-aligned-only CKM_AES_KEY_WRAP. Real proof: wrap a deliberately
 *  non-8-byte-aligned (20-byte) generic secret under a real AES-256 KEK,
 *  unwrap it, and assert the recovered value is byte-identical. */
const aesKeyWrapPadProbe = (ctx: MechanismProbeContext): string => {
  const { M, hSession } = ctx
  const kekHandle = hsm_generateAESKey(M, hSession, 256, false, false, true, true, false, false)
  const targetBytes = new Uint8Array(20) // deliberately not a multiple of 8
  for (let i = 0; i < targetBytes.length; i++) targetBytes[i] = (i * 53 + 7) & 0xff
  const targetHandle = hsm_importGenericSecret(M, hSession, targetBytes)

  const wrapped = hsm_wrapKeyMech(M, hSession, CKM_AES_KEY_WRAP_PAD, kekHandle, targetHandle)
  M._C_DestroyObject(hSession, targetHandle)

  // CKA_VALUE_LEN deliberately NOT supplied: the C++ engine's C_UnwrapKey
  // routes through the same CreateObject path as C_CreateObject, where
  // CKA_VALUE_LEN is a MUST-NOT attribute (P11Attributes.h's P11AttrValueLen
  // ck2 check — measured: CKR_ATTRIBUTE_READ_ONLY when supplied here). The
  // engine derives the real length itself from the unwrapped, unpadded key
  // data, same as hsm_importGenericSecret already does for C_CreateObject.
  const unwrappedHandle = hsm_unwrapKeyMech(M, hSession, CKM_AES_KEY_WRAP_PAD, kekHandle, wrapped, [
    { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_GENERIC_SECRET },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_SENSITIVE, boolVal: false },
    { type: CKA_EXTRACTABLE, boolVal: true },
  ])
  const recovered = hsm_extractKeyValue(M, hSession, unwrappedHandle)
  M._C_DestroyObject(hSession, unwrappedHandle)
  M._C_DestroyObject(hSession, kekHandle)

  if (recovered.length !== targetBytes.length)
    throw new Error(`recovered ${recovered.length}B, expected ${targetBytes.length}B`)
  for (let i = 0; i < targetBytes.length; i++) {
    if (recovered[i] !== targetBytes[i])
      throw new Error(`unwrapped value differs from the original at byte ${i}`)
  }
  return `CKM_AES_KEY_WRAP_PAD wrap/unwrap round-trip on a non-8-byte-aligned ${targetBytes.length}B secret (wrapped=${wrapped.length}B) recovered the exact original`
}

// A lazy function, not a top-level literal: the production build wraps this
// module's softhsm import in vite-plugin-top-level-await, so a top-level
// literal here would capture every CKM_* mechanism it references as
// `undefined` (assigned only once that chunk's own top-level await resolves,
// which happens AFTER this module's top-level runs). Dev/vitest don't use
// that plugin, so this bug is invisible outside a real production build. See
// pqctoday-priv/design/design_handoff_kmip_pkcs11_playground/GAPS-CLOSEOUT-PLAN-2026-09-02.md §2.1.
export const mechanismProbes = (): MechanismProbe[] => [
  {
    id: 'pqc-seed-mldsa',
    mechanism: CKM_ML_DSA_KEY_PAIR_GEN,
    mechanismName: 'CKM_ML_DSA_KEY_PAIR_GEN (CKA_SEED)',
    family: 'PQC',
    citation: 'PKCS#11 v3.2 §6.67.4 (ML-DSA deterministic key generation)',
    run: deterministicKeygenProbe('ml-dsa', CKM_ML_DSA_KEY_PAIR_GEN, dsaParamSet(65), 32),
  },
  {
    id: 'pqc-seed-mlkem',
    mechanism: CKM_ML_KEM_KEY_PAIR_GEN,
    mechanismName: 'CKM_ML_KEM_KEY_PAIR_GEN (CKA_SEED)',
    family: 'PQC',
    citation: 'PKCS#11 v3.2 §6.68.4 (ML-KEM deterministic key generation, d‖z)',
    run: deterministicKeygenProbe('ml-kem', CKM_ML_KEM_KEY_PAIR_GEN, kemParamSet(768), 64),
  },
  {
    id: 'pqc-seed-slhdsa',
    mechanism: CKM_SLH_DSA_KEY_PAIR_GEN,
    mechanismName: 'CKM_SLH_DSA_KEY_PAIR_GEN (CKA_SEED)',
    family: 'PQC',
    citation:
      'PKCS#11 v3.2 §6.69.2 (SLH-DSA deterministic key generation, SK.seed‖SK.prf‖PK.seed — SLH-DSA-SHA2-128s, n=16, 3n=48B)',
    run: deterministicKeygenProbe('slh-dsa', CKM_SLH_DSA_KEY_PAIR_GEN, CKP_SLH_DSA_SHA2_128S, 48),
  },
  {
    id: 'hybrid-ecdh1-kem',
    mechanism: CKM_ECDH1_DERIVE,
    mechanismName: 'CKM_ECDH1_DERIVE (as C_Encapsulate/DecapsulateKey)',
    family: 'Hybrid KEM',
    citation: 'PKCS#11 v3.2 §6.3.17 Table 78 (ECDH-as-KEM, the classical half of a hybrid KEM)',
    run: hybridEcdhKemProbe,
  },
  {
    id: 'hybrid-concatenate-base-and-key',
    mechanism: CKM_CONCATENATE_BASE_AND_KEY,
    mechanismName: 'CKM_CONCATENATE_BASE_AND_KEY',
    family: 'Hybrid KEM',
    citation:
      'PKCS#11 v2.40 §2.31.3 (the combiner a hybrid KEM would join its two shared secrets with)',
    run: concatenateBaseAndKeyProbe,
  },
  {
    id: 'classical-rsa-pkcs',
    mechanism: CKM_RSA_PKCS,
    mechanismName: 'CKM_RSA_PKCS',
    family: 'Classical Asymmetric',
    citation: 'PKCS#11 v3.2 §6.4.4 (raw PKCS#1 v1.5 sign/verify — no combined hash step)',
    run: (ctx) =>
      rsaSignVerifyRoundTrip(
        ctx,
        CKM_RSA_PKCS,
        'CKM_RSA_PKCS',
        new TextEncoder().encode('Mechanism Coverage probe: raw PKCS#1 v1.5')
      ),
  },
  {
    id: 'classical-rsa-x509',
    mechanism: CKM_RSA_X_509,
    mechanismName: 'CKM_RSA_X_509',
    family: 'Classical Asymmetric',
    citation: 'PKCS#11 v3.2 §6.4.7 (unpadded/textbook RSA — RSASP1/RSAVP1, no padding scheme)',
    run: rsaX509Probe,
  },
  {
    id: 'classical-rsa-hash-sign',
    mechanism: CKM_SHA256_RSA_PKCS,
    mechanismName: 'CKM_SHA256_RSA_PKCS',
    family: 'Classical Asymmetric',
    citation:
      'PKCS#11 v3.2 §6.4.5 (combined hash-then-sign PKCS#1v1.5 — ACVP’s RSA coverage is PSS-only)',
    run: (ctx) =>
      rsaSignVerifyRoundTrip(
        ctx,
        CKM_SHA256_RSA_PKCS,
        'CKM_SHA256_RSA_PKCS',
        new TextEncoder().encode(
          'Mechanism Coverage probe: combined hash-then-sign, arbitrary length message'
        )
      ),
  },
  {
    id: 'classical-ecdsa-raw',
    mechanism: CKM_ECDSA,
    mechanismName: 'CKM_ECDSA (raw, pre-hashed)',
    family: 'Classical Asymmetric',
    citation:
      'PKCS#11 v3.2 §6.3.1 (raw ECDSA — every ACVP ECDSA check uses a combined CKM_ECDSA_SHA* form instead)',
    run: ecdsaRawProbe,
  },
  {
    id: 'classical-ecdh-cofactor',
    mechanism: CKM_ECDH1_COFACTOR_DERIVE,
    mechanismName: 'CKM_ECDH1_COFACTOR_DERIVE',
    family: 'Classical Asymmetric',
    citation: 'PKCS#11 v3.2 §6.3.18 (cofactor ECDH — hsm_ecdhCofactorDerive had zero callers)',
    run: ecdhCofactorProbe,
  },
  {
    id: 'symmetric-aes-cbc-pad',
    mechanism: CKM_AES_CBC_PAD,
    mechanismName: 'CKM_AES_CBC_PAD',
    family: 'Symmetric/AEAD',
    citation:
      'PKCS#11 v3.2 §6.10 (PKCS#7-padded CBC — ACVP’s own CKM_AES_CBC coverage is raw/block-aligned only)',
    run: aesCbcPadProbe,
  },
  {
    id: 'symmetric-aes-key-wrap-pad',
    mechanism: CKM_AES_KEY_WRAP_PAD,
    mechanismName: 'CKM_AES_KEY_WRAP_PAD',
    family: 'Symmetric/AEAD',
    citation:
      'PKCS#11 v3.2 §6.10.3 (legacy arbitrary-length AES key wrap — ACVP only exercises CKM_AES_KEY_WRAP + CKM_AES_KEY_WRAP_KWP)',
    run: aesKeyWrapPadProbe,
  },
]

// ── Orchestrator ─────────────────────────────────────────────────────────

export const runMechanismCoverageProbes = (
  M: SoftHSMModule,
  hSession: number,
  slotId: number,
  mechs: Set<number>
): MechanismProbeResult[] => {
  const ctx: MechanismProbeContext = { M, hSession, slotId, mechs }
  const results: MechanismProbeResult[] = []
  for (const probe of mechanismProbes()) {
    if (!mechs.has(probe.mechanism)) {
      results.push({
        ...probe,
        status: 'not-claimed',
        detail: `engine does not advertise ${probe.mechanismName.split(' ')[0]} in C_GetMechanismList`,
      })
      continue
    }
    try {
      const detail = probe.run(ctx)
      results.push({ ...probe, status: 'pass', detail })
    } catch (e) {
      results.push({
        ...probe,
        status: 'fail',
        detail: e instanceof Error ? e.message : String(e),
      })
    }
  }
  return results
}
