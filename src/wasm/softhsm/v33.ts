// SPDX-License-Identifier: AGPL-3.0-only
/**
 * v33.ts — engine bindings for the PKCS#11 v3.3 working-draft features:
 * composite ML-DSA (CKK_COMP_SIG), composite ML-KEM (CKK_COMP_KEM), ML-DSA
 * external mu, and CKA_KEYS_REMAINING.
 *
 * v3.3 is an UNPUBLISHED OASIS working draft. Its codepoints are approved in
 * the TC header, the chapter text may still change, and an engine that
 * implements them still reports Cryptoki 3.2.0. Nothing here assumes the
 * loaded engine has them: every caller asks `hsm_detectV33Support` first
 * (C_GetMechanismList / C_GetMechanismInfo) and shows "not in this engine
 * yet" when a mechanism is missing.
 *
 * Shapes (OASIS TC commit 9ef73f9, working/doc/spec/comp_sig.md, comp_kem.md;
 * draft-ietf-lamps-pq-composite-sigs-19, draft-ietf-lamps-pq-composite-kem-23):
 *  - one key object holds both halves. Public CKA_VALUE = mlPK ‖ tradPK,
 *    private CKA_VALUE = mlSeed ‖ tradSK. CKA_PARAMETER_SET (a CKP_COMP_*)
 *    goes in the PUBLIC template at key generation.
 *  - CKM_COMP_KEM takes no parameter and runs through C_EncapsulateKey /
 *    C_DecapsulateKey. The secret is SHA3-256(mlkemSS ‖ tradSS ‖ tradCT ‖
 *    tradPK ‖ Label), returned as a generic secret key handle (32 bytes).
 *  - CKM_COMP_SIG takes an optional CK_SIGN_ADDITIONAL_CONTEXT (the same
 *    struct as ML-DSA) and may be multi-part. CKM_COMP_SIG_EXTERNAL_HASH is
 *    single-part and its input is the pre-hash, of exactly the set's hash
 *    length.
 *
 * Every function takes the logging proxy (`hsm.moduleRef.current`), so each
 * C_* call shows in the playground's call log like any other.
 */
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  CKA_CLASS,
  CKA_DECAPSULATE,
  CKA_ENCAPSULATE,
  CKA_EXTRACTABLE,
  CKA_KEY_TYPE,
  CKA_PARAMETER_SET,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_SIGN,
  CKA_TOKEN,
  CKA_VALUE,
  CKA_VALUE_LEN,
  CKA_VERIFY,
  CKF_DECAPSULATE,
  CKF_DIGEST,
  CKF_ENCAPSULATE,
  CKF_GENERATE_KEY_PAIR,
  CKF_SIGN,
  CKF_VERIFY,
  CKH_HEDGE_PREFERRED,
  CKK_COMP_KEM,
  CKK_COMP_SIG,
  CKM_COMP_KEM,
  CKM_COMP_KEM_KEY_PAIR_GEN,
  CKM_COMP_SIG,
  CKM_COMP_SIG_EXTERNAL_HASH,
  CKM_COMP_SIG_KEY_PAIR_GEN,
  CKM_ML_DSA_EXTERNAL_MU,
  CKM_ML_DSA_EXTERNAL_MU_GEN,
  CKO_PRIVATE_KEY,
  CKO_PUBLIC_KEY,
  CKO_SECRET_KEY,
} from './constants'
import { allocUlong, buildTemplate, checkRV, freeTemplate, readUlong, writeUlong } from './helpers'
import type { AttrDef } from './helpers'
import type { CompositeKemSet, CompositeSigSet } from './compositeParams'

export * from './compositeParams'
export {
  CKK_COMP_KEM,
  CKK_COMP_SIG,
  CKM_COMP_KEM,
  CKM_COMP_KEM_KEY_PAIR_GEN,
  CKM_COMP_SIG,
  CKM_COMP_SIG_EXTERNAL_HASH,
  CKM_COMP_SIG_KEY_PAIR_GEN,
  CKM_ML_DSA_EXTERNAL_MU,
  CKM_ML_DSA_EXTERNAL_MU_GEN,
} from './constants'

/** The one sentence every v3.3 surface shows next to its results. */
export const V33_DRAFT_NOTE =
  'PKCS#11 v3.3 is an unpublished OASIS working draft. Its composite, external-mu and CKA_KEYS_REMAINING codepoints are approved in the TC header, but the text may still change, and an engine that implements them still reports Cryptoki 3.2.0.'

