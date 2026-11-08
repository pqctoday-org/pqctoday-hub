// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { BreachCostModel } from './BreachCostModel'
import { computeBreachCosts, hndlMultiplier } from '@/utils/breachCostModel'

// Labelled probability fixtures, not a survey or prediction. Actual helper is
// unchanged; only its probability context and reader baseline are supplied.
vi.mock('@/utils/crqcProbability', async (original) => ({
  ...(await original<typeof import('@/utils/crqcProbability')>()),
  crqcCumulativeProbability: (year: number) => Math.max(0, Math.min(0.3, (year - 2026) / 10)),
  crqcProbabilityWithinHorizon: (year: number, horizon: number) =>
    Math.max(0, Math.min(0.3, (year + horizon - 2026) / 10)) -
    Math.max(0, Math.min(0.3, (year - 2026) / 10)),
}))
vi.mock('@/utils/roiMath', async (original) => ({
  ...(await original<typeof import('@/utils/roiMath')>()),
  resolveIndustryBreachBaseline: () => 1000,
}))
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('Reader math matches the existing breach helper', () => {
  it('retains the fresh part of an older corpus and the actual smooth multiplier', () => {
    const result = vi.fn()
    render(
      <MemoryRouter>
        <BreachCostModel
          initialValues={{
            breachScale: 1,
            yearsOfData: 20,
            hndlFactorPct: 50,
            dataSensitivityClass: 'general-pii',
            annualBreachProbPct: 10,
            annualBreachProbabilityOrigin: 'learner-assumption',
            planningHorizonYears: 3,
            discountRateAnnual: 0.1,
          }}
          onCostCalculated={result}
        />
      </MemoryRouter>
    )
    expect(result.mock.lastCall?.[0].quantumCost).toBeCloseTo(2858.954285924039, 9)
    expect(result.mock.lastCall?.[0].quantumALE).toBeCloseTo(155.76862857772116, 9)
    expect(
      screen.getByText(/Sample corpus 20yr, shelf-life preset 10yr, decryption gap 0:/)
    ).toHaveTextContent('E = 5.00yr')
    expect(screen.getByText(/HNDL amplification: 1 \+ 4 ×/)).toHaveTextContent('2.86×')
    expect(
      screen.getByText(/Present value of the 3-year quantum-risk delta at 10% discount:/)
    ).toHaveTextContent('$90')
    expect(
      screen.getByText(/the same freshness-weighted corpus assumption is used in each year/)
    ).toBeInTheDocument()
    expect(
      screen.getByText('Working figures are rounded; calculations use underlying values.')
    ).toBeVisible()
    expect(screen.queryByText(/using the harvested corpus.*average age/)).not.toBeInTheDocument()
  })
  it('uses separate annual probabilities rather than the final horizon ALE as a level annuity', () => {
    const costs = computeBreachCosts({
      baseline: 1000,
      breachScale: 1,
      yearsOfData: 20,
      hndlFactorPct: 50,
      dataSensitivityClass: 'general-pii',
      annualBreachProbPct: 10,
      asOfYear: 2026,
      planningHorizonYears: 3,
      discountRateAnnual: 0.1,
    })
    expect(costs.pvQuantumDelta).toBeCloseTo(89.52589761662725, 9)
    expect(costs.pvQuantumDelta).not.toBeCloseTo(138.68832501296544, 3)
  })
  it('keeps smooth amplification below the old hard-clamp result even beyond raw cap', () => {
    expect(hndlMultiplier(25, 100)).toBeCloseTo(4.992278183455089, 9)
    expect(hndlMultiplier(25, 100)).toBeLessThan(5)
  })
})
