// SPDX-License-Identifier: AGPL-3.0-only
// The NSA lane is shown under its own name on the timeline, but compliance rows
// name it by the country it was filed under. The resolver must reach the same events.
import { describe, expect, it } from 'vitest'
import { canonicalTimelineLane, resolveTimelineRef } from './timelineResolver'

describe('timeline lane alias', () => {
  it('maps the NSA ref to the renamed CNSA lane', () => {
    expect(canonicalTimelineLane('United States', 'NSA')).toEqual({
      country: 'United States (CNSA)',
      org: 'NSA',
    })
  })

  it('leaves every other lane as written, with whitespace trimmed', () => {
    expect(canonicalTimelineLane(' France ', ' ANSSI ')).toEqual({
      country: 'France',
      org: 'ANSSI',
    })
  })

  it('resolves the legacy NSA ref to the same events as the CNSA ref', () => {
    const legacy = resolveTimelineRef('United States:NSA')
    const renamed = resolveTimelineRef('United States (CNSA):NSA')
    expect(renamed.events.length).toBeGreaterThan(0)
    expect(legacy.events).toEqual(renamed.events)
  })
})
