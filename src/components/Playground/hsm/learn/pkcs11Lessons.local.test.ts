// SPDX-License-Identifier: GPL-3.0-only
//
// Integration test for the PKCS#11 Learn tab's lesson step specs — replays
// every lesson's step sequence against the REAL wasm engine, in the same
// continuous session a learner clicking through both tracks in one visit
// would use, asserting each step achieves its declared outcome. Mirrors
// kmip/kmip3/learnLessons.local.test.ts's pattern. Guards lesson content
// against wrapper/engine drift: if a future change to softhsm.ts breaks a
// call a lesson makes, this fails before a learner sees a broken step.
//
// Venue: `*.local.test.ts` — excluded from CI vitest globs, run by the
// local gate (project directive 2026-07-01: new suites are local-only).
import { describe, it, expect, beforeAll } from 'vitest'
import type { HsmContextValue } from '../HsmContext'
import {
  getSoftHSMRustModule,
  createLoggingProxy,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  type SoftHSMModule,
  type Pkcs11LogEntry,
} from '@/wasm/softhsm'
import { FOUNDATIONS_LESSONS, type Pkcs11LessonStep, type Pkcs11StepResult } from './pkcs11Lessons'
import { V32_LESSONS } from './pkcs11LessonsV32'
import { QUIZZES } from './pkcs11Quiz'
import { PKCS11_GLOSSARY_DATA } from './pkcs11Glossary'
import { classifyStepOutcome } from './lessonRunner'

