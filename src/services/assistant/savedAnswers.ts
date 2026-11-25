// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The small interface through which the Assistant drawer hands a saved answer to My work.
 *
 * The drawer calls `saveAnswer` when the learner presses "Save answer", `listSavedAnswers` to show
 * "Saved to My work" on an answer already saved, and `removeSavedAnswer` to undo it. Everything lands in
 * the device-local My work store (`pqc-my-work`): never in the Drive sync, the embed auto-save or a backup.
 *
 * This file knows nothing about the answer's shape. The payload is stored as given (it must be plain JSON);
 * My work reads the few fields it shows by structure only (see `myWork/answerSummary.ts`).
 */
import { stableId, type StorageFailureReason } from '@/store/deviceLocalJson'
import { useMyWorkStore, type SavedAnswerRecord } from '@/store/useMyWorkStore'
import { trackMyWork } from '@/services/myWork/myWorkAnalytics'

/** What the drawer hands over. `payload` is the answer as the drawer keeps it (plain JSON). */
export interface SavedAnswerInput {
  question: string
  /** ISO time the learner pressed Save. */
  savedAt: string
  payload: unknown
}

export type SavedAnswer = SavedAnswerRecord

export type SaveAnswerResult =
  | {
      ok: true
      id: string
      /** True when this answer was already saved: nothing was added. */ duplicate: boolean
    }
  | { ok: false; reason: StorageFailureReason }

export type RemoveSavedAnswerResult = { ok: true } | { ok: false; reason: StorageFailureReason }

/** The id a saved answer gets: the same question saved at the same moment is the same answer (J08). */
export function savedAnswerId(input: Pick<SavedAnswerInput, 'question' | 'savedAt'>): string {
  return stableId('ans', `${input.question}\u0000${input.savedAt}`)
}

export function saveAnswer(answer: SavedAnswerInput): SaveAnswerResult {
  if (typeof answer.question !== 'string' || !answer.question.trim()) {
    return { ok: false, reason: 'invalid' }
  }
  const id = savedAnswerId(answer)
  const result = useMyWorkStore.getState().saveAnswer({
    id,
    question: answer.question,
    savedAt: answer.savedAt,
    payload: answer.payload,
  })
  if (!result.ok) return result
  if (!result.value.duplicate) trackMyWork('answer_saved')
  return { ok: true, id, duplicate: result.value.duplicate }
}

/** Saved answers, oldest first. */
export function listSavedAnswers(): SavedAnswer[] {
  return useMyWorkStore.getState().answers
}

export function removeSavedAnswer(id: string): RemoveSavedAnswerResult {
  const result = useMyWorkStore.getState().removeAnswer(id)
  if (!result.ok) return result
  trackMyWork('answer_removed')
  return { ok: true }
}
