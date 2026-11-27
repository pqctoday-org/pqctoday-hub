// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- reads the repo's own data files by fixed relative paths */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { answer, forgetAssistant } from '@/services/assistant/adapter'
import type { AssistantAnswer, AssistantRow } from '@/services/assistant/contract'
import data from '@/services/assistant/data/data.generated.json'
import fixtures from '@/services/assistant/fixtures/assistant-fixtures.json'
import { stubKnowledgeFetch } from '@/services/assistant/testSupport'
import {
  broadMatch,
  makeRow,
  nameCardMlKem,
  nameChoices,
  notHeld,
} from '@/test/fixtures/assistantAnswers'
import type { RenderableAnswer } from './answerRules'
import {
  MORE_TAG_PREFIXES,
  TAB_DEFINITIONS,
  TAB_ORDER,
  buildResourceTabs,
  settleNav,
  stepFrom,
  tabOf,
  type ResourceTabKey,
} from './resourceTabs'

const row = (tag: string, kind: string, over: Partial<AssistantRow> = {}): AssistantRow =>
  makeRow({ kind, tag, title: `Title of ${tag}`, action: 'Go to page', group: 'Learn', ...over })

const isAllowedMore = (tag: string) => MORE_TAG_PREFIXES.some((p) => tag.startsWith(p))

describe('tabOf', () => {
  it.each(
    TAB_ORDER.flatMap((key) =>
      TAB_DEFINITIONS[key].prefixes.map((prefix) => [prefix, key] as const)
    )
  )('tag prefix %s goes to %s', (prefix, key) => {
    expect(tabOf({ tag: `${prefix}example`, kind: 'Something unknown' })).toBe(key)
  })

  it.each(
    TAB_ORDER.flatMap((key) => TAB_DEFINITIONS[key].kinds.map((kind) => [kind, key] as const))
  )('kind %s goes to %s when no prefix fits', (kind, key) => {
    expect(tabOf({ tag: 'unlisted:1', kind })).toBe(key)
    expect(tabOf({ tag: 'unlisted:1', kind: kind.toUpperCase() })).toBe(key)
  })

  it('lets the tag prefix win over the kind', () => {
    expect(tabOf({ tag: 'LIB:NSA CNSA 2.0 FAQ', kind: 'Compliance framework' })).toBe('library')
  })

  it('sends the extra record kinds to the tabs the owner chose', () => {
    expect(tabOf({ tag: 'implattack:aigis-enc-cacr-level-1', kind: 'Implementation attack' })).toBe(
      'algorithms'
    )
    expect(tabOf({ tag: 'protocol:5g-suci', kind: 'Protocol' })).toBe('algorithms')
    expect(
      tabOf({ tag: 'industrystandard:3gpp-pqc-sa3-overview', kind: 'Industry standard' })
    ).toBe('library')
    expect(tabOf({ tag: 'country:ae', kind: 'Jurisdiction' })).toBe('timeline')
    expect(tabOf({ tag: 'CHG:2.47.0', kind: 'Release note' })).toBe('releases')
    expect(tabOf({ tag: 'PAGE:library', kind: 'Page' })).toBe('pages')
  })

  it('keeps the listed prefixes in "More"', () => {
    for (const prefix of MORE_TAG_PREFIXES) {
      expect(tabOf({ tag: `${prefix}example`, kind: 'Trusted source' })).toBe('more')
    }
  })

  it('places every tag the Assistant fixtures name', () => {
    const tags = new Set<string>()
    for (const c of (fixtures as { cases: { expect: Record<string, unknown> }[] }).cases) {
      const e = c.expect as {
        directTag?: string
        sourceTag?: string
        nameCardTag?: string
        paidTag?: string
        secondRowTag?: string
        firstRow?: { tag: string }
        toolsStartWith?: string[]
      }
      for (const t of [
        e.directTag,
        e.sourceTag,
        e.nameCardTag,
        e.paidTag,
        e.secondRowTag,
        e.firstRow?.tag,
      ])
        if (t) tags.add(t)
      for (const t of e.toolsStartWith ?? []) tags.add(t)
    }
    expect(tags.size).toBeGreaterThan(0)
    for (const tag of tags) {
      expect(tabOf({ tag, kind: '' }) === 'more' && !isAllowedMore(tag), tag).toBe(false)
    }
  })
})

