// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { Introduction } from './Introduction'

describe('Migration Program framework attribution', () => {
  it('labels the seven-step sequence as the module recommendation and links scoped official guidance', () => {
    render(
      <MemoryRouter>
        <Introduction onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    )

    expect(
      screen.getByText(
        /this workshop's recommended planning model, not an official CISA or NIST phase taxonomy/i
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'NIST NCCoE migration FAQ' })).toHaveAttribute(
      'href',
      'https://pages.nist.gov/nccoe-migration-post-quantum-cryptography/'
    )
    expect(
      screen.getByRole('link', { name: 'federal automated discovery and inventory strategy' })
    ).toHaveAttribute(
      'href',
      'https://www.cisa.gov/sites/default/files/2024-09/Strategy-for-Migrating-to-Automated-PQC-Discovery-and-Inventory-Tools.pdf'
    )
    expect(
      screen.queryByText(/Aligned with CISA Post-Quantum Cryptography Initiative guidance/i)
    ).not.toBeInTheDocument()
  })
})
