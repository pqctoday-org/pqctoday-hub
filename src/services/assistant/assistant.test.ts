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
  forgetAssistant,
} from './adapter'
import { directValueFits } from './engineHost'
import { buildEngineInput, extractOf, FAMILY_FILE_PREFIX, groupOf } from './buildEngine'
import { decodeCodes, matchedExtract } from './engine/answerer'
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
import type { PersonaId } from '@/data/personaIds'

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
  paidTag?: string
}
interface Case {
  id: string
  question: string
  persona?: PersonaId
  expect: Expect
  withPersona?: Record<string, { groupOrder: string[] }>
}
const cases = (fixtures as { cases: Case[] }).cases

const ROOT = process.cwd()
const core = JSON.parse(
  readFileSync(join(ROOT, 'public/data/knowledge-core.json'), 'utf8')
) as KnowledgeCore
const reader = new KnowledgeReader(core)
const paidTags = new Set(core.records.filter((r) => r.paid).map((r) => r.id))

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
        if (e.paidTag) {
          const row = allRows(x).find((r) => r.tag === e.paidTag)
          expect(row?.paidReferenceOnly).toBe(true)
          expect(row?.extract).toBe('')
        }
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
        // a paid standard is linked, never quoted
        expect(r.paidReferenceOnly).toBe(paidTags.has(r.tag))
        if (r.paidReferenceOnly) expect(r.extract).toBe('')
      }
      for (const tag of tagsOf(a)) {
        expect(reader.lookup(tag).found, `${id}: ${tag}`).toBe(true)
      }
    }
  })

  it('a role path row is the one place a path appears, and it opens by its short link', () => {
    const a = got.get('golden-6-hybrid-certificates')!
    const path = a.groups[0].rows[1]
    expect(path.kind).toBe('Role path')
    expect(path.goLink).toBe('/go/PATH:architect')
    // the path is a record of the core now: the row opens where the record says
    expect(path.link).toBe(reader.get('PATH:architect')?.link)
    expect(path.link).toBe('/learn?view=journey&role=architect')
  })
})

