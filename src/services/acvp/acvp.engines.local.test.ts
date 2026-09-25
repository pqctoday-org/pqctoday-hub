// SPDX-License-Identifier: GPL-3.0-only
//
// WS-F real-engine proof (local venue: `npm run test:local -- src/services/acvp`,
// per the 2026-07-01 directive that real-WASM suites are local-only).
//
//  - Both pinned public NIST fixtures run through the REAL C++ and Rust
//    softhsmv3 WASM engines via PKCS#11; every answered test matches NIST
//    expectedResults.json and the committed golden response.
//  - F-7: same prompt + same artifact → byte-identical response.json on
//    repeat, and C++ ≡ Rust (both operations are deterministic).
//  - F-8: the CLI (spawned as a real subprocess) and the browser code path
//    (Rust module from getSoftHSMRustModule(), i.e. the Vite-bundled loader the
//    panel uses) produce semantically identical responses.
//  - Sabotage: a flipped signature byte / ciphertext byte changes the engine's
//    answer and the golden comparison reports it — the check can fail.
import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { getSoftHSMRustModule, SOFTHSM_PRODUCT_VERSION } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { createPkcs11Engine } from './engine'
import { executePrepared, preparePrompt, responsesSemanticallyEqual, type RunOutput } from './run'
import { canonicalJson, sha256Hex, type JsonObject } from './ir'
import type { EngineIdentity } from './dispatch'
import { loadEngineNode, type LoadedEngine } from './node/loadEngines'
import { FIXTURE_NAMES, fixturePath, readFixture, type FixtureName } from './node/fixtures'
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
  const p = await preparePrompt(text)
  if (!p.ok) throw new Error(JSON.stringify(p.diagnostics))
  const engine = createPkcs11Engine(M, identity)
  try {
    return await executePrepared(p, { engine, codePath: 'cli', appVersion: null, expectedText })
  } finally {
    engine.close()
  }
}

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

describe.each(['cpp', 'rust-node', 'rust-browser'] as const)('real %s engine', (which) => {
  describe.each(FIXTURE_NAMES)('%s', (name) => {
    it('answers every executable test, all matching NIST expectedResults, 0 errors', async () => {
      const { M, id } = engines[which]
      const out = await run(M, id, prompt(name), expected(name))
      const g = goldens.fixtures[name]
      const s = out.evidence.summary as JsonObject
      expect(s).toEqual({
        testCases: g.counts.testCases,
        answered: g.counts.planExecute,
        unsupported: g.counts.planUnsupported,
        error: 0,
      })
      expect(out.golden).toMatchObject({
        matched: g.counts.planExecute,
        mismatched: [],
        unexpected: [],
        unanswered: g.counts.planUnsupported,
      })
      expect(await sha256Hex(canonicalJson(out.response.document))).toBe(g.responseCanonicalSha256)
    }, 60000)

    it('F-7: replay on the same artifact is byte-identical', async () => {
      const { M, id } = engines[which]
      const a = await run(M, id, prompt(name))
      const b = await run(M, id, prompt(name))
      expect(b.response.text).toBe(a.response.text)
      expect(b.responseSha256).toBe(a.responseSha256)
    }, 60000)
  })
})

describe('cross-engine', () => {
  it.each(FIXTURE_NAMES)(
    'F-7: C++ and Rust produce the identical response for %s',
    async (name) => {
      const c = await run(engines.cpp.M, engines.cpp.id, prompt(name))
      const r = await run(engines['rust-node'].M, engines['rust-node'].id, prompt(name))
      expect(r.response.text).toBe(c.response.text)
    },
    60000
  )
})

describe('sabotage — the real engines and the golden check can fail', () => {
  it('a flipped byte in a valid ML-DSA signature turns testPassed true → false (mismatch reported)', async () => {
    const doc = JSON.parse(prompt('ML-DSA-sigVer-FIPS204')) as JsonObject
    const exp = JSON.parse(expected('ML-DSA-sigVer-FIPS204')) as JsonObject
    const g0 = (exp.testGroups as JsonObject[])[0]
    const validTc = (g0.tests as JsonObject[]).find((t) => t.testPassed === true)!.tcId
    const t = ((doc.testGroups as JsonObject[])[0].tests as JsonObject[]).find(
      (x) => x.tcId === validTc
    )!
    const sig = t.signature as string
    t.signature = `${sig.slice(0, 20)}${sig[20] === '0' ? '1' : '0'}${sig.slice(21)}`
    for (const which of ['cpp', 'rust-node'] as const) {
      const out = await run(
        engines[which].M,
        engines[which].id,
        JSON.stringify(doc),
        expected('ML-DSA-sigVer-FIPS204')
      )
      expect(out.golden!.mismatched).toEqual([
        { tgId: g0.tgId, tcId: validTc, field: 'testPassed', expected: true, actual: false },
      ])
    }
  }, 60000)

  it('a flipped ciphertext byte changes k (implicit rejection) and the mismatch is reported', async () => {
    const doc = JSON.parse(prompt('ML-KEM-encapDecap-FIPS203')) as JsonObject
    const decap = (doc.testGroups as JsonObject[]).find((g) => g.function === 'decapsulation')!
    const t = (decap.tests as JsonObject[])[0]
    const c = t.c as string
    t.c = `${c.slice(0, 10)}${c[10] === '0' ? '1' : '0'}${c.slice(11)}`
    for (const which of ['cpp', 'rust-node'] as const) {
      const out = await run(
        engines[which].M,
        engines[which].id,
        JSON.stringify(doc),
        expected('ML-KEM-encapDecap-FIPS203')
      )
      expect(out.golden!.mismatched).toHaveLength(1)
      expect(out.golden!.mismatched[0]).toMatchObject({
        tgId: decap.tgId,
        tcId: t.tcId,
        field: 'k',
      })
    }
  }, 60000)
})

describe('F-8: CLI subprocess ≡ browser code path', () => {
  it.each(FIXTURE_NAMES)(
    '%s: npx tsx scripts/acvp-respond.ts (cpp + rust) ≡ getSoftHSMRustModule() run',
    async (name) => {
      const browser = await run(engines['rust-browser'].M, engines['rust-browser'].id, prompt(name))
      for (const engine of ['cpp', 'rust'] as const) {
        const out = mkdtempSync(path.join(tmpdir(), `acvp-cli-${engine}-`))
        execFileSync(
          'npx',
          [
            'tsx',
            'scripts/acvp-respond.ts',
            '--prompt',
            fixturePath(repo, name, 'prompt.json'),
            '--engine',
            engine,
            '--out',
            out,
          ],
          { cwd: repo, stdio: 'pipe' }
        )
        const cliResponse = JSON.parse(readFileSync(path.join(out, 'response.json'), 'utf8'))
        expect(responsesSemanticallyEqual(cliResponse, browser.response.document)).toBe(true)
        const cliEvidence = JSON.parse(readFileSync(path.join(out, 'evidence.json'), 'utf8'))
        expect(cliEvidence.generator.codePath).toBe('cli')
        expect(cliEvidence.engine.artifactSha256).toMatch(/^[0-9a-f]{64}$/)
        expect(cliEvidence.engine.hsmCommit).toBeTruthy()
      }
    },
    120000
  )
})
