// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'

/**
 * The "help me choose" compliance defaults keep a framework for every industry when its
 * reviewed all-sector answer is yes, and drop it for an industry outside its tags when the
 * answer is no, however many tags it carries. A blank answer keeps the older tag count.
 * The frameworks below stand in for the catalogue so the cells can be filled in.
 */
vi.mock('../../data/complianceData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/complianceData')>()
  const threeTags = ['Government & Defense', 'Information Technology', 'Finance & Insurance']
  const make = (
    id: string,
    industries: string[],
    allSectorsReviewed?: boolean
  ): (typeof actual.complianceFrameworks)[number] => ({
    id,
    label: `Fixture ${id}`,
    description: '',
    industries,
    countries: ['Global'],
    requiresPQC: true,
    pqcRequirement: 'yes',
    deadline: 'By 2030',
    deadlinePhase: 'near',
    notes: '',
    enforcementBody: '',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'compliance_framework',
    allSectorsReviewed,
  })
  return {
    ...actual,
    complianceFrameworks: [
      make('YES-ONE-TAG', ['Finance & Insurance'], true),
      make('NO-THREE-TAGS', threeTags, false),
      make('BLANK-THREE-TAGS', threeTags),
      make('BLANK-ONE-TAG', ['Finance & Insurance']),
    ],
  }
})

import { computeSmartDefaults } from './smartDefaults'

describe('computeSmartDefaults — compliance defaults follow the reviewed all-sector answer', () => {
  const picked = computeSmartDefaults('Healthcare', '', null).complianceRequirements

  it('keeps a yes with a single tag for an industry outside it', () => {
    expect(picked).toContain('Fixture YES-ONE-TAG')
  })

  it('drops a no with three tags for an industry outside them', () => {
    expect(picked).not.toContain('Fixture NO-THREE-TAGS')
  })

  it('keeps the tag count while the answer is blank', () => {
    expect(picked).toContain('Fixture BLANK-THREE-TAGS')
    expect(picked).not.toContain('Fixture BLANK-ONE-TAG')
  })

  it('still keeps every record for an industry named in its tags', () => {
    const finance = computeSmartDefaults('Finance & Insurance', '', null).complianceRequirements
    expect(finance).toEqual(
      expect.arrayContaining([
        'Fixture YES-ONE-TAG',
        'Fixture NO-THREE-TAGS',
        'Fixture BLANK-THREE-TAGS',
        'Fixture BLANK-ONE-TAG',
      ])
    )
  })
})