describe('every active record of the Hub has a tab', () => {
  interface CoreRecord {
    id: string
    type: string
    kind: string
    status: string
  }
  const core = JSON.parse(
    readFileSync(join(process.cwd(), 'public/data/knowledge-core.json'), 'utf8')
  ) as { records: CoreRecord[] }
  const chips = data.rows.kind_chip as Record<string, string>
  const active = core.records.filter((r) => r.status === 'active')

  it('has records to check', () => {
    expect(active.length).toBeGreaterThan(1000)
  })

  it('puts nothing in "More" except the prefixes listed for it, by kind chip and by tag alone', () => {
    const stray = new Set<string>()
    for (const r of active) {
      const chip = chips[r.type] ?? r.type
      for (const kind of [chip, '']) {
        if (tabOf({ tag: r.id, kind }) === 'more' && !isAllowedMore(r.id)) {
          stray.add(`${r.id} (${kind || 'no kind'}, type ${r.type})`)
        }
      }
    }
    expect([...stray].slice(0, 20)).toEqual([])
  })
})

describe('real answers', () => {
  const log = stubKnowledgeFetch()
  afterAll(() => {
    vi.unstubAllGlobals()
    forgetAssistant()
  })
  const questions = ['When is the CNSA 2.0 deadline?', 'What is ML-KEM?', 'ML-KEM']

  it.each(questions)(
    '"%s" has tabs in the menu order and none that only holds strays',
    async (q) => {
      const a = (await answer(q)) as AssistantAnswer
      expect(a.state).not.toBe('data-not-loaded')
      const built = buildResourceTabs(a as RenderableAnswer)
      expect(log.urls.length).toBeGreaterThan(0)
      expect(built.total).toBeGreaterThan(1)
      const keys = built.tabs.map((t) => t.key)
      expect(keys[0]).toBe('top')
      const order = keys.map((k) => TAB_ORDER.indexOf(k))
      expect(order).toEqual([...order].sort((x, y) => x - y))
      for (const tab of built.tabs) {
        if (tab.key !== 'more') continue
        for (const r of tab.rows) expect(isAllowedMore(r.tag), r.tag).toBe(true)
      }
      // every resource is in its own tab, once
      const own = built.tabs.filter((t) => t.key !== 'top').flatMap((t) => t.rows.map((r) => r.tag))
      expect(new Set(own).size).toBe(built.total)
    },
    60_000
  )
})

