// SPDX-License-Identifier: GPL-3.0-only
//
// PROJECT WYCHEPROOF (Google / C2SP) ML-KEM and ML-DSA vectors, driven through
// the REAL useAcvpSuite hook in dual-engine mode — sections/wycheproofPqc.ts.
// Source: https://github.com/C2SP/wycheproof @ 3fa63dd0 (Apache-2.0).
//
// What this test is for: every engine finding is pinned as a NUMBER (or an
// exact row id) per file and per Wycheproof result class, so a fixed or a
// regressed engine turns the pin red instead of silently changing published
// evidence. Measured 2026-09-30 on the bundles built from hsm 68278dfe: the
// whole ml_dsa + ml_kem run (every section, both engines) takes ~10 s in Node.
//
// Venue: `*.local.test.ts` — run by `npm run test:local` (local gate only).
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { CategoryId, TestResult } from './useAcvpSuite'
import { WYCHEPROOF_ATTRIBUTION } from './sections/wycheproofNegative'

const require_ = createRequire(import.meta.url)
const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  // process.cwd()-relative, NOT require.resolve('@pqctoday/softhsm-wasm/...'):
  // in a worktree whose node_modules is symlinked to a sibling worktree, that
  // resolution silently lands on the sibling's C++ binary.
  const gluePath = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}

const DATA = path.resolve(__dirname, '../../../../data/acvp')
const readVectors = (name: string) => JSON.parse(readFileSync(path.join(DATA, name), 'utf8'))

const cppRef: { current: SoftHSMModule | null } = { current: null }
const rustRef: { current: SoftHSMModule | null } = { current: null }

vi.mock('../HsmContext', async () => {
  const actual = await vi.importActual<typeof import('../HsmContext')>('../HsmContext')
  return {
    ...actual,
    useHsmContext: () => ({
      moduleRef: cppRef,
      rawModuleRef: cppRef,
      crossCheckModuleRef: rustRef,
      hSessionRef: { current: 0 },
      slotRef: { current: 0 },
      engineMode: 'dual' as const,
      setEngineMode: vi.fn(),
      phase: 'session_open' as const,
      setPhase: vi.fn(),
      tokenCreated: true,
      setTokenCreated: vi.fn(),
      isReady: true,
      hsmKeys: [],
      hsmKeysRef: { current: [] },
      addHsmKey: vi.fn((k) => k),
      registerKey: vi.fn((_M, _s, partial) => ({
        ...partial,
        uniqueId: 'test',
        slotId: 0,
        generatedAt: '',
      })),
      removeHsmKey: vi.fn(),
      clearHsmKeys: vi.fn(),
      addHsmLog: vi.fn(),
      addHsmStepLog: vi.fn(),
      autoInit: vi.fn().mockResolvedValue(true),
    }),
  }
})

const run = async (cats: CategoryId[]): Promise<TestResult[]> => {
  const { useAcvpSuite } = await import('./useAcvpSuite')
  const { result } = renderHook(() => useAcvpSuite())
  const out = await result.current.runTests(new Set(cats))
  await waitFor(() =>
    expect(result.current.logs.at(-1)).toMatch(/Validation Workbench run completed/)
  )
  const critical = result.current.logs.filter((l) => /Critical Error/.test(l))
  if (critical.length > 0) throw new Error(critical.join('\n'))
  return out
}

/** The 21 vendored files: row-id key → vendored file name. */
const FILES: { key: string; file: string }[] = [
  ...[512, 768, 1024].flatMap((v) => [
    { key: `mlkem${v}keygen`, file: `wycheproof_mlkem_${v}_keygen_seed_test.json` },
    { key: `mlkem${v}decaps`, file: `wycheproof_mlkem_${v}_test.json` },
    { key: `mlkem${v}semidecaps`, file: `wycheproof_mlkem_${v}_semi_expanded_decaps_test.json` },
    { key: `mlkem${v}encaps`, file: `wycheproof_mlkem_${v}_encaps_test.json` },
  ]),
  ...[44, 65, 87].flatMap((v) => [
    { key: `mldsa${v}verify`, file: `wycheproof_mldsa_${v}_verify_test.json` },
    { key: `mldsa${v}signnoseed`, file: `wycheproof_mldsa_${v}_sign_noseed_test.json` },
    { key: `mldsa${v}signseed`, file: `wycheproof_mldsa_${v}_sign_seed_test.json` },
  ]),
]

