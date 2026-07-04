// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { VendorRiskSection } from './VendorRiskSection'
import type { SoftwareItem } from '@/types/MigrateTypes'

const renderSection = (props: Partial<React.ComponentProps<typeof VendorRiskSection>> = {}) =>
  render(
    <MemoryRouter>
      <VendorRiskSection relevantSoftware={[]} defaultOpen {...props} />
    </MemoryRouter>
  )

function makeSoftware(overrides: Partial<SoftwareItem> = {}): SoftwareItem {
  return {
    productId: 'prod-1',
    softwareName: 'Example Product',
    categoryId: 'cat',
    categoryName: 'Category',
    infrastructureLayer: 'Cloud',
    cisaCategory: '',
    pqcSupport: 'Full',
    pqcCapabilityDescription: '',
    licenseType: '',
    license: '',
    latestVersion: '',
    releaseDate: '',
    fipsValidated: '',
    pqcMigrationPriority: 'High',
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
    ...overrides,
  } as SoftwareItem
}

describe('VendorRiskSection', () => {
  it('shows the vendor-model framing text for a known model', () => {
    renderSection({ vendorDependency: 'heavy-vendor' })
    expect(screen.getByText('Heavy vendor dependency')).toBeInTheDocument()
    expect(screen.getByText(/bound by those vendors/)).toBeInTheDocument()
  })

  it('shows a neutral message when vendor dependency is unknown/unset', () => {
    renderSection({ vendorUnknown: true })
    expect(screen.getByText(/wasn.t captured in this assessment/)).toBeInTheDocument()
  })

  it('shows an empty-state message when no catalog products matched', () => {
    renderSection({ relevantSoftware: [] })
    expect(screen.getByText(/No catalog products matched/)).toBeInTheDocument()
  })

  it('lists matched products with a "not tracked" fallback for unknown vendors', () => {
    renderSection({ relevantSoftware: [makeSoftware({ vendorId: undefined })] })
    expect(screen.getByText('Example Product')).toBeInTheDocument()
    expect(screen.getByText('Not tracked')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('links to the Migrate catalog when products are shown', () => {
    renderSection({ relevantSoftware: [makeSoftware()] })
    expect(screen.getByRole('link', { name: /Explore the full Migrate catalog/ })).toHaveAttribute(
      'href',
      '/migrate'
    )
  })
})
