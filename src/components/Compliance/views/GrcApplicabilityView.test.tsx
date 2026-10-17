// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { GrcApplicabilityView } from './GrcApplicabilityView'

vi.mock('../../../hooks/useApplicabilityWithPaths', () => ({
  useApplicabilityWithPaths: () => ({
    profile: { industry: 'Finance & Banking', country: 'United States', region: 'na' as const },
    isEmpty: false,
    frameworks: [
      {
        item: {
          id: 'FIPS-203',
          label: 'FIPS 203 ML-KEM',
          description: 'NIST KEM standard',
          industries: ['Finance & Banking', 'Government & Defense'],
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
          confidenceScore: 90,
        },
        tier: 'mandatory',
        reason: 'NIST mandate',
      },
      {
        item: {
          id: 'ETSI-QSC',
          label: 'ETSI QSC TR 103',
          description: 'European PQC guidance',
          industries: ['Finance & Banking'],
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
          confidenceScore: 30,
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
      <GrcApplicabilityView />
    </MemoryRouter>
  )
}

describe('GrcApplicabilityView', () => {
  it('renders the Recent revisions section', () => {
    renderView()
    expect(screen.getByText('Recent revisions')).toBeInTheDocument()
  })

  it('renders the applicability review queue', () => {
    renderView()
    expect(screen.getByText('Applicability review queue')).toBeInTheDocument()
  })

  it('renders both applicable frameworks', () => {
    renderView()
    expect(screen.getByText('FIPS 203 ML-KEM')).toBeInTheDocument()
    expect(screen.getByText('ETSI QSC TR 103')).toBeInTheDocument()
  })

  it('sorts frameworks by confidenceScore ascending (ETSI QSC, the weaker-evidenced row, first)', () => {
    renderView()
    // ETSI-QSC has confidenceScore 30, FIPS-203 has 90 — the view leads with
    // the weakest-evidenced row, the opposite of ResearcherEvidenceView, per
    // the same "review this against the source first" framing the GRC
    // obligations-register lens already uses (roleLens.ts).
    const fips = screen.getByText('FIPS 203 ML-KEM')
    const etsi = screen.getByText('ETSI QSC TR 103')
    const body = document.body.textContent ?? ''
    expect(body.indexOf('ETSI QSC TR 103')).toBeLessThan(body.indexOf('FIPS 203 ML-KEM'))
    expect(fips).toBeInTheDocument()
    expect(etsi).toBeInTheDocument()
  })

  it('never applies Executive-style browsing caps — every framework in the applicable set renders', () => {
    renderView()
    // GRC's obligation register must never hide a row the engine says binds
    // the reader — the same invariant obligations/roleLens.ts enforces.
    expect(screen.getByText('FIPS 203 ML-KEM')).toBeInTheDocument()
    expect(screen.getByText('ETSI QSC TR 103')).toBeInTheDocument()
  })
})
