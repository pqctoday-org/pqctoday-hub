// SPDX-License-Identifier: GPL-3.0-only
// Pure-function tests for the workshop registry helpers. The build-time
// WORKSHOP_FLOWS array is now empty (Increment G migrated all flows to JSON
// under public/workshop/), so these tests use a synthetic flow fixture.
import { describe, it, expect } from 'vitest'
import {
  WORKSHOP_FLOWS,
  resolveWorkshopFlow,
  flattenFlow,
  getNextStep,
  getPrevStep,
} from './workshopRegistry'
import type { WorkshopFlow, WorkshopStep } from '@/types/Workshop'

function step(id: string, title: string = id): WorkshopStep {
  return {
    id,
    chapter: 'foundations',
    title,
    estMinutes: 1,
    whyItMatters: 'why',
    page: { route: '/' },
    tasks: ['t'],
    expectedOutput: 'out',
    narration: 'narration filler text long enough to pass validator',
  }
}

const FIXTURE: WorkshopFlow = {
  id: 'fixture-flow',
  title: 'Fixture',
  match: {
    roles: ['executive'],
    proficiencies: ['basics'],
    industries: ['Finance & Banking'],
    regions: ['US', 'AU'],
  },
  whatToExpect: ['a', 'b'],
  totalEstMinutes: 10,
  intro: { id: 'intro', title: 'Intro', estMinutes: 1, steps: [step('intro-01')] },
  prerequisites: { id: 'prereq', title: 'Prereq', estMinutes: 1, steps: [step('prereq-01')] },
  common: [
    {
      id: 'foundations',
      title: 'Foundations',
      estMinutes: 1,
      steps: [step('p-landing')],
    },
    {
      id: 'action',
      title: 'Action',
      estMinutes: 1,
      steps: [step('a1'), step('a2'), step('a3'), step('a4')],
    },
  ],
  regions: {
    US: { id: 'region-us', title: 'US', estMinutes: 1, steps: [step('us-01-compliance')] },
    AU: { id: 'region-au', title: 'AU', estMinutes: 1, steps: [step('au-01-compliance')] },
  },
  close: { id: 'close', title: 'Close', estMinutes: 1, steps: [step('close-01')] },
}

describe('workshopRegistry', () => {
  it('WORKSHOP_FLOWS is empty (flows now live in public/workshop/*.json)', () => {
    expect(WORKSHOP_FLOWS).toEqual([])
  })

  it('resolveWorkshopFlow returns null when no build-time flows are registered', () => {
    const flow = resolveWorkshopFlow({
      role: 'executive',
      proficiency: 'basics',
      industry: 'Finance & Banking',
      region: 'US',
    })
    expect(flow).toBeNull()
  })

  it('flattenFlow inserts the region chapter before the action chapter', () => {
    const steps = flattenFlow(FIXTURE, 'AU')
    const ids = steps.map((s) => s.id)
    const auIdx = ids.indexOf('au-01-compliance')
    const a1Idx = ids.indexOf('a1')
    expect(auIdx).toBeGreaterThan(-1)
    expect(a1Idx).toBeGreaterThan(-1)
    expect(auIdx).toBeLessThan(a1Idx)
  })

  it('flattenFlow includes intro + prereq + foundations + region + action + close', () => {
    const steps = flattenFlow(FIXTURE, 'US')
    const ids = steps.map((s) => s.id)
    expect(ids).toEqual([
      'intro-01',
      'prereq-01',
      'p-landing',
      'us-01-compliance',
      'a1',
      'a2',
      'a3',
      'a4',
      'close-01',
    ])
  })

  it('flattenFlow yields a non-empty step list for each declared region', () => {
    for (const region of ['US', 'AU'] as const) {
      const steps = flattenFlow(FIXTURE, region)
      expect(steps.length).toBeGreaterThan(0)
      expect(steps.every((s) => s.title.length > 0)).toBe(true)
    }
  })

  it('navigation helpers walk forward and back through the flat list', () => {
    const steps = flattenFlow(FIXTURE, 'US')
    const next = getNextStep(steps, steps[0].id)
    expect(next?.id).toBe(steps[1].id)
    const prev = getPrevStep(steps, steps[1].id)
    expect(prev?.id).toBe(steps[0].id)
    expect(getPrevStep(steps, steps[0].id)).toBeNull()
    expect(getNextStep(steps, steps[steps.length - 1].id)).toBeNull()
  })
})
