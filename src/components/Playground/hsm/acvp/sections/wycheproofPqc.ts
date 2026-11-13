// SPDX-License-Identifier: AGPL-3.0-only
//
// PROJECT WYCHEPROOF adversarial test vectors for ML-KEM (FIPS 203) and ML-DSA
// (FIPS 204), maintained by GOOGLE / C2SP. Source: https://github.com/C2SP/wycheproof
// (Apache-2.0, see src/data/acvp/WYCHEPROOF-LICENSE.txt). Pinned commit 3fa63dd0,
// the same pin as the classical files in sections/wycheproofNegative.ts.
//
// EVIDENCE CLASS — independent-oracle, NEVER published-standard-kat. The only
// claim a passing row supports is "agrees with Project Wycheproof 3fa63dd0 for
// this case". Every row's visible source tag comes from wycTag().
//
// FILES (all 21 upstream ML-KEM / ML-DSA files at the pin, per parameter set):
//   mlkem_<ps>_keygen_seed_test          seed d‖z → ek, dk                 keygen
//   mlkem_<ps>_test                      seed → keys, then c → K           decaps
//   mlkem_<ps>_semi_expanded_decaps_test expanded dk, c → K                decaps
//   mlkem_<ps>_encaps_test               ek must be refused (invalid only) encaps
//   mldsa_<ps>_verify_test               pk, msg, ctx, sig → accept/refuse verify
//   mldsa_<ps>_sign_noseed_test          sk, msg|mu, ctx → sig (rnd = 0)   sign
//   mldsa_<ps>_sign_seed_test            seed → keys, msg|mu, ctx → sig    sign
// Two declared exclusions, applied at vendoring and checked against the pinned
// upstream by scripts/acvp/vendor_wycheproof.py --check: valid encaps cases
// (PKCS#11 has no input for the encapsulation randomness m) and `Randomized`
// sign cases (no input for an explicit rnd). Each file's _provenance lists them.
//
// RESULT POLICY (as in wycheproofNegative.ts). No case here is `acceptable`.
//   valid    → every call must succeed and every upstream output byte-match.
//   invalid  → the engine must refuse the case, and only a refusal the check
//              names counts. These are the contract of the engines used here
//              (PKCS#11 itself does not require a key check at import):
//                - a key input is refused with CKR_ATTRIBUTE_VALUE_INVALID: a
//                  dk or ek that fails the FIPS 203 §7.2 / §7.3 check at import,
//                  or a CKA_SEED template of the wrong length (PKCS#11 §4.1.1);
//                - a ciphertext of the wrong length is refused by C_DecapsulateKey
//                  with CKR_WRAPPED_KEY_LEN_RANGE or CKR_WRAPPED_KEY_INVALID;
//                - an ML-DSA public or private key, or seed, is refused at
//                  C_CreateObject / C_GenerateKeyPair with CKR_ATTRIBUTE_VALUE_INVALID;
//                - a context longer than 255 bytes is refused by C_SignInit or
//                  C_VerifyInit with CKR_MECHANISM_PARAM_INVALID;
//                - a signature that must not verify is refused by C_Verify with
//                  CKR_SIGNATURE_INVALID or CKR_SIGNATURE_LEN_RANGE.
//              C_Sign has no refusal code here: a key that imports and then
//              fails to sign is an ERROR row.
//              A key that imports and then fails its operation is an ERROR row,
//              as in sections/mlkemAcvp.ts. Any other return value is an ERROR
//              row too: never a pass, and never "refused as expected". A key
//              the engine accepts is a discrepancy. The observed CK_RV is
//              recorded on every row.
//
// Details text never prints a shared secret, a private key or a signature: a
// mismatch is reported as a position (D1-4, as sections/mlkemAcvp.ts does).
import { hexToBytes } from '@/utils/dataInputUtils'
import {
  rvName,
  kemParamSet,
  dsaParamSet,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_ENCAPSULATE,
  CKA_DECAPSULATE,
  CKA_SIGN,
  CKA_VERIFY,
  CKA_VALUE,
  CKA_PARAMETER_SET,
  CKA_SEED,
  CKO_PUBLIC_KEY,
  CKO_PRIVATE_KEY,
  CKK_ML_KEM,
  CKK_ML_DSA,
  CKM_ML_KEM_KEY_PAIR_GEN,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  CKM_ML_KEM,
  CKM_ML_DSA,
  CKM_ML_DSA_EXTERNAL_MU,
  CKM_ML_DSA_KEY_PAIR_GEN,
} from '@/wasm/softhsm/constants'
import {
  CKR_OK,
  destroy,
  firstDiff,
  signDeterministic,
  srcOf,
  unsupportedReason,
  verifyRv,
  type AcvpCaseMeta,
  type MldsaAcvpSectionCtx,
} from './mldsaAcvp'
import {
  CT_LEN,
  decapsulateRv,
  encapsulateRv,
  importPrivate as importMlkemPrivate,
  importPublic as importMlkemPublic,
  readKeyCheck,
  type Variant,
} from './mlkemAcvp'
import { createObjectRv, generateKeyPairRv } from './pkcs11Raw'
import { runRow, skipRow, valueOf, type RowOutcome } from './classicalRaw'
import { expectedFor, flagsOf, wycTag, type WycFile, type WycResult } from './wycheproofNegative'

