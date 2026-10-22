// SPDX-License-Identifier: AGPL-3.0-only
//
// v33DraftFeatures — the "v3.3 draft features" check group (plan D1–D4).
//
// SEPARATE FROM EVERY v3.2 VERDICT. Nothing here feeds profileConditions.ts,
// Tier A (the OASIS v3.2 XML test cases), the v3.2 error-path expansion, or
// any v3.2 pass count. The coverage matrix's test registry lists these checks
// under their own runner ('v33DraftFeatures', Rust engine only), as v3.3
// working-draft tests of the composite mechanisms. The group is labelled exactly as
// V33_DRAFT_GROUP_LABEL says: no OASIS v3.3 profile or test case exists, so
// these checks test the engine against the v3.3 working draft and the IETF
// composite drafts, never against an invented OASIS case.
//
// Statuses: 'pass' / 'fail' only when the loaded engine advertises the
// mechanism the check needs. A mechanism it does not advertise is
// 'not-in-engine' ("not in this engine yet"); a parameter set the engine
// refuses with CKR_PARAMETER_SET_NOT_SUPPORTED is 'not-supported' (the
// drafts allow a subset, e.g. no brainpool). A case whose expected code
// comes from engine work not yet shipped is 'pending-engine'. None of those
// three is ever a failure.
//
// The Build tab's v3.3 test bench and the conformance runner both call
// these functions, so the bench and the compliance group cannot disagree.
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { sha256, sha512 } from '@noble/hashes/sha2.js'
import { shake256 } from '@noble/hashes/sha3.js'
import {
  CKA_KEYS_REMAINING,
  CKA_PUBLIC_KEY_INFO,
  CKA_VALUE,
  CKM_COMP_KEM,
  CKM_COMP_SIG,
  CKM_ML_DSA_EXTERNAL_MU,
  CKM_HSS,
  CKM_XMSS,
  CKM_XMSSMT,
  CKO_PRIVATE_KEY,
  CKP_LMOTS_SHA256_N32_W8,
  CKP_LMS_SHA256_M32_H5,
  CKP_XMSS_SHA2_10_256,
  CKP_XMSSMT_SHA2_20_2_256,
  CKR_PARAMETER_SET_NOT_SUPPORTED,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_PARAMETER_SET,
  CKA_DECAPSULATE,
  CKA_SENSITIVE,
  CKK_COMP_KEM,
} from '../softhsm/constants'
import {
  COMPOSITE_KEM_SETS,
  COMPOSITE_SIG_SETS,
  base64ToBytes,
  hsm_compositeDecapsulateRv,
  hsm_compositeEncapsulateRv,
  hsm_compositeSignRv,
  hsm_compositeVerifyRv,
  hsm_externalMuGenRv,
  hsm_externalMuVerifyRv,
  hsm_compositeEncapsulate,
  hsm_generateCompositeKeyPair,
  hsm_importCompositeKeyRv,
  hsm_readAttrRv,
  isBrainpoolSet,
  type CompositeKemSet,
  type CompositeSigSet,
  type V33Support,
} from '../softhsm/v33'
import { hsm_generateMLDSAKeyPair, hsm_verifyBytesMLDSA } from '../softhsm'
import {
  hsm_generateHSSKeyPair,
  hsm_generateXMSSKeyPair,
  hsm_generateXMSSMTKeyPair,
  hsm_statefulSignBytes,
} from '../softhsm/stateful'
import {
  allocUlong,
  buildTemplate,
  freeTemplate,
  readUlong,
  type AttrDef,
} from '../softhsm/helpers'
import { rvName as rvNameOf } from '../softhsm/logging'
import { V33_DRAFT_ERROR_PATHS, V33_RV, type V33ErrorPathCase } from './errorPathCatalog'
import provenance from '@/data/pkcs11-v33/_provenance.json'

/** Plan D1 label, verbatim. */
export const V33_DRAFT_GROUP_LABEL =
  'No OASIS v3.3 profile or test case exists yet. These checks test this engine against the v3.3 working draft and the IETF composite drafts.'

export const V33_DRAFT_GROUP_TITLE = 'v3.3 draft features'

export type V33CheckStatus = 'pass' | 'fail' | 'not-in-engine' | 'not-supported' | 'pending-engine'

export type V33CheckSection = 'coverage' | 'kat' | 'external-mu' | 'keys-remaining' | 'error-path'

export interface V33CheckRow {
  id: string
  section: V33CheckSection
  title: string
  status: V33CheckStatus
  /** What the engine did, in its own return codes. */
  observed: string
  /** What the check required. */
  expected: string
  /** Vector source + commit, for KAT rows. */
  source?: string
  citation?: string
  ckpName?: string
  ms?: number
}

export const V33_SECTION_TITLES: Record<V33CheckSection, string> = {
  coverage: 'Coverage probes',
  kat: 'Known-answer checks (IETF LAMPS vectors)',
  'external-mu': 'ML-DSA external µ',
  'keys-remaining': 'CKA_KEYS_REMAINING',
  'error-path': 'Error paths',
}

export interface V33Summary {
  pass: number
  fail: number
  notInEngine: number
  notSupported: number
  pendingEngine: number
}

