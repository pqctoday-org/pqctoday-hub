// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { calculateKeyRefreshInterval, ORBIT_PROFILES, SOLAR_ACTIVITY_MULTIPLIER } from './orbitData'

describe('illustrative linear refresh upper bound', () => {
  it('retains the sub-hour MEO bound instead of raising it to one hour', () => {
    const hours = calculateKeyRefreshInterval(1e-5, 9472)
    // Existing linear model: rate × bits × (hours /24) =0.001.
    expect(hours).toBeCloseTo(0.2533783783783784, 14)
    expect((1e-5 * 9472 * hours) / 24).toBeCloseTo(0.001, 15)
    expect((1e-5 * 9472 * 1) / 24).toBeGreaterThan(0.001)
  })

  it.each(
    ORBIT_PROFILES.flatMap((orbit) =>
      Object.entries(SOLAR_ACTIVITY_MULTIPLIER).map(([solar, multiplier]) => ({
        orbit: orbit.id,
        solar,
        rate: orbit.seuRatePerBitDay * multiplier,
      }))
    )
  )('respects the unchanged target for $orbit/$solar', ({ rate }) => {
    const hours = calculateKeyRefreshInterval(rate, 9472)
    expect(hours).toBeGreaterThan(0)
    expect((rate * 9472 * hours) / 24).toBeCloseTo(0.001, 15)
    // A longer interval exceeds the target under the same linear assumptions.
    expect((rate * 9472 * (hours * 1.01)) / 24).toBeGreaterThan(0.001)
  })

  it('retains custom positive target scaling without quantizing the result', () => {
    const hours = calculateKeyRefreshInterval(1e-5, 9472, 0.0001)
    expect(hours).toBeCloseTo(0.02533783783783784, 14)
    expect((1e-5 * 9472 * hours) / 24).toBeCloseTo(0.0001, 15)
  })

  it('preserves legacy out-of-domain results without interpreting them as valid bounds', () => {
    expect(calculateKeyRefreshInterval(0, 9472)).toBe(Infinity)
    expect(calculateKeyRefreshInterval(1e-5, 0)).toBe(Infinity)
    expect(calculateKeyRefreshInterval(1e-5, 9472, 0)).toBe(1)
    expect(calculateKeyRefreshInterval(1e-5, 9472, -1)).toBe(1)
    expect(calculateKeyRefreshInterval(NaN, 9472)).toBeNaN()
  })
})
