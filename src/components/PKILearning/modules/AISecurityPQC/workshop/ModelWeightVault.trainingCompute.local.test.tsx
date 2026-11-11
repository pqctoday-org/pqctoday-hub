// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ModelWeightVault } from './ModelWeightVault'

describe('fictional training compute example', () => {
  it('calculates from editable inputs without resetting on model-size changes', () => {
    render(<ModelWeightVault />)
    const count = screen.getByLabelText('Number of accelerators')
    const hours = screen.getByLabelText('Elapsed training time (hours)')
    const price = screen.getByLabelText('Price per accelerator-hour ($)')
    expect(screen.getByText('$19,200.00')).toBeInTheDocument()
    expect(screen.getByText(/This is accelerator compute only/)).toBeInTheDocument()
    fireEvent.change(hours, { target: { value: '120' } })
    expect(screen.getByText('$23,040.00')).toBeInTheDocument()
    fireEvent.change(hours, { target: { value: '100' } })
    fireEvent.change(count, { target: { value: '32' } })
    expect(screen.getByText('$9,600.00')).toBeInTheDocument()
    fireEvent.change(count, { target: { value: '64' } })
    fireEvent.change(price, { target: { value: '2.5' } })
    expect(screen.getByText('$16,000.00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Model Size:' }))
    fireEvent.click(screen.getByRole('option', { name: '13B Parameters' }))
    expect(screen.getByText('$16,000.00')).toBeInTheDocument()
    expect(count).toHaveValue(64)
  })

  it('accepts zero and fractional hours or price, and rejects incomplete or invalid inputs', () => {
    render(<ModelWeightVault />)
    const count = screen.getByLabelText('Number of accelerators')
    const hours = screen.getByLabelText('Elapsed training time (hours)')
    const price = screen.getByLabelText('Price per accelerator-hour ($)')
    fireEvent.change(count, { target: { value: '0' } })
    expect(screen.getByText('$0.00')).toBeInTheDocument()
    for (const value of ['', '-1', '1.5']) {
      fireEvent.change(count, { target: { value } })
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.queryByText(/compute cost$/)).not.toBeInTheDocument()
    }
    fireEvent.change(count, { target: { value: '1' } })
    fireEvent.change(hours, { target: { value: '0.5' } })
    fireEvent.change(price, { target: { value: '0.13' } })
    expect(screen.getByText('$0.07')).toBeInTheDocument()
    fireEvent.change(price, { target: { value: '-1' } })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.change(price, { target: { value: '1e999' } })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.change(price, { target: { value: '1' } })
    fireEvent.change(hours, { target: { value: '' } })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
