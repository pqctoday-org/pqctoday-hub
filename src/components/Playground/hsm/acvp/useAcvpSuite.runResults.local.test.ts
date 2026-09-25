// SPDX-License-Identifier: GPL-3.0-only
//
// Records wasm RUN RESULTS for the coverage matrix (plan WS-C C-4): drives the
// REAL useAcvpSuite hook over every category in dual-engine mode — the C++
// engine (Emscripten, loaded in Node) and the Rust engine (wasm-bindgen) — and
// maps each result row to the registered case(s) in
// src/data/validation/testRegistry.ts through their rowId templates.
//
//   WRITE_RUN_RESULTS=1 npx vitest run --config vitest.local.config.ts \
//     src/components/Playground/hsm/acvp/useAcvpSuite.runResults.local.test.ts
//       → rewrites src/data/validation/run-results/wasm-node-useAcvpSuite.json
//   (without the variable) → asserts the committed file still reproduces:
//       same statuses, same artifact hashes.
//
// Host is Node.js, not a browser: the artifact (the .wasm bytes) is the one
// the inventory records, but the JS host differs — the file says so. The
// generator ignores any result whose artifact sha256 is not the one the
// mechanism inventory records, so a rebuilt engine invalidates these results
// automatically. A section's skip row (registry skipRowId) records 'skip' for
// every case of that test — its own status, never a pass; `-err-` rows and
// unregistered rows produce no result.
//
// Venue: `*.local.test.ts` — local gate only (directive 2026-07-01).
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { TEST_REGISTRY } from '@/data/validation/testRegistry'
import { caseKeyOf, type EngineId, type RunResult } from '@/data/validation/coverageModel'
import { ALL_CATEGORY_IDS, type TestResult } from './useAcvpSuite'

const require_ = createRequire(import.meta.url)
const CPP_GLUE = require_.resolve('@pqctoday/softhsm-wasm/wasm/softhsm.js')
const CPP_WASM = path.join(path.dirname(CPP_GLUE), 'softhsm.wasm')
const RUST_WASM = path.resolve(process.cwd(), 'src/wasm/softhsmrustv3_bg.wasm')
const OUT = path.resolve(
  process.cwd(),
  'src/data/validation/run-results/wasm-node-useAcvpSuite.json'
)

const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  const create = require_(CPP_GLUE) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? CPP_WASM : p) })
}
const sha256File = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

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

/** Concrete row id → registry case ids (`${testId}#${caseKey}`) for one engine. */
const rowIndex = (engineLabel: string): Map<string, string[]> => {
  const m = new Map<string, string[]>()
  for (const t of TEST_REGISTRY) {
    if (t.runner !== 'useAcvpSuite') continue
    for (const c of t.cases) {
      if (!c.rowId) continue
      const id = c.rowId.replace('{engine}', engineLabel)
      m.set(id, [...(m.get(id) ?? []), `${t.id}#${caseKeyOf(c)}`])
    }
  }
  return m
}

/** Concrete skip-row id → every registry case of the test it stands for (one engine). */
const skipRowIndex = (engineLabel: string): Map<string, string[]> => {
  const m = new Map<string, string[]>()
  for (const t of TEST_REGISTRY) {
    if (t.runner !== 'useAcvpSuite' || !t.skipRowId) continue
    m.set(
      t.skipRowId.replace('{engine}', engineLabel),
      t.cases.map((c) => `${t.id}#${caseKeyOf(c)}`)
    )
  }
  return m
}

const toRunResults = (rows: TestResult[], artifacts: Record<EngineId, string>): RunResult[] => {
  const out: RunResult[] = []
  for (const [engine, label] of [
    ['cpp', 'C++'],
    ['rust', 'Rust'],
  ] as const) {
    const index = rowIndex(label)
    const skips = skipRowIndex(label)
    for (const r of rows) {
      // A section's skip row (engine does not advertise the mechanism) is a
      // recorded 'skip' of every case of that test — its own status, never a pass.
      const skipped = r.status === 'skip' ? skips.get(r.id) : undefined
      const ids = index.get(r.id) ?? skipped
      if (!ids) continue
      const status = r.status === 'pass' ? 'pass' : r.status === 'fail' ? 'fail' : 'skip'
      for (const registryCase of ids) {
        out.push({
          engine,
          artifactKind: 'wasm',
          artifactSha256: artifacts[engine],
          registryCase,
          status,
        })
      }
    }
  }
  return out.sort((a, b) =>
    a.registryCase === b.registryCase
      ? a.engine.localeCompare(b.engine)
      : a.registryCase.localeCompare(b.registryCase)
  )
}

const runWholeSuite = async (): Promise<TestResult[]> => {
  const { useAcvpSuite } = await import('./useAcvpSuite')
  const { result } = renderHook(() => useAcvpSuite())
  const out = await result.current.runTests(new Set(ALL_CATEGORY_IDS))
  await waitFor(() => expect(result.current.logs.at(-1)).toMatch(/run completed/), {
    timeout: 60_000,
  })
  return out
}

describe('useAcvpSuite run results for the coverage matrix (both engines, real wasm)', () => {
  let rows: TestResult[] = []
  const artifacts = { cpp: sha256File(CPP_WASM), rust: sha256File(RUST_WASM) }

  beforeAll(async () => {
    cppRef.current = await loadCppEngineInNode()
    rustRef.current = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    rows = await runWholeSuite()
  }, 600_000)

  it('every registered useAcvpSuite rowId was produced for both engines', () => {
    const produced = new Set(rows.map((r) => r.id))
    for (const label of ['C++', 'Rust']) {
      for (const id of rowIndex(label).keys()) expect(produced.has(id), id).toBe(true)
    }
  })

  it(
    process.env.WRITE_RUN_RESULTS === '1'
      ? 'writes the run-results file'
      : 'reproduces the committed run-results file',
    () => {
      const results = toRunResults(rows, artifacts)
      if (process.env.WRITE_RUN_RESULTS === '1') {
        const file = {
          $comment:
            'Recorded by src/components/Playground/hsm/acvp/useAcvpSuite.runResults.local.test.ts (WRITE_RUN_RESULTS=1). One entry per registered case × engine whose useAcvpSuite row ran; a section skip row (mechanism not advertised) records skip for every case of that test; err rows produce none. Host is Node.js, not a browser. Counted by the coverage matrix only while artifactSha256 equals the mechanism inventory record.',
          schema: 'pqctoday.run-results/v1',
          runner: 'useAcvpSuite (all categories, dual engine)',
          artifactKind: 'wasm',
          host: 'Node.js via vitest local venue (not a browser)',
          environment: { node: process.version, platform: process.platform, arch: process.arch },
          hubCommit: execSync('git rev-parse HEAD').toString().trim(),
          recordedAt: new Date().toISOString().slice(0, 10),
          results,
        }
        mkdirSync(path.dirname(OUT), { recursive: true })
        writeFileSync(OUT, JSON.stringify(file, null, 2) + '\n')
        return
      }
      expect(existsSync(OUT), `${OUT} missing — run with WRITE_RUN_RESULTS=1`).toBe(true)
      const committed = JSON.parse(readFileSync(OUT, 'utf8')) as { results: RunResult[] }
      expect(results).toEqual(committed.results)
    }
  )
})
