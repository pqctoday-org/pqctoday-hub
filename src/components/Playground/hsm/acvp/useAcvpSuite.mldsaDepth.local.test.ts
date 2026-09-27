// SPDX-License-Identifier: GPL-3.0-only
//
// KAT for the ML-DSA context / message-length / pre-hash depth section
// (sections/mldsaDepth.ts, WS-D D2-6), driven through the REAL useAcvpSuite
// hook in dual-engine mode (C++ Emscripten engine in Node + Rust wasm-bindgen).
//
// What it proves:
//  - deterministic SigGen byte-matches NIST at context 0 and 255 bytes, for
//    8192-byte messages, and for every HashML-DSA function PKCS#11 v3.2 defines
//    (together with section 5d's three), on both engines;
//  - the product-authored 1-byte context signs, verifies with that context and
//    is rejected without it; C++ and Rust produce the SAME deterministic
//    signature (differential evidence, recorded as a fingerprint);
//  - a 256-byte context is refused at C_SignInit and C_VerifyInit with the
//    exact code pinned per engine (the engines disagree; both codes are listed);
//  - sabotage on a COPY of the vectors (vi.doMock) turns exactly those rows red.
//
// Venue: `*.local.test.ts` — run by `npm run test:local` (local gate only).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { TestResult } from './useAcvpSuite'
import { MLDSA_CTX256_PINS } from './sections/mldsaDepth'
import { acvpHashToMech } from './sections/mldsaAcvp'
import { evidenceForRowId } from '@/data/validation/acvpRowEvidence.static'

/** Manifest evidence classes of a row (generated per-case records; [] = no record). */
const classesOf = (rowId: string) =>
  [...new Set(evidenceForRowId(rowId).map((e) => e.evidenceClass))].sort()

const require_ = createRequire(import.meta.url)
const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  // process.cwd()-relative, NOT require.resolve('@pqctoday/softhsm-wasm/...'):
  // that file: package resolves through node_modules, and in a worktree whose
  // node_modules is itself symlinked to a SIBLING worktree (a real, supported
  // setup), a relative symlink one level inside that shared node_modules
  // resolves relative to where IT lives, silently landing on the sibling
  // worktree's src/vendor/softhsm-wasm instead of this one's -- probing the
  // wrong C++ binary with no error (found 2026-09-25, P3 combined rebuild).
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

const runMlDsa = async (): Promise<TestResult[]> => {
  const { useAcvpSuite } = await import('./useAcvpSuite')
  const { result } = renderHook(() => useAcvpSuite())
  const out = await result.current.runTests(new Set(['ml_dsa']))
  await waitFor(() =>
    expect(result.current.logs.at(-1)).toMatch(/Validation Workbench run completed/)
  )
  const critical = result.current.logs.filter((l) => /Critical Error/.test(l))
  if (critical.length > 0) throw new Error(critical.join('\n'))
  return out
}

const engineOf = (r: TestResult) => (r.id.endsWith('-C++') ? 'C++' : 'Rust')
const caseKey = (r: TestResult) => r.id.replace(/-(C\+\+|Rust)$/, '')

