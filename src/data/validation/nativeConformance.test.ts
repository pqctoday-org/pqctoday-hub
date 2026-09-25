// WS-G G-6 — pins the native-conformance report parsers against snippets
// copied from the real pqctoday-hsm reports (src/test/fixtures/
// native-conformance/: rows and transcript lines verbatim, only the snippet's
// own totals recomputed so each snippet is internally consistent), and checks
// that the committed generated file agrees with itself.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  NATIVE_CONFORMANCE_SCHEMA,
  countCases,
  formatCounts,
  parseCppReport,
  parseRustReport,
  type NativeConformanceFile,
} from './nativeConformance'
import generatedJson from './native-conformance.generated.json'
import provenance from '../../../public/wasm/wasm-provenance.json'

const FIX = join(process.cwd(), 'src/test/fixtures/native-conformance')
const read = (f: string) => readFileSync(join(FIX, f), 'utf8')
const CPP_JSON = read('cpp_compliance_report.snippet.json')
const CPP_MD = read('cpp_compliance_report.snippet.md')
const RUST_MD = read('RUST_P11_V32_CONFORMANCE_REPORT.snippet.md')

describe('parseCppReport (cpp_compliance_report.{json,md})', () => {
  it('reads every case with a suite-assigned <category>/<test> id and its status', () => {
    const r = parseCppReport(CPP_JSON, CPP_MD)
    expect(r.counts).toEqual({ pass: 5, fail: 0, skip: 2, xfail: 0, total: 7 })
    expect(r.groups).toBe(3)
    expect(r.cases).toContainEqual(['AES-CTR/EncryptInit', 'pass'])
    expect(r.cases).toContainEqual(['AesKwp/KWP_rejects_unsupported_iv_param', 'pass'])
    expect(r.cases).toContainEqual(['Invariant/OutOfScope_0x00001105', 'skip'])
    expect(r.engineCommit).toBe('808fc95cd97049e6410489ed6daf879e381cdc26')
    expect(r.engineAsStated).toBe('./build/src/lib/libsofthsmv3.so')
    expect(r.reportDate).toBe('2026-09-09 06:33:05 UTC')
  })

  it('throws when the JSON summary disagrees with its own rows', () => {
    const bad = CPP_JSON.replace('"pass": 5', '"pass": 6')
    expect(() => parseCppReport(bad, CPP_MD)).toThrow(/_summary\.pass=6 but the rows tally 5/)
  })

  it('throws when the Markdown twin disagrees with the JSON', () => {
    expect(() =>
      parseCppReport(CPP_JSON, CPP_MD.replace('**Total SKIP:** 2', '**Total SKIP:** 3'))
    ).toThrow(/Total skip=3/)
    expect(() =>
      parseCppReport(CPP_JSON, CPP_MD.replace('808fc95cd97049e6', '0000000000000000'))
    ).toThrow(/engine commit/)
  })

  it('rejects a status the C++ harness never writes', () => {
    const bad = CPP_JSON.replace('"status": "PASS"', '"status": "OK"')
    expect(() => parseCppReport(bad, CPP_MD)).toThrow(/unknown status "OK"/)
  })
})

