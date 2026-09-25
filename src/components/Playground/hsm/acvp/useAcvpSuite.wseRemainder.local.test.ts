// SPDX-License-Identifier: GPL-3.0-only
//
// KAT for the gap-closure P5 WS-E remainder sections — sections/kdfDeriveAcvp.ts
// (HKDF, SP 800-108 KBKDF, X9.63 unsupported row) and sections/ecKeyVerSigGenAcvp.ts
// (ECDSA / EdDSA keyVer, ECDSA sigGen verify-back, EdDSA sigGen) — driven through
// the REAL useAcvpSuite hook in dual-engine mode.
//
// Every engine finding is pinned row by row, so a fixed engine turns the pin red
// instead of silently changing the evidence:
//   cpp-kbkdf-counter-position-ignored, rust-kbkdf-iteration-variable-rejected,
//   cpp-ec-public-key-not-validated, rust-ec-public-key-refused-late,
//   rust-eddsa-ph-context-ignored, g8-rust-advertised-cells-do-not-execute (ECDSA SHA-224).
//
// Venue: `*.local.test.ts` — run by `npm run test:local` (local gate only).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { CategoryId, TestResult } from './useAcvpSuite'
import { evidenceForRowId } from '@/data/validation/acvpRowEvidence'

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

const ENGINES = ['C++', 'Rust'] as const
const engineOf = (r: TestResult) => (r.id.endsWith('-C++') ? 'C++' : 'Rust')
const caseKey = (r: TestResult) => r.id.replace(/-(C\+\+|Rust)$/, '')
const NEW =
  /^(hkdf-nist|kbkdf-nist|x963-kdf-unsupported|ecdsa-keyver-nist|eddsa-keyver-nist|ecdsa-siggen|eddsa-siggen-nist)-/
const macSlug = (m: string) => m.toLowerCase().replace('/', '-')

