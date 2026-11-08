// SPDX-License-Identifier: AGPL-3.0-only
//
// The "Authenticated wrap" lesson's AES-GCM steps (wrap, unwrap back, altered blob) must work on BOTH
// shipped wasm engines. The playground's default engine is Rust, but a learner can switch to C++, and
// in dual-parity mode the Learn steps run on the C++ engine. The C++ engine refuses a CKA_VALUE_LEN
// attribute in an unwrap template (CKR_ATTRIBUTE_READ_ONLY) where the Rust engine accepts it, so the
// unwrap step's template must not carry one. This replays the GCM steps on each engine and checks that
// the round trip succeeds and the altered blob is refused with a return code the lesson declares.
//
// Venue: `*.local.test.ts` — real WASM engines; local gate only (directive 2026-07-01).
import { createRequire } from 'node:module'
import path from 'node:path'
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
import type { Pkcs11StepResult } from './pkcs11Lessons'
import { V32_LESSONS } from './pkcs11LessonsV32'
import { classifyStepOutcome } from './lessonRunner'

const require_ = createRequire(import.meta.url)
// process.cwd()-relative: see useAcvpSuite.runResults.local.test.ts's CPP_GLUE comment.
const CPP_GLUE = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
const CPP_WASM = path.join(path.dirname(CPP_GLUE), 'softhsm.wasm')

const loadCpp = async (): Promise<SoftHSMModule> => {
  const create = require_(CPP_GLUE) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? CPP_WASM : p) })
}

const lesson = V32_LESSONS.find((l) => l.id === 'authenticated-wrap')
if (!lesson) throw new Error('authenticated-wrap lesson not found')
const gcmSteps = lesson.steps.slice(0, 4)

describe.each(['cpp', 'rust'] as const)(
  'authenticated-wrap AES-GCM round trip and altered blob on the %s engine (real wasm)',
  (engine) => {
    const logRef: { current: Pkcs11LogEntry[] } = { current: [] }
    let hsm: HsmContextValue

    beforeAll(async () => {
      const raw = engine === 'cpp' ? await loadCpp() : await getSoftHSMRustModule()
      const proxy = createLoggingProxy(
        raw,
        (e) => {
          logRef.current = [e, ...logRef.current]
        },
        engine
      )
      hsm_initialize(proxy)
      const slot = hsm_initToken(proxy, hsm_getFirstSlot(proxy), '12345678', 'GcmWrap')
      const session = hsm_openUserSession(proxy, slot, '12345678', 'user1234')
      hsm = {
        moduleRef: { current: proxy },
        hSessionRef: { current: session },
      } as unknown as HsmContextValue
    })

    it('runs key generation, wrap and unwrap-back without error, then refuses the altered blob', async () => {
      const results: Pkcs11StepResult[] = []
      for (let i = 0; i < gcmSteps.length; i++) {
        const step = gcmSteps[i]
        const before = logRef.current.length
        let outcome: 'ok' | 'refused-ok' | 'failed' = 'ok'
        let message = ''
        try {
          results.push(await step.run(hsm, results))
        } catch (e) {
          message = e instanceof Error ? e.message : String(e)
          results.push({ detail: '' } as Pkcs11StepResult)
          const entries = logRef.current.slice(0, logRef.current.length - before)
          outcome = classifyStepOutcome(step.expect, entries, step.expectedRefusal)
        }
        const wanted = step.expect === 'refusal' ? 'refused-ok' : 'ok'
        expect(outcome, `step ${i} (${step.op}) on ${engine}: ${message}`).toBe(wanted)
      }
    })
  }
)
