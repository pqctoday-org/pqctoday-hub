// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { getDeadlineYear, computeGapAnalysis } from './ComplianceTimelineBuilder'
import type { UserMilestone } from './ComplianceGantt'

describe('getDeadlineYear — binding (final) compliance year (RM-03)', () => {
  it('takes the LATEST year of a phased range, not the earliest phase-in', () => {
    expect(getDeadlineYear('2025-2030 (phased; ANSSI recommendation)')).toBe(2030)
    expect(getDeadlineYear('2030 (deprecate), 2035 (disallow)')).toBe(2035)
    expect(getDeadlineYear('2026 (wallet); 2030 (high-risk); 2035 (PQC full)')).toBe(2035)
    expect(getDeadlineYear('2027 (interim milestone); 2029 (completion)')).toBe(2029)
  })
  it('handles a single year', () => {
    expect(getDeadlineYear('2030')).toBe(2030)
  })
  it('returns null for ongoing / no year', () => {
    expect(getDeadlineYear('Ongoing (GL-2007-2024)')).toBeNull()
    expect(getDeadlineYear('no date here')).toBeNull()
  })
})

describe('computeGapAnalysis — "met" requires a real completion signal (RM-03)', () => {
  const pastDeadline = [{ key: 'k', label: 'FW', year: 2020, source: 's' }]
  const ms = (partial: Partial<UserMilestone>): UserMilestone => ({
    id: 'm',
    label: 'Cert',
    year: 2019,
    category: 'Certification',
    ...partial,
  })

  it('does NOT mark a passed deadline "completed" from a merely planned certification', () => {
    const [g] = computeGapAnalysis(pastDeadline, [ms({ completed: false })])
    expect(g.status).toBe('at-risk')
    expect(g.gap).toMatch(/planned but not marked complete/)
  })

  it('marks "completed" only when the certification milestone is done', () => {
    const [g] = computeGapAnalysis(pastDeadline, [ms({ completed: true })])
    expect(g.status).toBe('completed')
    expect(g.gap).toBe('Deadline met')
  })

  it('a passed deadline with no certification at all is at-risk', () => {
    const [g] = computeGapAnalysis(pastDeadline, [])
    expect(g.status).toBe('at-risk')
    expect(g.gap).toMatch(/Deadline passed/)
  })

  it('a completed certification ahead of a future deadline reads as met early', () => {
    const future = [{ key: 'k', label: 'FW', year: 2099, source: 's' }]
    const [g] = computeGapAnalysis(future, [ms({ year: 2026, completed: true })])
    expect(g.status).toBe('completed')
    expect(g.gap).toMatch(/ahead of deadline/)
  })
})