/** Counted only inside this group — never added to a v3.2 total. */
export const summarizeV33 = (rows: readonly V33CheckRow[]): V33Summary => ({
  pass: rows.filter((r) => r.status === 'pass').length,
  fail: rows.filter((r) => r.status === 'fail').length,
  notInEngine: rows.filter((r) => r.status === 'not-in-engine').length,
  notSupported: rows.filter((r) => r.status === 'not-supported').length,
  pendingEngine: rows.filter((r) => r.status === 'pending-engine').length,
})

const rv = (code: number) => rvNameOf(code)
const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
const eq = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i])
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

const destroyAll = (M: SoftHSMModule, hSession: number, handles: number[]) => {
  for (const h of handles) if (h) M._C_DestroyObject(hSession, h)
}

// ── Vector loading ───────────────────────────────────────────────────────────

export interface KemVector {
  tcId: string
  ek: string
  dk: string
  c: string
  k: string
}
export interface SigVector {
  tcId: string
  pk: string
  s: string
  sWithContext: string
}
export interface V33Vectors {
  kem: { tests: KemVector[] }
  sig: { m: string; ctx: string; tests: SigVector[] }
}

/** Lazy — the two files are ~675 KB together, loaded only when a KAT runs. */
export const loadV33Vectors = async (): Promise<V33Vectors> => {
  const [kem, sig] = await Promise.all([
    import('@/data/pkcs11-v33/composite-kem/testvectors.json'),
    import('@/data/pkcs11-v33/composite-sig/testvectors.json'),
  ])
  return {
    kem: (kem.default ?? kem) as unknown as V33Vectors['kem'],
    sig: (sig.default ?? sig) as unknown as V33Vectors['sig'],
  }
}

const KEM_PROV = provenance.files['composite-kem/testvectors.json']
const SIG_PROV = provenance.files['composite-sig/testvectors.json']
/** "lamps-wg/draft-composite-kem @ d77e754 (2026-02-21)" — shown on every KAT row. */
export const KEM_VECTOR_SOURCE = `lamps-wg/draft-composite-kem @ ${KEM_PROV.source_commit.slice(0, 7)} (${KEM_PROV.source_commit_date})`
export const SIG_VECTOR_SOURCE = `lamps-wg/draft-composite-sigs @ ${SIG_PROV.source_commit.slice(0, 7)} (${SIG_PROV.source_commit_date})`
export const KEM_VECTOR_URL = KEM_PROV.source_url
export const SIG_VECTOR_URL = SIG_PROV.source_url

// ── D2: coverage probes ──────────────────────────────────────────────────────

export interface V33Ctx {
  M: SoftHSMModule
  hSession: number
  support: V33Support
}

/** C_GetMechanismInfo rows for the seven v3.3 mechanisms. */
export const mechanismInfoRows = (support: V33Support): V33CheckRow[] =>
  Object.values(support.mechs).map((m) => {
    const flagsHex = m.info ? `0x${m.info.flags.toString(16).padStart(8, '0')}` : '—'
    return {
      id: `v33.coverage.info.${m.def.name}`,
      section: 'coverage' as const,
      title: `C_GetMechanismInfo(${m.def.name})`,
      status: !m.advertised ? 'not-in-engine' : m.flagsOk ? 'pass' : 'fail',
      observed: !m.advertised
        ? 'not in C_GetMechanismList'
        : m.info
          ? `flags ${flagsHex}, key size ${m.info.ulMinKeySize}–${m.info.ulMaxKeySize}`
          : 'C_GetMechanismInfo failed',
      expected: m.def.expectedFlagNames.join(' | '),
    }
  })

/** One real round trip for a composite KEM set: generate, encapsulate,
 * decapsulate, compare the two secrets. */
export const roundTripKemSet = (ctx: V33Ctx, set: CompositeKemSet): V33CheckRow => {
  const { M, hSession, support } = ctx
  const base = {
    id: `v33.coverage.kem.${set.ckpName}`,
    section: 'coverage' as const,
    title: `Composite KEM round trip · ${set.ckpName}`,
    ckpName: set.ckpName,
    expected: 'generate → encapsulate → decapsulate gives the same 32-byte secret',
  }
  if (!support.compKem)
    return { ...base, status: 'not-in-engine', observed: 'CKM_COMP_KEM not advertised' }
  const handles: number[] = []
  const t0 = now()
  try {
    let pair: { pubHandle: number; privHandle: number }
    try {
      pair = hsm_generateCompositeKeyPair(M, hSession, 'kem', set.ckp)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('CKR_PARAMETER_SET_NOT_SUPPORTED'))
        return { ...base, status: 'not-supported', observed: msg }
      return { ...base, status: 'fail', observed: msg }
    }
    handles.push(pair.pubHandle, pair.privHandle)
    const enc = hsm_compositeEncapsulateRv(M, hSession, pair.pubHandle)
    if (enc.rv !== 0)
      return { ...base, status: 'fail', observed: `C_EncapsulateKey → ${rv(enc.rv)}` }
    handles.push(enc.secretHandle)
    const dec = hsm_compositeDecapsulateRv(M, hSession, pair.privHandle, enc.ciphertext!)
    if (dec.rv !== 0)
      return { ...base, status: 'fail', observed: `C_DecapsulateKey → ${rv(dec.rv)}` }
    handles.push(dec.secretHandle)
    const a = hsm_readAttrRv(M, hSession, enc.secretHandle, CKA_VALUE).value
    const b = hsm_readAttrRv(M, hSession, dec.secretHandle, CKA_VALUE).value
    const ok = !!a && !!b && eq(a, b) && a.length === 32
    const pub = hsm_readAttrRv(M, hSession, pair.pubHandle, CKA_VALUE).value
    return {
      ...base,
      status: ok && enc.ciphertext!.length === set.ciphertextBytes ? 'pass' : 'fail',
      observed: `public key ${pub?.length ?? '?'} B, ciphertext ${enc.ciphertext!.length} B (draft ${set.ciphertextBytes}), secrets ${ok ? 'equal' : 'DIFFER'}`,
      ms: Math.round(now() - t0),
    }
  } finally {
    destroyAll(M, hSession, handles)
  }
}

