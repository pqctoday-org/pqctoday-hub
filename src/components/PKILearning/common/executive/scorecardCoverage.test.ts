// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { OVERALL_SCORE_MIN_COVERAGE, scoredWeightShare } from './scorecardCoverage'

interface Dim {
  id: string
  weight: number
  disabled?: boolean
  scored?: boolean
}
const share = (dims: Dim[]) =>
  scoredWeightShare(
    dims,
    (d) => d.weight,
    (d) => Boolean(d.scored)
  )

describe('scoredWeightShare', () => {
  it('leaves locked KPIs out of the denominator', () => {
    const dims: Dim[] = [
      { id: 'a', weight: 0.4, scored: true },
      { id: 'b', weight: 0.4, scored: true },
      { id: 'locked', weight: 0.2, disabled: true },
    ]
    expect(share(dims)).toBe(1)
  })
  it('is the scored share of the weight that can be scored', () => {
    const dims: Dim[] = [
      { id: 'a', weight: 0.3, scored: true },
      { id: 'b', weight: 0.3 },
      { id: 'c', weight: 0.2, scored: true },
      { id: 'locked', weight: 0.2, disabled: true },
    ]
    expect(share(dims)).toBeCloseTo(0.5 / 0.8)
  })
  it('is zero, not NaN, when every KPI is locked or there are none', () => {
    expect(share([{ id: 'x', weight: 1, disabled: true }])).toBe(0)
    expect(share([])).toBe(0)
  })
  it('exposes the one threshold the screen and the exports share', () => {
    expect(OVERALL_SCORE_MIN_COVERAGE).toBe(0.7)
  })
})
