import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { SoftwareTable } from './SoftwareTable'
import type { SoftwareItem } from '../../types/MigrateTypes'
import '@testing-library/jest-dom'

vi.mock('../../utils/analytics', () => ({
  logMigrateAction: vi.fn(),
}))

const baseSoftwareItem: SoftwareItem = {
  softwareName: 'TestLib',
  categoryId: 'CSC-001',
  categoryName: 'Cryptographic Libraries',
  infrastructureLayer: 'Application',
  pqcSupport: 'Yes (ML-KEM)',
  pqcCapabilityDescription: 'Supports ML-KEM key exchange',
  licenseType: 'Open Source',
  license: 'Apache-2.0',
  latestVersion: '3.0',
  releaseDate: '2026-01-15',
  fipsValidated: 'Yes (FIPS 140-3)',
  pqcMigrationPriority: 'Critical',
  primaryPlatforms: 'Linux, macOS',
  targetIndustries: 'All industries',
  authoritativeSource: 'https://example.com',
  repositoryUrl: 'https://github.com/test/lib',
  productBrief: 'A test library',
  sourceType: 'Trusted Vendor',
  verificationStatus: 'Verified',
  lastVerifiedDate: '2026-02-13',
  migrationPhases: 'prepare,test,migrate',
  learningModules: '',
}

function makeItem(overrides: Partial<SoftwareItem> = {}): SoftwareItem {
  return { ...baseSoftwareItem, ...overrides }
}

