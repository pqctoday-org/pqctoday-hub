// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { GrcApplicabilityView } from './GrcApplicabilityView'

const feedProps = vi.hoisted(() => [] as Array<{ defaultCollapsed?: boolean }>)
vi.mock('@/components/ui/ContentUpdatesFeed', () => ({
  ContentUpdatesFeed: (props: { defaultCollapsed?: boolean }) => {
    feedProps.push(props)
    return null
  },
}))

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
          bindingStatus: 'binding' as const,
        },
        tier: 'mandatory',
        reason: 'NIST mandate',
      },
      {
        item: {
          id: 'HIPAA',
          label: 'HIPAA Security Rule',
          description: 'US health data rule',
          industries: ['Healthcare'],
          countries: ['United States'],
          requiresPQC: false,
          pqcRequirement: 'guidance' as const,
          deadline: '',
          deadlinePhase: 'ongoing' as const,
          notes: '',
          enforcementBody: 'HHS',
          libraryRefs: [],
          timelineRefs: [],
          bodyType: 'compliance_framework' as const,
          confidenceScore: 60,
          bindingStatus: 'binding' as const,
        },
        tier: 'cross-border',
        reason: 'US rule, reader outside its scope',
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

  it('shows "Binding" only for a framework in the mandatory tier (owner decision D2′)', () => {
    renderView()
    const hipaaRow = screen.getByText('HIPAA Security Rule').closest('li') as HTMLElement
    expect(hipaaRow).toHaveTextContent('Binding for others')
    expect(within(hipaaRow).queryByText('Binding', { exact: true })).not.toBeInTheDocument()

    const fipsRow = screen.getByText('FIPS 203 ML-KEM').closest('li') as HTMLElement
    // Two exact "Binding" labels: the mandatory tier's own label and the binding chip.
    expect(within(fipsRow).getAllByText('Binding', { exact: true })).toHaveLength(2)
  })

  it('opens the revisions feed by default (its section has its own heading, so it must not start collapsed)', () => {
    renderView()
    expect(feedProps.length).toBeGreaterThan(0)
    expect(feedProps.every((p) => p.defaultCollapsed === false)).toBe(true)
  })

  it('never applies Executive-style browsing caps — every framework in the applicable set renders', () => {
    renderView()
    // GRC's obligation register must never hide a row the engine says binds
    // the reader — the same invariant obligations/roleLens.ts enforces.
    expect(screen.getByText('FIPS 203 ML-KEM')).toBeInTheDocument()
    expect(screen.getByText('ETSI QSC TR 103')).toBeInTheDocument()
  })
})
