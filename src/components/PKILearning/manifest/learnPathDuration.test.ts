// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { moduleDurationLabel } from './learnPathDuration'
import { MANIFESTS } from './registry'

const path = (duration: string) => ({
  id: duration,
  label: duration,
  entrySection: 'a',
  duration,
  sections: [],
})

describe('moduleDurationLabel', () => {
  it('keeps the module number when no path is longer than it', () => {
    expect(
      moduleDurationLabel({ duration: '160 min', learnPaths: [path('120 min'), path('40 min')] })
    ).toBe('160 min')
  })

  it('shows the range of the paths when the module number is shorter than one of them', () => {
    expect(
      moduleDurationLabel({
        duration: '66 min',
        learnPaths: [path('76 min'), path('35 min'), path('60 min')],
      })
    ).toBe('35–76 min, depending on your path')
  })

  it('leaves modules without paths, or without a timed number, alone', () => {
    expect(moduleDurationLabel({ duration: '30 min' })).toBe('30 min')
    expect(moduleDurationLabel({ duration: '', learnPaths: [path('5 min'), path('9 min')] })).toBe(
      ''
    )
  })

  it('never shows a header shorter than one of the module’s own paths', () => {
    const cc = MANIFESTS.find((m) => m.id === 'cc-eucc-certification')
    expect(cc && moduleDurationLabel(cc)).toBe('35–76 min, depending on your path')
  })
})
