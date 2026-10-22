// SPDX-License-Identifier: AGPL-3.0-only
//
// The NIST ACVP groups that need an optional test input (sections/
// optionalInputAcvp.ts), on BOTH real engines: the C++ engine (Emscripten,
// loaded in Node) and the Rust engine (wasm-bindgen).
//
// What it proves:
//  - every committed case passes on both engines: ML-KEM encapsulation with
//    NIST m (c and k byte-match), ML-DSA and SLH-DSA hedged signing with NIST
//    rnd / addrnd (signature byte-match, including the generic pre-hash route
//    with CKM_SHA512_224 / CKM_SHA512_256), ML-DSA internal through the
//    standard CKM_ML_DSA_EXTERNAL_MU, and SLH-DSA internal sign and verify
//    through messageEncoding = internal;
//  - every row that handed the HSM such a value carries the label "test input
//    supplied (outside the standard)", and rows that did not, do not;
//  - sabotage: a changed expected value (c, k, signature, disposition) on a
//    COPY of the vectors turns exactly that row red on both engines;
//  - the HSM refuses a wrong-length random value, a supplied value with
//    CKH_DETERMINISTIC_REQUIRED and a structure of any other size, and with
//    the value left out signing is standard (randomised, still verifies).
//
// Full vectors: with PQC_ACVP_NIST_DIR naming a directory that holds the five
// pinned upstream files (ML-KEM-encapDecap-FIPS203.json, ML-DSA-sigGen-FIPS204
// .json, ML-DSA-sigVer-FIPS204.json, SLH-DSA-sigGen-FIPS205.json, SLH-DSA-
// sigVer-FIPS205.json from usnistgov/ACVP-Server @ 975de31e; checked against
// the sha256 in each committed file's _provenance), the last test runs every
// case of every in-scope group — 81 groups, 909 cases — on both engines.
// Without it that one test is skipped and says so; it never counts as a pass.
//
// Venue: `*.local.test.ts` — local gate only.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import {
  CKM_ML_DSA,
  CKM_SLH_DSA,
  CKH_HEDGE_PREFERRED,
  CKH_DETERMINISTIC_REQUIRED,
  CKP_SLH_DSA_SHA2_128F,
} from '@/wasm/softhsm/constants'
import type { TestResult } from './useAcvpSuite'
import { TEST_INPUT_LABEL, CKR_OK } from './sections/mldsaAcvp'
import {
  allocExtSignMech,
  importKey,
  runOptionalInputSection,
  signWithMech,
  verifyWithMech,
  MESSAGE_ENCODING_STANDARD,
  SIGN_CTX_EXT_LEN,
  type OptionalInputFamily,
  type OptionalInputVectors,
} from './sections/optionalInputAcvp'

const require_ = createRequire(import.meta.url)
const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  // cwd-relative on purpose (see useAcvpSuite.mlkemAcvp.local.test.ts).
  const gluePath = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}

const DATA = path.resolve(__dirname, '../../../../data/acvp')
const readVectors = (name: string) => JSON.parse(readFileSync(path.join(DATA, name), 'utf8'))
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

const committed = (): OptionalInputVectors => ({
  encap: readVectors('mlkem_encap_aft_test.json'),
  mldsaSigGen: readVectors('mldsa_siggen_optional_input_test.json'),
  mldsaSigVer: readVectors('mldsa_sigver_internal_test.json'),
  slhdsaSigGen: readVectors('slhdsa_siggen_optional_input_test.json'),
  slhdsaSigVer: readVectors('slhdsa_sigver_internal_test.json'),
})
const only = (v: OptionalInputVectors, family: OptionalInputFamily): OptionalInputVectors =>
  family === 'ml_kem'
    ? { encap: v.encap }
    : family === 'ml_dsa'
      ? { mldsaSigGen: v.mldsaSigGen, mldsaSigVer: v.mldsaSigVer }
      : { slhdsaSigGen: v.slhdsaSigGen, slhdsaSigVer: v.slhdsaSigVer }

interface Engine {
  name: 'C++' | 'Rust'
  M: SoftHSMModule
  h: number
  mechs: Set<number>
}
const engines: Engine[] = []

const openEngine = (name: Engine['name'], M: SoftHSMModule): Engine => {
  SoftHSM.hsm_initialize(M)
  const slot = SoftHSM.hsm_initToken(M, SoftHSM.hsm_getFirstFreeSlot(M), '1234', 'Opt input')
  const h = SoftHSM.hsm_openUserSession(M, slot, '1234', '1234')
  return { name, M, h, mechs: new Set(SoftHSM.hsm_getMechanismList(M, slot)) }
}

