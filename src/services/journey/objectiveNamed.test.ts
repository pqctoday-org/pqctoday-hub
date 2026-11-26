// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What a goal names in the knowledge model, and how the lessons that teach it join the word score. A small made-up
 * set of lessons and links, so each rule is tested alone.
 */
import { describe, it, expect, vi } from 'vitest'
import type { TreeLesson } from './lessons'
import { KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import type {
  KnowledgeCore,
  KnowledgeLink,
  KnowledgeRecord,
} from '@/services/knowledge/knowledgeTypes'

vi.mock('./lessons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./lessons')>()
  const make = (n: number, title: string, description = 'A short lesson.'): TreeLesson =>
    ({
      id: `mod-${n}`,
      lmId: `LM-9${String(n).padStart(2, '0')}`,
      title,
      description,
      durationMin: 30,
      stage: 1,
      stageName: 'Stage',
      trackOrder: n,
      takeFirst: n === 1 ? ['mod-2'] : [],
      niceWorkRoles: [],
      taxonomyAlgorithms: [],
      taxonomyStandards: [],
    }) as unknown as TreeLesson
  // 1 and 2: the lesson that teaches the made-up term, and its prerequisite. 3 to 30: lessons a document is cited by.
  const lessons = [
    make(1, 'Alpha Lesson'),
    make(2, 'Beta Prerequisite'),
    ...Array.from({ length: 28 }, (_, i) =>
      make(i + 3, `Cited Topic${String.fromCharCode(97 + i)}`)
    ),
  ]
  return {
    ...actual,
    TREE_LESSONS: lessons,
    lessonByTag: (tag: string) => lessons.find((l) => l.lmId === tag),
  }
})

import { buildPreview } from './objectiveBuilder'
import { linkEvidence, resolveNamed } from './objectiveNamed'

const rec = (id: string, kind: string, label: string): KnowledgeRecord => ({
  id,
  kind,
  type: 't',
  family: 'f',
  label,
  link: `/x/${id}`,
  status: 'active',
})

function readerWith(
  extra: {
    records?: KnowledgeRecord[]
    links?: KnowledgeLink[]
    aliases?: KnowledgeCore['aliases']
  } = {}
): KnowledgeReader {
  const lessonTags = Array.from({ length: 30 }, (_, i) => `LM-9${String(i + 1).padStart(2, '0')}`)
  const core = {
    schema: 'knowledge-core/1',
    meta: {
      counts: { records: 0, links: 0, aliases: 0, by_kind: {} },
      inputs: [],
      input_patterns: [],
    },
    records: [
      ...lessonTags.map((t) => rec(t, 'module', t)),
      rec('LM-901/s:zorb', 'module section', 'The Zorb Section'),
      rec('GL:zorbkem', 'glossary term', 'Zorbkem'),
      rec('LIB:zorb-doc', 'library document', 'Zorb Standard'),
      rec('GL:hybrid-zorb', 'glossary term', 'Hybrid Zorb'),
      rec('GL:pqc', 'glossary term', 'PQC'),
      rec('GL:post-quantum', 'glossary term', 'Post Quantum Cryptography'),
      rec('GL:retired', 'glossary term', 'Retired Term'),
      ...(extra.records ?? []),
    ],
    aliases: {
      zorbkem: [['GL:zorbkem', 'label']],
      'zorb standard': [['LIB:zorb-doc', 'label']],
      'hybrid zorb': [['GL:hybrid-zorb', 'label']],
      zorb: [['GL:zorbkem', 'alias']],
      pqc: [['GL:pqc', 'acronym']],
      'post quantum cryptography': [['GL:post-quantum', 'label']],
      'lm 901': [['LM-901', 'former-id']],
      alpha: [['LM-901', 'label']],
      constructor: [['GL:zorbkem', 'former-id']],
      'ghost term': [['GL:retired', 'label']],
      ...(extra.aliases ?? {}),
    },
    links: [
      ['GL:zorbkem', 'taught_in', 'LM-901/s:zorb', 'declared', 'x'],
      ['GL:hybrid-zorb', 'taught_in', 'LM-902', 'declared', 'x'],
      ['GL:pqc', 'taught_in', 'LM-903', 'declared', 'x'],
      ['GL:post-quantum', 'taught_in', 'LM-903', 'declared', 'x'],
      // a library document cited by 20 lessons
      ...Array.from({ length: 20 }, (_, i) => [
        'LIB:zorb-doc',
        'taught_in',
        `LM-9${String(i + 10).padStart(2, '0')}`,
        'declared',
        'x',
      ]),
      // a term whose lesson is not in the tree
      ['GL:retired', 'taught_in', 'LM-999', 'declared', 'x'],
      ...(extra.links ?? []),
    ] as KnowledgeLink[],
    relations: {},
  } as unknown as KnowledgeCore
  return new KnowledgeReader(core)
}

