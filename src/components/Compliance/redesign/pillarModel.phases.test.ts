// SPDX-License-Identifier: AGPL-3.0-only
//
// The "Deadline phases" steps in the record drawer show what the record
// states and nothing more. A record with no structured date must not be given
// an "Adopted" or "In force" phase, and a dated draft, advisory target or
// scheme must not become a published-then-active sequence ending in a
// "PQC deadline".
import { describe, it, expect } from 'vitest'
import { buildDrawerDetail, NO_STRUCTURED_DATE_LABEL, type PillarId } from './pillarModel'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'

function framework(overrides: Partial<ComplianceFramework>): ComplianceFramework {
  return {
    id: 'test-framework',
    label: 'Test Framework',
    description: '',
    industries: ['Technology'],
    countries: ['United States'],
    requiresPQC: false,
    pqcRequirement: 'guidance',
    deadline: 'Ongoing',
    deadlinePhase: 'ongoing',
    notes: '',
    enforcementBody: 'Test Body',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'compliance_framework',
    ...overrides,
  }
}

const INVENTED = /^(adopted|in force|maintained|published|active|pqc deadline)$/i
const PILLARS: PillarId[] = ['standardize', 'certify', 'comply']

describe('buildDrawerDetail phases', () => {
  it('shows only "no structured date recorded" for an undated record, whatever its status', () => {
    for (const bindingStatus of [
      'draft',
      'recommendation',
      'official_target',
      'binding',
    ] as const) {
      for (const pillar of PILLARS) {
        const d = buildDrawerDetail(
          framework({ bindingStatus, deadlineKind: 'ongoing', deadlineDates: [] }),
          pillar
        )
        expect(d.phases).toEqual([
          { year: '—', label: NO_STRUCTURED_DATE_LABEL, state: 'recorded' },
        ])
      }
    }
  })

  it('does not turn a year read from prose into a "PQC deadline" step', () => {
    // deadlineYear can come from the free-text deadline when no structured
    // milestone exists; it is not a recorded milestone.
    const d = buildDrawerDetail(
      framework({ deadline: 'Target 2035', deadlineYear: 2035, deadlineDates: undefined }),
      'comply'
    )
    expect(d.phases.map((ph) => ph.label)).toEqual([NO_STRUCTURED_DATE_LABEL])
    expect(d.phases.map((ph) => ph.year)).not.toContain('2035')
  })

  it('renders each recorded milestone with its own label and marks none as done or in force', () => {
    const d = buildDrawerDetail(
      framework({
        pqcRequirement: 'guidance',
        bindingStatus: 'official_target',
        deadlineYear: 2030,
        deadlineDates: [
          { year: 2030, label: 'deprecate' },
          { year: 2035, label: 'disallow' },
        ],
      }),
      'comply'
    )
    expect(d.phases).toEqual([
      { year: '2030', label: 'deprecate', state: 'recorded' },
      { year: '2035', label: 'disallow', state: 'recorded' },
    ])
  })

  it('keeps a recorded date that has no label without inventing a name for it', () => {
    const d = buildDrawerDetail(framework({ deadlineDates: [{ year: 2024, label: '' }] }), 'comply')
    expect(d.phases).toHaveLength(1)
    expect(d.phases[0].year).toBe('2024')
    expect(d.phases[0].label).not.toMatch(INVENTED)
    expect(d.phases[0].state).toBe('recorded')
  })

  it('shows exactly the recorded years for every record in the register', () => {
    for (const fw of complianceFrameworks) {
      const { phases } = buildDrawerDetail(fw, 'comply')
      const years = (fw.deadlineDates ?? []).map((x) => String(x.year))
      expect(
        phases.map((ph) => ph.year),
        fw.id
      ).toEqual(years.length > 0 ? years : ['—'])
      expect(
        phases.every((ph) => ph.state === 'recorded'),
        fw.id
      ).toBe(true)
      const recordedLabels = (fw.deadlineDates ?? []).map((x) => x.label.toLowerCase())
      for (const ph of phases) {
        if (INVENTED.test(ph.label)) expect(recordedLabels, fw.id).toContain(ph.label.toLowerCase())
      }
    }
  })
})
