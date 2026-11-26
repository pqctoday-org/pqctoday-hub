// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFocusedObjective } from '@/hooks/useJourney'
import { sectionsOfLesson } from '@/services/journey/curriculum'
import { makeObjective } from '@/services/journey/fixtures'
import type { Objective } from '@/services/journey/types'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useMyWorkStore } from '@/store/useMyWorkStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { TOOL_RECORDS } from '@/data/generated/tools.generated'
import { useAssistantAskedStore } from '@/store/useAssistantAskedStore'
import { useAssistantSessionStore, type AssistantTurn } from '@/store/useAssistantSessionStore'
import {
  focusedObjectiveOf,
  lastAnswerOf,
  objectiveStateOf,
  progressKey,
  useRememberAsked,
  useSuggestions,
  viewingFor,
} from './useSuggestions'

const wrap =
  (at: string) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[at]}>{children}</MemoryRouter>
  )

const loadingTurn = (question: string): AssistantTurn => ({
  id: `t-${question}`,
  question,
  status: 'loading',
})

function suggestions(at = '/', asked: string[] = []) {
  act(() => useAssistantSessionStore.setState({ turns: asked.map(loadingTurn) }))
  return renderHook(() => useSuggestions(), { wrapper: wrap(at) }).result.current
}

const OBJECTIVE_BUILT_ON = {
  origin: 'created' as const,
  revision: 'earlier',
  prerequisites: {},
  lessons: { 'LM-008': { version: 1, sections: [], tools: {} } },
  at: 1,
}

function setLearner(opts: {
  persona?: 'architect' | null
  objective?: Objective | null
  /** Several objectives, with none in focus unless `focusOn` names one. */
  objectives?: Objective[]
  focusOn?: string
  completions?: Record<string, number>
}) {
  const list = opts.objectives ?? (opts.objective ? [opts.objective] : [])
  act(() => {
    usePersonaStore.setState({ selectedPersona: opts.persona ?? null })
    useJourneyStore.setState({
      objectives: Object.fromEntries(list.map((o) => [o.id, o])),
      order: list.map((o) => o.id),
      focus: opts.objectives
        ? opts.focusOn
          ? { architect: opts.focusOn }
          : {}
        : list[0]
          ? { [list[0].role]: list[0].id }
          : {},
      completions: Object.fromEntries(
        Object.entries(opts.completions ?? {}).map(([tag, at]) => [
          tag,
          { tag, kind: 'completed' as const, source: 'self' as const, at },
        ])
      ),
      roleSwitch: null,
    })
  })
}

beforeEach(() => {
  localStorage.clear()
  setLearner({})
  act(() => {
    useModuleStore.setState({ modules: {} })
    useMyWorkStore.setState({ comments: [] })
    useAssistantSessionStore.setState({ turns: [] })
    useAssistantAskedStore.getState().clear()
  })
})

