// SPDX-License-Identifier: GPL-3.0-only
//
// lessonRunner — the shared step-outcome classifier for the PKCS#11 Learn
// tab, used by BOTH HsmLearnView.tsx (the real UI runner) and
// pkcs11Lessons.local.test.ts (the regression test), so the two can never
// drift into independently-reimplemented copies of the same decision.
import type { Pkcs11LogEntry } from '@/wasm/softhsm'
import type { LessonStepExpect } from '@/components/Playground/learnkit/lessonTypes'

/**
 * Decide whether a step's thrown error represents the intended, honest
 * PKCS#11 refusal an `expect: 'refusal'` step is teaching, or an unrelated
 * setup/JS crash (e.g. reading a prior step's result that was never
 * produced because an earlier step was skipped) — those must never be
 * displayed as "Refused, as expected", since that would silently teach the
 * wrong lesson.
 *
 * Only call this once a step has actually thrown — a genuine refusal means
 * the engine was reached: at least one real (non-header) log entry was
 * produced for this step, and the most recent one failed with a real
 * PKCS#11 return code (not a WASM-level trap).
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
  const lastCall = realCalls[0] // newest-first: index 0 is the most recent real call
  const engineRefused = !!lastCall && lastCall.ok === false && lastCall.rvHex !== 'TRAP'
  return engineRefused ? 'refused-ok' : 'failed'
}
