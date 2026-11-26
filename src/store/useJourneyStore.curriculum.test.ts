// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import {
  JOURNEY_STORE_KEY,
  JOURNEY_STORE_VERSION,
  migrateJourneyState,
  useJourneyStore,
} from './useJourneyStore'
import { buildPreview } from '../services/journey/objectiveBuilder'
import { CURRICULUM_REVISION, buildBuiltOn } from '../services/journey/curriculum'
import {
  barSteps,
  nowStep,
  requiredProgress,
  stepDone,
  stepStatuses,
} from '../services/journey/stepRules'
import type { Objective, Step } from '../services/journey/types'

const GOAL = 'Review our TLS migration design'
const preview = () =>
  buildPreview({ goal: GOAL, persona: 'architect', existing: [], isDone: () => false })

beforeEach(() => {
  localStorage.clear()
  useJourneyStore.setState({
    objectives: {},
    order: [],
    focus: {},
    completions: {},
    roleSwitch: null,
  })
})

const make = () => {
  const { id } = useJourneyStore.getState().createObjective(preview())
  return id
}
const get = (id: string) => useJourneyStore.getState().objectives[id]

const step = (tag: string, n: number): Step => ({
  id: `old-s${n}`,
  position: n,
  kind: 'module',
  resourceTag: tag,
  required: true,
  origin: { type: 'match' },
})
const oldObjective = (extra: Partial<Objective> = {}): Objective => ({
  id: 'old',
  role: 'architect',
  goal: 'An objective made before the record existed',
  state: 'active',
  steps: [step('LM-032', 1), step('LM-001', 2)],
  checkpoint: { path: [], stepId: null },
  createdAt: 1,
  updatedAt: 1,
  ...extra,
})

describe('what an objective is built on', () => {
  it('is recorded when the objective is created: the revision, each lesson and the prerequisites used', () => {
    const o = get(make())
    expect(o.builtOn?.origin).toBe('created')
    expect(o.builtOn?.revision).toBe(CURRICULUM_REVISION)
    expect(CURRICULUM_REVISION).toMatch(/^learn_modules_\d{8}_r\d+\.csv \+ tools_\d{8}_r\d+\.csv$/)
    const lessonSteps = o.steps.filter((s) => s.kind === 'module').map((s) => s.resourceTag)
    expect(Object.keys(o.builtOn!.lessons).sort()).toEqual([...lessonSteps].sort())
    for (const tag of lessonSteps) {
      expect(o.builtOn!.lessons[tag].version).toBeGreaterThanOrEqual(1)
      expect(Array.isArray(o.builtOn!.prerequisites[tag])).toBe(true)
    }
  })

  it('is written to the device with the objective', () => {
    const id = make()
    const raw = JSON.parse(localStorage.getItem(JOURNEY_STORE_KEY)!)
    expect(raw.version).toBe(JOURNEY_STORE_VERSION)
    expect(raw.state.objectives[id].builtOn.revision).toBe(CURRICULUM_REVISION)
  })

  it('is recorded once: an objective that has it keeps it', () => {
    const id = make()
    const first = get(id).builtOn!
    useJourneyStore.getState().recordBuiltOn(id, buildBuiltOn([], 'first-seen', 99))
    expect(get(id).builtOn).toEqual(first)
  })
})

