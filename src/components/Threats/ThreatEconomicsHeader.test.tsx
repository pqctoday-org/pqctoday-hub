// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ThreatEconomicsHeader } from './ThreatEconomicsHeader'
import { getCrqcConsensus } from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'

// Default Z is single-sourced from CRQC_ESTIMATES (Threats #1) rather than a
// hardcoded literal — compute it the same way the component does so this test
// doesn't drift if the estimates list changes.
const DEFAULT_Z = getCrqcConsensus().zEstimate

// Mirrors the component's own CURRENT_YEAR — used to derive slider inputs
// that land on deterministic OVERDUE / non-OVERDUE rems regardless of what
// year the suite actually runs in.
const CURRENT_YEAR = new Date().getFullYear()

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

  it('OVERDUE row frames the window as already closed; a non-overdue row keeps ordinary framing', () => {
    // Grade-A remediation Phase 2 (PLAN-08-THREATS.md): a bare past year next
    // to "migration deadline" reads as a broken calculator — same fix as
    // SectorExposureHero, applied here for consistency. Drive one row deep
    // into OVERDUE and the other to exactly rem=0 (CRITICAL, not overdue) so
    // both branches are exercised in one deterministic render.
    render(<ThreatEconomicsHeader />)
    fireEvent.click(screen.getByRole('button', { name: /Mosca calculator/i }))

    const crqcYear = Math.min(2045, Math.max(2028, CURRENT_YEAR + 2))
    fireEvent.change(screen.getByLabelText(/CRQC year/i), { target: { value: String(crqcYear) } })
    fireEvent.change(screen.getByLabelText(/Migration time/i), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/^Data lifetime/i), { target: { value: '75' } })
    fireEvent.change(screen.getByLabelText(/Credential validity/i), { target: { value: '1' } })

    const hndlDeadline = String(crqcYear - 75 - 1) // deep in the past
    const hnflDeadline = String(crqcYear - 1 - 1) // rem === 0 -> critical, not overdue

    const hndlRow = screen.getByText('HNDL').closest('div.rounded-lg') as HTMLElement
    const hnflRow = screen.getByText('HNFL').closest('div.rounded-lg') as HTMLElement

    // HNDL: far OVERDUE — explicit "closed" framing, real year still shown in full.
    expect(within(hndlRow).getByText(hndlDeadline)).toBeInTheDocument()
    expect(within(hndlRow).getByText('Closed in')).toBeInTheDocument()
    expect(within(hndlRow).getByText('migration window')).toBeInTheDocument()
    expect(within(hndlRow).getByText('OVERDUE')).toBeInTheDocument()
    expect(within(hndlRow).getByText(/should have started/)).toBeInTheDocument()

    // HNFL: rem === 0, CRITICAL but not overdue — ordinary framing unchanged.
    expect(within(hnflRow).getByText(hnflDeadline)).toBeInTheDocument()
    expect(within(hnflRow).queryByText('Closed in')).not.toBeInTheDocument()
    expect(within(hnflRow).getByText('migration deadline')).toBeInTheDocument()
    expect(within(hnflRow).getByText('CRITICAL')).toBeInTheDocument()
  })
})
