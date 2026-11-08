// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { assessPlanAlignment } from './compliancePlanAlignment'
import type { UserMilestone } from './ComplianceGantt'
const milestone: UserMilestone = {
  id: '1',
  label: 'Same label',
  year: 2028,
  obligationKeys: ['a'],
  completed: true,
  completedYear: 2028,
}
const assess = (milestones: UserMilestone[], scenario = 2030) =>
  assessPlanAlignment('a', 2029, milestones, scenario)
describe('explicit fictional activity alignment', () => {
  it('does not infer links from categories, names, dates, or unrelated completions', () => {
    expect(
      assess([{ ...milestone, obligationKeys: ['b'], category: 'Certification' }]).status
    ).toBe('unknown')
    expect(assess([{ ...milestone, obligationKeys: undefined }]).status).toBe('unknown')
  })
  it('records all linked activities by reference and scenario year, including equality', () => {
    expect(assess([{ ...milestone, completedYear: 2029 }], 2029)).toMatchObject({
      status: 'completed',
      alignmentLabel: 'Recorded by reference year',
    })
  })
  it('does not give one completion credit for another unfinished activity', () => {
    expect(assess([milestone, { ...milestone, id: '2', completed: false }])).toMatchObject({
      status: 'on-track',
      alignmentLabel: 'Planned by reference year',
    })
  })
  it('distinguishes late planned and late recorded dates', () => {
    expect(assess([{ ...milestone, completedYear: 2030 }]).status).toBe('at-risk')
    expect(assess([{ ...milestone, completed: false, year: 2031 }]).status).toBe('at-risk')
  })
  it.each([undefined, NaN, Infinity, 0, 2028.5])(
    'keeps marked-complete timing unknown for %s',
    (completedYear) => {
      expect(assess([{ ...milestone, completedYear }]).status).toBe('unknown')
    }
  )
  it('does not accept a future completion even when before the reference year', () => {
    expect(assess([milestone], 2027)).toMatchObject({
      status: 'unknown',
      gap: expect.stringContaining('future completion'),
    })
  })
  it('missing timing cannot be hidden by another valid or late activity', () => {
    expect(assess([milestone, { ...milestone, id: '2', completedYear: undefined }]).status).toBe(
      'unknown'
    )
    expect(
      assess([
        { ...milestone, completedYear: 2030 },
        { ...milestone, id: '2', completedYear: undefined },
      ]).status
    ).toBe('unknown')
  })
  it('keeps invalid scenario and unfinished planned years unknown', () => {
    expect(assess([milestone], NaN).status).toBe('unknown')
    expect(assess([{ ...milestone, completed: false, year: NaN }]).status).toBe('unknown')
  })
  it('preserves raw inputs, unknown keys, stale completion years and duplicate labels', () => {
    const records = [
      milestone,
      {
        ...milestone,
        id: '2',
        completed: false,
        obligationKeys: ['removed,key'],
        completedYear: 2099,
      },
    ]
    const before = structuredClone(records)
    expect(assess(records).status).toBe('completed')
    expect(records).toEqual(before)
    expect(assessPlanAlignment('removed,key', 2030, records, 2030).status).toBe('on-track')
  })
})
