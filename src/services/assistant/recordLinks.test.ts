// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'
import type { KnowledgeRecord } from '@/services/knowledge/knowledgeTypes'
import { answer, forgetAssistant } from './adapter'
import { homeLessonOf, recordLinkOf } from './recordLinks'
import { stubKnowledgeFetch } from './testSupport'

const rec = (over: Partial<KnowledgeRecord> & { id: string }): KnowledgeRecord =>
  ({
    label: over.id,
    type: 't',
    link: `/x/${over.id}`,
    status: 'active',
    ...over,
  }) as KnowledgeRecord
const records = [
  rec({ id: 'LM-005', label: 'Standards Bodies', type: 'module', link: '/learn/standards-bodies' }),
  rec({ id: 'LM-005/s:intro', type: 'section', parent: 'LM-005', place: 'LM-005' }),
  rec({ id: 'LDR:jane', type: 'person', link: '/leaders?leader=jane', place: 'LM-005' }),
  rec({ id: 'PRD:alone', type: 'product' }),
  rec({ id: 'PRD:lost', type: 'product', place: 'LM-404' }),
  rec({ id: 'BT:tool', type: 'tool', link: '/business/tools/a-tool', place: 'LM-005' }),
  rec({ id: 'PRD:p', type: 'product' }),
  rec({ id: 'PRD:q', type: 'product' }),
  rec({ id: 'VND-1', type: 'vendor' }),
  rec({ id: 'CERT:a', type: 'certification', label: 'ACVP #A1: Thing Inc., Thing' }),
  rec({ id: 'CERT:cc', type: 'certification', label: 'Common Criteria #cc-thing: Thing' }),
  rec({ id: 'CERT:long', type: 'certification', label: `${'x'.repeat(41)} #1: Thing` }),
  rec({ id: 'SRC:s', type: 'source' }),
  rec({ id: 'LIB:d', type: 'document' }),
]
const links = [
  ['PRD:p', 'made_by', 'VND-1'],
  ['CERT:a', 'certifies', 'PRD:p'],
  ['CERT:cc', 'certifies', 'PRD:p'],
  ['CERT:long', 'certifies', 'PRD:p'],
  ['LIB:d', 'published_by', 'SRC:s'],
].map((l) => [...l, 'declared', 'x'])
const reader = {
  get: (tag: string) => records.find((r) => r.id === tag),
  recordAt: (address: string) => records.find((r) => r.link === address),
  linksOf: (tag: string) => ({
    out: links.filter((l) => l[0] === tag),
    in: links.filter((l) => l[2] === tag),
  }),
} as never

describe('the home lesson of a record', () => {
  it('is the lesson it belongs to', () => {
    expect(homeLessonOf(reader, 'LDR:jane', '/leaders?leader=jane')).toEqual({
      tag: 'LM-005',
      title: 'Standards Bodies',
      link: '/learn/standards-bodies',
    })
  })
  it('is found by the record address when the row tag is not the record tag (a tool)', () => {
    expect(homeLessonOf(reader, 'TOOL:a-tool', '/business/tools/a-tool')?.tag).toBe('LM-005')
  })
  it('is none for a record with none, a lesson, a part of its own lesson, a lesson the file does not hold, or an unknown tag', () => {
    expect(homeLessonOf(reader, 'PRD:alone', '/x/PRD:alone')).toBeNull()
    expect(homeLessonOf(reader, 'LM-005', '/learn/standards-bodies')).toBeNull()
    expect(homeLessonOf(reader, 'LM-005/s:intro', '/x/LM-005/s:intro')).toBeNull()
    expect(homeLessonOf(reader, 'PRD:lost', '/x/PRD:lost')).toBeNull()
    expect(homeLessonOf(reader, 'NOT:there', '/nowhere')).toBeNull()
  })
})

describe('the link of its kind that a record holds', () => {
  it('names the link of a product, a vendor, a certification and a source', () => {
    expect(recordLinkOf(reader, 'PRD:p')).toEqual({ relation: 'made_by' })
    expect(recordLinkOf(reader, 'VND-1')).toEqual({ relation: 'makes' })
    expect(recordLinkOf(reader, 'CERT:a')).toEqual({ relation: 'certifies', name: 'ACVP #A1' })
    expect(recordLinkOf(reader, 'SRC:s')).toEqual({ relation: 'publishes' })
  })
  it('is none for a record without the link, a certification the Hub does not name by number, a document and an unknown tag', () => {
    expect(recordLinkOf(reader, 'PRD:q')).toBeNull()
    expect(recordLinkOf(reader, 'CERT:cc')).toBeNull()
    expect(recordLinkOf(reader, 'CERT:long')).toBeNull()
    expect(recordLinkOf(reader, 'LIB:d')).toBeNull()
    expect(recordLinkOf(reader, 'NOT:there')).toBeNull()
  })
})

describe('what the engine sends with an answer (real knowledge files)', () => {
  stubKnowledgeFetch()
  afterAll(() => {
    vi.unstubAllGlobals()
    forgetAssistant()
  })
  const core = JSON.parse(
    readFileSync(join(process.cwd(), 'public/data/knowledge-core.json'), 'utf8')
  ) as { records: KnowledgeRecord[] }
  const byId = new Map(core.records.map((r) => [r.id, r]))

  it('puts the home lesson on each row that has one, as the knowledge file says', async () => {
    const a = await answer('Who makes 1Password?')
    if (a.state === 'data-not-loaded') throw new Error('the data did not load')
    const rows = a.groups.flatMap((g) => [...g.rows, ...g.more])
    const withLesson = rows.filter((r) => r.homeLesson)
    expect(withLesson.length).toBeGreaterThan(0)
    for (const r of rows) {
      const place = byId.get(r.tag)?.place
      if (r.homeLesson) expect(r.homeLesson.tag).toBe(place)
      if (r.tag.startsWith('LM-')) expect(r.homeLesson ?? null).toBeNull()
    }
    expect(rows.find((r) => r.tag === 'PRD:1password')?.homeLesson?.title).toBe(
      byId.get(byId.get('PRD:1password')!.place!)!.label
    )
  }, 60_000)

  it('names the link of the record an answer is drawn from', async () => {
    const a = await answer('Who makes 1Password?')
    expect(a.state).toBe('direct')
    expect(a.state === 'direct' && a.source.recordLink).toEqual({ relation: 'made_by' })
  }, 60_000)
})
