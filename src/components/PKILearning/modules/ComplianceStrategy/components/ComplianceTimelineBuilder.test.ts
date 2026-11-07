// SPDX-License-Identifier: AGPL-3.0-only
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

describe('computeGapAnalysis — planning history does not establish obligation satisfaction', () => {
  const deadlines = [{ key: 'k', label: 'FW', year: 2020, source: 's' }]
  const milestone: UserMilestone = {
    id: 'm',
    label: 'Unrelated certificate',
    year: 2019,
    category: 'Certification',
    completed: true,
  }
  it.each([
    { milestones: [] },
    { milestones: [milestone] },
    { milestones: [{ ...milestone, completed: false }] },
    { milestones: [{ ...milestone, year: 2099, category: 'Assessment' }] },
  ])('keeps satisfaction unknown without an explicit scope association', ({ milestones }) => {
    const original = JSON.stringify(milestones)
    const [gap] = computeGapAnalysis(deadlines, milestones)
    expect(gap.status).toBe('unknown')
    expect(gap.gap).toContain('no milestone-to-obligation scope or supporting checks')
    expect(gap.deadlineYear).toBe(2020)
    expect(JSON.stringify(milestones)).toBe(original)
  })
  it('does not let one completed certificate satisfy two unrelated obligations', () => {
    const original = { ...milestone, completed: true }
    const gaps = computeGapAnalysis(
      [
        {
          key: 'archive',
          label: 'Sample archive obligation',
          year: 2030,
          source: 'Fictional source',
        },
        {
          key: 'signing',
          label: 'Sample signing obligation',
          year: 2031,
          source: 'Fictional source',
        },
      ],
      [original]
    )
    expect(gaps.map((gap) => gap.status)).toEqual(['unknown', 'unknown'])
    expect(gaps.map((gap) => gap.deadlineYear)).toEqual([2030, 2031])
    expect(original.completed).toBe(true)
  })
})