describe('buildResourceTabs', () => {
  const answerWith = (
    groups: { name: AssistantRow['group']; rows: AssistantRow[]; more?: AssistantRow[] }[]
  ): RenderableAnswer =>
    ({
      ...(broadMatch as RenderableAnswer),
      groups: groups.map((g) => ({ ...g, more: g.more ?? [] })),
    }) as RenderableAnswer

  /** A built answer shaped like the two reference questions: rows from several types, in the engine's order. */
  const cnsa = answerWith([
    {
      name: 'Data pages',
      rows: [
        row('CMP:CNSA-2', 'Compliance framework'),
        row('TL:one', 'Timeline event'),
        row('TL:two', 'Timeline event'),
      ],
      more: [row('CMP:two', 'Compliance framework'), row('TL:three', 'Timeline event')],
    },
    {
      name: 'References',
      rows: [
        row('LIB:a', 'Library document'),
        row('LIB:b', 'Library document'),
        row('GL:cnsa', 'Glossary term'),
      ],
      more: [row('LIB:c', 'Library document'), row('CMP:three', 'Compliance framework')],
    },
    {
      name: 'Learn',
      rows: [row('LM-001', 'Module'), row('LM-001/s:a', 'Section'), row('LM-002', 'Module')],
      more: [row('LM-003', 'Module'), row('LM-004', 'Module')],
    },
    { name: 'Tools', rows: [row('TOOL:assess', 'Assessment')] },
  ])

  it('lists Top 5 first, then the tabs in the left menu order', () => {
    const { tabs, total } = buildResourceTabs(cnsa)
    expect(tabs.map((t) => t.key)).toEqual([
      'top',
      'learn',
      'timeline',
      'compliance',
      'tools',
      'library',
      'glossary',
    ])
    expect(tabs.map((t) => t.rows.length)).toEqual([5, 5, 3, 3, 1, 3, 1])
    expect(total).toBe(16)
  })

  it('shows the first group together, then the best row of every other group: Top 5 is the first five of the rank, and each tab keeps the rank order', () => {
    const { tabs, rankOf } = buildResourceTabs(cnsa)
    const top = tabs[0].rows.map((r) => r.tag)
    // the rows of the first group, then the first row of each other group, in the engine's group order
    expect(top).toEqual(['CMP:CNSA-2', 'TL:one', 'TL:two', 'LIB:a', 'LM-001'])
    expect(rankOf['CMP:CNSA-2']).toBe(1)
    expect(rankOf['LM-001']).toBeLessThan(rankOf['TOOL:assess'])
    // the other groups' second rows follow by turns
    expect(rankOf['TOOL:assess']).toBeLessThan(rankOf['LIB:b'])
    expect(rankOf['LIB:b']).toBeLessThan(rankOf['LM-001/s:a'])
    expect(rankOf['LM-001/s:a']).toBeLessThan(rankOf['GL:cnsa'])
    // every group's visible rows come before any group's "more" rows
    expect(rankOf['LM-002']).toBeLessThan(rankOf['CMP:two'])
    for (const tab of tabs) {
      const ranks = tab.rows.map((r) => rankOf[r.tag])
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    }
    // "more" rows come after every group's visible rows
    const learn = tabs.find((t) => t.key === 'learn')!.rows.map((r) => r.tag)
    expect(learn).toEqual(['LM-001', 'LM-001/s:a', 'LM-002', 'LM-003', 'LM-004'])
    const compliance = tabs.find((t) => t.key === 'compliance')!.rows.map((r) => r.tag)
    expect(compliance).toEqual(['CMP:CNSA-2', 'CMP:two', 'CMP:three'])
  })

  it('lists the rows of a group marked late after the rows of the other groups, and before any "more" row', () => {
    const waiting = {
      ...cnsa,
      groups: cnsa.groups.map((g) =>
        g.name === 'Learn' || g.name === 'Tools' ? { ...g, late: true as const } : g
      ),
    } as RenderableAnswer
    const { tabs, rankOf, total } = buildResourceTabs(waiting)
    // the first group, then the one other group that takes its turn, fill the first rows
    expect(tabs[0].rows.map((r) => r.tag)).toEqual([
      'CMP:CNSA-2',
      'TL:one',
      'TL:two',
      'LIB:a',
      'LIB:b',
    ])
    expect(rankOf['GL:cnsa']).toBeLessThan(rankOf['LM-001'])
    // the late groups then take turns among themselves
    expect(rankOf['LM-001']).toBeLessThan(rankOf['TOOL:assess'])
    expect(rankOf['TOOL:assess']).toBeLessThan(rankOf['LM-001/s:a'])
    expect(rankOf['LM-002']).toBeLessThan(rankOf['CMP:two'])
    // nothing is added or removed
    expect(total).toBe(buildResourceTabs(cnsa).total)
  })

  it('does not hold the other groups back when the first group has no row to show', () => {
    const emptyFirst = {
      ...cnsa,
      groups: cnsa.groups.map((g, i) => (i === 0 ? { ...g, rows: [] } : g)),
    } as RenderableAnswer
    expect(buildResourceTabs(emptyFirst).tabs[0].rows.map((r) => r.tag)).toEqual([
      'LIB:a',
      'LIB:b',
      'GL:cnsa',
      'LM-001',
      'TOOL:assess',
    ])
  })

  it('builds the concept shape: algorithms, products, certifications, tools, library and glossary', () => {
    const concept = answerWith([
      {
        name: 'References',
        rows: [row('GL:ml-kem', 'Glossary term'), row('LIB:fips', 'Library document')],
      },
      {
        name: 'Data pages',
        rows: [
          row('ALG:ML-KEM', 'Algorithm'),
          row('PRD:x', 'Product'),
          row('CERT:y', 'Certification'),
        ],
      },
      { name: 'Learn', rows: [row('LM-008', 'Module')] },
      { name: 'Tools', rows: [row('PT-033', 'Playground tool')] },
    ])
    expect(buildResourceTabs(concept).tabs.map((t) => t.key)).toEqual([
      'top',
      'learn',
      'algorithms',
      'products',
      'certifications',
      'tools',
      'library',
      'glossary',
    ])
  })

  it('removes repeats by tag, keeping the first', () => {
    const dup = answerWith([
      { name: 'Learn', rows: [row('LM-001', 'Module', { title: 'First' })] },
      {
        name: 'References',
        rows: [row('LM-001', 'Module', { title: 'Second' }), row('GL:x', 'Glossary term')],
      },
    ])
    const { tabs, total } = buildResourceTabs(dup)
    expect(total).toBe(2)
    expect(tabs.find((t) => t.key === 'learn')!.rows[0].title).toBe('First')
  })

  it('shows "Top 5" only with two or more resources', () => {
    const one = buildResourceTabs(answerWith([{ name: 'Learn', rows: [row('LM-001', 'Module')] }]))
    expect(one.tabs.map((t) => t.key)).toEqual(['learn'])
    expect(one.total).toBe(1)
  })

  it('leaves out a known-answer test that carries an internal step name, and strips the structural prefix', () => {
    const answer = answerWith([
      {
        name: 'Learn',
        rows: [
          row('KAT:KAT-1', 'Known-answer test', { title: 'ML-KEM-1024: Builder step_1_keygen' }),
          row('KAT:KAT-2', 'Known-answer test', {
            title: 'ML-KEM-768 known answer',
            extract: 'Checks the output.',
          }),
          row('LM-069/w:suite', 'Workshop step', {
            extract: 'Index: 0 List: workshop_steps Compare the listed options.',
          }),
          row('LM-070/w:empty', 'Workshop step', { extract: 'Index: 1 List: workshop_steps' }),
        ],
      },
    ])
    const { tabs, total } = buildResourceTabs(answer)
    expect(tabs.find((t) => t.key === 'learn')!.rows.map((r) => r.tag)).toEqual(['LM-069/w:suite'])
    expect(tabs.find((t) => t.key === 'more')!.rows.map((r) => r.tag)).toEqual(['KAT:KAT-2'])
    expect(total).toBe(2)
    const stripped = tabs.find((t) => t.key === 'learn')!.rows[0]
    expect(stripped.extract).toBe('Compare the listed options.')
  })

  it('omits release notes, the changelog page and standalone quizzes from built tabs', () => {
    const answer = answerWith([
      {
        name: 'Data pages',
        rows: [
          row('CHG:4.25.0', 'Changelog release', { link: '/changelog#v4.25.0' }),
          row('PAGE:changelog', 'Page', { link: '/changelog' }),
          row('CMP:CNSA-2', 'Compliance framework', { link: '/compliance?framework=CNSA-2' }),
        ],
      },
      {
        name: 'Learn',
        rows: [
          row('QC:tls-basics', 'Quiz category', { link: '/learn/quiz?category=tls-basics' }),
          row('QZ:q1', 'Quiz question', { link: '/learn/quiz?category=tls-basics' }),
          row('LM-008', 'Module', { link: '/learn/tls-basics' }),
        ],
      },
    ])
    const { tabs, total } = buildResourceTabs(answer)
    expect(total).toBe(2)
    expect(tabs.flatMap((t) => t.rows.map((r) => r.tag))).toEqual([
      'CMP:CNSA-2',
      'LM-008',
      'LM-008',
      'CMP:CNSA-2',
    ])
  })

  it("puts a name answer's record first, so it is in Top 5", () => {
    const { tabs, rankOf } = buildResourceTabs(nameCardMlKem as RenderableAnswer)
    expect(rankOf['ALG:ML-KEM']).toBe(1)
    expect(tabs[0].rows[0].tag).toBe('ALG:ML-KEM')
  })

  it('shows no tabs for a choices answer without groups, and none for a not-held answer', () => {
    expect(buildResourceTabs(nameChoices as RenderableAnswer).tabs).toEqual([])
    expect(buildResourceTabs(notHeld as RenderableAnswer).tabs).toEqual([])
  })
})

