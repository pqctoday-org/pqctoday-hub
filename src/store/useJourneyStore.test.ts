// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  JOURNEY_STORE_KEY,
  JOURNEY_STORE_VERSION,
  migrateJourneyState,
  useJourneyStore,
} from './useJourneyStore'
import { buildPreview } from '../services/journey/objectiveBuilder'
import { requiredProgress, completeCheck } from '../services/journey/stepRules'

const GOAL_A = 'Review our TLS migration design'
const GOAL_B = 'Brief the board on quantum risk'

function preview(goal: string, persona: 'architect' | 'executive' | null = 'architect') {
  return buildPreview({ goal, persona, existing: [], isDone: () => false })
}
const done = () => (t: string) => t in useJourneyStore.getState().completions

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

describe('objective lifecycle (handoff 5.1)', () => {
  it('creates an objective in focus, and the preview and the saved objective show the same outcome (A02)', () => {
    const p = preview(GOAL_A)
    const { id, created } = useJourneyStore.getState().createObjective(p)
    expect(created).toBe(true)
    const o = useJourneyStore.getState().objectives[id]
    expect(o.state).toBe('active')
    expect(useJourneyStore.getState().focus.architect).toBe(id)
    expect(
      o.steps
        .filter((s) => s.required)
        .slice(0, -1)
        .map((s) => s.resourceTag)
    ).toEqual(p.steps.filter((s) => s.required).map((s) => s.tag))
    expect(o.steps.filter((s) => s.required && s.kind === 'module').map((s) => s.origin)).toEqual(
      p.steps.filter((s) => s.required).map((s) => s.origin)
    )
    expect(o.checkpoint.stepId).toBe(o.steps[0].id)
  })

  it('adds nothing when the same objective is saved twice (A04, J08), unless asked to', () => {
    const s = useJourneyStore.getState()
    const a = s.createObjective(preview(GOAL_A))
    const b = s.createObjective(preview(GOAL_A))
    expect(b).toEqual({ id: a.id, created: false })
    expect(useJourneyStore.getState().order).toHaveLength(1)
    const c = s.createObjective(preview(GOAL_A), { allowDuplicate: true })
    expect(c.created).toBe(true)
    expect(c.id).not.toBe(a.id)
    expect(useJourneyStore.getState().order).toHaveLength(2)
  })

  it('creates a new objective when the same goal was completed before, instead of opening the completed one', () => {
    const s = useJourneyStore.getState()
    const a = s.createObjective(preview(GOAL_A))
    useJourneyStore.setState((st) => ({
      objectives: {
        ...st.objectives,
        [a.id]: { ...st.objectives[a.id], state: 'completed', completedAt: 5 },
      },
    }))
    const again = useJourneyStore.getState().createObjective(preview(GOAL_A))
    expect(again.created).toBe(true)
    expect(again.id).not.toBe(a.id)
    const st = useJourneyStore.getState()
    expect(st.objectives[a.id].state).toBe('completed')
    expect(st.objectives[again.id].state).toBe('active')
    expect(st.focus.architect).toBe(again.id)
    expect(st.order).toHaveLength(2)
  })

  it("keeps each role's own objectives and focus", () => {
    const s = useJourneyStore.getState()
    const a = s.createObjective(preview(GOAL_A, 'architect'))
    const e = s.createObjective(preview(GOAL_B, 'executive'))
    const st = useJourneyStore.getState()
    expect(st.focus.architect).toBe(a.id)
    expect(st.focus.executive).toBe(e.id)
    expect(st.objectives[a.id].role).toBe('architect')
  })

  it('pauses (focus moves to the next active one, or stays on the paused one), resumes and reopens', () => {
    const s = useJourneyStore.getState()
    const a = s.createObjective(preview(GOAL_A))
    const b = s.createObjective(preview(GOAL_B))
    expect(useJourneyStore.getState().focus.architect).toBe(b.id)
    s.pauseObjective(b.id)
    expect(useJourneyStore.getState().objectives[b.id].state).toBe('paused')
    expect(useJourneyStore.getState().focus.architect).toBe(a.id)
    s.pauseObjective(a.id)
    expect(useJourneyStore.getState().focus.architect).toBe(a.id)
    s.resumeObjective(b.id)
    expect(useJourneyStore.getState().objectives[b.id].state).toBe('active')
    expect(useJourneyStore.getState().focus.architect).toBe(b.id)
    s.pauseObjective(b.id)
    s.pauseObjective(b.id)
    expect(useJourneyStore.getState().objectives[b.id].state).toBe('paused')
  })

  it('marks a step complete once, and refuses it on a paused objective and on the self-assessed step', () => {
    const s = useJourneyStore.getState()
    const { id } = s.createObjective(preview(GOAL_A))
    const o = () => useJourneyStore.getState().objectives[id]
    const first = o().steps[0]
    expect(s.markStepComplete(id, first.id, 18, 100)).toBe(true)
    expect(s.markStepComplete(id, first.id)).toBe(false)
    expect(useJourneyStore.getState().completions[first.resourceTag]).toMatchObject({
      at: 100,
      revision: 18,
    })
    const last = o().steps.find((x) => x.kind === 'self-assessed')!
    expect(s.markStepComplete(id, last.id)).toBe(false)
    s.pauseObjective(id)
    expect(s.markStepComplete(id, o().steps[1].id)).toBe(false)
  })

  it('undoes a mark the learner made', () => {
    const s = useJourneyStore.getState()
    const { id } = s.createObjective(preview(GOAL_A))
    const step = useJourneyStore.getState().objectives[id].steps[0]
    s.markStepComplete(id, step.id)
    s.unmarkStep(id, step.id)
    expect(step.resourceTag in useJourneyStore.getState().completions).toBe(false)
  })

  it('completes only when allowed and confirmed, and reopening keeps shared evidence credited (A08)', () => {
    const s = useJourneyStore.getState()
    const review = s.createObjective(preview(GOAL_A))
    const briefing = s.createObjective(preview(GOAL_B, 'architect'))
    const steps = () => useJourneyStore.getState().objectives[review.id].steps
    expect(s.completeObjective(review.id, true)).toBe(false)
    for (const step of steps().filter((x) => x.required && x.kind === 'module')) {
      s.markStepComplete(review.id, step.id)
    }
    expect(s.completeObjective(review.id, false)).toBe(false)
    expect(s.completeObjective(review.id, true)).toBe(true)
    expect(useJourneyStore.getState().objectives[review.id].state).toBe('completed')
    // the briefing is untouched
    expect(useJourneyStore.getState().objectives[briefing.id].state).toBe('active')
    const shared = steps().find((x) => x.kind === 'module')!.resourceTag
    s.reopenObjective(review.id)
    const st = useJourneyStore.getState()
    expect(st.objectives[review.id].state).toBe('active')
    expect(st.objectives[review.id].completedAt).toBeUndefined()
    expect(shared in st.completions).toBe(true)
    const own = st.objectives[review.id].steps.find((x) => x.kind === 'self-assessed')!
    expect(own.resourceTag in st.completions).toBe(false)
  })

  it('credits one completion in every objective that holds the tag, and defers a step in one only (A03)', () => {
    const s = useJourneyStore.getState()
    const a = s.createObjective(preview(GOAL_A))
    const b = s.createObjective(preview('Secure boot and firmware signing for our devices'))
    const shared = useJourneyStore
      .getState()
      .objectives[a.id].steps.find((x) =>
        useJourneyStore
          .getState()
          .objectives[b.id].steps.some(
            (y) => y.resourceTag === x.resourceTag && x.kind === 'module'
          )
      )
    expect(shared).toBeDefined()
    s.markStepComplete(a.id, shared!.id)
    const st = useJourneyStore.getState()
    expect(requiredProgress(st.objectives[a.id], done()).done).toBeGreaterThan(0)
    expect(requiredProgress(st.objectives[b.id], done()).done).toBeGreaterThan(0)
    const inB = st.objectives[b.id].steps.find((y) => y.resourceTag === shared!.resourceTag)!
    const notShared = st.objectives[b.id].steps.find(
      (y) => y.kind === 'module' && y.resourceTag !== shared!.resourceTag
    )!
    s.deferStep(b.id, notShared.id)
    const after = useJourneyStore.getState()
    expect(after.objectives[b.id].steps.find((y) => y.id === notShared.id)!.deferred).toBe(true)
    expect(after.objectives[a.id].steps.some((y) => y.deferred)).toBe(false)
    // both final deliverables stay open
    expect(completeCheck(after.objectives[a.id], done()).confirmStep).not.toBeNull()
    expect(inB.resourceTag in after.completions).toBe(true)
    s.restoreStep(b.id, notShared.id)
    expect(useJourneyStore.getState().objectives[b.id].steps.some((y) => y.deferred)).toBe(false)
  })

  it('refuses to defer the self-assessed last step', () => {
    const s = useJourneyStore.getState()
    const { id } = s.createObjective(preview(GOAL_A))
    const last = useJourneyStore
      .getState()
      .objectives[id].steps.find((x) => x.kind === 'self-assessed')!
    s.deferStep(id, last.id)
    expect(
      useJourneyStore.getState().objectives[id].steps.find((x) => x.id === last.id)!.deferred
    ).toBeUndefined()
  })

  it('writes a checkpoint only when it changed', () => {
    const s = useJourneyStore.getState()
    const { id } = s.createObjective(preview(GOAL_A), { now: 5 })
    const step = useJourneyStore.getState().objectives[id].steps[1]
    s.setCheckpoint(id, { stepId: step.id }, 10)
    expect(useJourneyStore.getState().objectives[id].updatedAt).toBe(10)
    s.setCheckpoint(id, { stepId: step.id }, 20)
    expect(useJourneyStore.getState().objectives[id].updatedAt).toBe(10)
  })
})

