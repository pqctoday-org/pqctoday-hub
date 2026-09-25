// SPDX-License-Identifier: GPL-3.0-only
//
// ML-DSA negative / boundary depth (gap-closure plan 2026-09-25, P5 item 3).
// Sections 5d/5e (mldsaAcvp.ts, mldsaDepth.ts) leave the negative column of the
// deterministic and hedged sign cells empty, the hedged sign cells without an
// externally checked output, and the ML-DSA-65/87 verify cells with one
// context-boundary case. Rows, per engine:
//
//  1. NIST SigVer depth — mldsa_sigver_depth_test.json: the 0-byte and
//     255-byte context cases of each pure group and every HashML-DSA case with
//     a PKCS#11 v3.2 mechanism, with the upstream disposition (CKR_OK or
//     CKR_SIGNATURE_INVALID).
//  2. Deterministic sign negatives (product-authored) — the NIST key of each
//     parameter set's empty-context deterministic sigGen case signs a one-bit
//     mutated message and, separately, with a 1-byte context; the signature
//     must differ from the NIST expected one and must not verify for the
//     original (message, context).
//  3. Hedged sign at the context extremes — CKH_HEDGE_REQUIRED signatures with
//     a 0-byte and a 255-byte context, each verified by the engine itself
//     (round-trip) and, in a separate row, by an independent implementation
//     (@noble/post-quantum ml_dsa verify: agreement with that oracle, not a NIST
//     expected value; the randomness itself is not checked).
//  4. Hedged negatives (product-authored) — the ctx-0 hedged signature must not
//     verify for a mutated message, the ctx-255 one not for a mutated context.
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName, dsaParamSet, hsm_importMLDSAPublicKey } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_SIGN,
  CKA_VALUE,
  CKA_PARAMETER_SET,
  CKO_PRIVATE_KEY,
  CKK_ML_DSA,
  CKM_ML_DSA,
  CKH_DETERMINISTIC_REQUIRED,
  CKH_HEDGE_REQUIRED,
} from '@/wasm/softhsm/constants'
import {
  acvpHashToMech,
  verifyRv,
  destroy,
  firstDiff,
  nBytes,
  srcOf,
  srcTag,
  unsupportedReason,
  CKR_OK,
  CKR_SIGNATURE_INVALID,
  type AcvpCaseMeta,
  type MldsaAcvpSectionCtx,
  type Provenance,
} from './mldsaAcvp'
import { createObjectRv, sha256Tag, signRv } from './pkcs11Raw'

interface SigVerCase {
  tcId: number
  testPassed: boolean
  reason: string
  hashAlg: string
  pk: string
  message: string
  context?: string
  signature: string
}
interface SigVerGroup {
  tgId: number
  parameterSet: string
  preHash: string
  tests: SigVerCase[]
}
interface SigGenCase {
  tcId: number
  sk: string
  pk?: string
  message: string
  context?: string
  signature: string
}
interface SigGenGroup {
  tgId: number
  parameterSet: string
  preHash: string
  tests: SigGenCase[]
}
interface VectorFile<G> {
  _provenance: Provenance
  testGroups: G[]
}

const variantOf = (ps: string) => parseInt(ps.split('-')[2], 10) as 44 | 65 | 87

/** Product-authored 255-byte context (0x00..0xFE) for the hedged ctx-255 rows. */
export const MLDSA_PRODUCT_CTX255 = (): Uint8Array => Uint8Array.from({ length: 255 }, (_, i) => i)

/** Flip the lowest bit of the last byte (or of byte 0 for `first`). */
const flip = (b: Uint8Array, first = false): Uint8Array => {
  const out = b.slice()
  if (out.length > 0) out[first ? 0 : out.length - 1] ^= 0x01
  return out
}

const nobleFor = async (ps: string) => {
  const m = await import('@noble/post-quantum/ml-dsa.js')
  return ps === 'ML-DSA-44' ? m.ml_dsa44 : ps === 'ML-DSA-65' ? m.ml_dsa65 : m.ml_dsa87
}

/** The oracle identity every oracle row names. */
export const MLDSA_ORACLE = '@noble/post-quantum 0.7.1 ml_dsa verify (FIPS 204 Algorithm 3)'