describe('the store migration (version 1 to 2)', () => {
  it('is a new version', () => {
    expect(JOURNEY_STORE_VERSION).toBe(2)
  })

  it('keeps a version 1 objective exactly as it was: no revision is invented, nothing is wiped', () => {
    const v1 = {
      objectives: { old: oldObjective() },
      order: ['old'],
      focus: { architect: 'old' },
      completions: { 'LM-032': { tag: 'LM-032', kind: 'completed', source: 'self', at: 5 } },
    }
    const out = migrateJourneyState(v1, 1)
    expect(out).toEqual(v1)
    expect(out.objectives.old.builtOn).toBeUndefined()
    expect(out.completions['LM-032'].at).toBe(5)
  })

  it('keeps a valid record and drops a damaged one without touching the rest of the objective', () => {
    const good = buildBuiltOn(oldObjective().steps, 'created', 3)
    const kept = migrateJourneyState(
      { objectives: { old: oldObjective({ builtOn: good, acknowledged: ['x'] }) }, order: ['old'] },
      2
    )
    expect(kept.objectives.old.builtOn).toEqual(good)
    expect(kept.objectives.old.acknowledged).toEqual(['x'])

    const damaged = migrateJourneyState(
      {
        objectives: {
          old: {
            ...oldObjective({ acknowledged: ['x', 7] as unknown as string[] }),
            builtOn: { origin: 'created', revision: 5 },
          },
        },
        order: ['old'],
      },
      2
    )
    expect(damaged.objectives.old.builtOn).toBeUndefined()
    expect(damaged.objectives.old.acknowledged).toEqual(['x'])
    expect(damaged.objectives.old.goal).toBe('An objective made before the record existed')
    expect(damaged.objectives.old.steps).toHaveLength(2)
  })

  it('is stable when run twice', () => {
    const state = {
      objectives: { old: oldObjective() },
      order: ['old'],
      focus: {},
      completions: {},
    }
    expect(migrateJourneyState(migrateJourneyState(state, 1), 2)).toEqual(state)
  })

  it('reads a version 1 value stored on the device and keeps its objectives', async () => {
    localStorage.setItem(
      JOURNEY_STORE_KEY,
      JSON.stringify({
        version: 1,
        state: { objectives: { old: oldObjective() }, order: ['old'], focus: {}, completions: {} },
      })
    )
    await useJourneyStore.persist.rehydrate()
    expect(Object.keys(useJourneyStore.getState().objectives)).toEqual(['old'])
    expect(get('old').builtOn).toBeUndefined()
  })
})

describe('answering a change', () => {
  it('marks a change seen once, however often it is pressed', () => {
    const id = make()
    const s = useJourneyStore.getState()
    s.acknowledgeChange(id, 'new-section:LM-008:x')
    s.acknowledgeChange(id, 'new-section:LM-008:x')
    expect(get(id).acknowledged).toEqual(['new-section:LM-008:x'])
  })
})

describe('adding a step the curriculum now requires (the learner’s own action)', () => {
  it('puts the lesson before the step that needs it, as a required take-first step, and leaves the rest', () => {
    const id = make()
    const before = get(id)
    const target = barSteps(before).find((s) => s.kind === 'module' && s.resourceTag !== 'LM-001')!
    const neededTag = 'LM-001'
    // The objective had been built without LM-001: take it out of the steps to stand for that.
    useJourneyStore.setState((st) => ({
      objectives: {
        ...st.objectives,
        [id]: { ...before, steps: before.steps.filter((s) => s.resourceTag !== neededTag) },
      },
    }))
    const count = get(id).steps.length
    expect(useJourneyStore.getState().addRequiredStep(id, neededTag, target.resourceTag)).toBe(true)
    const after = get(id)
    expect(after.steps).toHaveLength(count + 1)
    const order = barSteps(after).map((s) => s.resourceTag)
    expect(order.indexOf(neededTag)).toBe(order.indexOf(target.resourceTag) - 1)
    const added = after.steps.find((s) => s.resourceTag === neededTag)!
    expect(added.required).toBe(true)
    expect(added.origin).toEqual({ type: 'take-first', for: target.resourceTag })
    expect(new Set(after.steps.map((s) => s.id)).size).toBe(after.steps.length)
    // The last step is still the self-assessed one, and a second press adds nothing.
    expect(barSteps(after).at(-1)!.kind).toBe('self-assessed')
    expect(useJourneyStore.getState().addRequiredStep(id, neededTag, target.resourceTag)).toBe(
      false
    )
  })

  it('reopens a completed objective only when asked, and keeps its completion evidence', () => {
    const id = make()
    useJourneyStore.setState((st) => ({
      objectives: {
        ...st.objectives,
        [id]: {
          ...st.objectives[id],
          state: 'completed',
          completedAt: 1234,
          steps: st.objectives[id].steps.filter((s) => s.resourceTag !== 'LM-001'),
        },
      },
      completions: { 'LM-008': { tag: 'LM-008', kind: 'completed', source: 'self', at: 7 } },
    }))
    const target = barSteps(get(id)).find((s) => s.kind === 'module')!.resourceTag
    expect(useJourneyStore.getState().addRequiredStep(id, 'LM-001', target)).toBe(true)
    expect(get(id).state).toBe('completed')
    // A second lesson, this time with the explicit reopen.
    useJourneyStore.setState((st) => ({
      objectives: {
        ...st.objectives,
        [id]: {
          ...st.objectives[id],
          steps: st.objectives[id].steps.filter((s) => s.resourceTag !== 'LM-001'),
        },
      },
    }))
    expect(useJourneyStore.getState().addRequiredStep(id, 'LM-001', target, { reopen: true })).toBe(
      true
    )
    expect(get(id).state).toBe('active')
    expect(useJourneyStore.getState().completions['LM-008'].at).toBe(7)
  })
})

