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

  it('a precondition test is SKIP_PRECONDITION', async () => {
    const xml = readCorpusFile('oasis/mandatory/TL-M-3-30.xml')
    const result = await runCorpusTest('TL-M-3-30.xml', xml, table, freshSlot())
    expect(result.status).toBe('SKIP_PRECONDITION')
  })

  it('a policy-variant test is SKIP_POLICY_VARIANT', async () => {
    const xml = readCorpusFile('oasis/optional/CS-RNG-O-2-30.xml')
    const result = await runCorpusTest('CS-RNG-O-2-30.xml', xml, table, freshSlot())
    expect(result.status).toBe('SKIP_POLICY_VARIANT')
  })

  it('reproduces the full OASIS mandatory+optional corpus breakdown from REPLAY_REPORT.md', async () => {
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
        const result = await runCorpusTest(name, xml, table, freshSlot())
        counts[result.status] = (counts[result.status] ?? 0) + 1
        if (result.status === 'FAIL' || result.status === 'ERROR') {
          failures.push(`${name}: ${result.status} — ${result.detail}`)
        }
      }
    }
    // Matches conformance/REPLAY_REPORT.md's 92 PASS / 5 SKIP_DEPRECATED /
    // 2 SKIP_PRECONDITION / 3 SKIP_POLICY_VARIANT on the 102-file OASIS
    // corpus, MINUS 3 tests that move to SKIP_TRANSPORT here: their
    // expected outcome depends on MaximumResponseSize (§9.10) enforcement,
    // which lives entirely in the native TLS listener (confirmed by
    // reading server/listener.rs) — `KmipPlayground::submit` calls
    // `dispatch()` directly with no listener wrapping it, so there's no
    // seam to implement that check on in this wasm build. This is a real
    // wasm-vs-native architectural gap (kind: same as Validate/Certify/
    // ReCertify's crypto-backend gap), not a bug in this port — the
    // native/Python harness correctly passes all three. 0 FAIL / 0 ERROR
    // is still enforced strictly; that's the one thing that must never
    // regress.
    expect(failures, failures.join('\n')).toEqual([])
    expect(counts.PASS ?? 0).toBe(89)
    expect(counts.SKIP_DEPRECATED ?? 0).toBe(5)
    expect(counts.SKIP_PRECONDITION ?? 0).toBe(2)
    expect(counts.SKIP_POLICY_VARIANT ?? 0).toBe(3)
    expect(counts.SKIP_TRANSPORT ?? 0).toBe(3)
    expect(counts.SKIP_OP ?? 0).toBe(0)
    expect(counts.FAIL ?? 0).toBe(0)
    expect(counts.ERROR ?? 0).toBe(0)
  })

  it('all 42 PQC interop corpus tests pass', async () => {
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
