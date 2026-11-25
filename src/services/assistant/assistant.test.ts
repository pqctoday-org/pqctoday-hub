// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import type { KnowledgeCore, KnowledgeRecord } from '@/services/knowledge/knowledgeTypes'
import {
  ASSISTANT_DATA_NOT_LOADED_KEPT,
  ASSISTANT_DATA_NOT_LOADED_MESSAGE,
  answer,
  directValueFits,
  forgetAssistant,
} from './adapter'
import { buildEngineInput, extractOf, FAMILY_FILE_PREFIX, groupOf } from './buildEngine'
import {
  ASSISTANT_GROUPS,
  ASSISTANT_ROWS_PER_GROUP,
  assistantGoLink,
  type AssistantAnswer,
  type AssistantGroup,
  type AssistantRow,
} from './contract'
import data from './data/data.generated.json'
import fixtures from './fixtures/assistant-fixtures.json'
import { KNOWLEDGE_URLS, stubKnowledgeFetch } from './testSupport'
import { PERSONA_IDS, type PersonaId } from '@/data/personaIds'

interface Expect {
  state: string
  intent?: string
  directTag?: string
  directField?: string
  sourceLabel?: string
  sourceTag?: string
  groupOrder?: string[]
  firstRow?: { group: string; tag: string }
  firstGroup?: string
  secondRowTag?: string
  toolsStartWith?: string[]
  noteEndsWith?: string
  note?: string
  answerText?: string
  nameCardTag?: string
  noSource?: boolean
  noDirect?: boolean
}
interface Case {
  id: string
  question: string
  persona?: PersonaId
  expect: Expect
  withPersona?: Record<string, { groupOrder: string[] }>
}
const cases = (fixtures as { cases: Case[] }).cases

const PERSONA_PATH_TAGS = new Set(PERSONA_IDS.map((p) => `PATH:${p}`))
const ROOT = process.cwd()
const core = JSON.parse(
  readFileSync(join(ROOT, 'public/data/knowledge-core.json'), 'utf8')
) as KnowledgeCore
const reader = new KnowledgeReader(core)

type Held = Exclude<AssistantAnswer, { state: 'data-not-loaded' }>
const held = (a: AssistantAnswer | undefined): Held => {
  if (!a || a.state === 'data-not-loaded') throw new Error('the data did not load')
  return a
}
const allRows = (a: Held): AssistantRow[] =>
  a.groups.flatMap((g: AssistantGroup) => [...g.rows, ...g.more])
const tagsOf = (a: Held): string[] => {
  const tags = allRows(a).map((r) => r.tag)
  if ('source' in a && a.source) tags.push(a.source.tag)
  if (a.state === 'direct') tags.push(a.direct.tag)
  if (a.state === 'name') tags.push(a.nameCard.tag)
  if (a.state === 'choices') tags.push(...a.choices.map((c) => c.tag))
  return tags
}