describe('P5 WS-E remainder sections — both engines, real vectors', () => {
  let results: TestResult[] = []
  beforeAll(async () => {
    cppRef.current = await loadCppEngineInNode()
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    results = await run(['kdf', 'classical'])
  }, 600_000)
  const rows = () => results.filter((r) => NEW.test(r.id))
  const row = (id: string) => results.find((r) => r.id === id)

  it('runs every new section on both engines with identical case sets', () => {
    const cpp = rows().filter((r) => engineOf(r) === 'C++')
    const rust = rows().filter((r) => engineOf(r) === 'Rust')
    // 30 HKDF + 56 KBKDF + 1 X9.63 skip + 17 keyVer + 24 × 2 ECDSA sigGen + 16 EdDSA sigGen
    expect(cpp).toHaveLength(30 + 56 + 1 + 17 + 48 + 16)
    expect(rust.map(caseKey)).toEqual(cpp.map(caseKey))
  })

  it('HKDF: every AFT byte-matches NIST dkm and every VAL-invalid dkm is not reproduced, on both engines', () => {
    const v = readVectors('hkdf_acvp_test.json')
    for (const engine of ENGINES)
      for (const g of v.testGroups)
        for (const t of g.tests) {
          const r = row(
            `hkdf-nist-${macSlug(g.kdfConfiguration.hmacAlg)}-tg${g.tgId}-tc${t.tcId}-${engine}`
          )
          expect(r?.status, `${engine} tc${t.tcId}: ${r?.details}`).toBe('pass')
          expect(r!.caseMeta?.observed).toBe(t.testPassed === false ? 'differs' : 'byte-equal')
          expect(classesOf(r!.id)).toEqual(['nist-acvp-reference-sample'])
        }
  })

  it('KBKDF: pins the per-engine layout findings exactly', () => {
    const v = readVectors('kbkdf_acvp_test.json')
    const cppFails = (g: { kdfMode: string; counterLocation: string }) =>
      g.kdfMode === 'counter'
        ? g.counterLocation !== 'before fixed data'
        : ['before iterator', 'after fixed data'].includes(g.counterLocation)
    let cppFailed = 0
    for (const g of v.testGroups)
      for (const t of g.tests) {
        const key = `kbkdf-nist-${g.kdfMode.split(' ')[0]}-${macSlug(g.macMode)}-tg${g.tgId}-tc${t.tcId}`
        const cpp = row(`${key}-C++`)!
        const rust = row(`${key}-Rust`)!
        expect(classesOf(cpp.id)).toEqual(['nist-acvp-reference-sample'])
        if (cppFails(g)) {
          cppFailed++
          expect(cpp.status, cpp.details).toBe('fail')
          expect(cpp.caseMeta?.observed).toBe('differs') // cpp-kbkdf-counter-position-ignored
        } else expect(cpp.status, cpp.details).toBe('pass')
        if (g.kdfMode === 'counter') expect(rust.status, rust.details).toBe('pass')
        else {
          // rust-kbkdf-iteration-variable-rejected
          expect(rust.status).toBe('fail')
          expect(rust.caseMeta?.observed).toBe('C_DeriveKey → CKR_MECHANISM_PARAM_INVALID')
        }
      }
    expect(cppFailed).toBe(12)
  })

  it('X9.63 on a caller-supplied Z is an explicit skip — never pass, never tiered', () => {
    for (const engine of ENGINES) {
      const r = row(`x963-kdf-unsupported-${engine}`)!
      expect(r.status).toBe('skip')
      expect(r.details).toMatch(/§6\.3\.16/)
      expect(classesOf(r.id)).toEqual([])
    }
  })

  it('keyVer: valid keys work on both; invalid points are refused by Rust (late) and accepted by C++', () => {
    for (const [file, fam] of [
      ['ecdsa_keyver_acvp_test.json', 'ecdsa'],
      ['eddsa_keyver_acvp_test.json', 'eddsa'],
    ] as const) {
      const v = readVectors(file)
      for (const g of v.testGroups)
        for (const t of g.tests) {
          const key = `${fam}-keyver-nist-${g.curve}-tg${g.tgId}-tc${t.tcId}`
          const cpp = row(`${key}-C++`)!
          const rust = row(`${key}-Rust`)!
          if (t.testPassed) {
            for (const r of [cpp, rust]) {
              expect(r.status, r.details).toBe('pass')
              expect(r.caseMeta?.observed).toBe('C_Verify → CKR_OK')
            }
          } else {
            expect(cpp.status).toBe('fail') // cpp-ec-public-key-not-validated
            expect(cpp.caseMeta?.observed).toBe('C_Verify → CKR_SIGNATURE_INVALID')
            expect(rust.status, rust.details).toBe('pass') // rust-ec-public-key-refused-late
            expect(rust.caseMeta?.observed).toBe('C_Verify → CKR_KEY_TYPE_INCONSISTENT')
          }
          expect(classesOf(cpp.id)).toEqual(['nist-acvp-reference-sample'])
        }
    }
  })

  it('ECDSA sigGen verify-back: engine round-trip + independent oracle; Rust SHA-224 does not execute', () => {
    const v = readVectors('ecdsa_siggen_acvp_test.json')
    for (const g of v.testGroups)
      for (const t of g.tests)
        for (const engine of ENGINES) {
          const base = `ecdsa-siggen-${g.curve}-${g.hashAlg.toLowerCase()}-tg${g.tgId}-tc${t.tcId}`
          const rt = row(`${base}-rt-${engine}`)!
          const or = row(`${base}-oracle-${engine}`)!
          expect(classesOf(rt.id)).toEqual(['functional-round-trip'])
          expect(classesOf(or.id)).toEqual(['independent-oracle'])
          if (engine === 'Rust' && g.hashAlg === 'SHA2-224') {
            expect(rt.status).toBe('fail') // g8-rust-advertised-cells-do-not-execute
            expect(rt.caseMeta?.observed).toBe('C_Sign → CKR_MECHANISM_INVALID')
            expect(or.status).toBe('fail')
          } else {
            expect(rt.status, rt.details).toBe('pass')
            expect(rt.caseMeta?.observed).toBe('C_Verify → CKR_OK')
            expect(or.status, or.details).toBe('pass')
          }
        }
  })

  it('EdDSA sigGen: C++ byte-matches all; Rust fails exactly the preHash cases (context ignored)', () => {
    const v = readVectors('eddsa_siggen_acvp_test.json')
    for (const g of v.testGroups)
      for (const t of g.tests) {
        const scheme = `${g.curve === 'ED-25519' ? 'Ed25519' : 'Ed448'}${g.preHash ? 'ph' : ''}`
        const key = `eddsa-siggen-nist-${scheme}-tg${g.tgId}-tc${t.tcId}`
        const cpp = row(`${key}-C++`)!
        const rust = row(`${key}-Rust`)!
        expect(cpp.status, cpp.details).toBe('pass')
        expect(classesOf(cpp.id)).toEqual(['nist-acvp-reference-sample'])
        if (g.preHash) {
          expect(rust.status).toBe('fail') // rust-eddsa-ph-context-ignored
          expect(rust.caseMeta?.observed).toBe('differs')
        } else expect(rust.status, rust.details).toBe('pass')
      }
  })
})

