// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The hand-off from the drawer's "Save answer" and "Save to My work" to the learner's stored work.
 *
 * The drawer owns the buttons; My work owns the storage. This file is only the seam between them:
 * a small port whose default writes to the device-local My work store. Tests install their own
 * with `setSavedAnswersPort`.
 *
 * A saved answer keeps the question, the answer text, the note, the source tag and the tags of the
 * rows. It never keeps the rows' text (the text is read again from the knowledge files when shown).
 */

import { listSavedAnswers, saveAnswer as saveToMyWork } from './savedAnswers'
import { useMyWorkStore } from '@/store/useMyWorkStore'

export interface SavedAnswerDraft {
  question: string
  answerText: string
  note: string
  sourceTag?: string
  rowTags: string[]
}

export interface SavedReferenceDraft {
  tag: string
  title: string
  kind: string
  /** The question the record was opened from, when there was one. */
  question?: string
}

export type SaveResult = { ok: true; alreadySaved: boolean } | { ok: false }

export interface SavedAnswersPort {
  saveAnswer: (draft: SavedAnswerDraft) => SaveResult
  isAnswerSaved: (draft: Pick<SavedAnswerDraft, 'question' | 'answerText'>) => boolean
  saveReference: (draft: SavedReferenceDraft) => SaveResult
  isReferenceSaved: (tag: string) => boolean
}

const answerTextOf = (payload: unknown): string | undefined =>
  typeof payload === 'object' && payload !== null && 'answerText' in payload
    ? String((payload as { answerText: unknown }).answerText)
    : undefined

/** The default: everything lands in the device-local My work store. */
function createMyWorkPort(): SavedAnswersPort {
  const isAnswerSaved = (d: Pick<SavedAnswerDraft, 'question' | 'answerText'>) =>
    listSavedAnswers().some(
      (a) => a.question === d.question && answerTextOf(a.payload) === d.answerText
    )
  const isReferenceSaved = (tag: string) =>
    useMyWorkStore.getState().references.some((r) => r.tag === tag)
  return {
    saveAnswer: (draft) => {
      if (isAnswerSaved(draft)) return { ok: true, alreadySaved: true }
      const result = saveToMyWork({
        question: draft.question,
        savedAt: new Date().toISOString(),
        payload: {
          answerText: draft.answerText,
          note: draft.note,
          sourceTag: draft.sourceTag,
          rowTags: draft.rowTags,
        },
      })
      return result.ok ? { ok: true, alreadySaved: result.duplicate } : { ok: false }
    },
    isAnswerSaved,
    saveReference: (draft) => {
      const result = useMyWorkStore.getState().saveReference({
        tag: draft.tag,
        title: draft.title,
        kind: draft.kind,
        savedFrom: 'assistant',
        ...(draft.question ? { question: draft.question } : {}),
      })
      return result.ok ? { ok: true, alreadySaved: result.value.duplicate } : { ok: false }
    },
    isReferenceSaved,
  }
}

let port: SavedAnswersPort = createMyWorkPort()

/** Tests install a stand-in here. Pass nothing to go back to the My work default. */
export function setSavedAnswersPort(next?: SavedAnswersPort): void {
  port = next ?? createMyWorkPort()
}

export const saveAnswer = (draft: SavedAnswerDraft): SaveResult => {
  try {
    return port.saveAnswer(draft)
  } catch {
    return { ok: false }
  }
}
export const isAnswerSaved = (draft: Pick<SavedAnswerDraft, 'question' | 'answerText'>): boolean =>
  port.isAnswerSaved(draft)
export const saveReference = (draft: SavedReferenceDraft): SaveResult => {
  try {
    return port.saveReference(draft)
  } catch {
    return { ok: false }
  }
}
export const isReferenceSaved = (tag: string): boolean => port.isReferenceSaved(tag)
