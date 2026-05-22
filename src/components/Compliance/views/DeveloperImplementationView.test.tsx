// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DeveloperImplementationView } from './DeveloperImplementationView'

vi.mock('../../../hooks/useApplicabilityWithPaths', () => ({
  useApplicabilityWithPaths: () => ({
    profile: { industry: 'Technology', country: 'United States', region: 'na' as const },
    isEmpty: false,
    frameworks: [
      {
        item: {
          id: 'FIPS-203',
          label: 'FIPS 203 ML-KEM',
          description: 'NIST KEM standard',
          industries: ['Technology'],
          countries: ['United States'],
          requiresPQC: true,
          pqcRequirement: 'yes' as const,
          deadline: '2027',
          deadlinePhase: 'imminent' as const,
          notes: '',
          enforcementBody: 'NIST',
          libraryRefs: ['RFC-9180', 'FIPS-203'],
          timelineRefs: [],
          bodyType: 'compliance_framework' as const,
        },
        tier: 'mandatory',
        reason: 'Direct NIST mandate',
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
      <DeveloperImplementationView />
    </MemoryRouter>
  )
}

describe('DeveloperImplementationView', () => {
  it('renders the Algorithm Coverage section header', () => {
    renderView()
    expect(screen.getByText('Algorithm coverage')).toBeInTheDocument()
  })

  it('renders the Implementation jump bar with three tools', () => {
    renderView()
    expect(screen.getByText('Implementation jump bar')).toBeInTheDocument()
    expect(screen.getByText('OpenSSL Studio')).toBeInTheDocument()
    expect(screen.getByText('PKI Workshop')).toBeInTheDocument()
    expect(screen.getByText('JOSE / JWT Workshop')).toBeInTheDocument()
  })

  it('renders the Standards → implementation section with applicable framework', () => {
    renderView()
    expect(screen.getByText(/Standards.*implementation docs/i)).toBeInTheDocument()
    expect(screen.getByText('FIPS 203 ML-KEM')).toBeInTheDocument()
  })
})
