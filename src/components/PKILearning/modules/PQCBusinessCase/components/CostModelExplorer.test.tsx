// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CostModelExplorer } from './CostModelExplorer'

describe('CostModelExplorer', () => {
  it('renders the five migration-cost lenses', () => {
    render(<CostModelExplorer />)
    expect(screen.getByText(/Parametric \(budget-anchored\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Bottom-up \(activity-based\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Probabilistic \(Monte Carlo\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Judgemental \(scenario\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Analogical \(historical\)/i)).toBeInTheDocument()
  })

  it('shows the ALE cost-of-inaction reference and the comparison header', () => {
    render(<CostModelExplorer />)
    expect(screen.getByText(/Five ways to price the same migration/i)).toBeInTheDocument()
    // ALE appears as prose framing and as the reference-line label — at least one.
    expect(screen.getAllByText(/cost of inaction/i).length).toBeGreaterThan(0)
  })

  it('exposes the four scenario sliders and a Run Monte Carlo control', () => {
    render(<CostModelExplorer />)
    expect(screen.getByLabelText(/Systems in scope/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Annual IT budget/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Complexity \/ legacy factor/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Planning horizon/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Run Monte Carlo/i })).toBeInTheDocument()
  })
})
