// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ProductDetail } from './ProductDetail'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import type { SoftwareItem, VendorRoadmap, VendorRoadmapEnrichment } from '@/types/MigrateTypes'

vi.mock('@/hooks/useRevisions', () => ({
  useRevisions: () => ({ revisions: [], isLoading: false, error: null }),
  byRecord: () => [],
}))

// Fixture vendors added to the loaded maps for this file only.
const WITHHELD = 'VND-ZZ-DESKTOP-WITHHELD'
const NO_ROW = 'VND-ZZ-DESKTOP-NOROW'
const ROW_URL = 'https://desktop-withheld.example/files/paper.pdf'
const PAGE_URL = 'https://www.desktop-withheld.example/insights/paper.html'
const NO_ROW_PAGE = 'https://desktop-norow.example/blog/pqc'

function analysis(vendorId: string, roadmapUrl: string): VendorRoadmapEnrichment {
  return {
    vendorId,
    roadmapUrl,
    roadmapScope: 'Portfolio-wide strategy',
    pqcAlgorithms: ['ML-KEM'],
    targetMigrationDates: 'Desktop pilot in 2027',
    productsCovered: '',
    complianceFrameworks: [],
    hybridModeSupport: '',
    currentGaStatus: 'Preview',
    customerActionRequired: '',
    keyQuotes: [],
    extractionQuality: 'LOW',
    sourceTitle: 'The paper as a web page',
  }
}

beforeAll(() => {
  const row: VendorRoadmap = {
    vendorId: WITHHELD,
    vendorName: 'Desktop Withheld Co',
    roadmapUrl: ROW_URL,
    roadmapTitle: 'Desktop white paper',
    roadmapType: 'whitepaper',
    publishDate: '',
    lastVerifiedDate: '2026-10-01',
    coverageNotes: '',
    compositeId: `${WITHHELD}|${ROW_URL}`,
    roadmapStatus: 'active',
  }
  roadmapByVendorId.set(WITHHELD, [row])
  enrichmentByVendorId.set(WITHHELD, [analysis(WITHHELD, PAGE_URL)])
  enrichmentByVendorId.set(NO_ROW, [analysis(NO_ROW, NO_ROW_PAGE)])
})

afterAll(() => {
  for (const id of [WITHHELD, NO_ROW]) {
    roadmapByVendorId.delete(id)
    enrichmentByVendorId.delete(id)
  }
})

function product(vendorId: string): SoftwareItem {
  return {
    productId: `p-${vendorId}`,
    softwareName: 'Fixture Product',
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
    vendorId,
  }
}

describe('ProductDetail vendor roadmap analysis source', () => {
  it('shows the withheld analysis only inside "Analysis from another source"', () => {
    render(
      <MemoryRouter>
        <ProductDetail product={product(WITHHELD)} />
      </MemoryRouter>
    )
    expect(
      screen.getByRole('link', { name: 'Open Desktop Withheld Co PQC roadmap' })
    ).toHaveAttribute('href', ROW_URL)
    const block = screen.getByRole('region', { name: 'Analysis from another source' })
    expect(
      within(block).getByRole('link', {
        name: 'Analysis source: The paper as a web page (desktop-withheld.example) (opens in a new tab)',
      })
    ).toHaveAttribute('href', PAGE_URL)
    expect(screen.getAllByText('Desktop pilot in 2027')).toHaveLength(1)
    expect(block.contains(screen.getByText('Desktop pilot in 2027'))).toBe(true)
  })

  it('names the page the analysis came from for a vendor with no roadmap row', () => {
    render(
      <MemoryRouter>
        <ProductDetail product={product(NO_ROW)} />
      </MemoryRouter>
    )
    const source = screen.getByRole('region', { name: 'Analysis source' })
    expect(within(source).getByRole('link')).toHaveAttribute('href', NO_ROW_PAGE)
    expect(screen.queryByText('Analysis from another source')).toBeNull()
  })
})
