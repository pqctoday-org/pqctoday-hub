// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  JUST_FINISHED_MS,
  MAX_SUGGESTIONS,
  NOT_ASKABLE,
  rankSuggestions,
  type LessonRef,
  type SuggestionState,
} from './suggestionRanker'

const NOW = 1_000_000_000_000
const lesson = (tag: string, title: string, order: number): LessonRef => ({ tag, title, order })
const TLS = lesson('LM-008', 'TLS Basics', 8)
const PKI = lesson('LM-004', 'PKI Basics', 4)
const HYB = lesson('LM-011', 'Hybrid Certificates', 11)

const EMPTY: SuggestionState = {
  now: NOW,
  asked: [],
  finished: null,
  viewing: null,
  objective: null,
  role: null,
}
const ruleOf = (s: SuggestionState) => rankSuggestions(s).map((x) => x.rule)
const questionsOf = (s: SuggestionState) => rankSuggestions(s).map((x) => x.question)

/** The state a learner is in when every rule has something to offer. */
const FULL: SuggestionState = {
  ...EMPTY,
  finished: { ...PKI, at: NOW - 60_000 },
  viewing: { tag: 'LM-008', title: 'TLS Basics', kind: 'lesson' },
  objective: {
    title: 'Review our TLS migration design',
    next: TLS,
    prerequisites: [PKI],
    updates: [{ ...HYB, kindLabel: 'New section' }],
  },
  role: { id: 'architect', label: 'Security Architect' },
}

describe('rule 1: what the learner just finished or is viewing', () => {
  it('offers a question about the lesson just finished', () => {
    const [main] = rankSuggestions({ ...EMPTY, finished: { ...PKI, at: NOW - 1000 } })
    expect(main).toMatchObject({
      rule: 1,
      label: 'Recap',
      question: 'Where can I practise PKI Basics?',
    })
    expect(main.why).toContain('You finished PKI Basics')
  })
  it('stops calling a lesson just finished after half an hour, and never from the future', () => {
    expect(ruleOf({ ...EMPTY, finished: { ...PKI, at: NOW - JUST_FINISHED_MS } })[0]).toBe(1)
    expect(ruleOf({ ...EMPTY, finished: { ...PKI, at: NOW - JUST_FINISHED_MS - 1 } })[0]).toBe(6)
    expect(ruleOf({ ...EMPTY, finished: { ...PKI, at: NOW + 1 } })[0]).toBe(6)
  })
  it('offers a question about the lesson on the page', () => {
    const [main] = rankSuggestions({
      ...EMPTY,
      viewing: { tag: 'LM-008', title: 'TLS Basics', kind: 'lesson' },
    })
    expect(main).toMatchObject({
      rule: 1,
      label: 'This page',
      question: 'What is TLS Basics about?',
    })
  })
  it('asks about the section on the page, and about its lesson when the section cannot be asked about', () => {
    const view = (tag: string) => ({
      ...EMPTY,
      viewing: {
        tag,
        title: 'Key Establishment',
        kind: 'section' as const,
        lessonTitle: 'TLS Basics',
      },
    })
    expect(rankSuggestions(view('LM-008/s:key-establishment'))[0].question).toBe(
      'Where can I read about Key Establishment?'
    )
    const odd = [...NOT_ASKABLE][0]
    expect(rankSuggestions(view(odd))[0].question).toBe('What is TLS Basics about?')
  })
  it('asks what a record is when the page is a record of the Hub', () => {
    const [main] = rankSuggestions({
      ...EMPTY,
      viewing: { tag: 'CMP:CNSA-2', title: 'CNSA 2.0', kind: 'record' },
    })
    expect(main).toMatchObject({ rule: 1, question: 'What is CNSA 2.0?' })
  })
  it('puts what was just finished before what is on the page', () => {
    const s = {
      ...EMPTY,
      finished: { ...PKI, at: NOW - 1000 },
      viewing: { tag: 'LM-008', title: 'TLS Basics', kind: 'lesson' as const },
    }
    expect(questionsOf(s).slice(0, 2)).toEqual([
      'Where can I practise PKI Basics?',
      'What is TLS Basics about?',
    ])
  })
})

describe('rule 2: the next step of the focused objective', () => {
  const objective = (over = {}) => ({
    title: 'Review our TLS migration design',
    next: TLS,
    prerequisites: [],
    updates: [],
    ...over,
  })
  it('offers a question about the next step, with the objective as its basis', () => {
    const [main] = rankSuggestions({ ...EMPTY, objective: objective() })
    expect(main).toMatchObject({
      rule: 2,
      label: 'Next step',
      question: 'What will I learn in TLS Basics?',
      basedOn: 'next step in your objective, Review our TLS migration design',
    })
    expect(main.why.startsWith('Based on: next step in your objective')).toBe(true)
  })
  it('offers nothing for an objective whose next step is not a lesson or that has no next step', () => {
    expect(ruleOf({ ...EMPTY, objective: objective({ next: null }) })).toEqual([6, 6, 6])
  })
})

describe('rule 3: a prerequisite for the next step', () => {
  it('offers a question about each lesson to take first, in curriculum order then tag', () => {
    const second = lesson('LM-002', 'Quantum Threats', 4) // same place as PKI Basics: the tag breaks the tie
    const state = {
      ...EMPTY,
      objective: {
        title: 'Goal',
        next: null,
        prerequisites: [HYB, PKI, second],
        updates: [],
      },
    }
    const got = rankSuggestions(state).filter((x) => x.rule === 3)
    expect(got.map((x) => x.question)).toEqual([
      'What is Quantum Threats about?',
      'What is PKI Basics about?',
      'What is Hybrid Certificates about?',
    ])
    expect(got[0]).toMatchObject({ label: 'Prerequisite' })
  })
  it('names the step it is a prerequisite for', () => {
    const [pre] = rankSuggestions({
      ...EMPTY,
      objective: { title: 'Goal', next: TLS, prerequisites: [PKI], updates: [] },
    }).filter((x) => x.rule === 3)
    expect(pre.basedOn).toBe('a lesson to take first for TLS Basics')
    expect(pre.why).toContain('not finished')
  })
})

