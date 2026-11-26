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
import { focusedObjectiveOf, useSuggestions, viewingFor } from './useSuggestions'

const wrap =
  (at: string) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[at]}>{children}</MemoryRouter>
  )

function suggestions(at = '/', asked: string[] = []) {
  return renderHook(() => useSuggestions(asked), { wrapper: wrap(at) }).result.current
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
  completions?: Record<string, number>
}) {
  const o = opts.objective ?? null
  act(() => {
    usePersonaStore.setState({ selectedPersona: opts.persona ?? null })
    useJourneyStore.setState({
      objectives: o ? { [o.id]: o } : {},
      order: o ? [o.id] : [],
      focus: o ? { [o.role]: o.id } : {},
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
