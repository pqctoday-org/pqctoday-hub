// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'

vi.mock('@/data/migrateData', () => ({
  softwareData: [
    {
      productId: 'p-text',
      softwareName: 'Text Only Product',
      vendorId: 'Acme',
      vendorName: 'Acme',
      pqcSupport: 'Yes (ML-KEM)',
      pqcCapabilityDescription: 'Hybrid mode is not offered; pure ML-KEM only.',
    },
    {
      productId: 'p-struct',
      softwareName: 'Structured Product',
      vendorId: 'Globex',
      vendorName: 'Globex',
      pqcSupport: 'Yes (ML-KEM)',
      pqcCapabilityDescription: '',
      hybridKemSupport: ['tls-default'],
    },
  ],
}))

const selection = vi.hoisted(() => ({ ids: ['p-text'] as string[] }))
vi.mock('@/store/useMigrateSelectionStore', () => ({
  useSelectedProductIds: () => selection.ids,
}))

import { VendorScorecardBuilder } from './VendorScorecardBuilder'

describe('VendorScorecardBuilder hybrid label', () => {
  it('shows Not assessed, not a 0, for a product with no structured hybrid entry', () => {
    selection.ids = ['p-text']
    render(
      <MemoryRouter>
        <VendorScorecardBuilder />
      </MemoryRouter>
    )
    const card = screen.getByRole('button', { name: /Hybrid Mode Support/ })
    expect(card).toHaveTextContent('Not assessed')
    expect(card).toHaveTextContent('not counted')
    expect(card).toHaveTextContent('0/1 assessed')
    expect(
      screen.getAllByText(/structured hybrid key-exchange and composite-signature fields/i).length
    ).toBeGreaterThan(0)
  })

  it('shows a score once a selected product has a structured entry', () => {
    selection.ids = ['p-text', 'p-struct']
    render(
      <MemoryRouter>
        <VendorScorecardBuilder />
      </MemoryRouter>
    )
    const card = screen.getByRole('button', { name: /Hybrid Mode Support/ })
    expect(card).not.toHaveTextContent('not counted')
    expect(card).toHaveTextContent('1/2 assessed')
    expect(card).toHaveTextContent('100')
  })
})
