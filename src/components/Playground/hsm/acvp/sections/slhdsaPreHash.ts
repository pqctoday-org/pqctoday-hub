// SPDX-License-Identifier: GPL-3.0-only
//
// HashSLH-DSA (pre-hash) reference-sample depth — the NIST ACVP coverage that
// closes the CKM_HASH_SLH_DSA* capability cells instead of waiving them.
//
// Where the vectors come from
//   src/data/acvp/slhdsa_prehash_siggen_{sha2,shake}_test.json carry all 120
//   (mechanism × parameter set) pairs the PKCS#11 v3.2 §6.69.7 HashSLH-DSA
//   mechanisms enumerate: the 12 upstream external/preHash deterministic=true
//   sigGen groups × the 10 hashAlg values that HAVE a CKM_HASH_SLH_DSA_<hash>
//   mechanism. src/data/acvp/slhdsa_prehash_sigver_{sha2,shake}_test.json carry
//   the two cheapest parameter sets' WHOLE external/preHash sigVer groups —
//   22 upstream NEGATIVE cases with the upstream `reason` kept verbatim,
//   covering all six upstream reasons in both hash families.
//
// Rows per NIST deterministic sigGen case, per engine (all six PKCS#11
// operations the capability matrix distinguishes for a signing mechanism):
//   1. sigVer          C_VerifyInit/C_Verify of the upstream signature → CKR_OK
//   2. sigGen det      C_SignInit(CKH_DETERMINISTIC_REQUIRED)/C_Sign, output
//                      byte-compared to the upstream signature (the strong row)
//   3. sigGen hedged   C_SignInit(CKH_HEDGE_REQUIRED)/C_Sign then verify back —
//                      a round-trip, not a byte-match: FIPS 205 hedged signing
//                      draws fresh randomness the vector cannot pin
//   4. message sigVer  C_MessageVerifyInit/C_VerifyMessage of the upstream
//                      signature → CKR_OK
//   5. message det     C_MessageSignInit/C_SignMessage(CKH_DETERMINISTIC_REQUIRED),
//                      byte-compared to the upstream signature
//   6. message hedged  C_MessageSignInit/C_SignMessage(CKH_HEDGE_REQUIRED) then
//                      verify back
// Rows per NIST sigVer case: the upstream disposition, single-part AND
// message-based. A positive must return CKR_OK; a modified message/signature
// CKR_SIGNATURE_INVALID; a too-small/too-large signature CKR_SIGNATURE_LEN_RANGE
// (PKCS#11 v3.2 §5.1.6 — invalid on length alone, which has priority over
// CKR_SIGNATURE_INVALID). Any other code fails the row.
//
// Runtime note: this section performs four SLH-DSA signing operations per NIST
// case (480 per engine). SLH-DSA signing is expensive, and the "s" parameter
// sets are the slow ones by design. Rows are emitted in upstream tgId/tcId
// order so a truncated run is still interpretable.
import slhdsaCtxTestVectors from '@/data/acvp/slhdsa_ctx_test.json'
import { hexToBytes } from '@/utils/dataInputUtils'
import {
  rvName,
  hsm_importSLHDSAPublicKey,
  writeBytes,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_SIGN,
  CKA_VALUE,
  CKA_PARAMETER_SET,
  CKO_PRIVATE_KEY,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  CKK_SLH_DSA,
  CKM_SLH_DSA,
  CKH_HEDGE_REQUIRED,
  CKH_DETERMINISTIC_REQUIRED,
  SLH_DSA_SIG_BYTES,
} from '@/wasm/softhsm/constants'
import {
  allocMech,
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
import { createObjectRv, signRv } from './pkcs11Raw'
import { ACVP_HASH_TO_SLH_MECH, SLH_CKP } from './slhdsaAcvp'

const CKR_SIGNATURE_LEN_RANGE = 0x000000c1

// ── JSON shapes ─────────────────────────────────────────────────────────────
interface PreHashProvenance extends Provenance {
  source_url: string
  subset_policy: string
}
interface SigGenCase {
  tcId: number
  hashAlg: string
  sk: string
  pk: string
  message: string
  context: string
  signature: string
}
interface SigVerCase {
  tcId: number
  testPassed: boolean
  reason: string
  hashAlg: string
  pk: string
  message: string
  context: string
  signature: string
}
interface Group<C> {
  tgId: number
  testType: string
  parameterSet: string
  signatureInterface: string
  preHash: string
  tests: C[]
}
interface VectorFile<C> {
  _provenance: PreHashProvenance
  testGroups: Group<C>[]
}
/** slhdsa_ctx_test.json /sigGen entry (reused by part 3 — no new vector bytes). */
interface CtxEntry {
  comment: string
  parameterSet: string
  tcId: number
  sk?: string
  pk: string
  message: string
  context: string
  signature: string
}

const CTX_PROV = slhdsaCtxTestVectors._provenance as unknown as {
  producer: string
  source_release: string
  source_sha256: string
}
/** slhdsa_ctx_test.json predates the source_repo/commit/path fields; derive them. */
const CTX_SRC: Provenance = {
  producer: CTX_PROV.producer,
  source_repo: 'https://github.com/usnistgov/ACVP-Server',
  source_commit: CTX_PROV.source_release,
  source_path: 'gen-val/json-files/SLH-DSA-sigGen-FIPS205/internalProjection.json',
  source_sha256: CTX_PROV.source_sha256,
}

// ── message-based (PKCS#11 v3.2 §5.14) raw helpers ──────────────────────────
// The hsm_slhdsaSign/Verify wrappers take a JS string and drop the context for
// pre-hash mechanisms, and they throw instead of returning the CK_RV. These
// call C_* directly so a row can assert the exact code and pass the upstream
// context bytes through CK_SIGN_ADDITIONAL_CONTEXT.

/** C_MessageSignInit + C_SignMessage (size query, then sign) + C_MessageSignFinal. */
function messageSignRv(
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  mechType: number,
  hedge: number,
  data: Uint8Array,
  context: Uint8Array
): { rv: number; step: string; sig: Uint8Array | null } {
  const { mech, allocs } = allocMech(M, mechType, { hedge, context })
  const dp = writeBytes(M, data)
  const lenPtr = M._malloc(4)
  let sp = 0
  let opened = false
  try {
    let rv = M._C_MessageSignInit(hSession, mech, privHandle) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_MessageSignInit', sig: null }
    opened = true
    M.setValue(lenPtr, 0, 'i32')
    rv = M._C_SignMessage(hSession, 0, 0, dp, data.length, 0, lenPtr) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_SignMessage(length)', sig: null }
    const len = M.getValue(lenPtr, 'i32') >>> 0
    sp = M._malloc(Math.max(1, len))
    rv = M._C_SignMessage(hSession, 0, 0, dp, data.length, sp, lenPtr) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_SignMessage', sig: null }
    return {
      rv,
      step: 'C_SignMessage',
      sig: M.HEAPU8.slice(sp, sp + (M.getValue(lenPtr, 'i32') >>> 0)),
    }
  } finally {
    if (opened) M._C_MessageSignFinal(hSession) // close the multi-message context
    allocs.forEach((a) => M._free(a))
    M._free(dp)
    M._free(lenPtr)
    if (sp) M._free(sp)
  }
}

/** C_MessageVerifyInit + C_VerifyMessage + C_MessageVerifyFinal. */
function messageVerifyRv(
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  mechType: number,
  data: Uint8Array,
  sig: Uint8Array,
  context: Uint8Array
): { initRv: number; rv: number } {
  const { mech, allocs } = allocMech(M, mechType, { hedge: CKH_DETERMINISTIC_REQUIRED, context })
  const dp = writeBytes(M, data)
  const sp = writeBytes(M, sig)
  let opened = false
  try {
    const initRv = M._C_MessageVerifyInit(hSession, mech, pubHandle) >>> 0
    if (initRv !== CKR_OK) return { initRv, rv: initRv }
    opened = true
    const rv = M._C_VerifyMessage(hSession, 0, 0, dp, data.length, sp, sig.length) >>> 0
    return { initRv, rv }
  } finally {
    if (opened) M._C_MessageVerifyFinal(hSession)
    allocs.forEach((a) => M._free(a))
    M._free(dp)
    M._free(sp)
  }
}

// ── shared bits ─────────────────────────────────────────────────────────────
function importSlhPrivate(M: SoftHSMModule, h: number, ps: string, sk: Uint8Array) {
  return createObjectRv(
    M,
    h,
    [
      { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
      { type: CKA_KEY_TYPE, ulongVal: CKK_SLH_DSA },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_PRIVATE, boolVal: true },
      { type: CKA_SENSITIVE, boolVal: true },
      { type: CKA_SIGN, boolVal: true },
      { type: CKA_PARAMETER_SET, ulongVal: SLH_CKP[ps] },
    ],
    [{ type: CKA_VALUE, bytes: sk }]
  )
}

const expectedRvFor = (t: SigVerCase) =>
  t.testPassed
    ? CKR_OK
    : /invalid signature - too (small|large)/.test(t.reason)
      ? CKR_SIGNATURE_LEN_RANGE
      : CKR_SIGNATURE_INVALID

/**
 * Vector-integrity guard (same contract as slhdsaAcvp.ts): a "too small" /
 * "too large" case only tests CKR_SIGNATURE_LEN_RANGE if the signature it
 * carries really is the wrong length, and every other case only tests what it
 * claims if the signature is the full FIPS 205 §11 Table 2 length. These files
 * are a script-produced subset, so compare rather than trust the label.
 */
const vectorLengthDefect = (t: SigVerCase, ps: string): string | null => {
  const want = SLH_DSA_SIG_BYTES[SLH_CKP[ps]]
  if (want === undefined) return null
  const got = nBytes(t.signature)
  const tag = `vector integrity: upstream reason "${t.reason}" but the signature is ${got}B`
  if (/too small/.test(t.reason))
    return got < want ? null : `${tag}, not shorter than the ${want}B FIPS 205 length`
  if (/too large/.test(t.reason))
    return got > want ? null : `${tag}, not longer than the ${want}B FIPS 205 length`
  return got === want ? null : `${tag}, not the expected full ${want}B FIPS 205 length`
}

/** Run the HashSLH-DSA reference-sample rows for ONE engine. */
export async function runSlhdsaPreHashSection(ctx: MldsaAcvpSectionCtx): Promise<void> {
  const { M, hSession, eName, mechs, referenceUrl, pushResult, addLog } = ctx
  const [sgSha2, sgShake, svSha2, svShake] = await Promise.all([
    import('@/data/acvp/slhdsa_prehash_siggen_sha2_test.json'),
    import('@/data/acvp/slhdsa_prehash_siggen_shake_test.json'),
    import('@/data/acvp/slhdsa_prehash_sigver_sha2_test.json'),
    import('@/data/acvp/slhdsa_prehash_sigver_shake_test.json'),
  ])
  const sgFiles = [
    sgSha2.default as unknown as VectorFile<SigGenCase>,
    sgShake.default as unknown as VectorFile<SigGenCase>,
  ]
  const svFiles = [
    svSha2.default as unknown as VectorFile<SigVerCase>,
    svShake.default as unknown as VectorFile<SigVerCase>,
  ]

  const pushSkip = async (
    id: string,
    algorithm: string,
    testCase: string,
    meta: AcvpCaseMeta,
    why: string
  ) => {
    addLog(`[${eName}] [SKIP] ${algorithm} ${testCase}: ${why}`)
    await pushResult({
      id,
      algorithm,
      testCase,
      referenceUrl,
      status: 'skip',
      details: `Skipped — ${why}`,
      caseMeta: { ...meta, expected: 'not-run', origin: 'not-executed' },
    })
  }

  const push = async (
    id: string,
    algorithm: string,
    testCase: string,
    ok: boolean,
    details: string,
    meta: AcvpCaseMeta,
    observed: string
  ) => {
    await pushResult({
      id,
      algorithm,
      testCase,
      referenceUrl,
      status: ok ? 'pass' : 'fail',
      details,
      caseMeta: { ...meta, observed },
    })
    addLog(
      `[${ok ? '' : 'DISCREPANCY] ['}${eName}] [id:${id}] ${algorithm} ${testCase}: ` +
        `${ok ? 'PASS' : 'FAIL'} (${observed})`
    )
  }

  // ── 1. NIST deterministic pre-hash sigGen: the six operations ────────────
  for (const f of sgFiles) {
    const prov = f._provenance
    for (const g of f.testGroups) {
      const ps = g.parameterSet
      for (const t of g.tests) {
        const mech = ACVP_HASH_TO_SLH_MECH[t.hashAlg]
        const mode = `HashSLH-DSA/${t.hashAlg}`
        const msg = hexToBytes(t.message)
        const ctxBytes = hexToBytes(t.context)
        const expSig = hexToBytes(t.signature)
        const algorithm = `${ps} ${mode} (${eName})`
        const tag = `tg${g.tgId}/tc${t.tcId}`
        const idTag = `tg${g.tgId}-tc${t.tcId}`
        const base: AcvpCaseMeta = {
          origin: 'nist-acvp-server',
          upstreamOperation: 'sigGen',
          localOperation: 'sigVer',
          parameterSet: ps,
          mode: 'preHash',
          hashAlg: t.hashAlg,
          contextBytes: ctxBytes.length,
          messageBytes: msg.length,
          expected: 'valid',
          tgId: g.tgId,
          tcId: t.tcId,
          source: srcOf(prov),
        }
        const idFor = (kind: string) =>
          `slhdsa-prehash-${kind}-${ps}-${t.hashAlg}-${idTag}-${eName}`
        const why = unsupportedReason(mechs, mech, mode)
        if (why) {
          for (const kind of [
            'sigver',
            'siggen-det',
            'siggen-hedged',
            'msg-sigver',
            'msg-siggen-det',
            'msg-siggen-hedged',
          ])
            await pushSkip(idFor(kind), algorithm, `${kind} · NIST sigGen ${tag}`, base, why)
          continue
        }

        let pub = 0
        let priv = 0
        try {
          pub = hsm_importSLHDSAPublicKey(M, hSession, SLH_CKP[ps], hexToBytes(t.pk))
          const imp = importSlhPrivate(M, hSession, ps, hexToBytes(t.sk))
          if (imp.rv !== CKR_OK) throw new Error(`C_CreateObject(SLH-DSA sk) → ${rvName(imp.rv)}`)
          priv = imp.handle

          // 1a. single-part verify of the upstream signature
          {
            const r = verifyRv(M, hSession, pub, mech!, msg, expSig, ctxBytes)
            const observed =
              r.initRv !== CKR_OK
                ? `C_VerifyInit → ${rvName(r.initRv)}`
                : `C_Verify → ${rvName(r.rv)}`
            const ok = r.initRv === CKR_OK && r.rv === CKR_OK
            await push(
              idFor('sigver'),
              algorithm,
              `SigVer · NIST sigGen ${tag} signature · ctx ${ctxBytes.length}B · expect valid`,
              ok,
              `${observed} (expected CKR_OK)${ok ? '' : ' — REJECTED a valid NIST signature'} · ` +
                `sig ${expSig.length}B · ${srcTag(prov)}`,
              { ...base, localOperation: 'sigVer', expectedRv: 'CKR_OK' },
              observed
            )
          }

          // 1b. deterministic sign, byte-compared to the upstream signature
          {
            const s = signRv(M, hSession, priv, mech!, CKH_DETERMINISTIC_REQUIRED, msg, ctxBytes)
            const diff = s.sig ? firstDiff(s.sig, expSig) : `${s.step} → ${rvName(s.rv)}`
            const ok = diff === 'identical'
            await push(
              idFor('siggen-det'),
              algorithm,
              `SigGen deterministic · NIST sigGen ${tag} · ctx ${ctxBytes.length}B · byte-match`,
              ok,
              (ok
                ? `sig[${s.sig!.length}B] byte-equal to NIST expected ` +
                  `(CKH_DETERMINISTIC_REQUIRED, sk via C_CreateObject)`
                : `signature mismatch: ${diff}`) + ` · ${srcTag(prov)}`,
              {
                ...base,
                localOperation: 'sigGen-deterministic',
                expected: 'byte-match',
                parameters: { hedgeVariant: 'CKH_DETERMINISTIC_REQUIRED' },
              },
              ok ? 'byte-equal' : diff
            )
          }

          // 1c. hedged sign, verified back (round-trip — no byte-match possible)
          {
            const s = signRv(M, hSession, priv, mech!, CKH_HEDGE_REQUIRED, msg, ctxBytes)
            let observed: string
            let ok = false
            if (!s.sig) observed = `${s.step} → ${rvName(s.rv)}`
            else {
              const v = verifyRv(M, hSession, pub, mech!, msg, s.sig, ctxBytes)
              ok = v.initRv === CKR_OK && v.rv === CKR_OK
              observed = ok
                ? `hedged sig[${s.sig.length}B] verified back`
                : `C_Verify(hedged sig) → ${rvName(v.rv)}`
            }
            await push(
              idFor('siggen-hedged'),
              algorithm,
              `SigGen hedged · NIST sigGen ${tag} key/message · ctx ${ctxBytes.length}B · verify back`,
              ok,
              `${observed} · CKH_HEDGE_REQUIRED draws fresh randomness, so this is a round-trip, ` +
                `not a byte-match against NIST · ${srcTag(prov)}`,
              {
                ...base,
                localOperation: 'sigGen-verify-back',
                parameters: { hedgeVariant: 'CKH_HEDGE_REQUIRED' },
              },
              observed
            )
          }

          // 1d. message-based verify of the upstream signature
          {
            const r = messageVerifyRv(M, hSession, pub, mech!, msg, expSig, ctxBytes)
            const observed =
              r.initRv !== CKR_OK
                ? `C_MessageVerifyInit → ${rvName(r.initRv)}`
                : `C_VerifyMessage → ${rvName(r.rv)}`
            const ok = r.initRv === CKR_OK && r.rv === CKR_OK
            await push(
              idFor('msg-sigver'),
              algorithm,
              `Message SigVer · C_MessageVerifyInit/C_VerifyMessage of NIST sigGen ${tag} · expect valid`,
              ok,
              `${observed} (expected CKR_OK) · ${srcTag(prov)}`,
              { ...base, localOperation: 'sigVer', expectedRv: 'CKR_OK' },
              observed
            )
          }

          // 1e. message-based deterministic sign, byte-compared
          {
            const s = messageSignRv(
              M,
              hSession,
              priv,
              mech!,
              CKH_DETERMINISTIC_REQUIRED,
              msg,
              ctxBytes
            )
            const diff = s.sig ? firstDiff(s.sig, expSig) : `${s.step} → ${rvName(s.rv)}`
            const ok = diff === 'identical'
            await push(
              idFor('msg-siggen-det'),
              algorithm,
              `Message SigGen deterministic · C_MessageSignInit/C_SignMessage of NIST sigGen ${tag} · byte-match`,
              ok,
              (ok
                ? `sig[${s.sig!.length}B] byte-equal to NIST expected via the message-based interface`
                : `signature mismatch: ${diff}`) + ` · ${srcTag(prov)}`,
              {
                ...base,
                localOperation: 'sigGen-deterministic',
                expected: 'byte-match',
                parameters: { hedgeVariant: 'CKH_DETERMINISTIC_REQUIRED', api: 'message-based' },
              },
              ok ? 'byte-equal' : diff
            )
          }

          // 1f. message-based hedged sign, verified back
          {
            const s = messageSignRv(M, hSession, priv, mech!, CKH_HEDGE_REQUIRED, msg, ctxBytes)
            let observed: string
            let ok = false
            if (!s.sig) observed = `${s.step} → ${rvName(s.rv)}`
            else {
              const v = messageVerifyRv(M, hSession, pub, mech!, msg, s.sig, ctxBytes)
              ok = v.initRv === CKR_OK && v.rv === CKR_OK
              observed = ok
                ? `hedged sig[${s.sig.length}B] verified back via C_VerifyMessage`
                : `C_VerifyMessage(hedged sig) → ${rvName(v.rv)}`
            }
            await push(
              idFor('msg-siggen-hedged'),
              algorithm,
              `Message SigGen hedged · C_MessageSignInit/C_SignMessage of NIST sigGen ${tag} key/message · verify back`,
              ok,
              `${observed} · round-trip, not a byte-match against NIST · ${srcTag(prov)}`,
              {
                ...base,
                localOperation: 'sigGen-verify-back',
                parameters: { hedgeVariant: 'CKH_HEDGE_REQUIRED', api: 'message-based' },
              },
              observed
            )
          }
        } catch (err: unknown) {
          const m = err instanceof Error ? err.message : String(err)
          await push(
            idFor('setup'),
            algorithm,
            `Key import for NIST sigGen ${tag}`,
            false,
            `${m} · ${srcTag(prov)}`,
            base,
            m
          )
        } finally {
          destroy(M, hSession, pub)
          destroy(M, hSession, priv)
        }
      }
    }
  }

  // ── 2. NIST pre-hash sigVer, the upstream disposition (mostly negative) ──
  for (const f of svFiles) {
    const prov = f._provenance
    for (const g of f.testGroups) {
      const ps = g.parameterSet
      for (const t of g.tests) {
        const mech = ACVP_HASH_TO_SLH_MECH[t.hashAlg]
        const mode = `HashSLH-DSA/${t.hashAlg}`
        const want = expectedRvFor(t)
        const algorithm = `${ps} ${mode} (${eName})`
        const tag = `tg${g.tgId}/tc${t.tcId}`
        const idTag = `tg${g.tgId}-tc${t.tcId}`
        const msg = hexToBytes(t.message)
        const ctxBytes = hexToBytes(t.context)
        const sig = hexToBytes(t.signature)
        const meta: AcvpCaseMeta = {
          origin: 'nist-acvp-server',
          upstreamOperation: 'sigVer',
          localOperation: 'sigVer',
          parameterSet: ps,
          mode: 'preHash',
          hashAlg: t.hashAlg,
          contextBytes: ctxBytes.length,
          messageBytes: msg.length,
          expected: t.testPassed ? 'valid' : 'invalid',
          expectedReason: t.reason,
          expectedRv: rvName(want),
          tgId: g.tgId,
          tcId: t.tcId,
          source: srcOf(prov),
        }
        const label =
          `NIST sigVer ${tag} · ${mode} · ctx ${ctxBytes.length}B · ` +
          `expect ${t.testPassed ? 'valid' : `invalid (${t.reason})`}`
        const ids = {
          single: `slhdsa-prehash-nist-sigver-${ps}-${idTag}-${eName}`,
          message: `slhdsa-prehash-nist-msg-sigver-${ps}-${idTag}-${eName}`,
        }
        const why = unsupportedReason(mechs, mech, mode)
        if (why) {
          await pushSkip(ids.single, algorithm, `SigVer · ${label}`, meta, why)
          await pushSkip(ids.message, algorithm, `Message SigVer · ${label}`, meta, why)
          continue
        }
        // The case must carry a signature whose LENGTH matches its own label
        // before the engine's answer means anything.
        const defect = vectorLengthDefect(t, ps)
        if (defect) {
          for (const id of [ids.single, ids.message])
            await push(
              id,
              algorithm,
              `SigVer · ${label}`,
              false,
              `${defect} — the case cannot test what it claims · ${srcTag(prov)}`,
              meta,
              defect
            )
          continue
        }
        let pub = 0
        try {
          pub = hsm_importSLHDSAPublicKey(M, hSession, SLH_CKP[ps], hexToBytes(t.pk))
          const runs = [
            {
              id: ids.single,
              prefix: 'SigVer',
              init: 'C_VerifyInit',
              call: 'C_Verify',
              r: verifyRv(M, hSession, pub, mech!, msg, sig, ctxBytes),
            },
            {
              id: ids.message,
              prefix: 'Message SigVer',
              init: 'C_MessageVerifyInit',
              call: 'C_VerifyMessage',
              r: messageVerifyRv(M, hSession, pub, mech!, msg, sig, ctxBytes),
            },
          ]
          for (const run of runs) {
            const ok = run.r.initRv === CKR_OK && run.r.rv === want
            const observed =
              run.r.initRv !== CKR_OK
                ? `${run.init} → ${rvName(run.r.initRv)}`
                : `${run.call} → ${rvName(run.r.rv)}`
            const verdict = ok
              ? ''
              : !t.testPassed && run.r.rv === CKR_OK
                ? ' — ACCEPTED an invalid signature'
                : t.testPassed
                  ? ' — REJECTED a valid NIST signature'
                  : ' — unexpected return'
            await push(
              run.id,
              algorithm,
              `${run.prefix} · ${label}`,
              ok,
              `${observed} (expected ${rvName(want)})${verdict} · msg ${msg.length}B · ` +
                `sig ${sig.length}B · ${srcTag(prov)}`,
              meta,
              observed
            )
          }
        } catch (err: unknown) {
          const m = err instanceof Error ? err.message : String(err)
          await push(
            ids.single,
            algorithm,
            `SigVer · ${label}`,
            false,
            `${m} · ${srcTag(prov)}`,
            meta,
            m
          )
        } finally {
          destroy(M, hSession, pub)
        }
      }
    }
  }

  // ── 3. Pure CKM_SLH_DSA over the message-based interface ─────────────────
  // Same NIST tuples slhdsa_ctx_test.json /sigGen already carries for the
  // single-part interface (all 12 parameter sets, 255-byte context), driven
  // through C_MessageSignInit/C_SignMessage and C_MessageVerifyInit/
  // C_VerifyMessage instead. No new vector bytes: the point is the API path.
  for (const v of Object.values(slhdsaCtxTestVectors.sigGen as Record<string, CtxEntry>)) {
    const ps = v.parameterSet
    const tgId = Number(/tgId=(\d+)/.exec(v.comment)?.[1] ?? NaN)
    const tag = `tg${tgId}/tc${v.tcId}`
    const idTag = `tg${tgId}-tc${v.tcId}`
    const msg = hexToBytes(v.message)
    const ctxBytes = hexToBytes(v.context)
    const expSig = hexToBytes(v.signature)
    const algorithm = `${ps} pure (${eName})`
    const base: AcvpCaseMeta = {
      origin: 'nist-acvp-server',
      upstreamOperation: 'sigGen',
      localOperation: 'sigVer',
      parameterSet: ps,
      mode: 'pure',
      hashAlg: 'none',
      contextBytes: ctxBytes.length,
      messageBytes: msg.length,
      expected: 'valid',
      tgId,
      tcId: v.tcId,
      source: srcOf(CTX_SRC),
    }
    const idFor = (kind: string) => `slhdsa-pure-message-${kind}-${ps}-${idTag}-${eName}`
    const why = unsupportedReason(mechs, CKM_SLH_DSA, 'CKM_SLH_DSA')
    if (why) {
      for (const kind of ['sigver', 'siggen-det', 'siggen-hedged'])
        await pushSkip(idFor(kind), algorithm, `message ${kind} · NIST sigGen ${tag}`, base, why)
      continue
    }
    let pub = 0
    let priv = 0
    try {
      pub = hsm_importSLHDSAPublicKey(M, hSession, SLH_CKP[ps], hexToBytes(v.pk))
      const imp = importSlhPrivate(M, hSession, ps, hexToBytes(v.sk!))
      if (imp.rv !== CKR_OK) throw new Error(`C_CreateObject(SLH-DSA sk) → ${rvName(imp.rv)}`)
      priv = imp.handle

      {
        const r = messageVerifyRv(M, hSession, pub, CKM_SLH_DSA, msg, expSig, ctxBytes)
        const observed =
          r.initRv !== CKR_OK
            ? `C_MessageVerifyInit → ${rvName(r.initRv)}`
            : `C_VerifyMessage → ${rvName(r.rv)}`
        const ok = r.initRv === CKR_OK && r.rv === CKR_OK
        await push(
          idFor('sigver'),
          algorithm,
          `Message SigVer · C_MessageVerifyInit/C_VerifyMessage of NIST sigGen ${tag} · ctx ${ctxBytes.length}B · expect valid`,
          ok,
          `${observed} (expected CKR_OK) · ${srcTag(CTX_SRC)}`,
          { ...base, expectedRv: 'CKR_OK' },
          observed
        )
      }
      {
        const s = messageSignRv(
          M,
          hSession,
          priv,
          CKM_SLH_DSA,
          CKH_DETERMINISTIC_REQUIRED,
          msg,
          ctxBytes
        )
        const diff = s.sig ? firstDiff(s.sig, expSig) : `${s.step} → ${rvName(s.rv)}`
        const ok = diff === 'identical'
        await push(
          idFor('siggen-det'),
          algorithm,
          `Message SigGen deterministic · C_MessageSignInit/C_SignMessage of NIST sigGen ${tag} · byte-match`,
          ok,
          (ok
            ? `sig[${s.sig!.length}B] byte-equal to NIST expected via the message-based interface`
            : `signature mismatch: ${diff}`) + ` · ${srcTag(CTX_SRC)}`,
          {
            ...base,
            localOperation: 'sigGen-deterministic',
            expected: 'byte-match',
            parameters: { hedgeVariant: 'CKH_DETERMINISTIC_REQUIRED', api: 'message-based' },
          },
          ok ? 'byte-equal' : diff
        )
      }
      {
        const s = messageSignRv(M, hSession, priv, CKM_SLH_DSA, CKH_HEDGE_REQUIRED, msg, ctxBytes)
        let observed: string
        let ok = false
        if (!s.sig) observed = `${s.step} → ${rvName(s.rv)}`
        else {
          const r = messageVerifyRv(M, hSession, pub, CKM_SLH_DSA, msg, s.sig, ctxBytes)
          ok = r.initRv === CKR_OK && r.rv === CKR_OK
          observed = ok
            ? `hedged sig[${s.sig.length}B] verified back via C_VerifyMessage`
            : `C_VerifyMessage(hedged sig) → ${rvName(r.rv)}`
        }
        await push(
          idFor('siggen-hedged'),
          algorithm,
          `Message SigGen hedged · C_MessageSignInit/C_SignMessage of NIST sigGen ${tag} key/message · verify back`,
          ok,
          `${observed} · round-trip, not a byte-match against NIST · ${srcTag(CTX_SRC)}`,
          {
            ...base,
            localOperation: 'sigGen-verify-back',
            parameters: { hedgeVariant: 'CKH_HEDGE_REQUIRED', api: 'message-based' },
          },
          observed
        )
      }
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : String(err)
      await push(
        idFor('setup'),
        algorithm,
        `Key import for NIST sigGen ${tag}`,
        false,
        `${m} · ${srcTag(CTX_SRC)}`,
        base,
        m
      )
    } finally {
      destroy(M, hSession, pub)
      destroy(M, hSession, priv)
    }
  }
}
