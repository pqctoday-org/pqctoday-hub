// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ArchitectStandardsView } from './ArchitectStandardsView'

vi.mock('../../../hooks/useApplicabilityWithPaths', () => ({
  useApplicabilityWithPaths: () => ({
    profile: { industry: 'Finance', country: 'Germany', region: 'eu' as const },
    isEmpty: false,
    frameworks: [
      ...(['recognized', 'cross-border', 'advisory'] as const).map((tier) => ({
        item: {
          id: `TEST-${tier}`,
          label: `Test ${tier} framework`,
          description: '',
          industries: ['Finance'],
          countries: ['Germany'],
          requiresPQC: false,
          pqcRequirement: 'guidance' as const,
          deadline: 'Ongoing',
          deadlinePhase: 'ongoing' as const,
          notes: '',
          enforcementBody: 'Test body',
          libraryRefs: [],
          timelineRefs: [],
          bodyType: 'compliance_framework' as const,
        },
        tier,
        reason: 'test',
      })),
      {
        item: {
          id: 'BSI-TR-02102',
          label: 'BSI TR-02102',
          description: 'Cryptographic mechanism recommendations',
          industries: ['Finance', 'Government & Defense'],
          countries: ['Germany'],
          requiresPQC: true,
          pqcRequirement: 'yes' as const,
          deadline: '2028',
          deadlinePhase: 'mid' as const,
          notes: '',
          enforcementBody: 'BSI',
          libraryRefs: ['BSI-TR-02102-1'],
          timelineRefs: [],
          bodyType: 'compliance_framework' as const,
        },
        tier: 'mandatory',
        reason: 'German regulator',
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
      <ArchitectStandardsView />
    </MemoryRouter>
  )
}

describe('ArchitectStandardsView', () => {
  it('renders the Crypto-Agility Maturity section', () => {
    renderView()
    expect(screen.getByText('Crypto-Agility Maturity')).toBeInTheDocument()
  })

  it('renders the Jurisdiction map section', () => {
    renderView()
    expect(screen.getByText('Jurisdiction map')).toBeInTheDocument()
  })

  it('groups applicable frameworks under the European Union region', () => {
    renderView()
    expect(screen.getByText('European Union')).toBeInTheDocument()
    expect(screen.getByText('BSI TR-02102')).toBeInTheDocument()
  })

  it('does not say the matched frameworks bind the reader or constrain the system', () => {
    const { container } = renderView()
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/that bind your stack/i)
    expect(text).toMatch(/may be relevant to your stack/)
    expect(text).toMatch(/not a legal finding/)
  })

  it('keeps each framework its own tier instead of one blanket label', () => {
    renderView()
    const tiers = screen.getAllByTestId('framework-tier').map((el) => el.textContent)
    expect(tiers).toEqual(
      expect.arrayContaining(['Binding', 'Relevant / recognized', 'Cross-border', 'Advisory'])
    )
    // A recognized or advisory entry is never labelled Binding.
    const advisory = screen.getByRole('button', { name: /Test advisory framework/ })
    expect(advisory).toHaveTextContent('Advisory')
    expect(advisory).not.toHaveTextContent('Binding')
    expect(advisory).toHaveAttribute('title', expect.stringContaining('recommended adoption'))
  })
})
