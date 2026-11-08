// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Offline simulation engine for "Exchanging keys with a cloud KMS" (KmsPqc Step 7).
 *
 * Nothing here talks to a cloud provider. Every function runs on the in-browser
 * HSM (the same PKCS#11 engine the other workshop steps use) and models the
 * *shape* of a provider's documented key-import or key-establishment flow:
 * which key goes where, which mechanism wraps it, how many bytes cross the
 * wire, and where the key material sits after each step.
 *
 * Three families of flow:
 *   1. Classical import: RSA key wrap with CKM_RSA_AES_KEY_WRAP (PKCS#11 v3.2),
 *      i.e. RSA-OAEP around a temporary AES key plus AES-KWP (RFC 5649) around
 *      the target key. The hash and the key sizes differ per provider.
 *   2. HPKE import (RFC 9180 base mode, empty info, empty aad): the third party
 *      runs Seal toward the provider's KEM public key and sends `enc || ct`.
 *      Three engines are selectable, reusing HybridCrypto's hpkeService:
 *        'v32'       PKCS#11 v3.2 composed from CKM_ML_KEM, CKM_ECDH1_DERIVE,
 *                    CKM_HKDF_DERIVE and CKM_AES_GCM
 *        'v33'       the v3.3 working draft's CKM_COMP_KEM for the three hybrid
 *                    suites (pure ML-KEM is the same v3.2 mechanism in v3.3)
 *        'candidate' the PQCToday vendor-defined CKM_HPKE (0x80000014), which is
 *                    not allocated by OASIS
 *   3. AWS key establishment: ML-KEM Decapsulate and ECDH DeriveSharedSecret
 *      hand the secret to the caller in plaintext, so the application derives
 *      the key-encryption key itself.
 *
 * Byte sizes are measured from the objects the engine returns, never typed in.
 */
import {
  hsm_generateRandom,
  hsm_generateAESKey,
  hsm_importAESKey,
  hsm_importGenericSecret,
  hsm_extractKeyValue,
  hsm_extractECPoint,
  hsm_extractRSAPublicKeyDer,
  hsm_generateRSAWrapKeyPair,
  hsm_generateMLKEMKeyPair,
  hsm_generateECKeyPair,
  hsm_importMLKEMPublicKey,
  hsm_encapsulate,
  hsm_decapsulate,
  hsm_ecdhDerive,
  hsm_hkdf,
  hsm_wrapKeyMech,
  hsm_unwrapKeyMech,
  hsm_generateHpkeKeyPair,
  hsm_hpkeEncapsulate,
  hsm_hpkeDecapsulate,
  buildMech,
  buildTemplate,
  checkRV,
  writeBytes,
  freeTemplate,
  type AttrDef,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_ENCRYPT,
  CKA_DECRYPT,
  CKA_UNWRAP,
  CKA_VALUE_LEN,
  CKK_AES,
  CKO_SECRET_KEY,
  CKM_SHA256,
  CKM_SHA_1,
  CKM_AES_KEY_WRAP,
  CKM_AES_KEY_WRAP_KWP,
  CKZ_HPKE_MODE_BASE,
} from '@/wasm/softhsm'
import {
  hsm_generateCompositeKeyPair,
  hsm_detectV33Support,
  type CompositeFamily,
} from '@/wasm/softhsm/v33'
import {
  HPKE_AEAD,
  HPKE_KDF,
  HPKE_KEM,
  HPKE_MODE,
  compositeDecap,
  compositeEncap,
  compositeKemCkp,
  hybridDecap,
  hybridEncap,
  kemInfo,
  keyScheduleSecure,
  openHandle,
  pqDecap,
  pqEncap,
  sealHandle,
  stripEcPointDer,
  ecPointRawLen,
  type Hctx,
} from '../../HybridCrypto/services/hpkeService'

export type { Hctx }

// ── Constants that are not exported by the engine facade ─────────────────────

/** PKCS#11 v3.2 CKM_RSA_AES_KEY_WRAP (mechanism table, §6.1.19 in the capability map). */
export const CKM_RSA_AES_KEY_WRAP = 0x00001054
const CKM_RSA_PKCS_OAEP = 0x00000009
const CKG_MGF1_SHA1 = 0x00000001
const CKG_MGF1_SHA256 = 0x00000002
const CKZ_DATA_SPECIFIED = 0x00000001

const allocUlong = (M: Hctx['M']): number => M._malloc(4)
const readUlong = (M: Hctx['M'], ptr: number): number => M.getValue(ptr, 'i32') >>> 0

export const bytesToHex = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')

export const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

const equalBytes = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i])

// ── 1. Classical import: CKM_RSA_AES_KEY_WRAP ────────────────────────────────

export type OaepHash = 'sha1' | 'sha256'

export interface RsaAesWrapOptions {
  /** Size of the temporary AES key that carries the target key (CK_RSA_AES_KEY_WRAP_PARAMS.ulAESKeyBits). */
  aesKeyBits: 128 | 192 | 256
  /** Hash used for both RSA-OAEP and its MGF1. */
  oaepHash: OaepHash
}

/**
 * CK_RSA_AES_KEY_WRAP_PARAMS in the 32-bit WASM heap:
 *   ulAESKeyBits (4 bytes) | pOAEPParams (4-byte pointer) -> CK_RSA_PKCS_OAEP_PARAMS (20 bytes)
 */
function buildRsaAesWrapParams(
  M: Hctx['M'],
  opts: RsaAesWrapOptions
): { ptr: number; len: number; free: () => void } {
  const oaep = M._malloc(20)
  M.setValue(oaep, opts.oaepHash === 'sha1' ? CKM_SHA_1 : CKM_SHA256, 'i32') // hashAlg
  M.setValue(oaep + 4, opts.oaepHash === 'sha1' ? CKG_MGF1_SHA1 : CKG_MGF1_SHA256, 'i32') // mgf
  M.setValue(oaep + 8, CKZ_DATA_SPECIFIED, 'i32') // source
  M.setValue(oaep + 12, 0, 'i32') // pSourceData
  M.setValue(oaep + 16, 0, 'i32') // ulSourceDataLen
  const params = M._malloc(8)
  M.setValue(params, opts.aesKeyBits, 'i32')
  M.setValue(params + 4, oaep, 'i32')
  return {
    ptr: params,
    len: 8,
    free: () => {
      M._free(oaep)
      M._free(params)
    },
  }
}

