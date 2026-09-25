// SPDX-License-Identifier: GPL-3.0-only
//
// SLH-DSA key-generation, sign-positive, negative and boundary depth
// (gap-closure plan 2026-09-25, P5 item 3). Section 9c (slhdsaAcvp.ts) left the
// key-generation cells with round-trip evidence only, 10 of 12 deterministic
// sign cells with ONE NIST case, and no negative case on any sign cell. Rows,
// per engine:
//
//  1. KeyGen from seed — NIST SLH-DSA-keyGen-FIPS205 (two cases per parameter
//     set): CKA_SEED = SK.seed ‖ SK.prf ‖ PK.seed in the private template;
//     public and private CKA_VALUE byte-compared to pk and sk.
//  2. Deterministic SigGen, empty context — NIST sigGen, byte-match. With the
//     255-byte-context case of section 9c each set has both context extremes.
//  3. The six "f" parameter sets only (signing an "s" set costs 1.4–11 s per
//     signature in these engines; the runtime budget is recorded in the skip row):
//     a. deterministic sign negatives — a one-bit message mutation and a
//        one-bit context mutation of the NIST 255-byte-context case must give a
//        signature that differs from the NIST one and does not verify for the
//        original input (product-authored);
//     b. hedged sign (CKH_HEDGE_REQUIRED) at a 0-byte and the NIST 255-byte
//        context, verified by the engine (round-trip) and, in its own row, by
//        @noble/post-quantum slh_dsa verify (independent oracle — agreement,
//        not a NIST expected value);
//     c. hedged negatives — each hedged signature must not verify for a
//        mutated message (ctx 0) or a mutated context (ctx 255).
import { hexToBytes } from '@/utils/dataInputUtils'
import { rvName, hsm_importSLHDSAPublicKey, hsm_extractKeyValue, CKA_SEED } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_SIGN,
  CKA_VERIFY,
  CKA_VALUE,
  CKA_PARAMETER_SET,
  CKO_PRIVATE_KEY,
  CKO_PUBLIC_KEY,
  CKK_SLH_DSA,
  CKM_SLH_DSA,
  CKM_SLH_DSA_KEY_PAIR_GEN,
  CKH_DETERMINISTIC_REQUIRED,
  CKH_HEDGE_REQUIRED,
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
import { createObjectRv, generateKeyPairRv, sha256Tag, signRv } from './pkcs11Raw'

/** Parameter set → CKP_ value, built at call time (build TLA check). */
const slhCkp = (ps: string): number | undefined =>
  new Map<string, number>([
    ['SLH-DSA-SHA2-128s', CKP_SLH_DSA_SHA2_128S],
    ['SLH-DSA-SHA2-128f', CKP_SLH_DSA_SHA2_128F],
    ['SLH-DSA-SHA2-192s', CKP_SLH_DSA_SHA2_192S],
    ['SLH-DSA-SHA2-192f', CKP_SLH_DSA_SHA2_192F],
    ['SLH-DSA-SHA2-256s', CKP_SLH_DSA_SHA2_256S],
    ['SLH-DSA-SHA2-256f', CKP_SLH_DSA_SHA2_256F],
    ['SLH-DSA-SHAKE-128s', CKP_SLH_DSA_SHAKE_128S],
    ['SLH-DSA-SHAKE-128f', CKP_SLH_DSA_SHAKE_128F],
    ['SLH-DSA-SHAKE-192s', CKP_SLH_DSA_SHAKE_192S],
    ['SLH-DSA-SHAKE-192f', CKP_SLH_DSA_SHAKE_192F],
    ['SLH-DSA-SHAKE-256s', CKP_SLH_DSA_SHAKE_256S],
    ['SLH-DSA-SHAKE-256f', CKP_SLH_DSA_SHAKE_256F],
  ]).get(ps)

/** The six fast ("f") parameter sets the product-authored rows run on. */
export const SLH_F_SETS = [
  'SLH-DSA-SHA2-128f',
  'SLH-DSA-SHA2-192f',
  'SLH-DSA-SHA2-256f',
  'SLH-DSA-SHAKE-128f',
  'SLH-DSA-SHAKE-192f',
  'SLH-DSA-SHAKE-256f',
] as const
const SLH_S_SETS = [
  'SLH-DSA-SHA2-128s',
  'SLH-DSA-SHA2-192s',
  'SLH-DSA-SHA2-256s',
  'SLH-DSA-SHAKE-128s',
  'SLH-DSA-SHAKE-192s',
  'SLH-DSA-SHAKE-256s',
]

