// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeRecencyStatus } from './libraryData'

// Fixed "now" so the test is deterministic regardless of when it runs.
const NOW = Date.parse('2026-06-23')
const days = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

describe('computeRecencyStatus (W1)', () => {
  it("flags 'New' when published within the window", () => {
    expect(
      computeRecencyStatus({ initialPublicationDate: days(5), lastUpdateDate: days(5) }, NOW)
    ).toBe('New')
  })

  it("flags 'Updated' when only the update date is within the window", () => {
    expect(
      computeRecencyStatus({ initialPublicationDate: days(400), lastUpdateDate: days(10) }, NOW)
    ).toBe('Updated')
  })

  it('returns undefined when both dates are older than the window', () => {
    expect(
      computeRecencyStatus({ initialPublicationDate: days(200), lastUpdateDate: days(120) }, NOW)
    ).toBeUndefined()
  })

  it('ignores future-dated documents (not yet published)', () => {
    expect(
      computeRecencyStatus({ initialPublicationDate: days(-10), lastUpdateDate: days(-10) }, NOW)
    ).toBeUndefined()
  })

  it('returns undefined for empty / unparseable dates', () => {
    expect(
      computeRecencyStatus({ initialPublicationDate: '', lastUpdateDate: '' }, NOW)
    ).toBeUndefined()
    expect(
      computeRecencyStatus({ initialPublicationDate: 'n/a', lastUpdateDate: 'TBD' }, NOW)
    ).toBeUndefined()
  })

  it('respects the boundary (exactly 30 days ago is still in-window)', () => {
    expect(
      computeRecencyStatus({ initialPublicationDate: days(30), lastUpdateDate: days(30) }, NOW, 30)
    ).toBe('New')
    expect(
      computeRecencyStatus({ initialPublicationDate: days(31), lastUpdateDate: days(31) }, NOW, 30)
    ).toBeUndefined()
  })
})
