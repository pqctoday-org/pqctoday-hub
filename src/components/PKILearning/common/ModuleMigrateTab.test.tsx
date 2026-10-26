// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ModuleMigrateTab } from './ModuleMigrateTab'
import { vi, describe, it, expect } from 'vitest'
import type { SoftwareItem } from '@/types/MigrateTypes'

const mockProduct = (overrides: Partial<SoftwareItem> = {}): SoftwareItem => ({
  productId: 'testproduct',
  softwareName: 'TestProduct',
  categoryId: 'CSC-001',
  categoryName: 'Cryptographic Libraries',
  infrastructureLayer: 'Libraries',
  cisaCategory: 'Other / Unclassified',
  pqcSupport: 'Yes (ML-KEM)',
  pqcCapabilityDescription: 'Full PQC support',
  licenseType: 'Open Source',
  license: 'Apache-2.0',
  latestVersion: '1.0.0',
  releaseDate: '2026-01-01',
  fipsValidated: 'No',
  pqcMigrationPriority: 'Critical',
  primaryPlatforms: 'Linux',
  targetIndustries: 'Enterprise',
  authoritativeSource: 'Vendor',
  repositoryUrl: 'https://example.com/repo',
  productBrief: 'A test cryptographic product',
  sourceType: 'Trusted Vendor',
  verificationStatus: 'Verified',
  lastVerifiedDate: '2026-01-01',
  migrationPhases: 'prepare,migrate',
  learningModules: 'tls-basics;hybrid-crypto',
  ...overrides,
})

vi.mock('@/data/migrateData', () => ({
  getMigrateItemsForModule: vi.fn((moduleId: string) => {
    if (moduleId === 'empty-module') return []
    if (moduleId === 'mixed-support') {
      return [
        mockProduct({ softwareName: 'PqcTool', pqcSupport: 'Yes (ML-DSA)' }),
        mockProduct({ softwareName: 'CertifiedOnly', pqcSupport: 'No' }),
      ]
    }
    if (moduleId === 'multi-layer') {
      return [
        mockProduct({
          softwareName: 'MultiLayerTool',
          infrastructureLayer: 'Libraries,Security Stack',
        }),
      ]
    }
    return [
      mockProduct(),
      mockProduct({
        softwareName: 'FIPSProduct',
        pqcSupport: 'Planned',
        fipsValidated: 'Yes (FIPS 140-3 #4567)',
        licenseType: 'Commercial',
        repositoryUrl: '',
        infrastructureLayer: 'Security Stack',
        productBrief: 'FIPS-validated commercial product',
      }),
      mockProduct({
        softwareName: 'PartialFIPS',
        pqcSupport: 'Limited',
        fipsValidated: 'Yes (FedRAMP)',
        infrastructureLayer: 'Cloud',
        productBrief: 'Cloud product with partial FIPS',
      }),
    ]
  }),
}))

vi.mock('@/data/infrastructureLayers', () => ({
  LAYERS: [
    { id: 'Cloud', label: 'Cloud', icon: () => null },
    { id: 'Network', label: 'Network', icon: () => null },
    { id: 'AppServers', label: 'Application Servers', icon: () => null },
    { id: 'Libraries', label: 'Libraries & SDKs', icon: () => null },
    { id: 'SecSoftware', label: 'Security Software', icon: () => null },
    { id: 'Database', label: 'Database', icon: () => null },
    { id: 'Security Stack', label: 'Security Stack', icon: () => null },
    { id: 'OS', label: 'Operating System', icon: () => null },
    { id: 'Hardware', label: 'Hardware & Secure Elements', icon: () => null },
  ],
}))

function renderTab(moduleId: string) {
  return render(
    <MemoryRouter>
      <ModuleMigrateTab moduleId={moduleId} />
    </MemoryRouter>
  )
}

