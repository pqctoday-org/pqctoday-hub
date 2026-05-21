// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OpsRotationView } from './OpsRotationView'

vi.mock('../../../hooks/useApplicabilityWithPaths', () => ({
  useApplicabilityWithPaths: () => ({
    profile: { industry: 'Finance', country: 'United States', region: 'na' as const },
    isEmpty: false,
    frameworks: [
      {
        item: {
          id: 'CNSA-2',
          label: 'CNSA 2.0',
          description: 'NSA suite',
          industries: ['Finance', 'Government & Defense'],
          countries: ['United States'],
          requiresPQC: true,
          pqcRequirement: 'yes' as const,
          deadline: '2027',
          deadlinePhase: 'imminent' as const,
          notes: '',
          enforcementBody: 'NSA',
          libraryRefs: [],
          timelineRefs: [],
          bodyType: 'compliance_framework' as const,
        },
        tier: 'mandatory',
        reason: 'NSA mandate',
      },
      {
        item: {
          id: 'FIPS-140-3',
          label: 'FIPS 140-3',
          description: 'Crypto module validation',
          industries: ['Finance'],
          countries: ['United States'],
          requiresPQC: true,
          pqcRequirement: 'yes' as const,
          deadline: '2030',
          deadlinePhase: 'long' as const,
          notes: '',
          enforcementBody: 'NIST',
          libraryRefs: [],
          timelineRefs: [],
          bodyType: 'compliance_framework' as const,
        },
        tier: 'recognized',
        reason: 'NIST recognized in finance',
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
      <OpsRotationView />
    </MemoryRouter>
  )
}

describe('OpsRotationView', () => {
  it('renders the Rotation clock section header', () => {
    renderView()
    expect(screen.getByText('Rotation clock')).toBeInTheDocument()
  })

  it('buckets frameworks by deadlinePhase — imminent + long', () => {
    renderView()
    expect(screen.getByText(/Imminent/)).toBeInTheDocument()
    expect(screen.getByText(/Long term/)).toBeInTheDocument()
    // Each framework name renders twice — once in the clock bucket, once in
    // the deadlines table — so use getAllByText.
    expect(screen.getAllByText('CNSA 2.0').length).toBeGreaterThan(0)
    expect(screen.getAllByText('FIPS 140-3').length).toBeGreaterThan(0)
  })

  it('renders the Toolchain quick jumps with three links', () => {
    renderView()
    expect(screen.getByText('Toolchain quick jumps')).toBeInTheDocument()
    expect(screen.getByText('OpenSSL Studio')).toBeInTheDocument()
    expect(screen.getByText('PKI Workshop')).toBeInTheDocument()
    expect(screen.getByText('Migrate catalog')).toBeInTheDocument()
  })

  it('renders the framework deadlines table with both rows', () => {
    renderView()
    expect(screen.getByText('Framework deadlines')).toBeInTheDocument()
    // Both frameworks should appear in the table even after clock bucketing
    expect(screen.getAllByText('CNSA 2.0').length).toBeGreaterThan(0)
    expect(screen.getAllByText('FIPS 140-3').length).toBeGreaterThan(0)
  })
})
