// SPDX-License-Identifier: GPL-3.0-only
//
// KAT for the ML-KEM reference-sample section (sections/mlkemAcvp.ts), driven
// through the REAL useAcvpSuite hook in dual-engine mode: the C++ engine
// (Emscripten, loaded directly in Node) and the Rust engine (wasm-bindgen) each
// execute every pinned NIST ACVP-Server case. Nothing is mocked except the
// React context that hands the hook its two modules.
//
// What it proves:
//  - KeyGen from CKA_SEED byte-matches NIST ek AND dk on both engines;
//  - every NIST decapsulation VAL case (valid and modified-ciphertext) returns
//    CKR_OK with the exact NIST k, i.e. implicit rejection yields the NIST
//    rejection value;
//  - NIST key-check VAL cases: C++ rejects every invalid key; the Rust engine
//    ACCEPTS them (FINDING — pinned below so a fix or a regression both show);
//  - a product-authored ciphertext bit flip decapsulates to J(z‖c′) and never
//    to the original secret, without the secret appearing in any row text;
//  - boundary probes return exactly the CK_RV pinned for each engine;
//  - sabotage: changed expected bytes / dispositions on a COPY of the vectors
//    (vi.doMock — the tracked JSON on disk is never touched) turn exactly the
//    affected rows red.
//
// Venue: `*.local.test.ts` — excluded from the CI vitest config and run by
// `npm run test:local` (directive 2026-07-01: new suites are local-gate only).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { TestResult } from './useAcvpSuite'
import { MLKEM_BOUNDARY_PINS } from './sections/mlkemAcvp'
import { evidenceForRowId } from '@/data/validation/acvpRowEvidence'

/** Manifest evidence classes of a row (generated per-case records; [] = no record). */
const classesOf = (rowId: string) =>
  [...new Set(evidenceForRowId(rowId).map((e) => e.evidenceClass))].sort()

const require_ = createRequire(import.meta.url)
const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  const gluePath = require_.resolve('@pqctoday/softhsm-wasm/wasm/softhsm.js')
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

const runMlKem = async (): Promise<TestResult[]> => {
  const { useAcvpSuite } = await import('./useAcvpSuite')
  const { result } = renderHook(() => useAcvpSuite())
  const out = await result.current.runTests(new Set(['ml_kem']))
  await waitFor(() =>
    expect(result.current.logs.at(-1)).toMatch(/Validation Workbench run completed/)
  )
  const critical = result.current.logs.filter((l) => /Critical Error/.test(l))
  if (critical.length > 0) throw new Error(critical.join('\n'))
  return out
}

const engineOf = (r: TestResult) => (r.id.endsWith('-C++') ? 'C++' : 'Rust')
const caseKey = (r: TestResult) => r.id.replace(/-(C\+\+|Rust)$/, '')
const SECTION = /^mlkem-(keygen-seed|skip|decap-val|keycheck|implicit-reject-local|boundary)-/

