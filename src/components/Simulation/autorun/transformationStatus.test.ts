// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { transformationStatus } from './transformationStatus'
import { getScenario } from './scenarioConfig'

const run = (migrationFraction: number, currentYear: number, p0Level = 2, allAtTopBand = false) =>
  transformationStatus({
    scenario: getScenario('US'),
    programMaturity: 2,
    p0Level,
    migrationFraction,
    allAtTopBand,
    currentYear,
  })

describe('transformationStatus', () => {
  it('at 0% migration: HNDL fully exposed, no migration tracks done', () => {
    const s = run(0, 2026)
    expect(s.hndlExposure).toBeCloseTo(1, 1)
    expect(s.tracks.every((t) => !t.done)).toBe(true)
  })

  it('at 50% migration: both critical tracks done → "critical assets protected" met', () => {
    const s = run(0.5, 2030)
    const crit = s.tracks.filter((t) => t.tier === 'critical')
    expect(crit.every((t) => t.done)).toBe(true)
    expect(s.objectives.find((o) => o.id === 'critical')!.done).toBe(true)
    // HNDL-critical (first quartile) is done; exposure has fallen below 1.
    expect(s.hndlExposure).toBeLessThan(0.6)
  })

  it('at 100% + all phases at top band: every track done, exposure ~0, migration complete', () => {
    const s = run(1, 2035, 2, true)
    expect(s.tracks.every((t) => t.done)).toBe(true)
    expect(s.hndlExposure).toBeCloseTo(0, 1)
    expect(s.objectives.find((o) => o.id === 'migration')!.done).toBe(true)
  })

  it('judges objectives on-time vs the scenario year (done vs done-late)', () => {
    expect(run(0.5, 2030).objectives.find((o) => o.id === 'critical')!.onTime).toBe('done') // by 2031
    expect(run(0.5, 2033).objectives.find((o) => o.id === 'critical')!.onTime).toBe('done-late')
    expect(run(0, 2026).objectives.find((o) => o.id === 'critical')!.onTime).toBe('in-progress')
    expect(run(0, 2033).objectives.find((o) => o.id === 'critical')!.onTime).toBe('late')
  })

  it('governance objective tracks P0 reaching level 2', () => {
    expect(run(0, 2027, 1).objectives.find((o) => o.id === 'governance')!.done).toBe(false)
    expect(run(0, 2027, 2).objectives.find((o) => o.id === 'governance')!.done).toBe(true)
  })
})