/** Shown when the loaded engine does not advertise a v3.3 mechanism. */
export const NOT_IN_ENGINE_YET = 'not in this engine yet'

// ── Runtime feature detection ────────────────────────────────────────────────

export type V33MechKey =
  | 'compSigKeyGen'
  | 'compSig'
  | 'compSigExternalHash'
  | 'compKemKeyGen'
  | 'compKem'
  | 'mlDsaExternalMuGen'
  | 'mlDsaExternalMu'

export interface V33MechDef {
  key: V33MechKey
  type: number
  name: string
  family: 'composite-sig' | 'composite-kem' | 'external-mu'
  /** The C_GetMechanismInfo flags the draft gives this mechanism. */
  expectedFlags: number
  expectedFlagNames: string[]
}

export const V33_MECHANISMS: readonly V33MechDef[] = [
  {
    key: 'compSigKeyGen',
    type: CKM_COMP_SIG_KEY_PAIR_GEN,
    name: 'CKM_COMP_SIG_KEY_PAIR_GEN',
    family: 'composite-sig',
    expectedFlags: CKF_GENERATE_KEY_PAIR,
    expectedFlagNames: ['CKF_GENERATE_KEY_PAIR'],
  },
  {
    key: 'compSig',
    type: CKM_COMP_SIG,
    name: 'CKM_COMP_SIG',
    family: 'composite-sig',
    expectedFlags: CKF_SIGN | CKF_VERIFY,
    expectedFlagNames: ['CKF_SIGN', 'CKF_VERIFY'],
  },
  {
    key: 'compSigExternalHash',
    type: CKM_COMP_SIG_EXTERNAL_HASH,
    name: 'CKM_COMP_SIG_EXTERNAL_HASH',
    family: 'composite-sig',
    expectedFlags: CKF_SIGN | CKF_VERIFY,
    expectedFlagNames: ['CKF_SIGN', 'CKF_VERIFY'],
  },
  {
    key: 'compKemKeyGen',
    type: CKM_COMP_KEM_KEY_PAIR_GEN,
    name: 'CKM_COMP_KEM_KEY_PAIR_GEN',
    family: 'composite-kem',
    expectedFlags: CKF_GENERATE_KEY_PAIR,
    expectedFlagNames: ['CKF_GENERATE_KEY_PAIR'],
  },
  {
    key: 'compKem',
    type: CKM_COMP_KEM,
    name: 'CKM_COMP_KEM',
    family: 'composite-kem',
    expectedFlags: CKF_ENCAPSULATE | CKF_DECAPSULATE,
    expectedFlagNames: ['CKF_ENCAPSULATE', 'CKF_DECAPSULATE'],
  },
  {
    key: 'mlDsaExternalMuGen',
    type: CKM_ML_DSA_EXTERNAL_MU_GEN,
    name: 'CKM_ML_DSA_EXTERNAL_MU_GEN',
    family: 'external-mu',
    expectedFlags: CKF_DIGEST,
    expectedFlagNames: ['CKF_DIGEST'],
  },
  {
    key: 'mlDsaExternalMu',
    type: CKM_ML_DSA_EXTERNAL_MU,
    name: 'CKM_ML_DSA_EXTERNAL_MU',
    family: 'external-mu',
    expectedFlags: CKF_SIGN | CKF_VERIFY,
    expectedFlagNames: ['CKF_SIGN', 'CKF_VERIFY'],
  },
]

export interface V33MechSupport {
  def: V33MechDef
  /** In C_GetMechanismList. */
  advertised: boolean
  /** C_GetMechanismInfo, or null when the call failed. */
  info: { ulMinKeySize: number; ulMaxKeySize: number; flags: number } | null
  /** Every flag the draft gives this mechanism is set. */
  flagsOk: boolean
}

export interface V33Support {
  /** "3.2" etc. from C_GetInfo, or null when unreadable. */
  cryptokiVersion: string | null
  mechs: Record<V33MechKey, V33MechSupport>
  /** Composite ML-DSA key generation and signing are both advertised. */
  compSig: boolean
  compSigExternalHash: boolean
  /** Composite ML-KEM key generation and KEM are both advertised. */
  compKem: boolean
  /** External-mu generation and signing are both advertised. */
  externalMu: boolean
}

/** Pure part of the detection, separated so it is unit-testable without an
 * engine: decide support from the advertised list and per-mechanism info. */
