// SPDX-License-Identifier: GPL-3.0-only
//
// Every registered katRunner case (src/data/validation/testRegistry.ts, each
// with its KatKind) run through the REAL runKAT on BOTH shipped wasm engines —
// the C++ engine (Emscripten, loaded in Node) and the Rust engine
// (wasm-bindgen). katRunner.test.ts mocks the engine and the vectors, so it
// could not see that five kinds failed on the engine that runs them
// (2026-09-24: aescbc-decrypt used CBC_PAD on an unpadded NIST sample,
// hmac-verify/-generate used the non-truncating mechanism, pbkdf2-derive ran a
// c=1 case the Rust engine refuses, aes-kwp-wrap imported a 20-byte AES key)
// or that the SUCI Profile B steps 4/6/7 passed without checking anything.
// This suite asserts a real pass on both engines for every registered case.
//
//   WRITE_RUN_RESULTS=1 npx vitest run --config vitest.local.config.ts \
//     src/utils/katRunner.engines.local.test.ts
//       → rewrites src/data/validation/run-results/wasm-node-katRunner.json
//   (without the variable) → asserts the committed file still reproduces.
//
// Recorded results cover only the engines a katRunner test is registered for
// (Rust: KATView, KatValidationPanel and the mobile view all use useHSM()'s
// default engine); the C++ pass is asserted here but not recorded.
//
// Venue: `*.local.test.ts` — local gate only (directive 2026-07-01).
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { TEST_REGISTRY } from '@/data/validation/testRegistry'
import { caseKeyOf, type EngineId, type RunResult } from '@/data/validation/coverageModel'
import { runKAT, type KatKind, type KATResult } from './katRunner'

const require_ = createRequire(import.meta.url)
const CPP_GLUE = require_.resolve('@pqctoday/softhsm-wasm/wasm/softhsm.js')
const CPP_WASM = path.join(path.dirname(CPP_GLUE), 'softhsm.wasm')
const RUST_WASM = path.resolve(process.cwd(), 'src/wasm/softhsmrustv3_bg.wasm')
const OUT = path.resolve(process.cwd(), 'src/data/validation/run-results/wasm-node-katRunner.json')

const sha256File = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

const loadCpp = async (): Promise<SoftHSMModule> => {
  const create = require_(CPP_GLUE) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? CPP_WASM : p) })
}

interface KatCase {
  registryCase: string
  engines: EngineId[]
  kind: KatKind
}
const CASES: KatCase[] = TEST_REGISTRY.filter((t) => t.runner === 'katRunner').flatMap((t) =>
  t.cases.map((c) => {
    if (!c.katKind) throw new Error(`${t.id}#${caseKeyOf(c)} has no katKind`)
    return {
      registryCase: `${t.id}#${caseKeyOf(c)}`,
      engines: t.engines,
      kind: c.katKind as unknown as KatKind,
    }
  })
)

const openSession = (M: SoftHSMModule) => {
  SoftHSM.hsm_initialize(M)
  const slot = SoftHSM.hsm_initToken(M, SoftHSM.hsm_getFirstFreeSlot(M), '1234', 'KAT engines')
  return { slot, session: SoftHSM.hsm_openUserSession(M, slot, '1234', '1234') }
}

describe('every registered katRunner case passes on both real wasm engines', () => {
  const results: Record<EngineId, Map<string, KATResult>> = { cpp: new Map(), rust: new Map() }
  const artifacts: Record<EngineId, string> = {
    cpp: sha256File(CPP_WASM),
    rust: sha256File(RUST_WASM),
  }

  beforeAll(async () => {
    for (const [engine, load] of [
      ['cpp', loadCpp],
      ['rust', async () => (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule],
    ] as const) {
      const M = await load()
      const { slot, session } = openSession(M)
      const advertised = new Set(SoftHSM.hsm_getMechanismList(M, slot))
      for (const c of CASES) {
        const r = await runKAT(
          M,
          session,
          {
            id: c.registryCase,
            useCase: c.registryCase,
            standard: '',
            referenceUrl: '',
            kind: c.kind,
          },
          { advertised }
        )
        results[engine].set(c.registryCase, r) // eslint-disable-line security/detect-object-injection
      }
    }
  }, 600_000)

  it('registers enough katRunner cases to mean something', () => {
    expect(CASES.length).toBeGreaterThan(80)
  })

  it.each(['cpp', 'rust'] as const)('%s: every case passes (no fail, error or skip)', (engine) => {
    const bad = CASES.map((c) => ({ c, r: results[engine].get(c.registryCase)! })) // eslint-disable-line security/detect-object-injection
      .filter(({ r }) => r.status !== 'pass')
      .map(({ c, r }) => `${c.registryCase}: ${r.status} — ${r.details}`)
    expect(bad).toEqual([])
  })

  it(
    process.env.WRITE_RUN_RESULTS === '1'
      ? 'writes the katRunner run-results file'
      : 'reproduces the committed katRunner run-results file',
    () => {
      const recorded: RunResult[] = CASES.flatMap((c) =>
        c.engines.map((engine) => {
          const r = results[engine].get(c.registryCase)! // eslint-disable-line security/detect-object-injection
          return {
            engine,
            artifactKind: 'wasm' as const,
            artifactSha256: artifacts[engine], // eslint-disable-line security/detect-object-injection
            registryCase: c.registryCase,
            status: r.status === 'pass' ? 'pass' : r.status === 'skip' ? 'skip' : 'fail',
          } satisfies RunResult
        })
      ).sort((a, b) =>
        a.registryCase === b.registryCase
          ? a.engine.localeCompare(b.engine)
          : a.registryCase.localeCompare(b.registryCase)
      )
      if (process.env.WRITE_RUN_RESULTS === '1') {
        const file = {
          $comment:
            'Recorded by src/utils/katRunner.engines.local.test.ts (WRITE_RUN_RESULTS=1). One entry per registered katRunner case x the engines its test is registered for (Rust: the engine the KAT surfaces use); runKAT gets the engine mechanism list, so a missing mechanism records skip, never pass. Host is Node.js, not a browser. Counted by the coverage matrix only while artifactSha256 equals the mechanism inventory record.',
          schema: 'pqctoday.run-results/v1',
          runner: 'katRunner (every registered KatKind)',
          artifactKind: 'wasm',
          host: 'Node.js via vitest local venue (not a browser)',
          environment: { node: process.version, platform: process.platform, arch: process.arch },
          hubCommit: execSync('git rev-parse HEAD').toString().trim(),
          recordedAt: new Date().toISOString().slice(0, 10),
          results: recorded,
        }
        writeFileSync(OUT, JSON.stringify(file, null, 2) + '\n')
        return
      }
      expect(existsSync(OUT), `${OUT} missing — run with WRITE_RUN_RESULTS=1`).toBe(true)
      const committed = JSON.parse(readFileSync(OUT, 'utf8')) as { results: RunResult[] }
      expect(recorded).toEqual(committed.results)
    }
  )
})
