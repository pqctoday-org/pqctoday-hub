// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { TLSInspectionLab } from './TLSInspectionLab'
describe('TLS inspection aggregate volume has volume units', () => {
  it('uses decimal MB for the selected connection count and explicit two-leg chain assumption', async () => {
    render(<TLSInspectionLab />)
    await userEvent.click(screen.getByRole('button', { name: 'Full Inspect' }))
    // Fixture: 1,000 connections × 2.7 decimal KB × two legs = 5,400 KB = 5.4 MB.
    expect(screen.getByText('5.4 MB')).toBeInTheDocument()
    expect(screen.getByText('Illustrative aggregate chain volume')).toBeInTheDocument()
    expect(screen.getByText(/1,000 connections × 2.7 KB × 2 legs/)).toHaveTextContent(
      'does not model a time interval or data rate'
    )
    expect(screen.queryByText(/Mbps/)).not.toBeInTheDocument()
    const count = screen.getByRole('slider', { name: 'Concurrent connections' })
    fireEvent.change(count, { target: { value: '2000' } })
    expect(screen.getByText('10.8 MB')).toBeInTheDocument()
    fireEvent.change(count, { target: { value: '10000' } })
    expect(screen.getByText('54 MB')).toBeInTheDocument()
    fireEvent.change(count, { target: { value: '100' } })
    expect(screen.getByText('0.5 MB')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Pass-Through' }))
    expect(screen.queryByText('Illustrative aggregate chain volume')).not.toBeInTheDocument()
  })
})
