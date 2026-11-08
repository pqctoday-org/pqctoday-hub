// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'

/**
 * The report filter and the wizard filter keep a selected framework for every industry when
 * its reviewed all-sector answer is yes, and only for the industries it names when the answer
 * is no, however many it names. A blank answer keeps the older tag count. The configuration
 * below stands in for the catalogue so the answers can be filled in.
 */
vi.mock('../../data/industryAssessConfig', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/industryAssessConfig')>()
  const threeTags = ['Government & Defense', 'Information Technology', 'Finance & Insurance']
  const make = (id: string, industries: string[], allSectorsReviewed?: boolean) => ({
    category: 'compliance' as const,
    id,
    label: id,
    description: '',
    industries,
    countries: ['Global'],
    complianceDeadline: '2030',
    complianceNotes: '',
    allSectorsReviewed,
  })
  return {
    ...actual,
    industryComplianceConfigs: [
      make('YES-ONE-TAG', ['Finance & Insurance'], true),
      make('NO-THREE-TAGS', threeTags, false),
      make('BLANK-THREE-TAGS', threeTags),
      make('BLANK-ONE-TAG', ['Finance & Insurance']),
    ],
  }
})

import { filterComplianceRequirements, splitComplianceRequirements } from './complianceFilter'

const ALL = ['YES-ONE-TAG', 'NO-THREE-TAGS', 'BLANK-THREE-TAGS', 'BLANK-ONE-TAG']

describe('splitComplianceRequirements — the reviewed all-sector answer', () => {
  it('for an industry outside every tag: keeps yes and a blank with three tags, omits no and a blank with one', () => {
    const { kept, omitted } = splitComplianceRequirements(ALL, 'Healthcare', 'United States')
    expect(kept).toEqual(['YES-ONE-TAG', 'BLANK-THREE-TAGS'])
    expect(omitted).toEqual(['NO-THREE-TAGS', 'BLANK-ONE-TAG'])
  })

  it('for an industry named in the tags: keeps all four', () => {
    expect(filterComplianceRequirements(ALL, 'Finance & Banking', 'United States')).toEqual(ALL)
  })
})
