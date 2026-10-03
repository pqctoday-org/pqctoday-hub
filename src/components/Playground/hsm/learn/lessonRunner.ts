// SPDX-License-Identifier: GPL-3.0-only
//
// lessonRunner — the shared step-outcome classifier and engine-boot guard for
// the PKCS#11 Learn tab, used by BOTH HsmLearnView.tsx (the real UI runner)
// and the *.local.test.ts regression tests, so the two can never drift into
// independently-reimplemented copies of the same decision.
import type { Pkcs11LogEntry } from '@/wasm/softhsm'
import type { LessonStepExpect } from '@/components/Playground/learnkit/lessonTypes'
import type { HsmContextValue } from '../HsmContext'

/** The slice of HsmContextValue the boot guard reads. */
export type EngineBootTarget = Pick<
  HsmContextValue,
  'moduleRef' | 'hSessionRef' | 'autoInit' | 'lastInitErrorRef'
>

/** True once a module is loaded AND a user session is open — read from the
 * refs, never from `isReady` state, which is stale inside a step's closure. */
export function engineIsRunning(hsm: EngineBootTarget): boolean {
  return hsm.moduleRef.current !== null && hsm.hSessionRef.current !== 0
}

/**
 * Boot the engine before a lesson step if nothing has booted it yet.
 *
 * Bug fixed 2026-10-02: the HSM playground's default tab is Learn, and the
 * default tab does not auto-boot the engine (only deep links to other tabs
 * do). Only the FIRST lesson of each track (A1, B1) has a boot step, so any
 * other lesson run first on a fresh page — B10 "Trust & wrapping policy" was
 * the one reported — failed every step with "HSM module not loaded". The
 * runner now boots on the learner's behalf, respecting the Engine selector
 * (no engine argument, exactly like the A1/B1 boot step).
 *
 * Steps that boot the engine themselves (`bootsEngine`) are skipped: booting
 * first would make them boot a second time, re-formatting the token, and
 * would hide the C_Initialize/C_InitToken/C_OpenSession calls they teach.
 *
 * @returns true if this call booted the engine, false if nothing was needed.
 * @throws  if the boot failed, with the engine's own error message.
 */
export async function ensureEngineForStep(
  hsm: EngineBootTarget,
  step: { bootsEngine?: boolean }
): Promise<boolean> {
  if (step.bootsEngine || engineIsRunning(hsm)) return false
  const ok = await hsm.autoInit()
  if (!ok) {
    const why = hsm.lastInitErrorRef.current
    throw new Error(`Engine boot failed${why ? `: ${why}` : ''}.`)
  }
  return true
}

/**
 * Decide whether a step's thrown error represents the intended, honest
 * PKCS#11 refusal an `expect: 'refusal'` step is teaching, or an unrelated
 * setup/JS crash (e.g. reading a prior step's result that was never
 * produced because an earlier step was skipped) — those must never be
 * displayed as "Refused, as expected", since that would silently teach the
 * wrong lesson.
 *
 * Only call this once a step has actually thrown — a genuine refusal means
 * the engine was reached: at least one real (non-header) log entry for this
 * step failed with a real PKCS#11 return code (not a WASM-level trap).
 *
 * Checks ALL of this step's calls, not just the most recent one — a step
 * may run cleanup calls in a `finally` block AFTER the refusing call (e.g.
 * restoring a session's login role), and those succeed, so the newest entry
 * alone isn't a reliable signal of what actually happened.
 *
 * @param expect              The step's declared expectation.
 * @param newEntriesThisStep  Log entries produced since this step started,
 *   newest-first (matches the log's own ordering) — including the step's
 *   own header entry.
 */
export function classifyStepOutcome(
  expect: LessonStepExpect | undefined,
  newEntriesThisStep: Pkcs11LogEntry[]
): 'refused-ok' | 'failed' {
  if (expect !== 'refusal') return 'failed'
  const realCalls = newEntriesThisStep.filter((e) => !e.isStepHeader)
  const engineRefused = realCalls.some((e) => e.ok === false && e.rvHex !== 'TRAP')
  return engineRefused ? 'refused-ok' : 'failed'
}
