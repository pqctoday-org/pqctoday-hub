// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CuriousOrientationView } from './CuriousOrientationView'

vi.mock('../../../hooks/useApplicabilityWithPaths', () => ({
  useApplicabilityWithPaths: () => ({
    profile: { industry: 'Healthcare', country: 'United States', region: 'na' as const },
    isEmpty: false,
    frameworks: [
      {
        item: {
          id: 'HIPAA',
          label: 'HIPAA',
          description: 'US health-data privacy & security rule',
          industries: ['Healthcare'],
          countries: ['United States'],
          requiresPQC: false,
          pqcRequirement: 'guidance' as const,
          deadline: 'ongoing',
          deadlinePhase: 'ongoing' as const,
          notes: '',
          enforcementBody: 'HHS',
          libraryRefs: [],
          timelineRefs: [],
          bodyType: 'compliance_framework' as const,
        },
        tier: 'mandatory',
        reason: 'US healthcare',
      },
    ],
    library: [],
    threats: [],
    timeline: [],
    droppedCounts: {
      frameworks: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
      library: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
      threats: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
      timeline: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
    },
    lens: { sections: [], tierCaps: {}, framing: '' },
    derivedFrameworks: [],
    allFrameworks: [],
  }),
}))

function renderView() {
  return render(
    <MemoryRouter>
      <CuriousOrientationView />
    </MemoryRouter>
  )
}

describe('CuriousOrientationView', () => {
  it('renders the plain-English explainer headline', () => {
    renderView()
    expect(screen.getByText(/What is compliance, in three minutes/)).toBeInTheDocument()
  })

  it('renders the 1-2-3 framing (rules → algorithms → deadlines)', () => {
    renderView()
    expect(screen.getByText('The rules')).toBeInTheDocument()
    expect(screen.getByText('The algorithms')).toBeInTheDocument()
    expect(screen.getByText('The deadlines')).toBeInTheDocument()
  })

  it('renders three cross-links to PQC 101, Threats, Timeline', () => {
    renderView()
    expect(screen.getByText(/Start with PQC 101/)).toBeInTheDocument()
    expect(screen.getByText(/See the quantum threats/)).toBeInTheDocument()
    expect(screen.getByText(/See national timelines/)).toBeInTheDocument()
  })

  it('renders the "What applies to you" section with the HIPAA card when profile non-empty', () => {
    renderView()
    expect(screen.getByText('What applies to you')).toBeInTheDocument()
    expect(screen.getByText('HIPAA')).toBeInTheDocument()
  })

  it('renders the assessment CTA link', () => {
    renderView()
    expect(screen.getByText(/Start the assessment/)).toBeInTheDocument()
  })
})
