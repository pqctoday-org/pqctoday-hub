// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { clampStep } from './clampStep'

describe('clampStep', () => {
  it('keeps an in-range step', () => {
    expect(clampStep(2, 5)).toBe(2)
    expect(clampStep(0, 5)).toBe(0)
    expect(clampStep(4, 5)).toBe(4)
  })
  it('caps a step past the end at the last step', () => {
    expect(clampStep(99, 5)).toBe(4)
  })
  it('opens the first step for missing, negative or non-integer values', () => {
    expect(clampStep(undefined, 5)).toBe(0)
    expect(clampStep(-1, 5)).toBe(0)
    expect(clampStep(1.5, 5)).toBe(0)
    expect(clampStep(Number.NaN, 5)).toBe(0)
  })
  it('opens step 0 when a tool has no steps', () => {
    expect(clampStep(3, 0)).toBe(0)
  })
})
