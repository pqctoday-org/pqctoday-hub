// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MeasureStatus, RecurrenceProgressBanner } from './stepStatus'
import type { TreeStep } from '@/simulation/types'

const measure: TreeStep = {
  kind: 'measure',
  label: 'Confirm Year-1 budget secured',
  to: '/simulation',
  metricId: 'budget-secured-pct',
  minValue: 60,
}

describe('MeasureStatus', () => {
  it('shows the live value against the target, never a link back to /simulation', () => {
    render(<MeasureStatus step={measure} value={50.4} />)
    expect(screen.getByText(/Measured now: 50% · needs 60%/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('offers the action that moves the metric until it is met', () => {
    const onAct = vi.fn()
    const coverage = { ...measure, metricId: 'migration-coverage-pct', minValue: 40 }
    const { rerender } = render(
      <MeasureStatus step={coverage} value={25} onAct={onAct} actLabel="Open the architecture" />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open the architecture' }))
    expect(onAct).toHaveBeenCalled()
    rerender(
      <MeasureStatus step={coverage} value={45} onAct={onAct} actLabel="Open the architecture" />
    )
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText(/✓ Measured now: 45%/)).toBeInTheDocument()
  })

  it('says when the run cannot measure the condition yet', () => {
    render(<MeasureStatus step={measure} value={null} />)
    expect(screen.getByText(/not measurable yet/)).toBeInTheDocument()
  })
})

describe('RecurrenceProgressBanner', () => {
  it('tells the learner to come back in a later quarter once this one is saved', () => {
    render(<RecurrenceProgressBanner quarters={['Q1 2026']} needed={2} currentQuarter="Q1 2026" />)
    expect(screen.getByText(/saved in 1 of 2 quarters/)).toBeInTheDocument()
    expect(screen.getByText(/End the quarter/)).toBeInTheDocument()
  })

  it('reports completion', () => {
    render(
      <RecurrenceProgressBanner
        quarters={['Q1 2026', 'Q2 2026']}
        needed={2}
        currentQuarter="Q2 2026"
      />
    )
    expect(screen.getByText(/complete/)).toBeInTheDocument()
  })
})