/** The oracle identity every oracle row names. */
export const SLH_ORACLE = '@noble/post-quantum 0.7.1 slh_dsa verify (FIPS 205 Algorithm 24)'

const nobleFor = async (ps: string) => {
  const m = await import('@noble/post-quantum/slh-dsa.js')
  const key = `slh_dsa_${ps.slice('SLH-DSA-'.length).toLowerCase().replace(/-/g, '_')}`
  return (m as unknown as Record<string, { verify: typeof m.slh_dsa_sha2_128f.verify }>)[key] // eslint-disable-line security/detect-object-injection
}

const flip = (b: Uint8Array, first = false): Uint8Array => {
  const out = b.slice()
  if (out.length > 0) out[first ? 0 : out.length - 1] ^= 0x01
  return out
}

interface KeyGenCase {
  tcId: number
  skSeed: string
  skPrf: string
  pkSeed: string
  sk: string
  pk: string
}
interface SigGenCase {
  tcId: number
  sk: string
  pk: string
  message: string
  context?: string
  signature: string
}
interface Group<T> {
  tgId: number
  parameterSet: string
  tests: T[]
}
interface VectorFile<T> {
  _provenance: Provenance
  testGroups: Group<T>[]
}
interface CtxEntry {
  comment: string
  parameterSet: string
  tcId: number
  sk: string
  pk: string
  message: string
  context: string
  signature: string
}

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
      { type: CKA_PARAMETER_SET, ulongVal: slhCkp(ps)! },
    ],
    [{ type: CKA_VALUE, bytes: sk }]
  )
}

