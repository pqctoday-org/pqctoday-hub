// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { TIMELINE_LABELS } from './reportContentShared'

describe('TIMELINE_LABELS', () => {
  it('names the stored "internal-deadline" value for both things it can stand for', () => {
    // The value is stored both for an organisation's own target date and for a
    // published deadline more than three years away, so the label says both.
    expect(TIMELINE_LABELS['internal-deadline']).toBe(
      'Own target or a published deadline more than 3 years away'
    )
  })

  it('keeps the other timeline labels', () => {
    expect(TIMELINE_LABELS['within-1y']).toBe('Within 1 year')
    expect(TIMELINE_LABELS['within-2-3y']).toBe('Within 2-3 years')
    expect(TIMELINE_LABELS['no-deadline']).toBe('No deadline')
    expect(TIMELINE_LABELS.unknown).toBe('Unknown')
  })
})
