// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AssessmentProfileSummary } from './AssessmentProfileSection'
import { TIMELINE_LABELS } from './reportContentShared'
import type { AssessmentProfile } from '@/hooks/assessmentTypes'

const baseProfile: AssessmentProfile = {
  industry: 'Finance & Banking',
  algorithmsSelected: ['RSA-2048'],
  algorithmUnknown: false,
  sensitivityLevels: ['high'],
  sensitivityUnknown: false,
  complianceFrameworks: [],
  complianceUnknown: false,
  migrationStatus: 'planning',
  migrationUnknown: false,
  mode: 'comprehensive',
  useCasesUnknown: false,
  retentionUnknown: false,
  credentialLifetimeUnknown: false,
  infrastructureUnknown: false,
  agilityUnknown: false,
  vendorUnknown: false,
  scaleUnknown: false,
  timelinePressure: 'internal-deadline',
  timelineUnknown: false,
}

const show = (profile: AssessmentProfile) =>
  render(<AssessmentProfileSummary profile={profile} defaultOpen />)

describe('assessment profile shows the chosen milestone', () => {
  it('names the milestone, its authority and year instead of the generic label', () => {
    show({
      ...baseProfile,
      timelineMilestone: {
        id: 'Sample migration deadline',
        authority: 'Sample Authority',
        year: 2035,
      },
    })
    expect(
      screen.getByText(
        'Distant external deadline: Sample migration deadline (Sample Authority), 2035'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(TIMELINE_LABELS['internal-deadline'])).not.toBeInTheDocument()
  })

  it('keeps the generic label when there is no pair', () => {
    show(baseProfile)
    expect(screen.getByText(TIMELINE_LABELS['internal-deadline'])).toBeInTheDocument()
    expect(screen.queryByText(/Distant external deadline/)).not.toBeInTheDocument()
  })

  it('falls back to the generic label, without crashing, for a pair of the wrong shape', () => {
    show({ ...baseProfile, timelineMilestone: { id: 7, authority: null } as never })
    expect(screen.getByText(TIMELINE_LABELS['internal-deadline'])).toBeInTheDocument()
  })

  it('leads with the usual label for a nearer deadline', () => {
    show({
      ...baseProfile,
      timelinePressure: 'within-2-3y',
      timelineMilestone: { id: 'Sample phase-out', authority: 'Sample Authority', year: 2028 },
    })
    expect(
      screen.getByText(
        `${TIMELINE_LABELS['within-2-3y']}: Sample phase-out (Sample Authority), 2028`
      )
    ).toBeInTheDocument()
  })
})
