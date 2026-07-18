// SPDX-License-Identifier: GPL-3.0-only
//
// pkcs11Lessons.ts — the "PKCS#11 Foundations" track's curriculum data.
// Each step runs a REAL call against the shared HsmContext's live wasm
// session (the same session the rest of the HSM playground uses) — no
// mocked responses. A step with `expect: 'refusal'` is one whose thrown
// PKCS#11 error IS the lesson: the honest rejection counts as success,
// mirroring the KMIP playground's learnLessons.ts pattern.
import type { HsmContextValue } from '../HsmContext'
import { hsm_getSessionInfo, hsm_getTokenInfo } from '@/wasm/softhsm'
import type { LessonStepExpect, LinearLessonBase } from '@/components/Playground/learnkit/lessonTypes'

export interface Pkcs11StepResult {
  detail: string
}

export interface Pkcs11LessonStep {
  op: string
  label: string
  /** Runs against the shared HsmContext. Throw to signal a PKCS#11 failure —
   * the runner catches it and checks `expect` to decide pass/fail. */
  run: (
    hsm: HsmContextValue,
    results: (Pkcs11StepResult | null)[]
  ) => Promise<Pkcs11StepResult> | Pkcs11StepResult
  expect?: LessonStepExpect
}

export type Pkcs11Lesson = LinearLessonBase<Pkcs11LessonStep>

const requireModule = (hsm: HsmContextValue) => {
  const M = hsm.moduleRef.current
  if (!M) throw new Error('HSM module not loaded — run the first step of this lesson first.')
  return M
}

export const FOUNDATIONS_LESSONS: Pkcs11Lesson[] = [
  {
    id: 'cryptoki-model',
    n: 1,
    tag: 'Core',
    tone: 'ok',
    title: 'The Cryptoki model — slots, tokens, sessions, login',
    blurb:
      'Every PKCS#11 call happens through a session, opened against a token, that lives in a slot. This walkthrough boots the real engine and shows what each layer actually is — then deliberately breaks one to show what an honest failure looks like.',
    setup:
      'PKCS#11 (Cryptoki) separates "what device" (slot → token) from "how you talk to it" (session → login). Get this model straight and every later operation — key generation, signing, wrapping — is just "which session, which handle."',
    steps: [
      {
        op: 'C_Initialize / C_InitToken / C_OpenSession',
        label: 'Boot the library, format a token, and open an authenticated session',
        run: async (hsm) => {
          if (!hsm.isReady) {
            const ok = await hsm.autoInit('rust')
            if (!ok) throw new Error('Engine boot failed.')
          }
          return {
            detail: `Slot ${hsm.slotRef.current}, session handle ${hsm.hSessionRef.current} — authenticated as CKU_USER.`,
          }
        },
      },
      {
        op: 'C_GetTokenInfo',
        label: "Read back the token's identity",
        run: (hsm) => {
          const M = requireModule(hsm)
          const info = hsm_getTokenInfo(M, hsm.slotRef.current)
          return {
            detail: `label="${info.label}" manufacturer="${info.manufacturerID}" model="${info.model}" — nothing here required a session, just the slot ID.`,
          }
        },
      },
      {
        op: 'C_GetSessionInfo',
        label: "Read back this session's own state",
        run: (hsm) => {
          const M = requireModule(hsm)
          const info = hsm_getSessionInfo(M, hsm.hSessionRef.current)
          return {
            detail: `slotID=${info.slotID} state=${info.state} flags=0x${info.flags.toString(16)} — state reflects the R/W + User Functions login you just performed.`,
          }
        },
      },
      {
        op: 'C_GetSessionInfo (unopened handle)',
        label: 'Try the same call on a session handle nobody ever opened',
        expect: 'refusal',
        run: (hsm) => {
          const M = requireModule(hsm)
          // 999999 is guaranteed to not be a handle this token ever issued.
          hsm_getSessionInfo(M, 999999)
          return { detail: 'Unexpectedly succeeded — this should not happen.' }
        },
      },
    ],
    notes: [
      'A slot is a socket; a token is what (if anything) is plugged into it. SoftHSM presents both as software, but the distinction matters for real hardware — a slot can be empty.',
      'C_GetTokenInfo needed only a slot ID — no session, no login. C_GetSessionInfo needed a real, currently-open session handle.',
      'The refusal step is not a bug being demonstrated — CKR_SESSION_HANDLE_INVALID is PKCS#11 working exactly as specified: the library has no idea what handle 999999 refers to, so it says so.',
    ],
    whyItMatters:
      'Nearly every PKCS#11 bug report in the wild is actually a confusion between these layers — passing a slot ID where a session handle was expected, or calling an authenticated-only operation before C_Login. Once the model is solid, the error codes stop being mysterious.',
    tryRef: ['keystore'],
  },
]
