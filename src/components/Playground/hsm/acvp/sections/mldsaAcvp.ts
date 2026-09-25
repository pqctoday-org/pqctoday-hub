// SPDX-License-Identifier: GPL-3.0-only
//
// ML-DSA reference-sample depth for the ACVP workbench (remediation plan
// 2026-09-24, WS-D D2-2/D2-3/D2-5 + D4 conference minimum).
//
// Three kinds of rows, each tied to an exact upstream case:
//
//  1. Dedicated SigVer — NIST ACVP-Server ML-DSA-sigVer-FIPS204 cases with the
//     upstream's OWN expected disposition (testPassed + reason). Positive cases
//     must return CKR_OK; negative cases must return CKR_SIGNATURE_INVALID
//     (PKCS#11 v3.2 §5.15 / §6.67.5 — the signature has the right length, so
//     CKR_SIGNATURE_LEN_RANGE does not apply). Any other return is a failure,
//     including a negative case that is rejected with the wrong code.
//     Upstream has no public-key or context mutation class; those two
//     negatives are derived here from the positive case and are labelled
//     product-authored — never NIST.
//  2. Deterministic SigGen — the NIST sigGen private key imported with
//     C_CreateObject, signed with CKH_DETERMINISTIC_REQUIRED, and the output
//     byte-compared with the upstream signature.
//  3. KeyGen from seed — CKA_SEED in the C_GenerateKeyPair private template,
//     public key byte-compared with the upstream keyGen pk.
//
// Upstream groups that PKCS#11 cannot express are reported as 'skip' rows
// with the exact reason, so they stay in the denominator instead of silently
// vanishing (see each vector file's `notExecuted` list).
import sigVerVectors from '@/data/acvp/mldsa_sigver_test.json'
import sigGenDetVectors from '@/data/acvp/mldsa_siggen_det_test.json'
import keyGenVectors from '@/data/acvp/mldsa_keygen_test.json'
import { hexToBytes } from '@/utils/dataInputUtils'
import {
  buildTemplate,
  freeTemplate,
  writeBytes,
  dsaParamSet,
  rvName,
  hsm_importMLDSAPublicKey,
  hsm_extractKeyValue,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_SIGN,
  CKA_VERIFY,
  CKA_VALUE,
  CKA_PARAMETER_SET,
  CKA_SEED,
  CKO_PUBLIC_KEY,
  CKO_PRIVATE_KEY,
  CKK_ML_DSA,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  CKM_ML_DSA,
  CKM_ML_DSA_KEY_PAIR_GEN,
  CKM_HASH_ML_DSA_SHA224,
  CKM_HASH_ML_DSA_SHA256,
  CKM_HASH_ML_DSA_SHA384,
  CKM_HASH_ML_DSA_SHA512,
  CKM_HASH_ML_DSA_SHA3_224,
  CKM_HASH_ML_DSA_SHA3_256,
  CKM_HASH_ML_DSA_SHA3_384,
  CKM_HASH_ML_DSA_SHA3_512,
  CKM_HASH_ML_DSA_SHAKE128,
  CKM_HASH_ML_DSA_SHAKE256,
  CKH_HEDGE_PREFERRED,
  CKH_DETERMINISTIC_REQUIRED,
} from '@/wasm/softhsm/constants'
import type { TestResult } from '../useAcvpSuite'

/** Vendor-defined (NOT PKCS#11 v3.2) — pqctoday-hsm src/lib/vendor_mechanisms.h,
 * rust/src/constants.rs. µ travels as the C_Sign/C_Verify data argument. */
export const CKM_ML_DSA_EXTERNAL_MU_VENDOR = 0x0000403c
export const CKR_OK = 0x00000000
export const CKR_SIGNATURE_INVALID = 0x000000c0

/** ACVP hashAlg → PKCS#11 v3.2 Table 284 CKM_HASH_ML_DSA_<hash>. SHA2-512/224 and
 * SHA2-512/256 are absent on purpose: the specification defines no mechanism
 * for them, so no engine can advertise one.
 *
 * Built at call time, not module-eval time: in the production bundle these
 * constants live in the softhsm chunk, whose top-level await this chunk never
 * awaits, so a module-scope object would hold undefined (build TLA check). */