/** C_WrapKey(CKM_RSA_AES_KEY_WRAP): the third-party HSM wraps a key for the provider's RSA public key. */
export function rsaAesKeyWrap(
  ctx: Hctx,
  wrappingPubHandle: number,
  targetHandle: number,
  opts: RsaAesWrapOptions
): Uint8Array {
  const { M, hSession } = ctx
  const p = buildRsaAesWrapParams(M, opts)
  const mech = buildMech(M, CKM_RSA_AES_KEY_WRAP, p.ptr, p.len)
  const lenPtr = allocUlong(M)
  let outPtr = 0
  try {
    checkRV(
      M._C_WrapKey(hSession, mech, wrappingPubHandle, targetHandle, 0, lenPtr),
      'C_WrapKey(CKM_RSA_AES_KEY_WRAP,len)'
    )
    const len = readUlong(M, lenPtr)
    outPtr = M._malloc(len)
    M.setValue(lenPtr, len, 'i32')
    checkRV(
      M._C_WrapKey(hSession, mech, wrappingPubHandle, targetHandle, outPtr, lenPtr),
      'C_WrapKey(CKM_RSA_AES_KEY_WRAP)'
    )
    return M.HEAPU8.slice(outPtr, outPtr + readUlong(M, lenPtr))
  } finally {
    p.free()
    M._free(mech)
    M._free(lenPtr)
    if (outPtr) M._free(outPtr)
  }
}

