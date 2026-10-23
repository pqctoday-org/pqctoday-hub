// SPDX-License-Identifier: AGPL-3.0-only
//
// Sabotage proof for the gap-closure P5 PQC coverage sections, split out of
// useAcvpSuite.pqcCoverage.local.test.ts so the two long runs (that file's
// shared run, and this file's sabotaged re-run) execute in parallel in the
// local gate. Same test, same assertions, same name.
//
// A flipped NIST disposition, pk byte and sigGen signature, on a COPY of the
// vectors (vi.doMock), turns exactly those rows red on both engines.
//
// Venue: `*.local.test.ts` — run by `npm run test:local` (local gate only).

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { CategoryId, TestResult } from './useAcvpSuite'

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

const run = async (cats: CategoryId[]): Promise<TestResult[]> => {
  const { useAcvpSuite } = await import('./useAcvpSuite')
  const { result } = renderHook(() => useAcvpSuite())
  let out: TestResult[] = []
  await act(async () => {
    out = await result.current.runTests(new Set(cats))
  })
  await waitFor(() =>
    expect(result.current.logs.at(-1)).toMatch(/Validation Workbench run completed/)
  )
  const critical = result.current.logs.filter((l) => /Critical Error/.test(l))
  if (critical.length > 0) throw new Error(critical.join('\n'))
  return out
}

const caseKey = (r: TestResult) => r.id.replace(/-(C\+\+|Rust)$/, '')
const NEW =
  /^(mldsa-sigver-depth|mldsa-negbound|mlkem-ekcheck-depth|slhdsa-keygen-seed|slhdsa-siggen-ctx0|slhdsa-cov)-/

describe('P5 PQC coverage sections — sabotaged expectations fail', () => {
  beforeAll(async () => {
    cppRef.current = await loadCppEngineInNode()
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
  }, 600_000)

  it('a flipped NIST disposition, pk byte and sigGen signature are detected on both engines', async () => {
    const flipHex = (h: string) =>
      (parseInt(h.slice(0, 2), 16) ^ 0x80).toString(16).padStart(2, '0').toUpperCase() + h.slice(2)
    const sv = readVectors('mldsa_sigver_depth_test.json')
    const svCase = sv.testGroups[0].tests[0]
    svCase.testPassed = !svCase.testPassed
    const kg = readVectors('slhdsa_keygen_test.json')
    const kgCase = kg.testGroups[0].tests[0]
    kgCase.pk = flipHex(kgCase.pk)
    const c0 = readVectors('slhdsa_siggen_ctx0_test.json')
    const c0Case = c0.testGroups[0].tests[0]
    c0Case.signature = flipHex(c0Case.signature)

    vi.resetModules()
    vi.doMock('@/data/acvp/mldsa_sigver_depth_test.json', () => ({ default: sv }))
    vi.doMock('@/data/acvp/slhdsa_keygen_test.json', () => ({ default: kg }))
    vi.doMock('@/data/acvp/slhdsa_siggen_ctx0_test.json', () => ({ default: c0 }))
    try {
      const results = (await run(['ml_dsa', 'slh_stateful'])).filter((r) => NEW.test(r.id))
      const failed = results.filter((r) => r.status === 'fail')
      expect(failed.map(caseKey).sort()).toEqual(
        [
          `mldsa-sigver-depth-${sv.testGroups[0].parameterSet}-tg${sv.testGroups[0].tgId}-tc${svCase.tcId}`,
          `slhdsa-keygen-seed-${kg.testGroups[0].parameterSet}-tg${kg.testGroups[0].tgId}-tc${kgCase.tcId}`,
          `slhdsa-siggen-ctx0-${c0.testGroups[0].parameterSet}-tg${c0.testGroups[0].tgId}-tc${c0Case.tcId}`,
        ]
          .flatMap((k) => [k, k])
          .sort()
      )
    } finally {
      vi.doUnmock('@/data/acvp/mldsa_sigver_depth_test.json')
      vi.doUnmock('@/data/acvp/slhdsa_keygen_test.json')
      vi.doUnmock('@/data/acvp/slhdsa_siggen_ctx0_test.json')
    }
    // 1_200_000 for the same measured reason as the beforeAll above: this
    // sabotage proof re-runs ml_dsa + slh_stateful, measured at ~580s of the
    // old 600_000 budget (whole-file duration 1179.9s, of which 599.1s is the
    // beforeAll). A sabotage proof that dies on its own timeout proves
    // nothing, so it gets the same 2x headroom.
  }, 1_200_000)
})