export const acvpHashToMech = (): Readonly<Record<string, number>> => ({
  'SHA2-224': CKM_HASH_ML_DSA_SHA224,
  'SHA2-256': CKM_HASH_ML_DSA_SHA256,
  'SHA2-384': CKM_HASH_ML_DSA_SHA384,
  'SHA2-512': CKM_HASH_ML_DSA_SHA512,
  'SHA3-224': CKM_HASH_ML_DSA_SHA3_224,
  'SHA3-256': CKM_HASH_ML_DSA_SHA3_256,
  'SHA3-384': CKM_HASH_ML_DSA_SHA3_384,
  'SHA3-512': CKM_HASH_ML_DSA_SHA3_512,
  'SHAKE-128': CKM_HASH_ML_DSA_SHAKE128,
  'SHAKE-256': CKM_HASH_ML_DSA_SHAKE256,
})

/** Structured identity of one executed (or skipped) case — the same facts the
 * row's text shows, in machine-readable form for evidence export. */
export interface AcvpCaseMeta {
  /** product-authored-mutation: a NIST case with a PQC Today-made change;
   * product-authored-probe: a PQC Today-authored PKCS#11 behaviour check. */
  origin:
    'nist-acvp-server' | 'product-authored-mutation' | 'product-authored-probe' | 'not-executed'
  upstreamOperation:
    | 'sigVer'
    | 'sigGen'
    | 'keyGen'
    | 'encapsulation'
    | 'decapsulation'
    | 'decapsulationKeyCheck'
    | 'encapsulationKeyCheck'
    // classical / symmetric (WS-E)
    | 'encrypt'
    | 'decrypt'
    | 'mac-generate'
    | 'mac-verify'
    | 'digest'
    | 'none'
  localOperation:
    | 'sigVer'
    | 'sigGen-deterministic'
    | 'sigGen-hedged'
    | 'keyGen-from-seed'
    | 'encapsulation'
    | 'decapsulation'
    | 'key-import'
    // classical / symmetric (WS-E)
    | 'encrypt'
    | 'decrypt'
    | 'mac-generate'
    | 'mac-verify'
    | 'digest'
    | 'wrap'
    | 'unwrap'
    | 'none'
  /** Algorithm parameter set, curve, key length or digest the case runs with. */
  parameterSet: string
  /** Classical-case parameters (key/IV/tag/AAD/payload/MAC lengths, curve…) — WS-E. */
  parameters?: Record<string, string | number | boolean>
  mode?: 'pure' | 'preHash' | 'externalMu' | 'internal'
  hashAlg?: string
  contextBytes?: number
  messageBytes?: number
  /** rejected/accepted: a VAL case whose upstream disposition is a boolean;
   * return-code: a boundary probe asserting an exact CK_RV (see expectedRv). */
  expected: 'valid' | 'invalid' | 'byte-match' | 'not-run' | 'rejected' | 'accepted' | 'return-code'
  expectedReason?: string
  /** Exact CK_RV name the row asserts, when it asserts one. */
  expectedRv?: string
  tgId?: number
  tcId?: number
  source: { repo: string; commit: string; path: string; sha256: string }
  observed?: string
}

export interface Provenance {
  producer?: string
  source_repo: string
  source_commit: string
  source_path: string
  source_sha256: string
}

export interface MldsaAcvpSectionCtx {
  M: SoftHSMModule
  hSession: number
  eName: string
  /** C_GetMechanismList result for this engine's slot (empty = probe failed). */
  mechs: Set<number>
  referenceUrl: string
  pushResult: (r: Omit<TestResult, 'category'>) => Promise<void>
  addLog: (msg: string) => void
}

// ── JSON shapes (only the fields read here) ─────────────────────────────────
interface SigVerCase {
  tcId: number
  testPassed: boolean
  reason: string
  hashAlg: string
  pk: string
  message?: string
  mu?: string
  context?: string
  signature: string
}
interface SigVerGroup {
  tgId: number
  parameterSet: string
  signatureInterface: string
  preHash: string
  externalMu: boolean
  tests: SigVerCase[]
}
interface SigGenCase {
  tcId: number
  hashAlg: string
  sk: string
  message?: string
  mu?: string
  context?: string
  signature: string
}
interface SigGenGroup {
  tgId: number
  parameterSet: string
  deterministic: boolean
  signatureInterface: string
  preHash: string
  externalMu: boolean
  tests: SigGenCase[]
}
interface KeyGenGroup {
  tgId: number
  parameterSet: string
  tests: { tcId: number; seed: string; pk: string }[]
}
interface NotExecuted {
  tgId: number
  tcId?: number
  parameterSet: string
  hashAlg?: string
  cases?: number
  why: string
}