describe('objectives made before a role was chosen', () => {
  it("become the role's when one is chosen, and objectives of another role are left alone", () => {
    const s = useJourneyStore.getState()
    const loose = s.createObjective(preview(GOAL_A, null)).id
    const exec = s.createObjective(preview(GOAL_B, 'executive')).id
    expect(useJourneyStore.getState().focus.none).toBe(loose)
    s.adoptRolelessObjectives('architect')
    const st = useJourneyStore.getState()
    expect(st.objectives[loose].role).toBe('architect')
    expect(st.objectives[exec].role).toBe('executive')
    expect(st.focus.architect).toBe(loose)
    expect(st.focus.none).toBeUndefined()
    // again: nothing changes
    s.adoptRolelessObjectives('architect')
    expect(useJourneyStore.getState().objectives).toEqual(st.objectives)
  })

  it('does nothing for no role', () => {
    const s = useJourneyStore.getState()
    const loose = s.createObjective(preview(GOAL_A, null)).id
    s.adoptRolelessObjectives('none')
    expect(useJourneyStore.getState().objectives[loose].role).toBe('none')
  })
})

describe('persistence', () => {
  it('declares its key and version, and writes to the device under that key', () => {
    expect(JOURNEY_STORE_KEY).toBe('pqc-journey')
    expect(useJourneyStore.persist.getOptions().version).toBe(JOURNEY_STORE_VERSION)
    useJourneyStore.getState().createObjective(preview(GOAL_A))
    const raw = JSON.parse(localStorage.getItem(JOURNEY_STORE_KEY)!)
    expect(raw.version).toBe(JOURNEY_STORE_VERSION)
    expect(Object.keys(raw.state.objectives)).toHaveLength(1)
  })

  it('does not write the role switch note to the device', () => {
    useJourneyStore.getState().noteRoleSwitch('architect', 'executive')
    useJourneyStore.getState().createObjective(preview(GOAL_A))
    expect(localStorage.getItem(JOURNEY_STORE_KEY)).not.toContain('roleSwitch')
  })

  it("restores each objective's own step and focus after a reload (A04)", async () => {
    const s = useJourneyStore.getState()
    const a = s.createObjective(preview(GOAL_A))
    const b = s.createObjective(preview(GOAL_B))
    const stepB = useJourneyStore.getState().objectives[b.id].steps[2]
    s.setCheckpoint(b.id, { stepId: stepB.id })
    s.focusObjective(a.id)
    // a new page load: the device keeps what was written, memory starts empty
    const written = localStorage.getItem(JOURNEY_STORE_KEY)!
    useJourneyStore.setState({ objectives: {}, order: [], focus: {}, completions: {} })
    localStorage.setItem(JOURNEY_STORE_KEY, written)
    await useJourneyStore.persist.rehydrate()
    const st = useJourneyStore.getState()
    expect(st.focus.architect).toBe(a.id)
    expect(st.objectives[b.id].checkpoint.stepId).toBe(stepB.id)
    expect(st.order).toEqual([a.id, b.id])
  })

  it('survives a damaged value on the device', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(JOURNEY_STORE_KEY, '{not json')
    await expect(useJourneyStore.persist.rehydrate()).resolves.not.toThrow()
    expect(useJourneyStore.getState().order).toEqual([])
    expect(quiet).toHaveBeenCalled()
    quiet.mockRestore()
  })
})

