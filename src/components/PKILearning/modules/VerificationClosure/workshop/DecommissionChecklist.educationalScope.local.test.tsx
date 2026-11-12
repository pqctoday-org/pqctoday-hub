// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DecommissionChecklist } from './DecommissionChecklist'

function batch() {
  return screen.getByRole('region', { name: 'Nightly Batch Signer (Python)' })
}
function removeBatch() {
  const row = within(batch())
  fireEvent.click(row.getByRole('button', { name: 'Deprecate' }))
  fireEvent.click(row.getByRole('checkbox', { name: 'Sample dependents marked migrated' }))
  fireEvent.click(row.getByRole('button', { name: 'Remove' }))
  return batch()
}
describe('Independent fictional retirement observations', () => {
  it('retains a non-transport dependent copy despite Remove, then requires a separate follow-up', () => {
    render(<DecommissionChecklist />)
    expect(
      within(batch()).getByRole('button', { name: 'Read initial sample observation' })
    ).toBeDisabled()
    const row = within(removeBatch())
    expect(row.queryByLabelText('Sample observation record')).not.toBeInTheDocument()
    fireEvent.click(row.getByRole('button', { name: 'Read initial sample observation' }))
    expect(row.getByText(/Offline document verifier still trusts/)).toBeInTheDocument()
    expect(row.getByRole('button', { name: 'Log' })).toBeDisabled()
    fireEvent.click(row.getByRole('button', { name: 'Perform sample dependent-copy cleanup' }))
    expect(row.getByRole('button', { name: 'Log' })).toBeDisabled()
    expect(row.getByText(/dependent copy still present/)).toBeInTheDocument()
    fireEvent.click(row.getByRole('button', { name: 'Read follow-up sample observation' }))
    expect(row.getByText(/sw-batch-signer-followup-02/)).toBeInTheDocument()
    expect(row.getByRole('button', { name: 'Read initial sample observation' })).not.toHaveClass(
      'text-status-success'
    )
    expect(row.getByRole('button', { name: 'Read follow-up sample observation' })).toHaveClass(
      'text-status-success'
    )
    expect(row.getByRole('button', { name: 'Log' })).toBeEnabled()
    fireEvent.click(row.getByRole('button', { name: 'Log' }))
    expect(screen.getByText(/^1\/\d+ sample retirements checked/)).toBeInTheDocument()
    // Re-reading the earlier observation must withdraw completion, not retain a green outcome.
    fireEvent.click(row.getByRole('button', { name: 'Read initial sample observation' }))
    expect(row.getByRole('button', { name: 'Read follow-up sample observation' })).not.toHaveClass(
      'text-status-success'
    )
    expect(row.getByRole('button', { name: 'Log' })).toBeDisabled()
    expect(screen.getByText(/^0\/\d+ sample retirements checked/)).toBeInTheDocument()
  })
  it('invalidates dependent stages when migration is withdrawn, and resets each asset independently', () => {
    render(<DecommissionChecklist />)
    const row = within(removeBatch())
    fireEvent.click(row.getByRole('button', { name: 'Read initial sample observation' }))
    fireEvent.click(row.getByRole('button', { name: 'Perform sample dependent-copy cleanup' }))
    fireEvent.click(row.getByRole('button', { name: 'Read follow-up sample observation' }))
    fireEvent.click(row.getByRole('button', { name: 'Log' }))
    fireEvent.click(row.getByRole('checkbox', { name: 'Sample dependents marked migrated' }))
    expect(row.getByRole('button', { name: 'Remove' })).toBeDisabled()
    expect(row.getByRole('button', { name: 'Read initial sample observation' })).toBeDisabled()
    expect(row.queryByLabelText('Sample observation record')).not.toBeInTheDocument()
    fireEvent.click(row.getByRole('button', { name: 'Reset sample asset' }))
    expect(row.getByRole('checkbox')).not.toBeChecked()
    expect(row.getByRole('button', { name: 'Log' })).toBeDisabled()
    expect(screen.getByRole('note')).toHaveTextContent('trusted public keys and dependent copies')
  })
  it('allows a supplied clean observation and does not apply another asset’s residual record', () => {
    render(<DecommissionChecklist />)
    const row = within(screen.getByRole('region', { name: 'Corp Issuing CA G3' }))
    fireEvent.click(row.getByRole('button', { name: 'Deprecate' }))
    fireEvent.click(row.getByRole('checkbox'))
    fireEvent.click(row.getByRole('button', { name: 'Remove' }))
    expect(row.getByRole('button', { name: 'Log' })).toBeDisabled()
    fireEvent.click(row.getByRole('button', { name: 'Read initial sample observation' }))
    expect(row.getByText(/cert-intermediate-ca-post-action-01/)).toBeInTheDocument()
    expect(row.getByRole('button', { name: 'Log' })).toBeEnabled()
    expect(within(batch()).queryByLabelText('Sample observation record')).not.toBeInTheDocument()
  })
})
