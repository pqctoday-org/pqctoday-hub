// SPDX-License-Identifier: AGPL-3.0-only
//
// Real-engine proof of the EXTENDED plan profile (dispatch.ts X1–X4), local
// venue like acvp.engines.local.test.ts (`npm run test:local -- src/services/acvp`).
//
//  - Both pinned public NIST samples, in full (165 + 180 tests), through the
//    REAL C++ and Rust softhsmv3 WASM engines: 0 unsupported, 0 errors, and every
//    answer — including the 75 encapsulation tests that take NIST's m as a
//    test-only mechanism parameter and the 60 key checks read from the import
//    result — equals NIST's expectedResults.json.
//  - C++ ≡ Rust byte-identical, replay byte-identical, CLI ≡ in-process.
//  - Sabotage: an engine that drops the supplied m is detected by the probe and
//    answers NOTHING for encapsulation (never a value that could not match); a
//    flipped bit in one m is reported by the golden comparison.
import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { getSoftHSMRustModule, SOFTHSM_PRODUCT_VERSION } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { createPkcs11Engine } from './engine'
import { executePrepared, preparePrompt, responsesSemanticallyEqual, type RunOutput } from './run'
import { type JsonObject } from './ir'
import { UNSUPPORTED_REASONS, type EngineIdentity } from './dispatch'
import { loadEngineNode, type LoadedEngine } from './node/loadEngines'
import { FIXTURE_NAMES, fixturePath, readFixture, type FixtureName } from './node/fixtures'
import { validateEvidenceDocument } from './schemas/evidenceSchemas'
import goldens from './__fixtures__/goldens/goldens.json'

const repo = process.cwd()
const prompt = (n: FixtureName) => readFixture(repo, n, 'prompt.json')
const expected = (n: FixtureName) => readFixture(repo, n, 'expectedResults.json')

const BROWSER_RUST_IDENTITY: EngineIdentity = {
  id: 'rust',
  label: 'softhsmv3 Rust engine',
  implementation: 'pqctoday-hsm softhsmrustv3 (Rust), wasm-bindgen WASM (Vite loader)',
  softhsmProductVersion: SOFTHSM_PRODUCT_VERSION,
  provenanceBundle: 'softhsmrustv3-engine',
  hsmCommit: null,
  builtAt: null,
  artifactPath: null,
  artifactSha256: null,
  artifactSha256Note: 'browser code path',
}

const run = async (
  M: SoftHSMModule,
  identity: EngineIdentity,
  text: string,
  expectedText?: string
): Promise<RunOutput> => {
  const p = await preparePrompt(text, 'extended')
  if (!p.ok) throw new Error(JSON.stringify(p.diagnostics))
  const engine = createPkcs11Engine(M, identity)
  try {
    return await executePrepared(p, { engine, codePath: 'cli', appVersion: null, expectedText })
  } finally {
    engine.close()
  }
}

/** The same module, but C_EncapsulateKey loses its mechanism parameter (the engine "ignores" m). */
const dropSuppliedM = (M: SoftHSMModule): SoftHSMModule =>
  new Proxy(M, {
    get(target, key) {
      if (key === '_C_EncapsulateKey') {
        return (...a: number[]) => {
          const mech = a[1]
          target.setValue(mech + 4, 0, 'i32')
          target.setValue(mech + 8, 0, 'i32')
          return (target as unknown as Record<string, (...x: number[]) => number>)[
            '_C_EncapsulateKey'
          ](...a)
        }
      }
      const v = (target as unknown as Record<string | symbol, unknown>)[key]
      return typeof v === 'function' ? (v as (...x: unknown[]) => unknown).bind(target) : v
    },
  })

const engines: Record<
  'cpp' | 'rust-node' | 'rust-browser',
  { M: SoftHSMModule; id: EngineIdentity }
> = {} as never

beforeAll(async () => {
  const cpp: LoadedEngine = await loadEngineNode(repo, 'cpp')
  const rustNode: LoadedEngine = await loadEngineNode(repo, 'rust')
  engines.cpp = { M: cpp.module, id: cpp.identity }
  engines['rust-node'] = { M: rustNode.module, id: rustNode.identity }
  engines['rust-browser'] = {
    M: (await getSoftHSMRustModule()) as SoftHSMModule,
    id: BROWSER_RUST_IDENTITY,
  }
}, 60000)

const EXPECTED_BY_KIND: Record<FixtureName, Record<string, number>> = {
  'ML-KEM-encapDecap-FIPS203': {
    standard: 30,
    'test-input-m': 75,
    'computed-mu': 0,
    'computed-ph': 0,
    'key-import-result': 60,
  },
  'ML-DSA-sigVer-FIPS204': {
    standard: 127,
    'test-input-m': 0,
    'computed-mu': 45,
    'computed-ph': 8,
    'key-import-result': 0,
  },
}

describe.each(['cpp', 'rust-node', 'rust-browser'] as const)(
  'real %s engine, extended',
  (which) => {
    describe.each(FIXTURE_NAMES)('%s', (name) => {
      it('answers every test, all equal to NIST expectedResults, 0 unsupported, 0 errors', async () => {
        const { M, id } = engines[which]
        const out = await run(M, id, prompt(name), expected(name))
        const total = goldens.fixtures[name].counts.testCases
        expect(out.evidence.summary).toEqual({
          testCases: total,
          answered: total,
          unsupported: 0,
          error: 0,
          byInputKind: EXPECTED_BY_KIND[name],
        })
        expect(out.golden).toMatchObject({
          matched: total,
          mismatched: [],
          unanswered: 0,
          unexpected: [],
        })
        expect(validateEvidenceDocument(out.evidence)).toEqual([])
      }, 120000)

      it('replay on the same artifact is byte-identical', async () => {
        const { M, id } = engines[which]
        const a = await run(M, id, prompt(name))
        const b = await run(M, id, prompt(name))
        expect(b.response.text).toBe(a.response.text)
      }, 120000)
    })
  }
)

