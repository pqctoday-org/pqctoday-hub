// SPDX-License-Identifier: AGPL-3.0-only
import { afterAll, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PERSONAS } from '@/data/learningPersonas'
import { answer, forgetAssistant } from '@/services/assistant/adapter'
import { stubKnowledgeFetch } from '@/services/assistant/testSupport'
import { sectionsOfLesson } from '@/services/journey/curriculum'
import { TREE_LESSONS } from '@/services/journey/lessons'
import { TOOL_RECORDS } from '@/data/generated/tools.generated'
import { NOT_ASKABLE, rankSuggestions, type SuggestionState } from './suggestionRanker'
import { KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import type { KnowledgeCore } from '@/services/knowledge/knowledgeTypes'
import { recordLinkOf } from '@/services/assistant/recordLinks'
import { lastAnswerOf } from './useSuggestions'

/**
 * Only suggest a question the Hub can answer (requirement S05). Every question the ranker can make is asked of the real
 * engine on the real knowledge files of the checkout: it must answer with resources, and name the thing asked about.
 */
stubKnowledgeFetch()
afterAll(() => {
  vi.unstubAllGlobals()
  forgetAssistant()
})

const NOW = 1_000_000_000_000
const base: SuggestionState = {
  now: NOW,
  asked: [],
  askedKeys: [],
  lastAnswer: null,
  finished: null,
  viewing: null,
  objective: null,
  choices: [],
  role: null,
}

/** Every question the five rules can make for one lesson, with the rule that makes it. */
function questionsForLesson(tag: string, title: string): { rule: number; question: string }[] {
  const ref = { tag, title, order: 1 }
  const step = { ...ref, kind: 'lesson' as const }
  const states: SuggestionState[] = [
    { ...base, finished: { ...ref, at: NOW } },
    { ...base, viewing: { tag, title, kind: 'lesson' } },
    {
      ...base,
      objective: {
        title: 'Goal',
        next: step,
        prerequisites: [ref],
        updates: [{ ...ref, kindLabel: 'New section' }],
      },
    },
  ]
  return states.flatMap((s) => rankSuggestions(s).filter((x) => x.rule < 6))
}

const GOOD = new Set(['resources', 'direct'])

describe('every suggested question can be answered from the Hub', () => {
  it('answers each question made for each lesson of the catalog with resources', async () => {
    const bad: string[] = []
    let asked = 0
    for (const lesson of TREE_LESSONS) {
      for (const { rule, question } of questionsForLesson(lesson.lmId, lesson.title)) {
        const a = await answer(question)
        asked++
        const hasRows = a.state !== 'data-not-loaded' && a.groups.length > 0
        if (!GOOD.has(a.state) || !hasRows) bad.push(`rule ${rule}: ${question} -> ${a.state}`)
      }
    }
    expect(asked).toBeGreaterThan(TREE_LESSONS.length * 4)
    expect(bad).toEqual([])
  }, 300_000)

  it('answers the question made for each section, and the sections that cannot be asked about are exactly the listed ones', async () => {
    const fails: string[] = []
    for (const lesson of TREE_LESSONS) {
      for (const section of sectionsOfLesson(lesson.id)) {
        const tag = `${lesson.lmId}/s:${section.id}`
        // a tag outside the list, so the question is the section's own
        const [main] = rankSuggestions({
          ...base,
          viewing: {
            tag: `probe:${tag}`,
            title: section.label,
            kind: 'section',
            lessonTitle: lesson.title,
          },
        })
        const a = await answer(main.question)
        if (!GOOD.has(a.state)) fails.push(tag)
      }
    }
    expect(fails.sort()).toEqual([...NOT_ASKABLE].sort())
  }, 300_000)

  it('answers the question for each role, and the engine puts the role path in it', async () => {
    for (const [id, persona] of Object.entries(PERSONAS)) {
      const [main] = rankSuggestions({ ...base, role: { id, label: persona.label } })
      const a = await answer(main.question, { persona: id as never })
      expect(a.state, main.question).toBe('resources')
      const tags = a.state === 'resources' ? a.groups.flatMap((g) => g.rows.map((r) => r.tag)) : []
      expect(
        tags.some((t) => t === `PATH:${id}`),
        main.question
      ).toBe(true)
    }
  }, 120_000)

  it('answers the starting questions', async () => {
    for (const s of rankSuggestions(base)) {
      expect(['not-held']).not.toContain((await answer(s.question)).state)
    }
  }, 60_000)

  it('answers what each tool of the catalog does, with the tool among the resources', async () => {
    const bad: string[] = []
    for (const tool of TOOL_RECORDS) {
      const [main] = rankSuggestions({
        ...base,
        objective: {
          title: 'Goal',
          next: { tag: `BT:${tool.toolId}`, title: tool.name, order: 1, kind: 'tool' },
          prerequisites: [],
          updates: [],
        },
      })
      expect(main.question).toBe(`What does ${tool.name} do?`)
      const a = await answer(main.question)
      const tags =
        a.state === 'resources'
          ? a.groups.flatMap((g) => [...g.rows, ...g.more].map((r) => r.tag))
          : []
      const own = [`TOOL:${tool.toolId}`, `BT:${tool.toolId}`, 'ptId' in tool ? tool.ptId : '']
      if (a.state !== 'resources' || !tags.some((t) => own.includes(t))) bad.push(tool.name)
    }
    expect(TOOL_RECORDS.length).toBeGreaterThan(90)
    expect(bad).toEqual([])
  }, 300_000)

  it('answers the questions built on the last answer, for every answer of a fixed set of questions', async () => {
    // the questions of the Assistant's own fixtures, the first glossary term taught in each lesson, and every 8th framework
    const core = JSON.parse(
      readFileSync(join(process.cwd(), 'public/data/knowledge-core.json'), 'utf8')
    ) as {
      records: { id: string; label: string; type: string }[]
      links: string[][]
    }
    const byId = new Map(core.records.map((r) => [r.id, r]))
    const taught = new Map<string, string[]>()
    for (const [from, rel, to] of core.links) {
      if (rel === 'taught_in' && from.startsWith('GL:') && /^LM-\d+$/.test(to)) {
        taught.set(to, [...(taught.get(to) ?? []), from])
      }
    }
    const questions = [
      'When is the CNSA 2.0 deadline?',
      'What is ML-KEM?',
      'ML-KEM',
      'Which deadlines apply to banks in the EU?',
      'Where can I learn about hybrid certificates?',
      'Where is the ANSI X9.62 standard?',
      'What does CNSA 2.0 require?',
      'FIPS 203',
      'How should a bank start its PQC migration?',
      ...core.records
        .filter((r) => r.type === 'module' && taught.has(r.id))
        .map((r) => `What is ${byId.get([...taught.get(r.id)!].sort()[0])!.label}?`),
      ...core.records
        .filter((r) => r.id.startsWith('CMP:'))
        .sort((a, b) => (a.id < b.id ? -1 : 1))
        .filter((_, i) => i % 8 === 0)
        .map((r) => `What does ${r.label} require?`),
    ]
    const bad: string[] = []
    let built = 0
    for (const q of questions) {
      const a = await answer(q)
      if (a.state === 'data-not-loaded') throw new Error('the data did not load')
      const last = lastAnswerOf([{ id: 'x', question: q, status: 'done', answer: a }])
      if (!last) continue
      for (const s of rankSuggestions({ ...base, lastAnswer: last }).filter(
        (x) => x.label === 'From this answer'
      )) {
        built++
        const b = await answer(s.question)
        const rows = b.state === 'data-not-loaded' ? 0 : b.groups.length
        if (!GOOD.has(b.state) || rows === 0) bad.push(`${q} -> ${s.question} -> ${b.state}`)
      }
    }
    expect(questions.length).toBeGreaterThan(100)
    expect(built).toBeGreaterThan(100)
    expect(bad).toEqual([])
  }, 600_000)

  it('answers the question about the link of a record directly, correctly, for a fixed sample of every record kind that has one', async () => {
    const core = JSON.parse(
      readFileSync(join(process.cwd(), 'public/data/knowledge-core.json'), 'utf8')
    ) as KnowledgeCore
    const reader = new KnowledgeReader(core)
    const byId = new Map(core.records.map((r) => [r.id, r]))
    const active = (id: string) => (byId.get(id)?.status ?? 'active') === 'active'
    const names = (ids: string[]) => {
      const sorted = ids
        .filter(active)
        .map((id) => ({ id, label: String(byId.get(id)!.label) }))
        .sort((a, b) =>
          a.label.toLowerCase() === b.label.toLowerCase()
            ? a.id < b.id
              ? -1
              : 1
            : a.label.toLowerCase() < b.label.toLowerCase()
              ? -1
              : 1
        )
      const shown = sorted.slice(0, 5).map((n) => n.label)
      return shown.join('; ') + (sorted.length > 5 ? `; and ${sorted.length - 5} more` : '')
    }
    // the fixed sample: the records of each kind, sorted by tag, every 5th
    const kinds: {
      relation: string
      pick: (r: (typeof core.records)[number]) => boolean
      expected: (id: string) => string
    }[] = [
      {
        relation: 'made_by',
        pick: (r) => r.type === 'product',
        expected: (id) =>
          names(core.links.filter((l) => l[0] === id && l[1] === 'made_by').map((l) => l[2])),
      },
      {
        relation: 'makes',
        pick: (r) => r.type === 'vendor',
        expected: (id) =>
          names(core.links.filter((l) => l[2] === id && l[1] === 'made_by').map((l) => l[0])),
      },
      {
        relation: 'certifies',
        pick: (r) => r.type === 'certification',
        expected: (id) =>
          names(core.links.filter((l) => l[0] === id && l[1] === 'certifies').map((l) => l[2])),
      },
      {
        relation: 'publishes',
        pick: (r) => r.type === 'source',
        expected: (id) =>
          names(core.links.filter((l) => l[2] === id && l[1] === 'published_by').map((l) => l[0])),
      },
    ]
    const bad: string[] = []
    const asked: Record<string, number> = {}
    for (const kind of kinds) {
      const sample = core.records
        .filter(kind.pick)
        .map((r) => r.id)
        .sort()
        .filter((_, i) => i % 5 === 0)
      for (const id of sample) {
        const rec = byId.get(id)!
        const link = recordLinkOf(reader, id)
        const last = { matched: { tag: id, title: rec.label, ...link }, lesson: null }
        if (last?.matched?.relation !== kind.relation) continue // a record without the link, or a certification not named by number
        const [main] = rankSuggestions({ ...base, lastAnswer: last })
        if (main.rule !== 1) continue // a title too long or itself a question is not built on
        const a = await answer(main.question)
        asked[kind.relation] = (asked[kind.relation] ?? 0) + 1
        const got = a.state === 'direct' ? a.direct.value : null
        // a name two records share is answered by asking which, never by guessing
        const twins = core.records.filter(
          (r) => r.label === rec.label && r.type === rec.type && active(r.id)
        ).length
        if (got !== kind.expected(id) && !(got === null && twins > 1))
          bad.push(`${main.question} -> ${got} (expected ${kind.expected(id)})`)
      }
    }
    expect(Object.keys(asked).sort()).toEqual(['certifies', 'made_by', 'makes', 'publishes'])
    for (const n of Object.values(asked)) expect(n).toBeGreaterThan(20)
    expect(bad).toEqual([])
  }, 600_000)
})