describe('the Assistant answers from the Hub knowledge files', () => {
  const log = stubKnowledgeFetch()
  const got = new Map<string, Held>()

  beforeAll(async () => {
    expect(log.urls).toEqual([]) // nothing is fetched before the first question
    for (const c of cases) got.set(c.id, held(await answer(c.question, { persona: c.persona })))
    for (const c of cases) {
      for (const persona of Object.keys(c.withPersona ?? {})) {
        got.set(
          `${c.id}/${persona}`,
          held(await answer(c.question, { persona: persona as PersonaId }))
        )
      }
    }
  }, 120_000)
  afterAll(() => {
    vi.unstubAllGlobals()
    forgetAssistant()
  })

  it('fetches the two knowledge files once, on the first question, and nothing else', () => {
    expect(log.urls.sort()).toEqual([...KNOWLEDGE_URLS].sort())
  })

  for (const c of cases) {
    describe(c.id, () => {
      const e = c.expect
      const a = () => got.get(c.id)!

      it('has the expected state, reading and fixed wording', () => {
        expect(a().state).toBe(e.state)
        if (e.intent) expect(a().intent).toBe(e.intent)
        if (e.note) expect(a().note).toBe(e.note)
        if (e.noteEndsWith) expect(a().note.endsWith(e.noteEndsWith)).toBe(true)
        if (e.answerText) expect(a().answerText).toBe(e.answerText)
      })

      it('orders the groups and rows as the contract says', () => {
        const x = a()
        if (e.groupOrder) expect(x.groups.map((g) => g.name)).toEqual(e.groupOrder)
        if (e.firstGroup) expect(x.groups[0].name).toBe(e.firstGroup)
        if (e.firstRow) {
          expect(x.groups[0].name).toBe(e.firstRow.group)
          expect(x.groups[0].rows[0].tag).toBe(e.firstRow.tag)
        }
        if (e.secondRowTag) expect(x.groups[0].rows[1].tag).toBe(e.secondRowTag)
        if (e.toolsStartWith) {
          const tools = x.groups.find((g) => g.name === 'Tools')!
          expect(tools.rows.map((r) => r.tag).slice(0, e.toolsStartWith.length)).toEqual(
            e.toolsStartWith
          )
        }
        for (const [persona, want] of Object.entries(c.withPersona ?? {})) {
          expect(got.get(`${c.id}/${persona}`)!.groups.map((g) => g.name)).toEqual(want.groupOrder)
        }
      })

      it('shows a direct answer only with its record and evidence, and a source line only when it should', () => {
        const x = a()
        if (e.directTag) {
          if (x.state !== 'direct') throw new Error(`expected a direct answer, got ${x.state}`)
          expect(x.direct.tag).toBe(e.directTag)
          // the value is the record's own field, copied as it is held
          const record = reader.get(e.directTag) as KnowledgeRecord
          expect(x.direct.value).toBe(String(record.fields?.[e.directField as string]))
          expect(x.direct.evidence.line).toMatch(
            /^Evidence: .+: .+ \(.+\)\. .+\. Checked against the record\.$/
          )
          expect(x.direct.evidence.tag).toBe(e.directTag)
        }
        if (e.noDirect) expect(x.state).not.toBe('direct')
        if (e.sourceLabel && 'source' in x) expect(x.source?.label).toBe(e.sourceLabel)
        if (e.sourceTag && 'source' in x) expect(x.source?.tag).toBe(e.sourceTag)
        if (e.noSource) expect('source' in x && x.source).toBeFalsy()
        if (e.nameCardTag) {
          if (x.state !== 'name') throw new Error(`expected a name card, got ${x.state}`)
          expect(x.nameCard.tag).toBe(e.nameCardTag)
        }
      })
    })
  }

  it('every answer follows the row contract (up to three rows, tags that resolve, short links, no NICE labels)', () => {
    for (const [id, a] of got) {
      expect(a.groups.length, id).toBeGreaterThan(0)
      expect(new Set(a.groups.map((g) => g.name)).size, id).toBe(a.groups.length)
      for (const g of a.groups) {
        expect(ASSISTANT_GROUPS, id).toContain(g.name)
        expect(g.rows.length, id).toBeGreaterThan(0)
        expect(g.rows.length, id).toBeLessThanOrEqual(ASSISTANT_ROWS_PER_GROUP)
      }
      for (const r of allRows(a)) {
        expect(r.goLink).toBe(assistantGoLink(r.tag))
        expect(r.kind.length).toBeGreaterThan(0)
        expect(r.action).toBeTruthy()
        expect(`${r.dims ?? ''}`).not.toMatch(/\b[KST]\d{4}\b|\bNICE\b/)
        expect(r.paidReferenceOnly).toBe(false)
      }
      for (const tag of tagsOf(a)) {
        // the one tag the Hub cannot open yet: a persona's computed path (`PATH:architect`) has no record in the knowledge
        // core; the role phase adds it. Pinned here so this test says so the day it starts to resolve.
        if (PERSONA_PATH_TAGS.has(tag)) expect(reader.lookup(tag).found, tag).toBe(false)
        else expect(reader.lookup(tag).found, `${id}: ${tag}`).toBe(true)
      }
    }
  })

  it('a role path row is the one place a path appears, and it opens by its short link', () => {
    const a = got.get('golden-6-hybrid-certificates')!
    const path = a.groups[0].rows[1]
    expect(path.kind).toBe('Role path')
    expect(path.goLink).toBe('/go/PATH:architect')
  })
})

describe('data not loading, then Try again (golden case 9)', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('holds the question, shows no resources, and answers when asked again', async () => {
    vi.resetModules() // a fresh page: nothing loaded yet
    let down = true
    stubKnowledgeFetch({ fail: () => down })
    const fresh = await import('./adapter')
    const question = 'When is the CNSA 2.0 deadline?'
    const failed = await fresh.answer(question)
    expect(failed).toEqual({
      state: 'data-not-loaded',
      question,
      message: 'The Hub could not load the data for this answer.',
      kept: 'Your question is kept in the box below. Nothing was lost. Try again, or keep browsing the Hub.',
    })
    expect('groups' in failed).toBe(false)
    // the fixed words are the ones the engine's own note file holds
    expect(ASSISTANT_DATA_NOT_LOADED_MESSAGE).toBe(data.notes.failure.data_not_loading)
    expect(ASSISTANT_DATA_NOT_LOADED_KEPT).toBe(data.notes.failure.held)

    down = false
    const again = await fresh.answer(question)
    expect(again.state).toBe('direct')
  }, 120_000)
})