describe('ML-KEM reference samples — both engines, real vectors', () => {
  let results: TestResult[] = []

  beforeAll(async () => {
    cppRef.current = await loadCppEngineInNode()
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    results = await runMlKem()
  }, 120_000)

  const section = () => results.filter((r) => SECTION.test(r.id))

  it('runs the section on both engines with identical case sets', () => {
    const cpp = section().filter((r) => engineOf(r) === 'C++')
    const rust = section().filter((r) => engineOf(r) === 'Rust')
    // 9 keyGen + 1 encapsulation skip + 12 decapsulation VAL + 12 key checks
    // + 3 implicit-rejection mutations + 7 boundary probes.
    expect(cpp).toHaveLength(44)
    expect(rust.map(caseKey)).toEqual(cpp.map(caseKey))
  })

  it('byte-matches NIST ek and dk from CKA_SEED keyGen on both engines', () => {
    const kg = readVectors('mlkem_keygen_test.json')
    for (const engine of ['C++', 'Rust'])
      for (const g of kg.testGroups)
        for (const t of g.tests) {
          const row = results.find(
            (r) => r.id === `mlkem-keygen-seed-${g.parameterSet}-tg${g.tgId}-tc${t.tcId}-${engine}`
          )
          expect(row?.status, `${engine} tc${t.tcId}: ${row?.details}`).toBe('pass')
          expect(row!.caseMeta).toMatchObject({
            observed: 'byte-equal',
            tgId: g.tgId,
            tcId: t.tcId,
          })
          expect(classesOf(row!.id)).toEqual(['nist-acvp-reference-sample'])
        }
  })

  it('decapsulates every NIST VAL case to the exact NIST k, including implicit rejection', () => {
    const val = readVectors('mlkem_encapdecap_val_test.json')
    let modified = 0
    for (const engine of ['C++', 'Rust'])
      for (const g of val.testGroups.filter(
        (x: { function: string }) => x.function === 'decapsulation'
      ))
        for (const t of g.tests) {
          const row = results.find(
            (r) => r.id === `mlkem-decap-val-${g.parameterSet}-tg${g.tgId}-tc${t.tcId}-${engine}`
          )
          expect(row?.status, `${engine} tc${t.tcId}: ${row?.details}`).toBe('pass')
          expect(row!.caseMeta?.observed).toBe('C_DecapsulateKey → CKR_OK · k byte-equal')
          expect(row!.caseMeta?.expectedReason).toBe(t.reason)
          // D1-4: no secret-dependent diagnostic in the visible text.
          expect(row!.details.toLowerCase()).not.toContain(t.k.toLowerCase().slice(0, 16))
          if (t.reason === 'modified ciphertext') modified++
        }
    expect(modified).toBe(12) // 2 per parameter set × 3 × 2 engines
  })

  it('C++ enforces the FIPS 203 key checks on every NIST VAL key', () => {
    const rows = section().filter(
      (r) => r.id.startsWith('mlkem-keycheck-') && engineOf(r) === 'C++'
    )
    expect(rows).toHaveLength(12)
    for (const r of rows) expect(r.status, `${r.testCase}: ${r.details}`).toBe('pass')
  })

  it('FINDING: the Rust engine accepts every NIST-invalid ML-KEM key (no FIPS 203 §7.2/§7.3 input check)', () => {
    const rows = section().filter(
      (r) => r.id.startsWith('mlkem-keycheck-') && engineOf(r) === 'Rust'
    )
    const failed = rows.filter((r) => r.status === 'fail')
    expect(failed.map(caseKey).sort()).toEqual(
      rows
        .filter((r) => r.caseMeta?.expected === 'rejected')
        .map(caseKey)
        .sort()
    )
    expect(failed).toHaveLength(6)
    for (const r of failed) {
      expect(r.details).toMatch(/ACCEPTED a key NIST marks invalid/)
      expect(r.caseMeta?.observed).toMatch(/→ CKR_OK$/)
    }
    // Valid keys are still accepted — the rows are not failing for another reason.
    for (const r of rows.filter((x) => x.caseMeta?.expected === 'accepted'))
      expect(r.status).toBe('pass')
  })

  it('decapsulates a product-authored ciphertext bit flip to J(z‖c′), never the original secret', () => {
    const rows = section().filter((r) => r.id.startsWith('mlkem-implicit-reject-local-'))
    expect(rows).toHaveLength(6)
    for (const r of rows) {
      expect(r.status, r.details).toBe('pass')
      expect(r.caseMeta?.observed).toBe('C_DecapsulateKey → CKR_OK · k = J(z‖c′)')
      expect(classesOf(r!.id)).not.toContain('nist-acvp-reference-sample')
      expect(r.caseMeta?.origin).toBe('product-authored-mutation')
      expect(r.details).toMatch(/not a NIST vector/)
      expect(r.details).toMatch(/values not shown/)
    }
  })

  it('returns exactly the pinned CK_RV at every PKCS#11 boundary probe, per engine', () => {
    for (const [key, pin] of Object.entries(MLKEM_BOUNDARY_PINS))
      for (const engine of ['C++', 'Rust'] as const) {
        const row = results.find((r) => r.id === `mlkem-boundary-${key}-${engine}`)
        expect(row?.status, `${engine} ${key}: ${row?.details}`).toBe('pass')
        expect(row!.caseMeta?.observed).toBe(engine === 'C++' ? pin.cpp : pin.rust)
        expect(classesOf(row!.id)).not.toContain('nist-acvp-reference-sample')
      }
    // Findings the rows must surface, not hide.
    const rustDecap = results.find((r) => r.id === 'mlkem-boundary-decap-ct-short-Rust')!
    expect(rustDecap.details).toMatch(/not among the return values PKCS#11 v3.2 §5\.18\.9 lists/)
    expect(rustDecap.details).toMatch(/engines disagree/)
    const buf = results.find((r) => r.id === 'mlkem-boundary-encap-short-buffer-C++')!
    expect(buf.details).toMatch(/\*pulCiphertextLen = 768 \(expected 768\)/)
  })

  it('reports the encapsulation AFT groups as skip — never pass, never tiered', () => {
    const skips = section().filter((r) => r.status === 'skip')
    expect(skips.map(caseKey)).toEqual(['mlkem-skip-encap-m', 'mlkem-skip-encap-m'])
    for (const r of skips) {
      expect(classesOf(r.id)).toEqual([])
      expect(r.details).toMatch(
        /^Skipped — C_EncapsulateKey .* takes no caller-supplied randomness/
      )
    }
  })

  it('agrees across engines case by case except on the recorded findings', () => {
    const byKey = new Map<string, TestResult[]>()
    for (const r of section()) byKey.set(caseKey(r), [...(byKey.get(caseKey(r)) ?? []), r])
    const disagreements: string[] = []
    for (const [key, pair] of byKey) {
      expect(pair, key).toHaveLength(2)
      if (pair[0].caseMeta?.observed !== pair[1].caseMeta?.observed) disagreements.push(key)
    }
    const boundaryDisagree = Object.entries(MLKEM_BOUNDARY_PINS)
      .filter(([, p]) => p.cpp !== p.rust)
      .map(([k]) => `mlkem-boundary-${k}`)
    const keyChecks = [...byKey.keys()].filter(
      (k) => k.startsWith('mlkem-keycheck-') && byKey.get(k)![0].caseMeta?.expected === 'rejected'
    )
    expect(disagreements.sort()).toEqual([...boundaryDisagree, ...keyChecks].sort())
  })

  it('labels the pre-existing decapsulation KAT with its encapsulation-group lineage (D1-1)', () => {
    const rows = results.filter((r) => /^test-ML-KEM-\d+-decap-/.test(r.id))
    expect(rows).toHaveLength(6)
    for (const r of rows) {
      expect(r.status, r.details).toBe('pass')
      expect(r.testCase).toMatch(
        /^Decapsulate · upstream encapsulation AFT tg\d+\/tc\d+ → local decapsulation$/
      )
      expect(r.details).toMatch(/re-used as a decapsulation KAT; upstream m → c not executed/)
      expect(r.caseMeta).toMatchObject({
        upstreamOperation: 'encapsulation',
        localOperation: 'decapsulation',
      })
    }
  })
})

// ── Sabotage: expected values changed on a COPY must turn rows red ─────────
describe('ML-KEM reference samples — sabotaged expectations fail', () => {
  it('changed ek / k bytes and a flipped key-check disposition are detected on both engines', async () => {
    const flipHex = (h: string) =>
      (parseInt(h.slice(0, 2), 16) ^ 0x80).toString(16).padStart(2, '0') + h.slice(2)
    const kg = readVectors('mlkem_keygen_test.json')
    const kgCase = kg.testGroups[0].tests[0]
    kgCase.ek = flipHex(kgCase.ek)

    const val = readVectors('mlkem_encapdecap_val_test.json')
    const decap = val.testGroups[0]
    const modCase = decap.tests.find((t: { reason: string }) => t.reason === 'modified ciphertext')
    modCase.k = flipHex(modCase.k) // claim a different implicit-rejection value
    const dkc = val.testGroups.find(
      (g: { function: string }) => g.function === 'decapsulationKeyCheck'
    )
    const validKey = dkc.tests.find((t: { testPassed: boolean }) => t.testPassed)
    validKey.testPassed = false // claim a NIST-valid key must be rejected

    vi.resetModules()
    vi.doMock('@/data/acvp/mlkem_keygen_test.json', () => ({ default: kg }))
    vi.doMock('@/data/acvp/mlkem_encapdecap_val_test.json', () => ({ default: val }))
    try {
      const results = await runMlKem()
      const row = (id: string) => results.find((r) => r.id === id)
      for (const engine of ['C++', 'Rust']) {
        const k = row(
          `mlkem-keygen-seed-${kg.testGroups[0].parameterSet}-tg${kg.testGroups[0].tgId}-tc${kgCase.tcId}-${engine}`
        )
        expect(k?.status).toBe('fail')
        expect(k?.details).toMatch(/ek: first difference at byte 0/)
        const d = row(
          `mlkem-decap-val-${decap.parameterSet}-tg${decap.tgId}-tc${modCase.tcId}-${engine}`
        )
        expect(d?.status).toBe('fail')
        expect(d?.details).toMatch(/value not shown/)
        const c = row(
          `mlkem-keycheck-dk-${dkc.parameterSet}-tg${dkc.tgId}-tc${validKey.tcId}-${engine}`
        )
        expect(c?.status).toBe('fail')
        expect(c?.details).toMatch(/ACCEPTED a key NIST marks invalid/)
      }
      // Exactly the sabotaged rows failed, plus the 6 Rust key-check findings and
      // the 12 Rust findings of the section 7c ek-check depth rows (same gap:
      // rust-mlkem-no-key-input-checks).
      const failed = results.filter((r) => r.status === 'fail')
      expect(failed).toHaveLength(6 + 6 + 12)
      expect(
        failed
          .filter((r) => r.id.startsWith('mlkem-ekcheck-depth-'))
          .every((r) => r.id.endsWith('-Rust'))
      ).toBe(true)
    } finally {
      vi.doUnmock('@/data/acvp/mlkem_keygen_test.json')
      vi.doUnmock('@/data/acvp/mlkem_encapdecap_val_test.json')
    }
  }, 120_000)
})