export const classifyV33Support = (
  advertisedTypes: readonly number[],
  infoOf: (type: number) => V33MechSupport['info'],
  cryptokiVersion: string | null
): V33Support => {
  const set = new Set(advertisedTypes)
  const mechs = {} as Record<V33MechKey, V33MechSupport>
  for (const def of V33_MECHANISMS) {
    const advertised = set.has(def.type)
    const info = advertised ? infoOf(def.type) : null
    const flagsOk = !!info && (info.flags & def.expectedFlags) === def.expectedFlags
    mechs[def.key] = { def, advertised, info, flagsOk }
  }
  return {
    cryptokiVersion,
    mechs,
    compSig: mechs.compSigKeyGen.advertised && mechs.compSig.advertised,
    compSigExternalHash: mechs.compSigKeyGen.advertised && mechs.compSigExternalHash.advertised,
    compKem: mechs.compKemKeyGen.advertised && mechs.compKem.advertised,
    externalMu: mechs.mlDsaExternalMuGen.advertised && mechs.mlDsaExternalMu.advertised,
  }
}

/** C_GetInfo → "major.minor" (CK_INFO.cryptokiVersion is the first two bytes). */
export const hsm_getCryptokiVersion = (M: SoftHSMModule): string | null => {
  const ptr = M._malloc(96) // sizeof(CK_INFO) is 76 on wasm32; padded
  try {
    M.HEAPU8.fill(0, ptr, ptr + 96)
    if (M._C_GetInfo(ptr) >>> 0 !== 0) return null
    return `${M.HEAPU8[ptr]}.${M.HEAPU8[ptr + 1]}`
  } finally {
    M._free(ptr)
  }
}

const getMechanismListRaw = (M: SoftHSMModule, slotId: number): number[] => {
  const countPtr = allocUlong(M)
  try {
    if (M._C_GetMechanismList(slotId, 0, countPtr) >>> 0 !== 0) return []
    const count = readUlong(M, countPtr)
    if (count === 0) return []
    const listPtr = M._malloc(count * 4)
    try {
      writeUlong(M, countPtr, count)
      if (M._C_GetMechanismList(slotId, listPtr, countPtr) >>> 0 !== 0) return []
      const n = readUlong(M, countPtr)
      return Array.from({ length: n }, (_, i) => readUlong(M, listPtr + i * 4))
    } finally {
      M._free(listPtr)
    }
  } finally {
    M._free(countPtr)
  }
}

const getMechanismInfoRaw = (
  M: SoftHSMModule,
  slotId: number,
  type: number
): V33MechSupport['info'] => {
  const p = M._malloc(12)
  try {
    if (M._C_GetMechanismInfo(slotId, type, p) >>> 0 !== 0) return null
    return {
      ulMinKeySize: readUlong(M, p),
      ulMaxKeySize: readUlong(M, p + 4),
      flags: readUlong(M, p + 8),
    }
  } finally {
    M._free(p)
  }
}

/** Ask the loaded engine which v3.3 features it has. Never throws. */
export const hsm_detectV33Support = (M: SoftHSMModule, slotId: number): V33Support => {
  let list: number[] = []
  try {
    list = getMechanismListRaw(M, slotId)
  } catch {
    list = []
  }
  let version: string | null = null
  try {
    version = hsm_getCryptokiVersion(M)
  } catch {
    version = null
  }
  return classifyV33Support(
    list,
    (t) => {
      try {
        return getMechanismInfoRaw(M, slotId, t)
      } catch {
        return null
      }
    },
    version
  )
}

/** Thrown by a lesson step or bench action when the engine lacks a feature.
 * Callers show its message as an informational result, not a failure. */
export class NotInEngineError extends Error {
  readonly notInEngine = true
  constructor(what: string) {
    super(
      `${what}: ${NOT_IN_ENGINE_YET}. The loaded engine does not advertise it in C_GetMechanismList.`
    )
    this.name = 'NotInEngineError'
  }
}

export const isNotInEngine = (e: unknown): e is NotInEngineError =>
  !!e && typeof e === 'object' && (e as { notInEngine?: boolean }).notInEngine === true

// ── Low-level helpers ────────────────────────────────────────────────────────

const putBytes = (M: SoftHSMModule, b: Uint8Array): number => {
  const p = M._malloc(Math.max(1, b.length))
  if (b.length) M.HEAPU8.set(b, p)
  return p
}

