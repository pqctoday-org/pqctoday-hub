// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InventoryLifecycleSimulator } from './InventoryLifecycleSimulator'
describe('fictional duration calculation scope', () => {
  it('preserves the input-based mean through an unchecked next iteration', () => {
    render(<InventoryLifecycleSimulator />)
    expect(
      screen.getByText(/does not change those records or create a time saving/)
    ).toBeInTheDocument()
    expect(screen.getByText(/^Sample mean remediation time:/)).toHaveTextContent('8.0 h')
    fireEvent.click(screen.getByRole('button', { name: 'Reassess · next iteration' }))
    expect(screen.getByText('Iteration 2')).toBeInTheDocument()
    expect(screen.getByText(/^Sample mean remediation time:/)).toHaveTextContent('8.0 h')
    expect(
      screen.getByText(/not measured production performance or a forecast/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Every iteration reduces/)).not.toBeInTheDocument()
  })
})
