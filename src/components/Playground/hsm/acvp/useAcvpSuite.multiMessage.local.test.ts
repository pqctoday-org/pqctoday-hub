// SPDX-License-Identifier: GPL-3.0-only
//
// Multi-part message signing (sections/multiMessageSign.ts) on both real wasm
// engines, driven through the real useAcvpSuite hook in dual-engine mode.
// Venue: `*.local.test.ts` (local gate only).
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import type { CategoryId, TestResult } from './useAcvpSuite'
import { MULTIPART_TARGETS, multipartRowStem } from '@/data/validation/multipartTargets'

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

describe('multi-part message signing round-trip, both engines', () => {
  let rows: TestResult[] = []
  beforeAll(async () => {
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    cppRef.current = await loadCppEngineInNode()
    rows = (await run(['hashing_mac', 'classical', 'ml_dsa', 'slh_stateful'])).filter((r) =>
      r.id.startsWith('msgmp-')
    )
  }, 3_600_000)

  // Measured 2026-09-27 on the bundles built from hsm d4345f88 / 0b8b6bf8:
  // every row passes on both engines; the only skips are C++'s RIPEMD-160 HMAC
  // mechanisms, which that engine does not advertise.
  const expectedIds = (engine: string) =>
    MULTIPART_TARGETS.flatMap((t) =>
      t.paramSets.flatMap((ps) => {
        const stem = multipartRowStem(t.mechanism, ps)
        const single =
          t.mechanism === 'CKM_HASH_SLH_DSA' || t.mechanism === 'CKM_HASH_ML_DSA'
            ? [`${stem}-msg-hedged-${engine}`, `${stem}-msg-deterministic-${engine}`]
            : []
        return [...single, `${stem}-sign-${engine}`, `${stem}-verify-${engine}`]
      })
    )

  it('runs every mechanism × parameter set on both engines', () => {
    for (const engine of ['C++', 'Rust']) {
      const got = rows.filter((r) => r.id.endsWith(`-${engine}`)).map((r) => r.id)
      expect(got.sort()).toEqual(expectedIds(engine).sort())
    }
  })

  it('passes every executed row; skips only what the engine does not advertise', () => {
    const skipped = rows.filter((r) => r.status === 'skip').map((r) => r.id)
    expect(skipped.sort()).toEqual(
      [
        'msgmp-CKM_RIPEMD160_HMAC-any-sign-C++',
        'msgmp-CKM_RIPEMD160_HMAC-any-verify-C++',
        'msgmp-CKM_RIPEMD160_HMAC_GENERAL-any-sign-C++',
        'msgmp-CKM_RIPEMD160_HMAC_GENERAL-any-verify-C++',
      ].sort()
    )
    // The Rust generic HashSLH-DSA/HashML-DSA hedge-variant defect this section
    // found (12 deterministic rows) was fixed by hsm #290; measured 2026-09-27 on
    // hsm 1c5ed893: no row fails on either engine.
    expect(rows.filter((r) => r.status === 'fail').map((r) => `${r.id}: ${r.details}`)).toEqual([])
  })

  it('MACs match single-part byte for byte; verify rows refuse the changed message', () => {
    for (const r of rows.filter((x) => x.status === 'pass')) {
      if (/_HMAC(_GENERAL)?-any-sign-/.test(r.id))
        expect(r.caseMeta?.observed).toBe('MAC byte-equal to single-part')
      if (r.id.includes('-verify-'))
        expect(r.caseMeta?.observed).toMatch(/→ CKR_OK; tampered → CKR_/)
    }
  })
})
