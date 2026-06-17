// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { isPqcCapable } from './catalogCompletion'

describe('isPqcCapable', () => {
  it('is true only when support starts with "Yes"', () => {
    expect(isPqcCapable({ pqcSupport: 'Yes (ML-DSA-65)' })).toBe(true)
    expect(isPqcCapable({ pqcSupport: 'YES' })).toBe(true)
    expect(isPqcCapable({ pqcSupport: 'No' })).toBe(false)
    expect(isPqcCapable({ pqcSupport: 'Partial' })).toBe(false)
    expect(isPqcCapable({ pqcSupport: 'Planned' })).toBe(false)
    expect(isPqcCapable({ pqcSupport: '' })).toBe(false)
  })
})