// ── Shared verdict helpers ─────────────────────────────────────────────────

/** A call on the path refused the case (non-OK CK_RV). */
function refused(result: WycResult, observed: string): RowOutcome {
  return result === 'valid'
    ? { ok: false, observed, details: `${observed} — REFUSED a case Wycheproof marks valid` }
    : { ok: true, observed, details: `refused (${observed}); upstream result=${result}` }
}

/**
 * The only refusal a key input (a dk or ek at import, or a CKA_SEED template) counts as:
 * CKR_ATTRIBUTE_VALUE_INVALID, the PKCS#11 v3.2 §4.1.1 code for an invalid attribute value.
 */
const KEY_INPUT_REFUSALS = ['CKR_ATTRIBUTE_VALUE_INVALID'] as const

/**
 * The ciphertext-specific codes C_DecapsulateKey may refuse a wrong-length ciphertext with.
 * Narrower than DECAP_LISTED on purpose: a handle or argument error is not a ciphertext refusal.
 */
const CIPHERTEXT_REFUSALS = ['CKR_WRAPPED_KEY_LEN_RANGE', 'CKR_WRAPPED_KEY_INVALID'] as const

/** The code C_SignInit / C_VerifyInit may refuse a context of more than 255 bytes with. */
const MECHANISM_PARAM_REFUSALS = ['CKR_MECHANISM_PARAM_INVALID'] as const

/** The codes C_Verify may refuse a signature that must not verify with. */
const SIGNATURE_REFUSALS = ['CKR_SIGNATURE_INVALID', 'CKR_SIGNATURE_LEN_RANGE'] as const

/** C_Sign: no refusal code. A key that imported and then fails to sign is an operational error. */
const SIGN_REFUSALS = [] as const

/**
 * An ML-KEM or ML-DSA step returned `rv` other than CKR_OK. It counts as the
 * refusal only when `listed` names that code for the step. Any other code is an
 * operational error (an ERROR row), never a refusal, so it can never pass an
 * invalid case.
 */
function refusedWith(
  result: WycResult,
  observed: string,
  rv: number,
  listed: readonly string[]
): RowOutcome {
  if (!listed.includes(rvName(rv)))
    return {
      ok: false,
      observed,
      details: `ERROR: ${observed} is not one of the refusal codes this step accepts, so it is an operational error, not a refusal`,
      error: true,
    }
  return refused(result, observed)
}

/** The engine completed the operation; `diffs` are the byte comparisons made. */
function completed(
  result: WycResult,
  observed: string,
  diffs: { what: string; diff: string }[],
  comment: string
): RowOutcome {
  if (result === 'invalid')
    return {
      ok: false,
      observed: `${observed} (accepted)`,
      details:
        `${observed} — ACCEPTED a case Wycheproof marks invalid (${comment}); the engine must refuse it` +
        (diffs.length ? ` · ${diffs.map((d) => `${d.what}: ${d.diff}`).join('; ')}` : ''),
    }
  const bad = diffs.filter((d) => d.diff !== 'identical')
  if (bad.length === 0)
    return {
      ok: true,
      observed: `${observed} · byte-equal`,
      details: `${observed} · ${diffs.map((d) => d.what).join(' + ')} byte-equal to the Wycheproof value; upstream result=${result}`,
    }
  const o = bad.map((d) => `${d.what} ${d.diff}`).join('; ')
  return {
    ok: false,
    observed: `${observed} · ${o}`,
    details: `mismatch — ${o} (values not shown)`,
  }
}

const nB = (hex: string | undefined) => (hex ? hex.length / 2 : 0)

// ── ML-KEM ─────────────────────────────────────────────────────────────────

interface KemGroup<T> {
  parameterSet: string
  tests: T[]
}
interface KemBase {
  tcId: number
  comment?: string
  flags?: string[]
  result: WycResult
}
interface KemKeyGenTest extends KemBase {
  seed: string
  ek: string
  dk: string
}
interface KemDecapsTest extends KemBase {
  seed: string
  ek?: string
  c: string
  K: string
}
interface KemSemiTest extends KemBase {
  dk: string
  c: string
  ek: string
  K?: string
}
interface KemEncapsTest extends KemBase {
  m: string
  ek: string
  c: string
  K: string
}

