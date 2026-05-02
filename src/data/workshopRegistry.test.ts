// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  WORKSHOP_FLOWS,
  resolveWorkshopFlow,
  flattenFlow,
  getNextStep,
  getPrevStep,
} from './workshopRegistry'

describe('workshopRegistry', () => {
  it('resolves the executive finance flow for matching context', () => {
    const flow = resolveWorkshopFlow({
      role: 'executive',
      proficiency: 'basics',
      industry: 'Finance & Banking',
      region: 'US',
    })
    expect(flow).not.toBeNull()
    expect(flow?.id).toBe('executive-finance-amer-apac-v1')
  })

  it('returns null for unmatched contexts', () => {
    const flow = resolveWorkshopFlow({
      role: 'developer',
      proficiency: 'basics',
      industry: 'Healthcare',
      region: 'EU',
    })
    expect(flow).toBeNull()
  })

  it('flattenFlow produces non-empty step list for each declared region', () => {
    const flow = WORKSHOP_FLOWS[0]
    for (const region of ['US', 'CA', 'AU'] as const) {
      const steps = flattenFlow(flow, region)
      expect(steps.length).toBeGreaterThan(10)
      expect(steps.every((s) => s.title.length > 0)).toBe(true)
    }
  })

  it('flattenFlow inserts the region chapter before the action chapter', () => {
    const flow = WORKSHOP_FLOWS[0]
    const steps = flattenFlow(flow, 'AU')
    const auIdx = steps.findIndex((s) => s.id === 'au-01-compliance')
    const a1Idx = steps.findIndex((s) => s.id === 'a1-cswp-governance')
    expect(auIdx).toBeGreaterThan(-1)
    expect(a1Idx).toBeGreaterThan(-1)
    expect(auIdx).toBeLessThan(a1Idx)
  })

  it('navigation helpers walk forward and back through the flat list', () => {
    const flow = WORKSHOP_FLOWS[0]
    const steps = flattenFlow(flow, 'US')
    const next = getNextStep(steps, steps[0].id)
    expect(next?.id).toBe(steps[1].id)
    const prev = getPrevStep(steps, steps[1].id)
    expect(prev?.id).toBe(steps[0].id)
    expect(getPrevStep(steps, steps[0].id)).toBeNull()
    expect(getNextStep(steps, steps[steps.length - 1].id)).toBeNull()
  })

  it('CSWP 39 action chapter has exactly four steps', () => {
    const flow = WORKSHOP_FLOWS[0]
    const action = flow.common.find((c) => c.id === 'action')
    expect(action).toBeDefined()
    expect(action?.steps.length).toBe(4)
  })
})
