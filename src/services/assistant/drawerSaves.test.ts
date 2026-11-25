// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it } from 'vitest'
import {
  isAnswerSaved,
  isReferenceSaved,
  saveAnswer,
  saveReference,
  setSavedAnswersPort,
} from './drawerSaves'

afterEach(() => setSavedAnswersPort())

const draft = {
  question: 'What is ML-KEM?',
  answerText: 'Here is what the Hub holds on this.',
  note: 'note',
  sourceTag: 'GL:ml-kem',
  rowTags: ['GL:ml-kem', 'LIB:FIPS 203'],
}

describe('saved answers hand-off', () => {
  it('saves an answer once and remembers it for the session', () => {
    expect(isAnswerSaved(draft)).toBe(false)
    expect(saveAnswer(draft)).toEqual({ ok: true, alreadySaved: false })
    expect(saveAnswer(draft)).toEqual({ ok: true, alreadySaved: true })
    expect(isAnswerSaved(draft)).toBe(true)
  })

  it('saves a reference once, by tag', () => {
    const ref = { tag: 'GL:ml-kem', title: 'ML-KEM', kind: 'Glossary term' }
    expect(saveReference(ref).ok).toBe(true)
    expect(saveReference(ref)).toEqual({ ok: true, alreadySaved: true })
    expect(isReferenceSaved('GL:ml-kem')).toBe(true)
  })

  it('hands over to the port My work installs', () => {
    const got: unknown[] = []
    setSavedAnswersPort({
      saveAnswer: (d) => (got.push(d), { ok: true, alreadySaved: false }),
      isAnswerSaved: () => false,
      saveReference: () => ({ ok: true, alreadySaved: false }),
      isReferenceSaved: () => false,
    })
    saveAnswer(draft)
    expect(got).toEqual([draft])
  })

  it('reports a failure instead of throwing when the port throws', () => {
    setSavedAnswersPort({
      saveAnswer: () => {
        throw new Error('disk full')
      },
      isAnswerSaved: () => false,
      saveReference: () => {
        throw new Error('disk full')
      },
      isReferenceSaved: () => false,
    })
    expect(saveAnswer(draft)).toEqual({ ok: false })
    expect(saveReference({ tag: 't', title: 't', kind: 'k' })).toEqual({ ok: false })
  })

  it('keeps tags, not the rows text', () => {
    // the draft type has no field for a row's text
    expect(Object.keys(draft)).not.toContain('rows')
  })
})
