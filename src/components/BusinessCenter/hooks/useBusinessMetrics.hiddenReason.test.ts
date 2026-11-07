// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  describeHiddenReason,
  selectApplicableFrameworks,
  type TrackedFramework,
} from './useBusinessMetrics'

/**
 * The line the Business Center prints for a framework it hides must follow the same
 * all-sector rule the applicability engine used to hide it: a reviewed answer first, then the
 * sector-tag count only while the answer is blank.
 */
function tracked(overrides: Partial<TrackedFramework> = {}): TrackedFramework {
  return {
    id: 'TEST',
    label: 'Test Framework',
    description: '',
    industries: [],
    countries: ['United States'],
    requiresPQC: true,
    pqcRequirement: 'yes',
    deadline: 'Ongoing',
    deadlinePhase: 'ongoing',
    notes: '',
    enforcementBody: 'Test',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'compliance_framework',
    daysUntilDeadline: null,
    urgency: 'unknown',
    source: 'compliance',
    applicability: null,
    ...overrides,
  } as TrackedFramework
}

const THREE_TAGS = ['Government & Defense', 'Information Technology', 'Finance & Insurance']
const HEALTHCARE = 'Healthcare & Life Sciences'

describe('describeHiddenReason — the reviewed all-sector answer', () => {
  it('a "no" answer with three sector tags is an industry mismatch for a sector outside them', () => {
    const reason = describeHiddenReason(
      tracked({ industries: THREE_TAGS, allSectorsReviewed: false }),
      HEALTHCARE,
      'United States'
    )
    expect(reason).toContain('industry mismatch')
    expect(reason).not.toBe('not applicable to your profile')
  })

  it('a blank answer with three sector tags still covers every sector, so it is no industry mismatch', () => {
    const reason = describeHiddenReason(
      tracked({ industries: THREE_TAGS }),
      HEALTHCARE,
      'United States'
    )
    expect(reason).not.toContain('industry mismatch')
  })

  it('a "yes" answer with one sector tag covers every sector, so only the country can be the reason', () => {
    const reason = describeHiddenReason(
      tracked({
        industries: ['Finance & Insurance'],
        allSectorsReviewed: true,
        countries: ['Japan'],
      }),
      HEALTHCARE,
      'United States'
    )
    expect(reason).toBe('applies to Japan only (country mismatch)')
  })

  it('a blank answer with one sector tag is an industry mismatch', () => {
    const reason = describeHiddenReason(
      tracked({ industries: ['Finance & Insurance'] }),
      HEALTHCARE,
      'United States'
    )
    expect(reason).toBe('Finance & Insurance framework (industry mismatch)')
  })

  it('names both dimensions when country and sector both fail', () => {
    const reason = describeHiddenReason(
      tracked({ industries: THREE_TAGS, allSectorsReviewed: false, countries: ['Japan'] }),
      HEALTHCARE,
      'United States'
    )
    expect(reason).toBe('country + industry mismatch')
  })

  it('keeps GDPR a whole-economy framework while its cell is blank, even with one tag', () => {
    const gdpr = tracked({ id: 'GDPR', industries: ['Finance & Insurance'] })
    expect(describeHiddenReason(gdpr, HEALTHCARE, 'United States')).not.toContain(
      'industry mismatch'
    )
    // ...and a filled "no" overrides that list
    expect(
      describeHiddenReason({ ...gdpr, allSectorsReviewed: false }, HEALTHCARE, 'United States')
    ).toContain('industry mismatch')
  })
})

describe('selectApplicableFrameworks — hidden entries carry the same reason', () => {
  it('lists a hidden "no" framework with the industry reason and counts it once', () => {
    const hiddenNo = tracked({
      id: 'NO-3-TAGS',
      label: 'Three-tag, reviewed no',
      industries: THREE_TAGS,
      allSectorsReviewed: false,
    })
    const shown = tracked({
      id: 'SHOWN',
      applicability: { tier: 'recognized', reason: 'matches' },
    })
    const view = selectApplicableFrameworks([hiddenNo, shown], HEALTHCARE, 'United States')
    expect(view.visible.map((f) => f.id)).toEqual(['SHOWN'])
    expect(view.hiddenCount).toBe(1)
    expect(view.hidden).toHaveLength(1)
    expect(view.hidden[0].id).toBe('NO-3-TAGS')
    expect(view.hidden[0].reason).toContain('industry mismatch')
  })
})