/** Run the SLH-DSA coverage rows for ONE engine. */
export async function runSlhdsaCoverageSection(ctx: MldsaAcvpSectionCtx): Promise<void> {
  const { M, hSession, eName, mechs, referenceUrl, pushResult, addLog } = ctx
  const [kgMod, c0Mod, ctxMod] = await Promise.all([
    import('@/data/acvp/slhdsa_keygen_test.json'),
    import('@/data/acvp/slhdsa_siggen_ctx0_test.json'),
    import('@/data/acvp/slhdsa_ctx_test.json'),
  ])
  const kg = kgMod.default as unknown as VectorFile<KeyGenCase>
  const c0 = c0Mod.default as unknown as VectorFile<SigGenCase>
  const ctxFile = ctxMod.default as unknown as {
    _provenance: { source_release: string; source_sha256: string; producer?: string }
    sigGen: Record<string, CtxEntry>
  }
  const KG = kg._provenance
  const C0 = c0._provenance
  const CTX: Provenance = {
    producer: ctxFile._provenance.producer,
    source_repo: 'https://github.com/usnistgov/ACVP-Server',
    source_commit: ctxFile._provenance.source_release,
    source_path: 'gen-val/json-files/SLH-DSA-sigGen-FIPS205/internalProjection.json',
    source_sha256: ctxFile._provenance.source_sha256,
  }

  const push = async (
    id: string,
    algorithm: string,
    testCase: string,
    ok: boolean,
    details: string,
    caseMeta: AcvpCaseMeta
  ) => {
    await pushResult({
      id,
      algorithm,
      testCase,
      referenceUrl,
      status: ok ? 'pass' : 'fail',
      details,
      caseMeta,
    })
    addLog(`[${eName}] [id:${id}] ${algorithm} ${testCase}: ${ok ? 'PASS' : 'FAIL'}`)
  }
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
  const errText = (err: unknown) => (err instanceof Error ? err.message : String(err))

  // ── 1. KeyGen from seed ────────────────────────────────────────────────
  const kgWhy = unsupportedReason(mechs, CKM_SLH_DSA_KEY_PAIR_GEN, 'CKM_SLH_DSA_KEY_PAIR_GEN')
  for (const g of kg.testGroups) {
    const ps = g.parameterSet
    const algorithm = `${ps} (${eName})`
    for (const t of g.tests) {
      const id = `slhdsa-keygen-seed-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const testCase = `KeyGen from seed (CKA_SEED SK.seed‖SK.prf‖PK.seed) · NIST keyGen tg${g.tgId}/tc${t.tcId} · pk+sk byte-match`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'keyGen',
        localOperation: 'keyGen-from-seed',
        parameterSet: ps,
        expected: 'byte-match',
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(KG),
      }
      if (kgWhy) {
        await pushSkip(id, algorithm, testCase, meta, kgWhy)
        continue
      }
      let pair = { rv: 0, pub: 0, priv: 0 }
      try {
        pair = generateKeyPairRv(
          M,
          hSession,
          CKM_SLH_DSA_KEY_PAIR_GEN,
          {
            defs: [
              { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
              { type: CKA_KEY_TYPE, ulongVal: CKK_SLH_DSA },
              { type: CKA_TOKEN, boolVal: false },
              { type: CKA_VERIFY, boolVal: true },
              { type: CKA_PARAMETER_SET, ulongVal: slhCkp(ps)! },
            ],
            bytes: [],
          },
          {
            defs: [
              { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
              { type: CKA_KEY_TYPE, ulongVal: CKK_SLH_DSA },
              { type: CKA_TOKEN, boolVal: false },
              { type: CKA_PRIVATE, boolVal: true },
              // Test-only: public NIST sample key material, extracted to compare with sk.
              { type: CKA_SENSITIVE, boolVal: false },
              { type: CKA_EXTRACTABLE, boolVal: true },
              { type: CKA_SIGN, boolVal: true },
            ],
            bytes: [{ type: CKA_SEED, bytes: hexToBytes(t.skSeed + t.skPrf + t.pkSeed) }],
          }
        )
        if (pair.rv !== CKR_OK) throw new Error(`C_GenerateKeyPair(CKA_SEED) → ${rvName(pair.rv)}`)
        const pk = new Uint8Array(hsm_extractKeyValue(M, hSession, pair.pub))
        const sk = new Uint8Array(hsm_extractKeyValue(M, hSession, pair.priv))
        const pkDiff = firstDiff(pk, hexToBytes(t.pk))
        const skDiff = firstDiff(sk, hexToBytes(t.sk))
        const ok = pkDiff === 'identical' && skDiff === 'identical'
        const observed = ok ? 'byte-equal' : `pk: ${pkDiff}; sk: ${skDiff}`
        await push(
          id,
          algorithm,
          testCase,
          ok,
          (ok
            ? `pk[${pk.length}B] and sk[${sk.length}B] byte-equal to NIST expected`
            : `mismatch — ${observed}`) +
            ' · seed supplied in the private-key template (§6.69.4 lists CKA_SEED as mechanism-contributed; accepting it as input is engine behaviour)' +
            ` · ${srcTag(KG)}`,
          { ...meta, observed }
        )
      } catch (err: unknown) {
        await push(id, algorithm, testCase, false, `${errText(err)} · ${srcTag(KG)}`, {
          ...meta,
          observed: errText(err),
        })
      } finally {
        destroy(M, hSession, pair.pub)
        destroy(M, hSession, pair.priv)
      }
    }
  }

  // ── 2. Deterministic SigGen, empty context ─────────────────────────────
  const signWhy = unsupportedReason(mechs, CKM_SLH_DSA, 'CKM_SLH_DSA')
  for (const g of c0.testGroups) {
    const ps = g.parameterSet
    const algorithm = `${ps} (${eName})`
    for (const t of g.tests) {
      const id = `slhdsa-siggen-ctx0-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const testCase = `SigGen deterministic · NIST sigGen tg${g.tgId}/tc${t.tcId} · pure · ctx 0B · msg ${nBytes(t.message)}B · byte-match`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: 'sigGen',
        localOperation: 'sigGen-deterministic',
        parameterSet: ps,
        mode: 'pure',
        hashAlg: 'none',
        contextBytes: nBytes(t.context),
        messageBytes: nBytes(t.message),
        expected: 'byte-match',
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(C0),
      }
      if (signWhy) {
        await pushSkip(id, algorithm, testCase, meta, signWhy)
        continue
      }
      let priv = 0
      try {
        const imp = importSlhPrivate(M, hSession, ps, hexToBytes(t.sk))
        if (imp.rv !== CKR_OK) throw new Error(`C_CreateObject(SLH-DSA sk) → ${rvName(imp.rv)}`)
        priv = imp.handle
        const s = signRv(
          M,
          hSession,
          priv,
          CKM_SLH_DSA,
          CKH_DETERMINISTIC_REQUIRED,
          hexToBytes(t.message),
          hexToBytes(t.context ?? '')
        )
        if (!s.sig) throw new Error(`${s.step} → ${rvName(s.rv)}`)
        const diff = firstDiff(s.sig, hexToBytes(t.signature))
        const ok = diff === 'identical'
        await push(
          id,
          algorithm,
          testCase,
          ok,
          (ok
            ? `sig[${s.sig.length}B] byte-equal to NIST expected (CKH_DETERMINISTIC_REQUIRED, sk via C_CreateObject)`
            : `signature mismatch: ${diff}`) + ` · ${srcTag(C0)}`,
          { ...meta, observed: ok ? 'byte-equal' : diff }
        )
      } catch (err: unknown) {
        await push(id, algorithm, testCase, false, `${errText(err)} · ${srcTag(C0)}`, {
          ...meta,
          observed: errText(err),
        })
      } finally {
        destroy(M, hSession, priv)
      }
    }
  }

  // ── 3. Product-authored sign negatives and hedged boundaries ("f" sets) ──
  for (const ps of SLH_F_SETS) {
    const base = ctxFile.sigGen[ps] // eslint-disable-line security/detect-object-injection
    if (!base) continue
    const algorithm = `${ps} (${eName})`
    const tg = Number(/tgId=(\d+)/.exec(base.comment)?.[1] ?? NaN)
    const keyNote = `key material from ${srcTag(CTX)} tg${tg}/tc${base.tcId}`
    const msg = hexToBytes(base.message)
    const nistCtx = hexToBytes(base.context)
    const nistSig = hexToBytes(base.signature)
    const baseMeta = {
      upstreamOperation: 'sigGen' as const,
      parameterSet: ps,
      mode: 'pure' as const,
      tgId: tg,
      tcId: base.tcId,
      source: srcOf(CTX),
    }
    if (signWhy) {
      await pushSkip(
        `slhdsa-cov-skip-${ps}-${eName}`,
        algorithm,
        'Sign negatives and hedged context boundaries',
        { ...baseMeta, origin: 'not-executed', localOperation: 'none', expected: 'not-run' },
        signWhy
      )
      continue
    }
    let priv = 0
    let pub = 0
    try {
      const imp = importSlhPrivate(M, hSession, ps, hexToBytes(base.sk))
      if (imp.rv !== CKR_OK) throw new Error(`C_CreateObject(SLH-DSA sk) → ${rvName(imp.rv)}`)
      priv = imp.handle
      pub = hsm_importSLHDSAPublicKey(M, hSession, slhCkp(ps)!, hexToBytes(base.pk))
    } catch (err: unknown) {
      await push(
        `slhdsa-cov-err-${ps}-${eName}`,
        algorithm,
        'Sign negatives and hedged context boundaries — key import',
        false,
        `${errText(err)} · ${keyNote}`,
        {
          ...baseMeta,
          origin: 'product-authored-probe',
          localOperation: 'key-import',
          expected: 'valid',
          observed: errText(err),
        }
      )
      destroy(M, hSession, priv)
      continue
    }
    try {
      // 3a. Deterministic sign negatives.
      for (const c of [
        {
          key: 'msgflip',
          label: 'message with its last bit flipped, NIST 255-byte context',
          data: flip(msg),
          context: nistCtx,
        },
        {
          key: 'ctxflip',
          label: 'original message, NIST 255-byte context with byte 0 flipped',
          data: msg,
          context: flip(nistCtx, true),
        },
      ]) {
        const id = `slhdsa-cov-det-${c.key}-${ps}-${eName}`
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
            CKM_SLH_DSA,
            CKH_DETERMINISTIC_REQUIRED,
            c.data,
            c.context
          )
          if (!s.sig) throw new Error(`${s.step} → ${rvName(s.rv)}`)
          const differs = firstDiff(s.sig, nistSig) !== 'identical'
          const v = verifyRv(M, hSession, pub, CKM_SLH_DSA, msg, s.sig, nistCtx)
          const ok = differs && v.initRv === CKR_OK && v.rv === CKR_SIGNATURE_INVALID
          const observed = `signature ${differs ? 'differs from' : 'EQUALS'} the NIST expected one; C_Verify(original message, NIST context) → ${rvName(v.initRv !== CKR_OK ? v.initRv : v.rv)}`
          await push(
            id,
            algorithm,
            testCase,
            ok,
            `${observed} · ${keyNote} · PQC Today-authored mutation, not a NIST vector`,
            { ...meta, observed }
          )
        } catch (err: unknown) {
          await push(id, algorithm, testCase, false, `${errText(err)} · ${keyNote}`, {
            ...meta,
            observed: errText(err),
          })
        }
      }

      // 3b/3c. Hedged sign at the context extremes, oracle check, negatives.
      const noble = await nobleFor(ps)
      const pk = hexToBytes(base.pk)
      for (const ext of [
        { key: 'ctx0', context: new Uint8Array(), label: '0-byte context' },
        { key: 'ctx255', context: nistCtx, label: 'NIST 255-byte context' },
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
        const rtId = `slhdsa-cov-hedged-${ext.key}-rt-${ps}-${eName}`
        const orId = `slhdsa-cov-hedged-${ext.key}-oracle-${ps}-${eName}`
        const negId = `slhdsa-cov-hedged-${ext.key}-neg-${ps}-${eName}`
        const tcBase = `Hedged sign (CKH_HEDGE_REQUIRED) · ${ext.label}`
        const s = signRv(M, hSession, priv, CKM_SLH_DSA, CKH_HEDGE_REQUIRED, msg, ext.context)
        if (!s.sig) {
          const m = `${s.step} → ${rvName(s.rv)}`
          for (const id of [rtId, orId, negId])
            await push(id, algorithm, tcBase, false, `${m} · ${keyNote}`, { ...meta, observed: m })
          continue
        }
        const sig = s.sig
        {
          const v = verifyRv(M, hSession, pub, CKM_SLH_DSA, msg, sig, ext.context)
          const ok = v.initRv === CKR_OK && v.rv === CKR_OK
          const observed = `C_Verify → ${rvName(v.initRv !== CKR_OK ? v.initRv : v.rv)}; ${sha256Tag(sig)}`
          await push(
            rtId,
            algorithm,
            `${tcBase} · verified by the same engine with the NIST public key (round-trip)`,
            ok,
            `${observed} · functional round-trip: no external expected value · ${keyNote}`,
            { ...meta, observed }
          )
        }
        {
          let ok = false
          let observed: string
          try {
            ok = noble.verify(sig, msg, pk, { context: ext.context })
            observed = `${SLH_ORACLE} → ${ok ? 'valid' : 'INVALID'}`
          } catch (err: unknown) {
            observed = `oracle threw: ${errText(err)}`
          }
          await push(
            orId,
            algorithm,
            `${tcBase} · engine signature verified by an independent implementation`,
            ok,
            `${observed} · agreement with that oracle for this case, not a NIST expected value; the signing randomness is not checked · ${keyNote}`,
            { ...meta, observed }
          )
        }
        {
          const mutMsg = ext.key === 'ctx0' ? flip(msg) : msg
          const mutCtx = ext.key === 'ctx0' ? ext.context : flip(ext.context, true)
          const v = verifyRv(M, hSession, pub, CKM_SLH_DSA, mutMsg, sig, mutCtx)
          const ok = v.initRv === CKR_OK && v.rv === CKR_SIGNATURE_INVALID
          const what = ext.key === 'ctx0' ? 'message last bit flipped' : 'context byte 0 flipped'
          const observed = `C_Verify(${what}) → ${rvName(v.initRv !== CKR_OK ? v.initRv : v.rv)}`
          await push(
            negId,
            algorithm,
            `Hedged sign · product-authored negative · the ${ext.label} hedged signature verified with the ${what} · expect CKR_SIGNATURE_INVALID`,
            ok,
            `${observed} · ${keyNote} · PQC Today-authored mutation, not a NIST vector`,
            {
              ...meta,
              origin: 'product-authored-mutation',
              expected: 'invalid',
              expectedReason: `hedged-${ext.key}-${ext.key === 'ctx0' ? 'msgflip' : 'ctxflip'}`,
              expectedRv: 'CKR_SIGNATURE_INVALID',
              observed,
            }
          )
        }
      }
    } finally {
      destroy(M, hSession, priv)
      destroy(M, hSession, pub)
    }
  }

  // ── 4. Honest skip: the "s" sets' product-authored rows ─────────────────
  await pushResult({
    id: `slhdsa-cov-skip-s-sets-${eName}`,
    algorithm: `SLH-DSA "s" parameter sets (${eName})`,
    testCase:
      'Deterministic sign negatives and hedged context boundaries · SHA2/SHAKE-128s/192s/256s',
    referenceUrl,
    status: 'skip',
    details:
      'Skipped — runtime budget: one SLH-DSA "s" signature costs 1.4–3.1 s on the C++ engine and 2.6–11 s on the Rust engine ' +
      '(measured 2026-09-25, WebAssembly in Node.js), and these rows need four extra signatures per set. The "s" sets keep ' +
      'their NIST deterministic byte-matches at context 0 and 255 bytes and the round-trip of section 9; their sign cells ' +
      `stay without a negative case (${SLH_S_SETS.join(', ')}).`,
    caseMeta: {
      origin: 'not-executed',
      upstreamOperation: 'sigGen',
      localOperation: 'none',
      parameterSet: SLH_S_SETS.join('/'),
      expected: 'not-run',
      source: srcOf(CTX),
    },
  })
}