describe('swapping a retired step (the learner’s own action)', () => {
  it('keeps the step’s place and id, remembers the retired tag, and keeps the completion', () => {
    useJourneyStore.setState({
      objectives: { old: oldObjective() },
      order: ['old'],
      focus: {},
      completions: { 'LM-032': { tag: 'LM-032', kind: 'completed', source: 'self', at: 5 } },
    })
    expect(useJourneyStore.getState().swapRetiredStep('old', 'old-s1', 'LM-074')).toBe(true)
    const o = get('old')
    const swapped = o.steps.find((s) => s.id === 'old-s1')!
    expect(swapped.resourceTag).toBe('LM-074')
    expect(swapped.formerTags).toEqual(['LM-032'])
    expect(swapped.position).toBe(1)
    expect(o.steps).toHaveLength(2)
    expect(useJourneyStore.getState().completions['LM-032'].at).toBe(5)
  })

  it('counts the completed retired step as done after the swap: progress, Now and the finish check agree', () => {
    useJourneyStore.setState({
      objectives: { old: oldObjective() },
      order: ['old'],
      focus: {},
      completions: { 'LM-032': { tag: 'LM-032', kind: 'completed', source: 'self', at: 5 } },
    })
    const isDone = (t: string) => t in useJourneyStore.getState().completions
    const before = requiredProgress(get('old'), isDone)
    expect(useJourneyStore.getState().swapRetiredStep('old', 'old-s1', 'LM-074')).toBe(true)
    const o = get('old')
    expect(requiredProgress(o, isDone)).toEqual(before)
    expect(before.done).toBe(1)
    expect(stepDone(o.steps[0], isDone)).toBe(true)
    expect(stepStatuses(o, isDone).get('old-s1')).toBe('completed')
    expect(nowStep(o, isDone)?.resourceTag).toBe('LM-001')
    // Marking the swapped step complete is not needed, and is not offered a second time.
    expect(useJourneyStore.getState().markStepComplete('old', 'old-s1')).toBe(false)
  })

  it('reopening a completed objective by the swap leaves the replaced step done', () => {
    useJourneyStore.setState({
      objectives: { old: oldObjective({ state: 'completed', completedAt: 9 }) },
      order: ['old'],
      focus: {},
      completions: { 'LM-032': { tag: 'LM-032', kind: 'completed', source: 'self', at: 5 } },
    })
    expect(
      useJourneyStore.getState().swapRetiredStep('old', 'old-s1', 'LM-074', { reopen: true })
    ).toBe(true)
    const isDone = (t: string) => t in useJourneyStore.getState().completions
    expect(get('old').state).toBe('active')
    expect(requiredProgress(get('old'), isDone).done).toBe(1)
  })

  it('refuses when the objective already holds the replacement, and changes nothing', () => {
    useJourneyStore.setState({
      objectives: { old: oldObjective({ steps: [step('LM-032', 1), step('LM-074', 2)] }) },
      order: ['old'],
    })
    expect(useJourneyStore.getState().swapRetiredStep('old', 'old-s1', 'LM-074')).toBe(false)
    expect(get('old').steps.map((s) => s.resourceTag)).toEqual(['LM-032', 'LM-074'])
  })
})
