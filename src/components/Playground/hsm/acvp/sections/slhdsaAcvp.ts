// SPDX-License-Identifier: GPL-3.0-only
//
// SLH-DSA reference-sample depth for the validation workbench (remediation
// plan 2026-09-24, WS-D D3-2..D3-4). Rows, per engine:
//
//  1. Dedicated SigVer — NIST SLH-DSA-sigVer-FIPS205 cases with the upstream's
//     own disposition, per family × security level, pure AND pre-hash
//     (CKM_HASH_SLH_DSA_<hash>). A positive must return CKR_OK; a modified
//     signature/message CKR_SIGNATURE_INVALID; a too-small/too-large signature
//     CKR_SIGNATURE_LEN_RANGE (PKCS#11 v3.2 §5.1.6 — invalid on length alone,
//     which has priority over CKR_SIGNATURE_INVALID). Any other code fails.
//  2. Deterministic SigGen — the NIST sk imported with C_CreateObject, signed
//     with CKH_DETERMINISTIC_REQUIRED, output byte-compared: all 12 parameter
//     sets at a 255-byte context (slhdsa_ctx_test.json /sigGen) plus empty-
//     context and pre-hash cases for the 128f sets.
//  3. Product-authored negatives — public-key and context bit flips of the
//     sigGen-derived positive tuple for all 12 sets, plus signature and
//     message flips for the sets without a dedicated NIST SigVer case.
//  4. Product-authored probes — a 256-byte context must be refused at
//     C_SignInit (exact code pinned per engine) and CKH_HEDGE_REQUIRED
//     signing must be randomized (two signatures differ, both verify).
//  5. Honest skips — pre-hash functions with no PKCS#11 mechanism, the
//     internal interface, and hedged sigGen (additionalRandomness cannot be
//     injected), backed by the runtime C_GetMechanismList.
import slhdsaCtxTestVectors from '@/data/acvp/slhdsa_ctx_test.json'
import { hexToBytes } from '@/utils/dataInputUtils'
import {
  rvName,
  hsm_importSLHDSAPublicKey,
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
  CKM_HASH_SLH_DSA_SHA224,
  CKM_HASH_SLH_DSA_SHA256,
  CKM_HASH_SLH_DSA_SHA384,
  CKM_HASH_SLH_DSA_SHA512,
  CKM_HASH_SLH_DSA_SHA3_224,
  CKM_HASH_SLH_DSA_SHA3_256,
  CKM_HASH_SLH_DSA_SHA3_384,
  CKM_HASH_SLH_DSA_SHA3_512,
  CKM_HASH_SLH_DSA_SHAKE128,
  CKM_HASH_SLH_DSA_SHAKE256,
  CKH_HEDGE_REQUIRED,
  CKH_DETERMINISTIC_REQUIRED,
  CKP_SLH_DSA_SHA2_128S,
  CKP_SLH_DSA_SHA2_128F,
  CKP_SLH_DSA_SHA2_192S,
  CKP_SLH_DSA_SHA2_192F,
  CKP_SLH_DSA_SHA2_256S,
  CKP_SLH_DSA_SHA2_256F,
  CKP_SLH_DSA_SHAKE_128S,
  CKP_SLH_DSA_SHAKE_128F,
  CKP_SLH_DSA_SHAKE_192S,
  CKP_SLH_DSA_SHAKE_192F,
  CKP_SLH_DSA_SHAKE_256S,
  CKP_SLH_DSA_SHAKE_256F,
} from '@/wasm/softhsm/constants'
import {
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
import { createObjectRv, pinnedVerdict, sha256Tag, signRv, type PinnedRv } from './pkcs11Raw'

const CKR_SIGNATURE_LEN_RANGE = 0x000000c1

export const SLH_CKP: Readonly<Record<string, number>> = {
  'SLH-DSA-SHA2-128s': CKP_SLH_DSA_SHA2_128S,
  'SLH-DSA-SHA2-128f': CKP_SLH_DSA_SHA2_128F,
  'SLH-DSA-SHA2-192s': CKP_SLH_DSA_SHA2_192S,
  'SLH-DSA-SHA2-192f': CKP_SLH_DSA_SHA2_192F,
  'SLH-DSA-SHA2-256s': CKP_SLH_DSA_SHA2_256S,
  'SLH-DSA-SHA2-256f': CKP_SLH_DSA_SHA2_256F,
  'SLH-DSA-SHAKE-128s': CKP_SLH_DSA_SHAKE_128S,
  'SLH-DSA-SHAKE-128f': CKP_SLH_DSA_SHAKE_128F,
  'SLH-DSA-SHAKE-192s': CKP_SLH_DSA_SHAKE_192S,
  'SLH-DSA-SHAKE-192f': CKP_SLH_DSA_SHAKE_192F,
  'SLH-DSA-SHAKE-256s': CKP_SLH_DSA_SHAKE_256S,
  'SLH-DSA-SHAKE-256f': CKP_SLH_DSA_SHAKE_256F,
}

/** ACVP hashAlg → PKCS#11 v3.2 CKM_HASH_SLH_DSA_<hash> (§6.69.7). No mechanism
 * exists for SHA2-512/224 or SHA2-512/256. */
export const ACVP_HASH_TO_SLH_MECH: Readonly<Record<string, number>> = {
  'SHA2-224': CKM_HASH_SLH_DSA_SHA224,
  'SHA2-256': CKM_HASH_SLH_DSA_SHA256,
  'SHA2-384': CKM_HASH_SLH_DSA_SHA384,
  'SHA2-512': CKM_HASH_SLH_DSA_SHA512,
  'SHA3-224': CKM_HASH_SLH_DSA_SHA3_224,
  'SHA3-256': CKM_HASH_SLH_DSA_SHA3_256,
  'SHA3-384': CKM_HASH_SLH_DSA_SHA3_384,
  'SHA3-512': CKM_HASH_SLH_DSA_SHA3_512,
  'SHAKE-128': CKM_HASH_SLH_DSA_SHAKE128,
  'SHAKE-256': CKM_HASH_SLH_DSA_SHAKE256,
}

/** C_SignInit with a 256-byte context (FIPS 205 caps it at 255). */
export const SLH_CTX256_PIN: PinnedRv = {
  cpp: 'CKR_ARGUMENTS_BAD',
  rust: 'CKR_MECHANISM_PARAM_INVALID',
  listed: ['CKR_ARGUMENTS_BAD', 'CKR_MECHANISM_PARAM_INVALID'],
  section: '§5.13.1 (C_SignInit)',
}

// ── JSON shapes ─────────────────────────────────────────────────────────────
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
  signatureInterface: string
  preHash: string
  tests: SigVerCase[]
}
interface SigGenCase {
  tcId: number
  hashAlg: string
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
interface NotExecuted {
  tgId: number
  tcId?: number
  parameterSet: string
  hashAlg?: string
  preHash?: string
  cases?: number
  why: string
}
interface VectorFile<G> {
  _provenance: Provenance
  testGroups: G[]
  notExecuted?: NotExecuted[]
}
interface CtxEntry {
  comment: string
  parameterSet: string
  tcId: number
  sk?: string
  pk: string
  message: string
  context: string
  signature: string
  testPassed?: boolean
}

const CTX_PROV = slhdsaCtxTestVectors._provenance as unknown as Provenance & {
  source_url: string
  source_release: string
}
/** slhdsa_ctx_test.json predates the source_repo/commit/path fields; derive them. */
const CTX_SRC: Provenance = {
  producer: CTX_PROV.producer,
  source_repo: 'https://github.com/usnistgov/ACVP-Server',
  source_commit: CTX_PROV.source_release,
  source_path: 'gen-val/json-files/SLH-DSA-sigGen-FIPS205/internalProjection.json',
  source_sha256: CTX_PROV.source_sha256,
}
const tgOf = (comment: string) => Number(/tgId=(\d+)/.exec(comment)?.[1] ?? NaN)

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

const mechFor = (preHash: string, hashAlg: string) =>
  preHash === 'preHash' ? ACVP_HASH_TO_SLH_MECH[hashAlg] : CKM_SLH_DSA
const modeLabel = (preHash: string, hashAlg: string) =>
  preHash === 'preHash' ? `HashSLH-DSA/${hashAlg}` : 'pure'

/** Run the SLH-DSA reference-sample rows for ONE engine. */
export async function runSlhdsaAcvpSection(ctx: MldsaAcvpSectionCtx): Promise<void> {
  const { M, hSession, eName, mechs, referenceUrl, pushResult, addLog } = ctx
  const [sha2Mod, shakeMod, detMod] = await Promise.all([
    import('@/data/acvp/slhdsa_sigver_sha2_test.json'),
    import('@/data/acvp/slhdsa_sigver_shake_test.json'),
    import('@/data/acvp/slhdsa_siggen_det_test.json'),
  ])
  const svFiles = [
    sha2Mod.default as unknown as VectorFile<SigVerGroup>,
    shakeMod.default as unknown as VectorFile<SigVerGroup>,
  ]
  const det = detMod.default as unknown as VectorFile<SigGenGroup>
  const SV = svFiles[0]._provenance
  const DET = det._provenance
  const svTier = ctx.evidenceTierFor(SV)
  const detTier = ctx.evidenceTierFor(DET)
  const ctxTier = ctx.evidenceTierFor(CTX_PROV)

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

  // ── 1. Dedicated NIST SigVer ───────────────────────────────────────────
  for (const f of svFiles) {
    for (const g of f.testGroups) {
      const ps = g.parameterSet
      for (const t of g.tests) {
        const mode = modeLabel(g.preHash, t.hashAlg)
        const ctxLen = nBytes(t.context)
        const want = expectedRvFor(t)
        const id = `slhdsa-sigver-nist-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
        const testCase =
          `SigVer · NIST sigVer tg${g.tgId}/tc${t.tcId} · ${mode} · ctx ${ctxLen}B · ` +
          `expect ${t.testPassed ? 'valid' : `invalid (${t.reason})`}`
        const meta: AcvpCaseMeta = {
          origin: 'nist-acvp-server',
          upstreamOperation: 'sigVer',
          localOperation: 'sigVer',
          parameterSet: ps,
          mode: g.preHash === 'preHash' ? 'preHash' : 'pure',
          hashAlg: t.hashAlg,
          contextBytes: ctxLen,
          messageBytes: nBytes(t.message),
          expected: t.testPassed ? 'valid' : 'invalid',
          expectedReason: t.reason,
          expectedRv: rvName(want),
          tgId: g.tgId,
          tcId: t.tcId,
          source: srcOf(f._provenance),
        }
        const algorithm = `${ps} (${eName})`
        const mech = mechFor(g.preHash, t.hashAlg)
        const why = unsupportedReason(mechs, mech, g.preHash === 'preHash' ? mode : 'CKM_SLH_DSA')
        if (why) {
          await pushSkip(id, algorithm, testCase, meta, why)
          continue
        }
        let pub = 0
        try {
          pub = hsm_importSLHDSAPublicKey(M, hSession, SLH_CKP[ps], hexToBytes(t.pk))
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
            r.initRv !== CKR_OK
              ? `C_VerifyInit → ${rvName(r.initRv)}`
              : `C_Verify → ${rvName(r.rv)}`
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
            evidenceTier: svTier,
            status: ok ? 'pass' : 'fail',
            details: `${observed} (expected ${rvName(want)})${verdict} · msg ${nBytes(t.message)}B · sig ${nBytes(t.signature)}B · ${srcTag(f._provenance)}`,
            caseMeta: { ...meta, observed },
          })
          addLog(`[${eName}] [id:${id}] ${ps} ${testCase}: ${ok ? 'PASS' : 'FAIL'} (${observed})`)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          await pushResult({
            id,
            algorithm,
            testCase,
            referenceUrl,
            evidenceTier: svTier,
            status: 'fail',
            details: `${msg} · ${srcTag(f._provenance)}`,
            caseMeta: { ...meta, observed: msg },
          })
          addLog(`[DISCREPANCY] [${eName}] [id:${id}] ${ps} ${testCase}: ${msg}`)
        } finally {
          destroy(M, hSession, pub)
        }
      }
    }
  }

  // ── 2. Deterministic SigGen byte-match ─────────────────────────────────
  const detCases: {
    ps: string
    tgId: number
    tcId: number
    preHash: string
    hashAlg: string
    sk: string
    message: string
    context: string
    signature: string
    src: Provenance
    tier: typeof detTier
    file: 'ctx' | 'det'
  }[] = [
    ...Object.values(slhdsaCtxTestVectors.sigGen as Record<string, CtxEntry>).map((v) => ({
      ps: v.parameterSet,
      tgId: tgOf(v.comment),
      tcId: v.tcId,
      preHash: 'pure',
      hashAlg: 'none',
      sk: v.sk!,
      message: v.message,
      context: v.context,
      signature: v.signature,
      src: CTX_SRC,
      tier: ctxTier,
      file: 'ctx' as const,
    })),
    ...det.testGroups.flatMap((g) =>
      g.tests.map((t) => ({
        ps: g.parameterSet,
        tgId: g.tgId,
        tcId: t.tcId,
        preHash: g.preHash,
        hashAlg: t.hashAlg,
        sk: t.sk,
        message: t.message,
        context: t.context ?? '',
        signature: t.signature,
        src: DET,
        tier: detTier,
        file: 'det' as const,
      }))
    ),
  ]
  for (const c of detCases) {
    const mode = modeLabel(c.preHash, c.hashAlg)
    const ctxBytes = hexToBytes(c.context)
    const id = `slhdsa-siggen-det-${c.ps}-tg${c.tgId}-tc${c.tcId}-${eName}`
    const testCase = `SigGen deterministic · NIST sigGen tg${c.tgId}/tc${c.tcId} · ${mode} · ctx ${ctxBytes.length}B · byte-match`
    const meta: AcvpCaseMeta = {
      origin: 'nist-acvp-server',
      upstreamOperation: 'sigGen',
      localOperation: 'sigGen-deterministic',
      parameterSet: c.ps,
      mode: c.preHash === 'preHash' ? 'preHash' : 'pure',
      hashAlg: c.hashAlg,
      contextBytes: ctxBytes.length,
      messageBytes: nBytes(c.message),
      expected: 'byte-match',
      tgId: c.tgId,
      tcId: c.tcId,
      source: srcOf(c.src),
    }
    const algorithm = `${c.ps} (${eName})`
    const mech = mechFor(c.preHash, c.hashAlg)
    const why = unsupportedReason(mechs, mech, c.preHash === 'preHash' ? mode : 'CKM_SLH_DSA')
    if (why) {
      await pushSkip(id, algorithm, testCase, meta, why)
      continue
    }
    let priv = 0
    try {
      const imp = importSlhPrivate(M, hSession, c.ps, hexToBytes(c.sk))
      if (imp.rv !== CKR_OK) throw new Error(`C_CreateObject(SLH-DSA sk) → ${rvName(imp.rv)}`)
      priv = imp.handle
      const s = signRv(
        M,
        hSession,
        priv,
        mech!,
        CKH_DETERMINISTIC_REQUIRED,
        hexToBytes(c.message),
        ctxBytes
      )
      if (!s.sig) throw new Error(`${s.step} → ${rvName(s.rv)}`)
      const diff = firstDiff(s.sig, hexToBytes(c.signature))
      const ok = diff === 'identical'
      await pushResult({
        id,
        algorithm,
        testCase,
        referenceUrl,
        evidenceTier: c.tier,
        status: ok ? 'pass' : 'fail',
        details:
          (ok
            ? `sig[${s.sig.length}B] byte-equal to NIST expected (CKH_DETERMINISTIC_REQUIRED, sk via C_CreateObject)`
            : `signature mismatch: ${diff}`) + ` · ${srcTag(c.src)}`,
        caseMeta: { ...meta, observed: ok ? 'byte-equal' : diff },
      })
      addLog(`[${eName}] [id:${id}] ${c.ps} ${testCase}: ${ok ? 'PASS' : `FAIL (${diff})`}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      await pushResult({
        id,
        algorithm,
        testCase,
        referenceUrl,
        evidenceTier: c.tier,
        status: 'fail',
        details: `${msg} · ${srcTag(c.src)}`,
        caseMeta: { ...meta, observed: msg },
      })
      addLog(`[DISCREPANCY] [${eName}] [id:${id}] ${c.ps} ${testCase}: ${msg}`)
    } finally {
      destroy(M, hSession, priv)
    }
  }

  // ── 3. Product-authored negatives (no evidence tier: PQC Today's expected values) ──
  const nistSigVerSets = new Set(
    svFiles.flatMap((f) =>
      f.testGroups.filter((g) => g.preHash === 'pure').map((g) => g.parameterSet)
    )
  )
  for (const v of Object.values(slhdsaCtxTestVectors.sigVer as Record<string, CtxEntry>)) {
    const ps = v.parameterSet
    const flip = (hex: string, at = 0) => {
      const b = hexToBytes(hex)
      if (b.length > 0) b[at] ^= 0x01
      return b
    }
    const muts: {
      key: string
      label: string
      pk: Uint8Array
      msg: Uint8Array
      sig: Uint8Array
      ctx: Uint8Array
    }[] = [
      {
        key: 'pk-bitflip',
        label: 'public-key bit flip (pk[0]^=0x01)',
        pk: flip(v.pk),
        msg: hexToBytes(v.message),
        sig: hexToBytes(v.signature),
        ctx: hexToBytes(v.context),
      },
      {
        key: 'ctx-bitflip',
        label: `context bit flip (ctx[0]^=0x01 of ${nBytes(v.context)}B)`,
        pk: hexToBytes(v.pk),
        msg: hexToBytes(v.message),
        sig: hexToBytes(v.signature),
        ctx: flip(v.context),
      },
    ]
    if (!nistSigVerSets.has(ps)) {
      muts.push(
        {
          key: 'sig-bitflip',
          label: 'signature bit flip (R: sig[0]^=0x01)',
          pk: hexToBytes(v.pk),
          msg: hexToBytes(v.message),
          sig: flip(v.signature),
          ctx: hexToBytes(v.context),
        },
        {
          key: 'msg-bitflip',
          label: 'message bit flip (msg[0]^=0x01)',
          pk: hexToBytes(v.pk),
          msg: flip(v.message),
          sig: hexToBytes(v.signature),
          ctx: hexToBytes(v.context),
        }
      )
    }
    for (const mu of muts) {
      const id = `slhdsa-sigver-local-${mu.key}-${ps}-${eName}`
      const testCase = `SigVer · product-authored negative · ${mu.label} of NIST sigGen tc${v.tcId} · expect invalid`
      const meta: AcvpCaseMeta = {
        origin: 'product-authored-mutation',
        upstreamOperation: 'sigGen',
        localOperation: 'sigVer',
        parameterSet: ps,
        mode: 'pure',
        contextBytes: mu.ctx.length,
        messageBytes: mu.msg.length,
        expected: 'invalid',
        expectedReason: mu.key,
        expectedRv: 'CKR_SIGNATURE_INVALID',
        tgId: tgOf(v.comment),
        tcId: v.tcId,
        source: srcOf(CTX_SRC),
      }
      const algorithm = `${ps} (${eName})`
      const why = unsupportedReason(mechs, CKM_SLH_DSA, 'CKM_SLH_DSA')
      if (why) {
        await pushSkip(id, algorithm, testCase, meta, why)
        continue
      }
      let pub = 0
      try {
        pub = hsm_importSLHDSAPublicKey(M, hSession, SLH_CKP[ps], mu.pk)
        const r = verifyRv(M, hSession, pub, CKM_SLH_DSA, mu.msg, mu.sig, mu.ctx)
        const ok = r.initRv === CKR_OK && r.rv === CKR_SIGNATURE_INVALID
        const observed =
          r.initRv !== CKR_OK ? `C_VerifyInit → ${rvName(r.initRv)}` : `C_Verify → ${rvName(r.rv)}`
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          status: ok ? 'pass' : 'fail',
          details:
            `${observed} (expected CKR_SIGNATURE_INVALID)${!ok && r.rv === CKR_OK ? ' — ACCEPTED a mutated input' : ''}` +
            ` · PQC Today-authored mutation of ${srcTag(CTX_SRC)} tc${v.tcId}, not a NIST vector`,
          caseMeta: { ...meta, observed },
        })
        addLog(`[${eName}] [id:${id}] ${ps} ${mu.key}: ${ok ? 'PASS' : 'FAIL'} (${observed})`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        await pushResult({
          id,
          algorithm,
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

  // ── 4. Product-authored probes on SLH-DSA-SHA2-128f (fastest to sign) ──
  const probeCase = det.testGroups.find(
    (g) => g.parameterSet === 'SLH-DSA-SHA2-128f' && g.preHash === 'pure'
  )?.tests[0]
  if (probeCase && !unsupportedReason(mechs, CKM_SLH_DSA, 'CKM_SLH_DSA')) {
    const ps = 'SLH-DSA-SHA2-128f'
    const algorithm = `${ps} (${eName})`
    const baseMeta = {
      upstreamOperation: 'sigGen' as const,
      parameterSet: ps,
      mode: 'pure' as const,
      tgId: det.testGroups.find((g) => g.parameterSet === ps && g.preHash === 'pure')!.tgId,
      tcId: probeCase.tcId,
      source: srcOf(DET),
    }
    let priv = 0
    let pub = 0
    try {
      priv = importSlhPrivate(M, hSession, ps, hexToBytes(probeCase.sk)).handle
      pub = hsm_importSLHDSAPublicKey(M, hSession, SLH_CKP[ps], hexToBytes(probeCase.pk!))
      const msg = hexToBytes(probeCase.message)

      // 4a. context of 256 bytes must be refused at C_SignInit
      {
        const id = `slhdsa-probe-ctx256-${eName}`
        const testCase =
          'Context boundary · product-authored probe · C_SignInit with a 256-byte context (FIPS 205 max 255) · expect refusal'
        const s = signRv(
          M,
          hSession,
          priv,
          CKM_SLH_DSA,
          CKH_DETERMINISTIC_REQUIRED,
          msg,
          new Uint8Array(256)
        )
        const observed = s.sig ? 'CKR_OK (signature produced)' : rvName(s.rv)
        const v = pinnedVerdict(SLH_CTX256_PIN, eName, observed)
        const ok = v.ok && !s.sig && s.step === 'C_SignInit'
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          status: ok ? 'pass' : 'fail',
          details: `${v.details} · at ${s.step} · PQC Today-authored probe, not a NIST vector`,
          caseMeta: {
            ...baseMeta,
            origin: 'product-authored-probe',
            localOperation: 'sigGen-deterministic',
            contextBytes: 256,
            messageBytes: msg.length,
            expected: 'return-code',
            expectedReason: 'ctx-256',
            expectedRv:
              eName === 'C++'
                ? SLH_CTX256_PIN.cpp
                : eName === 'Rust'
                  ? SLH_CTX256_PIN.rust
                  : undefined,
            observed,
          },
        })
      }

      // 4b. hedged signing is randomized; both signatures verify
      {
        const id = `slhdsa-probe-hedged-randomized-${eName}`
        const testCase =
          'SigGen hedged · product-authored probe · two CKH_HEDGE_REQUIRED signatures of one message differ and both verify'
        const ctxB = hexToBytes(probeCase.context ?? '')
        const a = signRv(M, hSession, priv, CKM_SLH_DSA, CKH_HEDGE_REQUIRED, msg, ctxB)
        const b = signRv(M, hSession, priv, CKM_SLH_DSA, CKH_HEDGE_REQUIRED, msg, ctxB)
        let observed: string
        let ok = false
        if (!a.sig || !b.sig) {
          observed =
            `${a.sig ? '' : `${a.step} → ${rvName(a.rv)}`}${b.sig ? '' : ` ${b.step} → ${rvName(b.rv)}`}`.trim()
        } else {
          const va = verifyRv(M, hSession, pub, CKM_SLH_DSA, msg, a.sig, ctxB)
          const vb = verifyRv(M, hSession, pub, CKM_SLH_DSA, msg, b.sig, ctxB)
          const differ = firstDiff(a.sig, b.sig) !== 'identical'
          const notDet = firstDiff(a.sig, hexToBytes(probeCase.signature)) !== 'identical'
          ok = differ && notDet && va.rv === CKR_OK && vb.rv === CKR_OK
          observed = `${differ ? 'signatures differ' : 'signatures IDENTICAL'}; verify ${rvName(va.rv)}/${rvName(vb.rv)}; ${sha256Tag(a.sig)}`
        }
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          status: ok ? 'pass' : 'fail',
          details:
            `${observed} · functional round-trip: shows randomization is active, not that the randomness is correct` +
            ' · PQC Today-authored probe, not a NIST vector',
          caseMeta: {
            ...baseMeta,
            origin: 'product-authored-probe',
            localOperation: 'sigGen-hedged',
            contextBytes: ctxB.length,
            messageBytes: msg.length,
            expected: 'valid',
            expectedReason: 'hedged-randomized',
            observed,
          },
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      await pushResult({
        id: `slhdsa-probe-err-${eName}`,
        algorithm,
        testCase: 'SLH-DSA product-authored probes',
        referenceUrl,
        status: 'fail',
        details: msg,
      })
    } finally {
      destroy(M, hSession, priv)
      destroy(M, hSession, pub)
    }
  }

  // ── 5. Honest skips ────────────────────────────────────────────────────
  const svNotRun = svFiles.flatMap((f) => f.notExecuted ?? [])
  const detNotRun = det.notExecuted ?? []
  const notRun = [...svNotRun, ...detNotRun]
  const noMech = notRun.filter((r) => r.why === 'no-pkcs11-hash-slh-dsa-mechanism')
  if (noMech.length > 0) {
    const hashes = [...new Set(noMech.map((r) => r.hashAlg!))].sort()
    const advertised = Object.values(ACVP_HASH_TO_SLH_MECH).filter((m) => mechs.has(m)).length
    await pushResult({
      id: `slhdsa-skip-hash-sha512t-${eName}`,
      algorithm: `SLH-DSA (${eName})`,
      testCase: `HashSLH-DSA SigVer · ${hashes.join(', ')} · NIST sigVer ${noMech.length} cases`,
      referenceUrl,
      status: 'skip',
      details:
        `Skipped — PKCS#11 v3.2 §6.69.7 defines no CKM_HASH_SLH_DSA_<hash> mechanism for ${hashes.join(' or ')}; ` +
        `C_GetMechanismList on this engine advertises ${advertised} of the 10 that do exist and none for these hashes. ` +
        `Generic CKM_HASH_SLH_DSA (caller-supplied digest) is not exercised here. Not run: ` +
        noMech.map((r) => `tg${r.tgId}/tc${r.tcId}`).join(', ') +
        ` · ${srcTag(SV)}`,
      caseMeta: {
        origin: 'not-executed',
        upstreamOperation: 'sigVer',
        localOperation: 'none',
        parameterSet: 'SLH-DSA',
        mode: 'preHash',
        hashAlg: hashes.join(','),
        expected: 'not-run',
        source: srcOf(SV),
      },
    })
  }
  const internal = notRun.filter((r) => r.why === 'no-pkcs11-internal-interface')
  if (internal.length > 0) {
    await pushResult({
      id: `slhdsa-skip-internal-${eName}`,
      algorithm: `SLH-DSA (${eName})`,
      testCase: `SigVer/SigGen internal interface (slh_sign_internal on a raw M′) · ${internal.length} groups`,
      referenceUrl,
      status: 'skip',
      details:
        'Skipped — no PKCS#11 v3.2 mechanism exposes slh_sign_internal / slh_verify_internal (CKM_SLH_DSA always ' +
        'applies the FIPS 205 §10.2 domain-separation prefix). Not run: sigVer ' +
        svNotRun
          .filter((r) => r.why === 'no-pkcs11-internal-interface')
          .map((r) => `tg${r.tgId}`)
          .join(', ') +
        '; sigGen (deterministic) ' +
        detNotRun
          .filter((r) => r.why === 'no-pkcs11-internal-interface')
          .map((r) => `tg${r.tgId}`)
          .join(', '),
      caseMeta: {
        origin: 'not-executed',
        upstreamOperation: 'sigVer',
        localOperation: 'none',
        parameterSet: 'SLH-DSA',
        mode: 'internal',
        expected: 'not-run',
        source: srcOf(SV),
      },
    })
  }
  const hedged = notRun.filter((r) => r.why === 'hedged-additional-randomness-not-injectable')
  if (hedged.length > 0) {
    await pushResult({
      id: `slhdsa-skip-hedged-rnd-${eName}`,
      algorithm: `SLH-DSA (${eName})`,
      testCase: `SigGen hedged · byte-match against NIST additionalRandomness · ${hedged.length} groups`,
      referenceUrl,
      status: 'skip',
      details:
        'Skipped — CK_SIGN_ADDITIONAL_CONTEXT carries hedgeVariant and context only; there is no PKCS#11 parameter for ' +
        'opt_rand, so a hedged NIST signature cannot be reproduced (randomization itself is shown by the hedged probe row). ' +
        `Not run: sigGen ${hedged.map((r) => `tg${r.tgId}`).join(', ')} · ${srcTag(DET)}`,
      caseMeta: {
        origin: 'not-executed',
        upstreamOperation: 'sigGen',
        localOperation: 'none',
        parameterSet: 'SLH-DSA',
        expected: 'not-run',
        source: srcOf(DET),
      },
    })
  }
}
