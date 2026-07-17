// SPDX-License-Identifier: GPL-3.0-only
//
// Added 2026-07-16 (compliance-maintenance audit, Phase 4.5) — this component
// had zero co-located tests despite being the primary drill-down for every
// framework on the Landscape tab. Covers the new "Source & trust" panel
// (Phase 4.1): before this fix, trust fields (source link, authority,
// confidence, peer-review) were parsed from the CSV but never shown to any
// user except the researcher persona's For You view.
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplianceDetailDrawer } from './ComplianceDetailDrawer'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'

vi.mock('react-focus-lock', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}))

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
    enforcementBody: '',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'compliance_framework',
    ...overrides,
  }
}

describe('ComplianceDetailDrawer', () => {
  it('renders nothing when framework is null', () => {
    const { container } = render(
      <ComplianceDetailDrawer framework={null} pillar="comply" onClose={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the Source & trust panel with website, enforcement body, confidence, peer-review, and last-verified fields', () => {
    render(
      <ComplianceDetailDrawer
        framework={framework({
          label: 'Trust Panel Framework',
          website: 'https://example.gov/pqc',
          enforcementBody: 'Example Regulator',
          confidenceScore: 85,
          peerReviewed: 'yes',
          lastVerified: '2026-07-16',
        })}
        pillar="comply"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Source & trust')).toBeInTheDocument()
    expect(screen.getByText('example.gov')).toBeInTheDocument()
    // enforcementBody legitimately also appears in the traceability chain
    // above the trust panel, so more than one match is expected here.
    expect(screen.getAllByText('Example Regulator').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('85/100')).toBeInTheDocument()
    expect(screen.getByText('Last verified')).toBeInTheDocument()
    expect(screen.getByText('2026-07-16')).toBeInTheDocument()
    expect(screen.getByText('yes')).toBeInTheDocument()
  })

  it('resolves a real trustedSourceId to a human-readable name, not the raw id', () => {
    const nist = complianceFrameworks.find((f) => f.id === 'NIST')
    expect(nist?.trustedSourceId).toBeTruthy() // guards against the fixture row disappearing later
    render(<ComplianceDetailDrawer framework={nist!} pillar="comply" onClose={() => {}} />)
    expect(screen.getByText('Trusted source')).toBeInTheDocument()
    expect(screen.queryByText(nist!.trustedSourceId!)).not.toBeInTheDocument()
  })

  it('omits the Source & trust panel entirely when a framework has none of website, enforcementBody, or a resolvable trustedSourceId', () => {
    render(
      <ComplianceDetailDrawer
        framework={framework({ label: 'No Trust Fields', trustedSourceId: 'not-a-real-id' })}
        pillar="comply"
        onClose={() => {}}
      />
    )
    expect(screen.queryByText('Source & trust')).not.toBeInTheDocument()
  })

  it('still renders the traceability chain and footer actions unrelated to the trust panel', () => {
    render(
      <ComplianceDetailDrawer
        framework={framework({ label: 'Chain Check' })}
        pillar="comply"
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Traceability chain')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Open CSWP\.39 crosswalk/i })).toBeInTheDocument()
  })
})
