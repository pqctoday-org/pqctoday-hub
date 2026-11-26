// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import type { KnowledgeCore, KnowledgeRecord } from '@/services/knowledge/knowledgeTypes'
import { isGlossaryTag, termLessonsFrom } from './termLessons'

const rec = (id: string, extra: Partial<KnowledgeRecord> = {}): KnowledgeRecord => ({
  id,
  kind: 'k',
  type: 'term',
  family: 'f',
  label: id,
  link: `/x/${id}`,
  status: 'active',
  ...extra,
})

const core: KnowledgeCore = {
  schema: 'knowledge-core/1',
  meta: {
    counts: { records: 0, links: 0, aliases: 0, by_kind: {} },
    inputs: [],
    input_patterns: [],
  },
  records: [
    rec('LM-1', { type: 'module', label: 'First lesson', link: '/learn/first' }),
    rec('LM-1/s:a', {
      type: 'section',
      parent: 'LM-1',
      label: 'A section',
      link: '/learn/first?section=a',
    }),
    rec('LM-2', { type: 'module', label: 'Second lesson', link: '/learn/second' }),
    rec('LM-2/w:s1', {
      type: 'step',
      parent: 'LM-2',
      label: 'A step',
      link: '/learn/second?tab=workshop&step=1',
    }),
    rec('GL:two', { link: '/learn?glossary=Two' }),
    rec('GL:none', { link: '/learn?glossary=None' }),
    rec('GL:lesson', { link: '/learn?glossary=Lesson' }),
  ],
  aliases: {},
  links: [
    ['GL:two', 'taught_in', 'LM-1/s:a', 'title', 'section title'],
    ['GL:two', 'taught_in', 'LM-2/w:s1', 'title', 'step title'],
    ['GL:two', 'described_by', 'LM-2', 'declared', 'x'],
    ['GL:lesson', 'taught_in', 'LM-2', 'declared', 'x'],
  ],
  relations: {},
  successors: [],
} as unknown as KnowledgeCore

describe('termLessonsFrom (fixture reader)', () => {
  const reader = new KnowledgeReader(core)

  it('names the lesson of a section or step and keeps the link own address, in the model order', () => {
    expect(termLessonsFrom(reader, 'GL:two')).toEqual([
      { lessonTitle: 'First lesson', link: '/learn/first?section=a', tag: 'LM-1/s:a' },
      { lessonTitle: 'Second lesson', link: '/learn/second?tab=workshop&step=1', tag: 'LM-2/w:s1' },
    ])
  })

  it('a link to a lesson itself names that lesson', () => {
    expect(termLessonsFrom(reader, 'GL:lesson')).toEqual([
      { lessonTitle: 'Second lesson', link: '/learn/second', tag: 'LM-2' },
    ])
  })

  it('a term with no taught-in link has none', () => {
    expect(termLessonsFrom(reader, 'GL:none')).toEqual([])
  })

  it('knows a glossary tag', () => {
    expect(isGlossaryTag('GL:ml-kem')).toBe(true)
    expect(isGlossaryTag('LIB:FIPS 203')).toBe(false)
  })
})

describe('termLessonsFrom (the Hub knowledge file)', () => {
  it('GL:ml-kem leads to the section that teaches it', () => {
    const file = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/data/knowledge-core.json'), 'utf8')
    ) as KnowledgeCore
    const reader = new KnowledgeReader(file)
    const lessons = termLessonsFrom(reader, 'GL:ml-kem')
    expect(lessons.length).toBeGreaterThanOrEqual(1)
    expect(lessons[0].tag).toBe('LM-088/s:ml-kem-fips-203')
    expect(lessons[0].link).toBe(reader.linkOf('LM-088/s:ml-kem-fips-203'))
    expect(lessons[0].link).toMatch(/^\/learn\/[a-z0-9-]+\?section=/)
    expect(lessons[0].lessonTitle).toBe(reader.get('LM-088')?.label)
  })
})
