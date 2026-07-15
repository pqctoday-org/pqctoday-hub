// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ProductRow } from './ProductRow'
import { vendorMap } from '@/data/migrateData'
import type { SoftwareItem } from '@/types/MigrateTypes'

vi.mock('@/data/sponsors', () => ({
  isSponsor: (vendorName: string) =>
    vendorName.trim().toLowerCase() === 'sponsored vendor corp' ? { name: vendorName } : undefined,
}))

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

describe('ProductRow sponsor badge', () => {
  it('renders a Sponsor badge only when the product vendor is a genuine sponsor', () => {
    // Pick any two real, distinct vendor ids from the loaded catalog.
    const ids = Array.from(vendorMap.keys())
    expect(ids.length).toBeGreaterThanOrEqual(2)
    const [sponsoredId, unsponsoredId] = ids

    const sponsoredVendor = vendorMap.get(sponsoredId)!
    // Override the display name so it matches the mocked sponsor list.
    vendorMap.set(sponsoredId, { ...sponsoredVendor, vendorDisplayName: 'Sponsored Vendor Corp' })

    const { rerender } = render(<ProductRow product={makeItem({ vendorId: sponsoredId })} />)
    expect(screen.getByText('Sponsor')).toBeInTheDocument()

    rerender(<ProductRow product={makeItem({ vendorId: unsponsoredId })} />)
    expect(screen.queryByText('Sponsor')).not.toBeInTheDocument()

    // Restore the original vendor record so other tests sharing the module-level map are unaffected.
    vendorMap.set(sponsoredId, sponsoredVendor)
  })

  it('renders no Sponsor badge when the product has no vendor', () => {
    render(<ProductRow product={makeItem({})} />)
    expect(screen.queryByText('Sponsor')).not.toBeInTheDocument()
  })
})

describe('ProductRow compact + extraBadges', () => {
  it('keeps the default card chrome when compact is omitted (no regression)', () => {
    const { container } = render(<ProductRow product={makeItem({})} />)
    const outer = container.firstElementChild as HTMLElement
    expect(outer.className).toMatch(/rounded-xl/)
    expect(outer.className).toMatch(/border/)
  })

  it('drops the outer border/background when compact is true', () => {
    const { container } = render(<ProductRow product={makeItem({})} compact />)
    const outer = container.firstElementChild as HTMLElement
    expect(outer.className).not.toMatch(/rounded-xl/)
    expect(outer.className).not.toMatch(/border-border/)
  })

  it('renders extraBadges after the built-in badges when provided', () => {
    render(
      <ProductRow
        product={makeItem({})}
        extraBadges={<span data-testid="hybrid-badge">Hybrid</span>}
      />
    )
    expect(screen.getByTestId('hybrid-badge')).toBeInTheDocument()
  })

  it('renders no extra badge markup when extraBadges is omitted', () => {
    render(<ProductRow product={makeItem({})} />)
    expect(screen.queryByTestId('hybrid-badge')).not.toBeInTheDocument()
  })

  it('still expands to ProductDetail when compact', () => {
    render(<ProductRow product={makeItem({ vendorId: undefined })} compact />)
    fireEvent.click(screen.getByRole('button', { name: /expand details/i }))
    expect(screen.getByRole('button', { name: /collapse details/i })).toBeInTheDocument()
  })
})
