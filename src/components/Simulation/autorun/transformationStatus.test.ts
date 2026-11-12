// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { transformationStatus, type StatusInput } from './transformationStatus'
import { getScenario } from './scenarioConfig'
import type { PlanningGroupId, PlanningGroupProgress } from '@/simulation/edgePlanningProgress'

const ids: PlanningGroupId[] = ['hndl-critical', 'tnfl-critical', 'hndl-general', 'tnfl-general']
function groups(completed: PlanningGroupId[] = []): StatusInput['planningGroups'] {
  const group = (id: PlanningGroupId): PlanningGroupProgress => ({
    requiredKeys: [`${id}-1`, `${id}-2`],
    completedKeys: completed.includes(id) ? [`${id}-1`, `${id}-2`] : [],
    progress: completed.includes(id) ? 1 : 0,
    done: completed.includes(id),
  })
  return {
    'hndl-critical': group('hndl-critical'),
    'tnfl-critical': group('tnfl-critical'),
    'hndl-general': group('hndl-general'),
    'tnfl-general': group('tnfl-general'),
  }
}
const run = (planningGroups = groups(), extra: Partial<StatusInput> = {}) =>
  transformationStatus({
    scenario: getScenario('US'),
    programMaturity: 2,
    p0Level: 2,
    planningGroups,
    allAtTopBand: false,
    currentYear: 2030,
    ...extra,
  })
const objective = (status: ReturnType<typeof run>, id = 'critical') =>
  status.objectives.find((o) => o.id === id)!