const run = async (
  e: Engine,
  family: OptionalInputFamily,
  v: OptionalInputVectors
): Promise<TestResult[]> => {
  const rows: TestResult[] = []
  await runOptionalInputSection(
    {
      M: e.M,
      hSession: e.h,
      eName: e.name,
      mechs: e.mechs,
      referenceUrl: 'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program',
      pushResult: async (r) => {
        rows.push({ ...r, category: 'ml_dsa' })
      },
      addLog: () => {},
    },
    family,
    only(v, family)
  )
  return rows
}

const FAMILIES: OptionalInputFamily[] = ['ml_kem', 'ml_dsa', 'slh_dsa']
const results = new Map<string, TestResult[]>()
const key = (e: Engine, f: OptionalInputFamily) => `${e.name}/${f}`

describe('Optional test inputs — NIST groups PKCS#11 has no field for, both engines', () => {
  beforeAll(async () => {
    engines.push(openEngine('C++', await loadCppEngineInNode()))
    engines.push(openEngine('Rust', (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule))
    const v = committed()
    for (const e of engines) for (const f of FAMILIES) results.set(key(e, f), await run(e, f, v))
  }, 900_000)

  it('runs every committed case on both engines, with identical row sets', () => {
    const expected: Record<OptionalInputFamily, number> = {
      ml_kem: 75, // 3 encapsulation groups, every case
      ml_dsa: 18 + 6, // 15 sigGen groups + 3 internal sigVer groups
      slh_dsa: 58 + 24, // 48 sigGen groups + 12 internal sigVer groups
    }
    for (const f of FAMILIES) {
      const [cpp, rust] = engines.map((e) => results.get(key(e, f))!)
      expect(cpp).toHaveLength(expected[f]) // eslint-disable-line security/detect-object-injection
      expect(rust.map((r) => r.id.replace(/-Rust$/, ''))).toEqual(
        cpp.map((r) => r.id.replace(/-C\+\+$/, ''))
      )
    }
  })

  it('every case passes on both engines (no skip, no fail)', () => {
    for (const rows of results.values())
      for (const r of rows) expect(r.status, `${r.id}: ${r.details}`).toBe('pass')
  })

  it('labels exactly the rows that supplied a value outside the standard', () => {
    for (const rows of results.values())
      for (const r of rows) {
        const supplied = r.caseMeta?.testInput !== undefined
        expect(r.testCase.includes(TEST_INPUT_LABEL), r.id).toBe(supplied)
        expect(r.details.includes(TEST_INPUT_LABEL), r.id).toBe(supplied)
      }
    const all = [...results.values()].flat()
    // ML-DSA deterministic internal groups and ML-DSA internal sigVer use only
    // the standard CKM_ML_DSA_EXTERNAL_MU: no label.
    const std = all.filter((r) => r.caseMeta?.testInput === undefined)
    expect(std.length).toBe(2 * (3 + 6))
    expect(std.every((r) => r.id.startsWith('optin-mldsa-'))).toBe(true)
    expect(all.filter((r) => r.caseMeta?.testInput === 'm')).toHaveLength(2 * 75)
  })

  it('exercises the generic pre-hash route with SHA-512/224 and SHA-512/256 on both engines', () => {
    for (const e of engines) {
      const rows = [...results.get(key(e, 'ml_dsa'))!, ...results.get(key(e, 'slh_dsa'))!]
      const generic = rows.filter((r) => /CKM_HASH_(ML|SLH)_DSA \(generic/.test(r.testCase))
      expect(new Set(generic.map((r) => r.caseMeta?.hashAlg))).toEqual(
        new Set(['SHA2-512/224', 'SHA2-512/256'])
      )
      expect(generic.length).toBe(3 + 12)
      expect(generic.every((r) => r.status === 'pass')).toBe(true)
    }
  })

  // ── Sabotage: a changed expected value must fail ────────────────────────
  const flipHex = (hex: string, at = 0) =>
    hex.slice(0, at) + ((parseInt(hex[at], 16) ^ 1).toString(16) as string) + hex.slice(at + 1)

  it('SABOTAGE: a changed NIST c, k, signature or disposition turns exactly that row red on both engines', async () => {
    const v = committed()
    const s = clone(v)
    s.encap!.testGroups[0].tests[0].c = flipHex(s.encap!.testGroups[0].tests[0].c, 10)
    s.encap!.testGroups[1].tests[0].k = flipHex(s.encap!.testGroups[1].tests[0].k)
    s.mldsaSigGen!.testGroups[3].tests[0].signature = flipHex(
      s.mldsaSigGen!.testGroups[3].tests[0].signature,
      100
    )
    s.mldsaSigVer!.testGroups[0].tests[0].testPassed =
      !s.mldsaSigVer!.testGroups[0].tests[0].testPassed
    const slhGen = s.slhdsaSigGen!.testGroups.find((g) => g.parameterSet.endsWith('128f'))!
    slhGen.tests[0].signature = flipHex(slhGen.tests[0].signature, 4)
    const slhVer = s.slhdsaSigVer!.testGroups.find((g) => g.parameterSet.endsWith('128f'))!
    slhVer.tests[0].testPassed = !slhVer.tests[0].testPassed
    // Only the sabotaged groups, to keep the run short.
    const trimmed: OptionalInputVectors = {
      encap: { ...s.encap!, testGroups: s.encap!.testGroups.slice(0, 2) },
      mldsaSigGen: { ...s.mldsaSigGen!, testGroups: [s.mldsaSigGen!.testGroups[3]] },
      mldsaSigVer: { ...s.mldsaSigVer!, testGroups: [s.mldsaSigVer!.testGroups[0]] },
      slhdsaSigGen: { ...s.slhdsaSigGen!, testGroups: [slhGen] },
      slhdsaSigVer: { ...s.slhdsaSigVer!, testGroups: [slhVer] },
    }
    const ids = [
      `optin-mlkem-encap-${s.encap!.testGroups[0].parameterSet}-tg${s.encap!.testGroups[0].tgId}-tc${s.encap!.testGroups[0].tests[0].tcId}`,
      `optin-mlkem-encap-${s.encap!.testGroups[1].parameterSet}-tg${s.encap!.testGroups[1].tgId}-tc${s.encap!.testGroups[1].tests[0].tcId}`,
      `optin-mldsa-siggen-${s.mldsaSigGen!.testGroups[3].parameterSet}-tg${s.mldsaSigGen!.testGroups[3].tgId}-tc${s.mldsaSigGen!.testGroups[3].tests[0].tcId}`,
      `optin-mldsa-sigver-${s.mldsaSigVer!.testGroups[0].parameterSet}-tg${s.mldsaSigVer!.testGroups[0].tgId}-tc${s.mldsaSigVer!.testGroups[0].tests[0].tcId}`,
      `optin-slhdsa-siggen-${slhGen.parameterSet}-tg${slhGen.tgId}-tc${slhGen.tests[0].tcId}`,
      `optin-slhdsa-sigver-${slhVer.parameterSet}-tg${slhVer.tgId}-tc${slhVer.tests[0].tcId}`,
    ]
    for (const e of engines) {
      const rows = [
        ...(await run(e, 'ml_kem', trimmed)),
        ...(await run(e, 'ml_dsa', trimmed)),
        ...(await run(e, 'slh_dsa', trimmed)),
      ]
      const red = rows.filter((r) => r.status !== 'pass').map((r) => r.id)
      expect(red.sort()).toEqual(ids.map((i) => `${i}-${e.name}`).sort())
    }
  }, 300_000)

  // ── Refusals and the standard default ───────────────────────────────────
  const firstCase = () => {
    const g = readVectors('mldsa_siggen_optional_input_test.json').testGroups.find(
      (x: { preHash: string; signatureInterface: string }) =>
        x.preHash === 'pure' && x.signatureInterface === 'external'
    )
    return { g, t: g.tests[0] }
  }
  const hex = (s: string) => Uint8Array.from(Buffer.from(s, 'hex'))
  const importSk = (e: Engine, ps: string, sk: Uint8Array) =>
    importKey(e.M, e.h, 'ML-DSA', ps, 'private', sk).handle

  it('refuses a wrong-length rnd, a supplied rnd with CKH_DETERMINISTIC_REQUIRED and an odd-sized structure (CKR_MECHANISM_PARAM_INVALID at C_SignInit)', () => {
    const { g, t } = firstCase()
    for (const e of engines) {
      const priv = importSk(e, g.parameterSet, hex(t.sk))
      expect(priv, 'ML-DSA private-key import helper').toBeGreaterThan(0)
      const tryInit = (p: Parameters<typeof allocExtSignMech>[2], len?: number) => {
        const { mech, allocs } = allocExtSignMech(e.M, CKM_ML_DSA, p, len)
        try {
          const r = signWithMech(e.M, e.h, priv, mech, hex(t.message))
          return SoftHSM.rvName(r.rv)
        } finally {
          allocs.forEach((a) => e.M._free(a))
        }
      }
      const base = {
        hedge: CKH_HEDGE_PREFERRED,
        context: hex(t.context ?? ''),
        random: hex(t.rnd),
        messageEncoding: MESSAGE_ENCODING_STANDARD,
      }
      expect(tryInit({ ...base, random: hex(t.rnd).slice(0, 31) }), `${e.name} 31-byte rnd`).toBe(
        'CKR_MECHANISM_PARAM_INVALID'
      )
      expect(tryInit({ ...base, hedge: CKH_DETERMINISTIC_REQUIRED }), `${e.name} rnd+det`).toBe(
        'CKR_MECHANISM_PARAM_INVALID'
      )
      expect(tryInit(base, SIGN_CTX_EXT_LEN - 4), `${e.name} 20-byte struct`).toBe(
        'CKR_MECHANISM_PARAM_INVALID'
      )
      expect(tryInit(base), `${e.name} well-formed control`).toBe('CKR_OK')
      e.M._C_DestroyObject(e.h, priv)
    }
  })

  it('without the value, signing stays standard: hedged output differs from NIST and verifies (SLH-DSA, both engines)', () => {
    const v = readVectors('slhdsa_siggen_optional_input_test.json')
    const g = v.testGroups.find(
      (x: { parameterSet: string; preHash: string; deterministic: boolean }) =>
        x.parameterSet === 'SLH-DSA-SHA2-128f' && x.preHash === 'pure' && !x.deterministic
    )
    const t = g.tests[0]
    const ok: string[] = []
    for (const e of engines) {
      const kp = SoftHSM.hsm_generateSLHDSAKeyPair(e.M, e.h, CKP_SLH_DSA_SHA2_128F)
      const p = {
        hedge: CKH_HEDGE_PREFERRED,
        context: hex(t.context ?? ''),
        random: null,
        messageEncoding: MESSAGE_ENCODING_STANDARD,
      }
      const a = allocExtSignMech(e.M, CKM_SLH_DSA, p)
      const s1 = signWithMech(e.M, e.h, kp.privHandle, a.mech, hex(t.message))
      const s2 = signWithMech(e.M, e.h, kp.privHandle, a.mech, hex(t.message))
      expect(s1.rv, `${e.name} sign`).toBe(CKR_OK)
      expect(Buffer.from(s1.sig!).equals(Buffer.from(s2.sig!)), `${e.name} randomised`).toBe(false)
      const vr = verifyWithMech(e.M, e.h, kp.pubHandle, a.mech, hex(t.message), s1.sig!)
      expect(vr.rv, `${e.name} verify`).toBe(CKR_OK)
      a.allocs.forEach((x) => e.M._free(x))
      ok.push(e.name)
    }
    expect(ok).toEqual(['C++', 'Rust'])
  })

  // ── All 909 upstream cases (opt-in) ─────────────────────────────────────
  const NIST_DIR = process.env.PQC_ACVP_NIST_DIR
  const UPSTREAM: [keyof OptionalInputVectors, string, string][] = [
    ['encap', 'mlkem_encap_aft_test.json', 'ML-KEM-encapDecap-FIPS203.json'],
    ['mldsaSigGen', 'mldsa_siggen_optional_input_test.json', 'ML-DSA-sigGen-FIPS204.json'],
    ['mldsaSigVer', 'mldsa_sigver_internal_test.json', 'ML-DSA-sigVer-FIPS204.json'],
    ['slhdsaSigGen', 'slhdsa_siggen_optional_input_test.json', 'SLH-DSA-sigGen-FIPS205.json'],
    ['slhdsaSigVer', 'slhdsa_sigver_internal_test.json', 'SLH-DSA-sigVer-FIPS205.json'],
  ]
  it.skipIf(!NIST_DIR)(
    'FULL: all 909 cases of the 81 in-scope NIST groups pass on both engines (PQC_ACVP_NIST_DIR)',
    async () => {
      const full: OptionalInputVectors = {}
      for (const [k, local, up] of UPSTREAM) {
        const file = path.join(NIST_DIR!, up)
        expect(existsSync(file), file).toBe(true)
        const raw = readFileSync(file)
        const mine = readVectors(local)
        expect(createHash('sha256').update(raw).digest('hex'), up).toBe(
          mine._provenance.source_sha256
        )
        const upstream = JSON.parse(raw.toString('utf8'))
        const want = new Set(mine.testGroups.map((g: { tgId: number }) => g.tgId))
        ;(full as Record<string, unknown>)[k] = {
          _provenance: mine._provenance,
          testGroups: upstream.testGroups.filter((g: { tgId: number }) => want.has(g.tgId)),
        }
      }
      const groups = UPSTREAM.reduce(
        (n, [k]) => n + (full[k] as { testGroups: unknown[] }).testGroups.length,
        0
      )
      expect(groups).toBe(81)
      for (const e of engines) {
        const rows = [
          ...(await run(e, 'ml_kem', full)),
          ...(await run(e, 'ml_dsa', full)),
          ...(await run(e, 'slh_dsa', full)),
        ]
        const bad = rows.filter((r) => r.status !== 'pass')
        expect(
          bad.map((r) => `${r.id}: ${r.details}`),
          `${e.name}: ${rows.length - bad.length}/${rows.length}`
        ).toEqual([])
        expect(rows).toHaveLength(909)
        console.warn(`[optional-input FULL] ${e.name}: ${rows.length - bad.length}/909 pass`)
      }
    },
    7_200_000
  )
})
