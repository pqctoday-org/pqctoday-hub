// SPDX-License-Identifier: GPL-3.0-only
//
// ML-KEM reference-sample depth for the validation workbench (remediation plan
// 2026-09-24, WS-D D1-2..D1-5). Rows, per engine:
//
//  1. KeyGen from seed — NIST ML-KEM-keyGen-FIPS203: d‖z supplied as CKA_SEED
//     in the PRIVATE-key template of C_GenerateKeyPair; both the generated ek
//     (public CKA_VALUE) and dk (private CKA_VALUE) are byte-compared.
//  2. Encapsulation AFT — explicit skip: C_EncapsulateKey has no input for the
//     upstream randomness m, so (ek, m) → (c, k) cannot be reproduced.
//  3. Decapsulation VAL — NIST valid AND modified-ciphertext cases; both must
//     return CKR_OK with the upstream k (for a modified ciphertext, k is the
//     FIPS 203 implicit-rejection value).
//  4. Key checks — NIST decapsulationKeyCheck / encapsulationKeyCheck VAL
//     cases (FIPS 203 §7.3 / §7.2), exercised through key import + the
//     operation that must perform the check; a testPassed=false key must be
//     rejected somewhere on that path.
//  5. Product-authored implicit rejection — a NIST valid ciphertext with one
//     bit flipped must decapsulate (CKR_OK) to J(z‖c′) = SHAKE256(z‖c′, 32),
//     computed here with @noble/hashes, and never to the original secret.
//  6. Product-authored boundary probes — ciphertext / key length and output
//     buffer boundaries at the PKCS#11 interface, exact CK_RV pinned per engine.
//
// Details text never prints a shared secret or private key byte: a mismatch is
// reported as a position, not a value (D1-4).
import { shake256 } from '@noble/hashes/sha3.js'
import { hexToBytes } from '@/utils/dataInputUtils'
import {
  rvName,
  hsm_extractKeyValue,
  kemParamSet,
  CKA_CLASS,
  CKA_KEY_TYPE,
  CKA_TOKEN,
  CKA_PRIVATE,
  CKA_SENSITIVE,
  CKA_EXTRACTABLE,
  CKA_ENCAPSULATE,
  CKA_DECAPSULATE,
  CKA_VALUE,
  CKA_VALUE_LEN,
  CKA_PARAMETER_SET,
  CKA_SEED,
  CKO_PUBLIC_KEY,
  CKO_PRIVATE_KEY,
  CKO_SECRET_KEY,
  CKK_ML_KEM,
  CKM_ML_KEM_KEY_PAIR_GEN,
} from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { CKM_ML_KEM } from '@/wasm/softhsm/constants'
import {
  allocMech,
  destroy,
  firstDiff,
  srcOf,
  srcTag,
  unsupportedReason,
  CKR_OK,
  type AcvpCaseMeta,
  type MldsaAcvpSectionCtx,
  type Provenance,
} from './mldsaAcvp'
import {
  createObjectRv,
  generateKeyPairRv,
  pinnedVerdict,
  withTemplate,
  type PinnedRv,
} from './pkcs11Raw'

type Variant = 512 | 768 | 1024
const CT_LEN: Record<Variant, number> = { 512: 768, 768: 1088, 1024: 1568 }
const variantOf = (ps: string) => parseInt(ps.split('-')[2], 10) as Variant

// ── JSON shapes ─────────────────────────────────────────────────────────────
interface KeyGenCase {
  tcId: number
  d: string
  z: string
  ek: string
  dk: string
}
interface ValCase {
  tcId: number
  reason: string
  testPassed?: boolean
  dk?: string
  ek?: string
  c?: string
  k?: string
}
interface ValGroup {
  tgId: number
  parameterSet: string
  function: 'decapsulation' | 'decapsulationKeyCheck' | 'encapsulationKeyCheck'
  tests: ValCase[]
}
interface NotExecuted {
  tgId: number
  parameterSet: string
  function: string
  cases: number
  why: string
}
interface VectorFile<G> {
  _provenance: Provenance
  testGroups: G[]
  notExecuted?: NotExecuted[]
}

