// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  ALLOCATION_ROLE_ORDER,
  allocationMarkdown,
  assessTeamAllocation,
  editTeamAllocation,
  fteText,
  seedTeamAllocation,
  type TeamSizingContext,
} from './teamSizingModel'
const context = (n: number, production = false, ot = false): TeamSizingContext => ({
  estateInstances: String(n),
  sizingPhase: production ? 'production' : 'early',
  otInScope: ot,
})
describe('fictional staffing allocations', () => {
  it.each([
    [600, false, false, [50, 0, 25, 80, 27, 0, 13, 25], 120, 100, 220],
    [600, true, false, [50, 0, 25, 40, 13, 0, 7, 25], 60, 100, 160],
    [2000, false, false, [100, 0, 75, 267, 89, 0, 44, 75], 400, 250, 650],
    [2000, true, false, [100, 0, 75, 133, 45, 0, 22, 75], 200, 250, 450],
    [10500, false, false, [100, 0, 75, 1400, 467, 0, 233, 75], 2100, 250, 2350],
    [10500, true, false, [100, 0, 75, 700, 233, 0, 117, 75], 1050, 250, 1300],
    [2000, false, true, [100, 0, 75, 229, 76, 57, 38, 75], 400, 250, 650],
  ] as const)(
    'matches independently stated %s case (production=%s OT=%s)',
    (n, production, ot, expectedRows, delivery, coordination, total) => {
      const c = context(n, production, ot)
      const result = assessTeamAllocation(c, seedTeamAllocation(c))
      expect(result.status).toBe('ready')
      if (result.status !== 'ready') throw new Error(result.reason)
      expect(ALLOCATION_ROLE_ORDER.map((id) => result.rows[id])).toEqual(expectedRows)
      expect(result.delivery).toBe(delivery)
      expect(result.coordination).toBe(coordination)
      expect(result.total).toBe(total)
      expect(Object.values(result.rows).reduce((sum, value) => sum + value, 0)).toBe(total)
      expect(allocationMarkdown(c, seedTeamAllocation(c))).toContain(
        String.fromCharCode(10) + '| Role |'
      )
      expect(allocationMarkdown(c, seedTeamAllocation(c))).toContain(
        `Allocated programme total: ${fteText(total)} FTE`
      )
    }
  )
  it('keeps a ten-FTE sensitivity distinct from the uncapped ratio reference', () => {
    const c = context(10500)
    let draft = seedTeamAllocation(c)
    for (const [id, value] of [
      ['security-eng', '5'],
      ['appsec-lead', '1.67'],
      ['vendor-lead', '0.83'],
    ] as const)
      draft = editTeamAllocation(c, draft, id, value)
    const result = assessTeamAllocation(c, draft)
    expect(result).toMatchObject({
      status: 'ready',
      delivery: 750,
      coordination: 250,
      total: 1000,
      reference: 2100,
    })
    expect(allocationMarkdown(c, draft)).toContain(
      'Delivery difference from ratio reference: -13.5 FTE'
    )
    expect(allocationMarkdown(c, draft)).toContain('not a cap')
  })
  it('allows an explicit zero plan without confusing missing values with zero', () => {
    const c = context(600)
    let draft = seedTeamAllocation(c)
    for (const id of ALLOCATION_ROLE_ORDER) draft = editTeamAllocation(c, draft, id, '0')
    expect(assessTeamAllocation(c, draft)).toMatchObject({ status: 'ready', total: 0 })
    expect(assessTeamAllocation(c, editTeamAllocation(c, draft, 'qrpm', ''))).toMatchObject({
      status: 'incomplete',
    })
  })
  it.each(['-1', 'NaN', 'Infinity', '1.111', '1e2', 'junk'])(
    'rejects invalid fractional allocation %s',
    (value) => {
      const c = context(600)
      expect(
        assessTeamAllocation(c, editTeamAllocation(c, seedTeamAllocation(c), 'qrpm', value)).status
      ).toBe('invalid')
    }
  )
  it.each(['', '600junk', '2.5', '-1', '0', '9007199254740992'])(
    'rejects invalid estate input %s',
    (estateInstances) => {
      const c = { ...context(600), estateInstances }
      expect(seedTeamAllocation(c)).toBeNull()
      expect(assessTeamAllocation(c, null).status).toBe('incomplete')
    }
  )
  it('preserves exact rounding and display at safe integer boundaries', () => {
    const c = context(Number.MAX_SAFE_INTEGER)
    const result = assessTeamAllocation(c, seedTeamAllocation(c))
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') throw new Error(result.reason)
    expect(BigInt(result.delivery)).toBe((BigInt(Number.MAX_SAFE_INTEGER) * 100n + 250n) / 500n)
    expect(fteText(Number.MAX_SAFE_INTEGER)).toBe('90071992547409.91')
    expect(fteText(-1350)).toBe('-13.5')
    expect(fteText(1000)).toBe('10')
  })
  it('keeps threshold conventions explicit and rejects mismatched or malformed saved drafts', () => {
    expect(assessTeamAllocation(context(999), seedTeamAllocation(context(999)))).toMatchObject({
      coordination: 100,
    })
    expect(assessTeamAllocation(context(1000), seedTeamAllocation(context(1000)))).toMatchObject({
      coordination: 250,
    })
    expect(assessTeamAllocation(context(600), seedTeamAllocation(context(2000))).status).toBe(
      'incomplete'
    )
    expect(
      assessTeamAllocation(context(600), { context: '600|early|false', rows: { qrpm: 0 } }).status
    ).toBe('incomplete')
    expect(
      assessTeamAllocation(
        context(600),
        editTeamAllocation(context(600), seedTeamAllocation(context(600)), 'exec-sponsor', '1')
      ).status
    ).toBe('invalid')
  })
})
