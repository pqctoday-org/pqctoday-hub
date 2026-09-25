// SPDX-License-Identifier: GPL-3.0-only
//
// ML-DSA context / message-length / pre-hash depth (remediation plan
// 2026-09-24, WS-D D2-6). Extends section 5d (mldsaAcvp.ts), which picked the
// shortest message per group. Rows, per engine:
//
//  1. Deterministic SigGen byte-match against NIST for the context-length
//     extremes (0 and 255 bytes), the longest upstream messages (8192 bytes)
//     and the seven HashML-DSA pre-hash functions section 5d did not cover —
//     every row carries its exact context/message length and hash in caseMeta.
//  2. Product-authored context boundaries: a 1-byte context (no expressible
//     NIST case exists) signs deterministically, verifies with that context
//     and is rejected without it — the signature fingerprint is recorded so
//     C++ and Rust can be compared (differential, not NIST); a 256-byte
//     context is refused at C_SignInit and C_VerifyInit with the exact code
//     pinned per engine.
//  3. Skip: the upstream's only 1-byte-context case (hedged, SHA2-512/256).
import { hexToBytes } from '@/utils/dataInputUtils'
import {
  rvName,
  dsaParamSet,
  hsm_importMLDSAPublicKey,
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
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { CKM_ML_DSA, CKH_DETERMINISTIC_REQUIRED } from '@/wasm/softhsm/constants'
import {
  ACVP_HASH_TO_MECH,
  verifyRv,
  destroy,
  firstDiff,
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

/** 256-byte context (FIPS 204 caps ctx at 255 bytes). */
export const MLDSA_CTX256_PINS: Record<'sign' | 'verify', PinnedRv> = {
  sign: {
    cpp: 'CKR_ARGUMENTS_BAD',
    rust: 'CKR_MECHANISM_PARAM_INVALID',
    listed: ['CKR_ARGUMENTS_BAD', 'CKR_MECHANISM_PARAM_INVALID'],
    section: '§5.13.1 (C_SignInit)',
  },
  verify: {
    cpp: 'CKR_ARGUMENTS_BAD',
    rust: 'CKR_MECHANISM_PARAM_INVALID',
    listed: ['CKR_ARGUMENTS_BAD', 'CKR_MECHANISM_PARAM_INVALID'],
    section: '§5.15.1 (C_VerifyInit)',
  },
}

interface SigGenCase {
  tcId: number
  hashAlg: string
  sk: string
  /** carried by mldsa_siggen_ctxmsg_test.json only (used by the ctx probes) */
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
interface VectorFile {
  _provenance: Provenance
  testGroups: SigGenGroup[]
}

const variantOf = (ps: string) => parseInt(ps.split('-')[2], 10) as 44 | 65 | 87

function importMldsaPrivate(M: SoftHSMModule, h: number, ps: string, sk: Uint8Array) {
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

/** Run the ML-DSA depth rows for ONE engine. */
export async function runMldsaDepthSection(ctx: MldsaAcvpSectionCtx): Promise<void> {
  const { M, hSession, eName, mechs, referenceUrl, pushResult, addLog } = ctx
  const [cmMod, phMod] = await Promise.all([
    import('@/data/acvp/mldsa_siggen_ctxmsg_test.json'),
    import('@/data/acvp/mldsa_siggen_prehash_test.json'),
  ])
  const files = [cmMod.default as unknown as VectorFile, phMod.default as unknown as VectorFile]
  const PROV = files[0]._provenance

  // ── 1. Deterministic SigGen byte-match ─────────────────────────────────
  for (const f of files) {
    for (const g of f.testGroups) {
      const ps = g.parameterSet
      for (const t of g.tests) {
        const pre = g.preHash === 'preHash'
        const mode = pre ? `HashML-DSA/${t.hashAlg}` : 'pure'
        const ctxBytes = hexToBytes(t.context ?? '')
        const msg = hexToBytes(t.message)
        const id = `mldsa-depth-siggen-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
        const testCase = `SigGen deterministic · NIST sigGen tg${g.tgId}/tc${t.tcId} · ${mode} · ctx ${ctxBytes.length}B · msg ${msg.length}B · byte-match`
        const meta: AcvpCaseMeta = {
          origin: 'nist-acvp-server',
          upstreamOperation: 'sigGen',
          localOperation: 'sigGen-deterministic',
          parameterSet: ps,
          mode: pre ? 'preHash' : 'pure',
          hashAlg: t.hashAlg,
          contextBytes: ctxBytes.length,
          messageBytes: msg.length,
          expected: 'byte-match',
          tgId: g.tgId,
          tcId: t.tcId,
          source: srcOf(f._provenance),
        }
        const algorithm = `${ps} (${eName})`
        const mech = pre ? ACVP_HASH_TO_MECH[t.hashAlg] : CKM_ML_DSA
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
        let priv = 0
        try {
          const imp = importMldsaPrivate(M, hSession, ps, hexToBytes(t.sk))
          if (imp.rv !== CKR_OK) throw new Error(`C_CreateObject(ML-DSA sk) → ${rvName(imp.rv)}`)
          priv = imp.handle
          const s = signRv(M, hSession, priv, mech!, CKH_DETERMINISTIC_REQUIRED, msg, ctxBytes)
          if (!s.sig) throw new Error(`${s.step} → ${rvName(s.rv)}`)
          const diff = firstDiff(s.sig, hexToBytes(t.signature))
          const ok = diff === 'identical'
          await pushResult({
            id,
            algorithm,
            testCase,
            referenceUrl,
            status: ok ? 'pass' : 'fail',
            details:
              (ok
                ? `sig[${s.sig.length}B] byte-equal to NIST expected (CKH_DETERMINISTIC_REQUIRED, sk via C_CreateObject)`
                : `signature mismatch: ${diff}`) + ` · ${srcTag(f._provenance)}`,
            caseMeta: { ...meta, observed: ok ? 'byte-equal' : diff },
          })
          addLog(`[${eName}] [id:${id}] ${ps} ${testCase}: ${ok ? 'PASS' : `FAIL (${diff})`}`)
        } catch (err: unknown) {
          const m = err instanceof Error ? err.message : String(err)
          await pushResult({
            id,
            algorithm,
            testCase,
            referenceUrl,
            status: 'fail',
            details: `${m} · ${srcTag(f._provenance)}`,
            caseMeta: { ...meta, observed: m },
          })
          addLog(`[DISCREPANCY] [${eName}] [id:${id}] ${ps} ${testCase}: ${m}`)
        } finally {
          destroy(M, hSession, priv)
        }
      }
    }
  }

  // ── 2. Product-authored context boundaries (ML-DSA-44, NIST key material) ──
  const g44 = files[0].testGroups.find((g) => g.parameterSet === 'ML-DSA-44')
  const base = g44?.tests[0]
  if (g44 && base && !unsupportedReason(mechs, CKM_ML_DSA, 'CKM_ML_DSA')) {
    const ps = 'ML-DSA-44'
    const algorithm = `${ps} (${eName})`
    const msg = hexToBytes(base.message)
    const baseMeta = {
      upstreamOperation: 'sigGen' as const,
      parameterSet: ps,
      mode: 'pure' as const,
      messageBytes: msg.length,
      tgId: g44.tgId,
      tcId: base.tcId,
      source: srcOf(PROV),
    }
    let priv = 0
    let pub = 0
    try {
      const imp = importMldsaPrivate(M, hSession, ps, hexToBytes(base.sk))
      if (imp.rv !== CKR_OK) throw new Error(`C_CreateObject(ML-DSA sk) → ${rvName(imp.rv)}`)
      priv = imp.handle
      if (!base.pk) throw new Error('mldsa_siggen_ctxmsg_test.json carries no pk for this case')
      pub = hsm_importMLDSAPublicKey(M, hSession, variantOf(ps), hexToBytes(base.pk))

      // 2a. 1-byte context: sign deterministically, verify with/without it.
      {
        const id = `mldsa-depth-probe-ctx1-${eName}`
        const testCase =
          'Context boundary · product-authored probe · 1-byte context (00): deterministic C_Sign, then C_Verify with ctx 1B (expect valid) and ctx 0B (expect invalid)'
        const ctx1 = new Uint8Array([0x00])
        const s = signRv(M, hSession, priv, CKM_ML_DSA, CKH_DETERMINISTIC_REQUIRED, msg, ctx1)
        let observed: string
        let ok = false
        if (!s.sig) {
          observed = `${s.step} → ${rvName(s.rv)}`
        } else {
          const withCtx = verifyRv(M, hSession, pub, CKM_ML_DSA, msg, s.sig, ctx1)
          const noCtx = verifyRv(M, hSession, pub, CKM_ML_DSA, msg, s.sig, new Uint8Array())
          ok = withCtx.rv === CKR_OK && noCtx.rv === CKR_SIGNATURE_INVALID
          observed = `verify ctx1 ${rvName(withCtx.rv)}; verify ctx0 ${rvName(noCtx.rv)}; ${sha256Tag(s.sig)}`
        }
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          status: ok ? 'pass' : 'fail',
          details:
            `${observed} · the sha256 fingerprint of the deterministic signature is recorded so C++ and Rust outputs can be compared (differential, not a NIST expected value)` +
            ` · key material from ${srcTag(PROV)} tc${base.tcId} · PQC Today-authored probe, not a NIST vector`,
          caseMeta: {
            ...baseMeta,
            origin: 'product-authored-probe',
            localOperation: 'sigGen-deterministic',
            contextBytes: 1,
            expected: 'valid',
            expectedReason: 'ctx-1',
            observed,
          },
        })
      }

      // 2b. 256-byte context: refused at C_SignInit and C_VerifyInit.
      for (const op of ['sign', 'verify'] as const) {
        const pin = MLDSA_CTX256_PINS[op]
        const id = `mldsa-depth-probe-ctx256-${op}-${eName}`
        const testCase = `Context boundary · product-authored probe · ${op === 'sign' ? 'C_SignInit' : 'C_VerifyInit'} with a 256-byte context (FIPS 204 max 255) · expect refusal`
        let observed: string
        let atInit = false
        if (op === 'sign') {
          const s = signRv(
            M,
            hSession,
            priv,
            CKM_ML_DSA,
            CKH_DETERMINISTIC_REQUIRED,
            msg,
            new Uint8Array(256)
          )
          observed = s.sig ? 'CKR_OK (signature produced)' : rvName(s.rv)
          atInit = !s.sig && s.step === 'C_SignInit'
        } else {
          const r = verifyRv(
            M,
            hSession,
            pub,
            CKM_ML_DSA,
            msg,
            hexToBytes(base.signature),
            new Uint8Array(256)
          )
          observed = rvName(r.initRv !== CKR_OK ? r.initRv : r.rv)
          atInit = r.initRv !== CKR_OK
        }
        const v = pinnedVerdict(pin, eName, observed)
        const ok = v.ok && atInit
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          status: ok ? 'pass' : 'fail',
          details: `${v.details}${atInit ? '' : ' · NOT refused at the init call'} · PQC Today-authored probe, not a NIST vector`,
          caseMeta: {
            ...baseMeta,
            origin: 'product-authored-probe',
            localOperation: op === 'sign' ? 'sigGen-deterministic' : 'sigVer',
            contextBytes: 256,
            expected: 'return-code',
            expectedReason: `ctx-256-${op}`,
            expectedRv: eName === 'C++' ? pin.cpp : eName === 'Rust' ? pin.rust : undefined,
            observed,
          },
        })
      }
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : String(err)
      await pushResult({
        id: `mldsa-depth-probe-err-${eName}`,
        algorithm,
        testCase: 'ML-DSA context boundary probes',
        referenceUrl,
        status: 'fail',
        details: m,
      })
    } finally {
      destroy(M, hSession, priv)
      destroy(M, hSession, pub)
    }
  }

  // ── 3. Honest skip: the upstream's only 1-byte-context case ───────────
  await pushResult({
    id: `mldsa-depth-skip-ctx1-nist-${eName}`,
    algorithm: `ML-DSA-65 (${eName})`,
    testCase:
      'SigGen · NIST 1-byte-context case · sigGen tg16/tc239 (hedged, HashML-DSA/SHA2-512/256)',
    referenceUrl,
    status: 'skip',
    details:
      'Skipped — the pinned ML-DSA-sigGen-FIPS204 sample has exactly one 1-byte-context case and it is hedged ' +
      '(rnd cannot be injected through CK_SIGN_ADDITIONAL_CONTEXT) and uses SHA2-512/256 (no PKCS#11 v3.2 ' +
      'CKM_HASH_ML_DSA_<hash> mechanism); the 1-byte boundary is covered by the product-authored ctx1 probe instead' +
      ` · ${srcTag(PROV)}`,
    caseMeta: {
      origin: 'not-executed',
      upstreamOperation: 'sigGen',
      localOperation: 'none',
      parameterSet: 'ML-DSA-65',
      mode: 'preHash',
      hashAlg: 'SHA2-512/256',
      contextBytes: 1,
      expected: 'not-run',
      tgId: 16,
      tcId: 239,
      source: srcOf(PROV),
    },
  })
}
