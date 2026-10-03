// SPDX-License-Identifier: GPL-3.0-only
//
// Regression test for a bug found in the 4.143.0 live check (2026-10-02):
// HSM playground Learn lesson B10 "Trust & wrapping policy", run on a fresh
// page, failed EVERY step with "HSM module not loaded — run the first step of
// this lesson first", although B10 has no such step. The Learn tab is the
// playground's default tab and does not auto-boot the engine; only A1 and B1
// carry a boot step, so every other lesson had the same failure.
//
// pkcs11Lessons.local.test.ts boots the engine in beforeAll and so can never
// see this. Here each lesson starts from an UNBOOTED context whose autoInit
// does what HsmContext's real autoInit does, and the steps run through the
// runner's own ensureEngineForStep exactly as HsmLearnView.tsx runs them.
//
// Venue: `*.local.test.ts` (real WASM engine; project directive 2026-07-01).
import { describe, it, expect } from 'vitest'
import type { HsmContextValue } from '../HsmContext'
import {
  getSoftHSMRustModule,
  createLoggingProxy,
  hsm_finalize,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  type SoftHSMModule,
  type Pkcs11LogEntry,
} from '@/wasm/softhsm'
import { FOUNDATIONS_LESSONS, type Pkcs11StepResult } from './pkcs11Lessons'
import { V32_LESSONS } from './pkcs11LessonsV32'
import { classifyStepOutcome, ensureEngineForStep, engineIsRunning } from './lessonRunner'

/** A context in the state a fresh page leaves it: no module, no session. */
function unbootedContext() {
  const logRef: { current: Pkcs11LogEntry[] } = { current: [] }
  const addHsmLog = (e: Pkcs11LogEntry) => {
    logRef.current = [e, ...logRef.current]
  }
  let autoInitCalls = 0
  const hsm = {
    moduleRef: { current: null as SoftHSMModule | null },
    rawModuleRef: { current: null as SoftHSMModule | null },
    crossCheckModuleRef: { current: null },
    hSessionRef: { current: 0 },
    slotRef: { current: 0 },
    lastInitErrorRef: { current: null as string | null },
    engineMode: 'rust',
    isReady: false,
    hsmKeys: [],
    addHsmKey: (k: unknown) => k,
    hsmLog: [],
    hsmLogRef: logRef,
    addHsmLog,
    addHsmStepLog: (label: string) => {
      logRef.current = [
        {
          id: Math.random(),
          timestamp: '',
          fn: label,
          args: '',
          rvHex: '',
          rvName: '',
          ms: 0,
          ok: true,
          isStepHeader: true,
        },
        ...logRef.current,
      ]
    },
    // Same sequence as HsmContext.autoInitImpl: finalize any prior init on
    // the raw singleton, C_Initialize, C_InitToken, open a user session.
    autoInit: async () => {
      autoInitCalls++
      try {
        const raw = (await getSoftHSMRustModule()) as SoftHSMModule
        const proxy = createLoggingProxy(raw, addHsmLog, 'rust')
        hsm.rawModuleRef.current = raw
        hsm.moduleRef.current = proxy
        hsm_finalize(raw, hsm.hSessionRef.current)
        hsm_initialize(proxy)
        const slot = hsm_initToken(proxy, hsm_getFirstSlot(proxy), '12345678', 'FreshBoot')
        hsm.slotRef.current = slot
        hsm.hSessionRef.current = hsm_openUserSession(proxy, slot, '12345678', 'user1234')
        return true
      } catch (err) {
        hsm.lastInitErrorRef.current = err instanceof Error ? err.message : String(err)
        hsm.moduleRef.current = null
        return false
      }
    },
  }
  return { hsm: hsm as unknown as HsmContextValue, logRef, autoInitCalls: () => autoInitCalls }
}

describe('Learn lessons run from a fresh, unbooted page (B10 regression)', () => {
  const freshLessons = [
    V32_LESSONS.find((l) => l.id === 'trust-wrapping-policy'), // B10, the reported lesson
    FOUNDATIONS_LESSONS[1], // A2: the same gap in the other track
  ]

  for (const lesson of freshLessons) {
    if (!lesson) throw new Error('lesson not found')
    it(
      `"${lesson.id}" run first on a fresh page boots the engine and every step meets its expectation`,
      { timeout: 30_000 },
      async () => {
        const { hsm, logRef, autoInitCalls } = unbootedContext()
        expect(engineIsRunning(hsm), 'sanity: the context starts unbooted').toBe(false)
        expect(lesson.steps[0].bootsEngine, 'sanity: this lesson has no boot step').toBeFalsy()

        const results: (Pkcs11StepResult | null)[] = lesson.steps.map(() => null)
        for (let i = 0; i < lesson.steps.length; i++) {
          const step = lesson.steps[i]
          const want = step.expect === 'refusal' ? 'refused-ok' : 'ok'
          const logCountBefore = logRef.current.length
          hsm.addHsmStepLog(`${lesson.id} step ${i}`)
          let outcome: 'ok' | 'refused-ok' | 'failed'
          let detail = ''
          try {
            await ensureEngineForStep(hsm, step)
            const r = await step.run(hsm, results)
            results[i] = r
            outcome = 'ok'
            detail = r.detail
          } catch (e) {
            detail = e instanceof Error ? e.message : String(e)
            outcome = classifyStepOutcome(
              step.expect,
              logRef.current.slice(0, logRef.current.length - logCountBefore)
            )
          }
          expect(detail, `${lesson.id} step ${i}: the reported error must be gone`).not.toContain(
            'HSM module not loaded'
          )
          expect(outcome, `${lesson.id} step ${i} (${step.label}) — ${detail}`).toBe(want)
        }
        expect(autoInitCalls(), 'the runner boots exactly once per fresh page').toBe(1)
      }
    )
  }

  it('only the first step of A1 and of B1 boots the engine itself', () => {
    const flagged = [...FOUNDATIONS_LESSONS, ...V32_LESSONS].flatMap((l) =>
      l.steps.flatMap((s, i) => (s.bootsEngine ? [`${l.id}#${i}`] : []))
    )
    expect(flagged).toEqual([`${FOUNDATIONS_LESSONS[0].id}#0`, `${V32_LESSONS[0].id}#0`])
  })
})
