// SPDX-License-Identifier: GPL-3.0-only
//
// Integration test for the OASIS corpus replay pipeline — drives the REAL
// wasm engine (not a mock) through a handful of real corpus fixtures,
// covering the comparator's key carve-outs (Attributes bag semantics,
// Query superset semantics, $UNIQUE_IDENTIFIER binding, $NOW skipping).
//
// Venue: `*.local.test.ts` — excluded from CI vitest globs, run by the
// local gate (project directive 2026-07-01: new suites are local-only)
// because booting a wasm engine per test is heavier than the default
// suite budget.
/* eslint-disable security/detect-non-literal-fs-filename -- reads a fixed repo dir */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { CodepointTable } from '../ttlv/codepointTable'
import { runCorpusTest } from './runner'
import { CHAINED_TEST_GROUPS } from './classify'

const CORPUS_ROOT = join(__dirname, '../../../../public/kmip-corpus')
const SPEC_JSON = JSON.parse(
  readFileSync(join(CORPUS_ROOT, 'tags-enums.json'), 'utf8')
) as Parameters<typeof CodepointTable.fromSpec>[0]
const table = CodepointTable.fromSpec(SPEC_JSON)

function readCorpusFile(relPath: string): string {
  return readFileSync(join(CORPUS_ROOT, relPath), 'utf8')
}

// Every `runCorpusTest` call boots its own fresh engine, hermetically — each
// needs a never-reused PKCS#11 slot within this test process (see
// runner.ts's module comment). Slot 0 is left unused here on purpose (it's
// the convention the rest of the app's shared engine uses).
let nextSlot = 1
const freshSlot = () => nextSlot++

