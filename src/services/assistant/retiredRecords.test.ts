// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { KnowledgeCore, KnowledgeRecord } from '@/services/knowledge/knowledgeTypes'
import type { KnowledgeTextFile } from '@/services/knowledge/knowledgeText'
import { buildEngineInput } from './buildEngine'
import patternFile from './data/answer.generated.json'
import dataFile from './data/data.generated.json'
import { Answerer, type Catalogue } from './engine/answerer'

/**
 * A resource is offered only when its record is active. A search passage can carry the address of a retired record, which
 * gives a resource with no record of its own: the address still belongs to that retired record, so it is not offered.
 */

const ROOT = process.cwd()

function answererFor(
  core: KnowledgeCore,
  text: KnowledgeTextFile,
  passagesFor: string[],
  passageText = 'Zebra signature signing library products'
) {
  const built = buildEngineInput(core, text)
  const catalogue: Catalogue = built.catalogue
  // what a search passage does: it gives its address a resource of its own when none exists, with no record ids
  for (const link of passagesFor) {
    const own = catalogue.resources.find((r) => r.link === link)
    const index = catalogue.passages.length
    catalogue.passages.push({
      link,
      title: link,
      text: passageText,
      source: 'page',
    })
    if (own) own.passages.push(index)
    else
      catalogue.resources.push({
        link,
        title: link === '/zebra-guide' ? 'Zebra signature guide' : 'Zebra signer',
        type: 'page',
        group: 'Data pages',
        extract: '',
        record_ids: [],
        passages: [index],
      })
  }
  return new Answerer(dataFile, catalogue, built.model, patternFile, built.statements, {})
}

const offered = (a: ReturnType<Answerer['ask']>): string[] =>
  (a.groups as { rows: { link: string }[]; more: { link: string }[] }[]).flatMap((g) => [
    ...g.rows.map((r) => r.link),
    ...g.more.map((r) => r.link),
  ])

const rec = (id: string, extra: Partial<KnowledgeRecord>): KnowledgeRecord => ({
  id,
  kind: 'product',
  type: 'product',
  family: 'product',
  label: id,
  link: `/migrate?product=${id}`,
  status: 'active',
  ...extra,
})

describe('a retired record is not offered when its address arrives as a search passage', () => {
  const core = {
    schema: 'knowledge-core/1',
    meta: {
      counts: { records: 4, links: 0, aliases: 0, by_kind: {} },
      inputs: [],
      input_patterns: [],
    },
    records: [
      rec('zebra-old', { label: 'Zebra signer', status: 'deprecated', active: false }),
      rec('zebra-draft', { label: 'Zebra signer draft', status: 'draft', active: false }),
      rec('zebra-new', { label: 'Zebra signer 2' }),
    ],
    aliases: {},
    links: [],
    relations: {},
    successors: {},
  } as unknown as KnowledgeCore
  const text = {
    schema: 'knowledge-text/1',
    entries: {
      'zebra-new': { full: 'Signing library for Zebra signatures' },
    },
  } as unknown as KnowledgeTextFile
  const questions = [
    'Which products implement Zebra signatures?',
    'Zebra signature signing library',
    'Zebra signer',
  ]
  const answerer = answererFor(core, text, [
    '/migrate?product=zebra-old',
    '/migrate?product=zebra-draft',
    '/migrate?product=zebra-new',
    '/zebra-guide',
  ])

  it('offers neither the retired nor the draft record, in the rows or under "more"', () => {
    const seen = new Set(questions.flatMap((q) => offered(answerer.ask(q))))
    expect(seen.has('/migrate?product=zebra-old')).toBe(false)
    expect(seen.has('/migrate?product=zebra-draft')).toBe(false)
  })

  it('still offers the active record and a page that no record owns', () => {
    const seen = new Set(questions.flatMap((q) => offered(answerer.ask(q))))
    expect(seen.has('/migrate?product=zebra-new')).toBe(true)
    expect(seen.has('/zebra-guide')).toBe(true)
  })
})

describe('on the real knowledge files', () => {
  const core = JSON.parse(
    readFileSync(join(ROOT, 'public/data/knowledge-core.json'), 'utf8')
  ) as KnowledgeCore
  const text = JSON.parse(
    readFileSync(join(ROOT, 'public/data/knowledge-text.json'), 'utf8')
  ) as KnowledgeTextFile
  const retired = core.records.find((r) => r.id === 'PRD:rustcrypto-slh-dsa')!
  const question = 'Which products implement SLH-DSA-SHAKE-128f?'

  it('a retired product is not offered, with or without a search passage for its address', () => {
    expect(retired.status).toBe('deprecated')
    for (const passages of [[], [retired.link]]) {
      const links = offered(answererFor(core, text, passages, question).ask(question))
      expect(links).not.toContain(retired.link)
      expect(links).toContain('/migrate?product=rustcrypto-slh-dsa-2')
    }
  }, 120_000)
})
