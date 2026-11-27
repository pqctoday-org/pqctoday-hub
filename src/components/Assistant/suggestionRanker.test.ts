// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { questionKey } from './askedKey'
import {
  JUST_FINISHED_MS,
  MAX_SUGGESTIONS,
  NOT_ASKABLE,
  rankSuggestions,
  type LessonRef,
  type StepRef,
  type SuggestionState,
} from './suggestionRanker'

const NOW = 1_000_000_000_000
const lesson = (tag: string, title: string, order: number): LessonRef => ({ tag, title, order })
const TLS: StepRef = { ...lesson('LM-008', 'TLS Basics', 8), kind: 'lesson' }
const PKI = lesson('LM-004', 'PKI Basics', 4)
const HYB = lesson('LM-011', 'Hybrid Certificates', 11)

const EMPTY: SuggestionState = {
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

describe('rule 1: what the learner just read, finished or is viewing', () => {
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
      question: 'What is the lesson “TLS Basics” about?',
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
    expect(rankSuggestions(view(odd))[0].question).toBe('What is the lesson “TLS Basics” about?')
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
      'What is the lesson “TLS Basics” about?',
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
      'What is the lesson “Quantum Threats” about?',
      'What is the lesson “PKI Basics” about?',
      'What is the lesson “Hybrid Certificates” about?',
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
  it('imports nothing but the copy deck, the pure key functions and a type', () => {
    expect(imports.sort()).toEqual(['./Suggestions', './askedKey', './copy'])
  })
  it('imports no store, journey or objective code and calls no setter', () => {
    expect(source).not.toMatch(/@\/(store|hooks|services\/journey|components\/Journey)/)
    expect(source).not.toMatch(/\.setState\(|\.getState\(|useJourneyStore|\bset[A-Z]\w*\(/)
  })
})

describe('rule 1: the last answer', () => {
  const answer = {
    matched: { tag: 'GL:ml-kem', title: 'ML-KEM' },
    lesson: lesson('LM-001', 'PQC 101', 1),
  }
  it('offers the lessons that teach the record the answer matched, and the tools of its first lesson', () => {
    const got = rankSuggestions({ ...EMPTY, lastAnswer: answer })
    expect(got.slice(0, 2).map((s) => s.question)).toEqual([
      'Which lessons teach ML-KEM?',
      'Which tools go with PQC 101?',
    ])
    expect(got[0]).toMatchObject({ rule: 1, label: 'From this answer' })
    expect(got[0].basedOn).toBe('the answer you just read, ML-KEM')
    expect(got[1].basedOn).toBe('a lesson in the answer you just read, PQC 101')
  })
  it('comes before what was just finished and what is on the page', () => {
    const got = questionsOf({
      ...FULL,
      lastAnswer: answer,
    })
    expect(got.slice(0, 4)).toEqual([
      'Which lessons teach ML-KEM?',
      'Which tools go with PQC 101?',
      'Where can I practise PKI Basics?',
      'What is the lesson “TLS Basics” about?',
    ])
  })
  it('uses whichever of the two the answer has', () => {
    expect(questionsOf({ ...EMPTY, lastAnswer: { ...answer, lesson: null } })[0]).toBe(
      'Which lessons teach ML-KEM?'
    )
    expect(questionsOf({ ...EMPTY, lastAnswer: { ...answer, matched: null } })[0]).toBe(
      'Which tools go with PQC 101?'
    )
    expect(ruleOf({ ...EMPTY, lastAnswer: { matched: null, lesson: null } })).toEqual([6, 6, 6])
  })
  it('leaves out a title that is too long or is itself a question', () => {
    const long = 'x'.repeat(71)
    expect(
      ruleOf({ ...EMPTY, lastAnswer: { matched: { tag: 'LIB:a', title: long }, lesson: null } })
    ).toEqual([6, 6, 6])
    expect(
      ruleOf({
        ...EMPTY,
        lastAnswer: { matched: { tag: 'LIB:a', title: 'Why PQC?' }, lesson: null },
      })
    ).toEqual([6, 6, 6])
  })
  it('does not offer a question about the answer again once asked', () => {
    const got = questionsOf({
      ...EMPTY,
      lastAnswer: answer,
      asked: ['Which lessons teach ML-KEM?'],
    })
    expect(got[0]).toBe('Which tools go with PQC 101?')
  })
})

describe('a question asked earlier under the same objective and progress', () => {
  it('is not offered again, and the next one moves up', () => {
    const before = questionsOf(FULL)
    const after = questionsOf({ ...FULL, askedKeys: [questionKey(before[0])] })
    expect(after).not.toContain(before[0])
    expect(after[0]).toBe(before[1])
  })
  it('is matched by its key whatever the letter case or spacing', () => {
    const before = questionsOf(FULL)
    const after = questionsOf({
      ...FULL,
      askedKeys: [questionKey(`  ${before[0].toUpperCase()} `)],
    })
    expect(after).not.toContain(before[0])
  })
  it('does not hide a question whose key was not given', () => {
    expect(questionsOf({ ...FULL, askedKeys: ['00000000'] })).toEqual(questionsOf(FULL))
  })
})

describe('rule 2 with no objective in focus and several active (requirement S08)', () => {
  const choice = (title: string, next: StepRef | null, usedAt: number) => ({ title, next, usedAt })
  const review = choice('Review our TLS migration design', TLS, 200)
  const board = choice(
    'Brief the architecture board',
    { ...lesson('LM-004', 'PKI Basics', 4), kind: 'lesson' },
    100
  )
  it('resumes the objective used most recently and names the others', () => {
    const got = rankSuggestions({ ...EMPTY, choices: [board, review] }).filter((s) => s.rule === 2)
    expect(got.map((s) => s.question)).toEqual([
      'What will I learn in TLS Basics?',
      'What will I learn in PKI Basics?',
    ])
    expect(got[0]).toMatchObject({ label: 'Resume' })
    expect(got[0].basedOn).toBe(
      'your most recently used objective, Review our TLS migration design'
    )
    expect(got[1]).toMatchObject({ label: 'Other objective' })
    expect(got[1].basedOn).toBe('another objective of yours, Brief the architecture board')
  })
  it('makes the most recent one the main question', () => {
    expect(rankSuggestions({ ...EMPTY, choices: [board, review] })[0]).toMatchObject({
      rule: 2,
      label: 'Resume',
    })
  })
  it('breaks a tie in time by title, and skips an objective with no next step', () => {
    const a = choice('A goal', TLS, 1)
    const b = choice('B goal', { ...TLS, tag: 'LM-009', title: 'Other' }, 1)
    expect(
      rankSuggestions({ ...EMPTY, choices: [b, a, choice('C goal', null, 5)] })
        .filter((s) => s.rule === 2)
        .map((s) => s.question)
    ).toEqual(['What will I learn in TLS Basics?', 'What will I learn in Other?'])
  })
  it('applies to two or more only, and never next to a focused objective', () => {
    expect(ruleOf({ ...EMPTY, choices: [review] })).toEqual([6, 6, 6])
    expect(
      ruleOf({
        ...EMPTY,
        choices: [review, board],
        objective: { title: 'G', next: null, prerequisites: [], updates: [] },
      })
    ).toEqual([6, 6, 6])
  })
  it('comes before the role question and after the answer, finished and page questions', () => {
    const got = rankSuggestions({
      ...FULL,
      objective: null,
      choices: [board, review],
    })
    expect(got.map((s) => s.rule).slice(0, 5)).toEqual([1, 1, 2, 2, 5])
  })
})

describe('rules 2 and 3 for a step that is a tool', () => {
  const tool: StepRef = {
    tag: 'BT:board-pitch',
    title: 'Board Pitch Builder',
    order: Number.MAX_SAFE_INTEGER,
    kind: 'tool',
  }
  it('asks what the tool does, and offers the lesson the tool belongs to as the prerequisite', () => {
    const got = rankSuggestions({
      ...EMPTY,
      objective: { title: 'Goal', next: tool, prerequisites: [PKI], updates: [] },
    })
    expect(got[0]).toMatchObject({
      rule: 2,
      question: 'What does Board Pitch Builder do?',
      label: 'Next step',
    })
    expect(got[0].why).toContain('what the tool does')
    expect(got[1]).toMatchObject({ rule: 3, question: 'What is the lesson “PKI Basics” about?' })
    expect(got[1].basedOn).toBe('the lesson Board Pitch Builder belongs to')
  })
})

describe('rule 1: the last answer, by the link of its record', () => {
  const rel = (
    relation: 'made_by' | 'makes' | 'certifies' | 'publishes',
    title: string,
    name?: string
  ) => ({
    ...EMPTY,
    lastAnswer: { matched: { tag: 'X:1', title, relation, name }, lesson: null },
  })
  it('asks who makes a product, which products a vendor makes, what a certification covers and what a source published', () => {
    expect(questionsOf(rel('made_by', '1Password'))[0]).toBe('Who makes 1Password?')
    expect(questionsOf(rel('makes', 'Entrust Corporation'))[0]).toBe(
      'Which products does Entrust Corporation make?'
    )
    expect(questionsOf(rel('certifies', 'ACVP #A5276: Nuvoton, NCL', 'ACVP #A5276'))[0]).toBe(
      'What does ACVP #A5276 certify?'
    )
    expect(questionsOf(rel('publishes', 'IETF Datatracker'))[0]).toBe(
      'Which documents did IETF Datatracker publish?'
    )
  })
  it('comes first among the answer questions, with the record as its basis and the link as its reason', () => {
    const got = rankSuggestions(rel('made_by', '1Password'))
    expect(got[0]).toMatchObject({
      rule: 1,
      label: 'From this answer',
      basedOn: 'the answer you just read, 1Password',
    })
    expect(got[0].why).toContain('the Hub links each product to its maker')
    expect(got[1].question).toBe('Which lessons teach 1Password?')
  })
  it('is not offered for a record with no such link, or a title that cannot be asked about, and not again once asked', () => {
    expect(
      questionsOf({
        ...EMPTY,
        lastAnswer: { matched: { tag: 'GL:x', title: 'ML-KEM' }, lesson: null },
      })[0]
    ).toBe('Which lessons teach ML-KEM?')
    expect(questionsOf(rel('made_by', 'x'.repeat(71)))[0]).not.toMatch(/^Who makes/)
    expect(
      questionsOf({ ...rel('made_by', '1Password'), asked: ['who makes 1password?'] })[0]
    ).toBe('Which lessons teach 1Password?')
  })
})

describe('the lesson question reads as a title for every lesson title', () => {
  it('quotes the title, so a title that begins with "The" or holds a colon still reads correctly', () => {
    const title = 'The PQC Algorithms: How They Work and How to Choose'
    const got = rankSuggestions({
      ...EMPTY,
      objective: {
        title: 'G',
        next: null,
        prerequisites: [{ tag: 'LM-2', title, order: 1 }],
        updates: [],
      },
    })
    expect(got[0].question).toBe(`What is the lesson “${title}” about?`)
  })
})