const SV_PROV = sigVerVectors._provenance as Provenance
const SG_PROV = sigGenDetVectors._provenance as Provenance
const KG_PROV = keyGenVectors._provenance as Provenance
export const srcOf = (p: Provenance) => ({
  repo: p.source_repo,
  commit: p.source_commit,
  path: p.source_path,
  sha256: p.source_sha256,
})
/** "ACVP-Server@975de31e ML-DSA-sigVer-FIPS204" — short visible source tag. */
export const srcTag = (p: Provenance) =>
  `ACVP-Server@${p.source_commit.slice(0, 8)} ${p.source_path.split('/').slice(-2, -1)[0]}`

const variantOf = (ps: string) => parseInt(ps.split('-')[2], 10) as 44 | 65 | 87
export const nBytes = (hex: string | undefined) => (hex ? hex.length / 2 : 0)
export const hexOf = (b: Uint8Array) =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')

// ── Raw PKCS#11 helpers that return the CK_RV instead of throwing ──────────
// hsm_verifyBytes() collapses every non-OK return to `false`, which cannot
// tell CKR_SIGNATURE_INVALID from any other failure; a negative case must
// assert the exact code, so these call C_* directly.

/** CK_MECHANISM (+ optional CK_SIGN_ADDITIONAL_CONTEXT) in WASM memory. */
export function allocMech(
  M: SoftHSMModule,
  mechType: number,
  param: { hedge: number; context: Uint8Array } | null
): { mech: number; allocs: number[] } {
  const allocs: number[] = []
  const mech = M._malloc(12)
  allocs.push(mech)
  M.setValue(mech, mechType, 'i32')
  if (!param) {
    M.setValue(mech + 4, 0, 'i32')
    M.setValue(mech + 8, 0, 'i32')
    return { mech, allocs }
  }
  const p = M._malloc(12)
  allocs.push(p)
  M.setValue(p, param.hedge, 'i32')
  if (param.context.length > 0) {
    const c = writeBytes(M, param.context)
    allocs.push(c)
    M.setValue(p + 4, c, 'i32')
    M.setValue(p + 8, param.context.length, 'i32')
  } else {
    M.setValue(p + 4, 0, 'i32')
    M.setValue(p + 8, 0, 'i32')
  }
  M.setValue(mech + 4, p, 'i32')
  M.setValue(mech + 8, 12, 'i32')
  return { mech, allocs }
}

/** C_VerifyInit + C_Verify (single-part — PKCS#11 v3.2 Table 282). */
export function verifyRv(
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  mechType: number,
  data: Uint8Array,
  sig: Uint8Array,
  context: Uint8Array | null
): { initRv: number; rv: number } {
  const { mech, allocs } = allocMech(
    M,
    mechType,
    context ? { hedge: CKH_HEDGE_PREFERRED, context } : null
  )
  const dp = M._malloc(Math.max(1, data.length))
  M.HEAPU8.set(data, dp)
  const sp = writeBytes(M, sig)
  try {
    const initRv = M._C_VerifyInit(hSession, mech, pubHandle) >>> 0
    if (initRv !== CKR_OK) return { initRv, rv: initRv }
    const rv = M._C_Verify(hSession, dp, data.length, sp, sig.length) >>> 0
    return { initRv, rv }
  } finally {
    allocs.forEach((a) => M._free(a))
    M._free(dp)
    M._free(sp)
  }
}

/** C_SignInit(hedgeVariant = CKH_DETERMINISTIC_REQUIRED) + C_Sign (size query, then sign). */
export function signDeterministic(
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  mechType: number,
  data: Uint8Array,
  context: Uint8Array
): { rv: number; step: string; sig: Uint8Array | null } {
  const { mech, allocs } = allocMech(M, mechType, { hedge: CKH_DETERMINISTIC_REQUIRED, context })
  const dp = M._malloc(Math.max(1, data.length))
  M.HEAPU8.set(data, dp)
  const lenPtr = M._malloc(4)
  let sp = 0
  try {
    let rv = M._C_SignInit(hSession, mech, privHandle) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_SignInit', sig: null }
    M.setValue(lenPtr, 0, 'i32')
    rv = M._C_Sign(hSession, dp, data.length, 0, lenPtr) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_Sign(length)', sig: null }
    const len = M.getValue(lenPtr, 'i32') >>> 0
    sp = M._malloc(len)
    rv = M._C_Sign(hSession, dp, data.length, sp, lenPtr) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_Sign', sig: null }
    const out = M.HEAPU8.slice(sp, sp + (M.getValue(lenPtr, 'i32') >>> 0))
    return { rv, step: 'C_Sign', sig: out }
  } finally {
    allocs.forEach((a) => M._free(a))
    M._free(dp)
    M._free(lenPtr)
    if (sp) M._free(sp)
  }
}