describe('cross-engine', () => {
  it.each(FIXTURE_NAMES)(
    'C++ and Rust produce the identical extended response for %s',
    async (name) => {
      const c = await run(engines.cpp.M, engines.cpp.id, prompt(name))
      const r = await run(engines['rust-node'].M, engines['rust-node'].id, prompt(name))
      expect(r.response.text).toBe(c.response.text)
    },
    120000
  )
})

describe('sabotage — the probe and the golden check can fail', () => {
  it.each(['cpp', 'rust-node'] as const)(
    '%s engine that drops the supplied m answers NO encapsulation test',
    async (which) => {
      const name = 'ML-KEM-encapDecap-FIPS203'
      const out = await run(
        dropSuppliedM(engines[which].M),
        engines[which].id,
        prompt(name),
        expected(name)
      )
      expect(out.evidence.summary).toMatchObject({
        testCases: 165,
        answered: 90,
        unsupported: 75,
        error: 0,
      })
      const rows = out.evidence.unsupported as Array<{ reason: string; tcIds: number[] }>
      expect(rows.every((r) => r.reason === UNSUPPORTED_REASONS.engineIgnoredSuppliedM)).toBe(true)
      expect(rows.reduce((n, r) => n + r.tcIds.length, 0)).toBe(75)
      // Nothing was invented: the answered tests still all match, the 75 are simply unanswered.
      expect(out.golden).toMatchObject({ matched: 90, mismatched: [], unanswered: 75 })
    },
    120000
  )

  it('a flipped bit in one NIST m is reported by the golden comparison', async () => {
    const name = 'ML-KEM-encapDecap-FIPS203'
    const doc = JSON.parse(prompt(name)) as JsonObject
    const encGroup = (doc.testGroups as JsonObject[]).find((g) => g.function === 'encapsulation')!
    const t = (encGroup.tests as JsonObject[])[3]
    const m = t.m as string
    t.m = `${m.slice(0, 6)}${m[6] === '0' ? '1' : '0'}${m.slice(7)}`
    for (const which of ['cpp', 'rust-node'] as const) {
      const out = await run(
        engines[which].M,
        engines[which].id,
        JSON.stringify(doc),
        expected(name)
      )
      const bad = out.golden!.mismatched
      expect(bad.length).toBeGreaterThanOrEqual(1)
      expect(bad.every((x) => x.tgId === encGroup.tgId && x.tcId === t.tcId)).toBe(true)
      expect(out.golden!.matched).toBe(164)
    }
  }, 120000)

  it('the key-check groups contain both verdicts, so the equality check above is not vacuous', async () => {
    // Guard against a vacuous check: the key-check groups contain BOTH verdicts.
    const exp = JSON.parse(expected('ML-KEM-encapDecap-FIPS203')) as JsonObject
    const verdicts = new Set<boolean>()
    for (const g of exp.testGroups as JsonObject[]) {
      for (const t of g.tests as JsonObject[]) {
        if (typeof t.testPassed === 'boolean') verdicts.add(t.testPassed)
      }
    }
    expect([...verdicts].sort()).toEqual([false, true])
  })
})

describe('CLI subprocess (--profile extended) ≡ in-process run', () => {
  it.each(FIXTURE_NAMES)(
    '%s: acvp-respond --profile extended (cpp + rust)',
    async (name) => {
      const inProcess = await run(engines['rust-node'].M, engines['rust-node'].id, prompt(name))
      for (const engine of ['cpp', 'rust'] as const) {
        const out = mkdtempSync(path.join(tmpdir(), `acvp-cli-ext-${engine}-`))
        execFileSync(
          'npx',
          [
            'tsx',
            'scripts/acvp-respond.ts',
            '--prompt',
            fixturePath(repo, name, 'prompt.json'),
            '--engine',
            engine,
            '--profile',
            'extended',
            '--out',
            out,
          ],
          { cwd: repo, stdio: 'pipe' }
        )
        const cliResponse = JSON.parse(readFileSync(path.join(out, 'response.json'), 'utf8'))
        expect(responsesSemanticallyEqual(cliResponse, inProcess.response.document)).toBe(true)
        const ev = JSON.parse(readFileSync(path.join(out, 'evidence.json'), 'utf8'))
        expect(ev.evidenceVersion).toBe('pqctoday.acvp-evidence/3')
        expect(validateEvidenceDocument(ev)).toEqual([])
      }
    },
    180000
  )

  it('the default profile of the CLI is still bounded (evidence version 2)', () => {
    const out = mkdtempSync(path.join(tmpdir(), 'acvp-cli-bounded-'))
    execFileSync(
      'npx',
      [
        'tsx',
        'scripts/acvp-respond.ts',
        '--prompt',
        fixturePath(repo, 'ML-KEM-encapDecap-FIPS203', 'prompt.json'),
        '--engine',
        'rust',
        '--out',
        out,
      ],
      { cwd: repo, stdio: 'pipe' }
    )
    const ev = JSON.parse(readFileSync(path.join(out, 'evidence.json'), 'utf8'))
    expect(ev.evidenceVersion).toBe('pqctoday.acvp-evidence/2')
    expect(ev.summary).toEqual({ testCases: 165, answered: 30, unsupported: 135, error: 0 })
  }, 120000)
})