describe('the suggestions the drawer offers, from the learner state', () => {
  it('offers the starting questions to a learner with no role, no objective and no page of the Hub', () => {
    const got = suggestions('/')
    expect(got.map((s) => s.rule)).toEqual([6, 6, 6])
  })

  it('differs for a learner on a lesson page, with and without an objective, and after a finished step', () => {
    const none = suggestions('/learn/tls-basics')
    expect(none[0]).toMatchObject({ rule: 1, question: 'What is TLS Basics about?' })

    setLearner({
      persona: 'architect',
      objective: makeObjective({ builtOn: undefined }),
      completions: { 'LM-001': 1 },
    })
    const focused = suggestions('/')
    expect(focused[0]).toMatchObject({
      rule: 2,
      question: 'What will I learn in TLS Basics?',
    })
    expect(focused.map((s) => s.rule)).toContain(3)
    expect(focused.map((s) => s.rule)).toContain(5)

    setLearner({
      persona: 'architect',
      objective: makeObjective({ builtOn: undefined }),
      completions: { 'LM-001': Date.now() - 1000 },
    })
    const justDone = suggestions('/')
    expect(justDone[0]).toMatchObject({ rule: 1, question: 'Where can I practise PQC 101?' })
    expect(justDone[1]).toMatchObject({ rule: 2 })
    expect(new Set([none[0].question, focused[0].question, justDone[0].question]).size).toBe(3)
  })

  it('offers no objective questions for a paused objective', () => {
    setLearner({
      persona: 'architect',
      objective: makeObjective({ state: 'paused', builtOn: undefined }),
    })
    expect(suggestions('/').map((s) => s.rule)).toEqual([5, 6, 6, 6])
  })

  it('offers a question about a lesson of the objective that changed since the objective was made', () => {
    setLearner({
      persona: 'architect',
      objective: makeObjective({ builtOn: OBJECTIVE_BUILT_ON }),
      completions: { 'LM-001': 1 },
    })
    const rules = suggestions('/').map((s) => s.rule)
    expect(rules).toContain(4)
    expect(suggestions('/').find((s) => s.rule === 4)?.question).toBe('What changed in TLS Basics?')
  })

  it('leaves out a question already asked', () => {
    const first = suggestions('/learn/tls-basics')[0].question
    expect(suggestions('/learn/tls-basics', [first]).map((s) => s.question)).not.toContain(first)
  })

  it('reads a lesson section from the page address', () => {
    const first = sectionsOfLesson('tls-basics')[0]
    const section = viewingFor('/learn/tls-basics', `?section=${first.id}`, null)
    expect(section).toMatchObject({
      kind: 'section',
      tag: `LM-008/s:${first.id}`,
      title: first.label,
      lessonTitle: 'TLS Basics',
    })
    expect(viewingFor('/learn/tls-basics', '', null)).toMatchObject({
      kind: 'lesson',
      tag: 'LM-008',
    })
    expect(viewingFor('/', '', null)).toBeNull()
  })

  it('reads a record page through the knowledge reader when it has loaded', () => {
    const record = { id: 'CMP:CNSA-2', label: 'CNSA 2.0', link: '/compliance?framework=CNSA-2' }
    const reader = {
      get: (tag: string) => (tag === record.id ? (record as never) : undefined),
      recordAt: (address: string) => (address === record.link ? (record as never) : undefined),
    }
    expect(viewingFor('/compliance', '?framework=CNSA-2', reader)).toEqual({
      tag: 'CMP:CNSA-2',
      title: 'CNSA 2.0',
      kind: 'record',
    })
  })
})

describe("the ranker's inputs are read, never written", () => {
  /** Every value of the stores that are not functions: the learner's data. */
  const dataOf = () =>
    JSON.stringify(
      [useJourneyStore, useModuleStore, useMyWorkStore, usePersonaStore].map((s) =>
        Object.fromEntries(Object.entries(s.getState()).filter(([, v]) => typeof v !== 'function'))
      )
    )

  it('leaves the journey, module, work and role data equal and calls no setter, in every learner state', () => {
    const stores = [useJourneyStore, useModuleStore, useMyWorkStore, usePersonaStore]
    const states = [
      {},
      { persona: 'architect' as const, objective: makeObjective({ builtOn: undefined }) },
      {
        persona: 'architect' as const,
        objective: makeObjective({ builtOn: OBJECTIVE_BUILT_ON }),
        completions: { 'LM-001': Date.now() - 1000 },
      },
      { persona: 'architect' as const, objective: makeObjective({ state: 'completed' }) },
    ]
    for (const learner of states) {
      setLearner(learner)
      const spies: ReturnType<typeof vi.fn>[] = []
      for (const store of stores) {
        for (const [key, value] of Object.entries(store.getState())) {
          if (typeof value !== 'function') continue
          const spy = vi.fn(value as (...a: unknown[]) => unknown)
          spies.push(spy)
          ;(store as { setState: (p: object) => void }).setState({ [key]: spy })
        }
      }
      const before = dataOf()
      act(() => {
        suggestions('/learn/tls-basics')
        suggestions('/')
      })
      expect(dataOf()).toBe(before)
      expect(spies.filter((s) => s.mock.calls.length > 0)).toHaveLength(0)
    }
  })

  it('chooses the focused objective the way the journey hook does', () => {
    const a = makeObjective({ id: 'a', goal: 'A', builtOn: OBJECTIVE_BUILT_ON })
    const b = makeObjective({ id: 'b', goal: 'B', builtOn: OBJECTIVE_BUILT_ON })
    const paused = makeObjective({ id: 'p', state: 'paused', builtOn: OBJECTIVE_BUILT_ON })
    const other = makeObjective({ id: 'o', role: 'executive', builtOn: OBJECTIVE_BUILT_ON })
    const cases: { objectives: Objective[]; focus: Record<string, string | null> }[] = [
      { objectives: [], focus: {} },
      { objectives: [a, b], focus: { architect: 'b' } },
      { objectives: [a, b], focus: {} },
      { objectives: [paused, b], focus: {} },
      { objectives: [paused], focus: {} },
      { objectives: [a, other], focus: { architect: 'missing' } },
    ]
    for (const c of cases) {
      act(() => {
        usePersonaStore.setState({ selectedPersona: 'architect' })
        useJourneyStore.setState({
          objectives: Object.fromEntries(c.objectives.map((o) => [o.id, o])),
          order: c.objectives.map((o) => o.id),
          focus: c.focus,
        })
      })
      const state = useJourneyStore.getState()
      const mine = focusedObjectiveOf(state.objectives, state.order, state.focus, 'architect')
      const theirs = renderHook(() => useFocusedObjective()).result.current
      expect(mine?.id ?? null).toBe(theirs?.id ?? null)
    }
  })
})