/** CK_MECHANISM with an optional raw parameter blob. Returns pointers to free. */
const mechWith = (
  M: SoftHSMModule,
  type: number,
  param?: Uint8Array | null
): { mech: number; frees: number[] } => {
  const mech = M._malloc(12)
  const frees = [mech]
  M.setValue(mech, type, 'i32')
  if (param && param.length) {
    const pp = putBytes(M, param)
    frees.push(pp)
    M.setValue(mech + 4, pp, 'i32')
    M.setValue(mech + 8, param.length, 'i32')
  } else {
    M.setValue(mech + 4, 0, 'i32')
    M.setValue(mech + 8, 0, 'i32')
  }
  return { mech, frees }
}

/** CK_SIGN_ADDITIONAL_CONTEXT { hedgeVariant, pContext, ulContextLen } (12 B). */
const signContextMech = (
  M: SoftHSMModule,
  type: number,
  context: Uint8Array | null | undefined
): { mech: number; frees: number[] } => {
  if (context === undefined || context === null) return mechWith(M, type, null)
  const mech = M._malloc(12)
  const param = M._malloc(12)
  const frees = [mech, param]
  M.setValue(param, CKH_HEDGE_PREFERRED, 'i32')
  if (context.length) {
    const cp = putBytes(M, context)
    frees.push(cp)
    M.setValue(param + 4, cp, 'i32')
    M.setValue(param + 8, context.length, 'i32')
  } else {
    M.setValue(param + 4, 0, 'i32')
    M.setValue(param + 8, 0, 'i32')
  }
  M.setValue(mech, type, 'i32')
  M.setValue(mech + 4, param, 'i32')
  M.setValue(mech + 8, 12, 'i32')
  return { mech, frees }
}

/** Read one attribute; returns the raw return value and the bytes on CKR_OK. */
export const hsm_readAttrRv = (
  M: SoftHSMModule,
  hSession: number,
  hObject: number,
  attrType: number
): { rv: number; value: Uint8Array | null } => {
  const lenTpl = buildTemplate(M, [{ type: attrType }])
  let rv: number
  let len = 0
  try {
    rv = M._C_GetAttributeValue(hSession, hObject, lenTpl.ptr, 1) >>> 0
    len = readUlong(M, lenTpl.ptr + 8)
  } finally {
    freeTemplate(M, lenTpl, 1)
  }
  if (rv !== 0 || len === 0xffffffff) return { rv, value: null }
  const vp = M._malloc(Math.max(1, len))
  const tpl = buildTemplate(M, [{ type: attrType, bytesPtr: vp, bytesLen: len }])
  try {
    rv = M._C_GetAttributeValue(hSession, hObject, tpl.ptr, 1) >>> 0
    return { rv, value: rv === 0 ? M.HEAPU8.slice(vp, vp + len) : null }
  } finally {
    freeTemplate(M, tpl, 1)
    M._free(vp)
  }
}

// ── Composite keys ───────────────────────────────────────────────────────────

export type CompositeFamily = 'sig' | 'kem'

const keyTypeOf = (f: CompositeFamily) => (f === 'sig' ? CKK_COMP_SIG : CKK_COMP_KEM)
const keyGenOf = (f: CompositeFamily) =>
  f === 'sig' ? CKM_COMP_SIG_KEY_PAIR_GEN : CKM_COMP_KEM_KEY_PAIR_GEN

/**
 * C_GenerateKeyPair(CKM_COMP_SIG_KEY_PAIR_GEN / CKM_COMP_KEM_KEY_PAIR_GEN).
 * CKA_PARAMETER_SET goes in the PUBLIC template (comp_sig.md / comp_kem.md).
 */
export const hsm_generateCompositeKeyPair = (
  M: SoftHSMModule,
  hSession: number,
  family: CompositeFamily,
  ckp: number,
  opts: { extractable?: boolean } = {}
): { pubHandle: number; privHandle: number } => {
  const kt = keyTypeOf(family)
  const extractable = opts.extractable ?? false
  const pubAttrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: kt },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PARAMETER_SET, ulongVal: ckp },
    family === 'sig'
      ? { type: CKA_VERIFY, boolVal: true }
      : { type: CKA_ENCAPSULATE, boolVal: true },
  ]
  const prvAttrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: kt },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: !extractable },
    { type: CKA_EXTRACTABLE, boolVal: extractable },
    family === 'sig' ? { type: CKA_SIGN, boolVal: true } : { type: CKA_DECAPSULATE, boolVal: true },
  ]
  const { mech, frees } = mechWith(M, keyGenOf(family))
  const pubTpl = buildTemplate(M, pubAttrs)
  const prvTpl = buildTemplate(M, prvAttrs)
  const pubH = allocUlong(M)
  const prvH = allocUlong(M)
  try {
    checkRV(
      M._C_GenerateKeyPair(
        hSession,
        mech,
        pubTpl.ptr,
        pubAttrs.length,
        prvTpl.ptr,
        prvAttrs.length,
        pubH,
        prvH
      ),
      `C_GenerateKeyPair(${family === 'sig' ? 'COMP_SIG' : 'COMP_KEM'})`
    )
    return { pubHandle: readUlong(M, pubH), privHandle: readUlong(M, prvH) }
  } finally {
    frees.forEach((p) => M._free(p))
    freeTemplate(M, pubTpl, pubAttrs.length)
    freeTemplate(M, prvTpl, prvAttrs.length)
    M._free(pubH)
    M._free(prvH)
  }
}

