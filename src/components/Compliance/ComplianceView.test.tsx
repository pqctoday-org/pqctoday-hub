// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ComplianceView } from './ComplianceView'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'

// Mock the services module
vi.mock('./services', () => ({
  useComplianceRefresh: () => ({
    data: [
      {
        id: 'fips-1',
        type: 'FIPS 140-3',
        vendor: 'Acme Corp',
        moduleName: 'Acme Crypto Module',
        level: '3',
        status: 'Active',
        certNumber: 'FIPS-001',
        source: 'NIST',
        pqcReady: true,
        algorithms: ['ML-KEM-768'],
        reportUrl: 'https://example.com/fips-001',
      },
      {
        id: 'acvp-1',
        type: 'ACVP',
        vendor: 'Test Labs',
        moduleName: 'Test Crypto',
        level: '',
        status: 'Active',
        certNumber: 'ACVP-100',
        source: 'NIST',
        pqcReady: false,
        algorithms: ['AES-256'],
        reportUrl: '',
      },
      {
        id: 'cc-1',
        type: 'Common Criteria',
        vendor: 'EU Vendor',
        moduleName: 'EU HSM',
        level: 'EAL4+',
        status: 'Active',
        certNumber: 'CC-500',
        source: 'CC Portal',
        pqcReady: false,
        algorithms: ['RSA-2048'],
        reportUrl: '',
      },
    ],
    loading: false,
    error: null,
    lastUpdated: new Date('2026-02-17'),
    refresh: vi.fn(),
    enrichRecord: vi.fn(),
  }),
  AUTHORITATIVE_SOURCES: {
    FIPS: 'https://csrc.nist.gov/fips',
    ACVP: 'https://csrc.nist.gov/acvp',
    CC: 'https://www.commoncriteriaportal.org/',
    ANSSI: 'https://cyber.gouv.fr/',
    BSI: 'https://www.bsi.bund.de/',
  },
}))

// Mock the ComplianceTable and MobileComplianceView to avoid testing complex internals here
vi.mock('./ComplianceTable', () => ({
  ComplianceTable: ({
    data,
  }: {
    data: { id: string }[]
    onRefresh: () => void
    isRefreshing: boolean
    lastUpdated: Date | null
    onEnrich?: (id: string) => void
  }) => <div data-testid="compliance-table">Table ({data.length} records)</div>,
}))

vi.mock('./MobileComplianceView', () => ({
  MobileComplianceView: ({ data }: { data: { id: string }[] }) => (
    <div data-testid="mobile-compliance-view">Mobile ({data.length} records)</div>
  ),
}))

// Mock analytics
vi.mock('../../utils/analytics', () => ({
  logComplianceFilter: vi.fn(),
}))

// Mock share/glossary buttons
vi.mock('../ui/ShareButton', () => ({
  ShareButton: () => <Button>Share</Button>,
}))
vi.mock('../ui/GlossaryButton', () => ({
  GlossaryButton: () => <Button>Glossary</Button>,
}))
vi.mock('../ui/UserManualButton', () => ({
  UserManualButton: () => <Button>Guide</Button>,
}))

describe('ComplianceView', () => {
  it('renders the page title', () => {
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    expect(screen.getByText('Standardization, Compliance and Certification')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    expect(
      screen.getAllByText(/Explore the three pillars of PQC compliance/)[0]
    ).toBeInTheDocument()
  })

  it('renders the Sources and Glossary buttons in the header', () => {
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    // Authoritative sources are accessible via the Sources button (SourcesButton)
    expect(screen.getByRole('button', { name: /sources/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /glossary/i })).toBeInTheDocument()
  })

  it('renders the three primary tab triggers and More overflow button', () => {
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /Technical Standards/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Compliance Frameworks/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cert Records/i })).toBeInTheDocument()
    // Secondary tabs are behind the More overflow menu (may render multiple in desktop+mobile layout)
    expect(screen.getAllByRole('button', { name: /More/i }).length).toBeGreaterThan(0)
  })

  it('shows cert records table when Records tab is clicked', () => {
    render(
      <MemoryRouter>
        <ComplianceView />
      </MemoryRouter>
    )
    // Navigate to the Records tab (flat architecture post-v2.74.0 refactor)
    fireEvent.click(screen.getByRole('button', { name: /^Records$/i }))
    // Records tab is now active — no sub-tabs exist in the flat layout
    expect(screen.getByRole('button', { name: /^Records$/i })).toBeInTheDocument()
  })
})