const base = { persona: null, existing: [], isDone: () => false }
const reader = readerWith()
const tags = (goal: string, withReader = true) =>
  buildPreview({
    ...base,
    goal,
    named: withReader ? resolveNamed(reader, goal) : undefined,
  })

describe('resolveNamed', () => {
  it('finds a term named by the goal and the lesson and section that teach it', () => {
    const named = resolveNamed(reader, 'understand zorbkem')
    expect(named).toHaveLength(1)
    expect(named[0]).toMatchObject({ id: 'GL:zorbkem', kind: 'glossary term', phrase: 'zorbkem' })
    expect(named[0].lessons).toEqual([
      {
        lmId: 'LM-901',
        section: 'LM-901/s:zorb',
        sectionLabel: 'The Zorb Section',
        basis: 'declared',
      },
    ])
  })

  it('takes the longest phrase first and does not read its words again', () => {
    const named = resolveNamed(reader, 'a hybrid zorb')
    expect(named.map((n) => n.id)).toEqual(['GL:hybrid-zorb'])
  })

  it('ignores a phrase of stop words and subject words, a former id, a record of another kind and a missing lesson', () => {
    expect(resolveNamed(reader, 'learn about PQC')).toEqual([])
    expect(resolveNamed(reader, 'post quantum cryptography')).toEqual([])
    expect(resolveNamed(reader, 'lm 901')).toEqual([])
    expect(resolveNamed(reader, 'alpha')).toEqual([])
    expect(resolveNamed(reader, 'ghost term')).toEqual([])
  })

  it('does not read the name table\'s prototype ("constructor")', () => {
    expect(resolveNamed(reader, 'constructor')).toEqual([])
    expect(resolveNamed(reader, '__proto__ toString')).toEqual([])
  })

  it('keeps a PQC-with-more-words phrase: only a phrase made entirely of subject words is ignored', () => {
    const r = readerWith({
      records: [rec('GL:pqc-migration', 'glossary term', 'PQC migration')],
      aliases: { 'pqc migration': [['GL:pqc-migration', 'label']] },
      links: [['GL:pqc-migration', 'taught_in', 'LM-904', 'declared', 'x']],
    })
    expect(resolveNamed(r, 'plan pqc migration').map((n) => n.id)).toEqual(['GL:pqc-migration'])
  })
})

describe('linkEvidence', () => {
  it('scores a term taught in one lesson high and a document cited by 20 lessons low', () => {
    const strong = linkEvidence(resolveNamed(reader, 'zorbkem')).get('LM-901')?.score ?? 0
    const weak = [...linkEvidence(resolveNamed(reader, 'zorb standard')).values()]
    expect(strong).toBe(6)
    expect(weak).toHaveLength(20)
    for (const w of weak) expect(w.score).toBeLessThan(1)
  })

  it('counts records named by the same words once, and two named things pointing at one lesson together up to the cap', () => {
    const r = readerWith({
      records: [rec('protocol:zorbkem', 'protocol', 'Zorbkem')],
      aliases: {
        zorbkem: [
          ['GL:zorbkem', 'label'],
          ['protocol:zorbkem', 'label'],
        ],
      },
      links: [['protocol:zorbkem', 'taught_in', 'LM-901', 'declared', 'x']],
    })
    expect(linkEvidence(resolveNamed(r, 'zorbkem')).get('LM-901')?.score).toBe(6)
    const both = linkEvidence(resolveNamed(r, 'zorbkem hybrid zorb'))
    expect(both.get('LM-901')?.score).toBe(6)
    expect(both.get('LM-902')?.score).toBe(6)
  })
})

