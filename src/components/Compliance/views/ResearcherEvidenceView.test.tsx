// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResearcherEvidenceView } from './ResearcherEvidenceView'

vi.mock('../../../hooks/useApplicabilityWithPaths', () => ({
  useApplicabilityWithPaths: () => ({
    profile: { industry: 'Research', country: 'United States', region: 'na' as const },
    isEmpty: false,
    frameworks: [
      {
        item: {
          id: 'FIPS-203',
          label: 'FIPS 203 ML-KEM',
          description: 'NIST KEM standard',
          industries: ['Research', 'Government & Defense'],
          countries: ['United States'],
          requiresPQC: true,
          pqcRequirement: 'yes' as const,
          deadline: '2027',
          deadlinePhase: 'imminent' as const,
          notes: '',
          enforcementBody: 'NIST',
          libraryRefs: [],
          timelineRefs: [],
          bodyType: 'compliance_framework' as const,
          confidenceScore: 0.9,
        },
        tier: 'mandatory',
        reason: 'NIST mandate',
      },
      {
        item: {
          id: 'ETSI-QSC',
          label: 'ETSI QSC TR 103',
          description: 'European PQC guidance',
          industries: ['Research'],
          countries: ['United States'],
          requiresPQC: true,
          pqcRequirement: 'guidance' as const,
          deadline: '2026',
          deadlinePhase: 'imminent' as const,
          notes: '',
          enforcementBody: 'ETSI',
          libraryRefs: [],
          timelineRefs: [],
          bodyType: 'compliance_framework' as const,
          confidenceScore: 0.7,
        },
        tier: 'advisory',
        reason: 'ETSI guidance',
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
      <ResearcherEvidenceView />
    </MemoryRouter>
  )
}

describe('ResearcherEvidenceView', () => {
  it('renders the Recent revisions section', () => {
    renderView()
    expect(screen.getByText('Recent revisions')).toBeInTheDocument()
  })

  it('renders the Applicable frameworks section', () => {
    renderView()
    expect(screen.getByText('Applicable frameworks')).toBeInTheDocument()
  })

  it('renders both applicable frameworks', () => {
    renderView()
    expect(screen.getByText('FIPS 203 ML-KEM')).toBeInTheDocument()
    expect(screen.getByText('ETSI QSC TR 103')).toBeInTheDocument()
  })

  it('sorts frameworks by confidenceScore descending (FIPS 203 first)', () => {
    renderView()
    // FIPS-203 has confidenceScore 0.9, ETSI-QSC has 0.7 — assert order in DOM
    const fips = screen.getByText('FIPS 203 ML-KEM')
    const etsi = screen.getByText('ETSI QSC TR 103')
    // Both must be in DOM (already asserted above); the indexOf in textContent
    // ensures FIPS precedes ETSI in document order.
    const body = document.body.textContent ?? ''
    expect(body.indexOf('FIPS 203 ML-KEM')).toBeLessThan(body.indexOf('ETSI QSC TR 103'))
    expect(fips).toBeInTheDocument()
    expect(etsi).toBeInTheDocument()
  })
})