/** C_CreateObject of a composite key. Returns the raw rv and the handle. */
export const hsm_importCompositeKeyRv = (
  M: SoftHSMModule,
  hSession: number,
  family: CompositeFamily,
  cls: 'public' | 'private',
  ckp: number | null,
  value: Uint8Array
): { rv: number; handle: number } => {
  const vp = putBytes(M, value)
  const attrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: cls === 'public' ? CKO_PUBLIC_KEY : CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: keyTypeOf(family) },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VALUE, bytesPtr: vp, bytesLen: value.length },
  ]
  if (ckp !== null) attrs.push({ type: CKA_PARAMETER_SET, ulongVal: ckp })
  if (cls === 'public') {
    attrs.push(
      family === 'sig'
        ? { type: CKA_VERIFY, boolVal: true }
        : { type: CKA_ENCAPSULATE, boolVal: true }
    )
  } else {
    attrs.push(
      { type: CKA_SENSITIVE, boolVal: true },
      family === 'sig'
        ? { type: CKA_SIGN, boolVal: true }
        : { type: CKA_DECAPSULATE, boolVal: true }
    )
  }
  const tpl = buildTemplate(M, attrs)
  const hp = allocUlong(M)
  try {
    const rv = M._C_CreateObject(hSession, tpl.ptr, attrs.length, hp) >>> 0
    return { rv, handle: rv === 0 ? readUlong(M, hp) : 0 }
  } finally {
    freeTemplate(M, tpl, attrs.length)
    M._free(hp)
    M._free(vp)
  }
}

/** Throwing form of {@link hsm_importCompositeKeyRv}. */
export const hsm_importCompositeKey = (
  M: SoftHSMModule,
  hSession: number,
  family: CompositeFamily,
  cls: 'public' | 'private',
  ckp: number,
  value: Uint8Array
): number => {
  const r = hsm_importCompositeKeyRv(M, hSession, family, cls, ckp, value)
  checkRV(r.rv, `C_CreateObject(${family === 'sig' ? 'COMP_SIG' : 'COMP_KEM'} ${cls})`)
  return r.handle
}

/** Split a composite public CKA_VALUE into its ML and traditional halves. */
export const splitCompositePublic = (
  set: Pick<CompositeSigSet | CompositeKemSet, 'mlPublicKeyBytes'>,
  value: Uint8Array
): { ml: Uint8Array; trad: Uint8Array } => ({
  ml: value.slice(0, set.mlPublicKeyBytes),
  trad: value.slice(set.mlPublicKeyBytes),
})

// ── Composite ML-KEM ─────────────────────────────────────────────────────────

const secretTemplate = (): AttrDef[] => [
  { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
  { type: CKA_VALUE_LEN, ulongVal: 32 },
  { type: CKA_SENSITIVE, boolVal: false },
  { type: CKA_EXTRACTABLE, boolVal: true },
]

/** C_EncapsulateKey(CKM_COMP_KEM) — size query, then encapsulate. `param`
 * exists only so the checks can show that a parameter is refused. */
export const hsm_compositeEncapsulateRv = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  opts: { param?: Uint8Array } = {}
): { rv: number; ciphertext: Uint8Array | null; secretHandle: number } => {
  const { mech, frees } = mechWith(M, CKM_COMP_KEM, opts.param ?? null)
  const st = secretTemplate()
  const tpl = buildTemplate(M, st)
  const lenP = allocUlong(M)
  const hP = allocUlong(M)
  let ctP = 0
  try {
    let rv = M._C_EncapsulateKey(hSession, mech, pubHandle, tpl.ptr, st.length, 0, lenP, hP) >>> 0
    if (rv !== 0) return { rv, ciphertext: null, secretHandle: 0 }
    const len = readUlong(M, lenP)
    ctP = M._malloc(Math.max(1, len))
    writeUlong(M, lenP, len)
    rv = M._C_EncapsulateKey(hSession, mech, pubHandle, tpl.ptr, st.length, ctP, lenP, hP) >>> 0
    if (rv !== 0) return { rv, ciphertext: null, secretHandle: 0 }
    return {
      rv,
      ciphertext: M.HEAPU8.slice(ctP, ctP + readUlong(M, lenP)),
      secretHandle: readUlong(M, hP),
    }
  } finally {
    frees.forEach((p) => M._free(p))
    freeTemplate(M, tpl, st.length)
    M._free(lenP)
    M._free(hP)
    if (ctP) M._free(ctP)
  }
}

