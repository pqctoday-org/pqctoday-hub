// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ThreatEconomicsHeader } from './ThreatEconomicsHeader'

describe('ThreatEconomicsHeader — Mosca two-clock calculator', () => {
  it('frames both attacker models and runs a separate clock for each', () => {
    render(<ThreatEconomicsHeader />)
    // both framing cards are always visible
    expect(screen.getByText(/Harvest Now, Decrypt Later/)).toBeInTheDocument()
    expect(screen.getByText(/Harvest Now, Forge Later/)).toBeInTheDocument()

    // expand the calculator
    fireEvent.click(screen.getByRole('button', { name: /Mosca calculator/i }))

    // two deadline rows, one per model — defaults (X=10, Y=5, Z=2035) → 2020 each
    const hndlRow = screen.getByText('HNDL').closest('div.rounded-lg') as HTMLElement
    const hnflRow = screen.getByText('HNFL').closest('div.rounded-lg') as HTMLElement
    expect(within(hndlRow).getByText('2020')).toBeInTheDocument()
    expect(within(hnflRow).getByText('2020')).toBeInTheDocument()
  })

  it('moving the HNFL credential-validity X changes only the HNFL deadline', () => {
    render(<ThreatEconomicsHeader />)
    fireEvent.click(screen.getByRole('button', { name: /Mosca calculator/i }))

    // shorten HNFL credential validity to 2y → HNFL deadline = 2035 − 2 − 5 = 2028
    fireEvent.change(screen.getByLabelText(/Credential validity/i), { target: { value: '2' } })

    const hndlRow = screen.getByText('HNDL').closest('div.rounded-lg') as HTMLElement
    const hnflRow = screen.getByText('HNFL').closest('div.rounded-lg') as HTMLElement
    // HNDL clock untouched, HNFL clock moved independently
    expect(within(hndlRow).getByText('2020')).toBeInTheDocument()
    expect(within(hnflRow).getByText('2028')).toBeInTheDocument()
  })
})