const MSG = new TextEncoder().encode('PKCS#11 v3.3 composite check')
const CTX = new TextEncoder().encode('pqctoday v3.3 bench')

/** A KEM set every engine with composite KEM should support (no brainpool). */
const X25519_KEM = () => COMPOSITE_KEM_SETS.find((s) => s.trad === 'X25519')!
const P256_SIG = () =>
  COMPOSITE_SIG_SETS.find((s) => s.trad === 'ECDSA-P256' && s.ml === 'ML-DSA-65')!

/** One real round trip for a composite signature set: generate, sign with a
 * context, verify, then verify a signature with one half stripped. */
export const roundTripSigSet = (ctx: V33Ctx, set: CompositeSigSet): V33CheckRow => {
  const { M, hSession, support } = ctx
  const base = {
    id: `v33.coverage.sig.${set.ckpName}`,
    section: 'coverage' as const,
    title: `Composite signature round trip · ${set.ckpName}`,
    ckpName: set.ckpName,
    expected: 'sign → verify accepts; the ML-DSA half alone is rejected',
  }
  if (!support.compSig)
    return { ...base, status: 'not-in-engine', observed: 'CKM_COMP_SIG not advertised' }
  const handles: number[] = []
  const t0 = now()
  try {
    let pair: { pubHandle: number; privHandle: number }
    try {
      pair = hsm_generateCompositeKeyPair(M, hSession, 'sig', set.ckp)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('CKR_PARAMETER_SET_NOT_SUPPORTED'))
        return { ...base, status: 'not-supported', observed: msg }
      return { ...base, status: 'fail', observed: msg }
    }
    handles.push(pair.pubHandle, pair.privHandle)
    const s = hsm_compositeSignRv(M, hSession, pair.privHandle, MSG, { context: CTX })
    if (s.rv !== 0) return { ...base, status: 'fail', observed: `${s.step} → ${rv(s.rv)}` }
    const v = hsm_compositeVerifyRv(M, hSession, pair.pubHandle, MSG, s.signature!, {
      context: CTX,
    })
    const stripped = s.signature!.slice(0, set.mlSignatureBytes)
    const v2 = hsm_compositeVerifyRv(M, hSession, pair.pubHandle, MSG, stripped, { context: CTX })
    const ok = v.rv === 0 && v2.rv !== 0
    return {
      ...base,
      status: ok ? 'pass' : 'fail',
      observed: `signature ${s.signature!.length} B; verify → ${rv(v.rv)}; ML-DSA half only → ${rv(v2.rv)}`,
      ms: Math.round(now() - t0),
    }
  } finally {
    destroyAll(M, hSession, handles)
  }
}

/** CKM_COMP_SIG_EXTERNAL_HASH round trip on one set: the pre-hash is computed
 * outside the engine (noble), signed and verified with the external-hash
 * mechanism, and the same signature must also verify over the full message
 * with CKM_COMP_SIG (both mechanisms sign the same M′). */
export const roundTripSigExternalHash = (
  ctx: V33Ctx,
  set: CompositeSigSet = P256_SIG()
): V33CheckRow => {
  const { M, hSession, support } = ctx
  const base = {
    id: `v33.coverage.sig-external-hash.${set.ckpName}`,
    section: 'coverage' as const,
    title: `Composite signature, external hash · ${set.ckpName}`,
    ckpName: set.ckpName,
    expected: `sign a ${set.preHash} pre-hash → verify with CKM_COMP_SIG_EXTERNAL_HASH and with CKM_COMP_SIG over the message`,
  }
  if (!support.compSigExternalHash)
    return {
      ...base,
      status: 'not-in-engine',
      observed: 'CKM_COMP_SIG_EXTERNAL_HASH not advertised',
    }
  const ph = set.preHash === 'SHA256' ? sha256(MSG) : set.preHash === 'SHA512' ? sha512(MSG) : null
  if (!ph) return { ...base, status: 'fail', observed: `no offline pre-hash for ${set.preHash}` }
  const handles: number[] = []
  const t0 = now()
  try {
    let pair: { pubHandle: number; privHandle: number }
    try {
      pair = hsm_generateCompositeKeyPair(M, hSession, 'sig', set.ckp)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('CKR_PARAMETER_SET_NOT_SUPPORTED'))
        return { ...base, status: 'not-supported', observed: msg }
      return { ...base, status: 'fail', observed: msg }
    }
    handles.push(pair.pubHandle, pair.privHandle)
    const s = hsm_compositeSignRv(M, hSession, pair.privHandle, ph, {
      externalHash: true,
      context: CTX,
    })
    if (s.rv !== 0) return { ...base, status: 'fail', observed: `${s.step} → ${rv(s.rv)}` }
    const v1 = hsm_compositeVerifyRv(M, hSession, pair.pubHandle, ph, s.signature!, {
      externalHash: true,
      context: CTX,
    })
    const v2 = hsm_compositeVerifyRv(M, hSession, pair.pubHandle, MSG, s.signature!, {
      context: CTX,
    })
    return {
      ...base,
      status: v1.rv === 0 && v2.rv === 0 ? 'pass' : 'fail',
      observed: `signature ${s.signature!.length} B; verify (external hash) → ${rv(v1.rv)}; verify (CKM_COMP_SIG, full message) → ${rv(v2.rv)}`,
      ms: Math.round(now() - t0),
    }
  } finally {
    destroyAll(M, hSession, handles)
  }
}

