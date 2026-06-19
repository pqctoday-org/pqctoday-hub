// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { parseUpperNumber, capacityFlags } from './InfraModernizationPlanner'

describe('parseUpperNumber', () => {
  it('takes the highest number from a range / value', () => {
    expect(parseUpperNumber('5-15')).toBe(15)
    expect(parseUpperNumber('3')).toBe(3)
    expect(parseUpperNumber('3x')).toBe(3)
  })
  it('is null for non-numeric input (no false zero)', () => {
    expect(parseUpperNumber('banana')).toBeNull()
    expect(parseUpperNumber('')).toBeNull()
  })
})

describe('capacityFlags (RM-17 — the plan now derives, not just echoes)', () => {
  it('flags high CPU impact (>=20%) and large cert-storage growth (>=2x)', () => {
    const flags = capacityFlags('10-25', '3')
    expect(flags.join(' ')).toMatch(/CPU impact/)
    expect(flags.join(' ')).toMatch(/Certificate stores grow/)
  })
  it('produces no flags for low impact', () => {
    expect(capacityFlags('5-15', '1')).toEqual([])
  })
  it('ignores non-numeric input gracefully', () => {
    expect(capacityFlags('banana', 'lots')).toEqual([])
  })
})
