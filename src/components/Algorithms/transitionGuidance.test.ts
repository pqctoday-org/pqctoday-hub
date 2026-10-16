// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { isTransitionGuidanceDate } from './transitionGuidance'

describe('isTransitionGuidanceDate', () => {
  it('flags the IR 8547 deprecate/disallow labels', () => {
    expect(isTransitionGuidanceDate('2030 (Deprecated) / 2035 (Disallowed)')).toBe(true)
    expect(isTransitionGuidanceDate('2035 (Disallowed)')).toBe(true)
  })
  it('leaves other labels alone', () => {
    expect(isTransitionGuidanceDate('Not deprecated')).toBe(false)
    expect(isTransitionGuidanceDate('TBD')).toBe(false)
  })
})