export const hsm_compositeEncapsulate = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number
): { ciphertext: Uint8Array; secretHandle: number } => {
  const r = hsm_compositeEncapsulateRv(M, hSession, pubHandle)
  checkRV(r.rv, 'C_EncapsulateKey(COMP_KEM)')
  return { ciphertext: r.ciphertext!, secretHandle: r.secretHandle }
}

export const hsm_compositeDecapsulateRv = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  ciphertext: Uint8Array,
  opts: { param?: Uint8Array; mechanism?: number } = {}
): { rv: number; secretHandle: number } => {
  const { mech, frees } = mechWith(M, opts.mechanism ?? CKM_COMP_KEM, opts.param ?? null)
  const st = secretTemplate()
  const tpl = buildTemplate(M, st)
  const ctP = putBytes(M, ciphertext)
  const hP = allocUlong(M)
  try {
    const rv =
      M._C_DecapsulateKey(
        hSession,
        mech,
        privHandle,
        tpl.ptr,
        st.length,
        ctP,
        ciphertext.length,
        hP
      ) >>> 0
    return { rv, secretHandle: rv === 0 ? readUlong(M, hP) : 0 }
  } finally {
    frees.forEach((p) => M._free(p))
    freeTemplate(M, tpl, st.length)
    M._free(ctP)
    M._free(hP)
  }
}

export const hsm_compositeDecapsulate = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  ciphertext: Uint8Array
): number => {
  const r = hsm_compositeDecapsulateRv(M, hSession, privHandle, ciphertext)
  checkRV(r.rv, 'C_DecapsulateKey(COMP_KEM)')
  return r.secretHandle
}

// ── Composite ML-DSA ─────────────────────────────────────────────────────────

export interface CompositeSignOptions {
  /** CK_SIGN_ADDITIONAL_CONTEXT.pContext; undefined = no parameter at all. */
  context?: Uint8Array
  /** Sign with CKM_COMP_SIG_EXTERNAL_HASH; `data` is then the pre-hash. */
  externalHash?: boolean
  /** Feed `data` through C_SignUpdate/C_VerifyUpdate in chunks of this size. */
  multiPartChunk?: number
  /** Override the mechanism (error-path checks only). */
  mechanism?: number
}

const sigMech = (o: CompositeSignOptions) =>
  o.mechanism ?? (o.externalHash ? CKM_COMP_SIG_EXTERNAL_HASH : CKM_COMP_SIG)

/** C_SignInit + C_Sign (or C_SignUpdate…C_SignFinal). Returns the raw rv of
 * the first call that failed, and the signature on success. */
export const hsm_compositeSignRv = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  data: Uint8Array,
  opts: CompositeSignOptions = {}
): { rv: number; step: string; signature: Uint8Array | null } => {
  const { mech, frees } = signContextMech(M, sigMech(opts), opts.context)
  const dP = putBytes(M, data)
  const lenP = allocUlong(M)
  let sP = 0
  try {
    let rv = M._C_SignInit(hSession, mech, privHandle) >>> 0
    if (rv !== 0) return { rv, step: 'C_SignInit', signature: null }
    if (opts.multiPartChunk && opts.multiPartChunk > 0) {
      for (let off = 0; off < data.length || off === 0; off += opts.multiPartChunk) {
        const n = Math.min(opts.multiPartChunk, data.length - off)
        rv = M._C_SignUpdate(hSession, dP + off, Math.max(0, n)) >>> 0
        if (rv !== 0) return { rv, step: 'C_SignUpdate', signature: null }
        if (data.length === 0) break
      }
      rv = M._C_SignFinal(hSession, 0, lenP) >>> 0
      if (rv !== 0) return { rv, step: 'C_SignFinal', signature: null }
      const len = readUlong(M, lenP)
      sP = M._malloc(Math.max(1, len))
      writeUlong(M, lenP, len)
      rv = M._C_SignFinal(hSession, sP, lenP) >>> 0
      if (rv !== 0) return { rv, step: 'C_SignFinal', signature: null }
    } else {
      rv = M._C_Sign(hSession, dP, data.length, 0, lenP) >>> 0
      if (rv !== 0) return { rv, step: 'C_Sign', signature: null }
      const len = readUlong(M, lenP)
      sP = M._malloc(Math.max(1, len))
      writeUlong(M, lenP, len)
      rv = M._C_Sign(hSession, dP, data.length, sP, lenP) >>> 0
      if (rv !== 0) return { rv, step: 'C_Sign', signature: null }
    }
    return { rv: 0, step: 'C_Sign', signature: M.HEAPU8.slice(sP, sP + readUlong(M, lenP)) }
  } finally {
    frees.forEach((p) => M._free(p))
    M._free(dP)
    M._free(lenP)
    if (sP) M._free(sP)
  }
}