// ── D4: known-answer checks ──────────────────────────────────────────────────

/** Import the vector's private key, decapsulate its ciphertext, compare k. */
export const kemKat = (ctx: V33Ctx, set: CompositeKemSet, vectors: V33Vectors): V33CheckRow => {
  const { M, hSession, support } = ctx
  const base = {
    id: `v33.kat.kem.${set.ckpName}`,
    section: 'kat' as const,
    title: `Decapsulate the published ciphertext · ${set.draftName}`,
    ckpName: set.ckpName,
    expected: 'secret = published k',
    source: KEM_VECTOR_SOURCE,
  }
  if (!support.compKem)
    return { ...base, status: 'not-in-engine', observed: 'CKM_COMP_KEM not advertised' }
  const t = vectors.kem.tests.find((x) => x.tcId === set.draftName)
  if (!t) return { ...base, status: 'fail', observed: 'no vector for this set' }
  const handles: number[] = []
  try {
    const imp = hsm_importCompositeKeyRv(
      M,
      hSession,
      'kem',
      'private',
      set.ckp,
      base64ToBytes(t.dk)
    )
    if (imp.rv === CKR_PARAMETER_SET_NOT_SUPPORTED)
      return { ...base, status: 'not-supported', observed: `C_CreateObject → ${rv(imp.rv)}` }
    if (imp.rv !== 0) return { ...base, status: 'fail', observed: `C_CreateObject → ${rv(imp.rv)}` }
    handles.push(imp.handle)
    const dec = hsm_compositeDecapsulateRv(M, hSession, imp.handle, base64ToBytes(t.c))
    if (dec.rv !== 0)
      return { ...base, status: 'fail', observed: `C_DecapsulateKey → ${rv(dec.rv)}` }
    handles.push(dec.secretHandle)
    const got = hsm_readAttrRv(M, hSession, dec.secretHandle, CKA_VALUE).value
    const want = base64ToBytes(t.k)
    const ok = !!got && eq(got, want)
    return {
      ...base,
      status: ok ? 'pass' : 'fail',
      observed: ok
        ? `k = ${toHex(want).slice(0, 16)}… (32 B) matches`
        : `got ${got ? toHex(got).slice(0, 16) : '—'}…, want ${toHex(want).slice(0, 16)}…`,
    }
  } finally {
    destroyAll(M, hSession, handles)
  }
}

/** Import the vector's public key and verify s (no context), sWithContext
 * (with ctx), and that sWithContext without ctx is rejected. */
export const sigKat = (ctx: V33Ctx, set: CompositeSigSet, vectors: V33Vectors): V33CheckRow => {
  const { M, hSession, support } = ctx
  const base = {
    id: `v33.kat.sig.${set.ckpName}`,
    section: 'kat' as const,
    title: `Verify the published signatures · ${set.draftName}`,
    ckpName: set.ckpName,
    expected: 's verifies; sWithContext verifies with ctx and is rejected without it',
    source: SIG_VECTOR_SOURCE,
  }
  if (!support.compSig)
    return { ...base, status: 'not-in-engine', observed: 'CKM_COMP_SIG not advertised' }
  const t = vectors.sig.tests.find((x) => x.tcId === set.draftName)
  if (!t) return { ...base, status: 'fail', observed: 'no vector for this set' }
  const m = base64ToBytes(vectors.sig.m)
  const c = base64ToBytes(vectors.sig.ctx)
  const handles: number[] = []
  try {
    const imp = hsm_importCompositeKeyRv(M, hSession, 'sig', 'public', set.ckp, base64ToBytes(t.pk))
    if (imp.rv === CKR_PARAMETER_SET_NOT_SUPPORTED)
      return { ...base, status: 'not-supported', observed: `C_CreateObject → ${rv(imp.rv)}` }
    if (imp.rv !== 0) return { ...base, status: 'fail', observed: `C_CreateObject → ${rv(imp.rv)}` }
    handles.push(imp.handle)
    const r1 = hsm_compositeVerifyRv(M, hSession, imp.handle, m, base64ToBytes(t.s))
    const r2 = hsm_compositeVerifyRv(M, hSession, imp.handle, m, base64ToBytes(t.sWithContext), {
      context: c,
    })
    const r3 = hsm_compositeVerifyRv(M, hSession, imp.handle, m, base64ToBytes(t.sWithContext))
    const ok = r1.rv === 0 && r2.rv === 0 && r3.rv !== 0
    return {
      ...base,
      status: ok ? 'pass' : 'fail',
      observed: `s → ${rv(r1.rv)}; sWithContext + ctx → ${rv(r2.rv)}; sWithContext, no ctx → ${rv(r3.rv)}`,
    }
  } finally {
    destroyAll(M, hSession, handles)
  }
}