describe('migrating what is read from the device', () => {
  const objective = {
    id: 'o1',
    role: 'architect',
    goal: 'g',
    state: 'active',
    steps: [
      {
        id: 's1',
        position: 1,
        kind: 'module',
        resourceTag: 'LM-001',
        required: true,
        origin: { type: 'match' },
      },
    ],
    checkpoint: { path: [], stepId: 's1' },
    createdAt: 1,
    updatedAt: 1,
  }

  it('keeps a valid state as it is', () => {
    const state = {
      objectives: { o1: objective },
      order: ['o1'],
      focus: { architect: 'o1' },
      completions: { 'LM-001': { tag: 'LM-001', kind: 'completed', source: 'self', at: 3 } },
    }
    expect(migrateJourneyState(state, 1)).toEqual(state)
    expect(migrateJourneyState(migrateJourneyState(state, 1), 1)).toEqual(state)
  })

  it('starts empty from nothing or from garbage', () => {
    const empty = { objectives: {}, order: [], focus: {}, completions: {} }
    for (const v of [undefined, null, 5, 'x', [], { objectives: 7 }]) {
      expect(migrateJourneyState(v, 0)).toEqual(empty)
    }
  })

  it('drops invalid objectives, dangling focus and order, and mismatched completions; adds an unlisted objective to the order', () => {
    const migrated = migrateJourneyState(
      {
        objectives: { o1: objective, o2: { id: 'o2' }, o3: { ...objective, id: 'other' } },
        order: ['gone', 'o1'],
        focus: { architect: 'o2', executive: null, ops: 'o1' },
        completions: {
          'LM-001': { tag: 'LM-009', at: 1 },
          'LM-002': { tag: 'LM-002', kind: 'completed', source: 'self', at: 2 },
        },
      },
      0
    )
    expect(Object.keys(migrated.objectives)).toEqual(['o1'])
    expect(migrated.order).toEqual(['o1'])
    expect(migrated.focus).toEqual({ executive: null, ops: 'o1' })
    expect(Object.keys(migrated.completions)).toEqual(['LM-002'])
  })
})
