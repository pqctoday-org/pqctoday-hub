// SPDX-License-Identifier: AGPL-3.0-only
//
// Replays every step of the "PKCS#11 v3.3 (working draft)" Learn track
// against the REAL Rust wasm engine, in one continuous session, using the
// same outcome rules as HsmLearnView's runner:
//
//  - a step that needs a mechanism the engine advertises must reach its
//    declared outcome (success, or an honest engine refusal);
//  - a step that needs a v3.3 mechanism the engine does NOT advertise must
//    throw NotInEngineError ("not in this engine yet") — and may do so ONLY
//    when that mechanism really is missing, so the safety net can never hide
//    a broken step on an engine that has the feature.
//
// [after engine update]: on today's engine the composite steps of lessons
// C2 and C3 (and XMSS in C5) end "not in this engine yet"; once the updated
// engine bundle is copied in, the same test runs them as real composite
// crypto with no change. The TLS-vs-composite combiner steps (C3 steps 4-5),
// external µ (C4) and the HSS counter (C5) run real crypto today.
//
// Venue: `*.local.test.ts` (real wasm), run by `npm run gate:pkcs11`.
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
import { hsm_detectV33Support, isNotInEngine, type V33Support } from '@/wasm/softhsm/v33'
import { V33_LESSONS } from './pkcs11LessonsV33'
import { QUIZZES } from './pkcs11Quiz'
import { PKCS11_GLOSSARY_DATA } from './pkcs11Glossary'
import { classifyStepOutcome } from './lessonRunner'

type Outcome = 'ok' | 'refused-ok' | 'not-in-engine' | 'failed'

describe('PKCS#11 v3.3 (working draft) Learn track (real Rust engine)', () => {
  let hsm: HsmContextValue
  let support: V33Support
  const logRef: { current: Pkcs11LogEntry[] } = { current: [] }

  beforeAll(async () => {
    const raw = (await getSoftHSMRustModule()) as SoftHSMModule
    const proxy = createLoggingProxy(raw, (e) => (logRef.current = [e, ...logRef.current]), 'rust')
    hsm_initialize(proxy)
    const slot = hsm_initToken(proxy, hsm_getFirstSlot(proxy), '12345678', 'V33Lessons')
    const session = hsm_openUserSession(proxy, slot, '12345678', 'user1234')
    support = hsm_detectV33Support(proxy, slot)
    hsm = {
      moduleRef: { current: proxy },
      rawModuleRef: { current: raw },
      hSessionRef: { current: session },
      slotRef: { current: slot },
      isReady: true,
      hsmLogRef: logRef,
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
  }, 60_000)

  /** Is the feature a step declares (`requires`) present in this engine?
   * XMSS's CKA_KEYS_REMAINING has no mechanism to advertise it, so the step
   * detects it by reading the attribute; it is allowed either way here. */
  const engineHas = (req: string | undefined): boolean =>
    req === undefined || req === 'xmssKeysRemaining'
      ? req === undefined
      : support[req as 'compSig' | 'compSigExternalHash' | 'compKem' | 'externalMu']

  for (const lesson of V33_LESSONS) {
    it(`lesson "${lesson.id}" — every step reaches its outcome or says "not in this engine yet"`, async () => {
      const results: ({ detail: string } | null)[] = lesson.steps.map(() => null)
      for (let i = 0; i < lesson.steps.length; i++) {
        const step = lesson.steps[i]
        const want: Outcome = step.expect === 'refusal' ? 'refused-ok' : 'ok'
        const before = logRef.current.length
        hsm.addHsmStepLog(`${lesson.id} step ${i}`)
        let outcome: Outcome
        let detail = ''
        try {
          const r = await step.run(hsm, results)
          results[i] = r
          detail = r.detail
          outcome = 'ok'
        } catch (e) {
          detail = e instanceof Error ? e.message : String(e)
          outcome = isNotInEngine(e)
            ? 'not-in-engine'
            : classifyStepOutcome(
                step.expect,
                logRef.current.slice(0, logRef.current.length - before)
              )
        }
        if (outcome === 'not-in-engine') {
          // Allowed only when the feature the step declares is really
          // missing, or the engine refused that one parameter set.
          const xmssCounter = step.requires === 'xmssKeysRemaining'
          const setRefused = detail.includes('CKR_PARAMETER_SET_NOT_SUPPORTED')
          expect(
            step.requires !== undefined && (xmssCounter || setRefused || !engineHas(step.requires)),
            `${lesson.id} step ${i} (${step.label}) said "not in this engine yet" although the engine advertises what it needs — ${detail}`
          ).toBe(true)
          expect(detail).toContain('not in this engine yet')
          continue
        }
        expect(
          outcome,
          `${lesson.id} step ${i} (${step.label}) wanted ${want}, got ${outcome} — ${detail}`
        ).toBe(want)
      }
    }, 120_000)
  }

  it('lesson C3 shows TLS concatenation and the composite combiner giving different secrets (runs today)', async () => {
    const lesson = V33_LESSONS.find((l) => l.id === 'v33-composite-mlkem')!
    const results: ({ detail: string } | null)[] = lesson.steps.map(() => null)
    const components = lesson.steps.findIndex((s) => s.op.includes('C_DeriveKey (X25519)'))
    const combine = lesson.steps.findIndex((s) => s.op.includes('CKM_SHA3_256'))
    expect(components).toBeGreaterThan(-1)
    results[components] = await lesson.steps[components].run(hsm, results)
    const r = await lesson.steps[combine].run(hsm, results)
    expect(r.detail).toMatch(/Different secrets from the same inputs/)
    expect(r.detail).toMatch(/64 B/)
    expect(r.detail).toMatch(/32 B/)
  })

  it('every v3.3 lesson has a quiz bank and the glossary defines the new identifiers', () => {
    for (const l of V33_LESSONS) expect(QUIZZES[l.id]?.length ?? 0, l.id).toBeGreaterThan(0)
    for (const name of [
      'CKK_COMP_SIG',
      'CKK_COMP_KEM',
      'CKM_COMP_SIG',
      'CKM_COMP_SIG_EXTERNAL_HASH',
      'CKM_COMP_KEM',
      'CKM_ML_DSA_EXTERNAL_MU_GEN',
      'CKM_ML_DSA_EXTERNAL_MU',
      'CKA_KEYS_REMAINING',
    ]) {
      expect(PKCS11_GLOSSARY_DATA.tagGlossary[name]?.def, name).toBeTruthy()
    }
  })
})