describe('SoftwareTable', () => {
  describe('PQC Support badges', () => {
    it('renders green badge for "Yes" support', () => {
      render(<SoftwareTable data={[makeItem({ pqcSupport: 'Yes (ML-KEM)' })]} />)
      const badge = screen.getByText('Yes (ML-KEM)')
      expect(badge.className).toContain('bg-status-success')
      expect(badge.className).toContain('text-status-success')
    })

    it('renders warning badge for "Limited" support', () => {
      render(<SoftwareTable data={[makeItem({ pqcSupport: 'Limited (partial)' })]} />)
      const badge = screen.getByText('Limited (partial)')
      expect(badge.className).toContain('bg-status-warning')
      expect(badge.className).toContain('text-status-warning')
    })

    it('renders primary badge for "Planned" support', () => {
      render(<SoftwareTable data={[makeItem({ pqcSupport: 'Planned (in progress)' })]} />)
      const badge = screen.getByText('Planned (in progress)')
      expect(badge.className).toContain('text-primary')
      expect(badge.className).toContain('bg-primary/10')
    })

    it('renders destructive badge for "No" support', () => {
      render(<SoftwareTable data={[makeItem({ pqcSupport: 'No' })]} />)
      const badge = screen.getByText('No')
      expect(badge.className).toContain('text-destructive')
      expect(badge.className).toContain('bg-destructive/10')
    })

    it('renders muted badge for unknown/empty support', () => {
      render(<SoftwareTable data={[makeItem({ pqcSupport: '' })]} />)
      const badge = screen.getByText('Unknown')
      expect(badge.className).toContain('text-muted-foreground')
      expect(badge.className).toContain('bg-muted/50')
    })
  })

  describe('FIPS badges', () => {
    it('renders "Validated" for FIPS 140-3', () => {
      render(<SoftwareTable data={[makeItem({ fipsValidated: 'Yes (FIPS 140-3)' })]} />)
      expect(screen.getByText('Validated')).toBeInTheDocument()
      const badge = screen.getByText('Validated').closest('span')!
      expect(badge.className).toContain('bg-status-success')
    })

    it('renders "Validated" for FIPS 203', () => {
      render(<SoftwareTable data={[makeItem({ fipsValidated: 'Yes (FIPS 203)' })]} />)
      expect(screen.getByText('Validated')).toBeInTheDocument()
    })

    it('renders "Partial" for other "Yes" variants', () => {
      render(<SoftwareTable data={[makeItem({ fipsValidated: 'Yes (via partners)' })]} />)
      expect(screen.getByText('Partial')).toBeInTheDocument()
      const badge = screen.getByText('Partial').closest('span')!
      expect(badge.className).toContain('bg-status-warning')
    })

    it('renders "No" for everything else', () => {
      render(<SoftwareTable data={[makeItem({ fipsValidated: 'No' })]} />)
      expect(screen.getByText('No')).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    const items = [
      makeItem({ softwareName: 'Zebra', categoryId: 'CSC-001' }),
      makeItem({ softwareName: 'Alpha', categoryId: 'CSC-002' }),
      makeItem({ softwareName: 'Mango', categoryId: 'CSC-003' }),
    ]

    it('sorts ascending by product name by default', () => {
      render(<SoftwareTable data={items} />)
      const cells = screen.getAllByText(/^(Alpha|Mango|Zebra)$/)
      expect(cells[0]).toHaveTextContent('Alpha')
      expect(cells[1]).toHaveTextContent('Mango')
      expect(cells[2]).toHaveTextContent('Zebra')
    })

    it('toggles to descending on second click', () => {
      render(<SoftwareTable data={items} />)
      const productHeader = screen.getByText('Product').closest('th')!
      fireEvent.click(productHeader)
      const cells = screen.getAllByText(/^(Alpha|Mango|Zebra)$/)
      expect(cells[0]).toHaveTextContent('Zebra')
      expect(cells[2]).toHaveTextContent('Alpha')
    })

    it('sets aria-sort on active column', () => {
      render(<SoftwareTable data={items} />)
      const productHeader = screen.getByText('Product').closest('th')!
      expect(productHeader).toHaveAttribute('aria-sort', 'ascending')

      const categoryHeader = screen.getByText('Category').closest('th')!
      expect(categoryHeader).toHaveAttribute('aria-sort', 'none')
    })
  })

  describe('row expansion', () => {
    it('expands row on click to show description', () => {
      render(<SoftwareTable data={[makeItem()]} />)

      expect(screen.queryByText('Supports ML-KEM key exchange')).not.toBeInTheDocument()

      const row = screen.getByText('TestLib').closest('tr')!
      fireEvent.click(row)

      expect(screen.getByText('Supports ML-KEM key exchange')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Capability Details')).toBeInTheDocument()
    })

    it('collapses row on second click', () => {
      render(<SoftwareTable data={[makeItem()]} />)

      const row = screen.getByText('TestLib').closest('tr')!
      fireEvent.click(row)
      expect(screen.getByText('Supports ML-KEM key exchange')).toBeInTheDocument()

      fireEvent.click(row)
      expect(screen.queryByText('Supports ML-KEM key exchange')).not.toBeInTheDocument()
    })
  })

  describe('status badges', () => {
    it('renders "New" badge with primary color', () => {
      render(<SoftwareTable data={[makeItem({ status: 'New' })]} />)
      const badge = screen.getByText('New')
      expect(badge.className).toContain('text-primary')
      expect(badge.className).toContain('bg-primary/10')
    })

    it('renders "Updated" badge with warning color', () => {
      render(<SoftwareTable data={[makeItem({ status: 'Updated' })]} />)
      const badge = screen.getByText('Updated')
      expect(badge.className).toContain('text-status-warning')
    })

    it('does not render badge when no status', () => {
      render(<SoftwareTable data={[makeItem({ status: undefined })]} />)
      expect(screen.queryByText('New')).not.toBeInTheDocument()
      expect(screen.queryByText('Updated')).not.toBeInTheDocument()
    })
  })

  describe('migration priority colors', () => {
    it('renders Critical priority in error color', () => {
      render(<SoftwareTable data={[makeItem({ pqcMigrationPriority: 'Critical' })]} />)
      const row = screen.getByText('TestLib').closest('tr')!
      fireEvent.click(row)
      // Find the one in the expanded details (not the badge)
      const detailPriority = within(
        screen.getByText('Migration Priority:').closest('div')!
      ).getByText('Critical')
      expect(detailPriority.className).toContain('text-status-error')
    })

    it('renders High priority in warning color', () => {
      render(<SoftwareTable data={[makeItem({ pqcMigrationPriority: 'High' })]} />)
      const row = screen.getByText('TestLib').closest('tr')!
      fireEvent.click(row)
      const detailPriority = within(
        screen.getByText('Migration Priority:').closest('div')!
      ).getByText('High')
      expect(detailPriority.className).toContain('text-status-warning')
    })

    it('renders Medium priority in primary color', () => {
      render(<SoftwareTable data={[makeItem({ pqcMigrationPriority: 'Medium' })]} />)
      const row = screen.getByText('TestLib').closest('tr')!
      fireEvent.click(row)
      const detailPriority = within(
        screen.getByText('Migration Priority:').closest('div')!
      ).getByText('Medium')
      expect(detailPriority.className).toContain('text-primary')
    })

    it('renders Low priority in muted color', () => {
      render(<SoftwareTable data={[makeItem({ pqcMigrationPriority: 'Low' })]} />)
      const row = screen.getByText('TestLib').closest('tr')!
      fireEvent.click(row)
      const detailPriority = within(
        screen.getByText('Migration Priority:').closest('div')!
      ).getByText('Low')
      expect(detailPriority.className).toContain('text-muted-foreground')
    })
  })

  describe('external links', () => {
    it('renders repository link with correct attributes', () => {
      render(<SoftwareTable data={[makeItem()]} />)
      const row = screen.getByText('TestLib').closest('tr')!
      fireEvent.click(row)

      const repoLink = screen.getByText('Repository / Download').closest('a')!
      expect(repoLink).toHaveAttribute('href', 'https://github.com/test/lib')
      expect(repoLink).toHaveAttribute('target', '_blank')
      expect(repoLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('hides repository link when URL is empty', () => {
      render(<SoftwareTable data={[makeItem({ repositoryUrl: '' })]} />)
      const row = screen.getByText('TestLib').closest('tr')!
      fireEvent.click(row)

      expect(screen.queryByText('Repository / Download')).not.toBeInTheDocument()
    })
  })
})