/** C_GenerateKeyPair(CKM_ML_KEM_KEY_PAIR_GEN) with CKA_SEED = d‖z (private template). */
function mlkemFromSeed(M: SoftHSMModule, h: number, v: Variant, seed: Uint8Array) {
  return generateKeyPairRv(
    M,
    h,
    CKM_ML_KEM_KEY_PAIR_GEN,
    {
      defs: [
        { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
        { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
        { type: CKA_TOKEN, boolVal: false },
        { type: CKA_ENCAPSULATE, boolVal: true },
        { type: CKA_PARAMETER_SET, ulongVal: kemParamSet(v) },
      ],
      bytes: [],
    },
    {
      defs: [
        { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
        { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
        { type: CKA_TOKEN, boolVal: false },
        { type: CKA_PRIVATE, boolVal: true },
        // Test-only: public Wycheproof key material, extracted to compare with dk.
        { type: CKA_SENSITIVE, boolVal: false },
        { type: CKA_EXTRACTABLE, boolVal: true },
        { type: CKA_DECAPSULATE, boolVal: true },
      ],
      bytes: [{ type: CKA_SEED, bytes: seed }],
    }
  )
}

/** Decapsulate `c` with `priv`, compare K. Destroys the derived secret. */
function decapsVerdict(
  M: SoftHSMModule,
  h: number,
  priv: number,
  t: { c: string; K?: string; result: WycResult; comment?: string; flags?: string[] },
  pre: { what: string; diff: string }[],
  preObserved: string,
  listed: readonly string[]
): RowOutcome {
  const r = decapsulateRv(M, h, priv, hexToBytes(t.c))
  try {
    const o = `${preObserved}C_DecapsulateKey → ${rvName(r.rv)}`
    if (r.rv !== CKR_OK) return refusedWith(t.result, o, r.rv, listed)
    const k = valueOf(M, h, r.handle)
    const diffs = [...pre]
    if (t.K) diffs.push({ what: `K[${k.length}B]`, diff: firstDiff(k, hexToBytes(t.K)) })
    return completed(t.result, o, diffs, t.comment || flagsOf(t))
  } finally {
    destroy(M, h, r.handle)
  }
}

const MLKEM_SETS: Variant[] = [512, 768, 1024]

export async function runWycheproofMlkemSection(ctx: MldsaAcvpSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const load = (ps: Variant) =>
    Promise.all([
      ps === 512
        ? import('@/data/acvp/wycheproof_mlkem_512_keygen_seed_test.json')
        : ps === 768
          ? import('@/data/acvp/wycheproof_mlkem_768_keygen_seed_test.json')
          : import('@/data/acvp/wycheproof_mlkem_1024_keygen_seed_test.json'),
      ps === 512
        ? import('@/data/acvp/wycheproof_mlkem_512_test.json')
        : ps === 768
          ? import('@/data/acvp/wycheproof_mlkem_768_test.json')
          : import('@/data/acvp/wycheproof_mlkem_1024_test.json'),
      ps === 512
        ? import('@/data/acvp/wycheproof_mlkem_512_semi_expanded_decaps_test.json')
        : ps === 768
          ? import('@/data/acvp/wycheproof_mlkem_768_semi_expanded_decaps_test.json')
          : import('@/data/acvp/wycheproof_mlkem_1024_semi_expanded_decaps_test.json'),
      ps === 512
        ? import('@/data/acvp/wycheproof_mlkem_512_encaps_test.json')
        : ps === 768
          ? import('@/data/acvp/wycheproof_mlkem_768_encaps_test.json')
          : import('@/data/acvp/wycheproof_mlkem_1024_encaps_test.json'),
    ])
  const whyKg = unsupportedReason(mechs, CKM_ML_KEM_KEY_PAIR_GEN, 'CKM_ML_KEM_KEY_PAIR_GEN')
  const whyKem = unsupportedReason(mechs, CKM_ML_KEM, 'CKM_ML_KEM')

  for (const v of MLKEM_SETS) {
    const ps = `ML-KEM-${v}`
    const [kgM, decM, semiM, encM] = await load(v)
    const files = {
      keygen: kgM.default as unknown as WycFile<KemGroup<KemKeyGenTest>>,
      decaps: decM.default as unknown as WycFile<KemGroup<KemDecapsTest>>,
      semidecaps: semiM.default as unknown as WycFile<KemGroup<KemSemiTest>>,
      encaps: encM.default as unknown as WycFile<KemGroup<KemEncapsTest>>,
    }
    const algorithm = `${ps} — Wycheproof (${eName})`
    const metaOf = (
      P: WycFile<unknown>['_provenance'],
      gi: number,
      t: KemBase,
      up: AcvpCaseMeta['upstreamOperation'],
      local: AcvpCaseMeta['localOperation'],
      extra: Record<string, string | number | boolean> = {}
    ): AcvpCaseMeta => ({
      origin: 'third-party-oracle',
      upstreamOperation: up,
      localOperation: local,
      parameterSet: ps,
      parameters: { wycheproofResult: t.result, flags: flagsOf(t), ...extra },
      expected: expectedFor(t.result),
      expectedReason: t.comment || flagsOf(t),
      tgId: gi + 1,
      tcId: t.tcId,
      source: srcOf(P),
    })
    const expectText = (t: KemBase, what: string, refuse: string) =>
      t.result === 'valid' ? what : refuse

    // 1. keygen from seed
    {
      const P = files.keygen._provenance
      for (let gi = 0; gi < files.keygen.testGroups.length; gi++) {
        // eslint-disable-next-line security/detect-object-injection
        for (const t of files.keygen.testGroups[gi].tests) {
          const id = `wyc-mlkem${v}keygen-tg${gi + 1}-tc${t.tcId}-${eName}`
          const testCase =
            `KeyGen from seed (CKA_SEED d‖z) · Wycheproof mlkem_${v}_keygen_seed_test tg${gi + 1}/tc${t.tcId} · ` +
            `${t.comment || 'no comment'} · expect ${expectText(t, 'ek + dk byte-match', 'refused at C_GenerateKeyPair with CKR_ATTRIBUTE_VALUE_INVALID')}`
          const meta = metaOf(P, gi, t, 'keyGen', 'keyGen-from-seed')
          if (whyKg) {
            await skipRow(ctx, { id, algorithm, testCase, meta, why: whyKg })
            continue
          }
          await runRow(ctx, {
            id,
            algorithm,
            testCase,
            meta,
            source: wycTag(P),
            exec: () => {
              const pair = mlkemFromSeed(M, h, v, hexToBytes(t.seed))
              try {
                const o = `C_GenerateKeyPair(CKA_SEED) → ${rvName(pair.rv)}`
                if (pair.rv !== CKR_OK) return refusedWith(t.result, o, pair.rv, KEY_INPUT_REFUSALS)
                const ek = valueOf(M, h, pair.pub)
                const dk = valueOf(M, h, pair.priv)
                return completed(
                  t.result,
                  o,
                  [
                    { what: `ek[${ek.length}B]`, diff: firstDiff(ek, hexToBytes(t.ek)) },
                    { what: `dk[${dk.length}B]`, diff: firstDiff(dk, hexToBytes(t.dk)) },
                  ],
                  t.comment || flagsOf(t)
                )
              } finally {
                destroy(M, h, pair.pub)
                destroy(M, h, pair.priv)
              }
            },
          })
        }
      }
    }

    // 2. seed → keys → decapsulate (mlkem_<ps>_test)
    {
      const P = files.decaps._provenance
      for (let gi = 0; gi < files.decaps.testGroups.length; gi++) {
        // eslint-disable-next-line security/detect-object-injection
        for (const t of files.decaps.testGroups[gi].tests) {
          const id = `wyc-mlkem${v}decaps-tg${gi + 1}-tc${t.tcId}-${eName}`
          const testCase =
            `Decapsulate (key from CKA_SEED) · Wycheproof mlkem_${v}_test tg${gi + 1}/tc${t.tcId} · ` +
            `c ${nB(t.c)}B (${CT_LEN[v]}B expected) · flags ${flagsOf(t)} · ${t.comment || 'no comment'} · expect ` +
            ((t.seed?.length ?? 0) !== 128
              ? 'refused at C_GenerateKeyPair with CKR_ATTRIBUTE_VALUE_INVALID (wrong seed length)'
              : expectText(
                  t,
                  `K byte-match${t.ek ? ' (and ek)' : ''}`,
                  'refused by C_DecapsulateKey with a ciphertext-specific code (wrong ciphertext length)'
                ))
          const meta = metaOf(P, gi, t, 'decapsulation', 'decapsulation', {
            ciphertextBytes: nB(t.c),
          })
          const why = whyKg ?? whyKem
          if (why) {
            await skipRow(ctx, { id, algorithm, testCase, meta, why })
            continue
          }
          await runRow(ctx, {
            id,
            algorithm,
            testCase,
            meta,
            source: wycTag(P),
            exec: () => {
              const pair = mlkemFromSeed(M, h, v, hexToBytes(t.seed))
              try {
                if (pair.rv !== CKR_OK)
                  return refusedWith(
                    t.result,
                    `C_GenerateKeyPair(CKA_SEED) → ${rvName(pair.rv)}`,
                    pair.rv,
                    KEY_INPUT_REFUSALS
                  )
                const pre = t.ek
                  ? [
                      {
                        what: 'ek',
                        diff: firstDiff(valueOf(M, h, pair.pub), hexToBytes(t.ek)),
                      },
                    ]
                  : []
                return decapsVerdict(
                  M,
                  h,
                  pair.priv,
                  t,
                  pre,
                  'C_GenerateKeyPair(CKA_SEED) → CKR_OK; ',
                  CIPHERTEXT_REFUSALS
                )
              } finally {
                destroy(M, h, pair.pub)
                destroy(M, h, pair.priv)
              }
            },
          })
        }
      }
    }

    // 3. expanded dk → decapsulate
    {
      const P = files.semidecaps._provenance
      for (let gi = 0; gi < files.semidecaps.testGroups.length; gi++) {
        // eslint-disable-next-line security/detect-object-injection
        for (const t of files.semidecaps.testGroups[gi].tests) {
          const id = `wyc-mlkem${v}semidecaps-tg${gi + 1}-tc${t.tcId}-${eName}`
          const testCase =
            `Decapsulate (dk via C_CreateObject) · Wycheproof mlkem_${v}_semi_expanded_decaps_test tg${gi + 1}/tc${t.tcId} · ` +
            `dk ${nB(t.dk)}B · c ${nB(t.c)}B · flags ${flagsOf(t)} · ${t.comment || 'no comment'} · expect ` +
            ((t.flags ?? []).includes('IncorrectCiphertextLength')
              ? 'refused by C_DecapsulateKey with a ciphertext-specific code (wrong ciphertext length)'
              : expectText(
                  t,
                  'K byte-match',
                  'refused at C_CreateObject with CKR_ATTRIBUTE_VALUE_INVALID'
                ))
          const meta = metaOf(P, gi, t, 'decapsulation', 'decapsulation', {
            decapsulationKeyBytes: nB(t.dk),
            ciphertextBytes: nB(t.c),
          })
          if (whyKem) {
            await skipRow(ctx, { id, algorithm, testCase, meta, why: whyKem })
            continue
          }
          await runRow(ctx, {
            id,
            algorithm,
            testCase,
            meta,
            source: wycTag(P),
            exec: () => {
              const imp = importMlkemPrivate(M, h, v, hexToBytes(t.dk))
              try {
                if ((t.flags ?? []).includes('IncorrectCiphertextLength')) {
                  // A valid key with a wrong-length ciphertext: the operation is the check.
                  if (imp.rv !== CKR_OK)
                    return refusedWith(
                      t.result,
                      `C_CreateObject(dk) → ${rvName(imp.rv)}`,
                      imp.rv,
                      KEY_INPUT_REFUSALS
                    )
                  return decapsVerdict(
                    M,
                    h,
                    imp.handle,
                    t,
                    [],
                    'C_CreateObject(dk) → CKR_OK; ',
                    CIPHERTEXT_REFUSALS
                  )
                }
                // A key-flagged case: the same rule as every ML-KEM key check (readKeyCheck,
                // sections/mlkemAcvp.ts). Only the import refusal counts; a failed operation is an error.
                let op = 0
                try {
                  const read = readKeyCheck(
                    imp,
                    'C_CreateObject(dk)',
                    () => decapsulateRv(M, h, imp.handle, hexToBytes(t.c)),
                    'C_DecapsulateKey'
                  )
                  op = read.handle
                  if (read.error)
                    return {
                      ok: false,
                      observed: read.observed,
                      details: `ERROR: ${read.error}`,
                      error: true,
                    }
                  if (!read.accepted) return refused(t.result, read.observed)
                  const k = valueOf(M, h, op)
                  const diffs = t.K
                    ? [{ what: `K[${k.length}B]`, diff: firstDiff(k, hexToBytes(t.K)) }]
                    : []
                  return completed(t.result, read.observed, diffs, t.comment || flagsOf(t))
                } finally {
                  destroy(M, h, op)
                }
              } finally {
                destroy(M, h, imp.handle)
              }
            },
          })
        }
      }
    }

    // 4. encapsulation-key rejection (invalid cases only — see _provenance.excluded_cases)
    {
      const P = files.encaps._provenance
      for (let gi = 0; gi < files.encaps.testGroups.length; gi++) {
        // eslint-disable-next-line security/detect-object-injection
        for (const t of files.encaps.testGroups[gi].tests) {
          const id = `wyc-mlkem${v}encaps-tg${gi + 1}-tc${t.tcId}-${eName}`
          const testCase =
            `Encapsulate (ek via C_CreateObject) · Wycheproof mlkem_${v}_encaps_test tg${gi + 1}/tc${t.tcId} · ` +
            `ek ${nB(t.ek)}B · flags ${flagsOf(t)} · ${t.comment || 'no comment'} · expect ` +
            'refused at C_CreateObject with CKR_ATTRIBUTE_VALUE_INVALID'
          const meta = metaOf(P, gi, t, 'encapsulation', 'encapsulation', {
            encapsulationKeyBytes: nB(t.ek),
          })
          if (whyKem) {
            await skipRow(ctx, { id, algorithm, testCase, meta, why: whyKem })
            continue
          }
          await runRow(ctx, {
            id,
            algorithm,
            testCase,
            meta,
            source: wycTag(P),
            exec: (): RowOutcome => {
              if (t.result !== 'invalid')
                // vendor_wycheproof.py keeps only invalid encaps cases; a valid
                // one here means the vendored file and its rule disagree.
                return {
                  ok: false,
                  observed: 'not executable',
                  details:
                    'a valid encapsulation case needs the upstream randomness m, which C_EncapsulateKey cannot take — it must not be in the vendored file',
                }
              const imp = importMlkemPublic(M, h, v, hexToBytes(t.ek))
              try {
                // Only CKR_ATTRIBUTE_VALUE_INVALID at import refuses the key; an
                // operation that fails after the import is an error (readKeyCheck).
                const read = readKeyCheck(
                  imp,
                  'C_CreateObject(ek)',
                  () => encapsulateRv(M, h, imp.handle, CT_LEN[v]),
                  'C_EncapsulateKey'
                )
                destroy(M, h, read.handle)
                if (read.error)
                  return {
                    ok: false,
                    observed: read.observed,
                    details: `ERROR: ${read.error}`,
                    error: true,
                  }
                if (!read.accepted) return refused(t.result, read.observed)
                return completed(t.result, read.observed, [], t.comment || flagsOf(t))
              } finally {
                destroy(M, h, imp.handle)
              }
            },
          })
        }
      }
    }
  }
}

// ── ML-DSA ─────────────────────────────────────────────────────────────────

interface DsaTest {
  tcId: number
  comment?: string
  flags?: string[]
  msg?: string
  mu?: string
  ctx?: string
  sig: string
  result: WycResult
}
interface DsaVerifyGroup {
  publicKey: string
  tests: DsaTest[]
}
interface DsaSignGroup {
  privateKey?: string
  privateSeed?: string
  /** null in the groups whose seed has the wrong length (no key exists). */
  publicKey: string | null
  tests: DsaTest[]
}

type DsaVariant = 44 | 65 | 87
const MLDSA_SETS: DsaVariant[] = [44, 65, 87]

function importMldsaPublic(M: SoftHSMModule, h: number, v: DsaVariant, pk: Uint8Array) {
  return createObjectRv(
    M,
    h,
    [
      { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
      { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_VERIFY, boolVal: true },
      { type: CKA_PARAMETER_SET, ulongVal: dsaParamSet(v) },
    ],
    [{ type: CKA_VALUE, bytes: pk }]
  )
}

function importMldsaPrivate(M: SoftHSMModule, h: number, v: DsaVariant, sk: Uint8Array) {
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
      { type: CKA_PARAMETER_SET, ulongVal: dsaParamSet(v) },
    ],
    [{ type: CKA_VALUE, bytes: sk }]
  )
}

/** CKA_SEED in the PRIVATE template (as sections/mldsaAcvp.ts generateFromSeed). */
function mldsaFromSeed(M: SoftHSMModule, h: number, v: DsaVariant, seed: Uint8Array) {
  return generateKeyPairRv(
    M,
    h,
    CKM_ML_DSA_KEY_PAIR_GEN,
    {
      defs: [
        { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
        { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
        { type: CKA_TOKEN, boolVal: false },
        { type: CKA_VERIFY, boolVal: true },
        { type: CKA_PARAMETER_SET, ulongVal: dsaParamSet(v) },
      ],
      bytes: [],
    },
    {
      defs: [
        { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
        { type: CKA_KEY_TYPE, ulongVal: CKK_ML_DSA },
        { type: CKA_TOKEN, boolVal: false },
        { type: CKA_PRIVATE, boolVal: true },
        { type: CKA_SENSITIVE, boolVal: true },
        { type: CKA_SIGN, boolVal: true },
      ],
      bytes: [{ type: CKA_SEED, bytes: seed }],
    }
  )
}

const isInternal = (t: DsaTest) => (t.flags ?? []).includes('Internal')

type DsaStep = 'import' | 'init' | 'verify' | 'sign'

/**
 * The codes that count as the refusal at `step` for this case. An invalid case
 * may be refused only at the step its flaw belongs to (from its Wycheproof
 * flags), so an unrelated refusal elsewhere (for example a mechanism-parameter
 * error at Init on a case whose flaw is the key) is an ERROR row, not a pass.
 * A valid case keeps every step's code, so a listed refusal of a valid case
 * reads as a wrong answer and anything else as an error.
 */
function dsaRefusals(t: DsaTest, step: DsaStep): readonly string[] {
  if (t.result === 'valid')
    return step === 'import'
      ? KEY_INPUT_REFUSALS
      : step === 'init'
        ? MECHANISM_PARAM_REFUSALS
        : step === 'verify'
          ? SIGNATURE_REFUSALS
          : SIGN_REFUSALS
  const flags = t.flags ?? []
  if (flags.includes('InvalidContext')) return step === 'init' ? MECHANISM_PARAM_REFUSALS : []
  const keyFlaw = [
    'IncorrectPublicKeyLength',
    'IncorrectPrivateKeyLength',
    'InvalidPrivateKey',
  ].some((f) => flags.includes(f))
  if (step === 'import') return keyFlaw ? KEY_INPUT_REFUSALS : []
  // A signature that must not verify (including one checked against a
  // wrong-length public key the engine imported) is refused by C_Verify.
  if (step === 'verify') return SIGNATURE_REFUSALS
  return SIGN_REFUSALS
}

/** Which refusal an invalid ML-DSA case expects, from its Wycheproof flags (as dsaRefusals). */
function dsaRefusalText(t: DsaTest, op: 'verify' | 'signnoseed' | 'signseed'): string {
  const flags = t.flags ?? []
  if (flags.includes('InvalidContext'))
    return `refused at ${op === 'verify' ? 'C_VerifyInit' : 'C_SignInit'} with CKR_MECHANISM_PARAM_INVALID (context over 255 bytes)`
  if (op === 'verify')
    return flags.includes('IncorrectPublicKeyLength')
      ? 'refused at C_CreateObject with CKR_ATTRIBUTE_VALUE_INVALID, or by C_Verify with CKR_SIGNATURE_INVALID or CKR_SIGNATURE_LEN_RANGE'
      : 'refused by C_Verify with CKR_SIGNATURE_INVALID or CKR_SIGNATURE_LEN_RANGE'
  return op === 'signnoseed'
    ? 'refused at C_CreateObject with CKR_ATTRIBUTE_VALUE_INVALID'
    : 'refused at C_GenerateKeyPair with CKR_ATTRIBUTE_VALUE_INVALID'
}

/** Deterministic sign with `priv`; `pre` carries earlier comparisons (seed file's pk). */
function signVerdict(
  M: SoftHSMModule,
  h: number,
  priv: number,
  t: DsaTest,
  pre: { what: string; diff: string }[],
  preObserved: string
): RowOutcome {
  const internal = isInternal(t)
  const mech = internal ? CKM_ML_DSA_EXTERNAL_MU : CKM_ML_DSA
  const data = hexToBytes(internal ? (t.mu ?? '') : (t.msg ?? ''))
  // External µ: context has no meaning once µ exists (it is inside µ), so the
  // parameter carries an empty context, as sections/mldsaAcvp.ts does.
  const context = internal ? new Uint8Array(0) : hexToBytes(t.ctx ?? '')
  const s = signDeterministic(M, h, priv, mech, data, context)
  const o = `${preObserved}${s.step} → ${rvName(s.rv)}`
  if (s.rv !== CKR_OK)
    return refusedWith(t.result, o, s.rv, dsaRefusals(t, s.step === 'C_SignInit' ? 'init' : 'sign'))
  if (!s.sig)
    return {
      ok: false,
      observed: o,
      details: `ERROR: ${o} but no signature was returned`,
      error: true,
    }
  return completed(
    t.result,
    o,
    [...pre, { what: `sig[${s.sig.length}B]`, diff: firstDiff(s.sig, hexToBytes(t.sig)) }],
    t.comment || flagsOf(t)
  )
}

export async function runWycheproofMldsaSection(ctx: MldsaAcvpSectionCtx): Promise<void> {
  const { M, hSession: h, eName, mechs } = ctx
  const load = (v: DsaVariant) =>
    Promise.all([
      v === 44
        ? import('@/data/acvp/wycheproof_mldsa_44_verify_test.json')
        : v === 65
          ? import('@/data/acvp/wycheproof_mldsa_65_verify_test.json')
          : import('@/data/acvp/wycheproof_mldsa_87_verify_test.json'),
      v === 44
        ? import('@/data/acvp/wycheproof_mldsa_44_sign_noseed_test.json')
        : v === 65
          ? import('@/data/acvp/wycheproof_mldsa_65_sign_noseed_test.json')
          : import('@/data/acvp/wycheproof_mldsa_87_sign_noseed_test.json'),
      v === 44
        ? import('@/data/acvp/wycheproof_mldsa_44_sign_seed_test.json')
        : v === 65
          ? import('@/data/acvp/wycheproof_mldsa_65_sign_seed_test.json')
          : import('@/data/acvp/wycheproof_mldsa_87_sign_seed_test.json'),
    ])
  const whyDsa = unsupportedReason(mechs, CKM_ML_DSA, 'CKM_ML_DSA')
  const whyKg = unsupportedReason(mechs, CKM_ML_DSA_KEY_PAIR_GEN, 'CKM_ML_DSA_KEY_PAIR_GEN')
  const whyMu = unsupportedReason(
    mechs,
    CKM_ML_DSA_EXTERNAL_MU,
    'CKM_ML_DSA_EXTERNAL_MU (PKCS#11 v3.3 working draft, approved codepoint; not in v3.2)'
  )

  for (const v of MLDSA_SETS) {
    const ps = `ML-DSA-${v}`
    const [verM, nsM, sdM] = await load(v)
    const verify = verM.default as unknown as WycFile<DsaVerifyGroup>
    const noseed = nsM.default as unknown as WycFile<DsaSignGroup>
    const seeded = sdM.default as unknown as WycFile<DsaSignGroup>
    const algorithm = `${ps} — Wycheproof (${eName})`
    const metaOf = (
      P: WycFile<unknown>['_provenance'],
      gi: number,
      t: DsaTest,
      up: AcvpCaseMeta['upstreamOperation'],
      local: AcvpCaseMeta['localOperation']
    ): AcvpCaseMeta => ({
      origin: 'third-party-oracle',
      upstreamOperation: up,
      localOperation: local,
      parameterSet: ps,
      mode: isInternal(t) ? 'externalMu' : 'pure',
      contextBytes: isInternal(t) ? undefined : nB(t.ctx),
      messageBytes: isInternal(t) ? nB(t.mu) : nB(t.msg),
      parameters: { wycheproofResult: t.result, flags: flagsOf(t) },
      expected: expectedFor(t.result),
      expectedReason: t.comment || flagsOf(t),
      tgId: gi + 1,
      tcId: t.tcId,
      source: srcOf(P),
    })
    const shape = (t: DsaTest) =>
      isInternal(t)
        ? `external µ (vendor 0x403c) · µ ${nB(t.mu)}B`
        : `pure · msg ${nB(t.msg)}B · ctx ${t.ctx === undefined ? 'none' : `${nB(t.ctx)}B`}`

    // 1. verify
    {
      const P = verify._provenance
      for (let gi = 0; gi < verify.testGroups.length; gi++) {
        // eslint-disable-next-line security/detect-object-injection
        const g = verify.testGroups[gi]
        for (const t of g.tests) {
          const id = `wyc-mldsa${v}verify-tg${gi + 1}-tc${t.tcId}-${eName}`
          const testCase =
            `Verify · Wycheproof mldsa_${v}_verify_test tg${gi + 1}/tc${t.tcId} · ${shape(t)} · ` +
            `pk ${nB(g.publicKey)}B · sig ${nB(t.sig)}B · flags ${flagsOf(t)} · ${t.comment || 'no comment'} · expect ` +
            (t.result === 'valid' ? 'CKR_OK' : dsaRefusalText(t, 'verify'))
          const meta = metaOf(P, gi, t, 'sigVer', 'sigVer')
          if (whyDsa) {
            await skipRow(ctx, { id, algorithm, testCase, meta, why: whyDsa })
            continue
          }
          await runRow(ctx, {
            id,
            algorithm,
            testCase,
            meta,
            source: wycTag(P),
            exec: () => {
              const pub = importMldsaPublic(M, h, v, hexToBytes(g.publicKey))
              try {
                if (pub.rv !== CKR_OK)
                  return refusedWith(
                    t.result,
                    `C_CreateObject(pk) → ${rvName(pub.rv)}`,
                    pub.rv,
                    dsaRefusals(t, 'import')
                  )
                const r = verifyRv(
                  M,
                  h,
                  pub.handle,
                  CKM_ML_DSA,
                  hexToBytes(t.msg ?? ''),
                  hexToBytes(t.sig),
                  t.ctx === undefined ? null : hexToBytes(t.ctx)
                )
                const o =
                  r.initRv !== CKR_OK
                    ? `C_VerifyInit → ${rvName(r.initRv)}`
                    : `C_Verify → ${rvName(r.rv)}`
                if (r.rv !== CKR_OK)
                  return refusedWith(
                    t.result,
                    o,
                    r.rv,
                    dsaRefusals(t, r.initRv !== CKR_OK ? 'init' : 'verify')
                  )
                return completed(t.result, o, [], t.comment || flagsOf(t))
              } finally {
                destroy(M, h, pub.handle)
              }
            },
          })
        }
      }
    }

    // 2. sign, expanded private key (noseed) and 3. sign, private seed (seed)
    for (const [kind, file] of [
      ['signnoseed', noseed],
      ['signseed', seeded],
    ] as const) {
      const P = file._provenance
      const upstreamName = `mldsa_${v}_${kind === 'signnoseed' ? 'sign_noseed' : 'sign_seed'}_test`
      for (let gi = 0; gi < file.testGroups.length; gi++) {
        // eslint-disable-next-line security/detect-object-injection
        const g = file.testGroups[gi]
        for (const t of g.tests) {
          const id = `wyc-mldsa${v}${kind}-tg${gi + 1}-tc${t.tcId}-${eName}`
          const keyText =
            kind === 'signnoseed'
              ? `sk ${nB(g.privateKey)}B via C_CreateObject`
              : `seed ${nB(g.privateSeed)}B via CKA_SEED`
          const testCase =
            `Sign deterministic · Wycheproof ${upstreamName} tg${gi + 1}/tc${t.tcId} · ${keyText} · ${shape(t)} · ` +
            `flags ${flagsOf(t)} · ${t.comment || 'no comment'} · expect ` +
            (t.result === 'valid'
              ? `sig byte-match${kind === 'signseed' ? ' (and pk)' : ''}`
              : dsaRefusalText(t, kind))
          const meta = metaOf(P, gi, t, 'sigGen', 'sigGen-deterministic')
          const why =
            (isInternal(t) ? whyMu : whyDsa) ?? (kind === 'signseed' ? whyKg : null) ?? null
          if (why) {
            await skipRow(ctx, { id, algorithm, testCase, meta, why })
            continue
          }
          await runRow(ctx, {
            id,
            algorithm,
            testCase,
            meta,
            source: wycTag(P),
            exec: () => {
              if (kind === 'signnoseed') {
                const imp = importMldsaPrivate(M, h, v, hexToBytes(g.privateKey ?? ''))
                try {
                  if (imp.rv !== CKR_OK)
                    return refusedWith(
                      t.result,
                      `C_CreateObject(sk) → ${rvName(imp.rv)}`,
                      imp.rv,
                      dsaRefusals(t, 'import')
                    )
                  return signVerdict(M, h, imp.handle, t, [], 'C_CreateObject(sk) → CKR_OK; ')
                } finally {
                  destroy(M, h, imp.handle)
                }
              }
              const pair = mldsaFromSeed(M, h, v, hexToBytes(g.privateSeed ?? ''))
              try {
                if (pair.rv !== CKR_OK)
                  return refusedWith(
                    t.result,
                    `C_GenerateKeyPair(CKA_SEED) → ${rvName(pair.rv)}`,
                    pair.rv,
                    dsaRefusals(t, 'import')
                  )
                const pk = valueOf(M, h, pair.pub)
                // Upstream gives no publicKey when the seed is malformed: there
                // is nothing to compare, and the case must already have been
                // refused above — signing anyway is reported by signVerdict.
                const pre =
                  typeof g.publicKey === 'string'
                    ? [{ what: `pk[${pk.length}B]`, diff: firstDiff(pk, hexToBytes(g.publicKey)) }]
                    : []
                return signVerdict(
                  M,
                  h,
                  pair.priv,
                  t,
                  pre,
                  `C_GenerateKeyPair(CKA_SEED ${nB(g.privateSeed)}B) → CKR_OK; `
                )
              } finally {
                destroy(M, h, pair.pub)
                destroy(M, h, pair.priv)
              }
            },
          })
        }
      }
    }
  }
}
