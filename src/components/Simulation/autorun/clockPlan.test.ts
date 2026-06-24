// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { autoRunQueue } from './simAutoRun'
import { getScenario } from './scenarioConfig'
import { buildClockPlan } from './useSimAutoRunPlayer'

describe('auto-run clock plan (scenario-paced, US PQC Executive Order)', () => {
  const q = autoRunQueue()
  const plan = buildClockPlan(q, getScenario('US'))
  const levels = q.map((i) => i.level)
  const lastOf = (lvl: number) => levels.lastIndexOf(lvl)

  it('has a plan entry per queue index', () => {
    expect(plan).toHaveLength(q.length)
  })

  it('starts in 2026 and ends in 2035 (program horizon)', () => {
    expect(plan[0].year).toBe(2026)
    expect(plan[plan.length - 1].year).toBe(2035)
  })

  it('lands the L2 "proceed" pass around 2029', () => {
    const y = plan[lastOf(2)].year
    expect(y, `L2-end year ${y}`).toBeGreaterThanOrEqual(2028)
    expect(y).toBeLessThanOrEqual(2029)
  })

  it('lands the L3 critical pass around the EO key-establishment/signature window (2030–2031)', () => {
    const y = plan[lastOf(3)].year
    expect(y, `L3-end year ${y}`).toBeGreaterThanOrEqual(2030)
    expect(y).toBeLessThanOrEqual(2031)
  })

  it('is non-decreasing year-over-year across the run', () => {
    for (let i = 1; i < plan.length; i++) {
      const prev = plan[i - 1].year * 4 + plan[i - 1].q
      const cur = plan[i].year * 4 + plan[i].q
      expect(cur, `clock regressed at index ${i}`).toBeGreaterThanOrEqual(prev)
    }
  })
})
