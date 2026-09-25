// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { threatCountLabel } from './threatsHelper'

describe('threatCountLabel (UX-19)', () => {
  it('says "1 threat", never "1 threats"', () => {
    expect(threatCountLabel(1)).toBe('1 threat')
    expect(threatCountLabel(0)).toBe('0 threats')
    expect(threatCountLabel(5)).toBe('5 threats')
  })
})