describe('ModuleMigrateTab', () => {
  it('renders empty state when no products match', () => {
    renderTab('empty-module')
    expect(screen.getByText('No tools or products yet')).toBeInTheDocument()
  })

  it('renders products grouped by layer', () => {
    renderTab('tls-basics')
    expect(screen.getByText('Libraries & SDKs')).toBeInTheDocument()
    expect(screen.getByText('Security Stack')).toBeInTheDocument()
    expect(screen.getByText('Cloud')).toBeInTheDocument()
    expect(screen.getByText('TestProduct')).toBeInTheDocument()
    expect(screen.getByText('FIPSProduct')).toBeInTheDocument()
    expect(screen.getByText('PartialFIPS')).toBeInTheDocument()
  })

  it('renders PQC badge with correct text', () => {
    renderTab('tls-basics')
    expect(screen.getByText('PQC')).toBeInTheDocument()
    expect(screen.getByText('Planned')).toBeInTheDocument()
    expect(screen.getByText('Partial')).toBeInTheDocument()
  })

  it('renders a FIPS badge only for a validated module — FedRAMP and "No" get none', () => {
    renderTab('tls-basics')
    expect(screen.getByText('FIPS', { exact: true })).toBeInTheDocument()
    // "Yes (FedRAMP)" used to read "FIPS Partial"; FedRAMP is not a FIPS 140 validation.
    expect(screen.queryByText(/FIPS Partial/)).not.toBeInTheDocument()
    expect(screen.queryByText('No FIPS')).not.toBeInTheDocument()
  })

  it('links product name to repositoryUrl when available', () => {
    renderTab('tls-basics')
    const link = screen.getByRole('link', { name: /TestProduct/ })
    expect(link).toHaveAttribute('href', 'https://example.com/repo')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders product name as text when no repositoryUrl', () => {
    renderTab('tls-basics')
    // FIPSProduct has no repositoryUrl — should not be a link
    expect(screen.getByText('FIPSProduct')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /FIPSProduct/ })).not.toBeInTheDocument()
  })

  it('shows View in Migrate links that open the product by id', () => {
    renderTab('tls-basics')
    const migrateLinks = screen.getAllByRole('link', { name: /View in Migrate/ })
    expect(migrateLinks.length).toBeGreaterThanOrEqual(3)
    expect(migrateLinks[0]).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/migrate\?product=[^&]+$/)
    )
  })

  it('shows multi-layer products in all matching layers', () => {
    renderTab('multi-layer')
    // MultiLayerTool should appear in both Application and Security Stack sections
    expect(screen.getByText('Libraries & SDKs')).toBeInTheDocument()
    expect(screen.getByText('Security Stack')).toBeInTheDocument()
    expect(screen.getAllByText('MultiLayerTool')).toHaveLength(2)
  })

  it('includes intro text with link to Migrate Catalog', () => {
    renderTab('tls-basics')
    const catalogLink = screen.getByRole('link', { name: 'Migrate Catalog' })
    expect(catalogLink).toHaveAttribute('href', '/migrate?productIds=testproduct')
  })

  it('shows license type badge', () => {
    renderTab('tls-basics')
    // Two products have 'Open Source' (TestProduct + PartialFIPS), one has 'Commercial'
    expect(screen.getAllByText('Open Source').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Commercial')).toBeInTheDocument()
  })

  it('keeps only the products the item filter accepts, and the catalog link follows', () => {
    render(
      <MemoryRouter>
        <ModuleMigrateTab
          moduleId="tls-basics"
          itemFilter={(item) => item.softwareName === 'FIPSProduct'}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('FIPSProduct')).toBeInTheDocument()
    expect(screen.queryByText('TestProduct')).not.toBeInTheDocument()
    expect(screen.queryByText('PartialFIPS')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Migrate Catalog' })).toHaveAttribute(
      'href',
      '/migrate?productIds=testproduct'
    )
  })

  it('shows the empty state when the item filter accepts nothing', () => {
    render(
      <MemoryRouter>
        <ModuleMigrateTab moduleId="tls-basics" itemFilter={() => false} />
      </MemoryRouter>
    )
    expect(screen.getByText('No tools or products yet')).toBeInTheDocument()
  })

  it('does not call a module PQC-ready when it lists a product with no PQC support', () => {
    render(
      <MemoryRouter>
        <ModuleMigrateTab moduleId="mixed-support" />
      </MemoryRouter>
    )
    expect(screen.queryByText(/PQC-ready tools and products/)).not.toBeInTheDocument()
    expect(
      screen.getByText(
        /Tools and products relevant to this module; each badge shows its PQC support/
      )
    ).toBeInTheDocument()
  })

  it('keeps the PQC-ready header when every listed product supports PQC', () => {
    render(
      <MemoryRouter>
        <ModuleMigrateTab
          moduleId="tls-basics"
          itemFilter={(item) => item.softwareName === 'FIPSProduct'}
        />
      </MemoryRouter>
    )
    expect(
      screen.getByText(/PQC-ready tools and products relevant to this module/)
    ).toBeInTheDocument()
  })
})