type WycResult = 'valid' | 'invalid' | 'acceptable'
const censusOf = (name: string) => {
  const v = readVectors(name) as {
    testGroups: { tests: { result: WycResult }[] }[]
    _provenance: { excluded_cases?: { count: number } }
  }
  const c = { total: 0, valid: 0, invalid: 0, acceptable: 0, excluded: 0 }
  for (const g of v.testGroups)
    for (const t of g.tests) {
      c.total += 1
      c[t.result] += 1
    }
  c.excluded = v._provenance.excluded_cases?.count ?? 0
  return c
}

describe('Project Wycheproof (Google / C2SP) ML-KEM + ML-DSA vectors, both engines', () => {
  let rows: TestResult[] = []
  let ms = 0

  beforeAll(async () => {
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    cppRef.current = await loadCppEngineInNode()
    const t0 = Date.now()
    rows = (await run(['ml_dsa', 'ml_kem'])).filter((r) => /^wyc-ml(kem|dsa)/.test(r.id))
    ms = Date.now() - t0
  }, 3_600_000)

  const of = (key: string, engine: string) =>
    rows.filter((r) => r.id.startsWith(`wyc-${key}-`) && r.id.endsWith(`-${engine}`))

  it('attributes every row to Google / C2SP with a link to the source', () => {
    expect(WYCHEPROOF_ATTRIBUTION).toContain('Google / C2SP')
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(r.details).toMatch(/Wycheproof\(Google\/C2SP\)@3fa63dd0 \S+\.json$/)
      expect(r.details).not.toMatch(/ACVP-Server@/)
      expect(r.referenceUrl).toBe('https://github.com/C2SP/wycheproof')
      expect(r.caseMeta?.origin).toBe('third-party-oracle')
      expect(r.caseMeta?.source.repo).toBe('https://github.com/C2SP/wycheproof')
      expect(r.caseMeta?.source.commit).toBe('3fa63dd0344abb611f1fb1d77e119938603ea230')
    }
  })

  it('executes every vendored case of all 21 files, on both engines, with no skips', () => {
    let total = 0
    for (const { key, file } of FILES) {
      const c = censusOf(file)
      total += c.total
      expect(c.acceptable, file).toBe(0)
      for (const engine of ['C++', 'Rust']) {
        const got = of(key, engine)
        expect(got.length, `${file} / ${engine}`).toBe(c.total)
        expect(got.filter((r) => r.status === 'skip').length, `${file} / ${engine} skips`).toBe(0)
      }
    }
    expect(total).toBe(2458)
    expect(rows.length).toBe(2 * 2458)
  })

  it('accounts for every upstream case NOT vendored (declared exclusions only)', () => {
    // valid encaps cases need the randomness m (C_EncapsulateKey has no input
    // for it); `Randomized` sign cases need rnd. Nothing else is excluded.
    const excluded = Object.fromEntries(
      FILES.map(({ key, file }) => [key, censusOf(file).excluded])
    )
    for (const v of [512, 768, 1024]) {
      expect(excluded[`mlkem${v}encaps`]).toBe(133)
      for (const k of ['keygen', 'decaps', 'semidecaps']) expect(excluded[`mlkem${v}${k}`]).toBe(0)
    }
    for (const v of [44, 65, 87]) {
      expect(excluded[`mldsa${v}verify`]).toBe(0)
      expect(excluded[`mldsa${v}signnoseed`]).toBe(1)
      expect(excluded[`mldsa${v}signseed`]).toBe(1)
    }
    expect(Object.values(excluded).reduce((a, b) => a + b, 0)).toBe(405)
  })

  it('MEASURE: per file, per engine, per Wycheproof result (written on request)', () => {
    const lines: string[] = [`ml_dsa+ml_kem run: ${(ms / 1000).toFixed(1)} s`]
    for (const { key, file } of FILES) {
      const c = censusOf(file)
      for (const engine of ['C++', 'Rust']) {
        const got = of(key, engine)
        for (const res of ['valid', 'invalid'] as WycResult[]) {
          const sub = got.filter((r) => r.caseMeta?.parameters?.wycheproofResult === res)
          lines.push(
            `${key}\t${engine}\t${res}\tfile=${c[res]}\trows=${sub.length}\tpass=${sub.filter((r) => r.status === 'pass').length}\tfail=${sub.filter((r) => r.status === 'fail').length}\tskip=${sub.filter((r) => r.status === 'skip').length}`
          )
        }
      }
    }
    const fails = rows
      .filter((r) => r.status !== 'pass')
      .map((r) => `${r.id}: ${r.status} | ${r.caseMeta?.observed} | ${r.testCase}`)
    const rvs = new Map<string, number>()
    for (const r of rows.filter((x) => x.caseMeta?.parameters?.wycheproofResult === 'invalid')) {
      const k = `${r.id.replace(/-tg.*-(C\+\+|Rust)$/, '')} ${r.id.endsWith('Rust') ? 'Rust' : 'C++'} ${String(r.caseMeta?.observed).replace(/^.*?(C_\w+(\([^)]*\))? → CKR_\w+)( \(accepted\))?$/, '$1$3')}`
      rvs.set(k, (rvs.get(k) ?? 0) + 1)
    }
    if (process.env.WYC_PQC_MEASURE_OUT)
      writeFileSync(
        process.env.WYC_PQC_MEASURE_OUT,
        JSON.stringify({ ms, rows: rows.length, lines, fails, rvs: [...rvs.entries()] }, null, 1)
      )
    expect(lines.length).toBe(1 + FILES.length * 4)
  })

  // ── PINNED ENGINE FINDINGS (measured 2026-09-30, hsm 68278dfe bundles) ────

  it('ML-KEM: both engines pass every case — keyGen, decaps, expanded-dk decaps, ek rejection', () => {
    for (const v of [512, 768, 1024])
      for (const k of ['keygen', 'decaps', 'semidecaps', 'encaps'])
        for (const engine of ['C++', 'Rust'])
          expect(
            of(`mlkem${v}${k}`, engine)
              .filter((r) => r.status !== 'pass')
              .map((r) => r.id),
            `mlkem${v}${k} / ${engine}`
          ).toEqual([])
    // Every unreduced / wrong-length ek is refused at C_CreateObject (FIPS 203
    // §7.2 check at import, hsm E3), on both engines: 128 + 132 + 136.
    for (const engine of ['C++', 'Rust']) {
      const enc = rows.filter((r) => /^wyc-mlkem\d+encaps-/.test(r.id) && r.id.endsWith(engine))
      expect(enc.length).toBe(396)
      expect(
        enc.every(
          (r) => r.caseMeta?.observed === 'C_CreateObject(ek) → CKR_ATTRIBUTE_VALUE_INVALID'
        )
      ).toBe(true)
    }
  })

  it('ML-DSA verify: both engines refuse all 404 invalid and accept all 227 valid signatures', () => {
    for (const engine of ['C++', 'Rust']) {
      const ver = rows.filter((r) => /^wyc-mldsa\d+verify-/.test(r.id) && r.id.endsWith(engine))
      expect(ver.length).toBe(631)
      expect(ver.filter((r) => r.status !== 'pass').map((r) => r.id)).toEqual([])
      const inv = ver.filter((r) => r.caseMeta?.parameters?.wycheproofResult === 'invalid')
      expect(inv.length).toBe(404)
      expect(inv.every((r) => !/→ CKR_OK/.test(r.caseMeta?.observed ?? ''))).toBe(true)
    }
  })

  it('ML-DSA sign: C++ passes every case; Rust fails exactly the 9 pinned invalid cases', () => {
    const sign = (engine: string) =>
      rows.filter((r) => /^wyc-mldsa\d+sign(no)?seed-/.test(r.id) && r.id.endsWith(engine))
    expect(sign('C++').length).toBe(501)
    expect(
      sign('C++')
        .filter((r) => r.status !== 'pass')
        .map((r) => r.id)
    ).toEqual([])
    // Rust FINDINGS (open-gaps.json: wycheproof-rust-mldsa-sk-range and
    // wycheproof-rust-mldsa-empty-seed). Each row is a Wycheproof `invalid`
    // case the Rust engine ACCEPTED and signed with; C++ refuses all nine.
    //  - InvalidPrivateKey: an expanded sk whose s1 or s2 vector is out of range
    //    is imported (C_CreateObject → CKR_OK) and used to sign. C++ refuses at
    //    C_Sign (CKR_GENERAL_ERROR).
    //  - IncorrectPrivateKeyLength, empty seed: a zero-length CKA_SEED is read as
    //    "no seed" (rust/src/crypto/handlers.rs get_attr_bytes skips
    //    ulValueLen == 0), so C_GenerateKeyPair takes the random-seed path and
    //    returns CKR_OK. C++ refuses with CKR_ATTRIBUTE_VALUE_INVALID. The 31- and
    //    33-byte seeds are refused by both.
    const RUST_FAILS = [
      'wyc-mldsa44signnoseed-tg4-tc52-Rust',
      'wyc-mldsa44signnoseed-tg5-tc53-Rust',
      'wyc-mldsa44signseed-tg22-tc84-Rust',
      'wyc-mldsa65signnoseed-tg4-tc56-Rust',
      'wyc-mldsa65signnoseed-tg5-tc57-Rust',
      'wyc-mldsa65signseed-tg24-tc91-Rust',
      'wyc-mldsa87signnoseed-tg4-tc47-Rust',
      'wyc-mldsa87signnoseed-tg5-tc48-Rust',
      'wyc-mldsa87signseed-tg24-tc82-Rust',
    ]
    const rust = sign('Rust')
    expect(rust.length).toBe(501)
    expect(
      rust
        .filter((r) => r.status !== 'pass')
        .map((r) => r.id)
        .sort()
    ).toEqual(RUST_FAILS)
    for (const id of RUST_FAILS) {
      const r = rust.find((x) => x.id === id)!
      expect(r.caseMeta?.parameters?.wycheproofResult).toBe('invalid')
      expect(r.caseMeta?.observed).toMatch(/→ CKR_OK; C_Sign → CKR_OK \(accepted\)$/)
      expect(r.details).toMatch(/ACCEPTED a case Wycheproof marks invalid/)
      const cpp = rows.find((x) => x.id === id.replace(/-Rust$/, '-C++'))!
      expect(cpp.status).toBe('pass')
    }
    for (const id of RUST_FAILS.filter((i) => i.includes('signnoseed')))
      expect(rust.find((x) => x.id === id)!.caseMeta?.parameters?.flags).toBe('InvalidPrivateKey')
    for (const id of RUST_FAILS.filter((i) => i.includes('signseed')))
      expect(rust.find((x) => x.id === id)!.caseMeta?.observed).toMatch(
        /^C_GenerateKeyPair\(CKA_SEED 0B\) → CKR_OK/
      )
  })

  it('every Wycheproof `valid` case passes on both engines (1,493 per engine)', () => {
    for (const engine of ['C++', 'Rust']) {
      const valid = rows.filter(
        (r) => r.caseMeta?.parameters?.wycheproofResult === 'valid' && r.id.endsWith(engine)
      )
      expect(valid.length).toBe(1493)
      expect(valid.filter((r) => r.status !== 'pass').map((r) => r.id)).toEqual([])
    }
  })
})

