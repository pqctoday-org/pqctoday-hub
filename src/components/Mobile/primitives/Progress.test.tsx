// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileProgress } from './Progress'

describe('MobileProgress', () => {
  it('exposes value via ARIA progressbar attributes', () => {
    render(<MobileProgress value={40} label="3 of 7" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '40')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(screen.getByText('3 of 7')).toBeInTheDocument()
  })

  it('clamps values below 0 and above 100', () => {
    const { rerender } = render(<MobileProgress value={-10} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    rerender(<MobileProgress value={150} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })
})
