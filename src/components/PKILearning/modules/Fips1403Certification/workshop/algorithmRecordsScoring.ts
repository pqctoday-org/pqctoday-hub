// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: FIPS author
/* eslint-disable security/detect-object-injection -- keys are the RecordMarkId union, never user input */
/**
 * Pure scoring for the workshop step `fips-algorithm-records`. A mark is right when the learner's
 * Listed / Not listed matches the record; an item is right when every one of its marks is right
 * (or, for the single-choice item, when the chosen statement is the supported one).
 */
import {
  RECORDS_GENERIC_FEEDBACK,
  RECORDS_SCORE_BANDS,
  RECORDS_SCORE_ENDING,
  type AlgorithmRecordChoiceItem,
  type AlgorithmRecordCompareItem,
  type RecordMark,
  type RecordMarkId,
} from '../data/fipsData'

export type Answer = 'listed' | 'not-listed'
export type MarkAnswers = Partial<Record<RecordMarkId, Answer>>

export const ANSWER_LABEL: Readonly<Record<Answer, string>> = {
  listed: 'Listed',
  'not-listed': 'Not listed',
}

/** The marks an item carries, in the order the learner sees them. */
export function marksOf(
  item: AlgorithmRecordCompareItem
): { id: RecordMarkId; mark: RecordMark }[] {
  const marks: { id: RecordMarkId; mark: RecordMark }[] = [
    { id: 'validation', mark: item.validation },
    { id: 'approved-table', mark: item.approvedTable },
  ]
  if (item.functionTable) marks.push({ id: 'function-table', mark: item.functionTable })
  return marks
}

export interface MarkVerdict {
  id: RecordMarkId
  mark: RecordMark
  learner: Answer | undefined
  correct: boolean
}

export interface CompareVerdict {
  marks: MarkVerdict[]
  wrong: number
  ok: boolean
}

/** A mark is right when the learner's Listed / Not listed matches the record. */
export function judgeCompareItem(
  item: AlgorithmRecordCompareItem,
  answers: MarkAnswers
): CompareVerdict {
  const marks = marksOf(item).map(({ id, mark }) => {
    const learner = answers[id]
    return {
      id,
      mark,
      learner,
      correct: learner === (mark.listed ? 'listed' : 'not-listed'),
    }
  })
  const wrong = marks.filter((m) => !m.correct).length
  return { marks, wrong, ok: wrong === 0 }
}

export function judgeChoiceItem(item: AlgorithmRecordChoiceItem, choiceId: string | undefined) {
  return item.choices.some((c) => c.id === choiceId && c.ok)
}

/** The score band text for `score` correct items, ending with the shared sentence. */
export function scoreBandText(score: number): string {
  const band = RECORDS_SCORE_BANDS.find((b) => score >= b.min) ?? RECORDS_SCORE_BANDS.at(-1)
  return `${band?.text ?? ''} ${RECORDS_SCORE_ENDING}`.trim()
}

/** The generic feedback line for an item with `wrong` of `total` marks differing. */
export function genericFeedback(wrong: number, total: number): string {
  if (wrong >= total) return RECORDS_GENERIC_FEEDBACK.allWrong
  return wrong === 1 ? RECORDS_GENERIC_FEEDBACK.oneWrong : RECORDS_GENERIC_FEEDBACK.someWrong
}