/** C_CreateObject for an ML-DSA private key from the upstream sk (CKA_VALUE).
 * PKCS#11 v3.2 §6.67.3: CKA_SEED and/or CKA_VALUE; the NIST sigGen vectors
 * carry sk only. Session object (CKA_TOKEN = false), destroyed after use. */
function importPrivateKey(
  M: SoftHSMModule,
  hSession: number,
  parameterSet: string,
  sk: Uint8Array
): { rv: number; handle: number } {
  const skPtr = writeBytes(M, sk)
  const defs = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: dsaParamSet(variantOf(parameterSet)) },
    { type: CKA_VALUE, bytesPtr: skPtr, bytesLen: sk.length },
  ]
  const tpl = buildTemplate(M, defs)
  const hPtr = M._malloc(4)
  try {
    const rv = M._C_CreateObject(hSession, tpl.ptr, defs.length, hPtr) >>> 0
    return { rv, handle: rv === CKR_OK ? M.getValue(hPtr, 'i32') >>> 0 : 0 }
  } finally {
    freeTemplate(M, tpl, defs.length)
    M._free(hPtr)
    M._free(skPtr)
  }
}

/** C_GenerateKeyPair(CKM_ML_DSA_KEY_PAIR_GEN) with CKA_SEED in the PRIVATE
 * template (the C++ engine rejects it in the public template with
 * CKR_ATTRIBUTE_TYPE_INVALID; both engines accept it here). */
function generateFromSeed(
  M: SoftHSMModule,
  hSession: number,
  parameterSet: string,
  seed: Uint8Array
): { rv: number; pubHandle: number; privHandle: number } {
  const mech = M._malloc(12)
  M.setValue(mech, CKM_ML_DSA_KEY_PAIR_GEN, 'i32')
  M.setValue(mech + 4, 0, 'i32')
  M.setValue(mech + 8, 0, 'i32')
  const seedPtr = writeBytes(M, seed)
  const pubDefs = [
    { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_VERIFY, boolVal: true },
    { type: CKA_PARAMETER_SET, ulongVal: dsaParamSet(variantOf(parameterSet)) },
  ]
  const prvDefs = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PRIVATE, boolVal: true },
    { type: CKA_SENSITIVE, boolVal: true },
    { type: CKA_SIGN, boolVal: true },
    { type: CKA_SEED, bytesPtr: seedPtr, bytesLen: seed.length },
  ]
  const pubTpl = buildTemplate(M, pubDefs)
  const prvTpl = buildTemplate(M, prvDefs)
  const pubH = M._malloc(4)
  const prvH = M._malloc(4)
  try {
    const rv =
      M._C_GenerateKeyPair(
        hSession,
        mech,
        pubTpl.ptr,
        pubDefs.length,
        prvTpl.ptr,
        prvDefs.length,
        pubH,
        prvH
      ) >>> 0
    return {
      rv,
      pubHandle: rv === CKR_OK ? M.getValue(pubH, 'i32') >>> 0 : 0,
      privHandle: rv === CKR_OK ? M.getValue(prvH, 'i32') >>> 0 : 0,
    }
  } finally {
    freeTemplate(M, pubTpl, pubDefs.length)
    freeTemplate(M, prvTpl, prvDefs.length)
    M._free(pubH)
    M._free(prvH)
    M._free(mech)
    M._free(seedPtr)
  }
}

export const destroy = (M: SoftHSMModule, hSession: number, h: number) => {
  if (h) M._C_DestroyObject(hSession, h)
}

/** First differing byte, for a byte-match failure message. */
export const firstDiff = (a: Uint8Array, b: Uint8Array): string => {
  if (a.length !== b.length) return `length ${a.length} ≠ expected ${b.length}`
  const i = a.findIndex((x, k) => x !== b[k]) // eslint-disable-line security/detect-object-injection
  return i < 0 ? 'identical' : `first difference at byte ${i}`
}

const modeLabel = (g: { preHash: string; externalMu: boolean }, hashAlg: string) =>
  g.externalMu
    ? 'External μ (vendor 0x403c)'
    : g.preHash === 'preHash'
      ? `HashML-DSA/${hashAlg}`
      : 'pure'

const mechFor = (g: { preHash: string; externalMu: boolean }, hashAlg: string) =>
  g.externalMu
    ? CKM_ML_DSA_EXTERNAL_MU_VENDOR
    : g.preHash === 'preHash'
      ? acvpHashToMech()[hashAlg] // eslint-disable-line security/detect-object-injection
      : CKM_ML_DSA

/** Why a mechanism can't run on this engine, or null when it can. Mirrors the
 * rest of the suite: an empty list means the probe itself failed, so run. */
