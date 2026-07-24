// SPDX-License-Identifier: GPL-3.0-only
//
// Regression test for the Compliance Suite's pass-rate math (see
// tpm-playground-audit-pkcs11-cacp-parity-gap-report-07232026.md /
// tpm-playground-remediation-plan-07232026.md, Phase 0 item 4). Before this
// fix, `total` was computed as `pass + fail` — however many checks actually
// ran — so an aborted run (an uncaught throw partway through the 24-check
// suite) rendered a false "N/N checks passed" green banner instead of
// showing that some checks never ran. buildSuiteSummary pins `total` to the
// fixed expected count and reports the gap as `notRun`.
//
// Venue: `*.local.test.ts` per the 2026-07-01 new-test-suite convention
// (vite.config.ts) — local gate only, not CI.
import { describe, it, expect } from 'vitest'
import { buildSuiteSummary } from './ComplianceRunner'

describe('buildSuiteSummary', () => {
  it('reports a full run with no gap', () => {
    expect(buildSuiteSummary(24, 0, 24)).toEqual({ pass: 24, fail: 0, total: 24, notRun: 0 })
  })

  it('reports ordinary failures with no gap (unchanged from before the fix)', () => {
    expect(buildSuiteSummary(18, 6, 24)).toEqual({ pass: 18, fail: 6, total: 24, notRun: 0 })
  })

  it('flags an aborted run instead of reporting a false N/N', () => {
    // The exact failure mode this fix addresses: 18 checks passed, 0 failed,
    // but the suite aborted before the remaining 6 ever ran. The old
    // `total = pass + fail` computation would render this as "18/18 checks
    // passed" — a false positive from a tool whose entire job is asserting
    // compliance.
    const summary = buildSuiteSummary(18, 0, 24)
    expect(summary).toEqual({ pass: 18, fail: 0, total: 24, notRun: 6 })
    // The UI's green/red styling condition is `fail === 0 && notRun === 0` —
    // assert this case does NOT satisfy it.
    expect(summary.fail === 0 && summary.notRun === 0).toBe(false)
  })

  it('never reports a negative notRun even if pass+fail somehow exceeds the expected total', () => {
    expect(buildSuiteSummary(20, 5, 24).notRun).toBe(0)
  })
})
