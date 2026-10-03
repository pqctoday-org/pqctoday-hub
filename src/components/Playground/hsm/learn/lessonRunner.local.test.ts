// SPDX-License-Identifier: GPL-3.0-only
//
// Pure unit tests for classifyStepOutcome — no WASM engine needed, since the
// function only reasons about an `expect` value and a slice of log entries.
// Venue: `*.local.test.ts` per project directive 2026-07-01 (new suites are
// local-only), matching pkcs11Lessons.local.test.ts's own venue even though
// this particular suite has no engine dependency that would require it.
import { describe, it, expect } from 'vitest'
import {
  classifyStepOutcome,
  ensureEngineForStep,
  engineIsRunning,
  type EngineBootTarget,
} from './lessonRunner'
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

  it('expect: "refusal" where the only real call actually SUCCEEDED fails (the lesson\'s premise didn\'t hold)', () => {
    const entries = [call({ fn: 'C_UnwrapKeyAuthenticated', ok: true }), header()]
    expect(classifyStepOutcome('refusal', entries)).toBe('failed')
  })

  it('expect: "refusal" where the only real call TRAP\'d (a WASM-level crash, not a clean CKR refusal) fails', () => {
    const entries = [
      { ...call({ fn: 'C_UnwrapKeyAuthenticated', ok: false }), rvHex: 'TRAP' },
      header(),
    ]
    expect(classifyStepOutcome('refusal', entries)).toBe('failed')
  })

  it('expect: "refusal" where a genuine refusal is followed by successful cleanup calls still classifies as refused-ok', () => {
    // Real scenario from the trust-wrapping-policy lesson: a step logs back
    // in as SO, tries to revoke CKA_TRUSTED (refused), then a `finally`
    // block always restores the USER session — two MORE successful calls
    // logged after the refusal. Newest-first order means those sit at index
    // 0 and 1, ahead of the actual failing call.
    const entries = [
      call({ fn: 'C_Login', ok: true }), // finally: re-login as user (newest)
      call({ fn: 'C_Logout', ok: true }), // finally: logout
      call({ fn: 'C_SetAttributeValue', ok: false }), // the actual refusal
      call({ fn: 'C_Login', ok: true }), // setup: login as SO
      call({ fn: 'C_Logout', ok: true }), // setup: logout
      header(),
    ]
    expect(classifyStepOutcome('refusal', entries)).toBe('refused-ok')
  })
})

// Bug 2026-10-02 (found in the 4.143.0 live check): on a fresh page the Learn
// tab never booted the engine, so B10 — and every lesson except A1/B1 — failed
// every step with "HSM module not loaded". The runner now boots first.
describe('ensureEngineForStep', () => {
  const target = (opts: {
    booted: boolean
    bootResult?: boolean
    bootError?: string | null
  }): EngineBootTarget & { calls: number } => {
    const t = {
      calls: 0,
      moduleRef: { current: opts.booted ? ({} as never) : null },
      hSessionRef: { current: opts.booted ? 7 : 0 },
      lastInitErrorRef: { current: null as string | null },
      autoInit: async () => {
        t.calls++
        if (opts.bootResult === false) {
          t.lastInitErrorRef.current = opts.bootError ?? null
          return false
        }
        t.moduleRef.current = {} as never
        t.hSessionRef.current = 7
        return true
      },
    }
    return t as unknown as EngineBootTarget & { calls: number }
  }

  it('boots the engine once when a step runs on a fresh page', async () => {
    const t = target({ booted: false })
    expect(await ensureEngineForStep(t, {})).toBe(true)
    expect(t.calls).toBe(1)
    expect(engineIsRunning(t)).toBe(true)
  })

  it('does nothing when the engine is already running', async () => {
    const t = target({ booted: true })
    expect(await ensureEngineForStep(t, {})).toBe(false)
    expect(t.calls).toBe(0)
  })

  it('never pre-boots a step that boots the engine itself (A1/B1 step 1)', async () => {
    const t = target({ booted: false })
    expect(await ensureEngineForStep(t, { bootsEngine: true })).toBe(false)
    expect(t.calls).toBe(0)
  })

  it('a module without an open session still counts as not running', async () => {
    const t = target({ booted: false })
    t.moduleRef.current = {} as never
    expect(engineIsRunning(t)).toBe(false)
    expect(await ensureEngineForStep(t, {})).toBe(true)
  })

  it('a failed boot throws with the engine error, so the step fails visibly', async () => {
    const t = target({ booted: false, bootResult: false, bootError: 'wasm fetch failed' })
    await expect(ensureEngineForStep(t, {})).rejects.toThrow(
      'Engine boot failed: wasm fetch failed.'
    )
  })
})
