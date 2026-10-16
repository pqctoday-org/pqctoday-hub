// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  emptyQuestion,
  questionGaps,
  questionMarkdown,
  questionSaveRequest,
  readQuestion,
  RESEARCH_QUESTION_SCHEMA,
  RESEARCH_QUESTION_TYPES,
} from './researchQuestion'

const q = {
  ...emptyQuestion(),
  question: 'Is the X25519MLKEM768 codepoint stable?',
  type: 'protocol-binding' as const,
  inclusion: 'IETF drafts and RFCs',
}

describe('research question', () => {
  it('offers the seven question types', () => {
    expect(RESEARCH_QUESTION_TYPES.map((t) => t.label)).toEqual([
      'Standard state',
      'Security claim',
      'Implementation result',
      'Threat forecast',
      'Protocol binding',
      'Domain impact',
      'Patent landscape',
    ])
  })

  it('renders the question, its type and states blank fields', () => {
    const md = questionMarkdown(q)
    expect(md).toContain('> Is the X25519MLKEM768 codepoint stable?')
    expect(md).toContain('- Type: Protocol binding')
    expect(md).toContain('## Included sources\n\nIETF drafts and RFCs')
    expect(md).toContain('## Evidence threshold\n\n_Not stated._')
  })

  it('names the blank criteria', () => {
    expect(questionGaps(q)).toEqual(['exclusion criteria', 'evidence threshold'])
  })

  it('reads a saved question back and repairs an unknown type', () => {
    expect(readQuestion({ type: 'research-question', inputs: q })).toEqual(q)
    expect(
      readQuestion({
        type: 'research-question',
        inputs: { schema: RESEARCH_QUESTION_SCHEMA, question: 'x', type: 'bogus' },
      })
    ).toMatchObject({ type: 'standard-state', inclusion: '', exclusion: '', threshold: '' })
    expect(readQuestion({ type: 'research-question', inputs: { question: 'x' } })).toBeNull()
    expect(readQuestion({ type: 'library-collection', inputs: q })).toBeNull()
  })

  it('titles the saved document from the question', () => {
    const req = questionSaveRequest(
      { ...q, question: 'a'.repeat(100) },
      'research-question:1',
      true
    )
    expect(req.title).toHaveLength(78)
    expect(req.revisionSummary).toBe('Question edited')
    expect(req.type).toBe('research-question')
  })
})
