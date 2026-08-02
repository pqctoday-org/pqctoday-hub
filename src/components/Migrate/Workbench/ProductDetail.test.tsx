// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ProductDetail } from './ProductDetail'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { cpeByProduct } from '@/data/cpeXrefData'
import { purlByProduct } from '@/data/purlXrefData'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import type { SoftwareItem } from '@/types/MigrateTypes'

function makeItem(over: Partial<SoftwareItem>): SoftwareItem {
  return {
    productId: 'p1',
    softwareName: 'Test Product',
    categoryId: 'c',
    categoryName: 'TLS/SSL Implementation Software',
    infrastructureLayer: 'AppServers',
    cisaCategory: '',
    pqcSupport: 'Yes',
    pqcCapabilityDescription: '',
    licenseType: '',
    license: '',
    latestVersion: '',
    releaseDate: '',
    fipsValidated: 'No',
    pqcMigrationPriority: '',
    primaryPlatforms: '',
    targetIndustries: '',
    authoritativeSource: '',
    repositoryUrl: '',
    productBrief: '',
    sourceType: '',
    verificationStatus: '',
    lastVerifiedDate: '',
    migrationPhases: '',
    learningModules: '',
    ...over,
  }
}

describe('ProductDetail', () => {
  it('renders a labelled PQC capabilities section (support detail + description)', () => {
    render(
      <ProductDetail
        product={makeItem({
          pqcSupport: 'Yes (ACVP: ML-DSA, ML-KEM, SLH-DSA)',
          pqcCapabilityDescription: 'Supports ML-KEM-768 hybrid key exchange.',
          proofUrl: 'https://example.com/proof',
          proofPublicationDate: '2026-01-01',
        })}
      />
    )
    expect(screen.getByText('PQC capabilities')).toBeInTheDocument()
    // concise support detail extracted from the pqcSupport string (Yes stripped)
    expect(screen.getByText('ACVP: ML-DSA, ML-KEM, SLH-DSA')).toBeInTheDocument()
    expect(screen.getByText(/Supports ML-KEM-768 hybrid key exchange/)).toBeInTheDocument()
    const proof = screen.getByRole('link', { name: /Validation proof/i })
    expect(proof).toHaveAttribute('href', 'https://example.com/proof')
    expect(proof).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the vendor PQC roadmap when the vendor has one', () => {
    // pick a real vendor id that has roadmap data
    const [vendorId, roadmap] = roadmapByVendorId.entries().next().value as [
      string,
      { roadmapTitle?: string },
    ]
    expect(vendorId).toBeTruthy()
    render(<ProductDetail product={makeItem({ vendorId })} />)
    // VendorRoadmapPanel renders the roadmap title (or its default fallback)
    const expected = roadmap.roadmapTitle || 'Vendor PQC Roadmap'
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  // Bug 2 regression: learningModules was curated data (749/907 catalog rows)
  // that never rendered as anything — not even plain text — anywhere in
  // src/components/Migrate. This is the fix: real <Link to="/learn/<id>">s.
  describe('Learn this — learningModules cross-references', () => {
    it('renders each referenced module as a real /learn/<id> Link with its catalog title', () => {
      const [firstId, firstModule] = Object.entries(MODULE_CATALOG)[0]
      render(
        <MemoryRouter>
          <ProductDetail product={makeItem({ learningModules: firstId })} />
        </MemoryRouter>
      )
      expect(screen.getByText('Learn this')).toBeInTheDocument()
      const link = screen.getByRole('link', { name: firstModule.title })
      expect(link).toHaveAttribute('href', `/learn/${firstId}`)
    })

    it('renders one Link per semicolon-separated id, in order', () => {
      const [id1, mod1] = Object.entries(MODULE_CATALOG)[0]
      const [id2, mod2] = Object.entries(MODULE_CATALOG)[1]
      render(
        <MemoryRouter>
          <ProductDetail product={makeItem({ learningModules: `${id1};${id2}` })} />
        </MemoryRouter>
      )
      expect(screen.getByRole('link', { name: mod1.title })).toHaveAttribute(
        'href',
        `/learn/${id1}`
      )
      expect(screen.getByRole('link', { name: mod2.title })).toHaveAttribute(
        'href',
        `/learn/${id2}`
      )
    })

    it('renders no "Learn this" section when the product has no learningModules', () => {
      render(
        <MemoryRouter>
          <ProductDetail product={makeItem({ learningModules: '' })} />
        </MemoryRouter>
      )
      expect(screen.queryByText('Learn this')).not.toBeInTheDocument()
    })

    it('falls back to the raw id as the label if a referenced id somehow has no catalog entry', () => {
      render(
        <MemoryRouter>
          <ProductDetail product={makeItem({ learningModules: 'not-a-real-module-id' })} />
        </MemoryRouter>
      )
      const link = screen.getByRole('link', { name: 'not-a-real-module-id' })
      expect(link).toHaveAttribute('href', '/learn/not-a-real-module-id')
    })
  })

  // Bug 2 (secondary finding): the CPE/PURL cross-reference join (~915 + 800
  // rows) was loaded for CBOM export + CVE matching but never rendered as a
  // link anywhere in src/components/Migrate. This is the fix.
  describe('Identifiers — CPE/PURL cross-references', () => {
    it('renders a matched CPE as an external NVD link', () => {
      const matchedCpe = [...cpeByProduct.values()].find((x) => x.status === 'matched' && x.nvdUrl)
      expect(matchedCpe).toBeTruthy()
      render(
        <MemoryRouter>
          <ProductDetail product={makeItem({ softwareName: matchedCpe!.softwareName })} />
        </MemoryRouter>
      )
      expect(screen.getByText('Identifiers')).toBeInTheDocument()
      const link = screen.getByRole('link', { name: `CPE: ${matchedCpe!.cpeUri}` })
      expect(link).toHaveAttribute('href', matchedCpe!.nvdUrl)
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('renders a matched PURL as an external registry link', () => {
      const matchedPurl = [...purlByProduct.values()].find(
        (x) => x.status === 'matched' && x.registryUrl
      )
      expect(matchedPurl).toBeTruthy()
      render(
        <MemoryRouter>
          <ProductDetail product={makeItem({ softwareName: matchedPurl!.softwareName })} />
        </MemoryRouter>
      )
      const link = screen.getByRole('link', { name: `PURL: ${matchedPurl!.purl}` })
      expect(link).toHaveAttribute('href', matchedPurl!.registryUrl)
    })

    it('renders no Identifiers section for a product with no CPE/PURL match', () => {
      render(
        <MemoryRouter>
          <ProductDetail product={makeItem({ softwareName: 'Definitely Not In Any Xref CSV' })} />
        </MemoryRouter>
      )
      expect(screen.queryByText('Identifiers')).not.toBeInTheDocument()
    })
  })
})
