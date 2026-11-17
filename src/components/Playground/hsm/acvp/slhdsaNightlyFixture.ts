// SPDX-License-Identifier: AGPL-3.0-only
// Each nightly file runs in its own fork; engine references and vector mocks stay process-local.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { expect, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { TestResult } from './useAcvpSuite'
import { evidenceForRowId } from '@/data/validation/acvpRowEvidence.static'

/** Manifest evidence classes of a row (generated per-case records; [] = no record). */
export const classesOf = (rowId: string) =>
  [...new Set(evidenceForRowId(rowId).map((e) => e.evidenceClass))].sort()

/**
 * Keep the existing 25-minute local per-pass budget. The nightly workflow can
 * override it with SLHDSA_BUDGET_MS for its runner; parallelism does not relax
 * assertions or time limits.
 */
export const BUDGET_MS = Number(process.env.SLHDSA_BUDGET_MS ?? 1_500_000)

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
export const readVectors = (name: string) => JSON.parse(readFileSync(path.join(DATA, name), 'utf8'))

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

export const runSlh = async (label: string): Promise<TestResult[]> => {
  const started = performance.now()
  // eslint-disable-next-line no-console -- elapsed phase progress for the long-running vector suite
  console.info(`[SLH-DSA ${label}] starting both engines in worker ${process.pid}`)
  const { useAcvpSuite } = await import('./useAcvpSuite')
  const { result } = renderHook(() => useAcvpSuite())
  let out: TestResult[] = []
  await act(async () => {
    out = await result.current.runTests(new Set(['slh_stateful']))
  })
  await waitFor(() =>
    expect(result.current.logs.at(-1)).toMatch(/Validation Workbench run completed/)
  )
  const critical = result.current.logs.filter((l) => /Critical Error/.test(l))
  if (critical.length > 0) throw new Error(critical.join('\n'))
  // eslint-disable-next-line no-console -- elapsed phase progress for the long-running vector suite
  console.info(
    `[SLH-DSA ${label}] completed ${out.length} rows in ${((performance.now() - started) / 1000).toFixed(1)}s, worker ${process.pid}`
  )
  return out
}

export const engineOf = (r: TestResult) => (r.id.endsWith('-C++') ? 'C++' : 'Rust')
export const caseKey = (r: TestResult) => r.id.replace(/-(C\+\+|Rust)$/, '')
export const SECTION = /^slhdsa-(sigver-nist|siggen-det|sigver-local|probe|skip)-/
export const SV_FILES = ['slhdsa_sigver_sha2_test.json', 'slhdsa_sigver_shake_test.json']

export async function initializeNightlyEngines(): Promise<void> {
  cppRef.current = await loadCppEngineInNode()
  rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
}