const importedAesTemplate = (keyBits: 128 | 192 | 256, canUnwrap = false): AttrDef[] => [
  { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
  { type: CKA_KEY_TYPE, ulongVal: CKK_AES },
  { type: CKA_TOKEN, boolVal: false },
  { type: CKA_SENSITIVE, boolVal: false },
  { type: CKA_EXTRACTABLE, boolVal: true },
  { type: CKA_ENCRYPT, boolVal: true },
  { type: CKA_DECRYPT, boolVal: true },
  { type: CKA_VALUE_LEN, ulongVal: keyBits / 8 },
  ...(canUnwrap ? [{ type: CKA_UNWRAP, boolVal: true } as AttrDef] : []),
]

/** C_UnwrapKey(CKM_RSA_AES_KEY_WRAP): the provider recovers the key inside its HSM. Returns the new key handle. */
export function rsaAesKeyUnwrap(
  ctx: Hctx,
  privHandle: number,
  wrapped: Uint8Array,
  opts: RsaAesWrapOptions,
  importedKeyBits: 128 | 192 | 256 = 256
): number {
  const { M, hSession } = ctx
  const p = buildRsaAesWrapParams(M, opts)
  const mech = buildMech(M, CKM_RSA_AES_KEY_WRAP, p.ptr, p.len)
  const wrappedPtr = writeBytes(M, wrapped)
  const template = importedAesTemplate(importedKeyBits)
  const tpl = buildTemplate(M, template)
  const phKey = allocUlong(M)
  try {
    checkRV(
      M._C_UnwrapKey(
        hSession,
        mech,
        privHandle,
        wrappedPtr,
        wrapped.length,
        tpl.ptr,
        template.length,
        phKey
      ),
      'C_UnwrapKey(CKM_RSA_AES_KEY_WRAP)'
    )
    return readUlong(M, phKey)
  } finally {
    p.free()
    M._free(mech)
    M._free(wrappedPtr)
    freeTemplate(M, tpl, template.length)
    M._free(phKey)
  }
}

export interface ClassicalImportProfile {
  /** Display name of the provider's wrapping choice (the API enum the provider documents). */
  rsaBits: 2048 | 3072 | 4096
  aesKeyBits: 128 | 192 | 256
  oaepHash: OaepHash
}

/**
 * The wrapping choices each provider's classical flow models in this simulation:
 * RSA modulus size, temporary AES key size and the OAEP hash.
 */
export const CLASSICAL_PROFILES: Record<'aws' | 'gcp' | 'azure', ClassicalImportProfile> = {
  aws: { rsaBits: 3072, aesKeyBits: 256, oaepHash: 'sha256' },
  gcp: { rsaBits: 3072, aesKeyBits: 256, oaepHash: 'sha256' },
  azure: { rsaBits: 3072, aesKeyBits: 256, oaepHash: 'sha1' },
}

/** The provider's RSA wrapping key pair, with the public half exported as DER RSAPublicKey (RFC 8017 A.1.1). */
export function generateWrappingKeyPair(
  ctx: Hctx,
  bits: 2048 | 3072 | 4096
): { pubHandle: number; privHandle: number; publicKeyDer: Uint8Array } {
  const kp = hsm_generateRSAWrapKeyPair(ctx.M, ctx.hSession, bits)
  return { ...kp, publicKeyDer: hsm_extractRSAPublicKeyDer(ctx.M, ctx.hSession, kp.pubHandle) }
}

type WrappingKeyPair = ReturnType<typeof generateWrappingKeyPair>
// Generating an RSA-3072 key in WebAssembly takes several seconds, so one pair is kept per
// HSM session and reused by later runs. A handle that no longer resolves (the session was
// closed and reopened) is detected and the pair is generated again.
const wrappingKeyCache = new WeakMap<object, Map<string, WrappingKeyPair>>()

export function getWrappingKeyPair(
  ctx: Hctx,
  bits: 2048 | 3072 | 4096
): WrappingKeyPair & { reused: boolean } {
  let perModule = wrappingKeyCache.get(ctx.M)
  if (!perModule) {
    perModule = new Map()
    wrappingKeyCache.set(ctx.M, perModule)
  }
  const id = `${ctx.hSession}:${bits}`
  const cached = perModule.get(id)
  if (cached) {
    try {
      hsm_extractRSAPublicKeyDer(ctx.M, ctx.hSession, cached.pubHandle)
      return { ...cached, reused: true }
    } catch {
      perModule.delete(id)
    }
  }
  const fresh = generateWrappingKeyPair(ctx, bits)
  perModule.set(id, fresh)
  return { ...fresh, reused: false }
}

export interface ClassicalImportResult {
  profile: ClassicalImportProfile
  /** True when the RSA wrapping key pair came from an earlier run in this HSM session. */
  rsaKeyReused: boolean
  /** Length of the wrapping public modulus in bytes (the RSA-OAEP part of the blob). */
  rsaPartBytes: number
  /** Length of the AES-KWP part of the blob (RFC 5649 pads and adds an 8-byte header). */
  kwpPartBytes: number
  wrappedBytes: number
  wrapped: Uint8Array
  /** The key material the third party wanted to import. */
  sourceKey: Uint8Array
  /** What the provider's HSM holds after unwrap. */
  importedKey: Uint8Array
  matches: boolean
  /** Whether the blob splits as expected: RSA-OAEP(temp AES key) ‖ AES-KWP(target). */
  structureVerified: boolean
}

/**
 * Whole classical import, both sides: provider generates the RSA wrapping key
 * pair, the third-party HSM wraps a fresh AES-256 key under the public half, the
 * provider unwraps it. The structure check decrypts the RSA part and unwraps the
 * AES-KWP part by hand, so it does not rely on the combined mechanism agreeing
 * with itself.
 */
export function runClassicalImport(
  ctx: Hctx,
  profile: ClassicalImportProfile
): ClassicalImportResult {
  const { M, hSession } = ctx
  // Provider side: wrapping key pair (public half is what GetParametersForImport / the KEK download / the import job returns).
  const rsa = getWrappingKeyPair(ctx, profile.rsaBits)
  // Third-party HSM: the key to be exported. Extractable only because CKM_RSA_AES_KEY_WRAP wraps an extractable key.
  const source = hsm_generateAESKey(M, hSession, 256)
  const sourceKey = hsm_extractKeyValue(M, hSession, source)

  const opts: RsaAesWrapOptions = { aesKeyBits: profile.aesKeyBits, oaepHash: profile.oaepHash }
  const wrapped = rsaAesKeyWrap(ctx, rsa.pubHandle, source, opts)
  const rsaPartBytes = profile.rsaBits / 8
  const kwpPartBytes = wrapped.length - rsaPartBytes

  const imported = rsaAesKeyUnwrap(ctx, rsa.privHandle, wrapped, opts, 256)
  const importedKey = hsm_extractKeyValue(M, hSession, imported)

  // Independent structure check: split the blob, undo the RSA part with RSA-OAEP, then AES-KWP the rest.
  let structureVerified = false
  try {
    const rsaPart = wrapped.slice(0, rsaPartBytes)
    const kwpPart = wrapped.slice(rsaPartBytes)
    const tempAes = rsaOaepDecryptToKey(ctx, rsa.privHandle, rsaPart, opts)
    const inner = hsm_unwrapKeyMech(
      M,
      hSession,
      CKM_AES_KEY_WRAP_KWP,
      tempAes,
      kwpPart,
      importedAesTemplate(256)
    )
    structureVerified =
      equalBytes(hsm_extractKeyValue(M, hSession, inner), sourceKey) &&
      hsm_extractKeyValue(M, hSession, tempAes).length === profile.aesKeyBits / 8
  } catch {
    structureVerified = false
  }

  return {
    profile,
    rsaKeyReused: rsa.reused,
    rsaPartBytes,
    kwpPartBytes,
    wrappedBytes: wrapped.length,
    wrapped,
    sourceKey,
    importedKey,
    matches: equalBytes(sourceKey, importedKey),
    structureVerified,
  }
}

/** RSA-OAEP decrypt of the RSA part, returned as an AES key handle (C_UnwrapKey with plain CKM_RSA_PKCS_OAEP). */
function rsaOaepDecryptToKey(
  ctx: Hctx,
  privHandle: number,
  rsaPart: Uint8Array,
  opts: RsaAesWrapOptions
): number {
  const { M, hSession } = ctx
  const oaep = M._malloc(20)
  M.setValue(oaep, opts.oaepHash === 'sha1' ? CKM_SHA_1 : CKM_SHA256, 'i32')
  M.setValue(oaep + 4, opts.oaepHash === 'sha1' ? CKG_MGF1_SHA1 : CKG_MGF1_SHA256, 'i32')
  M.setValue(oaep + 8, CKZ_DATA_SPECIFIED, 'i32')
  M.setValue(oaep + 12, 0, 'i32')
  M.setValue(oaep + 16, 0, 'i32')
  const mech = buildMech(M, CKM_RSA_PKCS_OAEP, oaep, 20)
  const wrappedPtr = writeBytes(M, rsaPart)
  // The temporary AES key must be allowed to unwrap, because the next step uses it as the AES-KWP key.
  const template = importedAesTemplate(opts.aesKeyBits, true)
  const tpl = buildTemplate(M, template)
  const phKey = allocUlong(M)
  try {
    checkRV(
      M._C_UnwrapKey(
        hSession,
        mech,
        privHandle,
        wrappedPtr,
        rsaPart.length,
        tpl.ptr,
        template.length,
        phKey
      ),
      'C_UnwrapKey(CKM_RSA_PKCS_OAEP)'
    )
    return readUlong(M, phKey)
  } finally {
    M._free(oaep)
    M._free(mech)
    M._free(wrappedPtr)
    freeTemplate(M, tpl, template.length)
    M._free(phKey)
  }
}

// ── 2. HPKE import (RFC 9180 base mode) with three engines ───────────────────

export type HpkeEngine = 'v32' | 'v33' | 'candidate'

export const HPKE_ENGINE_LABEL: Record<HpkeEngine, string> = {
  v32: 'PKCS#11 v3.2 (composed)',
  v33: 'PKCS#11 v3.3 draft (CKM_COMP_KEM)',
  candidate: 'PQCToday candidate CKM_HPKE',
}

export interface HpkeImportSuite {
  id: 'xwing' | 'mlkem768' | 'mlkem1024'
  /** The provider's enum for this suite (Google Cloud KMS import job). */
  apiName: string
  kemId: number
  kdfId: number
  aeadId: number
  label: string
}

/** The three suites the plan lists for Google's quantum-safe import. */
export const HPKE_IMPORT_SUITES: readonly HpkeImportSuite[] = [
  {
    id: 'xwing',
    apiName: 'HPKE_KEM_XWING_HKDF_SHA256_AES_256_GCM',
    kemId: HPKE_KEM.MLKEM768_X25519,
    kdfId: HPKE_KDF.HKDF_SHA256,
    aeadId: HPKE_AEAD.AES_256_GCM,
    label: 'X-Wing (ML-KEM-768 + X25519)',
  },
  {
    id: 'mlkem768',
    apiName: 'HPKE_KEM_ML_KEM_768_HKDF_SHA256_AES_256_GCM',
    kemId: HPKE_KEM.MLKEM768,
    kdfId: HPKE_KDF.HKDF_SHA256,
    aeadId: HPKE_AEAD.AES_256_GCM,
    label: 'ML-KEM-768',
  },
  {
    id: 'mlkem1024',
    apiName: 'HPKE_KEM_ML_KEM_1024_HKDF_SHA256_AES_256_GCM',
    kemId: HPKE_KEM.MLKEM1024,
    kdfId: HPKE_KDF.HKDF_SHA256,
    aeadId: HPKE_AEAD.AES_256_GCM,
    label: 'ML-KEM-1024',
  },
]

export const suiteById = (id: HpkeImportSuite['id']): HpkeImportSuite => {
  const s = HPKE_IMPORT_SUITES.find((x) => x.id === id)
  if (!s) throw new Error(`Unknown HPKE import suite: ${id}`)
  return s
}

/** Empty info and empty aad: the base-mode, empty-context Seal the plan describes for Google's import. */
const EMPTY = new Uint8Array(0)

export interface HpkeRecipient {
  engine: HpkeEngine
  suite: HpkeImportSuite
  /** The public key the provider publishes (CKA_VALUE of the public key object): ek_H for the hybrid, ek for ML-KEM. */
  publicKey: Uint8Array
  /** Handle to the public key object when the engine keeps one (v3.3 composite key, CKM_HPKE key). */
  publicHandle?: number
  /** Open `enc || ct` into the key material, returning the PKCS#11 mechanisms used. */
  open: (enc: Uint8Array, ct: Uint8Array) => { plaintext: Uint8Array; mechanisms: string[] }
  /** Mechanisms used to generate the key pair. */
  keygenMechanisms: string[]
}

const isPure = (suite: HpkeImportSuite): boolean => kemInfo(suite.kemId).kind === 'pq'

/** What the loaded engine supports for the v3.3 sequence; the workshop asks it, never assumes. */
export function v33Supported(ctx: Hctx, slotId: number): boolean {
  try {
    return hsm_detectV33Support(ctx.M, slotId).compKem
  } catch {
    return false
  }
}

/**
 * The effective sequence for a suite: pure ML-KEM has no v3.3 composite
 * mechanism (the draft uses the v3.2 CKM_ML_KEM for it), so 'v33' on a pure
 * suite runs the v3.2 sequence and says so.
 */
export function effectiveEngine(engine: HpkeEngine, suite: HpkeImportSuite): HpkeEngine {
  return engine === 'v33' && isPure(suite) ? 'v32' : engine
}

export function hpkeEngineNote(engine: HpkeEngine, suite: HpkeImportSuite): string | undefined {
  if (engine === 'v33' && isPure(suite)) {
    return 'Pure ML-KEM uses the same CKM_ML_KEM mechanism in the v3.3 draft as in v3.2, so this run is identical to the v3.2 run. The v3.3 draft adds CKM_COMP_KEM for the hybrid suites only.'
  }
  return undefined
}

/** The provider-side key objects an Open needs, whichever engine made them. */
export interface HpkeRecipientKeys {
  /** candidate: the CKK_HPKE_KEM private key. v3.3: the composite private key. v3.2 pure ML-KEM: the ML-KEM private key. */
  privHandle?: number
  /** v3.2 hybrid: the ML-KEM and traditional private keys, and the published ek_H. */
  dkPQHandle?: number
  dkTHandle?: number
  ekH?: Uint8Array
}

export interface HpkeOpenOptions {
  /** HPKE info, empty for the key-import message. */
  info?: Uint8Array
  /** AEAD associated data, empty for the key-import message. */
  aad?: Uint8Array
  /** Message sequence number; the first message is 0. */
  seq?: number
}

const need = (v: number | undefined, what: string): number => {
  if (v === undefined) throw new Error(`Missing ${what} for this engine.`)
  return v
}

/**
 * Provider side of HPKE Open (RFC 9180 base mode): decapsulate `enc`, run the key
 * schedule and open `ct`. The engine decides which PKCS#11 mechanisms do the work.
 * Info and aad default to empty, which is what the key-import message uses.
 */
export function hpkeOpenWith(
  ctx: Hctx,
  engine: HpkeEngine,
  suite: HpkeImportSuite,
  keys: HpkeRecipientKeys,
  enc: Uint8Array,
  ct: Uint8Array,
  opts: HpkeOpenOptions = {}
): { plaintext: Uint8Array; mechanisms: string[] } {
  const { M, hSession } = ctx
  const info = opts.info ?? EMPTY
  const aad = opts.aad ?? EMPTY
  const seq = opts.seq ?? 0
  const eff = effectiveEngine(engine, suite)
  const kem = kemInfo(suite.kemId)

  if (eff === 'candidate') {
    const r = hsm_hpkeDecapsulate(M, hSession, need(keys.privHandle, 'CKM_HPKE private key'), enc, {
      kemId: suite.kemId,
      kdfId: suite.kdfId,
      aeadId: suite.aeadId,
      mode: CKZ_HPKE_MODE_BASE,
      info,
    })
    if (r.keyHandle == null || r.baseNonce == null) {
      throw new Error('CKM_HPKE Decap returned no AEAD key handle.')
    }
    return {
      plaintext: openHandle(ctx, r.keyHandle, suite.aeadId, r.baseNonce, seq, aad, ct),
      mechanisms: ['C_DecapsulateKey(CKM_HPKE) incl. KeySchedule', 'CKM_AES_GCM (Open)'],
    }
  }

  let ss: number
  let kemMechanisms: string[]
  if (eff === 'v33') {
    ss = compositeDecap(ctx, need(keys.privHandle, 'composite private key'), enc)
    kemMechanisms = ['C_DecapsulateKey(CKM_COMP_KEM)']
  } else if (kem.kind === 'pq') {
    ss = pqDecap(ctx, suite.kemId, enc, need(keys.privHandle, 'ML-KEM private key'))
    kemMechanisms = ['C_DecapsulateKey(CKM_ML_KEM)']
  } else {
    if (!keys.ekH) throw new Error('Missing ek_H for the composed hybrid Open.')
    ss = hybridDecap(
      ctx,
      suite.kemId,
      enc,
      need(keys.dkPQHandle, 'ML-KEM private key'),
      need(keys.dkTHandle, 'traditional private key'),
      keys.ekH
    )
    kemMechanisms = [
      'C_DecapsulateKey(CKM_ML_KEM)',
      'C_DeriveKey(CKM_ECDH1_DERIVE)',
      'CKM_CONCATENATE_BASE_AND_KEY/_DATA + CKM_SHA3_256_KEY_DERIVATION',
    ]
  }
  const ks = keyScheduleSecure(
    ctx,
    HPKE_MODE.BASE,
    suite.kemId,
    suite.kdfId,
    suite.aeadId,
    ss,
    info
  )
  return {
    plaintext: openHandle(ctx, ks.keyHandle!, suite.aeadId, ks.baseNonce!, seq, aad, ct),
    mechanisms: [...kemMechanisms, 'CKM_HKDF_DERIVE (KeySchedule)', 'CKM_AES_GCM (Open)'],
  }
}

export function createHpkeRecipient(
  ctx: Hctx,
  engine: HpkeEngine,
  suite: HpkeImportSuite
): HpkeRecipient {
  const { M, hSession } = ctx
  const eff = effectiveEngine(engine, suite)
  const kem = kemInfo(suite.kemId)
  const base = { engine, suite }

  if (eff === 'candidate') {
    const kp = hsm_generateHpkeKeyPair(M, hSession, suite.kemId)
    return {
      ...base,
      publicKey: hsm_extractKeyValue(M, hSession, kp.pubHandle),
      publicHandle: kp.pubHandle,
      keygenMechanisms: ['CKM_HPKE_KEM_KEY_PAIR_GEN (candidate)'],
      open: (enc, ct) => hpkeOpenWith(ctx, engine, suite, { privHandle: kp.privHandle }, enc, ct),
    }
  }

  if (eff === 'v33') {
    const ckp = compositeKemCkp(suite.kemId)
    if (ckp === undefined) throw new Error('The v3.3 draft sequence needs a hybrid suite.')
    const kp = hsm_generateCompositeKeyPair(M, hSession, 'kem' as CompositeFamily, ckp)
    return {
      ...base,
      publicKey: hsm_extractKeyValue(M, hSession, kp.pubHandle),
      publicHandle: kp.pubHandle,
      keygenMechanisms: ['CKM_COMP_KEM_KEY_PAIR_GEN (v3.3 draft)'],
      open: (enc, ct) => hpkeOpenWith(ctx, engine, suite, { privHandle: kp.privHandle }, enc, ct),
    }
  }

  // 'v32': composed from PKCS#11 v3.2 primitives.
  if (kem.kind === 'pq') {
    const kp = hsm_generateMLKEMKeyPair(M, hSession, kem.pqVariant, true, 'KMS import recipient')
    return {
      ...base,
      publicKey: hsm_extractKeyValue(M, hSession, kp.pubHandle),
      publicHandle: kp.pubHandle,
      keygenMechanisms: ['CKM_ML_KEM_KEY_PAIR_GEN'],
      open: (enc, ct) => hpkeOpenWith(ctx, engine, suite, { privHandle: kp.privHandle }, enc, ct),
    }
  }
  if (kem.kind !== 'hybrid') throw new Error('Unsupported HPKE import suite.')
  const mlkem = hsm_generateMLKEMKeyPair(M, hSession, kem.pqVariant, true, 'KMS import recipient')
  const ec = hsm_generateECKeyPair(M, hSession, kem.curve, false, 'KMS import recipient EC')
  const ekPQ = hsm_extractKeyValue(M, hSession, mlkem.pubHandle)
  const rawEc = hsm_extractECPoint(M, hSession, ec.pubHandle)
  const ekT = kem.curve === 'X25519' ? rawEc : stripEcPointDer(rawEc, ecPointRawLen(kem.curve))
  const ekH = concat(ekPQ, ekT)
  return {
    ...base,
    publicKey: ekH,
    keygenMechanisms: [
      'CKM_ML_KEM_KEY_PAIR_GEN',
      'CKM_EC_KEY_PAIR_GEN / CKM_EC_MONTGOMERY_KEY_PAIR_GEN',
    ],
    open: (enc, ct) =>
      hpkeOpenWith(
        ctx,
        engine,
        suite,
        { dkPQHandle: mlkem.privHandle, dkTHandle: ec.privHandle, ekH },
        enc,
        ct
      ),
  }
}

export interface HpkeSealed {
  enc: Uint8Array
  ct: Uint8Array
  mechanisms: string[]
}

/**
 * Third-party HSM side: HPKE Seal (RFC 9180 base mode, empty info, empty aad)
 * of the key material toward the provider's public key.
 * A sender engine can only seal toward a recipient it can address: 'v32' works
 * from the public key bytes alone; 'v33' and 'candidate' need the recipient's
 * key object, so they pair with a recipient from the same engine.
 */
export function hpkeSealKey(
  ctx: Hctx,
  senderEngine: HpkeEngine,
  recipient: HpkeRecipient,
  keyMaterial: Uint8Array
): HpkeSealed {
  const { M, hSession } = ctx
  const suite = recipient.suite
  const eff = effectiveEngine(senderEngine, suite)
  const recipientEff = effectiveEngine(recipient.engine, suite)

  if (eff === 'candidate') {
    if (recipientEff !== 'candidate' || recipient.publicHandle === undefined) {
      throw new Error('The CKM_HPKE sender needs a CKM_HPKE recipient key object.')
    }
    const r = hsm_hpkeEncapsulate(M, hSession, recipient.publicHandle, {
      kemId: suite.kemId,
      kdfId: suite.kdfId,
      aeadId: suite.aeadId,
      mode: CKZ_HPKE_MODE_BASE,
      info: EMPTY,
    })
    if (r.keyHandle == null || r.baseNonce == null) {
      throw new Error('CKM_HPKE Encap returned no AEAD key handle.')
    }
    const { ct } = sealHandle(ctx, r.keyHandle, suite.aeadId, r.baseNonce, 0, EMPTY, keyMaterial)
    return {
      enc: r.enc,
      ct,
      mechanisms: ['C_EncapsulateKey(CKM_HPKE) incl. KeySchedule', 'CKM_AES_GCM (Seal)'],
    }
  }

  if (eff === 'v33') {
    if (recipientEff !== 'v33' || recipient.publicHandle === undefined) {
      throw new Error('The CKM_COMP_KEM sender needs a composite recipient key object.')
    }
    const { sharedSecretHandle, enc } = compositeEncap(ctx, recipient.publicHandle)
    const ks = keyScheduleSecure(
      ctx,
      HPKE_MODE.BASE,
      suite.kemId,
      suite.kdfId,
      suite.aeadId,
      sharedSecretHandle,
      EMPTY
    )
    const { ct } = sealHandle(
      ctx,
      ks.keyHandle!,
      suite.aeadId,
      ks.baseNonce!,
      0,
      EMPTY,
      keyMaterial
    )
    return {
      enc,
      ct,
      mechanisms: [
        'C_EncapsulateKey(CKM_COMP_KEM)',
        'CKM_HKDF_DERIVE (KeySchedule)',
        'CKM_AES_GCM (Seal)',
      ],
    }
  }

  // 'v32'
  const info = kemInfo(suite.kemId)
  if (info.kind === 'pq') {
    const { sharedSecretHandle, enc } = pqEncap(ctx, suite.kemId, recipient.publicKey)
    const ks = keyScheduleSecure(
      ctx,
      HPKE_MODE.BASE,
      suite.kemId,
      suite.kdfId,
      suite.aeadId,
      sharedSecretHandle,
      EMPTY
    )
    const { ct } = sealHandle(
      ctx,
      ks.keyHandle!,
      suite.aeadId,
      ks.baseNonce!,
      0,
      EMPTY,
      keyMaterial
    )
    return {
      enc,
      ct,
      mechanisms: ['C_EncapsulateKey(CKM_ML_KEM)', 'CKM_HKDF_DERIVE', 'CKM_AES_GCM (Seal)'],
    }
  }
  const { sharedSecretHandle, enc } = hybridEncap(ctx, suite.kemId, recipient.publicKey)
  const ks = keyScheduleSecure(
    ctx,
    HPKE_MODE.BASE,
    suite.kemId,
    suite.kdfId,
    suite.aeadId,
    sharedSecretHandle,
    EMPTY
  )
  const { ct } = sealHandle(ctx, ks.keyHandle!, suite.aeadId, ks.baseNonce!, 0, EMPTY, keyMaterial)
  return {
    enc,
    ct,
    mechanisms: [
      'C_EncapsulateKey(CKM_ML_KEM)',
      'C_DeriveKey(CKM_ECDH1_DERIVE)',
      'CKM_CONCATENATE_BASE_AND_KEY/_DATA + CKM_SHA3_256_KEY_DERIVATION',
      'CKM_HKDF_DERIVE',
      'CKM_AES_GCM (Seal)',
    ],
  }
}

export interface HpkeImportResult {
  suite: HpkeImportSuite
  /** Provider (recipient) engine. */
  engine: HpkeEngine
  /** Third-party HSM (sender) engine. */
  senderEngine: HpkeEngine
  note?: string
  publicKeyBytes: number
  encBytes: number
  ctBytes: number
  /** Length of `enc || ct`, the value sent to the provider. */
  wireBytes: number
  /** The AEAD tag adds this many bytes to the key material. */
  overheadBytes: number
  enc: Uint8Array
  ct: Uint8Array
  wire: Uint8Array
  keyMaterial: Uint8Array
  recovered: Uint8Array
  matches: boolean
  keygenMechanisms: string[]
  sealMechanisms: string[]
  openMechanisms: string[]
}

/** One whole HPKE import: provider key pair, third-party Seal, provider Open. */
export function runHpkeImport(
  ctx: Hctx,
  opts: {
    engine: HpkeEngine
    /** Defaults to `engine`. A v3.2 sender can seal toward a recipient of any engine; other pairs must match. */
    senderEngine?: HpkeEngine
    suite: HpkeImportSuite
    keyMaterial?: Uint8Array
  }
): HpkeImportResult {
  const { M, hSession } = ctx
  const senderEngine = opts.senderEngine ?? opts.engine
  const keyMaterial = opts.keyMaterial ?? hsm_generateRandom(M, hSession, 32)
  const recipient = createHpkeRecipient(ctx, opts.engine, opts.suite)
  const sealed = hpkeSealKey(ctx, senderEngine, recipient, keyMaterial)
  const opened = recipient.open(sealed.enc, sealed.ct)
  const wire = concat(sealed.enc, sealed.ct)
  return {
    suite: opts.suite,
    engine: opts.engine,
    senderEngine,
    note: hpkeEngineNote(opts.engine, opts.suite),
    publicKeyBytes: recipient.publicKey.length,
    encBytes: sealed.enc.length,
    ctBytes: sealed.ct.length,
    wireBytes: wire.length,
    overheadBytes: sealed.ct.length - keyMaterial.length,
    enc: sealed.enc,
    ct: sealed.ct,
    wire,
    keyMaterial,
    recovered: opened.plaintext,
    matches: equalBytes(keyMaterial, opened.plaintext),
    keygenMechanisms: recipient.keygenMechanisms,
    sealMechanisms: sealed.mechanisms,
    openMechanisms: opened.mechanisms,
  }
}

// ── 3. AWS key establishment: the secret reaches the caller ──────────────────

export interface KekDerivation {
  kek: Uint8Array
  /** What went into the KDF, in order, for display. */
  inputs: string[]
}

/** HKDF-SHA-256 (RFC 5869, the extract-then-expand shape SP 800-56C describes) to a 32-byte key-encryption key. */
function deriveKek(ctx: Hctx, ikm: Uint8Array, info: Uint8Array): Uint8Array {
  const base = hsm_importGenericSecret(ctx.M, ctx.hSession, ikm)
  return hsm_hkdf(ctx.M, ctx.hSession, base, CKM_SHA256, true, true, undefined, info, 32)
}

/** AES-KW (RFC 3394) wrap of a key, via C_WrapKey(CKM_AES_KEY_WRAP). */
export function aesKwWrap(ctx: Hctx, kek: Uint8Array, target: Uint8Array): Uint8Array {
  const wrapKey = hsm_importAESKey(ctx.M, ctx.hSession, kek)
  const targetKey = hsm_importAESKey(ctx.M, ctx.hSession, target)
  return hsm_wrapKeyMech(ctx.M, ctx.hSession, CKM_AES_KEY_WRAP, wrapKey, targetKey)
}

/** AES-KW (RFC 3394) unwrap, returning the key bytes. */
export function aesKwUnwrap(ctx: Hctx, kek: Uint8Array, wrapped: Uint8Array): Uint8Array {
  const wrapKey = hsm_importAESKey(ctx.M, ctx.hSession, kek)
  const h = hsm_unwrapKeyMech(
    ctx.M,
    ctx.hSession,
    CKM_AES_KEY_WRAP,
    wrapKey,
    wrapped,
    importedAesTemplate(256)
  )
  return hsm_extractKeyValue(ctx.M, ctx.hSession, h)
}

/**
 * AES-KWP (RFC 5649 / SP 800-38F) wrap of arbitrary-length key material, via
 * C_WrapKey(CKM_AES_KEY_WRAP_KWP). This is the inner wrap of CKM_RSA_AES_KEY_WRAP.
 */
export function aesKwpWrap(ctx: Hctx, kek: Uint8Array, target: Uint8Array): Uint8Array {
  const wrapKey = hsm_importAESKey(ctx.M, ctx.hSession, kek)
  const targetKey = hsm_importGenericSecret(ctx.M, ctx.hSession, target)
  return hsm_wrapKeyMech(ctx.M, ctx.hSession, CKM_AES_KEY_WRAP_KWP, wrapKey, targetKey)
}

export type MlKemVariant = 512 | 768 | 1024

export interface AwsMlKemResult {
  variant: MlKemVariant
  /** Ciphertext the partner sends (kept so a test can decapsulate it independently). */
  ciphertext: Uint8Array
  encapsulationKey: Uint8Array
  /** GetPublicKey output (the encapsulation key). */
  encapsulationKeyBytes: number
  /** What the partner sends to AWS. */
  ciphertextBytes: number
  /** Decapsulate output as released to the caller. */
  secretReturnedToCaller: Uint8Array
  /** The partner's own copy of the secret from local encapsulation. */
  partnerSecret: Uint8Array
  secretsMatch: boolean
  kekDerivationInfo: string
  wrapped: Uint8Array
  wrappedBytes: number
  sourceKey: Uint8Array
  unwrappedAtApplication: Uint8Array
  matches: boolean
}

export const HKDF_INFO_MLKEM = new TextEncoder().encode('cloud-kms-exchange ML-KEM KEK')
export const HKDF_INFO_HYBRID = new TextEncoder().encode('cloud-kms-exchange hybrid KEK')

/**
 * AWS ML-KEM key establishment. Provider key = ML-KEM key in the HSM. The
 * partner encapsulates to the public key; Decapsulate returns the 32-byte
 * secret to the caller in plaintext (the call that reads it is the one that
 * moves it out of the HSM boundary). The secret cannot become a KMS key, so the
 * application derives a key-encryption key and wraps the target with AES-KW.
 */
export function runAwsMlKemEstablishment(ctx: Hctx, variant: MlKemVariant = 768): AwsMlKemResult {
  const { M, hSession } = ctx
  // AWS side: the ML-KEM KMS key (private half never leaves).
  const kms = hsm_generateMLKEMKeyPair(M, hSession, variant, false, 'KMS ML-KEM key')
  // GetPublicKey -> partner.
  const ek = hsm_extractKeyValue(M, hSession, kms.pubHandle)
  // Partner HSM: encapsulate locally to that public key.
  const partnerPub = importMlKemPublic(ctx, variant, ek)
  const enc = hsm_encapsulate(M, hSession, partnerPub, variant, true)
  const partnerSecret = hsm_extractKeyValue(M, hSession, enc.secretHandle)
  // AWS KMS Decapsulate: the secret is returned to the caller.
  const dec = hsm_decapsulate(M, hSession, kms.privHandle, enc.ciphertextBytes, variant, true)
  const secretReturnedToCaller = hsm_extractKeyValue(M, hSession, dec)

  const sourceKey = hsm_generateRandom(M, hSession, 32)
  const kekPartner = deriveKek(ctx, partnerSecret, HKDF_INFO_MLKEM)
  const wrapped = aesKwWrap(ctx, kekPartner, sourceKey)
  const kekApp = deriveKek(ctx, secretReturnedToCaller, HKDF_INFO_MLKEM)
  const unwrappedAtApplication = aesKwUnwrap(ctx, kekApp, wrapped)

  return {
    variant,
    ciphertext: enc.ciphertextBytes,
    encapsulationKey: ek,
    encapsulationKeyBytes: ek.length,
    ciphertextBytes: enc.ciphertextBytes.length,
    secretReturnedToCaller,
    partnerSecret,
    secretsMatch: equalBytes(partnerSecret, secretReturnedToCaller),
    kekDerivationInfo: 'HKDF-SHA-256(secret, info = "cloud-kms-exchange ML-KEM KEK") -> 32 bytes',
    wrapped,
    wrappedBytes: wrapped.length,
    sourceKey,
    unwrappedAtApplication,
    matches: equalBytes(sourceKey, unwrappedAtApplication),
  }
}

/** Import an ML-KEM encapsulation key as a public key object (what the partner HSM holds after GetPublicKey). */
function importMlKemPublic(ctx: Hctx, variant: MlKemVariant, ek: Uint8Array): number {
  return hsm_importMLKEMPublicKey(ctx.M, ctx.hSession, variant, ek)
}

export interface AwsHybridResult {
  variant: MlKemVariant
  curve: 'P-256'
  /** The two secrets as released to the caller (kept so a test can recompute the KEK independently). */
  mlkemSecret: Uint8Array
  ecdhSecret: Uint8Array
  /** DeriveSharedSecret output: the raw ECDH secret, released to the caller. */
  ecdhSecretBytes: number
  /** Decapsulate output released to the caller. */
  mlkemSecretBytes: number
  ecdhSecretsMatch: boolean
  mlkemSecretsMatch: boolean
  /** ML-KEM secret first, then the ECDH secret. */
  combinerInputOrder: string[]
  kekDerivationInfo: string
  wrapped: Uint8Array
  wrappedBytes: number
  sourceKey: Uint8Array
  unwrappedAtApplication: Uint8Array
  matches: boolean
}

/**
 * AWS hybrid in the application: DeriveSharedSecret (ECDH, raw secret) plus
 * Decapsulate (ML-KEM secret), combined by the application with HKDF-SHA-256.
 * AWS has no native hybrid KEM; the combine step sits outside the HSM.
 * The combiner is this module's own choice (ML-KEM secret first), not TLS's.
 */
export function runAwsHybridEstablishment(ctx: Hctx, variant: MlKemVariant = 768): AwsHybridResult {
  const { M, hSession } = ctx
  const kmsMl = hsm_generateMLKEMKeyPair(M, hSession, variant, false, 'KMS ML-KEM key')
  const kmsEc = hsm_generateECKeyPair(M, hSession, 'P-256', false, 'KMS ECC_NIST_P256 key')
  const partnerEc = hsm_generateECKeyPair(M, hSession, 'P-256', false, 'partner ECDH key')
  const pointLen = ecPointRawLen('P-256')
  const rawPoint = (h: number) => stripEcPointDer(hsm_extractECPoint(M, hSession, h), pointLen)
  const kmsEcPub = rawPoint(kmsEc.pubHandle)
  const partnerEcPub = rawPoint(partnerEc.pubHandle)

  // Partner side: ECDH with the KMS public key, and ML-KEM encapsulation to the KMS ML-KEM public key.
  const partnerEcdh = hsm_extractKeyValue(
    M,
    hSession,
    hsm_ecdhDerive(M, hSession, partnerEc.privHandle, kmsEcPub, undefined, undefined, {
      keyLen: 32,
      extractable: true,
    })
  )
  const ek = hsm_extractKeyValue(M, hSession, kmsMl.pubHandle)
  const enc = hsm_encapsulate(M, hSession, importMlKemPublic(ctx, variant, ek), variant, true)
  const partnerMl = hsm_extractKeyValue(M, hSession, enc.secretHandle)

  // AWS side: DeriveSharedSecret and Decapsulate both return their secret to the caller.
  const awsEcdh = hsm_extractKeyValue(
    M,
    hSession,
    hsm_ecdhDerive(M, hSession, kmsEc.privHandle, partnerEcPub, undefined, undefined, {
      keyLen: 32,
      extractable: true,
    })
  )
  const awsMl = hsm_extractKeyValue(
    M,
    hSession,
    hsm_decapsulate(M, hSession, kmsMl.privHandle, enc.ciphertextBytes, variant, true)
  )

  const sourceKey = hsm_generateRandom(M, hSession, 32)
  const kekPartner = deriveKek(ctx, concat(partnerMl, partnerEcdh), HKDF_INFO_HYBRID)
  const wrapped = aesKwWrap(ctx, kekPartner, sourceKey)
  const kekApp = deriveKek(ctx, concat(awsMl, awsEcdh), HKDF_INFO_HYBRID)
  const unwrappedAtApplication = aesKwUnwrap(ctx, kekApp, wrapped)

  return {
    variant,
    curve: 'P-256',
    mlkemSecret: awsMl,
    ecdhSecret: awsEcdh,
    ecdhSecretBytes: awsEcdh.length,
    mlkemSecretBytes: awsMl.length,
    ecdhSecretsMatch: equalBytes(partnerEcdh, awsEcdh),
    mlkemSecretsMatch: equalBytes(partnerMl, awsMl),
    combinerInputOrder: [
      'ML-KEM secret (from Decapsulate)',
      'ECDH secret (from DeriveSharedSecret)',
    ],
    kekDerivationInfo:
      'HKDF-SHA-256(mlkem_secret || ecdh_secret, info = "cloud-kms-exchange hybrid KEK") -> 32 bytes',
    wrapped,
    wrappedBytes: wrapped.length,
    sourceKey,
    unwrappedAtApplication,
    matches: equalBytes(sourceKey, unwrappedAtApplication),
  }
}

// ── What the run measured, as lines for each step ────────────────────────────

/** Lines to show under each step of a flow, keyed by the step id in cloudKmsExchangeData. */
export type StepObservations = Record<string, string[]>

const yesNo = (b: boolean): string => (b ? 'yes' : 'no')

export function observeClassical(r: ClassicalImportResult): StepObservations {
  const p = r.profile
  return {
    params: [
      `RSA-${p.rsaBits} wrapping key pair ${
        r.rsaKeyReused
          ? 'reused from an earlier run in this HSM session (generating it is slow)'
          : 'generated just now'
      }; the public modulus is ${r.rsaPartBytes} bytes`,
    ],
    source: [`AES-256 key created: ${r.sourceKey.length} bytes`],
    wrap: [
      `Wrapped blob: ${r.wrappedBytes} bytes = ${r.rsaPartBytes} bytes RSA-OAEP + ${r.kwpPartBytes} bytes AES-KWP`,
      `Checked by hand: the RSA part opens to the temporary AES-${p.aesKeyBits} key and the KWP part opens to the original key: ${yesNo(r.structureVerified)}`,
    ],
    import: [`Recovered key is byte-identical to the original: ${yesNo(r.matches)}`],
  }
}

export function observeHpke(r: HpkeImportResult): StepObservations {
  return {
    publish: [
      `${r.suite.apiName} (kem_id 0x${r.suite.kemId.toString(16).padStart(4, '0')}, kdf_id 0x${r.suite.kdfId
        .toString(16)
        .padStart(4, '0')}, aead_id 0x${r.suite.aeadId.toString(16).padStart(4, '0')})`,
      `Public key: ${r.publicKeyBytes} bytes. Generated with ${r.keygenMechanisms.join(' + ')}`,
    ],
    seal: [
      `Third-party engine: ${HPKE_ENGINE_LABEL[r.senderEngine]}`,
      `PKCS#11 calls: ${r.sealMechanisms.join(' → ')}`,
      ...(r.note ? [r.note] : []),
    ],
    send: [
      `enc: ${r.encBytes} bytes. ciphertext: ${r.ctBytes} bytes (the ${r.keyMaterial.length}-byte key plus ${r.overheadBytes} bytes of authentication tag)`,
      `Sent: ${r.wireBytes} bytes`,
    ],
    open: [
      `Provider engine: ${HPKE_ENGINE_LABEL[r.engine]}`,
      `PKCS#11 calls: ${r.openMechanisms.join(' → ')}`,
      `Recovered key is byte-identical to the original: ${yesNo(r.matches)}`,
    ],
  }
}

export function observeAwsMlKem(r: AwsMlKemResult): StepObservations {
  return {
    public: [`Encapsulation key: ${r.encapsulationKeyBytes} bytes (ML-KEM-${r.variant})`],
    encap: [
      `Ciphertext to send: ${r.ciphertextBytes} bytes. Secret kept by the partner: ${r.partnerSecret.length} bytes`,
    ],
    decap: [
      `Secret returned to the caller: ${r.secretReturnedToCaller.length} bytes, in plaintext`,
      `Same secret as the partner’s: ${yesNo(r.secretsMatch)}`,
    ],
    kek: [
      r.kekDerivationInfo,
      `AES-KW output: ${r.wrappedBytes} bytes for a ${r.sourceKey.length}-byte key`,
      `Application recovered the key and it is byte-identical to the original: ${yesNo(r.matches)}`,
    ],
  }
}

export function observeAwsHybrid(r: AwsHybridResult): StepObservations {
  return {
    ecdh: [
      `Raw ECDH secret (${r.curve}) returned to the caller: ${r.ecdhSecretBytes} bytes`,
      `Same secret as the partner’s: ${yesNo(r.ecdhSecretsMatch)}`,
    ],
    mlkem: [
      `ML-KEM-${r.variant} secret returned to the caller: ${r.mlkemSecretBytes} bytes`,
      `Same secret as the partner’s: ${yesNo(r.mlkemSecretsMatch)}`,
    ],
    combine: [
      `Input order: ${r.combinerInputOrder.join(', then ')}`,
      r.kekDerivationInfo,
      `AES-KW output: ${r.wrappedBytes} bytes for a ${r.sourceKey.length}-byte key`,
      `Application recovered the key and it is byte-identical to the original: ${yesNo(r.matches)}`,
    ],
  }
}

/** First `n` bytes as hex with an ellipsis, for compact display of long values. */
export function hexPreview(bytes: Uint8Array, n = 16): string {
  const h = bytesToHex(bytes.subarray(0, n))
  return bytes.length > n ? `${h}…` : h
}
