// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ProductDetail } from './ProductDetail'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
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
  it('renders capability text + validation proof link from the item', () => {
    render(
      <ProductDetail
        product={makeItem({
          pqcCapabilityDescription: 'Supports ML-KEM-768 hybrid key exchange.',
          proofUrl: 'https://example.com/proof',
          proofPublicationDate: '2026-01-01',
        })}
      />
    )
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
})
