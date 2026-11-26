// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Two open tabs, and a stored journey that was damaged on the device. Each "tab" is its own copy of the store,
 * loaded from the same device storage; the browser tells the other tabs when one saves (a `storage` event).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JOURNEY_STORE_KEY, JOURNEY_STORE_VERSION } from './useJourneyStore'
import { buildPreview } from '../services/journey/objectiveBuilder'

const preview = (goal: string) =>
  buildPreview({ goal, persona: 'architect', existing: [], isDone: () => false })

async function openTab() {
  vi.resetModules()
  return (await import('./useJourneyStore')).useJourneyStore
}
const stored = () =>
  (JSON.parse(localStorage.getItem(JOURNEY_STORE_KEY)!) as { state: { objectives: object } }).state
const tellOtherTabs = () =>
  window.dispatchEvent(new StorageEvent('storage', { key: JOURNEY_STORE_KEY }))

beforeEach(() => localStorage.clear())

describe('two open tabs', () => {
  it('a tab that saves after another tab saved keeps the other tab’s objective', async () => {
    const tabA = await openTab()
    const tabB = await openTab()
    const a = tabA.getState().createObjective(preview('Review our TLS migration design'))
    tellOtherTabs()
    const b = tabB.getState().createObjective(preview('Plan our code signing rollout'))
    expect(a.created && b.created).toBe(true)
    expect(Object.keys(stored().objectives).sort()).toEqual([a.id, b.id].sort())
    expect(Object.keys(tabB.getState().objectives).sort()).toEqual([a.id, b.id].sort())
  })

  it('ignores a storage event for some other key', async () => {
    const tabA = await openTab()
    const tabB = await openTab()
    tabA.getState().createObjective(preview('Review our TLS migration design'))
    window.dispatchEvent(new StorageEvent('storage', { key: 'something-else' }))
    expect(Object.keys(tabB.getState().objectives)).toHaveLength(0)
  })
})

describe('a stored journey of the current version that was damaged on the device', () => {
  const write = (state: unknown) =>
    localStorage.setItem(
      JOURNEY_STORE_KEY,
      JSON.stringify({ state, version: JOURNEY_STORE_VERSION })
    )
  const step = (n: number, extra: object = {}) => ({
    id: `o-s${n}`,
    position: n,
    kind: 'module',
    resourceTag: 'LM-008',
    required: true,
    origin: { type: 'match' },
    ...extra,
  })
  const objective = (steps: unknown[]) => ({
    id: 'o',
    role: 'architect',
    goal: 'Review TLS',
    state: 'active',
    steps,
    checkpoint: { path: [], stepId: null },
    createdAt: 1,
    updatedAt: 1,
  })

  it('does not stop the app when the list of objectives is not a list', async () => {
    write({ objectives: null, order: ['o'], focus: {}, completions: {} })
    const tab = await openTab()
    expect(tab.getState().objectives).toEqual({})
    expect(tab.getState().order).toEqual([])
  })

  it('drops a step that is not well formed, and keeps the objective and its other steps', async () => {
    write({
      objectives: { o: objective([step(1), step(2, { position: '2' }), step(3)]) },
      order: ['o'],
      focus: {},
      completions: {},
    })
    const tab = await openTab()
    expect(tab.getState().objectives.o.steps.map((s) => s.id)).toEqual(['o-s1', 'o-s3'])
  })
})