describe('named sample planning status', () => {
  it('starts assessed groups at zero without completing any track', () => {
    const status = run()
    expect(status.hndlExposure).toBe(1)
    expect(status.tracks.every((t) => !t.done && t.progress === 0)).toBe(true)
    expect(status.tracks.every((t) => t.completedCount === 0 && t.requiredCount === 2)).toBe(true)
  })
  it('distinguishes equal overall counts spent on general versus critical links', () => {
    const general = run(groups(['hndl-general', 'tnfl-general']))
    const critical = run(groups(['hndl-critical', 'tnfl-critical']))
    expect(objective(general).done).toBe(false)
    expect(objective(critical).done).toBe(true)
    expect(general.hndlExposure).toBeCloseTo(0.7)
    expect(critical.hndlExposure).toBeCloseTo(0.3)
    expect(general.tracks.find((t) => t.id === 'hndl-critical')?.progress).toBe(0)
  })
  it('keeps confidentiality and authenticity completion separate', () => {
    const confidentiality = run(groups(['hndl-critical', 'hndl-general']))
    const authenticity = run(groups(['tnfl-critical', 'tnfl-general']))
    expect(objective(confidentiality).done).toBe(false)
    expect(objective(authenticity).done).toBe(false)
    expect(confidentiality.hndlExposure).toBe(0)
    expect(authenticity.hndlExposure).toBe(1)
  })
  it('reports actual partial counts and the existing confidentiality weights', () => {
    const input = groups()
    input['hndl-critical'] = {
      ...input['hndl-critical'],
      completedKeys: ['hndl-critical-1'],
      progress: 0.5,
    }
    const status = run(input)
    expect(status.tracks[0]).toMatchObject({
      progress: 0.5,
      completedCount: 1,
      requiredCount: 2,
      done: false,
    })
    expect(status.hndlExposure).toBeCloseTo(0.65)
  })
  it.each([
    undefined,
    {},
    Object.fromEntries(
      ids.map((id) => [id, { requiredKeys: [], completedKeys: [], progress: null, done: false }])
    ),
  ])('keeps missing or empty groups unassessed: %j', (input) => {
    // Deliberately cross the typed boundary to exercise absent/incomplete runtime records.
    const status = run(groups(), {
      planningGroups: input as unknown as StatusInput['planningGroups'],
    })
    expect(status.tracks.every((t) => t.progress === null && !t.done)).toBe(true)
    expect(status.hndlExposure).toBeNull()
    expect(objective(status).done).toBe(false)
  })
  it.each([
    { requiredKeys: [], completedKeys: [], progress: 1, done: true },
    { requiredKeys: ['a'], completedKeys: ['other'], progress: 1, done: true },
    { requiredKeys: ['a', 'a'], completedKeys: ['a'], progress: 0.5, done: false },
    { requiredKeys: ['a'], completedKeys: ['a', 'a'], progress: 1, done: true },
    { requiredKeys: ['a'], completedKeys: [], progress: NaN, done: false },
    { requiredKeys: ['a'], completedKeys: [], progress: 1, done: true },
    { requiredKeys: ['a'], completedKeys: ['a'], progress: 1, done: false },
    { requiredKeys: ['a'], completedKeys: [], progress: null, done: false },
  ])('rejects inconsistent runtime critical input: %j', (invalid) => {
    const input = groups(ids)
    input['hndl-critical'] = invalid as PlanningGroupProgress
    const status = run(input)
    expect(status.tracks[0]).toMatchObject({
      progress: null,
      done: false,
      requiredCount: null,
      completedCount: null,
    })
    expect(objective(status).done).toBe(false)
    expect(status.hndlExposure).toBeNull()
    expect(status.tracks.find((t) => t.id === 'tnfl-critical')?.done).toBe(true)
  })
  it.each([
    { requiredKeys: new Array(1), completedKeys: new Array(1), progress: 1, done: true },
    { requiredKeys: ['a'], completedKeys: new Array(1), progress: 1, done: true },
    { requiredKeys: new Array(1), completedKeys: [], progress: 0, done: false },
  ])('leaves sparse key arrays unassessed: %j', (invalid) => {
    const input = groups(ids)
    input['hndl-critical'] = invalid
    const status = run(input)
    expect(status.tracks[0]).toMatchObject({ progress: null, done: false })
    expect(objective(status).done).toBe(false)
    expect(status.hndlExposure).toBeNull()
  })
  it('keeps a missing required critical group unassessed when other groups are complete', () => {
    const input = groups(ids)
    delete (input as Partial<StatusInput['planningGroups']>)['tnfl-critical']
    const status = run(input)
    expect(objective(status).done).toBe(false)
    expect(status.tracks.find((t) => t.id === 'tnfl-critical')?.progress).toBeNull()
    expect(status.hndlExposure).toBe(0)
  })
  it('does not use a scenario with no tracks to award critical completion', () => {
    const status = run(groups(), { scenario: { ...getScenario('US'), tracks: [] } })
    expect(objective(status).done).toBe(false)
  })
  it('preserves governance, maturity and final ceremony predicates independently of groups', () => {
    const status = run({} as StatusInput['planningGroups'], {
      p0Level: 1,
      programMaturity: 3.25,
      allAtTopBand: true,
    })
    expect(status.maturity).toBe(3.25)
    expect(objective(status, 'governance').done).toBe(false)
    expect(objective(status, 'migration').done).toBe(true)
    expect(objective(run(groups(), { p0Level: 2 }), 'governance').done).toBe(true)
    expect(objective(run(groups(ids)), 'migration').done).toBe(false)
    expect(objective(status).label).toBe('Critical sample planning complete')
  })
})

describe('milestone history', () => {
  it('keeps on-time and late achievement judgments stable as the clock advances', () => {
    for (const [achieved, expected] of [
      [2030, 'done'],
      [2033, 'done-late'],
    ] as const) {
      for (const currentYear of [2033, 2040]) {
        expect(
          objective(
            run(groups(ids), { currentYear, objectiveAchievedYears: { critical: achieved } })
          ).onTime
        ).toBe(expected)
      }
    }
  })
  it.each([undefined, NaN, Infinity])('does not invent unknown achievement timing: %s', (year) => {
    expect(
      objective(
        run(groups(ids), {
          objectiveAchievedYears: year === undefined ? undefined : { critical: year },
        })
      ).onTime
    ).toBe('done-unknown')
  })
  it('preserves unmet on-time/late target judgments and scenario dates', () => {
    expect(objective(run(groups(), { currentYear: 2026 })).onTime).toBe('in-progress')
    expect(objective(run(groups(), { currentYear: 2040 })).onTime).toBe('late')
    expect(run().tracks.map((t) => t.year)).toEqual(getScenario('US').tracks.map((t) => t.year))
    expect(run().objectives.map((o) => o.byYear)).toEqual(
      getScenario('US').objectives.map((o) => o.byYear)
    )
  })
})
