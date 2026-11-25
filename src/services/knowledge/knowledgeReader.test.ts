// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { KnowledgeReader, normName } from './knowledgeReader'
import type { KnowledgeCore, KnowledgeRecord } from './knowledgeTypes'

const rec = (id: string, extra: Partial<KnowledgeRecord> = {}): KnowledgeRecord => ({
  id,
  kind: 'k',
  type: 't',
  family: 'f',
  label: id,
  link: `/x/${id}`,
  status: 'active',
  ...extra,
})

const core: KnowledgeCore = {
  schema: 'knowledge-core/1',
  meta: {
    counts: { records: 6, links: 1, aliases: 5, by_kind: {} },
    inputs: [],
    input_patterns: [],
  },
  records: [
    rec('STG:1', { link: '/learn?stage=1', label: 'Basics' }),
    rec('LM-001', { parent: 'STG:1', pos: 2 }),
    rec('LM-002', { parent: 'STG:1', pos: 1 }),
    rec('LM-001/s:intro', { parent: 'LM-001', pos: 1, link: '/learn/a?section=intro' }),
    rec('ALG:ML-KEM', { link: '/algorithms?highlight=ML-KEM' }),
    rec('GL:ml-kem', { link: '/learn?glossary=ML-KEM' }),
  ],
  aliases: {
    'ml kem': [['ALG:ML-KEM', 'label']],
    basics: [
      ['STG:1', 'label'],
      ['GL:ml-kem', 'label'],
    ],
    'lm 1': [['LM-001', 'former-id']],
    'old ml kem': [
      ['ALG:ML-KEM', 'former-id'],
      ['GL:ml-kem', 'label'],
    ],
  },
  links: [['LM-001', 'in_nice_area', 'STG:1', 'declared', 's']],
  relations: {},
}

describe('normName', () => {
  it('folds accents, case and punctuation the way the generator keys its alias table', () => {
    expect(normName('ML-KEM')).toBe('ml kem')
    expect(normName('  Café   Dilithium! ')).toBe('cafe dilithium')
    expect(normName('SLH-DSA-SHA2-128s')).toBe('slh dsa sha2 128s')
    expect(normName('')).toBe('')
  })
})

describe('KnowledgeReader', () => {
  const r = new KnowledgeReader(core)

  it('finds a tag exactly, then a name, then an address', () => {
    expect(r.lookup('LM-001')).toMatchObject({ found: true, how: 'tag' })
    expect(r.lookup('ML-KEM')).toMatchObject({
      found: true,
      how: 'alias',
      record: { id: 'ALG:ML-KEM' },
    })
    expect(r.lookup('/learn?stage=1')).toMatchObject({
      found: true,
      how: 'link',
      record: { id: 'STG:1' },
    })
  })

  it('takes a former id as the record it names even when a label also fits', () => {
    expect(r.lookup('old ml-kem')).toMatchObject({
      found: true,
      how: 'former-id',
      record: { id: 'ALG:ML-KEM' },
    })
    expect(r.lookup('LM 1')).toMatchObject({
      found: true,
      how: 'former-id',
      record: { id: 'LM-001' },
    })
  })

  it('asks instead of guessing when a name fits two records, and says unknown for nothing', () => {
    const got = r.lookup('Basics')
    expect(got.found).toBe(false)
    if (!got.found && got.reason === 'ambiguous')
      expect(got.candidates.map((c) => c.id).sort()).toEqual(['GL:ml-kem', 'STG:1'])
    else throw new Error('expected an ambiguous answer')
    expect(r.lookup('no such thing')).toEqual({ found: false, reason: 'unknown' })
  })

  it('lists parts in order and walks the parents up to the top', () => {
    expect(r.partsOf('STG:1').map((x) => x.id)).toEqual(['LM-002', 'LM-001'])
    expect(r.parentChain('LM-001/s:intro').map((x) => x.id)).toEqual(['LM-001', 'STG:1'])
    expect(r.parentChain('STG:1')).toEqual([])
    expect(r.linkOf('GL:ml-kem')).toBe('/learn?glossary=ML-KEM')
    expect(r.linksOf('STG:1').in).toHaveLength(1)
  })
})