describe('Wycheproof PQC section — sabotaged expectations fail', () => {
  it('detects a changed K, a changed signature and a valid signature relabelled invalid', async () => {
    const flipHex = (h: string) =>
      (parseInt(h.slice(0, 2), 16) ^ 0x80).toString(16).padStart(2, '0') + h.slice(2)

    // 1. a `valid` ML-KEM-768 decapsulation case whose expected K no longer matches
    const kem = readVectors('wycheproof_mlkem_768_test.json')
    const kt = kem.testGroups[1].tests.find((t: { result: string }) => t.result === 'valid')
    kt.K = flipHex(kt.K)
    // 2. a `valid` ML-DSA-65 deterministic signature with one byte changed
    const sg = readVectors('wycheproof_mldsa_65_sign_noseed_test.json')
    const st = sg.testGroups[0].tests[0]
    st.sig = flipHex(st.sig)
    // 3. an ML-DSA-44 signature Wycheproof marks valid, relabelled `invalid`:
    //    both engines verify it, so the row must go red.
    const vf = readVectors('wycheproof_mldsa_44_verify_test.json')
    const vt = vf.testGroups[0].tests[0]
    vt.result = 'invalid'

    vi.resetModules()
    vi.doMock('@/data/acvp/wycheproof_mlkem_768_test.json', () => ({ default: kem }))
    vi.doMock('@/data/acvp/wycheproof_mldsa_65_sign_noseed_test.json', () => ({ default: sg }))
    vi.doMock('@/data/acvp/wycheproof_mldsa_44_verify_test.json', () => ({ default: vf }))
    try {
      const results = await run(['ml_dsa', 'ml_kem'])
      const row = (id: string) => results.find((r) => r.id === id)
      for (const engine of ['C++', 'Rust']) {
        expect(row(`wyc-mlkem768decaps-tg2-tc${kt.tcId}-${engine}`)?.status, engine).toBe('fail')
        expect(row(`wyc-mldsa65signnoseed-tg1-tc${st.tcId}-${engine}`)?.status, engine).toBe('fail')
        expect(row(`wyc-mldsa44verify-tg1-tc${vt.tcId}-${engine}`)?.status, engine).toBe('fail')
      }
    } finally {
      vi.doUnmock('@/data/acvp/wycheproof_mlkem_768_test.json')
      vi.doUnmock('@/data/acvp/wycheproof_mldsa_65_sign_noseed_test.json')
      vi.doUnmock('@/data/acvp/wycheproof_mldsa_44_verify_test.json')
    }
  }, 900_000)
})
