// SPDX-License-Identifier: GPL-3.0-only
//
// Pure unit tests for classifyStepOutcome — no WASM engine needed, since the
// function only reasons about an `expect` value and a slice of log entries.
// Venue: `*.local.test.ts` per project directive 2026-07-01 (new suites are
// local-only), matching pkcs11Lessons.local.test.ts's own venue even though
// this particular suite has no engine dependency that would require it.
import { describe, it, expect } from 'vitest'
import { classifyStepOutcome } from './lessonRunner'
import type { Pkcs11LogEntry } from '@/wasm/softhsm'

const header = (fn = 'header'): Pkcs11LogEntry => ({
  id: 1,
  timestamp: '',
  fn,
  args: '',
  rvHex: '',
  rvName: '',
  ms: 0,
  ok: true,
  isStepHeader: true,
})

const call = (opts: Partial<Pkcs11LogEntry> & { fn: string; ok: boolean }): Pkcs11LogEntry => ({
  id: 2,
  timestamp: '',
  args: '',
  rvHex: opts.ok ? '0x00000000' : '0x00000011',
  rvName: opts.ok ? 'CKR_OK' : 'CKR_ATTRIBUTE_TYPE_INVALID',
  ms: 1,
  ...opts,
})

describe('classifyStepOutcome', () => {
  it('a success-expected step is never called (the runner only invokes it on catch) — not applicable', () => {
    // classifyStepOutcome is only ever called from a catch block in both the
    // real runner and the tests, so 'ok' is never one of its possible
    // returns — documented here so a future reader doesn't go looking for it.
    expect(typeof classifyStepOutcome).toBe('function')
  })

  it('expect !== "refusal" always fails, regardless of log evidence', () => {
    expect(classifyStepOutcome('success', [header(), call({ fn: 'C_Sign', ok: false })])).toBe(
      'failed'
    )
    expect(classifyStepOutcome(undefined, [])).toBe('failed')
    expect(classifyStepOutcome('pending', [call({ fn: 'C_Sign', ok: false })])).toBe('failed')
  })

  it('expect: "refusal" with a real engine failure classifies as refused-ok', () => {
    const entries = [call({ fn: 'C_UnwrapKeyAuthenticated', ok: false }), header()]
    expect(classifyStepOutcome('refusal', entries)).toBe('refused-ok')
  })

  it('expect: "refusal" with ZERO new log entries (a setup/JS crash before any engine call) fails — the masking-bug regression', () => {
    // This is exactly the authenticated-wrap step-4 skip-ahead bug: the step
    // throws before it ever reaches a `_C_*` call, so only the step's own
    // header entry exists — no real call to point to.
    expect(classifyStepOutcome('refusal', [header()])).toBe('failed')
    expect(classifyStepOutcome('refusal', [])).toBe('failed')
  })

  it('expect: "refusal" where the last real call actually SUCCEEDED fails (the lesson\'s premise didn\'t hold)', () => {
    const entries = [call({ fn: 'C_UnwrapKeyAuthenticated', ok: true }), header()]
    expect(classifyStepOutcome('refusal', entries)).toBe('failed')
  })

  it('expect: "refusal" where the last real call TRAP\'d (a WASM-level crash, not a clean CKR refusal) fails', () => {
    const entries = [
      { ...call({ fn: 'C_UnwrapKeyAuthenticated', ok: false }), rvHex: 'TRAP' },
      header(),
    ]
    expect(classifyStepOutcome('refusal', entries)).toBe('failed')
  })
})
