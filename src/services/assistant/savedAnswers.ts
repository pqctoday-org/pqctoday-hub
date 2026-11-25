// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The hand-off from the drawer's "Save answer" and "Save to My work" to the learner's stored work.
 *
 * The drawer owns the buttons; My work owns the storage. This file is only the seam between them:
 * a small port, with a session-only default so the buttons work before My work is wired in.
 * My work installs its own with `setSavedAnswersPort`.
 *
 * A saved answer keeps the question, the answer text, the note, the source tag and the tags of the
 * rows. It never keeps the rows' text (the text is read again from the knowledge files when shown).
 */

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

function createSessionPort(): SavedAnswersPort {
  const answers = new Map<string, SavedAnswerDraft>()
  const references = new Map<string, SavedReferenceDraft>()
  const answerKey = (d: Pick<SavedAnswerDraft, 'question' | 'answerText'>) =>
    `${d.question}\u0000${d.answerText}`
  return {
    saveAnswer: (draft) => {
      const key = answerKey(draft)
      const alreadySaved = answers.has(key)
      if (!alreadySaved) answers.set(key, draft)
      return { ok: true, alreadySaved }
    },
    isAnswerSaved: (draft) => answers.has(answerKey(draft)),
    saveReference: (draft) => {
      const alreadySaved = references.has(draft.tag)
      if (!alreadySaved) references.set(draft.tag, draft)
      return { ok: true, alreadySaved }
    },
    isReferenceSaved: (tag) => references.has(tag),
  }
}

let port: SavedAnswersPort = createSessionPort()

/** My work installs the real store here. Pass nothing to go back to the session-only default. */
export function setSavedAnswersPort(next?: SavedAnswersPort): void {
  port = next ?? createSessionPort()
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