export const hsm_compositeSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  data: Uint8Array,
  opts: CompositeSignOptions = {}
): Uint8Array => {
  const r = hsm_compositeSignRv(M, hSession, privHandle, data, opts)
  checkRV(r.rv, `${r.step}(${opts.externalHash ? 'COMP_SIG_EXTERNAL_HASH' : 'COMP_SIG'})`)
  return r.signature!
}

/** C_VerifyInit + C_Verify (or C_VerifyUpdate…C_VerifyFinal) → raw rv.
 * 0 = valid, CKR_SIGNATURE_INVALID / CKR_SIGNATURE_LEN_RANGE = rejected. */
export const hsm_compositeVerifyRv = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  data: Uint8Array,
  signature: Uint8Array,
  opts: CompositeSignOptions = {}
): { rv: number; step: string } => {
  const { mech, frees } = signContextMech(M, sigMech(opts), opts.context)
  const dP = putBytes(M, data)
  const sP = putBytes(M, signature)
  try {
    let rv = M._C_VerifyInit(hSession, mech, pubHandle) >>> 0
    if (rv !== 0) return { rv, step: 'C_VerifyInit' }
    if (opts.multiPartChunk && opts.multiPartChunk > 0) {
      for (let off = 0; off < data.length; off += opts.multiPartChunk) {
        const n = Math.min(opts.multiPartChunk, data.length - off)
        rv = M._C_VerifyUpdate(hSession, dP + off, n) >>> 0
        if (rv !== 0) return { rv, step: 'C_VerifyUpdate' }
      }
      rv = M._C_VerifyFinal(hSession, sP, signature.length) >>> 0
      return { rv, step: 'C_VerifyFinal' }
    }
    rv = M._C_Verify(hSession, dP, data.length, sP, signature.length) >>> 0
    return { rv, step: 'C_Verify' }
  } finally {
    frees.forEach((p) => M._free(p))
    M._free(dP)
    M._free(sP)
  }
}

// ── ML-DSA external mu ───────────────────────────────────────────────────────

/**
 * CK_MU_GEN_PARAMS { hKey, pTR, ulTRLen, pctx, ulctxLen } — 20 bytes on
 * wasm32 (pkcs11t.h:2743-2749). Exactly one of hKey / pTR must be given.
 */
const muGenMech = (
  M: SoftHSMModule,
  p: { hKey?: number; tr?: Uint8Array; context?: Uint8Array }
): { mech: number; frees: number[] } => {
  const mech = M._malloc(12)
  const param = M._malloc(20)
  const frees = [mech, param]
  M.setValue(param, p.hKey ?? 0, 'i32')
  if (p.tr && p.tr.length) {
    const tp = putBytes(M, p.tr)
    frees.push(tp)
    M.setValue(param + 4, tp, 'i32')
    M.setValue(param + 8, p.tr.length, 'i32')
  } else {
    M.setValue(param + 4, 0, 'i32')
    M.setValue(param + 8, 0, 'i32')
  }
  if (p.context && p.context.length) {
    const cp = putBytes(M, p.context)
    frees.push(cp)
    M.setValue(param + 12, cp, 'i32')
    M.setValue(param + 16, p.context.length, 'i32')
  } else {
    M.setValue(param + 12, 0, 'i32')
    M.setValue(param + 16, 0, 'i32')
  }
  M.setValue(mech, CKM_ML_DSA_EXTERNAL_MU_GEN, 'i32')
  M.setValue(mech + 4, param, 'i32')
  M.setValue(mech + 8, 20, 'i32')
  return { mech, frees }
}