describe('a direct answer is never shown without its evidence', () => {
  const rec = (extra: Partial<KnowledgeRecord>): KnowledgeRecord => ({
    id: 'CMP:TESTLAND',
    kind: 'compliance rule',
    type: 'guidance',
    family: 'compliance',
    label: 'Testland Act',
    link: '/compliance?framework=TESTLAND',
    status: 'active',
    extract: 'A rule written for this test.',
    fields: { deadline: '2031-01-01', enforcement_body: 'Testland Authority' },
    ...extra,
  })
  const miniCore = (inputs: [string, string][]): KnowledgeCore => ({
    schema: 'knowledge-core/1',
    meta: { counts: { records: 1, links: 0, aliases: 1, by_kind: {} }, inputs, input_patterns: [] },
    records: [rec({})],
    aliases: { 'testland act': [['CMP:TESTLAND', 'label']] },
    links: [],
    relations: {},
  })
  const miniText = {
    schema: 'knowledge-text/1',
    entries: { 'CMP:TESTLAND': { full: 'A rule written for this test.\nDeadline: 2031-01-01' } },
  }

  async function ask(inputs: [string, string][], question: string) {
    vi.resetModules()
    stubKnowledgeFetch({
      bodies: {
        '/data/knowledge-core.json': miniCore(inputs),
        '/data/knowledge-text.json': miniText,
      },
    })
    const fresh = await import('./adapter')
    return fresh.answer(question)
  }
  afterAll(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('shows the value with the data file revision when the record has one', async () => {
    const a = await ask(
      [['src/data/compliance_11182026_r3.csv', 'x']],
      'When is the Testland Act deadline?'
    )
    if (a.state !== 'direct') throw new Error(`expected a direct answer, got ${a.state}`)
    expect(a.direct.value).toBe('2031-01-01')
    expect(a.direct.evidence.revision).toBe('Data file compliance_11182026_r3')
    expect(a.source.label).toBe('Answer drawn from')
  })

  it('returns resources only when the record has no data file revision to cite', async () => {
    const a = await ask([], 'When is the Testland Act deadline?')
    expect(a.state).toBe('resources')
    expect((a as { note: string }).note).toContain('No direct answer: resources only.')
  })
})

describe('the last check before a direct answer is shown', () => {
  it('never shows a cut-short value, or a bare yes or no to a question that is not a yes or no question', () => {
    expect(directValueFits('When is it?', '2031')).toBe(true)
    expect(directValueFits('When is it?', 'Starts in 2031 and goes on…')).toBe(false)
    expect(directValueFits('What does CNSA 2.0 require?', 'yes')).toBe(false)
    expect(directValueFits('Is PQC required by CNSA 2.0?', 'yes')).toBe(true)
    expect(directValueFits('Who enforces it?', '')).toBe(false)
  })
})

describe('what the file builder reads from the knowledge files', () => {
  const built = buildEngineInput(
    core,
    JSON.parse(readFileSync(join(ROOT, 'public/data/knowledge-text.json'), 'utf8'))
  )

  it('names a glossary term by its own label even when an algorithm family has the same name', () => {
    const ids = built.model.aliases['ml kem'].map((e) => e.id)
    expect(ids).toContain('GL:ml-kem')
    expect(ids).toContain('ALG:ML-KEM')
  })

  it('names the dated data file of each family in the evidence line, and each such file is one the core was built from', () => {
    const bases = core.meta.inputs.map((i) => i[0].split('/').pop() as string)
    for (const [family, prefix] of Object.entries(FAMILY_FILE_PREFIX)) {
      const found = bases.some((b) => new RegExp(`^${prefix}_\\d{8}`).test(b))
      expect(found, `${family}: ${prefix}`).toBe(true)
    }
  })

  it('offers only active records as resources, and gives each module its stage', () => {
    const active = new Set(core.records.filter((r) => r.status === 'active').map((r) => r.link))
    for (const r of built.catalogue.resources) {
      if (r.record_ids.length) expect(active.has(r.link), r.link).toBe(true)
    }
    expect(built.catalogue.curriculum?.stages['1']).toBe('Basics')
    expect(built.catalogue.curriculum?.modules['pqc-101'].stage).toBe(1)
  })

  it('groups links as the Hub pages do, and keeps an extract to one short line', () => {
    expect(groupOf('/learn/pqc-101')).toBe('Learn')
    expect(groupOf('/learn?glossary=ML-KEM', 'term')).toBe('References')
    expect(groupOf('/playground?lesson=x')).toBe('Tools')
    expect(groupOf('/library?ref=FIPS%20203')).toBe('References')
    expect(groupOf('/compliance?framework=DORA')).toBe('Data pages')
    expect(extractOf('Term: ML-KEM\nA key encapsulation mechanism.')).toBe(
      'A key encapsulation mechanism.'
    )
    expect(extractOf('word '.repeat(100)).length).toBeLessThanOrEqual(241)
  })
})
