// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { AssetsWire } from './AssetsWire'
import type { BusinessMetrics } from '../../hooks/useBusinessMetrics'
import type { SoftwareItem } from '@/types/MigrateTypes'

function product(
  softwareName: string,
  fipsValidated: string,
  hasCertification: SoftwareItem['hasCertification']
): SoftwareItem {
  return {
    productId: softwareName.toLowerCase().replace(/\W+/g, '-'),
    softwareName,
    infrastructureLayer: 'Network',
    fipsValidated,
    hasCertification,
  } as unknown as SoftwareItem
}

function renderWire(products: SoftwareItem[]) {
  const metrics = { bookmarkedProducts: products } as unknown as BusinessMetrics
  render(
    <MemoryRouter>
      <AssetsWire metrics={metrics} />
    </MemoryRouter>
  )
}

describe('AssetsWire FIPS badge', () => {
  it('shows the FIPS 140-3 badge only for a source-backed certificate', () => {
    renderWire([product('Certified Firewall', 'Yes (FIPS 140-3 #4139)', 'yes')])
    const badge = screen.getByText('FIPS 140-3')
    expect(badge).toHaveClass('text-status-success')
  })

  it('shows the in-process and CAVP-only labels the Migrate page uses', () => {
    renderWire([
      product('In Process Module', 'In process (FIPS 140-3 submitted)', 'in_progress'),
      product('Algorithm Library', 'Yes (CAVP: ML-DSA, ML-KEM, SHA-2, SHA-3)', 'cavp'),
    ])
    expect(screen.getByText('FIPS 140-3 in process')).toHaveClass('text-status-warning')
    expect(screen.getByText('CAVP only')).toHaveClass('text-primary')
  })

  it('gives no FIPS badge to "No", FIPS 140-2 or "Trusted" rows', () => {
    renderWire([
      product('Plain Router', 'No', 'no'),
      product('Legacy Module', 'Yes (FIPS 140-2)', 'yes'),
      product('Trusted OS', 'Yes (Trusted)', 'yes'),
      product(
        'Mixed Vendor Module',
        'Yes (FIPS 140-2 L3 #4139; sunset 2026-09-21) (classical algorithms only)',
        'yes'
      ),
    ])
    expect(screen.queryByText('FIPS 140-3')).not.toBeInTheDocument()
    expect(screen.queryByText('FIPS 140-3 in process')).not.toBeInTheDocument()
    expect(screen.queryByText('CAVP only')).not.toBeInTheDocument()
    expect(screen.queryByText('FIPS')).not.toBeInTheDocument()
    // The products themselves still render.
    expect(screen.getByText('Plain Router')).toBeInTheDocument()
    expect(screen.getByText('Trusted OS')).toBeInTheDocument()
  })
})