const businessTool = TOOL_RECORDS.find((t) => t.kind === 'business')!
const stepOf = (
  id: string,
  n: number,
  kind: 'module' | 'business-tool' | 'self-assessed',
  tag: string
) => ({
  id,
  position: n,
  kind,
  resourceTag: tag,
  required: true,
  origin: { type: 'match' as const },
})

describe('a question asked earlier is not offered again while the objective and progress are unchanged', () => {
  const asking = () => {
    const turn = (question: string): AssistantTurn =>
      ({ id: question, question, status: 'done', answer: { state: 'not-held' } }) as never
    return turn
  }
  const setTurns = (questions: string[]) =>
    act(() => useAssistantSessionStore.setState({ turns: questions.map(asking()) }))

  it('remembers a question after the conversation is gone, and offers it again when the progress changes', () => {
    setLearner({ persona: 'architect', objective: makeObjective({ builtOn: undefined }) })
    // the role question stays a candidate when a lesson is finished, so it shows the memory and nothing else
    const asked = suggestions('/').find((s) => s.rule === 5)!.question
    setTurns([asked])
    renderHook(() => useRememberAsked(), { wrapper: wrap('/') })
    // a new conversation: the turns are gone
    setTurns([])
    expect(suggestions('/').map((s) => s.question)).not.toContain(asked)
    // the learner finishes a lesson: the same state no longer holds, so the question is offered again
    setLearner({
      persona: 'architect',
      objective: makeObjective({ builtOn: undefined }),
      completions: { 'LM-001': 1 },
    })
    expect(suggestions('/').map((s) => s.question)).toContain(asked)
  })

  it('offers it again when the focused objective changes', () => {
    setLearner({ persona: 'architect', objective: makeObjective({ builtOn: undefined }) })
    const main = suggestions('/')[0].question
    setTurns([main])
    renderHook(() => useRememberAsked(), { wrapper: wrap('/') })
    setTurns([])
    expect(suggestions('/').map((s) => s.question)).not.toContain(main)
    setLearner({
      persona: 'architect',
      objective: makeObjective({ id: 'other', goal: 'Another goal', builtOn: undefined }),
    })
    expect(suggestions('/').map((s) => s.question)).toContain(main)
  })

  it('is remembered across a reload: only hashes are stored on the device', async () => {
    setLearner({ persona: 'architect' })
    const main = suggestions('/')[0].question
    setTurns([main])
    renderHook(() => useRememberAsked(), { wrapper: wrap('/') })
    const raw = localStorage.getItem('pqc-assistant-asked')!
    expect(raw).not.toBeNull()
    expect(raw).not.toContain(main)
    expect(JSON.parse(raw).state.entries[0]).toEqual({
      q: expect.stringMatching(/^[0-9a-f]{8}$/),
      s: expect.stringMatching(/^[0-9a-f]{8}$/),
    })
    // a reload: the page's memory is gone and the device's copy is read again
    act(() => useAssistantAskedStore.setState({ entries: [] }))
    localStorage.setItem('pqc-assistant-asked', raw)
    await act(async () => {
      await useAssistantAskedStore.persist.rehydrate()
    })
    setTurns([])
    expect(suggestions('/').map((s) => s.question)).not.toContain(main)
  })

  it('reads a damaged stored value as an empty list', async () => {
    localStorage.setItem(
      'pqc-assistant-asked',
      JSON.stringify({
        state: { entries: [{ q: 'x' }, 7, { q: 'zzzzzzzz', s: '00000000' }] },
        version: 1,
      })
    )
    await act(async () => {
      await useAssistantAskedStore.persist.rehydrate()
    })
    expect(useAssistantAskedStore.getState().entries).toEqual([])
  })

  it('writes only to its own store: the journey, module, work and role data stay as they are', () => {
    setLearner({ persona: 'architect', objective: makeObjective({ builtOn: undefined }) })
    const stores = [useJourneyStore, useModuleStore, useMyWorkStore, usePersonaStore]
    const dataOf = () =>
      JSON.stringify(
        stores.map((s) =>
          Object.fromEntries(
            Object.entries(s.getState()).filter(([, v]) => typeof v !== 'function')
          )
        )
      )
    const spies: ReturnType<typeof vi.fn>[] = []
    for (const store of stores) {
      for (const [key, value] of Object.entries(store.getState())) {
        if (typeof value !== 'function') continue
        const spy = vi.fn(value as (...a: unknown[]) => unknown)
        spies.push(spy)
        ;(store as { setState: (p: object) => void }).setState({ [key]: spy })
      }
    }
    setTurns(['What is TLS Basics about?'])
    const before = dataOf()
    renderHook(() => useRememberAsked(), { wrapper: wrap('/') })
    expect(dataOf()).toBe(before)
    expect(spies.filter((s) => s.mock.calls.length > 0)).toHaveLength(0)
    expect(useAssistantAskedStore.getState().entries).toHaveLength(1)
  })

  it('has a key that changes with the objective, its steps, the role and the lessons finished', () => {
    const o = makeObjective({ builtOn: undefined })
    const base = progressKey('architect', o, [], [])
    expect(progressKey('architect', o, [], [])).toBe(base)
    expect(progressKey('executive', o, [], [])).not.toBe(base)
    expect(progressKey('architect', null, [], [])).not.toBe(base)
    expect(progressKey('architect', o, [], ['LM-001'])).not.toBe(base)
    expect(progressKey('architect', { ...o, state: 'paused' }, [], [])).not.toBe(base)
    expect(progressKey('architect', { ...o, steps: o.steps.slice(1) }, [], [])).not.toBe(base)
  })
})

