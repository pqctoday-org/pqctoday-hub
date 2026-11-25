// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What My work shows about a saved answer, read by structure from the payload the Assistant handed over
 * (handoff 9.9): the answer text, the note, the source tag and the tags of the rows. Row text is never
 * kept; it is read again from the Hub's records when the answer is opened.
 *
 * Nothing here depends on the Assistant's own types, so the two can change apart. A payload that has
 * none of these fields still shows its question.
 */

export interface AnswerSummary {
  answerText?: string
  note?: string
  sourceTag?: string
  rowTags: string[]
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined)

export function summarizeAnswerPayload(payload: unknown): AnswerSummary {
  if (!isRecord(payload)) return { rowTags: [] }
  const rowTags: string[] = []
  const add = (v: unknown) => {
    if (typeof v === 'string' && v && !rowTags.includes(v)) rowTags.push(v)
  }
  if (Array.isArray(payload.rowTags)) payload.rowTags.forEach(add)
  if (Array.isArray(payload.groups)) {
    for (const g of payload.groups) {
      if (!isRecord(g)) continue
      for (const key of ['rows', 'more'] as const) {
        const rows = g[key]
        if (Array.isArray(rows)) rows.forEach((r) => isRecord(r) && add(r.tag))
      }
    }
  }
  const source = isRecord(payload.source) ? text(payload.source.tag) : undefined
  return {
    answerText: text(payload.answerText),
    note: text(payload.note),
    sourceTag: text(payload.sourceTag) ?? source,
    rowTags,
  }
}
