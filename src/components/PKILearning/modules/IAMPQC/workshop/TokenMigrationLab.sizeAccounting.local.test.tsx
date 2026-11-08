// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TokenMigrationLab } from './TokenMigrationLab'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({ isReady: false, moduleRef: { current: null } }),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))

describe('Unrun token sizing model', () => {
  it('shows encoded totals for native algorithm selections without signing or claiming transport fit', () => {
    render(<TokenMigrationLab />)
    expect(screen.getByText('755')).toBeInTheDocument()
    expect(
      screen.getByText(/Encoded header 87 \+ payload 324 \+ signature 342 \+ 2 separators = 755/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Algorithm:' }))
    fireEvent.click(screen.getByRole('option', { name: 'ML-DSA-65 (NIST Level 3)' }))
    expect(screen.getByText('4,832')).toBeInTheDocument()
    expect(
      screen.getByText(/Encoded header 94 \+ payload 324 \+ signature 4412 \+ 2 separators = 4832/)
    ).toBeInTheDocument()
    expect(screen.getByText(/does not establish a valid, interoperable token/)).toBeInTheDocument()
    expect(screen.getByText(/Token length alone does not establish fit/)).toBeInTheDocument()
    expect(screen.queryByText(/must use ML-DSA-44 or switch/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign Token' })).toBeEnabled()
  })
})