describe('the last answer', () => {
  const done = (answer: object): AssistantTurn =>
    ({ id: 'a', question: 'Q?', status: 'done', answer }) as never
  const row = (tag: string, title = tag) => ({ tag, title })

  it('gives the record of a direct answer or the closest source, and the first lesson of the Learn rows', () => {
    const turn = done({
      state: 'resources',
      source: { label: 'Closest source', kind: 'Glossary term', title: 'ML-KEM', tag: 'GL:ml-kem' },
      groups: [
        { name: 'References', rows: [row('GL:ml-kem')], more: [] },
        { name: 'Learn', rows: [row('KAT:KAT-1'), row('LM-001/s:x'), row('LM-008')], more: [] },
      ],
    })
    expect(lastAnswerOf([turn])).toEqual({
      matched: { tag: 'GL:ml-kem', title: 'ML-KEM' },
      lesson: expect.objectContaining({ tag: 'LM-008', title: 'TLS Basics' }),
    })
  })
  it('gives the record of a bare name, and nothing from a state with no rows', () => {
    expect(
      lastAnswerOf([
        done({
          state: 'name',
          nameCard: { tag: 'ALG:ML-KEM', title: 'ML-KEM (FIPS 203)' },
          groups: [],
        }),
      ])?.matched
    ).toEqual({ tag: 'ALG:ML-KEM', title: 'ML-KEM (FIPS 203)' })
    expect(lastAnswerOf([done({ state: 'not-held' })])).toBeNull()
    expect(lastAnswerOf([loadingTurn('x')])).toBeNull()
    expect(lastAnswerOf([])).toBeNull()
  })
  it('does not build on a page or a lesson as the matched record', () => {
    const turn = done({
      state: 'resources',
      source: {
        label: 'Closest source',
        kind: 'Page',
        title: 'Compliance',
        tag: 'PAGE:compliance',
      },
      groups: [],
    })
    expect(lastAnswerOf([turn])).toEqual({ matched: null, lesson: null })
  })
  it('makes the main suggestion about the last answer, ahead of the page and the objective', () => {
    setLearner({ persona: 'architect', objective: makeObjective({ builtOn: undefined }) })
    act(() =>
      useAssistantSessionStore.setState({
        turns: [
          done({
            state: 'resources',
            source: {
              label: 'Closest source',
              kind: 'Glossary term',
              title: 'ML-KEM',
              tag: 'GL:ml-kem',
            },
            groups: [{ name: 'Learn', rows: [row('LM-001')], more: [] }],
          }),
        ],
      })
    )
    const got = renderHook(() => useSuggestions(), { wrapper: wrap('/learn/tls-basics') }).result
      .current
    expect(got.slice(0, 3).map((s) => s.question)).toEqual([
      'Which lessons teach ML-KEM?',
      'Which tools go with PQC 101?',
      'What is TLS Basics about?',
    ])
  })
})