describe('lessons under their own name, plain matches, and questions nothing is recognised in', () => {
  beforeAll(() => {
    stubKnowledgeFetch()
  })
  afterAll(() => {
    vi.unstubAllGlobals()
    forgetAssistant()
  })
  const learnRows = (a: Held) => a.groups.find((g) => g.name === 'Learn')?.rows ?? []

  it('offers a lesson as the lesson, and never a known-answer test in its place', async () => {
    const a = held(await answer('Is there a module on TLS?'))
    expect(learnRows(a)[0]).toMatchObject({ title: 'TLS Basics', kind: 'Module' })
    for (const q of ['Is there a module on TLS?', 'What is ML-KEM?', 'What is crypto agility?']) {
      const rows = allRows(held(await answer(q)))
      expect(rows.length).toBeGreaterThan(0)
      expect(
        rows
          .filter((r) => r.tag.startsWith('KAT:') || /\bstep_\d+_/.test(r.title))
          .map((r) => r.title)
      ).toEqual([])
    }
  })

  it('searches a question nothing is recognised in by its own words', async () => {
    const fiveG = held(await answer('5g'))
    expect(fiveG.state).toBe('broad')
    expect(learnRows(fiveG)[0]).toMatchObject({ title: '5G Security', kind: 'Module' })
    // a request with no topic still gets the introduction
    const hello = held(await answer('hello'))
    expect(hello.state).toBe('broad')
    expect(learnRows(hello)[0].title).toBe('PQC 101')
    expect(learnRows(hello).map((r) => r.tag)).not.toEqual(learnRows(fiveG).map((r) => r.tag))
    // words the Hub holds nothing on get the introduction too, never an empty answer
    const nothing = held(await answer('qwertyzzxx blorp'))
    expect(nothing.state).toBe('broad')
    expect(learnRows(nothing)[0].title).toBe('PQC 101')
  })

  it('answers the one word that names the whole subject of the Hub with the introduction', async () => {
    const quantum = held(await answer('quantum'))
    expect(quantum.state).toBe('broad')
    expect(learnRows(quantum)[0].title).toBe('PQC 101')
    // a single word with a subject of its own keeps that subject
    const firstLesson: Record<string, RegExp> = {
      '5g': /5G/,
      iot: /IoT/,
      banking: /Banking/,
      satellites: /Aerospace/,
    }
    for (const [q, title] of Object.entries(firstLesson)) {
      const a = held(await answer(q))
      expect(learnRows(a)[0].title, q).toMatch(title)
    }
  })

  it('shows the sentence that matched the question when it says more than the first lines of the record', async () => {
    const a = held(await answer('is aes 256 quantum safe'))
    const lessons = allRows(a).filter((r) => r.kind === 'Module')
    expect(lessons.some((r) => /AES-256/.test(r.extract))).toBe(true)
    for (const q of [
      'is aes 256 quantum safe',
      'how big is an ML-DSA signature',
      'pci dss quantum requirements',
    ]) {
      for (const r of allRows(held(await answer(q)))) {
        expect(Array.from(r.extract).length).toBeLessThanOrEqual(241)
        expect(r.extract).not.toMatch(/\*\*|^#|\bIndex: \d+/)
      }
    }
  })

  it('reads a quiz request, a "by what year" question and a "do I need to worry" question for what they ask', async () => {
    const read = async (q: string) => held(await answer(q)).intent
    expect(await read('quiz on tls')).toBe('learning')
    expect(await read('By what year do Hong Kong banks need to be fully quantum-safe?')).toBe(
      'dates'
    )
    expect(await read('do I need to worry about symmetric crypto')).toBe('risk')
    expect(await read('What are the NIST PQC standards?')).toBe('list')
    const quiz = held(await answer('quiz on tls'))
    expect(quiz.groups[0].name).toBe('Learn')
    expect(learnRows(quiz).map((r) => r.title)).toContain('TLS Basics')
  })

  it('does not show a record that holds only one word of a longer question beside the best matches', async () => {
    const a = held(await answer('is rsa 2048 still ok'))
    const shown = a.groups.flatMap((g) => g.rows.map((r) => r.title))
    expect(shown.length).toBeGreaterThan(0)
    expect(shown).not.toContain('CKR_OK')
  })

  it('keeps a record that holds the name the question asks about, though it holds no other word of it', async () => {
    const a = held(await answer('who created sphincs+'))
    expect(a.groups.flatMap((g) => g.rows.map((r) => r.title))).toContain('SPHINCS+ Team')
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
    expect(directValueFits('What does DORA require?', 'expected', 'requires_pqc')).toBe(false)
    expect(directValueFits('Is PQC mandatory under DORA?', 'expected', 'requires_pqc')).toBe(true)
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

  it('reads the learning journey, the role paths, the paid standards and the successor passages from the core', () => {
    const cur = built.catalogue.curriculum?.modules['pqc-101'] as Record<string, unknown>
    expect(cur.stage).toBe(1)
    expect(cur.track).toBe('Foundations')
    expect(cur.breadth).toBe(core.curriculum?.['LM-001'].breadth)
    expect(cur.explains).toEqual(core.curriculum?.['LM-001'].explains)
    // only the lessons the core's curriculum names
    expect(Object.keys(built.catalogue.curriculum?.modules ?? {}).length).toBe(
      Object.keys(core.curriculum ?? {}).length
    )
    const architect = core.records.find((r) => r.id === 'PATH:architect')
    expect(built.catalogue.rolePaths?.architect).toEqual({
      first: architect?.parts,
      rest: architect?.more,
    })
    expect(new Set(built.catalogue.paid)).toEqual(paidTags)
    expect(paidTags.size).toBeGreaterThan(0)
    expect(built.statements).toBe(core.successors)
  })

  it('offers only active records as resources, and gives each module its stage', () => {
    const active = new Set(core.records.filter((r) => r.status === 'active').map((r) => r.link))
    for (const r of built.catalogue.resources) {
      if (r.record_ids.length) expect(active.has(r.link), r.link).toBe(true)
    }
    expect(built.catalogue.curriculum?.stages['1']).toBe('Basics')
    expect(built.catalogue.curriculum?.modules['pqc-101'].stage).toBe(1)
  })

  it('names every lesson and page address by the lesson or the page, never by a test that runs in it', () => {
    const byLink = new Map(built.catalogue.resources.map((r) => [r.link, r]))
    const byId = new Map(core.records.map((r) => [r.id, r]))
    const lessons = core.records.filter((r) => r.type === 'module' && r.status === 'active')
    expect(lessons.length).toBeGreaterThan(50)
    for (const lesson of lessons) {
      const res = byLink.get(lesson.link)
      expect(res?.title, lesson.link).toBe(lesson.label)
      expect(res?.type, lesson.link).toBe('module')
      expect(res?.record_ids[0], lesson.link).toBe(lesson.id)
    }
    for (const page of core.records.filter((r) => r.type === 'page' && r.status === 'active')) {
      expect(byLink.get(page.link)?.record_ids[0], page.link).toBe(page.id)
    }
    // a known-answer test shares an address; it is kept among the records of that address and never names it
    const tests = core.records.filter((r) => r.type === 'kat' && r.status === 'active')
    expect(tests.length).toBeGreaterThan(0)
    for (const t of tests) {
      const res = byLink.get(t.link)
      expect(res?.record_ids, t.id).toContain(t.id)
      expect(byId.get(res?.record_ids[0] ?? '')?.type, t.id).not.toBe('kat')
    }
    expect(built.catalogue.resources.some((r) => r.type === 'kat')).toBe(false)
  })

  it('names a shared address by its lesson whatever the order of the file, and keeps the order of the file otherwise', () => {
    const rec = (id: string, type: string, label: string, link: string) => ({
      ...core.records[0],
      id,
      type,
      kind: type,
      label,
      link,
      status: 'active',
      extract: label,
    })
    const small = {
      ...core,
      records: [
        rec('KAT:T-1', 'kat', 'ML-KEM-768: Builder step_1_keygen', '/learn/x'),
        rec('CHK:a', 'checklistitem', 'First item', '/y'),
        rec('LM-900', 'module', 'Lesson X', '/learn/x'),
        rec('CHK:b', 'checklistitem', 'Second item', '/y'),
        rec('PAGE:y', 'page', 'Page Y', '/y'),
        rec('CHK:c', 'checklistitem', 'Third item', '/z'),
        rec('CHK:d', 'checklistitem', 'Fourth item', '/z'),
      ],
    } as typeof core
    const res = buildEngineInput(small, { entries: {} } as never).catalogue.resources
    expect(res.map((r) => [r.link, r.title, r.type, r.record_ids])).toEqual([
      ['/learn/x', 'Lesson X', 'module', ['LM-900', 'KAT:T-1']],
      ['/y', 'Page Y', 'page', ['PAGE:y', 'CHK:a', 'CHK:b']],
      ['/z', 'Third item', 'checklistitem', ['CHK:c', 'CHK:d']],
    ])
  })

  it('shows no character code of the source pages in a title, an extract or a passage', () => {
    const code =
      /&(?:#\d+|#x[0-9a-f]+|quot|apos|mdash|ndash|ldquo|rdquo|lsquo|rsquo|bull|rarr|sect|nbsp|times|hellip);/i
    const shown = [
      ...built.catalogue.resources.flatMap((r) => [r.title, r.extract]),
      ...built.catalogue.passages.flatMap((p) => [p.title, p.text]),
      ...built.model.records.map((r) => r.label),
    ]
    expect(shown.length).toBeGreaterThan(10_000)
    expect(shown.filter((t) => code.test(t)).slice(0, 3)).toEqual([])
    // the knowledge text itself keeps its codes: they are decoded for the Assistant only
    expect(readFileSync(join(ROOT, 'public/data/knowledge-text.json'), 'utf8')).toMatch(code)
    expect(
      decodeCodes('don&apos;t &quot;x&quot; a &amp; b &mdash; c&nbsp;d &#8217; &#x2019;')
    ).toBe('don\'t "x" a & b — c d ’ ’')
    expect(decodeCodes('&amp;quot; R&D; &sup5; &#0;')).toBe('&quot; R&D; &sup5; &#0;')
    expect(extractOf('Term: X\nA &ldquo;quoted&rdquo; line &mdash; decoded.')).toBe(
      'A “quoted” line — decoded.'
    )
  })

  it('shows no line that only places a record in the Hub lists, and no test step name in place of a page', () => {
    const structure = /\b(?:Index: \d+|List: [a-z_]+)\b|\bstep_\d+_\w+/
    const res = built.catalogue.resources
    expect(res.filter((r) => structure.test(r.extract)).map((r) => r.link)).toEqual([])
    // a workshop step with no words of its own is not offered (its lesson is); every step offered has words
    const steps = res.filter((r) => r.type === 'step')
    expect(steps.length).toBeGreaterThan(300)
    expect(steps.filter((r) => !r.extract).map((r) => r.link)).toEqual([])
    expect(
      extractOf('Index: 0\nList: workshop_steps\nModule: tls-basics\nRun the handshake.')
    ).toBe('Run the handshake.')
    expect(extractOf('Index: 1\nList: workshop_steps\nModule: 5g-security')).toBe('')
    expect(extractOf('Module: TLS Basics')).toBe('TLS Basics')
    expect(extractOf('List: the three algorithms NIST selected')).toBe(
      'List: the three algorithms NIST selected'
    )
  })

  it('cuts the matched part of a passage at a sentence start and at a word, and never shows a heading, a field or a cut sentence', () => {
    const text =
      '## Hybrid key exchange\nStatus: Final\n- **Why hybrid** a short label\n' +
      'Hybrid key exchange runs a classical and a post-quantum exchange side by side. ' +
      'The handshake grows by about 2,300 bytes because the ML-KEM-768 key share is larger than an X25519 one. ' +
      'A middlebox that drops large ClientHello messages breaks the connection, so test the path before the rollout.\n' +
      'Table cell without an end\n' +
      'lower-case fragment of a sentence that was cut by the passage boundary and names the handshake bytes.'
    const w: [string, number][] = [
      ['bytes', 2],
      ['handshake', 1.5],
      ['grows', 1],
    ]
    const m = matchedExtract(text, w)
    expect(m?.held).toBe(4.5)
    expect(m?.text.startsWith('The handshake grows by about 2,300 bytes')).toBe(true)
    expect(m?.text).toContain('middlebox')
    expect(matchedExtract(text, w, 60)?.text).toBe(
      'The handshake grows by about 2,300 bytes because the…'
    )
    const all = matchedExtract(
      text,
      ['hybrid', 'handshake', 'status', 'table', 'fragment'].map((x) => [x, 1]),
      2000
    )
    for (const never of ['##', 'Status:', '**', 'Table cell', 'lower-case fragment'])
      expect(all?.text).not.toContain(never)
    expect(matchedExtract(text, [['lattice', 1]])).toBeNull()
    expect(matchedExtract('Label only\nAnother label', w)).toBeNull()
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