describe('P5 WS-E remainder sections — sabotaged expectations fail', () => {
  it('a changed dkm, keyOut and EdDSA signature are detected on both engines', async () => {
    const flipHex = (h: string) =>
      (parseInt(h.slice(0, 2), 16) ^ 0x80).toString(16).padStart(2, '0').toUpperCase() + h.slice(2)
    const hk = readVectors('hkdf_acvp_test.json')
    const hg = hk.testGroups.find((g: { testType: string }) => g.testType === 'AFT')
    hg.tests[0].dkm = flipHex(hg.tests[0].dkm)
    const kb = readVectors('kbkdf_acvp_test.json')
    const kg = kb.testGroups.find(
      (g: { kdfMode: string; counterLocation: string }) =>
        g.kdfMode === 'counter' && g.counterLocation === 'before fixed data'
    )
    kg.tests[0].keyOut = flipHex(kg.tests[0].keyOut)
    const ed = readVectors('eddsa_siggen_acvp_test.json')
    const eg = ed.testGroups.find((g: { preHash: boolean }) => !g.preHash)
    eg.tests[0].signature = flipHex(eg.tests[0].signature)

    vi.resetModules()
    vi.doMock('@/data/acvp/hkdf_acvp_test.json', () => ({ default: hk }))
    vi.doMock('@/data/acvp/kbkdf_acvp_test.json', () => ({ default: kb }))
    vi.doMock('@/data/acvp/eddsa_siggen_acvp_test.json', () => ({ default: ed }))
    try {
      const results = await run(['kdf', 'classical'])
      const row = (id: string) => results.find((r) => r.id === id)
      const scheme = `${eg.curve === 'ED-25519' ? 'Ed25519' : 'Ed448'}`
      for (const engine of ENGINES) {
        expect(
          row(
            `hkdf-nist-${macSlug(hg.kdfConfiguration.hmacAlg)}-tg${hg.tgId}-tc${hg.tests[0].tcId}-${engine}`
          )?.status
        ).toBe('fail')
        expect(
          row(
            `kbkdf-nist-counter-${macSlug(kg.macMode)}-tg${kg.tgId}-tc${kg.tests[0].tcId}-${engine}`
          )?.status
        ).toBe('fail')
        expect(
          row(`eddsa-siggen-nist-${scheme}-tg${eg.tgId}-tc${eg.tests[0].tcId}-${engine}`)?.status
        ).toBe('fail')
      }
    } finally {
      vi.doUnmock('@/data/acvp/hkdf_acvp_test.json')
      vi.doUnmock('@/data/acvp/kbkdf_acvp_test.json')
      vi.doUnmock('@/data/acvp/eddsa_siggen_acvp_test.json')
    }
  }, 600_000)
})