describe('OASIS corpus replay (real wasm engine)', () => {
  it('QS-M-1-30 (Query) passes', async () => {
    const xml = readCorpusFile('oasis/mandatory/QS-M-1-30.xml')
    const result = await runCorpusTest('QS-M-1-30.xml', xml, table, freshSlot())
    expect(result.status, result.detail).toBe('PASS')
  })

  it('BL-M-1-30 (Interop + Register lifecycle) passes', async () => {
    const xml = readCorpusFile('oasis/mandatory/BL-M-1-30.xml')
    const result = await runCorpusTest('BL-M-1-30.xml', xml, table, freshSlot())
    expect(result.status, result.detail).toBe('PASS')
  })

  it('a deprecated-algorithm test is SKIP_DEPRECATED without even parsing', async () => {
    const xml = readCorpusFile('oasis/mandatory/BL-M-12-30.xml')
    const result = await runCorpusTest('BL-M-12-30.xml', xml, table, freshSlot())
    expect(result.status).toBe('SKIP_DEPRECATED')
  })

  it('a chained test (TL-M-3) PASSES when its prerequisite transcript replays first on the same engine', async () => {
    const prereqs = [
      { name: 'TL-M-2-30.xml', xml: readCorpusFile('oasis/mandatory/TL-M-2-30.xml') },
    ]
    const xml = readCorpusFile('oasis/mandatory/TL-M-3-30.xml')
    const result = await runCorpusTest('TL-M-3-30.xml', xml, table, freshSlot(), prereqs)
    expect(result.status, result.detail).toBe('PASS')
  })

  it('a chained test WITHOUT its prerequisite fails honestly (state genuinely absent)', async () => {
    const xml = readCorpusFile('oasis/mandatory/TL-M-3-30.xml')
    const result = await runCorpusTest('TL-M-3-30.xml', xml, table, freshSlot())
    expect(result.status).not.toBe('PASS')
  })

  it('an RNG-seed variant test PASSES on an engine pinned to its mode (partial-consume)', async () => {
    const xml = readCorpusFile('oasis/optional/CS-RNG-O-2-30.xml')
    const result = await runCorpusTest('CS-RNG-O-2-30.xml', xml, table, freshSlot())
    expect(result.status, result.detail).toBe('PASS')
  })

  it('the deny-mode variant (CS-RNG-O-4) also passes — the engine refuses the seed as pinned', async () => {
    const xml = readCorpusFile('oasis/optional/CS-RNG-O-4-30.xml')
    const result = await runCorpusTest('CS-RNG-O-4-30.xml', xml, table, freshSlot())
    expect(result.status, result.detail).toBe('PASS')
  })

  // Full-corpus sweep: 102 hermetic engine boots + 2 chained prerequisite
  // replays — genuinely long; the explicit timeout is budget, not slack.
  it(
    'reproduces the full OASIS mandatory+optional corpus breakdown from REPLAY_REPORT.md',
    { timeout: 120_000 },
    async () => {
      const tiers: Array<['mandatory' | 'optional', string]> = [
        ['mandatory', 'oasis/mandatory'],
        ['optional', 'oasis/optional'],
      ]
      const counts: Record<string, number> = {}
      const failures: string[] = []
      for (const [, dir] of tiers) {
        for (const name of readdirSync(join(CORPUS_ROOT, dir)).sort()) {
          if (!name.endsWith('.xml')) continue
          const xml = readCorpusFile(`${dir}/${name}`)
          const prereqs = (CHAINED_TEST_GROUPS[name] ?? []).map((p) => ({
            name: p,
            xml: readCorpusFile(`${dir}/${p}`),
          }))
          const result = await runCorpusTest(name, xml, table, freshSlot(), prereqs)
          counts[result.status] = (counts[result.status] ?? 0) + 1
          if (result.status === 'FAIL' || result.status === 'ERROR') {
            failures.push(`${name}: ${result.status} — ${result.detail}`)
          }
        }
      }
      // The engine-0.13.x native baseline (conformance/REPLAY_REPORT.md,
      // 2026-07-09) is an exact 97 PASS / 5 SKIP_DEPRECATED / 0 everything
      // else on the 102-file OASIS corpus. This in-browser replay matches it
      // except for the ONE remaining wasm-vs-native seam gap, honestly
      // labelled rather than approximated: 3 SKIP_TRANSPORT —
      // MaximumResponseSize (§9.10) enforcement lives in the native TLS
      // listener; `KmipPlayground::submit` calls `dispatch()` directly, so
      // there is no seam to implement it on.
      // The former 2 SKIP_PRECONDITION tests (TL-M-3 / SASED-M-3) PASS via
      // chained prerequisite replay (_CHAINED_TEST_GROUPS), and the former
      // 3 SKIP_POLICY_VARIANT tests (CS-RNG-O-2/3/4) PASS by booting each
      // on an engine pinned to its RngSeedMode via the wasm constructor.
      // 0 FAIL / 0 ERROR is enforced strictly; that is the one thing that
      // must never regress.
      expect(failures, failures.join('\n')).toEqual([])
      expect(counts.PASS ?? 0).toBe(94)
      expect(counts.SKIP_DEPRECATED ?? 0).toBe(5)
      expect(counts.SKIP_TRANSPORT ?? 0).toBe(3)
      expect(counts.SKIP_OP ?? 0).toBe(0)
      expect(counts.FAIL ?? 0).toBe(0)
      expect(counts.ERROR ?? 0).toBe(0)
    }
  )

  it('all 42 PQC interop corpus tests pass', { timeout: 60_000 }, async () => {
    const dir = 'pqc'
    const failures: string[] = []
    let passCount = 0
    for (const name of readdirSync(join(CORPUS_ROOT, dir)).sort()) {
      if (!name.endsWith('.xml')) continue
      const xml = readCorpusFile(`${dir}/${name}`)
      const result = await runCorpusTest(name, xml, table, freshSlot())
      if (result.status === 'PASS') passCount++
      else failures.push(`${name}: ${result.status} — ${result.detail}`)
    }
    expect(failures, failures.join('\n')).toEqual([])
    expect(passCount).toBe(42)
  })
})
