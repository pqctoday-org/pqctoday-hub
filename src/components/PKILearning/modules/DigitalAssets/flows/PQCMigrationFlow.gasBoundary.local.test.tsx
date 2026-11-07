// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PQCMigrationFlow } from './PQCMigrationFlow'

vi.mock('./PQCLiveComparisonFlow', () => ({ PQCLiveComparisonFlow: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({
  KatValidationPanel: () => {
    throw new Error('This reader test must not enter Part5/KAT')
  },
}))

describe('Ethereum migration gas boundaries', () => {
  it('separates transaction-base gas from unverified signature figures without executing the live demo', () => {
    render(<PQCMigrationFlow onBack={vi.fn()} />)
    screen.getByRole('heading', { name: 'Part 1: Vulnerability Landscape' })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    screen.getByRole('heading', { name: /Part 3: Ethereum/ })
    expect(
      screen.getByText(
        /~21k is the standard ETH-transfer baseline, not the cost of ECDSA verification/
      )
    ).toBeVisible()
    expect(
      screen.getByText(/~300k–500k.*unverified illustrative figures, not a measured comparison/)
    ).toBeVisible()
    expect(
      screen.getByText(
        /transaction base cost, calldata, contract or precompile verification, account validation and bundler overhead separately/
      )
    ).toBeVisible()
    expect(
      screen.getByText(/~200k hash-based-signature figure is unverified and illustrative/)
    ).toBeVisible()
    expect(screen.queryByText(/vs ~21k for ECDSA/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    screen.getByRole('heading', { name: /Part 2: Bitcoin/ })
  })
})