function importPrivate(M: SoftHSMModule, h: number, ps: string, sk: Uint8Array) {
  return createObjectRv(
    M,
    h,
    [
      { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
      { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_PRIVATE, boolVal: true },
      { type: CKA_SENSITIVE, boolVal: true },
      { type: CKA_SIGN, boolVal: true },
      { type: CKA_PARAMETER_SET, ulongVal: dsaParamSet(variantOf(ps)) },
    ],
    [{ type: CKA_VALUE, bytes: sk }]
  )
}

/** Run the ML-DSA negative / boundary rows for ONE engine. */
export async function runMldsaNegBoundarySection(ctx: MldsaAcvpSectionCtx): Promise<void> {
  const { M, hSession, eName, mechs, referenceUrl, pushResult, addLog } = ctx
  const [svMod, sgMod] = await Promise.all([
    import('@/data/acvp/mldsa_sigver_depth_test.json'),
    import('@/data/acvp/mldsa_siggen_ctxmsg_test.json'),
  ])
  const sv = svMod.default as unknown as VectorFile<SigVerGroup>
  const sg = sgMod.default as unknown as VectorFile<SigGenGroup>
  const SV = sv._provenance
  const SG = sg._provenance
  const hashMech = acvpHashToMech()

  const pushFail = async (
    id: string,
    algorithm: string,
    testCase: string,
    meta: AcvpCaseMeta,
    err: unknown,
    tag: string
  ) => {
    const m = err instanceof Error ? err.message : String(err)
    await pushResult({
      id,
      algorithm,
      testCase,
      referenceUrl,
      status: 'fail',
      details: `${m} · ${tag}`,
      caseMeta: { ...meta, observed: m },
    })
    addLog(`[DISCREPANCY] [${eName}] [id:${id}] ${algorithm} ${testCase}: ${m}`)
  }

  // ── 1. NIST SigVer depth (context boundaries + HashML-DSA dispositions) ──
  for (const g of sv.testGroups) {
    const ps = g.parameterSet
    const pre = g.preHash === 'preHash'
    for (const t of g.tests) {
      const mode = pre ? `HashML-DSA/${t.hashAlg}` : 'pure'
      const ctxLen = nBytes(t.context)
      const want = t.testPassed ? CKR_OK : CKR_SIGNATURE_INVALID
      const id = `mldsa-sigver-depth-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const testCase =
        `SigVer · NIST sigVer tg${g.tgId}/tc${t.tcId} · ${mode} · ctx ${ctxLen}B · msg ${nBytes(t.message)}B · ` +
        `expect ${t.testPassed ? 'valid' : `invalid (${t.reason})`}`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'sigVer',
        localOperation: 'sigVer',
        parameterSet: ps,
        mode: pre ? 'preHash' : 'pure',
        hashAlg: t.hashAlg,
        contextBytes: ctxLen,
        messageBytes: nBytes(t.message),
        expected: t.testPassed ? 'valid' : 'invalid',
        expectedReason: t.reason,
        expectedRv: rvName(want),
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(SV),
      }
      const algorithm = `${ps} (${eName})`
      const mech = pre ? hashMech[t.hashAlg] : CKM_ML_DSA
      const why = unsupportedReason(mechs, mech, pre ? mode : 'CKM_ML_DSA')
      if (why) {
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          status: 'skip',
          details: `Skipped — ${why}`,
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
          hexToBytes(t.message),
          hexToBytes(t.signature),
          hexToBytes(t.context ?? '')
        )
        const ok = r.initRv === CKR_OK && r.rv === want
        const observed =
          r.initRv !== CKR_OK ? `C_VerifyInit → ${rvName(r.initRv)}` : `C_Verify → ${rvName(r.rv)}`
        const verdict = ok
          ? ''
          : !t.testPassed && r.rv === CKR_OK
            ? ' — ACCEPTED an invalid signature'
            : t.testPassed
              ? ' — REJECTED a valid NIST signature'
              : ' — unexpected return'
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          status: ok ? 'pass' : 'fail',
          details: `${observed} (expected ${rvName(want)})${verdict} · ${srcTag(SV)}`,
          caseMeta: { ...meta, observed },
        })
        addLog(`[${eName}] [id:${id}] ${ps} ${testCase}: ${ok ? 'PASS' : 'FAIL'} (${observed})`)
      } catch (err: unknown) {
        await pushFail(id, algorithm, testCase, meta, err, srcTag(SV))
      } finally {
        destroy(M, hSession, pub)
      }
    }
  }

  // ── 2–4. Product-authored sign negatives + hedged boundaries ─────────────
  const pureWhy = unsupportedReason(mechs, CKM_ML_DSA, 'CKM_ML_DSA')
  for (const g of sg.testGroups.filter((x) => x.preHash === 'pure')) {
    const ps = g.parameterSet
    const base = g.tests.find((t) => nBytes(t.context) === 0 && t.pk)
    if (!base?.pk) continue
    const algorithm = `${ps} (${eName})`
    const msg = hexToBytes(base.message)
    const nistSig = hexToBytes(base.signature)
    const keyNote = `key material from ${srcTag(SG)} tg${g.tgId}/tc${base.tcId}`
    const baseMeta = {
      upstreamOperation: 'sigGen' as const,
      parameterSet: ps,
      mode: 'pure' as const,
      tgId: g.tgId,
      tcId: base.tcId,
      source: srcOf(SG),
    }
    if (pureWhy) {
      await pushResult({
        id: `mldsa-negbound-skip-${ps}-${eName}`,
        algorithm,
        testCase: 'Sign negatives and hedged context boundaries',
        referenceUrl,
        status: 'skip',
        details: `Skipped — ${pureWhy}`,
        caseMeta: {
          ...baseMeta,
          origin: 'not-executed',
          localOperation: 'none',
          expected: 'not-run',
        },
      })
      continue
    }
    let priv = 0
    let pub = 0
    try {
      const imp = importPrivate(M, hSession, ps, hexToBytes(base.sk))
      if (imp.rv !== CKR_OK) throw new Error(`C_CreateObject(ML-DSA sk) → ${rvName(imp.rv)}`)
      priv = imp.handle
      pub = hsm_importMLDSAPublicKey(M, hSession, variantOf(ps), hexToBytes(base.pk))
    } catch (err: unknown) {
      await pushFail(
        `mldsa-negbound-err-${ps}-${eName}`,
        algorithm,
        'Sign negatives and hedged context boundaries — key import',
        {
          ...baseMeta,
          origin: 'product-authored-probe',
          localOperation: 'key-import',
          expected: 'valid',
        },
        err,
        keyNote
      )
      destroy(M, hSession, priv)
      continue
    }
    try {
      // 2. Deterministic sign negatives.
      const detCases = [
        {
          key: 'msgflip',
          label: 'message with its last bit flipped, empty context',
          data: flip(msg),
          context: new Uint8Array(),
        },
        {
          key: 'ctxchange',
          label: 'original message, 1-byte context 00 instead of the empty context',
          data: msg,
          context: new Uint8Array([0x00]),
        },
      ]
      for (const c of detCases) {
        const id = `mldsa-negbound-det-${c.key}-${ps}-${eName}`
        const testCase = `Deterministic sign · product-authored negative · ${c.label} · signature must differ from the NIST expected one and must not verify for the original input`
        const meta: AcvpCaseMeta = {
          ...baseMeta,
          origin: 'product-authored-mutation',
          localOperation: 'sigGen-deterministic',
          contextBytes: c.context.length,
          messageBytes: c.data.length,
          expected: 'invalid',
          expectedReason: `det-${c.key}`,
        }
        try {
          const s = signRv(
            M,
            hSession,
            priv,
            CKM_ML_DSA,
            CKH_DETERMINISTIC_REQUIRED,
            c.data,
            c.context
          )
          if (!s.sig) throw new Error(`${s.step} → ${rvName(s.rv)}`)
          const differs = firstDiff(s.sig, nistSig) !== 'identical'
          const v = verifyRv(M, hSession, pub, CKM_ML_DSA, msg, s.sig, new Uint8Array())
          const ok = differs && v.initRv === CKR_OK && v.rv === CKR_SIGNATURE_INVALID
          const observed = `signature ${differs ? 'differs from' : 'EQUALS'} the NIST expected one; C_Verify(original message, empty context) → ${rvName(v.initRv !== CKR_OK ? v.initRv : v.rv)}`
          await pushResult({
            id,
            algorithm,
            testCase,
            referenceUrl,
            status: ok ? 'pass' : 'fail',
            details: `${observed} · ${keyNote} · PQC Today-authored mutation, not a NIST vector`,
            caseMeta: { ...meta, observed },
          })
          addLog(`[${eName}] [id:${id}] ${ps} ${testCase}: ${ok ? 'PASS' : 'FAIL'} (${observed})`)
        } catch (err: unknown) {
          await pushFail(id, algorithm, testCase, meta, err, keyNote)
        }
      }

      // 3. Hedged sign at the context extremes (+ 4. hedged negatives).
      const noble = await nobleFor(ps)
      const pk = hexToBytes(base.pk)
      for (const ext of [
        { key: 'ctx0', context: new Uint8Array(), label: '0-byte context' },
        {
          key: 'ctx255',
          context: MLDSA_PRODUCT_CTX255(),
          label: '255-byte product context (00..FE)',
        },
      ]) {
        const meta: AcvpCaseMeta = {
          ...baseMeta,
          origin: 'product-authored-probe',
          localOperation: 'sigGen-hedged',
          contextBytes: ext.context.length,
          messageBytes: msg.length,
          expected: 'valid',
          expectedReason: `hedged-${ext.key}`,
        }
        const rtId = `mldsa-negbound-hedged-${ext.key}-rt-${ps}-${eName}`
        const orId = `mldsa-negbound-hedged-${ext.key}-oracle-${ps}-${eName}`
        const negId = `mldsa-negbound-hedged-${ext.key}-neg-${ps}-${eName}`
        const s = signRv(M, hSession, priv, CKM_ML_DSA, CKH_HEDGE_REQUIRED, msg, ext.context)
        if (!s.sig) {
          const m = `${s.step} → ${rvName(s.rv)}`
          for (const id of [rtId, orId, negId]) {
            await pushFail(
              id,
              algorithm,
              `Hedged sign (CKH_HEDGE_REQUIRED) · ${ext.label}`,
              meta,
              m,
              keyNote
            )
          }
          continue
        }
        const sig = s.sig
        // 3a. Engine round-trip.
        {
          const v = verifyRv(M, hSession, pub, CKM_ML_DSA, msg, sig, ext.context)
          const ok = v.initRv === CKR_OK && v.rv === CKR_OK
          const observed = `C_Verify → ${rvName(v.initRv !== CKR_OK ? v.initRv : v.rv)}; ${sha256Tag(sig)}`
          await pushResult({
            id: rtId,
            algorithm,
            testCase: `Hedged sign (CKH_HEDGE_REQUIRED) · ${ext.label} · verified by the same engine with the NIST public key (round-trip)`,
            referenceUrl,
            status: ok ? 'pass' : 'fail',
            details: `${observed} · functional round-trip: no external expected value · ${keyNote}`,
            caseMeta: { ...meta, observed },
          })
          addLog(
            `[${eName}] [id:${rtId}] ${ps} hedged ${ext.key} round-trip: ${ok ? 'PASS' : 'FAIL'}`
          )
        }
        // 3b. Independent-oracle verification of the same signature.
        {
          let ok = false
          let observed: string
          try {
            ok = noble.verify(sig, msg, pk, { context: ext.context })
            observed = `${MLDSA_ORACLE} → ${ok ? 'valid' : 'INVALID'}`
          } catch (err: unknown) {
            observed = `oracle threw: ${err instanceof Error ? err.message : String(err)}`
          }
          await pushResult({
            id: orId,
            algorithm,
            testCase: `Hedged sign (CKH_HEDGE_REQUIRED) · ${ext.label} · engine signature verified by an independent implementation`,
            referenceUrl,
            status: ok ? 'pass' : 'fail',
            details: `${observed} · agreement with that oracle for this case, not a NIST expected value; the signing randomness is not checked · ${keyNote}`,
            caseMeta: { ...meta, observed },
          })
          addLog(`[${eName}] [id:${orId}] ${ps} hedged ${ext.key} oracle: ${ok ? 'PASS' : 'FAIL'}`)
        }
        // 4. Hedged negative: mutated message (ctx0) / mutated context (ctx255).
        {
          const mutMsg = ext.key === 'ctx0' ? flip(msg) : msg
          const mutCtx = ext.key === 'ctx0' ? ext.context : flip(ext.context, true)
          const v = verifyRv(M, hSession, pub, CKM_ML_DSA, mutMsg, sig, mutCtx)
          const ok = v.initRv === CKR_OK && v.rv === CKR_SIGNATURE_INVALID
          const what = ext.key === 'ctx0' ? 'message last bit flipped' : 'context byte 0 flipped'
          const observed = `C_Verify(${what}) → ${rvName(v.initRv !== CKR_OK ? v.initRv : v.rv)}`
          await pushResult({
            id: negId,
            algorithm,
            testCase: `Hedged sign · product-authored negative · the ${ext.label} hedged signature verified with the ${what} · expect CKR_SIGNATURE_INVALID`,
            referenceUrl,
            status: ok ? 'pass' : 'fail',
            details: `${observed} · ${keyNote} · PQC Today-authored mutation, not a NIST vector`,
            caseMeta: {
              ...meta,
              origin: 'product-authored-mutation',
              expected: 'invalid',
              expectedReason: `hedged-${ext.key}-${ext.key === 'ctx0' ? 'msgflip' : 'ctxflip'}`,
              expectedRv: 'CKR_SIGNATURE_INVALID',
              observed,
            },
          })
          addLog(
            `[${eName}] [id:${negId}] ${ps} hedged ${ext.key} negative: ${ok ? 'PASS' : 'FAIL'}`
          )
        }
      }
    } finally {
      destroy(M, hSession, priv)
      destroy(M, hSession, pub)
    }
  }
}
