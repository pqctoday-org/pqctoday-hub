// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import dataFile from '@/services/assistant/data/data.generated.json'
import { KnowledgeReader } from './knowledgeReader'
import type { KnowledgeCore, KnowledgeLink, KnowledgeRecord } from './knowledgeTypes'
import { KIND_CHIP, hasLessonResources, lessonResources } from './lessonResources'

const rec = (
  id: string,
  family: string,
  type: string,
  extra: Partial<KnowledgeRecord> = {}
): KnowledgeRecord => ({
  id,
  kind: `${family} ${type}`,
  type,
  family,
  label: id,
  link: `/x/${id}`,
  status: 'active',
  ...extra,
})

const taught = (from: string, to: string): KnowledgeLink => [from, 'taught_in', to, 'declared', 's']

function readerFor(records: KnowledgeRecord[], links: KnowledgeLink[]): KnowledgeReader {
  const core: KnowledgeCore = {
    schema: 'knowledge-core/1',
    meta: {
      counts: { records: records.length, links: links.length, aliases: 0, by_kind: {} },
      inputs: [],
      input_patterns: [],
    },
    records,
    aliases: {},
    links,
    relations: {},
  }
  return new KnowledgeReader(core)
}

const lesson = rec('LM-020', 'module', 'module', {
  label: 'PKI Workshop',
  link: '/learn/pki-workshop',
})
const section = rec('LM-020/s:csr', 'module', 'section', {
  parent: 'LM-020',
  link: '/learn/pki-workshop?section=csr',
})
const step = rec('LM-020/w:sign', 'step', 'step', {
  parent: 'LM-020',
  link: '/learn/pki-workshop?tab=workshop&step=1',
})
const dates = (initial?: string, update?: string) => ({
  fields: {
    ...(initial ? { initial_publication_date: initial } : {}),
    ...(update ? { last_update_date: update } : {}),
  },
})