describe('rule 4: an update that touches the objective', () => {
  it('offers a question about each changed lesson, in curriculum order then tag', () => {
    const state = {
      ...EMPTY,
      objective: {
        title: 'Goal',
        next: null,
        prerequisites: [],
        updates: [
          { ...HYB, kindLabel: 'New section' },
          { ...PKI, kindLabel: 'Tool updated' },
        ],
      },
    }
    const got = rankSuggestions(state).filter((x) => x.rule === 4)
    expect(got.map((x) => x.question)).toEqual([
      'What changed in PKI Basics?',
      'What changed in Hybrid Certificates?',
    ])
    expect(got[0]).toMatchObject({ label: 'Update' })
    expect(got[0].why).toContain('tool updated')
  })
})

describe('rule 5: role exploration', () => {
  it('offers the lessons listed for the learner role', () => {
    const [main] = rankSuggestions({ ...EMPTY, role: { id: 'ops', label: 'IT Ops / DevOps' } })
    expect(main).toMatchObject({
      rule: 5,
      label: 'Your role',
      question: 'Which lessons are for the IT Ops / DevOps role?',
    })
  })
  it('offers no role question without a role, only the starting questions', () => {
    expect(ruleOf(EMPTY)).toEqual([6, 6, 6])
  })
})

describe('the order between the rules', () => {
  it('lists the rules in order: 1, 2, 3, 4, 5, then the starting questions', () => {
    const rules = ruleOf(FULL)
    expect(rules).toEqual([...rules].sort())
    expect([...new Set(rules)]).toEqual([1, 2, 3, 4, 5, 6])
  })
  for (const k of [1, 2, 3, 4, 5] as const) {
    it(`makes rule ${k} the main question when no earlier rule applies`, () => {
      const state: SuggestionState = {
        ...FULL,
        finished: k <= 1 ? FULL.finished : null,
        viewing: k <= 1 ? FULL.viewing : null,
        objective: FULL.objective && {
          ...FULL.objective,
          next: k <= 2 ? TLS : null,
          prerequisites: k <= 3 ? FULL.objective.prerequisites : [],
          updates: k <= 4 ? FULL.objective.updates : [],
        },
        role: k <= 5 ? FULL.role : null,
      }
      expect(rankSuggestions(state)[0].rule).toBe(k)
    })
  }
  it('falls back to the starting questions when no rule applies', () => {
    expect(rankSuggestions(EMPTY)[0]).toMatchObject({ rule: 6, basedOn: 'a starting question' })
  })
  it('keeps the same questions in the same order for the same state', () => {
    expect(rankSuggestions(FULL)).toEqual(rankSuggestions(structuredClone(FULL)))
  })
  it('does not depend on the order the updates and prerequisites arrive in', () => {
    const a = { ...PKI, kindLabel: 'x' }
    const b = { ...HYB, kindLabel: 'y' }
    const make = (updates: (typeof a)[], pre: LessonRef[]) => ({
      ...EMPTY,
      objective: { title: 'G', next: null, prerequisites: pre, updates },
    })
    expect(rankSuggestions(make([a, b], [PKI, HYB]))).toEqual(
      rankSuggestions(make([b, a], [HYB, PKI]))
    )
  })
})

describe('what is left out and what is kept', () => {
  it('leaves out a question already asked and moves the next one up', () => {
    const before = questionsOf(FULL)
    const after = questionsOf({ ...FULL, asked: [before[0].toUpperCase()] })
    expect(after).not.toContain(before[0])
    expect(after[0]).toBe(before[1])
  })
  it('offers at most eight, and never twice the same question', () => {
    const many = {
      ...FULL,
      objective: {
        ...FULL.objective!,
        updates: Array.from({ length: 12 }, (_, i) => ({
          ...lesson(`LM-${100 + i}`, `Lesson ${i}`, 100 + i),
          kindLabel: 'New tool',
        })),
      },
    }
    const q = questionsOf(many)
    expect(q).toHaveLength(MAX_SUGGESTIONS)
    expect(new Set(q.map((x) => x.toLowerCase())).size).toBe(q.length)
  })
  it('always has a reason, and a basis the reason starts with', () => {
    for (const s of rankSuggestions(FULL)) {
      expect(s.why.startsWith(`Based on: ${s.basedOn}.`)).toBe(true)
    }
  })
  it('does not change the state it is given', () => {
    const frozen = structuredClone(FULL)
    const deep = (o: unknown): unknown => {
      if (o && typeof o === 'object') Object.values(o).forEach(deep)
      return Object.freeze(o)
    }
    deep(frozen)
    expect(() => rankSuggestions(frozen)).not.toThrow()
    expect(frozen).toEqual(FULL)
  })
})

describe('the ranker reads the learner state and never writes it', () => {
  const source = readFileSync(
    join(process.cwd(), 'src/components/Assistant/suggestionRanker.ts'),
    'utf8'
  )
  const imports = [...source.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1])
  it('imports nothing but the copy deck and a type', () => {
    expect(imports.sort()).toEqual(['./Suggestions', './copy'])
  })
  it('imports no store, journey or objective code and calls no setter', () => {
    expect(source).not.toMatch(/@\/(store|hooks|services\/journey|components\/Journey)/)
    expect(source).not.toMatch(/\.setState\(|\.getState\(|useJourneyStore|\bset[A-Z]\w*\(/)
  })
})