describe('stepFrom and settleNav', () => {
  const answer = {
    ...(broadMatch as RenderableAnswer),
    groups: [
      {
        name: 'Learn' as const,
        rows: [row('LM-001', 'Module'), row('LM-002', 'Module')],
        more: [],
      },
      { name: 'Data pages' as const, rows: [row('CMP:a', 'Compliance framework')], more: [] },
    ],
  } as RenderableAnswer
  const { tabs } = buildResourceTabs(answer)
  const keys = tabs.map((t) => t.key)

  it('moves inside a tab, then into the next tab, and ends', () => {
    expect(keys).toEqual(['top', 'learn', 'compliance'])
    const a = stepFrom(tabs, { tab: 'learn', index: 0 }, 1)!
    expect(a).toEqual({ nav: { tab: 'learn', index: 1 }, crosses: null })
    const b = stepFrom(tabs, a.nav, 1)!
    expect(b.nav).toEqual({ tab: 'compliance', index: 0 })
    expect(b.crosses?.label).toBe('Compliance')
    expect(stepFrom(tabs, b.nav, 1)).toBeNull()
  })

  it('mirrors this going back, landing on the last resource of the previous tab', () => {
    const back = stepFrom(tabs, { tab: 'compliance', index: 0 }, -1)!
    expect(back.nav).toEqual({ tab: 'learn', index: 1 })
    expect(back.crosses?.label).toBe('Learn')
    expect(stepFrom(tabs, { tab: 'top', index: 0 }, -1)).toBeNull()
  })

  it('crosses from Top 5 into the first other tab', () => {
    const last = tabs[0].rows.length - 1
    expect(stepFrom(tabs, { tab: 'top', index: last }, 1)!.nav).toEqual({ tab: 'learn', index: 0 })
  })

  it('settles a position that no longer exists', () => {
    expect(settleNav(tabs, { tab: 'threats' as ResourceTabKey, index: 4 })).toEqual({
      tab: 'top',
      index: 0,
    })
    expect(settleNav(tabs, { tab: 'learn', index: 9 })).toEqual({ tab: 'learn', index: 1 })
    expect(settleNav(tabs, undefined)).toEqual({ tab: 'top', index: 0 })
  })
})
