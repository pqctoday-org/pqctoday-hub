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
})
