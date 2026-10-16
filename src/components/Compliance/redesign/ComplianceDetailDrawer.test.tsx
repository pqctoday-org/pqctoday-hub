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
import { MemoryRouter } from 'react-router'
import { ComplianceDetailDrawer } from './ComplianceDetailDrawer'
import {
  bindingDataPresent,
  complianceFrameworks,
  type ComplianceFramework,
} from '@/data/complianceData'

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

describe('ComplianceDetailDrawer — learn backlink', () => {
  // Traversal was one-way until 2026-07-31: a module could link out to
  // /compliance, but no compliance row could route a reader back into the
  // module that teaches it. Asserted here rather than in a browser because the
  // Landscape drawer needs the full page (tabs + persona filters) to open.
  const renderDrawer = (fw: ComplianceFramework) =>
    render(
      <MemoryRouter>
        <ComplianceDetailDrawer framework={fw} pillar="comply" onClose={() => {}} />
      </MemoryRouter>
    )

  it('renders a link per learn module, titled from the catalog', () => {
    renderDrawer(framework({ label: 'eIDAS 2.0', learnModules: ['digital-id'] }))
    expect(screen.getByText('Learn this')).toBeDefined()
    const link = screen.getByRole('link', { name: /Digital ID/i })
    expect(link.getAttribute('href')).toBe('/learn/digital-id')
  })

  it('omits the section entirely when no modules are mapped', () => {
    renderDrawer(framework({ label: 'Unmapped', learnModules: [] }))
    expect(screen.queryByText('Learn this')).toBeNull()
  })

  it('omits the section when the field is absent (older rows)', () => {
    renderDrawer(framework({ label: 'No column' }))
    expect(screen.queryByText('Learn this')).toBeNull()
  })
})

// Executive journey remediation, section 7 (owner decision 16 Oct 2026): the
// Compliance page says who a scoped framework binds, in the same words as the report.
describe('ComplianceDetailDrawer — binding', () => {
  const show = (overrides: Partial<ComplianceFramework>) =>
    render(
      <MemoryRouter>
        <ComplianceDetailDrawer
          framework={framework(overrides)}
          pillar="comply"
          onClose={() => {}}
        />
      </MemoryRouter>
    )

  it('the shipped compliance file carries binding data, so the row can show', () => {
    expect(bindingDataPresent()).toBe(true)
  })

  it('quotes who a scoped framework binds, its translation and its basis', () => {
    show({
      bindingStatus: 'mandatory_for_scope',
      bindingScope: 'Behörden des Bundes',
      bindingScopeEn: 'federal authorities',
      bindingBasis: 'BSIG § 8',
    })
    const row = screen.getByTestId('drawer-binding')
    expect(row).toHaveTextContent('Binding for its scope')
    expect(row).toHaveTextContent('Its text says it applies to “Behörden des Bundes”')
    expect(row).toHaveTextContent('(our translation: “federal authorities”)')
    expect(row).toHaveTextContent('Basis: BSIG § 8')
  })

  it('a scoped framework with no recorded scope still says it binds only its scope', () => {
    show({ bindingStatus: 'mandatory_for_scope', bindingBasis: 'FIPS PUB 140-3' })
    const row = screen.getByTestId('drawer-binding')
    expect(row).toHaveTextContent('Binding for its scope')
    expect(row).not.toHaveTextContent('Its text says')
  })

  it('a binding law reads "Binding" and never claims a scope', () => {
    show({
      bindingStatus: 'binding',
      bindingScope: 'ignored',
      bindingBasis: 'Regulation (EU) 2022/2554',
    })
    const row = screen.getByTestId('drawer-binding')
    expect(row).toHaveTextContent(/^Binding/)
    expect(row).not.toHaveTextContent('for its scope')
    expect(row).not.toHaveTextContent('Its text says')
  })

  it('guidance reads as guidance, not binding', () => {
    show({ bindingStatus: 'recommendation' })
    expect(screen.getByTestId('drawer-binding')).toHaveTextContent('Guidance or draft')
  })

  it('no binding status, no row', () => {
    show({ website: 'https://example.gov' })
    expect(screen.queryByTestId('drawer-binding')).toBeNull()
  })
})
