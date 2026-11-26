// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { questionKey } from '@/components/Assistant/askedKey'
import { ASKED_MAX_ENTRIES, readEntries, useAssistantAskedStore } from './useAssistantAskedStore'

const store = () => useAssistantAskedStore.getState()

beforeEach(() => {
  localStorage.clear()
  store().clear()
})

describe('the questions the Assistant asked, by state', () => {
  it('keeps a hash of the question and a hash of the state, never the words', () => {
    store().remember(['What is ML-KEM?'], 'abcdef01')
    expect(store().entries).toEqual([{ q: questionKey('What is ML-KEM?'), s: 'abcdef01' }])
    expect(localStorage.getItem('pqc-assistant-asked')).not.toContain('ML-KEM')
  })
  it('holds a question once per state, however the letters are cased', () => {
    store().remember(['What is ML-KEM?', ' what is ml-kem? '], 'abcdef01')
    store().remember(['What is ML-KEM?'], 'abcdef01')
    expect(store().entries).toHaveLength(1)
    store().remember(['What is ML-KEM?'], 'abcdef02')
    expect(store().entries).toHaveLength(2)
  })
  it('keeps only the most recent entries', () => {
    store().remember(
      Array.from({ length: ASKED_MAX_ENTRIES + 20 }, (_, i) => `question ${i}`),
      'abcdef01'
    )
    expect(store().entries).toHaveLength(ASKED_MAX_ENTRIES)
    expect(store().entries.at(-1)).toEqual({
      q: questionKey(`question ${ASKED_MAX_ENTRIES + 19}`),
      s: 'abcdef01',
    })
  })
  it('reads only entries that are a pair of hashes', () => {
    expect(
      readEntries({
        entries: [
          { q: '0123abcd', s: '0123abcd' },
          { q: 'x', s: '0123abcd' },
          3,
          null,
          { q: '0123abcd' },
        ],
      }).entries
    ).toEqual([{ q: '0123abcd', s: '0123abcd' }])
    expect(readEntries(null).entries).toEqual([])
    expect(readEntries({ entries: 'no' }).entries).toEqual([])
  })
})