describe('PKCS#11 Learn tab lesson step specs (real wasm engine)', () => {
  let hsm: HsmContextValue
  // Always-current log mirror, same role as HsmContext's real hsmLogRef —
  // lets runLesson take a before/after snapshot per step within one tick.
  const logRef: { current: Pkcs11LogEntry[] } = { current: [] }

  beforeAll(async () => {
    const raw = (await getSoftHSMRustModule()) as SoftHSMModule
    const proxy = createLoggingProxy(
      raw,
      (e) => {
        logRef.current = [e, ...logRef.current]
      },
      'rust'
    )
    hsm_initialize(proxy)
    const slot = hsm_getFirstSlot(proxy)
    const initializedSlot = hsm_initToken(proxy, slot, '12345678', 'LessonTest')
    const session = hsm_openUserSession(proxy, initializedSlot, '12345678', 'user1234')

    // Minimal HsmContextValue stub — only the fields any lesson step
    // actually reads (moduleRef/hSessionRef/slotRef/isReady/autoInit), plus
    // the log plumbing runLesson itself needs to classify outcomes the same
    // way HsmLearnView.tsx's real runner does.
    hsm = {
      moduleRef: { current: proxy },
      crossCheckModuleRef: { current: null },
      hSessionRef: { current: session },
      slotRef: { current: initializedSlot },
      engineMode: 'rust',
      setEngineMode: () => {},
      phase: 'session_open',
      setPhase: () => {},
      tokenCreated: true,
      setTokenCreated: () => {},
      isReady: true,
      hsmKeys: [],
      addHsmKey: (k: unknown) => k,
      removeHsmKey: () => {},
      clearHsmKeys: () => {},
      latestKey: () => undefined,
      keysForFamily: () => [],
      hsmLog: [],
      hsmLogRef: logRef,
      addHsmLog: (e: Pkcs11LogEntry) => {
        logRef.current = [e, ...logRef.current]
      },
      clearHsmLog: () => {
        logRef.current = []
      },
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
      autoInit: async () => true,
    } as unknown as HsmContextValue
  })

  // Shares HsmLearnView.tsx's own classifyStepOutcome — a step's "did the
  // engine actually refuse, or did the JS glue crash before it got there"
  // decision is made in exactly one place, not reimplemented here, so this
  // test can never drift from what a learner actually sees in the UI.
  const runLesson = async (lessonId: string, steps: Pkcs11LessonStep[]) => {
    const results: (Pkcs11StepResult | null)[] = steps.map(() => null)
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const want: 'ok' | 'refused-ok' = step.expect === 'refusal' ? 'refused-ok' : 'ok'
      const logCountBefore = logRef.current.length
      hsm.addHsmStepLog(`${lessonId} step ${i}`)
      let outcome: 'ok' | 'refused-ok' | 'failed'
      let detail = ''
      try {
        // Steps are deliberately sequential — each may read prior results.
        const r = await step.run(hsm, results)
        outcome = 'ok'
        detail = r.detail
        results[i] = r
      } catch (e) {
        detail = e instanceof Error ? e.message : String(e)
        const newEntries = logRef.current.slice(0, logRef.current.length - logCountBefore)
        outcome = classifyStepOutcome(step.expect, newEntries)
      }
      expect(
        outcome === want,
        `${lessonId} step ${i} (${step.label}) wanted ${want}, got ${outcome} — ${detail}`
      ).toBe(true)
    }
  }

  const ALL_LESSONS = [...FOUNDATIONS_LESSONS, ...V32_LESSONS]

  for (const lesson of ALL_LESSONS) {
    it(
      `lesson "${lesson.id}" (${lesson.title}) — every step achieves its declared outcome`,
      { timeout: 30_000 },
      async () => {
        await runLesson(lesson.id, lesson.steps)
      }
    )
  }

  it('skip-ahead on authenticated-wrap step 4 fails instead of masquerading as a refusal', async () => {
    // Regression test for a real bug: clicking straight to the "tampered
    // blob" step without running its prerequisites used to crash on
    // undefined data, but because the step declares expect: 'refusal', the
    // old (per-file, unshared) classification logic treated ANY thrown
    // exception as "refused, as expected" — silently teaching the wrong
    // lesson. Running this step with no prior results reproduces exactly
    // that skip-ahead condition.
    const lesson = V32_LESSONS.find((l) => l.id === 'authenticated-wrap')
    if (!lesson) throw new Error('authenticated-wrap lesson not found')
    const tamperStep = lesson.steps[3]
    expect(tamperStep.expect, 'sanity: this must be the refusal-expected step').toBe('refusal')

    const logCountBefore = logRef.current.length
    hsm.addHsmStepLog('regression: skip-ahead authenticated-wrap step 4')
    let outcome: 'ok' | 'refused-ok' | 'failed' = 'ok'
    try {
      await tamperStep.run(hsm, [null, null, null])
    } catch {
      const newEntries = logRef.current.slice(0, logRef.current.length - logCountBefore)
      outcome = classifyStepOutcome(tamperStep.expect, newEntries)
    }
    expect(outcome, 'a setup crash must fail, never masquerade as a refusal').toBe('failed')
  })

  it('every lesson has a quiz bank, every quiz maps to a lesson, every answer is in range', () => {
    const lessonIds = new Set(ALL_LESSONS.map((l) => l.id))
    for (const [id, questions] of Object.entries(QUIZZES)) {
      expect(lessonIds.has(id), `quiz bank "${id}" has no matching lesson`).toBe(true)
      for (const q of questions) {
        expect(q.options.length, `${id}: "${q.q}" needs >=2 options`).toBeGreaterThanOrEqual(2)
        expect(q.answer, `${id}: "${q.q}" answer index out of range`).toBeLessThan(q.options.length)
        expect(q.why.length, `${id}: "${q.q}" needs a why`).toBeGreaterThan(0)
      }
    }
    for (const l of ALL_LESSONS) {
      expect(QUIZZES[l.id]?.length ?? 0, `lesson "${l.id}" has no quiz bank`).toBeGreaterThan(0)
    }
  })

  it('every lesson has a unique id and at least one step', () => {
    const ids = new Set(ALL_LESSONS.map((l) => l.id))
    expect(ids.size).toBe(ALL_LESSONS.length)
    for (const l of ALL_LESSONS) {
      expect(l.steps.length, `lesson "${l.id}" has no steps`).toBeGreaterThan(0)
    }
  })

  it('every tag-glossary term with a hex value has a plausible PKCS#11 constant shape', () => {
    for (const [name, entry] of Object.entries(PKCS11_GLOSSARY_DATA.tagGlossary)) {
      if (entry.hex) {
        expect(entry.hex, `${name}: hex should look like 0x-prefixed`).toMatch(/^0x[0-9a-fA-F]+$/)
      }
      expect(entry.def.length, `${name}: needs a non-empty definition`).toBeGreaterThan(0)
    }
  })
})