describe('no objective in focus with several active (requirement S08)', () => {
  const a = makeObjective({
    id: 'a',
    goal: 'Review our TLS migration design',
    builtOn: undefined,
    updatedAt: 100,
  })
  const b = makeObjective({
    id: 'b',
    goal: 'Brief the architecture board',
    builtOn: undefined,
    updatedAt: 500,
    steps: [stepOf('b-1', 1, 'module', 'LM-004'), stepOf('b-2', 2, 'self-assessed', 'b/outcome')],
  })
  it('resumes the most recently used objective, and names the other', () => {
    setLearner({ persona: 'architect', objectives: [a, b] })
    const got = suggestions('/')
    expect(got[0]).toMatchObject({
      rule: 2,
      label: 'Resume',
      question: 'What will I learn in Standards, Certification & Compliance Bodies?',
    })
    expect(got[0].basedOn).toBe('your most recently used objective, Brief the architecture board')
    expect(got[1]).toMatchObject({
      rule: 2,
      label: 'Other objective',
      question: 'What will I learn in PQC 101?',
    })
  })
  it('behaves as before once one is in focus, or when only one is active', () => {
    setLearner({ persona: 'architect', objectives: [a, b], focusOn: 'a' })
    expect(suggestions('/')[0]).toMatchObject({
      rule: 2,
      label: 'Next step',
      question: 'What will I learn in PQC 101?',
    })
    setLearner({ persona: 'architect', objectives: [a, { ...b, state: 'paused' }] })
    expect(suggestions('/')[0]).toMatchObject({ rule: 2, label: 'Next step' })
  })
  it('is told apart from a focused objective by the state function', () => {
    const state = useJourneyStore.getState
    setLearner({ persona: 'architect', objectives: [a, b] })
    expect(
      objectiveStateOf(state().objectives, state().order, state().focus, 'architect')
    ).toMatchObject({
      objective: null,
    })
    expect(
      objectiveStateOf(state().objectives, state().order, { architect: 'a' }, 'architect').objective
        ?.id
    ).toBe('a')
  })
})

describe('rules 2 and 3 for a next step that is not a lesson', () => {
  it('asks what a business tool does, and offers the lesson the tool belongs to', () => {
    const home = TOOL_RECORDS.find((t) => t.kind === 'business' && t.module)
    expect(home).toBeDefined()
    const o = makeObjective({
      builtOn: undefined,
      steps: [
        stepOf('s1', 1, 'business-tool', `BT:${home!.toolId}`),
        stepOf('s2', 2, 'self-assessed', 'obj-t/outcome'),
      ],
    })
    setLearner({ persona: 'architect', objective: o })
    const got = suggestions('/')
    expect(got[0]).toMatchObject({ rule: 2, question: `What does ${home!.name} do?` })
    expect(got.filter((s) => s.rule === 3)).toHaveLength(1)
    // the tool is found by its bare id too
    const bare = makeObjective({
      builtOn: undefined,
      steps: [stepOf('s1', 1, 'business-tool', businessTool.toolId)],
    })
    setLearner({ persona: 'architect', objective: bare })
    expect(suggestions('/')[0].question).toBe(`What does ${businessTool.name} do?`)
  })
  it('offers nothing about a step that has nothing in the catalog to ask about', () => {
    for (const step of [
      stepOf('s1', 1, 'self-assessed', 'obj-t/outcome'),
      stepOf('s1', 1, 'business-tool', 'BT:not-a-tool'),
      stepOf('s1', 1, 'module', 'LM-9999'),
    ]) {
      setLearner({
        persona: 'architect',
        objective: makeObjective({ builtOn: undefined, steps: [step] }),
      })
      expect(suggestions('/').filter((s) => s.rule === 2 || s.rule === 3)).toEqual([])
    }
  })
})

describe('what counts as just finished', () => {
  it('is a lesson the learner recorded a moment ago, by its completion stamp', () => {
    setLearner({ persona: 'architect', completions: { 'LM-004': Date.now() - 1000 } })
    expect(suggestions('/')[0]).toMatchObject({ rule: 1, label: 'Recap' })
  })
  it('is not a lesson the Hub shows as completed that was opened again a moment ago', () => {
    setLearner({ persona: 'architect' })
    act(() =>
      useModuleStore.setState({
        modules: {
          'standards-bodies': {
            status: 'completed',
            lastVisited: Date.now() - 1000,
            timeSpent: 0,
            completedSteps: [],
            quizScores: {},
          },
        },
      })
    )
    expect(suggestions('/').map((s) => s.label)).not.toContain('Recap')
  })
  it('is not a lesson recorded long ago', () => {
    setLearner({ persona: 'architect', completions: { 'LM-004': Date.now() - 3 * 60 * 60 * 1000 } })
    expect(suggestions('/').map((s) => s.label)).not.toContain('Recap')
  })
})
