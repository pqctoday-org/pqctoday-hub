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
} from '@/wasm/softhsm'
import { FOUNDATIONS_LESSONS, type Pkcs11LessonStep, type Pkcs11StepResult } from './pkcs11Lessons'
import { V32_LESSONS } from './pkcs11LessonsV32'
import { QUIZZES } from './pkcs11Quiz'
import { PKCS11_GLOSSARY_DATA } from './pkcs11Glossary'

describe('PKCS#11 Learn tab lesson step specs (real wasm engine)', () => {
  let hsm: HsmContextValue

  beforeAll(async () => {
    const raw = (await getSoftHSMRustModule()) as SoftHSMModule
    const proxy = createLoggingProxy(raw, () => {}, 'rust')
    hsm_initialize(proxy)
    const slot = hsm_getFirstSlot(proxy)
    const initializedSlot = hsm_initToken(proxy, slot, '12345678', 'LessonTest')
    const session = hsm_openUserSession(proxy, initializedSlot, '12345678', 'user1234')

    // Minimal HsmContextValue stub — only the fields any lesson step
    // actually reads (moduleRef/hSessionRef/slotRef/isReady/autoInit).
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
      addHsmLog: () => {},
      clearHsmLog: () => {},
      autoInit: async () => true,
    } as unknown as HsmContextValue
  })

  const runLesson = async (lessonId: string, steps: Pkcs11LessonStep[]) => {
    const results: (Pkcs11StepResult | null)[] = steps.map(() => null)
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const want = step.expect ?? 'success'
      let outcome: 'success' | 'refusal'
      let detail = ''
      try {
        // Steps are deliberately sequential — each may read prior results.
        const r = await step.run(hsm, results)
        outcome = 'success'
        detail = r.detail
        results[i] = r
      } catch (e) {
        outcome = 'refusal'
        detail = e instanceof Error ? e.message : String(e)
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
