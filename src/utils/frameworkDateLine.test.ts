// SPDX-License-Identifier: AGPL-3.0-only
// A publication date on non-binding guidance reads "Published <year>", and only the
// deadline kinds the data marks as deadlines are shown as deadlines (owner decision D7).
import { describe, expect, it } from 'vitest'
import { frameworkDateLine } from './frameworkDateLine'

const base = { deadline: '2025', deadlineStart: 2025 }

describe('frameworkDateLine', () => {
  it('shows a publication date on non-binding guidance as "Published", not as a deadline', () => {
    for (const bindingStatus of ['recommendation', 'informational'] as const) {
      expect(
        frameworkDateLine({ ...base, deadlineKind: 'fixed', bindingStatus }),
        bindingStatus
      ).toEqual({ kind: 'published', text: 'Published 2025' })
    }
  })

  it('keeps a draft or official target date as a deadline (a planned date, not a publication)', () => {
    for (const bindingStatus of ['draft', 'official_target'] as const) {
      expect(
        frameworkDateLine({ ...base, deadlineKind: 'fixed', bindingStatus }),
        bindingStatus
      ).toEqual({
        kind: 'deadline',
        text: '2025',
      })
    }
  })

  it('shows a fixed date on a binding framework as a deadline', () => {
    expect(frameworkDateLine({ ...base, deadlineKind: 'fixed', bindingStatus: 'binding' })).toEqual(
      { kind: 'deadline', text: '2025' }
    )
  })

  it('shows a phased schedule as a deadline', () => {
    expect(
      frameworkDateLine({ ...base, deadlineKind: 'phased', bindingStatus: 'recommendation' })
    ).toEqual({ kind: 'deadline', text: '2025' })
  })

  it('shows no deadline for ongoing, none or unknown kinds, even when the text names a year', () => {
    for (const deadlineKind of ['ongoing', 'none', 'unknown'] as const) {
      expect(frameworkDateLine({ ...base, deadlineKind }), deadlineKind).toEqual({
        kind: 'none',
        text: '',
      })
    }
  })

  it('treats a fixed date on an unclassified row as a deadline, not as guidance', () => {
    expect(frameworkDateLine({ ...base, deadlineKind: 'fixed' })).toEqual({
      kind: 'deadline',
      text: '2025',
    })
  })
})