describe('ML-DSA depth (D2-6) — both engines, real vectors', () => {
  let results: TestResult[] = []

  beforeAll(async () => {
    cppRef.current = await loadCppEngineInNode()
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    results = await runMlDsa()
  }, 120_000)

  const section = () => results.filter((r) => r.id.startsWith('mldsa-depth-'))

  it('runs the section on both engines with identical case sets', () => {
    const cpp = section().filter((r) => engineOf(r) === 'C++')
    const rust = section().filter((r) => engineOf(r) === 'Rust')
    // 9 context/message + 7 pre-hash deterministic sigGen + 3 probes + 1 skip
    expect(cpp).toHaveLength(20)
    expect(rust.map(caseKey)).toEqual(cpp.map(caseKey))
  })

  it('byte-matches NIST deterministic SigGen at every recorded context/message length and hash', () => {
    for (const file of ['mldsa_siggen_ctxmsg_test.json', 'mldsa_siggen_prehash_test.json']) {
      const v = readVectors(file)
      for (const engine of ['C++', 'Rust'])
        for (const g of v.testGroups)
          for (const t of g.tests) {
            const row = results.find(
              (r) =>
                r.id === `mldsa-depth-siggen-${g.parameterSet}-tg${g.tgId}-tc${t.tcId}-${engine}`
            )
            expect(row?.status, `${engine} tc${t.tcId}: ${row?.details}`).toBe('pass')
            expect(row!.caseMeta).toMatchObject({
              observed: 'byte-equal',
              contextBytes: (t.context ?? '').length / 2,
              messageBytes: t.message.length / 2,
              hashAlg: t.hashAlg,
            })
            expect(classesOf(row!.id)).toEqual(['nist-acvp-reference-sample'])
          }
    }
    const pure = section().filter(
      (r) => r.caseMeta?.mode === 'pure' && r.caseMeta.origin === 'nist-acvp-server'
    )
    for (const ps of ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87']) {
      const mine = pure.filter((r) => r.caseMeta!.parameterSet === ps)
      expect(mine.map((r) => r.caseMeta!.contextBytes)).toEqual(expect.arrayContaining([0, 255]))
    }
    expect(pure.some((r) => r.caseMeta!.messageBytes === 8192)).toBe(true)
  })

  it('covers every PKCS#11 v3.2 HashML-DSA function together with section 5d', () => {
    const covered = new Set(
      results
        .filter(
          (r) =>
            /^mldsa-(depth-)?siggen-/.test(r.id) &&
            r.caseMeta?.mode === 'preHash' &&
            r.status === 'pass'
        )
        .map((r) => r.caseMeta!.hashAlg)
    )
    expect([...covered].sort()).toEqual(Object.keys(acvpHashToMech()).sort())
  })

  it('signs with a 1-byte context, binds it, and produces the same signature on both engines', () => {
    const rows = ['C++', 'Rust'].map((e) =>
      results.find((r) => r.id === `mldsa-depth-probe-ctx1-${e}`)!
    )
    for (const r of rows) {
      expect(r.status, r.details).toBe('pass')
      expect(r.caseMeta?.observed).toMatch(
        /^verify ctx1 CKR_OK; verify ctx0 CKR_SIGNATURE_INVALID; sha256:[0-9a-f]{16}$/
      )
      expect(classesOf(r!.id)).not.toContain('nist-acvp-reference-sample')
      expect(r.caseMeta?.contextBytes).toBe(1)
    }
    expect(rows[0].caseMeta?.observed).toBe(rows[1].caseMeta?.observed) // differential agreement
  })

  it('refuses a 256-byte context at C_SignInit and C_VerifyInit with the pinned code (both engines agree since E9/D6)', () => {
    for (const op of ['sign', 'verify'] as const)
      for (const engine of ['C++', 'Rust'] as const) {
        const r = results.find((x) => x.id === `mldsa-depth-probe-ctx256-${op}-${engine}`)!
        expect(r.status, r.details).toBe('pass')
        expect(r.caseMeta?.observed).toBe(
          engine === 'C++' ? MLDSA_CTX256_PINS[op].cpp : MLDSA_CTX256_PINS[op].rust
        )
        expect(r.details).not.toMatch(/engines disagree/)
      }
  })

  it('reports the only NIST 1-byte-context case as skip — never pass, never tiered', () => {
    const skips = section().filter((r) => r.status === 'skip')
    expect(skips.map(caseKey)).toEqual(['mldsa-depth-skip-ctx1-nist', 'mldsa-depth-skip-ctx1-nist'])
    for (const r of skips) {
      expect(classesOf(r.id)).toEqual([])
      expect(r.caseMeta).toMatchObject({ tgId: 16, tcId: 239, hashAlg: 'SHA2-512/256' })
    }
  })
})

describe('ML-DSA depth (D2-6) — sabotaged expectations fail', () => {
  it('changed expected signature bytes are detected on both engines', async () => {
    const flipLast = (h: string) =>
      h.slice(0, -2) + (parseInt(h.slice(-2), 16) ^ 0x01).toString(16).padStart(2, '0')
    const cm = readVectors('mldsa_siggen_ctxmsg_test.json')
    const cmCase = cm.testGroups[0].tests[0]
    cmCase.signature = flipLast(cmCase.signature)
    const ph = readVectors('mldsa_siggen_prehash_test.json')
    const phCase = ph.testGroups[2].tests[0]
    phCase.signature = flipLast(phCase.signature)

    vi.resetModules()
    vi.doMock('@/data/acvp/mldsa_siggen_ctxmsg_test.json', () => ({ default: cm }))
    vi.doMock('@/data/acvp/mldsa_siggen_prehash_test.json', () => ({ default: ph }))
    try {
      const results = await runMlDsa()
      const failed = results.filter((r) => r.status === 'fail')
      expect(failed.map(caseKey).sort()).toEqual(
        [
          `mldsa-depth-siggen-${cm.testGroups[0].parameterSet}-tg${cm.testGroups[0].tgId}-tc${cmCase.tcId}`,
          `mldsa-depth-siggen-${cm.testGroups[0].parameterSet}-tg${cm.testGroups[0].tgId}-tc${cmCase.tcId}`,
          `mldsa-depth-siggen-${ph.testGroups[2].parameterSet}-tg${ph.testGroups[2].tgId}-tc${phCase.tcId}`,
          `mldsa-depth-siggen-${ph.testGroups[2].parameterSet}-tg${ph.testGroups[2].tgId}-tc${phCase.tcId}`,
        ].sort()
      )
      for (const r of failed)
        expect(r.details).toMatch(/signature mismatch: first difference at byte/)
    } finally {
      vi.doUnmock('@/data/acvp/mldsa_siggen_ctxmsg_test.json')
      vi.doUnmock('@/data/acvp/mldsa_siggen_prehash_test.json')
    }
  }, 120_000)
})