// ── Raw KEM calls ───────────────────────────────────────────────────────────
const SECRET_DEFS = [
  { type: CKA_CLASS, ulongVal: CKO_SECRET_KEY },
  { type: CKA_TOKEN, boolVal: false },
  { type: CKA_VALUE_LEN, ulongVal: 32 },
  { type: CKA_SENSITIVE, boolVal: false },
  { type: CKA_EXTRACTABLE, boolVal: true },
]

function importPublic(M: SoftHSMModule, h: number, v: Variant, ek: Uint8Array) {
  return createObjectRv(
    M,
    h,
    [
      { type: CKA_CLASS, ulongVal: CKO_PUBLIC_KEY },
      { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_ENCAPSULATE, boolVal: true },
      { type: CKA_PARAMETER_SET, ulongVal: kemParamSet(v) },
    ],
    [{ type: CKA_VALUE, bytes: ek }]
  )
}

function importPrivate(M: SoftHSMModule, h: number, v: Variant, dk: Uint8Array) {
  return createObjectRv(
    M,
    h,
    [
      { type: CKA_CLASS, ulongVal: CKO_PRIVATE_KEY },
      { type: CKA_KEY_TYPE, ulongVal: CKK_ML_KEM },
      { type: CKA_TOKEN, boolVal: false },
      { type: CKA_SENSITIVE, boolVal: true },
      { type: CKA_DECAPSULATE, boolVal: true },
      { type: CKA_PARAMETER_SET, ulongVal: kemParamSet(v) },
    ],
    [{ type: CKA_VALUE, bytes: dk }]
  )
}

/** C_DecapsulateKey → { rv, handle } (handle must stay 0 on any error). */
export function decapsulateRv(M: SoftHSMModule, h: number, priv: number, ct: Uint8Array) {
  const { mech, allocs } = allocMech(M, CKM_ML_KEM, null)
  const hPtr = M._malloc(4)
  M.setValue(hPtr, 0, 'i32')
  const ctPtr = M._malloc(Math.max(1, ct.length))
  M.HEAPU8.set(ct, ctPtr)
  try {
    const rv = withSecretTemplate(M, (tp, tn) =>
      M._C_DecapsulateKey(h, mech, priv, tp, tn, ctPtr, ct.length, hPtr)
    )
    return { rv, handle: M.getValue(hPtr, 'i32') >>> 0 }
  } finally {
    allocs.forEach((a) => M._free(a))
    M._free(hPtr)
    M._free(ctPtr)
  }
}

/** C_EncapsulateKey with a caller-chosen buffer (null = size query). */
export function encapsulateRv(M: SoftHSMModule, h: number, pub: number, bufLen: number | null) {
  const { mech, allocs } = allocMech(M, CKM_ML_KEM, null)
  const hPtr = M._malloc(4)
  const lenPtr = M._malloc(4)
  M.setValue(hPtr, 0, 'i32')
  M.setValue(lenPtr, bufLen ?? 0, 'i32')
  const ctPtr = bufLen === null ? 0 : M._malloc(Math.max(1, bufLen))
  try {
    const rv = withSecretTemplate(M, (tp, tn) =>
      M._C_EncapsulateKey(h, mech, pub, tp, tn, ctPtr, lenPtr, hPtr)
    )
    return {
      rv,
      handle: M.getValue(hPtr, 'i32') >>> 0,
      ctLen: M.getValue(lenPtr, 'i32') >>> 0,
    }
  } finally {
    allocs.forEach((a) => M._free(a))
    M._free(hPtr)
    M._free(lenPtr)
    if (ctPtr) M._free(ctPtr)
  }
}

const withSecretTemplate = (M: SoftHSMModule, fn: (ptr: number, n: number) => number): number =>
  withTemplate(M, SECRET_DEFS, [], (ptr, n) => fn(ptr, n) >>> 0)

const eq = (a: Uint8Array, b: Uint8Array) => firstDiff(a, b) === 'identical'

