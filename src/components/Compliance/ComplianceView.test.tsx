import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplianceView } from './ComplianceView'
import '@testing-library/jest-dom'

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

// Mock the ComplianceTable to avoid testing its complex internals here
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

// Mock analytics
vi.mock('../../utils/analytics', () => ({
  logComplianceFilter: vi.fn(),
}))

// Mock share/glossary buttons
vi.mock('../ui/ShareButton', () => ({
  ShareButton: () => <button>Share</button>,
}))
vi.mock('../ui/GlossaryButton', () => ({
  GlossaryButton: () => <button>Glossary</button>,
}))

describe('ComplianceView', () => {
  it('renders the page title', () => {
    render(<ComplianceView />)
    expect(screen.getByText('Compliance & Certification')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<ComplianceView />)
    expect(
      screen.getByText(/Streamlined access to cryptographic module validations/)
    ).toBeInTheDocument()
  })

  it('renders authoritative source links', () => {
    render(<ComplianceView />)
    expect(screen.getByText('NIST CMVP')).toBeInTheDocument()
    expect(screen.getByText('NIST CAVP')).toBeInTheDocument()
    expect(screen.getByText('CC Portal')).toBeInTheDocument()
    expect(screen.getByText('ANSSI (FR)')).toBeInTheDocument()
    expect(screen.getByText('BSI (DE)')).toBeInTheDocument()
  })

  it('renders tab triggers for All, FIPS, ACVP, and CC', () => {
    render(<ComplianceView />)
    expect(screen.getByRole('button', { name: 'All Records' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'FIPS 140-3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ACVP' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Common Criteria' })).toBeInTheDocument()
  })

  it('shows All Records tab by default with all data', () => {
    render(<ComplianceView />)
    // The "All Records" tab should be active by default, showing all 3 records
    expect(screen.getByText('Table (3 records)')).toBeInTheDocument()
  })
})
