// SPDX-License-Identifier: GPL-3.0-only
//
// HKDF and SP 800-108 KBKDF from NIST ACVP-Server reference samples, plus the
// explicit X9.63 unsupported row (gap-closure plan 2026-09-25, P5 item 2 —
// WS-E remainder), per engine:
//
//  - KDA-HKDF-Sp800-56Cr2: IKM = Z ‖ T imported as a CKK_GENERIC_SECRET,
//    C_DeriveKey(CKM_HKDF_DERIVE) with the upstream salt and fixedInfo =
//    uPartyId ‖ uEphemeralData ‖ vPartyId ‖ vEphemeralData ‖ L (32-bit, bits).
//    AFT: CKA_VALUE must equal dkm. VAL testPassed=false: must differ (the NIST
//    dkm is wrong on purpose).
//  - KDF-1.0 (SP 800-108r1): counter, feedback and double-pipeline with the
//    PKCS#11 v3.2 Table 196 PRF (CKM_<hash>_HMAC / CKM_AES_CMAC), the
//    CK_PRF_DATA_PARAM segments laid out where the upstream puts the counter
//    (§6.42.3–6.42.5: ITERATION_VARIABLE is mandatory in every mode — a
//    counter format in counter mode, NULL / 0 in feedback and double pipeline).
//    Output byte-compared to keyOut.
//  - ANSI X9.63 KDF on a caller-supplied shared secret: one skip row per
//    engine. PKCS#11 v3.2 applies the X9.63 KDF only as the CK_EC_KDF_TYPE of
//    the ECDH derivations (§6.3.16), to the Z the token computes itself, so the
//    kdf-components-ansix9.63 cases (Z, sharedInfo → keyData) cannot be driven.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName, writeBytes } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_VALUE,
  CKO_SECRET_KEY,
} from '@/wasm/softhsm/constants'
import {
  destroy,
  srcOf,
  srcTag,
  unsupportedReason,
  CKR_OK,
  type AcvpCaseMeta,
  type Provenance,
} from './mldsaAcvp'
import { createObjectRv, withTemplate } from './pkcs11Raw'
import {
  WSE_CK,
  WSE_MECH,
  hexUp,
  rawMech,
  runRow,
  skipRow,
  valueOf,
  type ClassicalSectionCtx,
  type ParamBlock,
  type RowOutcome,
} from './classicalRaw'

/** ACVP hmacAlg → PKCS#11 digest mechanism for CK_HKDF_PARAMS.prfHashMechanism. */
const HKDF_PRF: Readonly<Record<string, number>> = {
  'SHA2-224': WSE_MECH.CKM_SHA224,
  'SHA2-256': WSE_MECH.CKM_SHA256,
  'SHA2-384': WSE_MECH.CKM_SHA384,
  'SHA2-512': WSE_MECH.CKM_SHA512,
  'SHA2-512/224': WSE_MECH.CKM_SHA512_224,
  'SHA2-512/256': WSE_MECH.CKM_SHA512_256,
  'SHA3-224': WSE_MECH.CKM_SHA3_224,
  'SHA3-256': WSE_MECH.CKM_SHA3_256,
  'SHA3-384': WSE_MECH.CKM_SHA3_384,
  'SHA3-512': WSE_MECH.CKM_SHA3_512,
}

/** ACVP KDF 1.0 macMode → PKCS#11 v3.2 Table 196 PRF identifier. */
export const KBKDF_PRF: Readonly<Record<string, keyof typeof WSE_MECH>> = {
  'CMAC-AES128': 'CKM_AES_CMAC',
  'CMAC-AES192': 'CKM_AES_CMAC',
  'CMAC-AES256': 'CKM_AES_CMAC',
  'HMAC-SHA-1': 'CKM_SHA_1_HMAC',
  'HMAC-SHA2-224': 'CKM_SHA224_HMAC',
  'HMAC-SHA2-256': 'CKM_SHA256_HMAC',
  'HMAC-SHA2-384': 'CKM_SHA384_HMAC',
  'HMAC-SHA2-512': 'CKM_SHA512_HMAC',
  'HMAC-SHA3-224': 'CKM_SHA3_224_HMAC',
  'HMAC-SHA3-256': 'CKM_SHA3_256_HMAC',
  'HMAC-SHA3-384': 'CKM_SHA3_384_HMAC',
  'HMAC-SHA3-512': 'CKM_SHA3_512_HMAC',
}

