// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ExecutiveTimelineView } from './ExecutiveTimelineView'

// Mock useApplicability so we can drive the view with deterministic data —
// avoids loading the full compliance/threats CSVs for a render test.
vi.mock('../../../hooks/useApplicability', () => ({
  useApplicability: () => ({
    profile: {
      industry: 'Government & Defense',
      country: 'Australia',
      region: 'apac' as const,
    },
    isEmpty: false,
    frameworks: [
      {
        item: {
          id: 'ASD-ISM',
          label: 'ASD ISM',
          description: 'Australian Signals Directorate Information Security Manual',
          industries: ['Government & Defense'],
          countries: ['Australia'],
          requiresPQC: true,
          deadline: '2030 (ISM-1917)',
          deadlineYear: 2030,
          deadlinePhase: 'long',
          notes: 'end-2026 transition plan deadline; 2030 cutover',
          enforcementBody: 'ASD',
          libraryRefs: [],
          timelineRefs: [],
          bodyType: 'compliance_framework',
        },
        tier: 'mandatory',
        reason: 'Your regulator: ASD',
      },
      {
        item: {
          id: 'FIPS-140-3',
          label: 'FIPS 140-3',
          description: 'NIST cryptographic module validation',
          industries: ['Government & Defense'],
          countries: ['Australia', 'United States'],
          requiresPQC: true,
          deadline: '2030',
          deadlineYear: 2030,
          deadlinePhase: 'long',
          notes: '',
          enforcementBody: 'NIST',
          libraryRefs: [],
          timelineRefs: [],
          bodyType: 'compliance_framework',
        },
        tier: 'recognized',
        reason: 'Five Eyes relevance — U.S. government source shown for Australia',
      },
    ],
    library: [
      {
        item: {
          referenceId: 'ASD-ISM-CRYPTO',
          documentTitle: 'ASD ISM Cryptography Guidelines (June 2025)',
          downloadUrl: '',
          initialPublicationDate: '2025-06-01',
          lastUpdateDate: '2025-06-01',
          documentStatus: 'Final',
          lifecycleLabel: 'Released',
          shortDescription: '',
          documentType: '',
          applicableIndustries: ['Government & Defense'],
          authorsOrOrganization: 'ASD',
          dependencies: '',
          regionScope: 'Australia',
          algorithmFamily: '',
          securityLevels: '',
          protocolOrToolImpact: '',
          toolchainSupport: '',
          migrationUrgency: 'High',
          categories: ['Government & Policy'],
        },
        tier: 'mandatory',
        reason: 'Your regulator: ASD',
      },
    ],
    threats: [
      {
        item: {
          industry: 'Government / Defense',
          threatId: 'AUS-GOV-001',
          description: 'HNDL on classified data',
          criticality: 'Critical',
          cryptoAtRisk: '',
          pqcReplacement: '',
          mainSource: '',
          sourceUrl: '',
          relatedModules: [],
        },
        tier: 'recognized',
        reason: 'Australia + Government / Defense match',
      },
    ],
    timeline: [],
    droppedCounts: {
      frameworks: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
      library: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
      threats: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
      timeline: { mandatory: 0, recognized: 0, 'cross-border': 0, advisory: 0, informational: 0 },
    },
    lens: { sections: [], tierCaps: {}, framing: '' },
  }),
}))

function renderView() {
  return render(
    <MemoryRouter>
      <ExecutiveTimelineView />
    </MemoryRouter>
  )
}

describe('ExecutiveTimelineView', () => {
  it('renders source-listed milestone years without a fabricated countdown', () => {
    renderView()
    expect(screen.getByText('Upcoming reference milestones')).toBeInTheDocument()
    expect(screen.queryByText(/ASD ISM cutover/)).not.toBeInTheDocument()
  })

  it('does not turn an earlier year mentioned in notes into a planning obligation', () => {
    renderView()
    // Narrative year mentions must not become a source-listed clock entry.
    const clock = screen.getByText('Upcoming reference milestones').parentElement
    expect(clock).not.toHaveTextContent('end-2026')
    expect(screen.queryByText(/Transition plan due/)).not.toBeInTheDocument()
  })

  it('renders Binding section with ASD-ISM and embedded card', () => {
    renderView()
    expect(screen.getByText(/Binding \(1\)/)).toBeInTheDocument()
    // ASD ISM also appears as a label in the new ValidationGantt bars
    // mounted below the Regulatory Clock — allow ≥1 match instead of exactly 1.
    expect(screen.getAllByText('ASD ISM').length).toBeGreaterThanOrEqual(1)
  })

  it('renders Relevant section with FIPS-140-3 + explained Five Eyes relevance', () => {
    renderView()
    expect(screen.getByText(/Relevant \/ recognized \(1\)/)).toBeInTheDocument()
    // FIPS 140-3 also appears as a ValidationGantt bar label.
    expect(screen.getAllByText('FIPS 140-3').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Five Eyes relevance/)).toBeInTheDocument()
  })

  it('renders sector threats list with AUS-GOV-001', () => {
    renderView()
    expect(screen.getByText('AUS-GOV-001')).toBeInTheDocument()
  })

  it('renders top library docs with ASD ISM Cryptography Guidelines', () => {
    renderView()
    expect(screen.getByText(/ASD ISM Cryptography Guidelines/)).toBeInTheDocument()
  })

  it('renders the Next-Decision card with assess CTA', () => {
    renderView()
    expect(screen.getByText(/Decision this quarter/i)).toBeInTheDocument()
    expect(screen.getByText(/Take board assessment/)).toBeInTheDocument()
  })
})