describe('parseRustReport (rust/RUST_P11_V32_CONFORMANCE_REPORT.md)', () => {
  it('derives per-case ids from the transcript, ordinal-suffixing repeated labels', () => {
    const r = parseRustReport(RUST_MD)
    expect(r.counts).toEqual({ pass: 22, fail: 0, skip: null, xfail: null, total: 22 })
    expect(r.groups).toBe(3)
    expect(r.caseIdentity).toBe('derived-from-transcript')
    expect(r.cases[0]).toEqual([
      'R1.2 — initialization gate (§5.4/§5.6) › C_GetSlotList before C_Initialize → CRYPTOKI_NOT_INITIALIZED',
      'pass',
    ])
    const sp =
      'Round-2 — SP800-108 CK_PRF_DATA_TYPE completeness (COUNTER, KEY_HANDLE, SUM_OF_SEGMENTS)'
    const ids = r.cases.map(([id]) => id)
    expect(ids).toContain(`${sp} › import secret key → OK`)
    expect(ids).toContain(`${sp} › import secret key → OK #2`)
    expect(ids).toContain(`${sp} › import secret key → OK #3`)
    expect(new Set(ids).size).toBe(ids.length)
    expect(r.repeatedLabels).toBe(1)
  })

  it('records the engine and target exactly as stated, never inferred', () => {
    const r = parseRustReport(RUST_MD)
    expect(r.engineCommitAsStated).toBe('fc9d303dcbc9')
    expect(r.reportDate).toBe('2026-09-18T23:01:53.932Z')
    expect(r.target).toBe('wasm32 build with `--features acvp`')
    expect(r.engineAsStated).toBe('softhsmrustv3 (Rust), wasm32 build with `--features acvp`')
  })

  it("parses the harness's fail line shape and keeps the same case id", () => {
    // check() in test_p11_conformance.js writes `  ❌ ${label}: got 0x…, expected 0x…`.
    const failing = RUST_MD.replace(
      '  ✅ C_InitToken → OK',
      '  ❌ C_InitToken → OK: got 0x7, expected 0x0'
    )
      .replace('**22 passed / 0 failed**', '**21 passed / 1 failed**')
      .replace('C_InitToken) (1 passed / 0 failed)', 'C_InitToken) (0 passed / 1 failed)')
      .replace('RESULT: 22 passed, 0 failed', 'RESULT: 21 passed, 1 failed')
    const r = parseRustReport(failing)
    expect(r.counts).toMatchObject({ pass: 21, fail: 1 })
    expect(r.cases).toContainEqual([
      'Token init (fixture — before any session, §5.7 C_InitToken) › C_InitToken → OK',
      'fail',
    ])
  })

  it('throws when any stated total disagrees with the transcript', () => {
    expect(() =>
      parseRustReport(RUST_MD.replace('**22 passed / 0 failed**', '**23 passed / 0 failed**'))
    ).toThrow(/headline says 23\/0/)
    expect(() =>
      parseRustReport(RUST_MD.replace('C_InitToken) (1 passed', 'C_InitToken) (2 passed'))
    ).toThrow(/section 2/)
    expect(() =>
      parseRustReport(RUST_MD.replace('RESULT: 22 passed', 'RESULT: 20 passed'))
    ).toThrow(/RESULT line/)
    expect(() =>
      parseRustReport(RUST_MD.replace('  ✅ C_InitToken → OK', '  ❌ C_InitToken'))
    ).toThrow(/unparseable check line/)
  })
})

describe('formatCounts', () => {
  it('omits a status the harness does not have instead of printing 0', () => {
    expect(formatCounts({ pass: 3, fail: 0, skip: null, xfail: null, total: 3 })).toBe(
      '3 pass · 0 fail'
    )
    expect(formatCounts({ pass: 3, fail: 1, skip: 2, xfail: 0, total: 6 })).toBe(
      '3 pass · 1 fail · 2 skip'
    )
  })
})

describe('committed native-conformance.generated.json is self-consistent', () => {
  const file = generatedJson as unknown as NativeConformanceFile

  it('has the schema, a full pinned hsm commit and all three suites', () => {
    expect(file.schema).toBe(NATIVE_CONFORMANCE_SCHEMA)
    expect(file.hsm.pinnedCommit).toMatch(/^[0-9a-f]{40}$/)
    expect(file.suites.map((s) => s.id)).toEqual([
      'cpp-p11-v32-compliance',
      'rust-p11-v32-conformance',
      'cross-engine-differential',
    ])
  })

  it('every stated count equals a recount of the case rows (no hand-edited totals)', () => {
    for (const s of file.suites) {
      if (!s.report) {
        expect(s.openGaps.length, `${s.id} has no report and must say why`).toBeGreaterThan(0)
        continue
      }
      const r = s.report
      const n = countCases(r.cases)
      expect(r.counts.pass, s.id).toBe(n.pass)
      expect(r.counts.fail, s.id).toBe(n.fail)
      expect(r.counts.skip ?? 0, s.id).toBe(n.skip)
      expect(r.counts.xfail ?? 0, s.id).toBe(n.xfail)
      expect(r.counts.total, s.id).toBe(r.cases.length)
      expect(new Set(r.cases.map(([id]) => id)).size, `${s.id} case ids unique`).toBe(
        r.cases.length
      )
      expect(r.engineCommit).toMatch(/^[0-9a-f]{40}$/)
      expect(r.engineCommit.startsWith(r.engineCommitAsStated)).toBe(true)
    }
  })

  it('compares against the WASM bundle commits wasm-provenance.json records today', () => {
    for (const s of file.suites) {
      const w = s.report?.wasm
      if (!w) continue
      const bundle = provenance.bundles.find((b) => b.name === w.bundle)
      expect(bundle, w.bundle).toBeDefined()
      // provenance may hold an abbreviated commit; the import resolved it in full.
      expect(w.bundleHsmCommit.startsWith(bundle!.hsmCommit as string), w.bundle).toBe(true)
      expect(w.engineCommitEqualsBundleCommit).toBe(w.bundleHsmCommit === s.report!.engineCommit)
    }
  })
})
