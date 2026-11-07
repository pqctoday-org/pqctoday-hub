// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InventoryLifecycleSimulator } from './InventoryLifecycleSimulator'
describe('iteration-only teaching curve', () => {
  it('explains the default and an unchecked next iteration without claiming measured improvement', () => {
    render(<InventoryLifecycleSimulator />)
    expect(screen.getByText(/not on completed asset actions/)).toBeInTheDocument()
    expect(screen.getByText('9.5 h')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reassess · next iteration' }))
    expect(screen.getByText('Iteration 2')).toBeInTheDocument()
    expect(screen.getByText('4.8 h')).toBeInTheDocument()
    expect(screen.getByText(/It is not measured performance or a forecast/)).toBeInTheDocument()
    expect(screen.queryByText(/Every iteration reduces/)).not.toBeInTheDocument()
  })
})