export const runV33Kats = (
  ctx: V33Ctx,
  vectors: V33Vectors,
  filter?: { kem?: readonly number[]; sig?: readonly number[] }
): V33CheckRow[] => [
  ...COMPOSITE_KEM_SETS.filter((s) => !filter?.kem || filter.kem.includes(s.ckp)).map((s) =>
    kemKat(ctx, s, vectors)
  ),
  ...COMPOSITE_SIG_SETS.filter((s) => !filter?.sig || filter.sig.includes(s.ckp)).map((s) =>
    sigKat(ctx, s, vectors)
  ),
]

// ── External µ ───────────────────────────────────────────────────────────────

/** µ = SHAKE256(TR ‖ 0 ‖ len(ctx) ‖ ctx ‖ M, 64), TR = SHAKE256(pk, 64)
 * (FIPS 204 Algorithm 2 lines 6–7, pure ML-DSA). Computed here without the
 * engine, as the independent check of the engine's µ. */
export const muOffline = (pk: Uint8Array, context: Uint8Array, message: Uint8Array): Uint8Array => {
  const tr = shake256(pk, { dkLen: 64 })
  const h = shake256.create({ dkLen: 64 })
  h.update(tr)
  h.update(new Uint8Array([0, context.length]))
  h.update(context)
  h.update(message)
  return h.digest()
}

export const trOffline = (pk: Uint8Array): Uint8Array => shake256(pk, { dkLen: 64 })

export const runExternalMuChecks = (ctx: V33Ctx): V33CheckRow[] => {
  const { M, hSession, support } = ctx
  const mk = (id: string, title: string, expected: string) => ({
    id: `v33.mu.${id}`,
    section: 'external-mu' as const,
    title,
    expected,
  })
  const rows = [
    mk(
      'gen-from-key',
      'µ from a key handle (CKM_ML_DSA_EXTERNAL_MU_GEN, hKey)',
      'equals µ computed independently from the public key'
    ),
    mk('gen-from-tr', 'µ from a precomputed TR (pTR)', 'equals µ from the key handle'),
    mk(
      'sign-verify-plain',
      'Sign µ (CKM_ML_DSA_EXTERNAL_MU), verify with plain CKM_ML_DSA over the message',
      'verification succeeds'
    ),
    mk('verify-mu', 'Verify the same signature from µ (CKM_ML_DSA_EXTERNAL_MU)', 'CKR_OK'),
  ]
  if (!support.externalMu)
    return rows.map((r) => ({
      ...r,
      status: 'not-in-engine' as const,
      observed: 'CKM_ML_DSA_EXTERNAL_MU(_GEN) not advertised',
    }))
  const handles: number[] = []
  try {
    const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, 65)
    handles.push(pubHandle, privHandle)
    const pk = hsm_readAttrRv(M, hSession, pubHandle, CKA_VALUE).value
    if (!pk)
      return rows.map((r) => ({ ...r, status: 'fail' as const, observed: 'public key unreadable' }))
    const a = hsm_externalMuGenRv(M, hSession, { hKey: pubHandle, context: CTX }, MSG)
    const want = muOffline(pk, CTX, MSG)
    const b = hsm_externalMuGenRv(M, hSession, { tr: trOffline(pk), context: CTX }, MSG)
    const out: V33CheckRow[] = []
    out.push({
      ...rows[0],
      status: a.mu && eq(a.mu, want) ? 'pass' : 'fail',
      observed: a.mu
        ? `µ ${toHex(a.mu).slice(0, 16)}… ${eq(a.mu, want) ? '= independent µ' : '≠ independent µ'}`
        : `${a.step} → ${rv(a.rv)}`,
    })
    out.push({
      ...rows[1],
      status: a.mu && b.mu && eq(a.mu, b.mu) ? 'pass' : 'fail',
      observed: b.mu ? `µ ${toHex(b.mu).slice(0, 16)}…` : `${b.step} → ${rv(b.rv)}`,
    })
    if (!a.mu) {
      out.push(
        { ...rows[2], status: 'fail', observed: 'no µ' },
        { ...rows[3], status: 'fail', observed: 'no µ' }
      )
      return out
    }
    const sig = hsm_compositeSignRv(M, hSession, privHandle, a.mu, {
      mechanism: CKM_ML_DSA_EXTERNAL_MU,
    })
    if (sig.rv !== 0) {
      out.push(
        { ...rows[2], status: 'fail', observed: `${sig.step} → ${rv(sig.rv)}` },
        { ...rows[3], status: 'fail', observed: 'no signature' }
      )
      return out
    }
    const plain = hsm_verifyBytesMLDSA(M, hSession, pubHandle, MSG, sig.signature!, {
      context: CTX,
    })
    out.push({
      ...rows[2],
      status: plain ? 'pass' : 'fail',
      observed: `signature ${sig.signature!.length} B; CKM_ML_DSA verify over M with ctx → ${plain ? 'valid' : 'INVALID'}`,
    })
    const vr = hsm_externalMuVerifyRv(M, hSession, pubHandle, a.mu, sig.signature!)
    out.push({ ...rows[3], status: vr === 0 ? 'pass' : 'fail', observed: rv(vr) })
    return out
  } finally {
    destroyAll(M, hSession, handles)
  }
}

