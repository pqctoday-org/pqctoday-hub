// SPDX-License-Identifier: GPL-3.0-only
//
// Error-path / required-operation probes (plan WS-G G-8, G-2) on BOTH real
// shipped wasm engines — the C++ engine (Emscripten, loaded in Node) and the
// Rust engine (wasm-bindgen) — and the run-results file the coverage matrix
// reads.
//
//   WRITE_RUN_RESULTS=1 npx vitest run --config vitest.local.config.ts \
//     src/wasm/pkcs11ConformanceRunner/errorPathProbes.local.test.ts
//       → rewrites src/data/validation/run-results/wasm-node-errorPathProbes.json
//   (without the variable) → asserts the committed file still reproduces.
//
// A probe whose engine return value differs from the PKCS #11 v3.2 value is a
// FINDING: it is recorded as fail (and listed in open-gaps.json), never
// loosened. What this suite does fail on: a probe that could not reach its
// assertion because the HARNESS set it up wrong on an engine that executes the
// operation elsewhere — i.e. setup failures that are not themselves findings
// (see KNOWN_SETUP_FINDINGS).
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
import { runErrorPathProbes, type ErrorPathResult } from './errorPathProbes'
import type { ErrorPathCase, ErrorPathOp, ProbeKindId } from './errorPathCatalog'

const require_ = createRequire(import.meta.url)
// process.cwd()-relative, not require.resolve('@pqctoday/softhsm-wasm/...') —
// see useAcvpSuite.runResults.local.test.ts's CPP_GLUE comment (P3 combined
// rebuild, 2026-09-25): that package resolution can silently land in a
// SIBLING worktree via a relative symlink one level inside a shared,
// symlinked node_modules, testing the wrong C++ binary with no error.
const CPP_GLUE = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
const CPP_WASM = path.join(path.dirname(CPP_GLUE), 'softhsm.wasm')
const RUST_WASM = path.resolve(process.cwd(), 'src/wasm/softhsmrustv3_bg.wasm')
const OUT = path.resolve(
  process.cwd(),
  'src/data/validation/run-results/wasm-node-errorPathProbes.json'
)
const DUMP = process.env.ERRPATH_DUMP

const sha256File = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

const loadCpp = async (): Promise<SoftHSMModule> => {
  const create = require_(CPP_GLUE) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? CPP_WASM : p) })
}

/** The registered error-path cases, back in the catalog's shape. */
const REGISTERED: ErrorPathCase[] = TEST_REGISTRY.filter(
  (t) => t.runner === 'errorPathProbes'
).flatMap((t) =>
  t.cases.map((c) => {
    const [, op, kind] = t.id.split('.')
    return {
      testId: t.id,
      caseId: c.caseId,
      mechanism: c.caseId.split('/').pop()!,
      op: op as ErrorPathOp,
      kind: kind as ProbeKindId,
      cells: c.exercises.map((e) => ({
        parameterSet: e.capability.parameterSet ?? '*',
        variant: e.capability.variant ?? '*',
      })),
    }
  })
)

const openSession = (M: SoftHSMModule) => {
  SoftHSM.hsm_initialize(M)
  const slot = SoftHSM.hsm_initToken(M, SoftHSM.hsm_getFirstFreeSlot(M), '1234', 'G8 probes')
  return { slot, session: SoftHSM.hsm_openUserSession(M, slot, '1234', '1234') }
}

describe('error-path probes on both real wasm engines', () => {
  const results: Record<EngineId, Map<string, ErrorPathResult>> = {
    cpp: new Map(),
    rust: new Map(),
  }
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
      for (const r of runErrorPathProbes(M, session, slot, { cases: REGISTERED }))
        results[engine].set(r.caseId, r) // eslint-disable-line security/detect-object-injection
    }
    if (DUMP) {
      const rows = (['cpp', 'rust'] as const).flatMap(
        (e) => [...results[e].values()].map((r) => ({ engine: e, ...r })) // eslint-disable-line security/detect-object-injection
      )
      writeFileSync(DUMP, JSON.stringify(rows, null, 1))
    }
  }, 1_800_000)

  it('registers error-path cases for every operation family the engines advertise', () => {
    const ops = new Set(REGISTERED.map((c) => c.op))
    for (const op of [
      'generate-key',
      'generate-key-pair',
      'encrypt',
      'decrypt',
      'sign',
      'verify',
      'sign-recover',
      'verify-recover',
      'digest',
      'derive',
      'wrap',
      'unwrap',
      'encapsulate',
      'decapsulate',
      'message-encrypt',
      'message-decrypt',
      'message-sign',
      'message-verify',
    ])
      expect(ops.has(op as ErrorPathOp), op).toBe(true)
  })

  it.each(['cpp', 'rust'] as const)(
    '%s: every registered case produced a result (none silently dropped)',
    (engine) => {
      expect(results[engine].size).toBe(REGISTERED.length) // eslint-disable-line security/detect-object-injection
    }
  )

  it(
    process.env.WRITE_RUN_RESULTS === '1'
      ? 'writes the errorPathProbes run-results file'
      : 'reproduces the committed errorPathProbes run-results file',
    () => {
      const recorded: RunResult[] = TEST_REGISTRY.filter((t) => t.runner === 'errorPathProbes')
        .flatMap((t) =>
          t.cases.flatMap((c) =>
            t.engines.map((engine) => {
              const r = results[engine].get(c.caseId)! // eslint-disable-line security/detect-object-injection
              return {
                engine,
                artifactKind: 'wasm' as const,
                artifactSha256: artifacts[engine], // eslint-disable-line security/detect-object-injection
                registryCase: `${t.id}#${caseKeyOf(c)}`,
                status: r.status === 'pass' ? 'pass' : r.status === 'fail' ? 'fail' : 'skip',
              } satisfies RunResult
            })
          )
        )
        .sort((a, b) =>
          a.registryCase === b.registryCase
            ? a.engine.localeCompare(b.engine)
            : a.registryCase.localeCompare(b.registryCase)
        )
      if (process.env.WRITE_RUN_RESULTS === '1') {
        const file = {
          $comment:
            'Recorded by src/wasm/pkcs11ConformanceRunner/errorPathProbes.local.test.ts (WRITE_RUN_RESULTS=1). One entry per registered error-path / required-operation case x engine. A case runs every probed parameter set / sign variant the engine advertises and passes only if all of them return the PKCS #11 v3.2 value; skip = the engine advertises none of the case cells. fail = the engine returned a different CK_RV or could not complete a precondition (see open-gaps.json). Host is Node.js, not a browser. Counted by the coverage matrix only while artifactSha256 equals the mechanism inventory record.',
          schema: 'pqctoday.run-results/v1',
          runner: 'errorPathProbes (every registered error-path case, dual engine)',
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
