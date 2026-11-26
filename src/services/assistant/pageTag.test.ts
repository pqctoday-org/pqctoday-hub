// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { KnowledgeRecord } from '@/services/knowledge/knowledgeTypes'
import { pageTagFor, type PageLookup } from './pageTag'

const rec = (id: string, link: string): KnowledgeRecord => ({ id, link }) as KnowledgeRecord
const records = [
  rec('LM-001', '/learn/pqc-101'),
  rec('LM-001/s:algorithms', '/learn/pqc-101?section=algorithms'),
  rec('PAGE:compliance', '/compliance'),
  rec('CMP:CNSA-2', '/compliance?framework=CNSA-2'),
]
const reader: PageLookup = {
  get: (tag) => records.find((r) => r.id === tag),
  recordAt: (address) => records.find((r) => r.link === address),
}

describe('the tag of the page the learner is on', () => {
  it('keeps a tag the model knows and drops one it does not', () => {
    expect(pageTagFor('LM-001', reader)).toBe('LM-001')
    expect(pageTagFor('LM-001/s:algorithms', reader)).toBe('LM-001/s:algorithms')
    expect(pageTagFor('LM-999', reader)).toBeNull()
  })
  it('reads a lesson address, with or without a trailing slash, a fragment or other query parts', () => {
    expect(pageTagFor('/learn/pqc-101', reader)).toBe('LM-001')
    expect(pageTagFor('/learn/pqc-101/', reader)).toBe('LM-001')
    expect(pageTagFor('/learn/pqc-101#top', reader)).toBe('LM-001')
    expect(pageTagFor('/learn/pqc-101?tab=workshop', reader)).toBe('LM-001')
  })
  it('reads a section address as the section, and a record address as the record', () => {
    expect(pageTagFor('/learn/pqc-101?section=algorithms', reader)).toBe('LM-001/s:algorithms')
    expect(pageTagFor('/learn/pqc-101?x=1&section=algorithms', reader)).toBe('LM-001/s:algorithms')
    expect(pageTagFor('/compliance?framework=CNSA-2', reader)).toBe('CMP:CNSA-2')
  })
  it('falls back to the page when the record is not in the model', () => {
    expect(pageTagFor('/compliance?framework=NOPE', reader)).toBe('PAGE:compliance')
  })
  it('is null for no page, the home page and a page the model does not list', () => {
    for (const page of [undefined, null, '', '   ', '/', '/nowhere']) {
      expect(pageTagFor(page, reader)).toBeNull()
    }
  })
})