// ── Boundary probes (D1-5): exact CK_RV pinned per engine ───────────────────
// §5.18.8 = C_EncapsulateKey, §5.18.9 = C_DecapsulateKey (PKCS#11 v3.2 OS).
const ENCAP_LISTED = ['CKR_OK', 'CKR_BUFFER_TOO_SMALL', 'CKR_KEY_HANDLE_INVALID']
const DECAP_LISTED = [
  'CKR_ARGUMENTS_BAD',
  'CKR_WRAPPED_KEY_INVALID',
  'CKR_WRAPPED_KEY_LEN_RANGE',
  'CKR_UNWRAPPING_KEY_HANDLE_INVALID',
  'CKR_UNWRAPPING_KEY_SIZE_RANGE',
]
export const MLKEM_BOUNDARY_PINS: Record<string, PinnedRv> = {
  // Wrong-length ciphertexts. §5.18.9 lists WRAPPED_KEY_LEN_RANGE/INVALID, not
  // the ENCRYPTED_DATA_* family (whose definitions are for decryption).
  'decap-ct-short': {
    cpp: 'CKR_WRAPPED_KEY_LEN_RANGE',
    rust: 'CKR_ENCRYPTED_DATA_INVALID',
    listed: DECAP_LISTED,
    section: '§5.18.9',
  },
  'decap-ct-long': {
    cpp: 'CKR_WRAPPED_KEY_LEN_RANGE',
    rust: 'CKR_ENCRYPTED_DATA_INVALID',
    listed: DECAP_LISTED,
    section: '§5.18.9',
  },
  'decap-ct-other-set': {
    cpp: 'CKR_WRAPPED_KEY_INVALID',
    rust: 'CKR_ENCRYPTED_DATA_INVALID',
    listed: DECAP_LISTED,
    section: '§5.18.9',
  },
  'encap-size-query': { cpp: 'CKR_OK', rust: 'CKR_OK', listed: ENCAP_LISTED, section: '§5.18.8' },
  'encap-short-buffer': {
    cpp: 'CKR_BUFFER_TOO_SMALL',
    rust: 'CKR_BUFFER_TOO_SMALL',
    listed: ENCAP_LISTED,
    section: '§5.18.8',
  },
  // Malformed key objects. §4.1.1 rule 2: an invalid attribute value fails
  // object creation with CKR_ATTRIBUTE_VALUE_INVALID. The C++ engine accepts
  // a 1-byte-short dk and fails later at C_DecapsulateKey; the Rust engine
  // rejects it at C_CreateObject. Both accept a 1-byte-short ek and fail at
  // C_EncapsulateKey with a code §5.18.8 does not list.
  'import-dk-short': {
    cpp: 'CKR_OK → C_DecapsulateKey CKR_WRAPPED_KEY_INVALID',
    rust: 'CKR_ATTRIBUTE_VALUE_INVALID',
    listed: ['CKR_ATTRIBUTE_VALUE_INVALID'],
    section: '§4.1.1 (object creation)',
  },
  'import-ek-short': {
    cpp: 'CKR_OK → C_EncapsulateKey CKR_GENERAL_ERROR',
    rust: 'CKR_OK → C_EncapsulateKey CKR_KEY_TYPE_INCONSISTENT',
    listed: ['CKR_ATTRIBUTE_VALUE_INVALID'],
    section: '§4.1.1 (object creation)',
  },
}