/** ACVP kdfMode → PKCS#11 KBKDF mechanism name. */
export const KBKDF_MECH: Readonly<Record<string, keyof typeof WSE_MECH>> = {
  counter: 'CKM_SP800_108_COUNTER_KDF',
  feedback: 'CKM_SP800_108_FEEDBACK_KDF',
  'double pipeline iteration': 'CKM_SP800_108_DOUBLE_PIPELINE_KDF',
}

// CK_PRF_DATA_TYPE (PKCS#11 v3.2 Table 197).
const ITERATION_VARIABLE = 0x1
const COUNTER = 0x2
const BYTE_ARRAY = 0x4

// ── Raw C_DeriveKey ─────────────────────────────────────────────────────────

/** Base key for a derivation: CKK_AES for CMAC PRFs, CKK_GENERIC_SECRET otherwise. */
function importDeriveBase(M: SoftHSMModule, h: number, keyType: number, value: Uint8Array) {
  return createObjectRv(
    M,
    h,
    [
      { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
      { type: CKA_KEY_TYPE, ulongVal: keyType },
      { type: CKA_TOKEN, boolVal: false },
      { type: WSE_CK.CKA_DERIVE, boolVal: true },
      { type: CKA_SENSITIVE, boolVal: false },
      { type: CKA_EXTRACTABLE, boolVal: true },
    ],
    [{ type: CKA_VALUE, bytes: value }]
  )
}

/** C_DeriveKey into an extractable CKK_GENERIC_SECRET of outLen bytes → { rv, value }. */
function deriveRv(
  M: SoftHSMModule,
  h: number,
  mechType: number,
  param: ParamBlock,
  base: number,
  outLen: number
): { rv: number; value: Uint8Array | null } {
  const mech = rawMech(M, mechType, param)
  const hPtr = M._malloc(4)
  M.setValue(hPtr, 0, 'i32')
  try {
    const rv = withTemplate(
      M,
      [
        { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
        { type: CKA_KEY_TYPE, ulongVal: WSE_CK.CKK_GENERIC_SECRET },
        { type: CKA_TOKEN, boolVal: false },
        { type: CKA_SENSITIVE, boolVal: false },
        { type: CKA_EXTRACTABLE, boolVal: true },
        { type: WSE_CK.CKA_VALUE_LEN, ulongVal: outLen },
      ],
      [],
      (t, n) => M._C_DeriveKey(h, mech.ptr, base, t, n, hPtr) >>> 0
    )
    if (rv !== CKR_OK) return { rv, value: null }
    const handle = M.getValue(hPtr, 'i32') >>> 0
    try {
      return { rv, value: valueOf(M, h, handle) }
    } finally {
      destroy(M, h, handle)
    }
  } finally {
    M._free(hPtr)
    mech.free()
  }
}

/** CK_HKDF_PARAMS {bExtract, bExpand, prfHashMechanism, ulSaltType, pSalt, ulSaltLen, hSaltKey, pInfo, ulInfoLen}. */
function pHkdf(M: SoftHSMModule, prf: number, salt: Uint8Array, info: Uint8Array): ParamBlock {
  const allocs: number[] = []
  const put = (b: Uint8Array) => {
    if (b.length === 0) return 0
    const p = writeBytes(M, b)
    allocs.push(p)
    return p
  }
  const ptr = M._malloc(32)
  allocs.push(ptr)
  M.HEAPU8.fill(0, ptr, ptr + 32)
  // bExtract = bExpand = CK_TRUE (bytes 0 and 1), padding zero — one i32 store
  // (little-endian; the Rust adapter's setValue writes i32 only).
  M.setValue(ptr, 0x0101, 'i32')
  M.setValue(ptr + 4, prf, 'i32')
  M.setValue(ptr + 8, salt.length > 0 ? 0x2 : 0x1, 'i32') // CKF_HKDF_SALT_DATA : _NULL
  M.setValue(ptr + 12, put(salt), 'i32')
  M.setValue(ptr + 16, salt.length, 'i32')
  M.setValue(ptr + 20, 0, 'i32')
  M.setValue(ptr + 24, put(info), 'i32')
  M.setValue(ptr + 28, info.length, 'i32')
  return { ptr, len: 32, allocs }
}

type Segment =
  | { kind: 'iteration'; counterBits?: number }
  | { kind: 'counter'; counterBits: number }
  | { kind: 'bytes'; bytes: Uint8Array }

/** CK_SP800_108_KDF_PARAMS (counter / double pipeline) or _FEEDBACK_KDF_PARAMS (with iv). */
function pKbkdf(
  M: SoftHSMModule,
  prf: number,
  segments: Segment[],
  feedbackIv: Uint8Array | null
): ParamBlock {
  const allocs: number[] = []
  const arr = M._malloc(12 * segments.length)
  allocs.push(arr)
  const counterFormat = (bits: number) => {
    // CK_SP800_108_COUNTER_FORMAT {CK_BBOOL bLittleEndian; CK_ULONG ulWidthInBits}: big-endian.
    const f = M._malloc(8)
    allocs.push(f)
    M.setValue(f, 0, 'i32')
    M.setValue(f + 4, bits, 'i32')
    return f
  }
  segments.forEach((s, i) => {
    const o = arr + 12 * i
    if (s.kind === 'bytes') {
      const p = writeBytes(M, s.bytes)
      allocs.push(p)
      M.setValue(o, BYTE_ARRAY, 'i32')
      M.setValue(o + 4, p, 'i32')
      M.setValue(o + 8, s.bytes.length, 'i32')
    } else if (s.kind === 'iteration' && s.counterBits === undefined) {
      M.setValue(o, ITERATION_VARIABLE, 'i32')
      M.setValue(o + 4, 0, 'i32')
      M.setValue(o + 8, 0, 'i32')
    } else {
      M.setValue(o, s.kind === 'iteration' ? ITERATION_VARIABLE : COUNTER, 'i32')
      M.setValue(o + 4, counterFormat(s.counterBits!), 'i32')
      M.setValue(o + 8, 8, 'i32')
    }
  })
  if (feedbackIv === null) {
    const ptr = M._malloc(20)
    allocs.push(ptr)
    M.setValue(ptr, prf, 'i32')
    M.setValue(ptr + 4, segments.length, 'i32')
    M.setValue(ptr + 8, arr, 'i32')
    M.setValue(ptr + 12, 0, 'i32')
    M.setValue(ptr + 16, 0, 'i32')
    return { ptr, len: 20, allocs }
  }
  let ivPtr = 0
  if (feedbackIv.length > 0) {
    ivPtr = writeBytes(M, feedbackIv)
    allocs.push(ivPtr)
  }
  const ptr = M._malloc(28)
  allocs.push(ptr)
  M.setValue(ptr, prf, 'i32')
  M.setValue(ptr + 4, segments.length, 'i32')
  M.setValue(ptr + 8, arr, 'i32')
  M.setValue(ptr + 12, feedbackIv.length, 'i32')
  M.setValue(ptr + 16, ivPtr, 'i32')
  M.setValue(ptr + 20, 0, 'i32')
  M.setValue(ptr + 24, 0, 'i32')
  return { ptr, len: 28, allocs }
}

/** PRF-input layout for one upstream KDF 1.0 group (PKCS#11 v3.2 §6.42.3–6.42.5). */
export function kbkdfSegments(
  kdfMode: string,
  counterLocation: string,
  counterLength: number,
  fixedData: Uint8Array,
  breakLocation?: number
): Segment[] {
  const data: Segment = { kind: 'bytes', bytes: fixedData }
  if (kdfMode === 'counter') {
    const it: Segment = { kind: 'iteration', counterBits: counterLength }
    if (counterLocation === 'before fixed data') return [it, data]
    if (counterLocation === 'after fixed data') return [data, it]
    const b = (breakLocation ?? 0) / 8
    return [
      { kind: 'bytes', bytes: fixedData.slice(0, b) },
      it,
      { kind: 'bytes', bytes: fixedData.slice(b) },
    ]
  }
  const it: Segment = { kind: 'iteration' }
  const ctr: Segment = { kind: 'counter', counterBits: counterLength }
  switch (counterLocation) {
    case 'none':
      return [it, data]
    case 'before iterator':
      return [ctr, it, data]
    case 'before fixed data':
      return [it, ctr, data]
    default:
      return [it, data, ctr]
  }
}

const segText = (s: Segment[]) =>
  s
    .map((x) =>
      x.kind === 'bytes'
        ? `BYTE_ARRAY(${x.bytes.length}B)`
        : x.kind === 'counter'
          ? `COUNTER(${x.counterBits}b)`
          : x.counterBits === undefined
            ? 'ITERATION_VARIABLE'
            : `ITERATION_VARIABLE(${x.counterBits}b)`
    )
    .join(' ‖ ')

// ── JSON shapes ─────────────────────────────────────────────────────────────
interface HkdfCase {
  tcId: number
  testPassed?: boolean
  kdfParameter: { salt: string; z: string; t?: string; l: number; hmacAlg: string }
  fixedInfoPartyU: { partyId: string; ephemeralData?: string }
  fixedInfoPartyV: { partyId: string; ephemeralData?: string }
  dkm: string
}
interface HkdfGroup {
  tgId: number
  testType: 'AFT' | 'VAL'
  kdfConfiguration: { hmacAlg: string; saltMethod: string }
  tests: HkdfCase[]
}
interface KbkdfCase {
  tcId: number
  keyIn: string
  fixedData: string
  iv?: string
  breakLocation?: number
  keyOut: string
}
interface KbkdfGroup {
  tgId: number
  kdfMode: string
  macMode: string
  counterLocation: string
  counterLength: number
  keyOutLength: number
  zeroLengthIv: boolean
  tests: KbkdfCase[]
}

/** fixedInfo = uPartyId ‖ uEphemeralData ‖ vPartyId ‖ vEphemeralData ‖ L (32-bit BE, bits). */
export function hkdfFixedInfo(t: HkdfCase): Uint8Array {
  const u = t.fixedInfoPartyU
  const v = t.fixedInfoPartyV
  return hexToBytes(
    u.partyId +
      (u.ephemeralData ?? '') +
      v.partyId +
      (v.ephemeralData ?? '') +
      t.kdfParameter.l.toString(16).padStart(8, '0')
  )
}

export async function runHkdfAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/hkdf_acvp_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: HkdfGroup[]
  }
  const P = f._provenance
  const why = unsupportedReason(mechs, WSE_MECH.CKM_HKDF_DERIVE, 'CKM_HKDF_DERIVE')
  for (const g of f.testGroups) {
    const hashAlg = g.kdfConfiguration.hmacAlg
    for (const t of g.tests) {
      const negative = t.testPassed === false
      const ikm = hexToBytes(t.kdfParameter.z + (t.kdfParameter.t ?? ''))
      const L = t.kdfParameter.l / 8
      const id = `hkdf-nist-${hashAlg.toLowerCase().replace('/', '-')}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `HKDF-${hashAlg} (${eName})`
      const testCase = `Derive · NIST KDA-HKDF ${g.testType} tg${g.tgId}/tc${t.tcId} · ${hashAlg} · salt ${g.kdfConfiguration.saltMethod} · IKM Z‖T ${ikm.length}B · L ${L}B · expect ${negative ? 'output ≠ the (modified) NIST dkm' : 'byte-match'}`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'derive',
        localOperation: 'derive',
        parameterSet: `HKDF-${hashAlg}`,
        hashAlg,
        parameters: {
          saltMethod: g.kdfConfiguration.saltMethod,
          ikmBytes: ikm.length,
          l: t.kdfParameter.l,
        },
        expected: negative ? 'invalid' : 'byte-match',
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(P),
      }
      if (why) {
        await skipRow(ctx, { id, algorithm, testCase, meta, why })
        continue
      }
      await runRow(ctx, {
        id,
        algorithm,
        testCase,
        meta,
        source: srcTag(P),
        exec: (): RowOutcome => {
          const base = importDeriveBase(M, h, WSE_CK.CKK_GENERIC_SECRET, ikm)
          if (base.rv !== CKR_OK) {
            const o = `C_CreateObject → ${rvName(base.rv)}`
            return { ok: false, observed: o, details: o }
          }
          try {
            const r = deriveRv(
              M,
              h,
              WSE_MECH.CKM_HKDF_DERIVE,
              pHkdf(M, HKDF_PRF[hashAlg]!, hexToBytes(t.kdfParameter.salt), hkdfFixedInfo(t)), // eslint-disable-line security/detect-object-injection
              base.handle,
              L
            )
            if (!r.value) {
              const o = `C_DeriveKey → ${rvName(r.rv)}`
              return { ok: false, observed: o, details: o }
            }
            const equal = hexUp(r.value) === t.dkm.toUpperCase()
            const ok = negative ? !equal : equal
            const observed = equal ? 'byte-equal' : 'differs'
            return {
              ok,
              observed,
              details: negative
                ? equal
                  ? 'derived key EQUALS the dkm NIST marks invalid'
                  : `derived ${L}B differs from the dkm NIST marks invalid (testPassed=false)`
                : equal
                  ? `derived ${L}B byte-equal to NIST dkm`
                  : `derived ${L}B differs from NIST dkm`,
            }
          } finally {
            destroy(M, h, base.handle)
          }
        },
      })
    }
  }
}

export async function runKbkdfAcvpSection(ctx: ClassicalSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const f = (await import('@/data/acvp/kbkdf_acvp_test.json')).default as unknown as {
    _provenance: Provenance
    testGroups: KbkdfGroup[]
  }
  const P = f._provenance
  for (const g of f.testGroups) {
    const mechName = KBKDF_MECH[g.kdfMode]
    const prfName = KBKDF_PRF[g.macMode]
    const mech = mechName ? WSE_MECH[mechName] : undefined // eslint-disable-line security/detect-object-injection
    const prf = prfName ? WSE_MECH[prfName] : undefined // eslint-disable-line security/detect-object-injection
    const why =
      unsupportedReason(mechs, mech, mechName ?? g.kdfMode) ??
      unsupportedReason(mechs, prf, prfName ?? g.macMode)
    for (const t of g.tests) {
      const fixed = hexToBytes(t.fixedData)
      const segs = kbkdfSegments(
        g.kdfMode,
        g.counterLocation,
        g.counterLength,
        fixed,
        t.breakLocation
      )
      const L = g.keyOutLength / 8
      const slug = `${g.kdfMode.split(' ')[0]}-${g.macMode.toLowerCase().replace('/', '-')}`
      const id = `kbkdf-nist-${slug}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const algorithm = `KBKDF ${g.kdfMode} ${g.macMode} (${eName})`
      const testCase = `Derive · NIST KDF 1.0 tg${g.tgId}/tc${t.tcId} · ${g.kdfMode} · ${g.macMode} · counter ${g.counterLocation}${g.counterLength ? ` (${g.counterLength} bits)` : ''}${g.kdfMode === 'feedback' ? ` · IV ${(t.iv ?? '').length / 2}B` : ''} · ${L}B · byte-match`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'derive',
        localOperation: 'derive',
        parameterSet: `${g.kdfMode}/${g.macMode}`,
        parameters: {
          kdfMode: g.kdfMode,
          macMode: g.macMode,
          counterLocation: g.counterLocation,
          counterLength: g.counterLength,
          keyOutLength: g.keyOutLength,
          layout: segText(segs),
        },
        expected: 'byte-match',
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(P),
      }
      if (why) {
        await skipRow(ctx, { id, algorithm, testCase, meta, why })
        continue
      }
      await runRow(ctx, {
        id,
        algorithm,
        testCase,
        meta,
        source: srcTag(P),
        exec: (): RowOutcome => {
          const keyType = g.macMode.startsWith('CMAC') ? WSE_CK.CKK_AES : WSE_CK.CKK_GENERIC_SECRET
          const base = importDeriveBase(M, h, keyType, hexToBytes(t.keyIn))
          if (base.rv !== CKR_OK) {
            const o = `C_CreateObject → ${rvName(base.rv)}`
            return { ok: false, observed: o, details: o }
          }
          try {
            const r = deriveRv(
              M,
              h,
              mech!,
              pKbkdf(M, prf!, segs, g.kdfMode === 'feedback' ? hexToBytes(t.iv ?? '') : null),
              base.handle,
              L
            )
            if (!r.value) {
              const o = `C_DeriveKey → ${rvName(r.rv)}`
              return {
                ok: false,
                observed: o,
                details: `${o} for the §6.42 data-parameter layout ${segText(segs)}`,
              }
            }
            const ok = hexUp(r.value) === t.keyOut.toUpperCase()
            return {
              ok,
              observed: ok ? 'byte-equal' : 'differs',
              details: ok
                ? `derived ${L}B byte-equal to NIST keyOut (layout ${segText(segs)})`
                : `derived ${L}B differs from NIST keyOut — the engine did not build the PRF input in the requested layout ${segText(segs)}`,
            }
          } finally {
            destroy(M, h, base.handle)
          }
        },
      })
    }
  }

  // ANSI X9.63 KDF on a caller-supplied Z: honest unsupported row.
  await skipRow(ctx, {
    id: `x963-kdf-unsupported-${eName}`,
    algorithm: `ANSI X9.63 KDF (${eName})`,
    testCase:
      'Derive · NIST kdf-components-ansix9.63-1.0 (Z, sharedInfo → keyData) · caller-supplied shared secret',
    meta: {
      origin: 'not-executed',
      upstreamOperation: 'derive',
      localOperation: 'none',
      parameterSet: 'ANSI X9.63 KDF',
      expected: 'not-run',
      source: {
        repo: 'https://github.com/usnistgov/ACVP-Server',
        commit: P.source_commit,
        path: 'gen-val/json-files/kdf-components-ansix9.63-1.0/internalProjection.json',
        sha256: '5f392417c4fc581b0c92eb5da446ef473f58fdd015a62ddf3083ef9bf082241a',
      },
    },
    why:
      'unsupported by the PKCS#11 interface — v3.2 applies the ANSI X9.63 KDF only as the CK_EC_KDF_TYPE of the ECDH ' +
      'derivations (§6.3.16: CKD_<hash>_KDF), to the shared secret Z the token computes from its own key pair and the ' +
      'peer point; no mechanism takes a caller-supplied Z, so the upstream (Z, sharedInfo) → keyData cases cannot be ' +
      'driven. The X9.63 KDF itself is exercised inside CKM_ECDH1_DERIVE (section 25, round-trip only). Capability-map ' +
      'declaredUnreachable row x963-kdf-caller-z',
  })
}
