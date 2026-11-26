// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { KnowledgeCore } from '@/services/knowledge/knowledgeTypes'
import { answer, forgetAssistant } from './adapter'
import type { AssistantAnswer } from './contract'
import { stubKnowledgeFetch } from './testSupport'

/**
 * The page the learner is on goes to the engine as a tag. It only moves the resources the answer already holds: the page's
 * own resource first, then the resources linked to it, inside their group. These tests run the real engine on the real
 * knowledge files of the checkout.
 */
const core = JSON.parse(
  readFileSync(join(process.cwd(), 'public/data/knowledge-core.json'), 'utf8')
) as KnowledgeCore
const link = (tag: string) => core.records.find((r) => r.id === tag)!.link

type Held = Exclude<AssistantAnswer, { state: 'data-not-loaded' }>
const held = (a: AssistantAnswer): Held => {
  if (a.state === 'data-not-loaded') throw new Error('the data did not load')
  return a
}
const order = (a: Held) =>
  a.groups.map((g) => ({
    name: g.name,
    rows: g.rows.map((r) => r.tag),
    more: g.more.map((r) => r.tag),
  }))
const rest = (a: Held) => JSON.stringify({ ...a, groups: undefined })
const sorted = (g: { rows: string[]; more: string[] }) => [...g.rows, ...g.more].sort()

const PAIRS: [string, string][] = [
  ['What is 3GPP?', 'LM-004'],
  ['What is Crypto Agility?', 'LM-007'],
  ['What is CMS?', 'LM-010'],
  ['What is ARM CCA?', 'LM-019'],
  ['What does CNSA 2.0 require?', 'CMP:CNSA-2'],
  ['What is ML-KEM?', 'LM-001'],
  ['How should a bank start its PQC migration?', 'LM-001'],
  ['Will ML-KEM be broken by 2030?', 'LM-002'],
]

describe('the page tag in the answer engine (real knowledge files)', () => {
  stubKnowledgeFetch()
  afterAll(() => {
    vi.unstubAllGlobals()
    forgetAssistant()
  })
  const plain = new Map<string, Held>()
  beforeAll(async () => {
    for (const [q] of PAIRS) plain.set(q, held(await answer(q)))
  }, 120_000)

  it('gives the same answer, byte for byte, when there is no page tag or it names nothing', async () => {
    for (const [q] of PAIRS) {
      const want = JSON.stringify(plain.get(q))
      for (const page of [undefined, null, '', '/', 'NOT-A-RECORD', '/not-a-page']) {
        expect(JSON.stringify(held(await answer(q, { page })))).toBe(want)
      }
    }
  })

  it('keeps every resource, the groups and everything but the order', async () => {
    for (const [q, page] of PAIRS) {
      const a = plain.get(q)!
      const b = held(await answer(q, { page }))
      expect(b.state).toBe(a.state)
      expect(rest(b)).toBe(rest(a))
      const [oa, ob] = [order(a), order(b)]
      expect(ob.map((g) => g.name)).toEqual(oa.map((g) => g.name))
      oa.forEach((g, i) => {
        expect(sorted(ob[i])).toEqual(sorted(g))
        expect(ob[i].rows).toHaveLength(g.rows.length)
        expect(ob[i].more).toHaveLength(g.more.length)
      })
    }
  })

  it('puts the lesson the learner is on first in its group when the answer holds it', async () => {
    const before = order(plain.get('What is 3GPP?')!).find((g) => g.name === 'Learn')!
    expect(before.rows).toContain('LM-004')
    expect(before.rows[0]).not.toBe('LM-004')
    const after = order(held(await answer('What is 3GPP?', { page: 'LM-004' }))).find(
      (g) => g.name === 'Learn'
    )!
    expect(after.rows[0]).toBe('LM-004')
  })

  it('reads the page given as its address the same way as its tag', async () => {
    const byTag = JSON.stringify(held(await answer('What is 3GPP?', { page: 'LM-004' })))
    expect(JSON.stringify(held(await answer('What is 3GPP?', { page: link('LM-004') })))).toBe(
      byTag
    )
    expect(
      JSON.stringify(held(await answer('What is 3GPP?', { page: `${link('LM-004')}?tab=x#top` })))
    ).toBe(byTag)
  })

  it('reads a lesson section by its address, and its lesson counts as linked', async () => {
    const section = 'LM-013/s:cdn-edge'
    const a = order(held(await answer('What is Edge PoP?', { page: link(section) }))).find(
      (g) => g.name === 'Learn'
    )!
    const b = order(held(await answer('What is Edge PoP?', { page: section }))).find(
      (g) => g.name === 'Learn'
    )!
    expect(a).toEqual(b)
    expect(a.rows[0]).toBe(section)
  })

  it('leaves the rows the intent shows first where they are', async () => {
    const q = 'How should a bank start its PQC migration?'
    const tools = (a: Held) =>
      order(a)
        .find((g) => g.name === 'Tools')!
        .rows.slice(0, 2)
    expect(tools(plain.get(q)!)).toEqual(['TOOL:assess', 'TOOL:report'])
    expect(tools(held(await answer(q, { page: '/report' })))).toEqual([
      'TOOL:assess',
      'TOOL:report',
    ])
  })

  it('leaves the closest source as the answer without a page chose it', async () => {
    const a = plain.get('What is Crypto Agility?')!
    const b = held(await answer('What is Crypto Agility?', { page: 'LM-007' }))
    expect('source' in a && 'source' in b && b.source).toEqual('source' in a && a.source)
  })
})