export const unsupportedReason = (mechs: Set<number>, mech: number | undefined, label: string) => {
  if (mech === undefined) return `${label}: no PKCS#11 v3.2 mechanism exists`
  if (mechs.size > 0 && !mechs.has(mech))
    return `${label} (0x${mech.toString(16)}) is not advertised by C_GetMechanismList on this engine`
  return null
}

/**
 * Run the ML-DSA reference-sample rows for ONE engine. Every row carries the
 * upstream tgId/tcId, mode, context length and source commit in its visible
 * text and in `caseMeta`.
 */
export async function runMldsaAcvpSection(ctx: MldsaAcvpSectionCtx): Promise<void> {
  const { M, hSession, eName, mechs, referenceUrl, pushResult, addLog } = ctx
  const rvText = (rv: number) => rvName(rv)

  // ── 1. Dedicated SigVer (NIST expected disposition) ────────────────────
  for (const g of sigVerVectors.testGroups as SigVerGroup[]) {
    const ps = g.parameterSet
    for (const t of g.tests) {
      const mode = modeLabel(g, t.hashAlg)
      const ctxLen = nBytes(t.context)
      const data = g.externalMu ? t.mu! : t.message!
      const expectValid = t.testPassed
      const id = `mldsa-sigver-nist-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const testCase =
        `SigVer · NIST sigVer tg${g.tgId}/tc${t.tcId} · ${mode}` +
        (g.externalMu ? '' : ` · ctx ${ctxLen}B`) +
        ` · expect ${expectValid ? 'valid' : `invalid (${t.reason})`}`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'sigVer',
        localOperation: 'sigVer',
        parameterSet: ps,
        mode: g.externalMu ? 'externalMu' : g.preHash === 'preHash' ? 'preHash' : 'pure',
        hashAlg: t.hashAlg,
        contextBytes: g.externalMu ? undefined : ctxLen,
        messageBytes: nBytes(data),
        expected: expectValid ? 'valid' : 'invalid',
        expectedReason: t.reason,
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(SV_PROV),
      }
      const mech = mechFor(g, t.hashAlg)
      const skipWhy = unsupportedReason(
        mechs,
        mech,
        g.externalMu ? 'vendor-defined CKM_ML_DSA_EXTERNAL_MU (not a PKCS#11 v3.2 mechanism)' : mode
      )
      if (skipWhy) {
        addLog(`[${eName}] [SKIP] ${ps} ${testCase}: ${skipWhy}`)
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: 'skip',
          details: `Skipped — ${skipWhy}`,
          caseMeta: { ...meta, expected: 'not-run', origin: 'not-executed' },
        })
        continue
      }
      let pub = 0
      try {
        pub = hsm_importMLDSAPublicKey(M, hSession, variantOf(ps), hexToBytes(t.pk))
        const r = verifyRv(
          M,
          hSession,
          pub,
          mech!,
          hexToBytes(data),
          hexToBytes(t.signature),
          g.externalMu ? null : hexToBytes(t.context ?? '')
        )
        const want = expectValid ? CKR_OK : CKR_SIGNATURE_INVALID
        const ok = r.initRv === CKR_OK && r.rv === want
        const observed =
          r.initRv !== CKR_OK ? `C_VerifyInit → ${rvText(r.initRv)}` : `C_Verify → ${rvText(r.rv)}`
        const verdict = ok
          ? ''
          : !expectValid && r.rv === CKR_OK
            ? ' — ACCEPTED an invalid signature'
            : ' — unexpected return'
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: ok ? 'pass' : 'fail',
          details: `${observed} (expected ${rvText(want)})${verdict} · msg ${nBytes(data)}B · ${srcTag(SV_PROV)}`,
          caseMeta: { ...meta, observed },
        })
        addLog(`[${eName}] [id:${id}] ${ps} ${testCase}: ${ok ? 'PASS' : 'FAIL'} (${observed})`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: 'fail',
          details: `${msg} · ${srcTag(SV_PROV)}`,
          caseMeta: { ...meta, observed: msg },
        })
        addLog(`[DISCREPANCY] [${eName}] [id:${id}] ${ps} ${testCase}: ${msg}`)
      } finally {
        destroy(M, hSession, pub)
      }
    }

    // ── 1b. Product-authored negatives (public key / context mutation) ────
    // Upstream has no such reason class; derive them from this group's
    // positive pure case. Deliberately NO evidence tier: these expected
    // values are PQC Today's, not NIST's.
    if (g.signatureInterface !== 'external' || g.preHash !== 'pure') continue
    const base = g.tests.find((t) => t.testPassed)
    if (!base) continue
    const baseCtx = hexToBytes(base.context ?? '')
    const mutations: { key: string; label: string; pk: Uint8Array; context: Uint8Array }[] = []
    const pkMut = hexToBytes(base.pk)
    pkMut[0] ^= 0x01
    mutations.push({
      key: 'pk-bitflip',
      label: 'public-key bit flip (pk[0]^=0x01)',
      pk: pkMut,
      context: baseCtx,
    })
    const ctxMut = baseCtx.length > 0 ? baseCtx.slice() : new Uint8Array([0x00])
    if (baseCtx.length > 0) ctxMut[0] ^= 0x01
    mutations.push({
      key: 'ctx-bitflip',
      label:
        baseCtx.length > 0 ? 'context bit flip (ctx[0]^=0x01)' : 'context changed from empty to 00',
      pk: hexToBytes(base.pk),
      context: ctxMut,
    })
    for (const mu of mutations) {
      const id = `mldsa-sigver-local-${mu.key}-${ps}-${eName}`
      const testCase = `SigVer · product-authored negative · ${mu.label} of NIST tc${base.tcId} · expect invalid`
      const meta: AcvpCaseMeta = {
        origin: 'product-authored-mutation',
        upstreamOperation: 'sigVer',
        localOperation: 'sigVer',
        parameterSet: ps,
        mode: 'pure',
        contextBytes: mu.context.length,
        messageBytes: nBytes(base.message),
        expected: 'invalid',
        expectedReason: mu.key,
        tgId: g.tgId,
        tcId: base.tcId,
        source: srcOf(SV_PROV),
      }
      const skipWhy = unsupportedReason(mechs, CKM_ML_DSA, 'CKM_ML_DSA')
      if (skipWhy) {
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: 'skip',
          details: `Skipped — ${skipWhy}`,
          caseMeta: { ...meta, expected: 'not-run', origin: 'not-executed' },
        })
        continue
      }
      let pub = 0
      try {
        pub = hsm_importMLDSAPublicKey(M, hSession, variantOf(ps), mu.pk)
        const r = verifyRv(
          M,
          hSession,
          pub,
          CKM_ML_DSA,
          hexToBytes(base.message!),
          hexToBytes(base.signature),
          mu.context
        )
        const ok = r.initRv === CKR_OK && r.rv === CKR_SIGNATURE_INVALID
        const observed =
          r.initRv !== CKR_OK ? `C_VerifyInit → ${rvText(r.initRv)}` : `C_Verify → ${rvText(r.rv)}`
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: ok ? 'pass' : 'fail',
          details:
            `${observed} (expected CKR_SIGNATURE_INVALID)${!ok && r.rv === CKR_OK ? ' — ACCEPTED a mutated input' : ''}` +
            ` · PQC Today-authored mutation of ${srcTag(SV_PROV)} tc${base.tcId}, not a NIST vector`,
          caseMeta: { ...meta, observed },
        })
        addLog(`[${eName}] [id:${id}] ${ps} ${mu.key}: ${ok ? 'PASS' : 'FAIL'} (${observed})`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: 'fail',
          details: `${msg} · PQC Today-authored mutation, not a NIST vector`,
          caseMeta: { ...meta, observed: msg },
        })
      } finally {
        destroy(M, hSession, pub)
      }
    }
  }

  // ── 2. Deterministic SigGen byte-match ─────────────────────────────────
  for (const g of sigGenDetVectors.testGroups as SigGenGroup[]) {
    const ps = g.parameterSet
    for (const t of g.tests) {
      const mode = modeLabel(g, t.hashAlg)
      const ctxBytes = hexToBytes(t.context ?? '')
      const data = g.externalMu ? t.mu! : t.message!
      const id = `mldsa-siggen-det-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const testCase =
        `SigGen deterministic · NIST sigGen tg${g.tgId}/tc${t.tcId} · ${mode}` +
        (g.externalMu ? '' : ` · ctx ${ctxBytes.length}B`) +
        ' · byte-match'
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'sigGen',
        localOperation: 'sigGen-deterministic',
        parameterSet: ps,
        mode: g.externalMu ? 'externalMu' : g.preHash === 'preHash' ? 'preHash' : 'pure',
        hashAlg: t.hashAlg,
        contextBytes: g.externalMu ? undefined : ctxBytes.length,
        messageBytes: nBytes(data),
        expected: 'byte-match',
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(SG_PROV),
      }
      const mech = mechFor(g, t.hashAlg)
      const skipWhy = unsupportedReason(
        mechs,
        mech,
        g.externalMu ? 'vendor-defined CKM_ML_DSA_EXTERNAL_MU (not a PKCS#11 v3.2 mechanism)' : mode
      )
      if (skipWhy) {
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: 'skip',
          details: `Skipped — ${skipWhy}`,
          caseMeta: { ...meta, expected: 'not-run', origin: 'not-executed' },
        })
        continue
      }
      let priv = 0
      try {
        const imp = importPrivateKey(M, hSession, ps, hexToBytes(t.sk))
        if (imp.rv !== CKR_OK) throw new Error(`C_CreateObject(ML-DSA sk) → ${rvText(imp.rv)}`)
        priv = imp.handle
        const s = signDeterministic(M, hSession, priv, mech!, hexToBytes(data), ctxBytes)
        if (!s.sig) throw new Error(`${s.step} → ${rvText(s.rv)}`)
        const expected = hexToBytes(t.signature)
        const diff = firstDiff(s.sig, expected)
        const ok = diff === 'identical'
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: ok ? 'pass' : 'fail',
          details: ok
            ? `sig[${s.sig.length}B] byte-equal to NIST expected (CKH_DETERMINISTIC_REQUIRED, sk via C_CreateObject) · ${srcTag(SG_PROV)}`
            : `signature mismatch: ${diff} · got ${hexOf(s.sig.slice(0, 8))}… · ${srcTag(SG_PROV)}`,
          caseMeta: { ...meta, observed: ok ? 'byte-equal' : diff },
        })
        addLog(`[${eName}] [id:${id}] ${ps} ${testCase}: ${ok ? 'PASS' : `FAIL (${diff})`}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: 'fail',
          details: `${msg} · ${srcTag(SG_PROV)}`,
          caseMeta: { ...meta, observed: msg },
        })
        addLog(`[DISCREPANCY] [${eName}] [id:${id}] ${ps} ${testCase}: ${msg}`)
      } finally {
        destroy(M, hSession, priv)
      }
    }
  }

  // ── 3. KeyGen from seed (CKA_SEED) ─────────────────────────────────────
  for (const g of keyGenVectors.testGroups as KeyGenGroup[]) {
    const ps = g.parameterSet
    for (const t of g.tests) {
      const id = `mldsa-keygen-seed-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const testCase = `KeyGen from seed (CKA_SEED ξ) · NIST keyGen tg${g.tgId}/tc${t.tcId} · pk byte-match`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'keyGen',
        localOperation: 'keyGen-from-seed',
        parameterSet: ps,
        expected: 'byte-match',
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(KG_PROV),
      }
      const skipWhy = unsupportedReason(mechs, CKM_ML_DSA_KEY_PAIR_GEN, 'CKM_ML_DSA_KEY_PAIR_GEN')
      if (skipWhy) {
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: 'skip',
          details: `Skipped — ${skipWhy}`,
          caseMeta: { ...meta, expected: 'not-run', origin: 'not-executed' },
        })
        continue
      }
      let pair = { rv: 0, pubHandle: 0, privHandle: 0 }
      try {
        pair = generateFromSeed(M, hSession, ps, hexToBytes(t.seed))
        if (pair.rv !== CKR_OK) throw new Error(`C_GenerateKeyPair(CKA_SEED) → ${rvText(pair.rv)}`)
        const pk = new Uint8Array(hsm_extractKeyValue(M, hSession, pair.pubHandle))
        const diff = firstDiff(pk, hexToBytes(t.pk))
        const ok = diff === 'identical'
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: ok ? 'pass' : 'fail',
          details:
            (ok ? `pk[${pk.length}B] byte-equal to NIST expected` : `pk mismatch: ${diff}`) +
            ' · seed supplied in the private-key template (§6.67.4 lists CKA_SEED as mechanism-contributed; accepting it as input is engine behaviour)' +
            ` · ${srcTag(KG_PROV)}`,
          caseMeta: { ...meta, observed: ok ? 'byte-equal' : diff },
        })
        addLog(`[${eName}] [id:${id}] ${ps} ${testCase}: ${ok ? 'PASS' : `FAIL (${diff})`}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        await pushResult({
          id,
          algorithm: `${ps} (${eName})`,
          testCase,
          referenceUrl,
          status: 'fail',
          details: `${msg} · ${srcTag(KG_PROV)}`,
          caseMeta: { ...meta, observed: msg },
        })
        addLog(`[DISCREPANCY] [${eName}] [id:${id}] ${ps} ${testCase}: ${msg}`)
      } finally {
        destroy(M, hSession, pair.pubHandle)
        destroy(M, hSession, pair.privHandle)
      }
    }
  }

  // ── 4. Honest skips: upstream groups PKCS#11 cannot express ─────────────
  const svNotRun = sigVerVectors.notExecuted as NotExecuted[]
  const sgNotRun = sigGenDetVectors.notExecuted as NotExecuted[]
  const ids = (rows: NotExecuted[]) =>
    rows.map((r) => (r.tcId ? `tg${r.tgId}/tc${r.tcId}` : `tg${r.tgId}`)).join(', ')

  const noHashMech = svNotRun.filter((r) => r.why === 'no-pkcs11-hash-ml-dsa-mechanism')
  if (noHashMech.length > 0) {
    const hashes = [...new Set(noHashMech.map((r) => r.hashAlg))].sort()
    // Runtime confirmation, not an assumption: none of this engine's advertised
    // mechanisms is a HashML-DSA-with-hashing mechanism for these hashes (the
    // Table 284 set is the only one that exists), so there is nothing to call.
    const advertisedHashMechs = Object.values(acvpHashToMech()).filter((m) => mechs.has(m)).length
    await pushResult({
      id: `mldsa-skip-hash-sha512t-${eName}`,
      algorithm: `ML-DSA-44/65/87 (${eName})`,
      testCase: `HashML-DSA SigVer · ${hashes.join(', ')} · NIST sigVer ${noHashMech.length} cases`,
      referenceUrl,
      status: 'skip',
      details:
        `Skipped — PKCS#11 v3.2 Table 284 defines no CKM_HASH_ML_DSA_<hash> mechanism for ${hashes.join(' or ')}; ` +
        `C_GetMechanismList on this engine advertises ${advertisedHashMechs} of the 10 that do exist and none for these hashes. ` +
        `Generic CKM_HASH_ML_DSA (caller-supplied digest) is not exercised here. Not run: ${ids(noHashMech)} · ${srcTag(SV_PROV)}`,
      caseMeta: {
        origin: 'not-executed',
        upstreamOperation: 'sigVer',
        localOperation: 'none',
        parameterSet: 'ML-DSA-44/65/87',
        mode: 'preHash',
        hashAlg: hashes.join(','),
        expected: 'not-run',
        source: srcOf(SV_PROV),
      },
    })
  }

  const hedged = sgNotRun.filter((r) => r.why === 'hedged-rnd-not-injectable')
  if (hedged.length > 0) {
    await pushResult({
      id: `mldsa-skip-hedged-rnd-${eName}`,
      algorithm: `ML-DSA-44/65/87 (${eName})`,
      testCase: `SigGen hedged · byte-match against NIST rnd · ${hedged.length} groups`,
      referenceUrl,
      status: 'skip',
      details:
        'Skipped — CK_SIGN_ADDITIONAL_CONTEXT carries hedgeVariant and context only; there is no PKCS#11 parameter for an ' +
        'explicit rnd, so with CKH_HEDGE_REQUIRED the token draws its own randomness and the NIST hedged signature cannot be ' +
        `reproduced through this interface. Not run: sigGen ${ids(hedged)} · ${srcTag(SG_PROV)}`,
      caseMeta: {
        origin: 'not-executed',
        upstreamOperation: 'sigGen',
        localOperation: 'none',
        parameterSet: 'ML-DSA-44/65/87',
        expected: 'not-run',
        source: srcOf(SG_PROV),
      },
    })
  }

  const internal = [
    ...svNotRun.filter((r) => r.why === 'no-pkcs11-internal-interface'),
    ...sgNotRun.filter((r) => r.why === 'no-pkcs11-internal-interface'),
  ]
  if (internal.length > 0) {
    await pushResult({
      id: `mldsa-skip-internal-${eName}`,
      algorithm: `ML-DSA-44/65/87 (${eName})`,
      testCase: 'SigVer/SigGen internal interface (raw M′, externalMu=false)',
      referenceUrl,
      status: 'skip',
      details:
        'Skipped — no PKCS#11 v3.2 mechanism exposes ML-DSA.Sign_internal/Verify_internal on a caller-supplied M′ ' +
        '(CKM_ML_DSA always applies the external domain-separation prefix). ' +
        `Not run: sigVer ${ids(svNotRun.filter((r) => r.why === 'no-pkcs11-internal-interface'))}; ` +
        `sigGen ${ids(sgNotRun.filter((r) => r.why === 'no-pkcs11-internal-interface'))}`,
      caseMeta: {
        origin: 'not-executed',
        upstreamOperation: 'sigVer',
        localOperation: 'none',
        parameterSet: 'ML-DSA-44/65/87',
        mode: 'internal',
        expected: 'not-run',
        source: srcOf(SV_PROV),
      },
    })
  }
}
