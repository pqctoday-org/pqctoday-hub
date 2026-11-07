// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  describeTimelineMilestone,
  milestoneForPressure,
  sanitizeTimelineMilestone,
  timelineAnswerLabel,
} from './timelineMilestone'

const pair = { id: 'Sample migration deadline', authority: 'Sample Authority', year: 2035 }

describe('sanitizeTimelineMilestone', () => {
  it('keeps a clean pair and trims its text', () => {
    expect(sanitizeTimelineMilestone(pair)).toEqual(pair)
    expect(sanitizeTimelineMilestone({ id: '  A  ', authority: ' B ', year: 2031 })).toEqual({
      id: 'A',
      authority: 'B',
      year: 2031,
    })
  })

  it('keeps the pair without the year when the year is unusable', () => {
    for (const year of [1.5, 'soon', 12, 99999, null, Number.NaN]) {
      expect(sanitizeTimelineMilestone({ id: 'A', authority: 'B', year })).toEqual({
        id: 'A',
        authority: 'B',
      })
    }
  })

  it('drops anything that is not a short id plus a short authority', () => {
    const bad: unknown[] = [
      null,
      undefined,
      'text',
      42,
      [],
      [pair],
      {},
      { id: 'A' },
      { authority: 'B' },
      { id: 7, authority: 'B' },
      { id: 'A', authority: { name: 'B' } },
      { id: '   ', authority: 'B' },
      { id: 'A', authority: '' },
      { id: 'x'.repeat(201), authority: 'B' },
      { id: 'A', authority: 'x'.repeat(101) },
      { id: 'line\nbreak', authority: 'B' },
      { id: 'A', authority: 'tab\there' },
    ]
    for (const value of bad) expect(sanitizeTimelineMilestone(value)).toBeNull()
  })

  it('does not copy extra fields', () => {
    expect(sanitizeTimelineMilestone({ ...pair, injected: '<b>x</b>' })).toEqual(pair)
  })
})

describe('milestoneForPressure', () => {
  it('keeps the pair only with a value that comes from a published deadline card', () => {
    for (const pressure of ['within-1y', 'within-2-3y', 'internal-deadline'])
      expect(milestoneForPressure(pressure, pair)).toEqual(pair)
    for (const pressure of ['no-deadline', 'unknown', '', undefined, null])
      expect(milestoneForPressure(pressure, pair)).toBeNull()
  })
})

describe('timelineAnswerLabel', () => {
  it('describes a distant external deadline by milestone, authority and year', () => {
    expect(timelineAnswerLabel('internal-deadline', pair, 'Generic label')).toBe(
      'Distant external deadline: Sample migration deadline (Sample Authority), 2035'
    )
  })

  it('leads with the usual label for the nearer two values', () => {
    expect(timelineAnswerLabel('within-1y', pair, 'Within 1 year')).toBe(
      'Within 1 year: Sample migration deadline (Sample Authority), 2035'
    )
  })

  it('leaves the year out when there is none', () => {
    expect(describeTimelineMilestone({ id: 'A', authority: 'B' })).toBe('A (B)')
  })

  it('returns the generic label unchanged when there is no usable pair', () => {
    expect(timelineAnswerLabel('internal-deadline', undefined, 'Generic label')).toBe(
      'Generic label'
    )
    expect(timelineAnswerLabel('internal-deadline', { id: 3 }, 'Generic label')).toBe(
      'Generic label'
    )
    expect(timelineAnswerLabel('no-deadline', pair, 'No deadline')).toBe('No deadline')
    expect(timelineAnswerLabel(undefined, undefined, undefined)).toBeUndefined()
  })
})