// ── CKA_KEYS_REMAINING ───────────────────────────────────────────────────────

const readKeysRemaining = (M: SoftHSMModule, hSession: number, h: number) => {
  const r = hsm_readAttrRv(M, hSession, h, CKA_KEYS_REMAINING)
  if (r.rv !== 0 || !r.value || r.value.length < 4) return { rv: r.rv, n: null as number | null }
  const n = (r.value[0] | (r.value[1] << 8) | (r.value[2] << 16) | (r.value[3] << 24)) >>> 0
  return { rv: 0, n }
}

/** CKA_KEYS_REMAINING (0x61c) on HSS, XMSS and XMSS^MT keys, before and after
 * one signature. v3.3 extends the attribute (v3.2: CKA_HSS_KEYS_REMAINING,
 * HSS only) to XMSS and XMSS^MT. An engine that still keeps the XMSS count
 * under a private id answers CKR_ATTRIBUTE_TYPE_INVALID for 0x61c there:
 * that is reported as not in this engine yet, not as a failure. */
export const runKeysRemainingChecks = (
  ctx: Pick<V33Ctx, 'M' | 'hSession'>,
  families: readonly ('hss' | 'xmss' | 'xmssmt')[] = ['hss', 'xmss', 'xmssmt']
): V33CheckRow[] => {
  const { M, hSession } = ctx
  const defs = {
    hss: {
      name: 'HSS (LMS SHA256 M32 H5 / W8)',
      gen: () =>
        hsm_generateHSSKeyPair(M, hSession, 1, [CKP_LMS_SHA256_M32_H5], [CKP_LMOTS_SHA256_N32_W8]),
      mech: CKM_HSS,
    },
    xmss: {
      name: 'XMSS-SHA2_10_256',
      gen: () => hsm_generateXMSSKeyPair(M, hSession, CKP_XMSS_SHA2_10_256),
      mech: CKM_XMSS,
    },
    xmssmt: {
      name: 'XMSS^MT-SHA2_20/2_256',
      gen: () => hsm_generateXMSSMTKeyPair(M, hSession, CKP_XMSSMT_SHA2_20_2_256),
      mech: CKM_XMSSMT,
    },
  } as const
  return families.map((f) => {
    // eslint-disable-next-line security/detect-object-injection -- f is a literal union key
    const d = defs[f]
    const base = {
      id: `v33.keys-remaining.${f}`,
      section: 'keys-remaining' as const,
      title: `CKA_KEYS_REMAINING on ${d.name}`,
      expected: 'readable as 0x61c and decremented by exactly one signature',
    }
    const handles: number[] = []
    try {
      const { pubHandle, privHandle } = d.gen()
      handles.push(pubHandle, privHandle)
      const before = readKeysRemaining(M, hSession, privHandle)
      if (before.n === null) {
        return {
          ...base,
          status: f === 'hss' ? ('fail' as const) : ('not-in-engine' as const),
          observed: `C_GetAttributeValue(CKA_KEYS_REMAINING) → ${rv(before.rv)}${f === 'hss' ? '' : ' (this engine keeps the XMSS count under a private id)'}`,
        }
      }
      hsm_statefulSignBytes(M, hSession, d.mech, privHandle, MSG)
      const after = readKeysRemaining(M, hSession, privHandle)
      const ok = after.n !== null && after.n === before.n - 1
      return {
        ...base,
        status: ok ? ('pass' as const) : ('fail' as const),
        observed: `${before.n.toLocaleString()} → ${after.n?.toLocaleString() ?? rv(after.rv)} after one signature`,
      }
    } catch (e) {
      return {
        ...base,
        status: 'fail' as const,
        observed: e instanceof Error ? e.message : String(e),
      }
    } finally {
      destroyAll(M, hSession, handles)
    }
  })
}

// ── D3: error paths ──────────────────────────────────────────────────────────