/** C_DigestInit(CKM_ML_DSA_EXTERNAL_MU_GEN, CK_MU_GEN_PARAMS) + C_Digest(M)
 * → µ (64 bytes), or the raw rv of the call that failed. */
export const hsm_externalMuGenRv = (
  M: SoftHSMModule,
  hSession: number,
  p: { hKey?: number; tr?: Uint8Array; context?: Uint8Array },
  message: Uint8Array
): { rv: number; step: string; mu: Uint8Array | null } => {
  const { mech, frees } = muGenMech(M, p)
  const dP = putBytes(M, message)
  const lenP = allocUlong(M)
  const outP = M._malloc(64)
  try {
    let rv = M._C_DigestInit(hSession, mech) >>> 0
    if (rv !== 0) return { rv, step: 'C_DigestInit', mu: null }
    writeUlong(M, lenP, 64)
    rv = M._C_Digest(hSession, dP, message.length, outP, lenP) >>> 0
    if (rv !== 0) return { rv, step: 'C_Digest', mu: null }
    return { rv, step: 'C_Digest', mu: M.HEAPU8.slice(outP, outP + readUlong(M, lenP)) }
  } finally {
    frees.forEach((f) => M._free(f))
    M._free(dP)
    M._free(lenP)
    M._free(outP)
  }
}

export const hsm_externalMuGen = (
  M: SoftHSMModule,
  hSession: number,
  p: { hKey?: number; tr?: Uint8Array; context?: Uint8Array },
  message: Uint8Array
): Uint8Array => {
  const r = hsm_externalMuGenRv(M, hSession, p, message)
  checkRV(r.rv, `${r.step}(ML_DSA_EXTERNAL_MU_GEN)`)
  return r.mu!
}

/** C_SignInit(CKM_ML_DSA_EXTERNAL_MU) + C_Sign(µ). µ is the data argument;
 * the context is already inside µ, so none is passed. */
export const hsm_externalMuSign = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  mu: Uint8Array
): Uint8Array => {
  const r = hsm_compositeSignRv(M, hSession, privHandle, mu, {
    mechanism: CKM_ML_DSA_EXTERNAL_MU,
  })
  checkRV(r.rv, `${r.step}(ML_DSA_EXTERNAL_MU)`)
  return r.signature!
}

/** C_VerifyInit(CKM_ML_DSA_EXTERNAL_MU) + C_Verify(µ, sig) → raw rv. */
export const hsm_externalMuVerifyRv = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  mu: Uint8Array,
  signature: Uint8Array
): number =>
  hsm_compositeVerifyRv(M, hSession, pubHandle, mu, signature, {
    mechanism: CKM_ML_DSA_EXTERNAL_MU,
  }).rv

// ── Offline helpers (no engine) ──────────────────────────────────────────────

export const concatBytes = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

/** The composite KEM combiner input, draft-ietf-lamps-pq-composite-kem-23
 * §3.4: mlkemSS ‖ tradSS ‖ tradCT ‖ tradPK ‖ Label. SHA3-256 of this is the
 * shared secret. */
export const compositeKemCombinerInput = (p: {
  mlkemSS: Uint8Array
  tradSS: Uint8Array
  tradCT: Uint8Array
  tradPK: Uint8Array
  label: Uint8Array
}): Uint8Array => concatBytes(p.mlkemSS, p.tradSS, p.tradCT, p.tradPK, p.label)

/** The TLS hybrid-group secret (draft-ietf-tls-ecdhe-mlkem, X25519MLKEM768):
 * the two component secrets concatenated, ML-KEM first. Nothing else is
 * bound in; TLS binds the key shares through its own transcript hash. */
export const tlsHybridConcatenation = (mlkemSS: Uint8Array, tradSS: Uint8Array): Uint8Array =>
  concatBytes(mlkemSS, tradSS)

/** M′ for composite ML-DSA, draft-ietf-lamps-pq-composite-sigs-19 §2.2:
 * Prefix ‖ Label ‖ len(ctx) ‖ ctx ‖ PH(M). */
export const compositeSigMessageRepresentative = (p: {
  prefix: Uint8Array
  label: Uint8Array
  context: Uint8Array
  preHash: Uint8Array
}): Uint8Array => {
  if (p.context.length > 255) throw new Error('ctx longer than 255 bytes')
  return concatBytes(p.prefix, p.label, new Uint8Array([p.context.length]), p.context, p.preHash)
}

export const base64ToBytes = (b64: string): Uint8Array => {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
