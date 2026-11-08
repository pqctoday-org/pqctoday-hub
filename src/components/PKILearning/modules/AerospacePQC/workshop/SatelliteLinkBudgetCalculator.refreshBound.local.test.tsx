// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SatelliteLinkBudgetCalculator } from './SatelliteLinkBudgetCalculator'

// These cases exercise the unchanged model and real controls, not cryptography.
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))

describe('satellite refresh bound presentation', () => {
  it('qualifies the rounded default value and keeps exact-bound downstream counts', () => {
    render(<SatelliteLinkBudgetCalculator />)
    expect(screen.getByText('Illustrative refresh upper bound:')).toBeInTheDocument()
    expect(screen.getByText('≈2.53 hours')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText(/rounded for readability/)).toBeInTheDocument()
    expect(screen.getByText(/not a flight-system key-rotation recommendation/)).toBeInTheDocument()
  })

  it('shows MEO minutes and seconds and derives frequency from the unrounded bound', () => {
    render(<SatelliteLinkBudgetCalculator />)
    fireEvent.click(screen.getByRole('button', { name: /Orbit:/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Medium Earth Orbit (MEO)' }))
    expect(screen.getByText('≈15 min 12.2 s')).toBeInTheDocument()
    // ceil(24 /(0.001 /(0.00001 ×9472) ×24)) =95, not24.
    expect(screen.getByText('95')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Solar:/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Solar Maximum' }))
    expect(screen.getByText('≈1 min 31.2 s')).toBeInTheDocument()
    expect(screen.getByText('948')).toBeInTheDocument()
  })
})
