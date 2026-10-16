// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  nextMilestoneIn,
  findCountryNextMilestone,
  upcomingMilestonesIn,
  findCountryMilestoneGroups,
} from './countryMilestone'
import type { GanttCountryData, TimelineEvent } from '../../types/timeline'

function ev(startYear: number, title: string, extra: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    startYear,
    endYear: startYear,
    phase: 'Deadline',
    type: 'Milestone',
    title,
    description: '',
    entityType: 'Government',
    ...extra,
  } as TimelineEvent
}

function country(name: string, events: TimelineEvent[]): GanttCountryData {
  return {
    country: { countryName: name, flagCode: 'xx', bodies: [] },
    phases: [
      {
        startYear: 0,
        endYear: 0,
        phase: 'Deadline',
        type: 'Milestone',
        title: '',
        description: '',
        events,
      },
    ],
  }
}

describe('nextMilestoneIn', () => {
  it('skips milestones in past years instead of taking the earliest row', () => {
    const data = [country('Testland', [ev(2025, 'Not before 2025'), ev(2030, 'Key establishment')])]
    expect(nextMilestoneIn(data, 'Testland', 2026)).toMatchObject({
      year: 2030,
      title: 'Key establishment',
    })
  })

  it('ignores rows outside the Deadline category', () => {
    const data = [
      country('Testland', [
        ev(2027, 'Guidance note', { phase: 'Guidance' }),
        ev(2031, 'Signatures'),
      ]),
    ]
    expect(nextMilestoneIn(data, 'Testland', 2026)?.year).toBe(2031)
  })

  it('labels a row binding only when it is curated HARD', () => {
    const data = [country('Testland', [ev(2030, 'Target', { mandateType: 'SOFT' })])]
    expect(nextMilestoneIn(data, 'Testland', 2026)?.binding).toBe(false)
    const hard = [country('Testland', [ev(2030, 'Law', { mandateType: 'HARD' })])]
    expect(nextMilestoneIn(hard, 'Testland', 2026)?.binding).toBe(true)
  })

  it('prefers a binding row over guidance in the same year', () => {
    const data = [
      country('Testland', [
        ev(2030, 'Target', { mandateType: 'SOFT' }),
        ev(2030, 'Law', { mandateType: 'HARD' }),
      ]),
    ]
    expect(nextMilestoneIn(data, 'Testland', 2026)?.title).toBe('Law')
  })

  it('returns null when nothing is upcoming or the country is unknown', () => {
    expect(nextMilestoneIn([country('Testland', [ev(2024, 'Old')])], 'Testland', 2026)).toBeNull()
    expect(nextMilestoneIn([], 'Nowhere', 2026)).toBeNull()
  })
})

describe('findCountryNextMilestone on the shipped timeline', () => {
  it('never returns a past year for the United States', () => {
    const m = findCountryNextMilestone('United States')
    expect(m).not.toBeNull()
    expect(m!.year).toBeGreaterThanOrEqual(new Date().getFullYear())
  })
})

describe('upcomingMilestonesIn', () => {
  it('groups upcoming milestones by issuing body and drops past years', () => {
    const data = [
      country('Testland', [
        ev(2025, 'Not before', { orgName: 'Agency' } as Partial<TimelineEvent>),
        ev(2031, 'Signatures', {
          orgName: 'Agency',
          mandateType: 'HARD',
        } as Partial<TimelineEvent>),
        ev(2030, 'Key establishment', {
          orgName: 'Agency',
          mandateType: 'HARD',
        } as Partial<TimelineEvent>),
        ev(2033, 'Web and cloud', {
          orgName: 'Security service',
          mandateType: 'SOFT',
        } as Partial<TimelineEvent>),
      ]),
    ]
    const groups = upcomingMilestonesIn(data, 'Testland', 2026)
    expect(groups.map((g) => g.body)).toEqual(['Agency', 'Security service'])
    expect(groups[0].milestones.map((m) => m.year)).toEqual([2030, 2031])
    expect(groups[1].milestones[0]).toMatchObject({ year: 2033, binding: false })
  })

  it('lists a binding row before guidance in the same year, and each row once', () => {
    const data = [
      country('Testland', [
        ev(2030, 'Target', { orgName: 'A', mandateType: 'SOFT' } as Partial<TimelineEvent>),
        ev(2030, 'Law', { orgName: 'A', mandateType: 'HARD' } as Partial<TimelineEvent>),
        ev(2030, 'Law', { orgName: 'A', mandateType: 'HARD' } as Partial<TimelineEvent>),
      ]),
    ]
    expect(upcomingMilestonesIn(data, 'Testland', 2026)[0].milestones.map((m) => m.title)).toEqual([
      'Law',
      'Target',
    ])
  })

  it('is empty for an unknown country or one with nothing upcoming', () => {
    expect(upcomingMilestonesIn([], 'Nowhere', 2026)).toEqual([])
    expect(
      upcomingMilestonesIn([country('Testland', [ev(2024, 'Old')])], 'Testland', 2026)
    ).toEqual([])
  })
})

describe('findCountryMilestoneGroups on the shipped timeline', () => {
  it('names more than one body for the United States, none with a past year', () => {
    const groups = findCountryMilestoneGroups('United States')
    expect(groups.length).toBeGreaterThan(1)
    const year = new Date().getFullYear()
    expect(groups.flatMap((g) => g.milestones).every((m) => m.year >= year)).toBe(true)
  })
})
