// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  assessPlanAlignment,
  restoreMilestoneList,
  restoreStringList,
} from './compliancePlanAlignment'
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
    expect(
      assess([milestone, { ...milestone, id: '2', completed: false, year: 2029 }], 2028)
    ).toMatchObject({
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
    expect(assessPlanAlignment('removed,key', 2030, records, 2028).status).toBe('on-track')
  })
  it.each(['a', 'prefix-a-suffix', ['a', 1], null, { a: true }])(
    'does not coerce malformed associations %j into links',
    (obligationKeys) => {
      const raw = { ...milestone, obligationKeys } as unknown as UserMilestone
      const before = structuredClone(raw)
      expect(assess([raw]).status).toBe('unknown')
      expect(raw).toEqual(before)
    }
  )
  it.each(['true', 'false', 1, 0, null, { done: true }, []])(
    'keeps nonboolean completion %j unknown without mutating the record',
    (completed) => {
      const raw = { ...milestone, completed } as unknown as UserMilestone
      const before = structuredClone(raw)
      expect(assess([raw])).toMatchObject({
        status: 'unknown',
        gap: expect.stringContaining('Boolean completion'),
      })
      expect(raw).toEqual(before)
      expect(assess([milestone, raw]).status).toBe('unknown')
    }
  )
  it('retains omitted legacy completion as unfinished, not malformed or completed', () => {
    const raw = { ...milestone }
    delete raw.completed
    const before = structuredClone(raw)
    expect(assess([raw], 2028)).toMatchObject({
      status: 'on-track',
      alignmentLabel: 'Planned by reference year',
    })
    expect(raw).toEqual(before)
    expect(Object.hasOwn(raw, 'completed')).toBe(false)
  })
  it('does not call an unfinished activity on-track once its planned year has passed', () => {
    const overdue = { ...milestone, completed: false, year: 2027 }
    const result = assess([overdue], 2030)
    expect(result).toMatchObject({
      status: 'unknown',
      alignmentLabel: 'Planned year passed, not recorded done',
    })
    expect(result.gap).toContain('not a delivery date')
    expect(result.gap).not.toMatch(/on-track conclusion is established/)
  })
  it('treats the as-of year itself as still planned, and lets a late plan take precedence', () => {
    expect(assess([{ ...milestone, completed: false, year: 2030 }], 2030)).toMatchObject({
      status: 'at-risk',
    })
    expect(assess([{ ...milestone, completed: false, year: 2029 }], 2029)).toMatchObject({
      status: 'on-track',
      alignmentLabel: 'Planned by reference year',
    })
    expect(
      assess(
        [
          { ...milestone, id: '2', completed: false, year: 2027 },
          { ...milestone, id: '3', completed: false, year: 2031 },
        ],
        2030
      ).status
    ).toBe('at-risk')
  })
  it('flags one overdue unfinished activity even when another is planned in time', () => {
    expect(
      assess(
        [
          { ...milestone, id: '2', completed: false, year: 2029 },
          { ...milestone, id: '3', completed: false, year: 2027 },
        ],
        2028
      )
    ).toMatchObject({ alignmentLabel: 'Planned year passed, not recorded done' })
  })
  it('restores only arrays of the expected shape from saved input', () => {
    expect(restoreMilestoneList('oops')).toEqual([])
    expect(restoreMilestoneList({ 0: milestone })).toEqual([])
    expect(restoreMilestoneList([null, 'x', 5, [], milestone])).toEqual([milestone])
    expect(restoreStringList(undefined)).toBeUndefined()
    expect(restoreStringList('us')).toBeUndefined()
    expect(restoreStringList({ length: 1, 0: 'us' })).toBeUndefined()
    expect(restoreStringList(['us', 3, null, 'eu'])).toEqual(['us', 'eu'])
    expect(restoreStringList([])).toEqual([])
  })
})