describe('buildPreview with the knowledge model', () => {
  it('a named term taught in one lesson makes that lesson a required match with its take-first lesson, with the reason', () => {
    const p = tags('understand zorbkem')
    const req = p.steps.filter((s) => s.required)
    expect(req.map((s) => s.tag)).toEqual(['LM-902', 'LM-901'])
    expect(req.find((s) => s.tag === 'LM-901')?.origin).toEqual({ type: 'match' })
    expect(req.find((s) => s.tag === 'LM-902')?.origin).toEqual({
      type: 'take-first',
      for: 'LM-901',
    })
    expect(p.mapped).toEqual(['LM-901'])
    expect(p.reasons?.['LM-901']?.[0]).toMatchObject({
      record: 'GL:zorbkem',
      recordLabel: 'Zorbkem',
      section: 'LM-901/s:zorb',
      sectionLabel: 'The Zorb Section',
    })
    expect(p.state).toBe('ready')
  })

  it('without the model the same goal is a gap, as the words alone say', () => {
    const p = tags('understand zorbkem', false)
    expect(p.state).toBe('gap')
    expect(p.steps).toHaveLength(0)
    expect(p.reasons).toBeUndefined()
  })

  it('a document cited by many lessons is weak evidence: no lesson is matched by it', () => {
    const p = tags('zorb standard')
    expect(p.steps.filter((s) => s.required)).toHaveLength(0)
    expect(p.state).toBe('gap')
    expect(p.reasons).toBeUndefined()
  })

  it('an empty list of named records, no list, and a goal that names nothing all give the word-only result', () => {
    for (const goal of ['alpha lesson', 'cited topica', 'underwater basket weaving']) {
      const plain = buildPreview({ ...base, goal })
      expect(buildPreview({ ...base, goal, named: [] })).toEqual(plain)
      expect(buildPreview({ ...base, goal, named: resolveNamed(reader, goal) })).toEqual(plain)
    }
  })

  it('a hit on a subject word alone (PQC) is ignored: the goal stays broad', () => {
    expect(tags('learn about PQC').state).toBe('broad')
    expect(tags('post quantum cryptography').state).toBe('broad')
  })

  it('adds to the word score: a lesson the goal names in its title and a link points to still leads', () => {
    const p = tags('alpha zorbkem')
    expect(p.mapped[0]).toBe('LM-901')
  })

  it('is deterministic: the same goal and links give the same preview', () => {
    const a = tags('understand zorbkem and hybrid zorb')
    const b = tags('understand zorbkem and hybrid zorb')
    expect(a).toEqual(b)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('keeps the caps: at most 3 matches and 7 required lessons', () => {
    const r = readerWith({
      aliases: { many: [['GL:many', 'label']] },
      records: [rec('GL:many', 'glossary term', 'Many')],
      links: Array.from({ length: 3 }, (_, i) => [
        'GL:many',
        'taught_in',
        `LM-9${String(i + 20).padStart(2, '0')}`,
        'declared',
        'x',
      ]) as KnowledgeLink[],
    })
    const p = buildPreview({ ...base, goal: 'many', named: resolveNamed(r, 'many') })
    expect(p.mapped.length).toBeLessThanOrEqual(3)
    expect(p.steps.filter((s) => s.required).length).toBeLessThanOrEqual(7)
    expect(p.mapped).toHaveLength(3)
  })
})
