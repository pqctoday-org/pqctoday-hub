// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { roiCashflows } from './roiCashflows'

describe('annual rows and one fixed-stock benefit', () => {
  it.each([1, 3, 6])('counts a stock once across a %i-year horizon', (years) => {
    const result = roiCashflows(10, Array(years).fill(5), 100, 0)
    expect(result.totalCost).toBe(10 * years)
    expect(result.totalBenefit).toBe(5 * years + 100)
    expect(result.rows.map((row) => row.stockBenefit)).toEqual([...Array(years - 1).fill(0), 100])
    expect(result.npv).toBe(100 - 5 * years)
    expect(result.paybackYear).toBe(years)
  })
  it('discounts the stock only in its actual final year', () => {
    const result = roiCashflows(10, [5, 5, 5], 100, 0.1)
    const independent = -5 / 1.1 - 5 / 1.21 + 95 / 1.331
    expect(result.npv).toBeCloseTo(independent, 10)
    expect(result.npv).not.toBeCloseTo(95 / 1.1 + 95 / 1.21 + 95 / 1.331, 5)
  })
  it('uses explicit per-year benefits without extending a finite saving', () => {
    const result = roiCashflows(2, [13, 13, 13, 10, 10], 0, 0)
    expect(result.totalBenefit).toBe(59)
    expect(result.totalCost).toBe(10)
    expect(result.roiPercent).toBeCloseTo(490, 10)
    expect(result.paybackYear).toBe(1)
  })
  it('preserves losses and no crossover, with zero-stock cases identical', () => {
    const result = roiCashflows(10, [3, 3, 3], 0, 0)
    expect(result.npv).toBe(-21)
    expect(result.roiPercent).toBe(-70)
    expect(result.paybackYear).toBeNull()
    expect(result).toEqual(roiCashflows(10, [3, 3, 3], 0 * 100, 0))
  })
  it('distinguishes break-even from zero-cost undefined ROI', () => {
    expect(roiCashflows(10, [10, 10], 0, 0).paybackYear).toBe(1)
    const free = roiCashflows(0, [10, 10], 0, 0)
    expect(free.roiPercent).toBeNull()
    expect(free.paybackYear).toBeNull()
    expect(free.paybackStatus).toBe('no-cost')
    expect(free.npv).toBe(20)
    expect(roiCashflows(10, [3, 3, 3], 0, 0).paybackStatus).toBe('none')
    expect(roiCashflows(10, [10, 10], 0, 0).paybackStatus).toBe('year')
  })
  it.each([NaN, Infinity, -1])('rejects invalid model numbers %s', (bad) => {
    expect(() => roiCashflows(10, [5], bad, 0)).toThrow()
    expect(() => roiCashflows(10, [bad], 0, 0)).toThrow()
  })
})