/** Run the ML-KEM reference-sample rows for ONE engine. */
export async function runMlkemAcvpSection(ctx: MldsaAcvpSectionCtx): Promise<void> {
  const { M, hSession, eName, mechs, referenceUrl, pushResult, addLog } = ctx
  const [kgMod, valMod] = await Promise.all([
    import('@/data/acvp/mlkem_keygen_test.json'),
    import('@/data/acvp/mlkem_encapdecap_val_test.json'),
  ])
  const kg = kgMod.default as unknown as VectorFile<{
    tgId: number
    parameterSet: string
    tests: KeyGenCase[]
  }>
  const val = valMod.default as unknown as VectorFile<ValGroup>
  const KG = kg._provenance
  const VAL = val._provenance
  const kgTier = ctx.evidenceTierFor(KG)
  const valTier = ctx.evidenceTierFor(VAL)

  const skipIfUnadvertised = async (
    id: string,
    algorithm: string,
    testCase: string,
    meta: AcvpCaseMeta,
    mech: number,
    label: string
  ): Promise<boolean> => {
    const why = unsupportedReason(mechs, mech, label)
    if (!why) return false
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
    return true
  }

  // ── 1. KeyGen from seed ────────────────────────────────────────────────
  for (const g of kg.testGroups) {
    const ps = g.parameterSet
    const v = variantOf(ps)
    for (const t of g.tests) {
      const id = `mlkem-keygen-seed-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const testCase = `KeyGen from seed (CKA_SEED d‖z) · NIST keyGen tg${g.tgId}/tc${t.tcId} · ek+dk byte-match`
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
      const algorithm = `${ps} (${eName})`
      if (
        await skipIfUnadvertised(
          id,
          algorithm,
          testCase,
          meta,
          CKM_ML_KEM_KEY_PAIR_GEN,
          'CKM_ML_KEM_KEY_PAIR_GEN'
        )
      )
        continue
      let pair = { rv: 0, pub: 0, priv: 0 }
      try {
        pair = generateKeyPairRv(
          M,
          hSession,
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
              // Test-only: public NIST sample key material, extracted to compare with dk.
              { type: CKA_SENSITIVE, boolVal: false },
              { type: CKA_EXTRACTABLE, boolVal: true },
              { type: CKA_DECAPSULATE, boolVal: true },
            ],
            bytes: [{ type: CKA_SEED, bytes: hexToBytes(t.d + t.z) }],
          }
        )
        if (pair.rv !== CKR_OK) throw new Error(`C_GenerateKeyPair(CKA_SEED) → ${rvName(pair.rv)}`)
        const ek = new Uint8Array(hsm_extractKeyValue(M, hSession, pair.pub))
        const dk = new Uint8Array(hsm_extractKeyValue(M, hSession, pair.priv))
        const ekDiff = firstDiff(ek, hexToBytes(t.ek))
        const dkDiff = firstDiff(dk, hexToBytes(t.dk))
        const ok = ekDiff === 'identical' && dkDiff === 'identical'
        const observed = ok ? 'byte-equal' : `ek: ${ekDiff}; dk: ${dkDiff}`
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          evidenceTier: kgTier,
          status: ok ? 'pass' : 'fail',
          details:
            (ok
              ? `ek[${ek.length}B] and dk[${dk.length}B] byte-equal to NIST expected`
              : `mismatch — ${observed}`) +
            ' · seed supplied in the private-key template (§6.68.4 lists CKA_SEED as mechanism-contributed; accepting it as input is engine behaviour)' +
            ` · ${srcTag(KG)}`,
          caseMeta: { ...meta, observed },
        })
        addLog(`[${eName}] [id:${id}] ${ps} ${testCase}: ${ok ? 'PASS' : `FAIL (${observed})`}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          evidenceTier: kgTier,
          status: 'fail',
          details: `${msg} · ${srcTag(KG)}`,
          caseMeta: { ...meta, observed: msg },
        })
        addLog(`[DISCREPANCY] [${eName}] [id:${id}] ${ps} ${testCase}: ${msg}`)
      } finally {
        destroy(M, hSession, pair.pub)
        destroy(M, hSession, pair.priv)
      }
    }
  }

  // ── 2. Encapsulation AFT: honest skip ─────────────────────────────────
  const encapNotRun = (val.notExecuted ?? []).filter(
    (r) => r.why === 'no-pkcs11-encapsulation-randomness-input'
  )
  if (encapNotRun.length > 0) {
    await pushResult({
      id: `mlkem-skip-encap-m-${eName}`,
      algorithm: `ML-KEM-512/768/1024 (${eName})`,
      testCase: `Encapsulation AFT · byte-match against NIST (ek, m) → (c, k) · ${encapNotRun.length} groups`,
      referenceUrl,
      status: 'skip',
      details:
        'Skipped — C_EncapsulateKey (PKCS#11 v3.2 §5.18.8) takes no caller-supplied randomness: the token draws m ' +
        'itself, so the NIST encapsulation output cannot be reproduced through this interface. The same NIST cases ' +
        'are exercised in the decapsulation direction (Decapsulate · upstream encapsulation rows). Not run: ' +
        encapNotRun.map((r) => `tg${r.tgId} (${r.parameterSet}, ${r.cases} cases)`).join(', ') +
        ` · ${srcTag(VAL)}`,
      caseMeta: {
        origin: 'not-executed',
        upstreamOperation: 'encapsulation',
        localOperation: 'none',
        parameterSet: 'ML-KEM-512/768/1024',
        expected: 'not-run',
        source: srcOf(VAL),
      },
    })
  }

  // ── 3/4. VAL groups ────────────────────────────────────────────────────
  for (const g of val.testGroups) {
    const ps = g.parameterSet
    const v = variantOf(ps)
    const algorithm = `${ps} (${eName})`
    for (const t of g.tests) {
      if (g.function === 'decapsulation') {
        const modified = t.reason === 'modified ciphertext'
        const id = `mlkem-decap-val-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
        const testCase =
          `Decapsulate · NIST encapDecap VAL tg${g.tgId}/tc${t.tcId} · ${t.reason}` +
          (modified ? ' → implicit rejection k' : '')
        const meta: AcvpCaseMeta = {
          origin: 'nist-acvp-server',
          upstreamOperation: 'decapsulation',
          localOperation: 'decapsulation',
          parameterSet: ps,
          expected: 'byte-match',
          expectedReason: t.reason,
          expectedRv: 'CKR_OK',
          tgId: g.tgId,
          tcId: t.tcId,
          source: srcOf(VAL),
        }
        if (await skipIfUnadvertised(id, algorithm, testCase, meta, CKM_ML_KEM, 'CKM_ML_KEM'))
          continue
        let priv = 0
        let sec = 0
        try {
          const imp = importPrivate(M, hSession, v, hexToBytes(t.dk!))
          if (imp.rv !== CKR_OK) throw new Error(`C_CreateObject(dk) → ${rvName(imp.rv)}`)
          priv = imp.handle
          const r = decapsulateRv(M, hSession, priv, hexToBytes(t.c!))
          sec = r.handle
          if (r.rv !== CKR_OK)
            throw new Error(`C_DecapsulateKey → ${rvName(r.rv)} (expected CKR_OK)`)
          const k = new Uint8Array(hsm_extractKeyValue(M, hSession, sec))
          const diff = firstDiff(k, hexToBytes(t.k!))
          const ok = diff === 'identical'
          const observed = ok ? 'C_DecapsulateKey → CKR_OK · k byte-equal' : `k ${diff}`
          await pushResult({
            id,
            algorithm,
            testCase,
            referenceUrl,
            evidenceTier: valTier,
            status: ok ? 'pass' : 'fail',
            details:
              (ok
                ? `C_DecapsulateKey → CKR_OK · shared secret [${k.length}B] equals NIST ${modified ? 'implicit-rejection value' : 'k'}`
                : `shared secret does not equal NIST k (${diff}; value not shown)`) +
              ` · ${srcTag(VAL)}`,
            caseMeta: { ...meta, observed },
          })
          addLog(`[${eName}] [id:${id}] ${ps} ${testCase}: ${ok ? 'PASS' : 'FAIL'}`)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          await pushResult({
            id,
            algorithm,
            testCase,
            referenceUrl,
            evidenceTier: valTier,
            status: 'fail',
            details: `${msg} · ${srcTag(VAL)}`,
            caseMeta: { ...meta, observed: msg },
          })
          addLog(`[DISCREPANCY] [${eName}] [id:${id}] ${ps} ${testCase}: ${msg}`)
        } finally {
          destroy(M, hSession, sec)
          destroy(M, hSession, priv)
        }
        continue
      }

      // Key checks
      const isDk = g.function === 'decapsulationKeyCheck'
      const expectAccept = t.testPassed === true
      const id = `mlkem-keycheck-${isDk ? 'dk' : 'ek'}-${ps}-tg${g.tgId}-tc${t.tcId}-${eName}`
      const testCase =
        `${isDk ? 'Decapsulation-key check (FIPS 203 §7.3)' : 'Encapsulation-key check (FIPS 203 §7.2)'}` +
        ` · NIST VAL tg${g.tgId}/tc${t.tcId} · ${t.reason} · expect ${expectAccept ? 'accepted' : 'rejected'}`
      const meta: AcvpCaseMeta = {
        origin: 'nist-acvp-server',
        upstreamOperation: isDk ? 'decapsulationKeyCheck' : 'encapsulationKeyCheck',
        localOperation: isDk ? 'decapsulation' : 'encapsulation',
        parameterSet: ps,
        expected: expectAccept ? 'accepted' : 'rejected',
        expectedReason: t.reason,
        tgId: g.tgId,
        tcId: t.tcId,
        source: srcOf(VAL),
      }
      if (await skipIfUnadvertised(id, algorithm, testCase, meta, CKM_ML_KEM, 'CKM_ML_KEM'))
        continue
      let key = 0
      let sec = 0
      try {
        const imp = isDk
          ? importPrivate(M, hSession, v, hexToBytes(t.dk!))
          : importPublic(M, hSession, v, hexToBytes(t.ek!))
        key = imp.handle
        let observed = `C_CreateObject → ${rvName(imp.rv)}`
        let accepted = false
        if (imp.rv === CKR_OK) {
          const r = isDk
            ? decapsulateRv(M, hSession, key, new Uint8Array(CT_LEN[v]))
            : encapsulateRv(M, hSession, key, CT_LEN[v])
          sec = r.handle
          observed += `; ${isDk ? 'C_DecapsulateKey' : 'C_EncapsulateKey'} → ${rvName(r.rv)}`
          accepted = r.rv === CKR_OK
        }
        const ok = accepted === expectAccept
        await pushResult({
          id,
          algorithm,
          testCase,
          referenceUrl,
          evidenceTier: valTier,
          status: ok ? 'pass' : 'fail',
          details:
            `${observed}` +
            (ok
              ? ''
              : expectAccept
                ? ' — REJECTED a key NIST marks valid'
                : ` — ACCEPTED a key NIST marks invalid (${t.reason}); FIPS 203 ${isDk ? '§7.3 hash check' : '§7.2 modulus check'} not enforced`) +
            ` · ${srcTag(VAL)}`,
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
          evidenceTier: valTier,
          status: 'fail',
          details: `${msg} · ${srcTag(VAL)}`,
          caseMeta: { ...meta, observed: msg },
        })
      } finally {
        destroy(M, hSession, sec)
        destroy(M, hSession, key)
      }
    }
  }

  // ── 5. Product-authored implicit rejection (D1-4) ─────────────────────
  for (const g of val.testGroups.filter((x) => x.function === 'decapsulation')) {
    const base = g.tests.find((t) => t.reason === 'valid decapsulation')
    if (!base) continue
    const ps = g.parameterSet
    const v = variantOf(ps)
    const algorithm = `${ps} (${eName})`
    const id = `mlkem-implicit-reject-local-${ps}-${eName}`
    const testCase = `Decapsulate · product-authored negative · ciphertext bit flip (c[0]^=0x01) of NIST tc${base.tcId} · expect CKR_OK + J(z‖c′)`
    const meta: AcvpCaseMeta = {
      origin: 'product-authored-mutation',
      upstreamOperation: 'decapsulation',
      localOperation: 'decapsulation',
      parameterSet: ps,
      expected: 'byte-match',
      expectedReason: 'ct-bitflip → implicit rejection',
      expectedRv: 'CKR_OK',
      tgId: g.tgId,
      tcId: base.tcId,
      source: srcOf(VAL),
    }
    if (await skipIfUnadvertised(id, algorithm, testCase, meta, CKM_ML_KEM, 'CKM_ML_KEM')) continue
    let priv = 0
    let sec = 0
    try {
      const dk = hexToBytes(base.dk!)
      const c = hexToBytes(base.c!)
      c[0] ^= 0x01
      // FIPS 203 Algorithm 18 line 8: K̄ ← J(z‖c), J(s) = SHAKE256(s, 8·32); z = last 32 bytes of dk.
      const z = dk.slice(dk.length - 32)
      const jInput = new Uint8Array(z.length + c.length)
      jInput.set(z)
      jInput.set(c, z.length)
      const expectedKbar = shake256(jInput, { dkLen: 32 })
      const imp = importPrivate(M, hSession, v, dk)
      if (imp.rv !== CKR_OK) throw new Error(`C_CreateObject(dk) → ${rvName(imp.rv)}`)
      priv = imp.handle
      const r = decapsulateRv(M, hSession, priv, c)
      sec = r.handle
      let observed = `C_DecapsulateKey → ${rvName(r.rv)}`
      let ok = false
      if (r.rv === CKR_OK) {
        const k = new Uint8Array(hsm_extractKeyValue(M, hSession, sec))
        const isKbar = eq(k, expectedKbar)
        const isOriginal = eq(k, hexToBytes(base.k!))
        ok = isKbar && !isOriginal
        observed += isOriginal
          ? ' · returned the ORIGINAL shared secret'
          : isKbar
            ? ' · k = J(z‖c′)'
            : ' · k is neither J(z‖c′) nor the original secret'
      }
      await pushResult({
        id,
        algorithm,
        testCase,
        referenceUrl,
        status: ok ? 'pass' : 'fail',
        details:
          `${observed} (values not shown) · expected J(z‖c′) computed independently with @noble/hashes SHAKE256 (FIPS 203 Alg. 18)` +
          ` · PQC Today-authored mutation of ${srcTag(VAL)} tc${base.tcId}, not a NIST vector`,
        caseMeta: { ...meta, observed },
      })
      addLog(
        `[${eName}] [id:${id}] ${ps} implicit rejection: ${ok ? 'PASS' : 'FAIL'} (${observed})`
      )
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
      destroy(M, hSession, sec)
      destroy(M, hSession, priv)
    }
  }

  // ── 6. Product-authored boundary probes (D1-5), ML-KEM-512 ────────────
  const g512 = val.testGroups.find(
    (x) => x.function === 'decapsulation' && x.parameterSet === 'ML-KEM-512'
  )
  const kg512 = kg.testGroups.find((x) => x.parameterSet === 'ML-KEM-512')
  if (!g512 || !kg512) return
  const bt = g512.tests.find((t) => t.reason === 'valid decapsulation')!
  const ek512 = hexToBytes(kg512.tests[0].ek)
  const dk512 = hexToBytes(bt.dk!)
  const ct512 = hexToBytes(bt.c!)
  interface ProbeOutcome {
    observed: string
    /** false when a failing call still left a key object behind */
    noKey: boolean
    extra?: string
    /** false when an output-length contract was violated */
    lenOk?: boolean
  }
  const probes: { key: string; label: string; run: () => ProbeOutcome }[] = [
    {
      key: 'decap-ct-short',
      label: `C_DecapsulateKey with a ${ct512.length - 1}-byte ciphertext (1 short)`,
      run: () => decapWith(dk512, ct512.slice(0, ct512.length - 1)),
    },
    {
      key: 'decap-ct-long',
      label: `C_DecapsulateKey with a ${ct512.length + 1}-byte ciphertext (1 long)`,
      run: () => {
        const c = new Uint8Array(ct512.length + 1)
        c.set(ct512)
        return decapWith(dk512, c)
      },
    },
    {
      key: 'decap-ct-other-set',
      label: `C_DecapsulateKey with a ${CT_LEN[768]}-byte (ML-KEM-768-length) ciphertext`,
      run: () => decapWith(dk512, new Uint8Array(CT_LEN[768]).fill(0x5a)),
    },
    {
      key: 'encap-size-query',
      label: 'C_EncapsulateKey size query (pCiphertext = NULL)',
      run: () => {
        const pub = importPublic(M, hSession, 512, ek512)
        try {
          const r = encapsulateRv(M, hSession, pub.handle, null)
          destroy(M, hSession, r.handle)
          return {
            observed: rvName(r.rv),
            noKey: r.handle === 0,
            extra: `*pulCiphertextLen = ${r.ctLen} (expected ${CT_LEN[512]})`,
            lenOk: r.ctLen === CT_LEN[512],
          }
        } finally {
          destroy(M, hSession, pub.handle)
        }
      },
    },
    {
      key: 'encap-short-buffer',
      label: `C_EncapsulateKey with a ${CT_LEN[512] - 1}-byte output buffer`,
      run: () => {
        const pub = importPublic(M, hSession, 512, ek512)
        try {
          const r = encapsulateRv(M, hSession, pub.handle, CT_LEN[512] - 1)
          destroy(M, hSession, r.handle)
          return {
            observed: rvName(r.rv),
            noKey: r.handle === 0,
            extra: `*pulCiphertextLen = ${r.ctLen} (expected ${CT_LEN[512]})`,
            lenOk: r.ctLen === CT_LEN[512],
          }
        } finally {
          destroy(M, hSession, pub.handle)
        }
      },
    },
    {
      key: 'import-dk-short',
      label: `C_CreateObject(ML-KEM-512 dk, ${dk512.length - 1} bytes — 1 short), then C_DecapsulateKey`,
      run: () => {
        const imp = importPrivate(M, hSession, 512, dk512.slice(0, dk512.length - 1))
        if (imp.rv !== CKR_OK) return { observed: rvName(imp.rv), noKey: imp.handle === 0 }
        try {
          const r = decapsulateRv(M, hSession, imp.handle, ct512)
          destroy(M, hSession, r.handle)
          return {
            observed: `CKR_OK → C_DecapsulateKey ${rvName(r.rv)}`,
            noKey: r.rv === CKR_OK || r.handle === 0,
          }
        } finally {
          destroy(M, hSession, imp.handle)
        }
      },
    },
    {
      key: 'import-ek-short',
      label: `C_CreateObject(ML-KEM-512 ek, ${ek512.length - 1} bytes — 1 short), then C_EncapsulateKey`,
      run: () => {
        const imp = importPublic(M, hSession, 512, ek512.slice(0, ek512.length - 1))
        if (imp.rv !== CKR_OK) return { observed: rvName(imp.rv), noKey: imp.handle === 0 }
        try {
          const r = encapsulateRv(M, hSession, imp.handle, CT_LEN[512])
          destroy(M, hSession, r.handle)
          return {
            observed: `CKR_OK → C_EncapsulateKey ${rvName(r.rv)}`,
            noKey: r.rv === CKR_OK || r.handle === 0,
          }
        } finally {
          destroy(M, hSession, imp.handle)
        }
      },
    },
  ]
  function decapWith(dk: Uint8Array, ct: Uint8Array): ProbeOutcome {
    const imp = importPrivate(M, hSession, 512, dk)
    if (imp.rv !== CKR_OK) return { observed: `C_CreateObject ${rvName(imp.rv)}`, noKey: true }
    try {
      const r = decapsulateRv(M, hSession, imp.handle, ct)
      destroy(M, hSession, r.handle)
      return { observed: rvName(r.rv), noKey: r.handle === 0 }
    } finally {
      destroy(M, hSession, imp.handle)
    }
  }

  for (const p of probes) {
    const pin = MLKEM_BOUNDARY_PINS[p.key]
    const id = `mlkem-boundary-${p.key}-${eName}`
    const algorithm = `ML-KEM-512 (${eName})`
    const testCase = `PKCS#11 boundary · product-authored probe · ${p.label}`
    const meta: AcvpCaseMeta = {
      origin: 'product-authored-probe',
      upstreamOperation: 'none',
      localOperation: p.key.startsWith('import')
        ? 'key-import'
        : p.key.startsWith('encap')
          ? 'encapsulation'
          : 'decapsulation',
      parameterSet: 'ML-KEM-512',
      expected: 'return-code',
      expectedReason: p.key,
      expectedRv: pin
        ? eName === 'C++'
          ? pin.cpp
          : eName === 'Rust'
            ? pin.rust
            : undefined
        : undefined,
      source: srcOf(VAL),
    }
    if (await skipIfUnadvertised(id, algorithm, testCase, meta, CKM_ML_KEM, 'CKM_ML_KEM')) continue
    try {
      const r = p.run()
      const v = pinnedVerdict(pin, eName, r.observed)
      const ok = v.ok && r.noKey && r.lenOk !== false
      await pushResult({
        id,
        algorithm,
        testCase,
        referenceUrl,
        status: ok ? 'pass' : 'fail',
        details:
          v.details +
          (r.extra ? ` · ${r.extra}` : '') +
          (r.noKey ? '' : ' · a key object was created on a failing call') +
          ' · PQC Today-authored probe, not a NIST vector',
        caseMeta: { ...meta, observed: r.observed },
      })
      addLog(`[${eName}] [id:${id}] ${testCase}: ${ok ? 'PASS' : 'FAIL'} (${r.observed})`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      await pushResult({
        id,
        algorithm,
        testCase,
        referenceUrl,
        status: 'fail',
        details: `${msg} · PQC Today-authored probe, not a NIST vector`,
        caseMeta: { ...meta, observed: msg },
      })
    }
  }
}
