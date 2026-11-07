// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { urgencyColor, urgencyTextColor, type DeadlineUrgency } from './deadlineUrgency'

describe('urgencyTextColor', () => {
  it('shows a passed date in the informational colour, not the error colour', () => {
    expect(urgencyTextColor('overdue')).toBe('text-status-info')
    expect(urgencyTextColor('overdue')).not.toBe(urgencyColor('overdue'))
  })

  it.each<DeadlineUrgency>(['imminent', 'near', 'future', 'ongoing'])(
    'keeps the shared colour for %s',
    (urgency) => {
      expect(urgencyTextColor(urgency)).toBe(urgencyColor(urgency))
    }
  )
})
