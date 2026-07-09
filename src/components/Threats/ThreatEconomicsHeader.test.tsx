// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ThreatEconomicsHeader } from './ThreatEconomicsHeader'
import { getCrqcConsensus } from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'

// Default Z is single-sourced from CRQC_ESTIMATES (Threats #1) rather than a
// hardcoded literal — compute it the same way the component does so this test
// doesn't drift if the estimates list changes.
const DEFAULT_Z = getCrqcConsensus().zEstimate

describe('ThreatEconomicsHeader — Mosca two-clock calculator', () => {
  it('frames both attacker models and runs a separate clock for each', () => {
    render(<ThreatEconomicsHeader />)
    // both framing cards are always visible
    expect(screen.getByText(/Harvest Now, Decrypt Later/)).toBeInTheDocument()
    expect(screen.getByText(/Harvest Now, Forge Later/)).toBeInTheDocument()

    // expand the calculator
    fireEvent.click(screen.getByRole('button', { name: /Mosca calculator/i }))

    // two deadline rows, one per model — defaults (X=10, Y=5, Z=DEFAULT_Z)
    const hndlRow = screen.getByText('HNDL').closest('div.rounded-lg') as HTMLElement
    const hnflRow = screen.getByText('HNFL').closest('div.rounded-lg') as HTMLElement
    const defaultDeadline = String(DEFAULT_Z - 10 - 5)
    expect(within(hndlRow).getByText(defaultDeadline)).toBeInTheDocument()
    expect(within(hnflRow).getByText(defaultDeadline)).toBeInTheDocument()
  })

  it('moving the HNFL credential-validity X changes only the HNFL deadline', () => {
    render(<ThreatEconomicsHeader />)
    fireEvent.click(screen.getByRole('button', { name: /Mosca calculator/i }))

    // shorten HNFL credential validity to 2y → HNFL deadline = DEFAULT_Z − 2 − 5
    fireEvent.change(screen.getByLabelText(/Credential validity/i), { target: { value: '2' } })

    const hndlRow = screen.getByText('HNDL').closest('div.rounded-lg') as HTMLElement
    const hnflRow = screen.getByText('HNFL').closest('div.rounded-lg') as HTMLElement
    const unchangedDeadline = String(DEFAULT_Z - 10 - 5)
    const movedDeadline = String(DEFAULT_Z - 2 - 5)
    // HNDL clock untouched, HNFL clock moved independently
    expect(within(hndlRow).getByText(unchangedDeadline)).toBeInTheDocument()
    expect(within(hnflRow).getByText(movedDeadline)).toBeInTheDocument()
  })
})