describe('lessonResources', () => {
  it('groups terms, documents and use cases, and drops what the box does not show', () => {
    const r = readerFor(
      [
        lesson,
        rec('GL:b', 'glossary', 'term', { label: 'Beta' }),
        rec('GL:a', 'glossary', 'term', { label: 'alpha' }),
        rec('ALG:ml-kem', 'algorithm', 'algorithm', { label: 'ML-KEM' }),
        rec('protocol:tls', 'tool', 'protocol', { label: 'TLS 1.3' }),
        rec('LIB:1', 'library', 'standard', { label: 'FIPS 203' }),
        rec('IL:2', 'usecase', 'usecase', { label: 'Zeta payments' }),
        rec('IL:1', 'usecase', 'usecase', { label: 'Alpha payments' }),
        rec('CMP:DORA', 'compliance', 'guidance', { label: 'DORA' }),
      ],
      [
        taught('GL:b', 'LM-020'),
        taught('GL:a', 'LM-020'),
        taught('ALG:ml-kem', 'LM-020'),
        taught('protocol:tls', 'LM-020'),
        taught('LIB:1', 'LM-020'),
        taught('IL:2', 'LM-020'),
        taught('IL:1', 'LM-020'),
        taught('CMP:DORA', 'LM-020'),
      ]
    )
    const got = lessonResources(r, 'pki-workshop')
    expect(got.terms.map((t) => t.label)).toEqual(['alpha', 'Beta', 'ML-KEM', 'TLS 1.3'])
    expect(got.terms.map((t) => t.kind)).toEqual([
      'Glossary term',
      'Glossary term',
      'Algorithm',
      'Protocol',
    ])
    expect(got.documents.map((d) => d.id)).toEqual(['LIB:1'])
    expect(got.documents[0]).toMatchObject({
      kind: 'Library document',
      link: '/x/LIB:1',
      label: 'FIPS 203',
    })
    expect(got.useCases.map((u) => u.label)).toEqual(['Alpha payments', 'Zeta payments'])
  })

  it('finds the lesson by its tag as well as by its address', () => {
    const r = readerFor([lesson, rec('GL:a', 'glossary', 'term')], [taught('GL:a', 'LM-020')])
    expect(lessonResources(r, 'LM-020').terms).toHaveLength(1)
    expect(lessonResources(r, 'pki-workshop').terms).toHaveLength(1)
  })

  it('counts links into the lesson and into its sections and steps, once per record', () => {
    const r = readerFor(
      [
        lesson,
        section,
        step,
        rec('GL:both', 'glossary', 'term', { label: 'In lesson and section' }),
        rec('GL:sec', 'glossary', 'term', { label: 'Section only' }),
        rec('LIB:step', 'library', 'document', { label: 'Step document' }),
      ],
      [
        taught('GL:both', 'LM-020'),
        taught('GL:both', 'LM-020/s:csr'),
        taught('GL:sec', 'LM-020/s:csr'),
        taught('LIB:step', 'LM-020/w:sign'),
      ]
    )
    const got = lessonResources(r, 'pki-workshop')
    expect(got.terms.map((t) => t.id).sort()).toEqual(['GL:both', 'GL:sec'])
    expect(got.documents.map((d) => d.id)).toEqual(['LIB:step'])
  })

  it('ignores other relations, other lessons, retired records and unknown ends', () => {
    const other = rec('LM-021', 'module', 'module', { link: '/learn/other' })
    const r = readerFor(
      [
        lesson,
        other,
        rec('GL:retired', 'glossary', 'term', { active: false, status: 'deprecated' }),
        rec('GL:planned', 'glossary', 'term', { active: false, status: 'draft' }),
        rec('GL:live', 'glossary', 'term'),
        rec('GL:elsewhere', 'glossary', 'term'),
        rec('GL:wrong-relation', 'glossary', 'term'),
      ],
      [
        taught('GL:retired', 'LM-020'),
        taught('GL:planned', 'LM-020'),
        taught('GL:live', 'LM-020'),
        taught('GL:elsewhere', 'LM-021'),
        ['GL:wrong-relation', 'depends_on', 'LM-020', 'declared', 's'],
        taught('GL:missing', 'LM-020'),
      ]
    )
    expect(lessonResources(r, 'pki-workshop').terms.map((t) => t.id)).toEqual(['GL:live'])
  })

  it('ranks documents by type, then newest first, then by label', () => {
    const r = readerFor(
      [
        lesson,
        rec('d-old', 'library', 'document', { label: 'Old report', ...dates('2019-05-01') }),
        rec('d-new', 'library', 'document', { label: 'New report', ...dates('2025-02') }),
        rec('d-none-b', 'library', 'document', { label: 'B undated' }),
        rec('d-none-a', 'library', 'document', { label: 'A undated' }),
        rec('a-1', 'library', 'algorithm', { label: 'Alg paper', ...dates('2030') }),
        rec('f-1', 'library', 'framework', { label: 'A framework', ...dates('2020') }),
        rec('g-1', 'library', 'guidance', { label: 'A guide', ...dates('2018') }),
        rec('s-old', 'library', 'standard', { label: 'Old standard', ...dates('2015') }),
        rec('s-upd', 'library', 'standard', {
          label: 'Updated standard',
          ...dates('2010', '2026-03-17'),
        }),
        rec('s-bad', 'library', 'standard', { label: 'Bad date standard', ...dates('sometime') }),
        rec('x-1', 'library', 'oddtype', { label: 'Odd' }),
      ],
      [
        'd-old',
        'd-new',
        'd-none-b',
        'd-none-a',
        'a-1',
        'f-1',
        'g-1',
        's-old',
        's-upd',
        's-bad',
        'x-1',
      ].map((id) => taught(id, 'LM-020'))
    )
    expect(lessonResources(r, 'pki-workshop').documents.map((d) => d.id)).toEqual([
      's-upd',
      's-old',
      's-bad',
      'g-1',
      'f-1',
      'd-new',
      'd-old',
      'd-none-a',
      'd-none-b',
      'a-1',
      'x-1',
    ])
  })

  it('gives empty groups for a lesson with nothing linked and for an unknown lesson', () => {
    const r = readerFor([lesson], [])
    expect(lessonResources(r, 'pki-workshop')).toEqual({ terms: [], documents: [], useCases: [] })
    expect(lessonResources(r, 'no-such-lesson')).toEqual({ terms: [], documents: [], useCases: [] })
    expect(hasLessonResources(lessonResources(r, 'pki-workshop'))).toBe(false)
  })

  it('reports a group that has records and leaves the others empty', () => {
    const r = readerFor([lesson, rec('IL:1', 'usecase', 'usecase')], [taught('IL:1', 'LM-020')])
    const got = lessonResources(r, 'pki-workshop')
    expect(got.terms).toEqual([])
    expect(got.documents).toEqual([])
    expect(got.useCases).toHaveLength(1)
    expect(hasLessonResources(got)).toBe(true)
  })

  it('words each kind as the Assistant words it', () => {
    const chips = new Map(Object.entries(dataFile.rows.kind_chip))
    for (const [type, chip] of Object.entries(KIND_CHIP)) {
      expect(chips.get(type), `Assistant chip for ${type}`).toBe(chip)
    }
  })
})
