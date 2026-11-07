// SPDX-License-Identifier: AGPL-3.0-only
//
// The "Authenticated wrap" lesson's AES-KW step wraps the target key with the classic AES key wrap
// mechanism (CKM_AES_KEY_WRAP, RFC 3394), alters one byte of the wrapped blob and asks the token to
// unwrap it. RFC 3394 section 2.2.3: if the recovered integrity value does not match, "the key is
// rejected, and the unwrapping algorithm returns an error". This replays that step on BOTH shipped
// wasm engines (C++ and Rust; in the playground's dual-parity mode the Learn steps run on the C++
// engine) and checks that the engine, not the lesson glue, refuses the altered blob with the return
// code the lesson declares, after an intact-blob control unwrap succeeded under the same key and
// template.
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
import { V32_LESSONS, AES_KW_INTEGRITY_NOTE } from './pkcs11LessonsV32'
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
const kwStep = lesson.steps.find((s) => /CKM_AES_KEY_WRAP/.test(s.op))
if (!kwStep) throw new Error('AES-KW altered-blob step not found')

const CKR_WRAPPED_KEY_INVALID = 0x110

describe.each(['cpp', 'rust'] as const)(
  'authenticated-wrap AES-KW altered-blob step on the %s engine (real wasm)',
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
      const slot = hsm_initToken(proxy, hsm_getFirstSlot(proxy), '12345678', 'AesKwTamper')
      const session = hsm_openUserSession(proxy, slot, '12345678', 'user1234')
      hsm = {
        moduleRef: { current: proxy },
        hSessionRef: { current: session },
      } as unknown as HsmContextValue
    })

    const entriesSince = (before: number) => logRef.current.slice(0, logRef.current.length - before) // newest first

    it('is refused by the engine as CKR_WRAPPED_KEY_INVALID after an intact-blob control unwrap succeeded', async () => {
      const first: Pkcs11StepResult = await lesson.steps[0].run(hsm, [])
      const before = logRef.current.length
      let message = ''
      try {
        await kwStep.run(hsm, [first])
      } catch (e) {
        message = e instanceof Error ? e.message : String(e)
      }
      expect(message, 'the altered blob must be refused, not unwrapped').not.toBe('')

      const entries = entriesSince(before)
      expect(classifyStepOutcome(kwStep.expect, entries, kwStep.expectedRefusal)).toBe('refused-ok')

      // Chronological view: wrap, control unwrap (ok), altered unwrap (refused).
      const calls = entries.filter((e) => !e.isStepHeader).reverse()
      const wraps = calls.filter((e) => e.fn === 'C_WrapKey')
      expect(wraps.length, 'the step wraps with AES-KW itself').toBeGreaterThan(0)
      expect(wraps.every((e) => e.ok)).toBe(true)
      const unwraps = calls.filter((e) => e.fn === 'C_UnwrapKey')
      expect(unwraps.map((e) => e.ok)).toEqual([true, false])
      expect(Number(unwraps[1].rvHex)).toBe(CKR_WRAPPED_KEY_INVALID)
      expect(kwStep.expectedRefusal?.returnCodes).toContain(Number(unwraps[1].rvHex))

      // The learner-visible refusal text names the return code and carries the scope statement.
      expect(message).toMatch(/CKR_WRAPPED_KEY_INVALID/)
      expect(message).toContain(AES_KW_INTEGRITY_NOTE)
    })

    it('fails (never masquerades as a refusal) when its prerequisite step was skipped', async () => {
      const before = logRef.current.length
      let outcome: 'ok' | 'refused-ok' | 'failed' = 'ok'
      try {
        await kwStep.run(hsm, [null])
      } catch {
        outcome = classifyStepOutcome(kwStep.expect, entriesSince(before), kwStep.expectedRefusal)
      }
      expect(outcome).toBe('failed')
    })
  }
)