const importKemPrivateWithSpki = (
  M: SoftHSMModule,
  hSession: number,
  ckp: number,
  value: Uint8Array,
  spki: Uint8Array
): number => {
  const vp = M._malloc(value.length)
  M.HEAPU8.set(value, vp)
  const sp = M._malloc(spki.length)
  M.HEAPU8.set(spki, sp)
  const attrs: AttrDef[] = [
    { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
    { type: CKA_KEY_TYPE, ulongVal: CKK_COMP_KEM },
    { type: CKA_TOKEN, boolVal: false },
    { type: CKA_PARAMETER_SET, ulongVal: ckp },
    { type: CKA_VALUE, bytesPtr: vp, bytesLen: value.length },
    { type: CKA_PUBLIC_KEY_INFO, bytesPtr: sp, bytesLen: spki.length },
    { type: CKA_SENSITIVE, boolVal: true },
    { type: CKA_DECAPSULATE, boolVal: true },
  ]
  const tpl = buildTemplate(M, attrs)
  const hp = allocUlong(M)
  try {
    const r = M._C_CreateObject(hSession, tpl.ptr, attrs.length, hp) >>> 0
    if (r === 0) M._C_DestroyObject(hSession, readUlong(M, hp))
    return r
  } finally {
    freeTemplate(M, tpl, attrs.length)
    M._free(hp)
    M._free(vp)
    M._free(sp)
  }
}

/** Run one error-path case; returns the observed rv, or null when not runnable. */
const runErrorPathCase = (
  ctx: V33Ctx,
  c: V33ErrorPathCase,
  vectors: V33Vectors | null
): { rv: number | null; note: string } => {
  const { M, hSession } = ctx
  const handles: number[] = []
  try {
    switch (c.id) {
      case 'comp-kem-with-parameter': {
        const k = hsm_generateCompositeKeyPair(M, hSession, 'kem', X25519_KEM().ckp)
        handles.push(k.pubHandle, k.privHandle)
        const r = hsm_compositeEncapsulateRv(M, hSession, k.pubHandle, {
          param: new Uint8Array([1, 2, 3, 4]),
        })
        if (r.secretHandle) handles.push(r.secretHandle)
        return { rv: r.rv, note: 'C_EncapsulateKey with a 4-byte parameter' }
      }
      case 'comp-kem-ciphertext-wrong-length': {
        const k = hsm_generateCompositeKeyPair(M, hSession, 'kem', X25519_KEM().ckp)
        handles.push(k.pubHandle, k.privHandle)
        const enc = hsm_compositeEncapsulate(M, hSession, k.pubHandle)
        handles.push(enc.secretHandle)
        const r = hsm_compositeDecapsulateRv(M, hSession, k.privHandle, enc.ciphertext.slice(0, -1))
        if (r.secretHandle) handles.push(r.secretHandle)
        return {
          rv: r.rv,
          note: `C_DecapsulateKey with ${enc.ciphertext.length - 1} of ${enc.ciphertext.length} bytes`,
        }
      }
      case 'comp-sig-key-with-comp-kem': {
        const k = hsm_generateCompositeKeyPair(M, hSession, 'sig', P256_SIG().ckp)
        handles.push(k.pubHandle, k.privHandle)
        const r = hsm_compositeDecapsulateRv(M, hSession, k.privHandle, new Uint8Array(1120), {
          mechanism: CKM_COMP_KEM,
        })
        if (r.secretHandle) handles.push(r.secretHandle)
        return { rv: r.rv, note: 'C_DecapsulateKey(CKM_COMP_KEM) with a CKK_COMP_SIG private key' }
      }
      case 'comp-kem-key-with-comp-sig': {
        const k = hsm_generateCompositeKeyPair(M, hSession, 'kem', X25519_KEM().ckp)
        handles.push(k.pubHandle, k.privHandle)
        const r = hsm_compositeSignRv(M, hSession, k.privHandle, MSG, { mechanism: CKM_COMP_SIG })
        return { rv: r.rv, note: `${r.step}(CKM_COMP_SIG) with a CKK_COMP_KEM private key` }
      }
      case 'comp-sig-external-hash-wrong-length': {
        const set = P256_SIG()
        const k = hsm_generateCompositeKeyPair(M, hSession, 'sig', set.ckp)
        handles.push(k.pubHandle, k.privHandle)
        const r = hsm_compositeSignRv(M, hSession, k.privHandle, new Uint8Array(63), {
          externalHash: true,
        })
        return { rv: r.rv, note: `${r.step} with a 63-byte pre-hash (${set.preHash} needs 64)` }
      }
      case 'comp-sig-external-hash-sign-update': {
        const k = hsm_generateCompositeKeyPair(M, hSession, 'sig', P256_SIG().ckp)
        handles.push(k.pubHandle, k.privHandle)
        const r = hsm_compositeSignRv(M, hSession, k.privHandle, new Uint8Array(64), {
          externalHash: true,
          multiPartChunk: 32,
        })
        return { rv: r.rv, note: `${r.step} on a CKM_COMP_SIG_EXTERNAL_HASH operation` }
      }
      case 'comp-create-object-mismatched-halves': {
        if (!vectors) return { rv: null, note: 'vectors not loaded' }
        const set = X25519_KEM()
        const other = hsm_generateCompositeKeyPair(M, hSession, 'kem', set.ckp)
        handles.push(other.pubHandle, other.privHandle)
        const spki = hsm_readAttrRv(M, hSession, other.pubHandle, CKA_PUBLIC_KEY_INFO).value
        if (!spki) return { rv: null, note: 'CKA_PUBLIC_KEY_INFO unreadable' }
        const t = vectors.kem.tests.find((x) => x.tcId === set.draftName)!
        const r = importKemPrivateWithSpki(M, hSession, set.ckp, base64ToBytes(t.dk), spki)
        return { rv: r, note: 'vector private key + the SPKI of a different generated key' }
      }
      case 'comp-create-object-bad-public-length': {
        const set = X25519_KEM()
        const k = hsm_generateCompositeKeyPair(M, hSession, 'kem', set.ckp)
        handles.push(k.pubHandle, k.privHandle)
        const pub = hsm_readAttrRv(M, hSession, k.pubHandle, CKA_VALUE).value
        if (!pub) return { rv: null, note: 'public CKA_VALUE unreadable' }
        const r = hsm_importCompositeKeyRv(M, hSession, 'kem', 'public', set.ckp, pub.slice(0, -1))
        if (r.handle) handles.push(r.handle)
        return {
          rv: r.rv,
          note: `public CKA_VALUE of ${pub.length - 1} bytes (set needs ${pub.length})`,
        }
      }
      case 'comp-private-value-sensitive': {
        const k = hsm_generateCompositeKeyPair(M, hSession, 'kem', X25519_KEM().ckp)
        handles.push(k.pubHandle, k.privHandle)
        const r = hsm_readAttrRv(M, hSession, k.privHandle, CKA_VALUE)
        return { rv: r.rv, note: 'C_GetAttributeValue(CKA_VALUE) on a CKA_SENSITIVE private key' }
      }
      case 'mu-gen-both-key-and-tr': {
        const k = hsm_generateMLDSAKeyPair(M, hSession, 44)
        handles.push(k.pubHandle, k.privHandle)
        const r = hsm_externalMuGenRv(
          M,
          hSession,
          { hKey: k.pubHandle, tr: new Uint8Array(64) },
          MSG
        )
        return { rv: r.rv, note: `${r.step} with hKey and a 64-byte pTR` }
      }
      case 'mu-gen-neither-key-nor-tr': {
        const r = hsm_externalMuGenRv(M, hSession, {}, MSG)
        return { rv: r.rv, note: `${r.step} with hKey = 0 and no pTR` }
      }
    }
  } finally {
    destroyAll(M, hSession, handles)
  }
  return { rv: null, note: 'unknown case' }
}

export const runV33ErrorPaths = (ctx: V33Ctx, vectors: V33Vectors | null): V33CheckRow[] =>
  V33_DRAFT_ERROR_PATHS.map((c) => {
    const want = V33_RV[c.expected]
    const base = {
      id: `v33.errpath.${c.id}`,
      section: 'error-path' as const,
      title: c.title,
      expected: `${c.expected} (${c.draft === 'draft-silent' ? 'draft silent; ' : ''}${c.convention})`,
      citation: `${c.draftCitation} · engine: ${c.engineCitation}`,
    }
    const missing = c.needs.filter((n) => !ctx.support[n])
    if (missing.length)
      return { ...base, status: 'not-in-engine' as const, observed: `needs ${missing.join(', ')}` }
    let res: { rv: number | null; note: string }
    try {
      res = runErrorPathCase(ctx, c, vectors)
    } catch (e) {
      return {
        ...base,
        status: 'fail' as const,
        observed: e instanceof Error ? e.message : String(e),
      }
    }
    if (res.rv === null) return { ...base, status: 'fail' as const, observed: res.note }
    const observed = `${res.note} → ${rv(res.rv)}`
    if (c.status === 'pending-engine')
      return {
        ...base,
        status: 'pending-engine' as const,
        observed: `${observed} (code not asserted until the engine update)`,
      }
    return { ...base, status: res.rv === want ? ('pass' as const) : ('fail' as const), observed }
  })

// ── The whole group ──────────────────────────────────────────────────────────

export interface V33RunOptions {
  /** Round-trip only these sets (default: all 30). */
  kemSets?: readonly number[]
  sigSets?: readonly number[]
  /** Skip the slow XMSS / XMSS^MT key generations. */
  keysRemainingFamilies?: readonly ('hss' | 'xmss' | 'xmssmt')[]
  onRow?: (row: V33CheckRow) => void
}

/** Every v3.3 draft check, in section order. Never throws. */
export const runV33DraftFeatures = async (
  ctx: V33Ctx,
  opts: V33RunOptions = {}
): Promise<V33CheckRow[]> => {
  const rows: V33CheckRow[] = []
  const push = (r: V33CheckRow[]) => {
    for (const x of r) {
      rows.push(x)
      opts.onRow?.(x)
    }
  }
  const yieldUi = () => new Promise((r) => setTimeout(r, 0))
  push(mechanismInfoRows(ctx.support))
  for (const s of COMPOSITE_KEM_SETS.filter((x) => !opts.kemSets || opts.kemSets.includes(x.ckp))) {
    push([roundTripKemSet(ctx, s)])
    await yieldUi()
  }
  for (const s of COMPOSITE_SIG_SETS.filter((x) => !opts.sigSets || opts.sigSets.includes(x.ckp))) {
    push([roundTripSigSet(ctx, s)])
    await yieldUi()
  }
  push([roundTripSigExternalHash(ctx)])
  await yieldUi()
  let vectors: V33Vectors | null = null
  if (ctx.support.compKem || ctx.support.compSig) {
    vectors = await loadV33Vectors()
    push(runV33Kats(ctx, vectors, { kem: opts.kemSets, sig: opts.sigSets }))
  } else {
    push(
      [...COMPOSITE_KEM_SETS, ...COMPOSITE_SIG_SETS].map((s) => ({
        id: `v33.kat.${'labelHex' in s ? 'kem' : 'sig'}.${s.ckpName}`,
        section: 'kat' as const,
        title: `Known answer · ${s.draftName}`,
        ckpName: s.ckpName,
        status: 'not-in-engine' as const,
        observed: 'composite mechanisms not advertised',
        expected: 'labelHex' in s ? 'secret = published k' : 'published signatures verify',
        source: 'labelHex' in s ? KEM_VECTOR_SOURCE : SIG_VECTOR_SOURCE,
      }))
    )
  }
  await yieldUi()
  push(runExternalMuChecks(ctx))
  await yieldUi()
  push(runKeysRemainingChecks(ctx, opts.keysRemainingFamilies))
  await yieldUi()
  push(runV33ErrorPaths(ctx, vectors))
  return rows
}

/** Brainpool sets are expected to be unsupported by some engines. */
export { isBrainpoolSet }
