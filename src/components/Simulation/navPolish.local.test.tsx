// SPDX-License-Identifier: GPL-3.0-only
/**
 * 09-28 nav remediation (WP6.5, WP7b, WP7e) — smaller ways back:
 *  - a migration (edge) decision can be undone, freeing its capacity slot;
 *  - Escape closes the first-run tour and the quarter report;
 *  - a new excursion out of the sim brings the dismissed Resume strip back.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ArchitecturePanel } from './ArchitecturePanel'
import { SimTour } from './SimTour'
import { QuarterReport } from './sections'
import { markSimResume } from './simChrome'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'

vi.mock('./MermaidDiagram', () => ({ MermaidDiagram: () => null }))

describe('edge decisions can be undone (WP6.5)', () => {
  beforeEach(() => {
    useSimulationStore.setState({ edgeDecisions: {} })
    useMigrateSelectionStore.setState({ myProducts: [], choice: {} })
  })

  it('Undo removes the decision and restores the capacity slot', () => {
    // p5Frac≈0.5 of 3 migratable → 1 unlocked
    render(<ArchitecturePanel size="small" country="US" p5Frac={0.5} />)
    fireEvent.click(screen.getByRole('button', { name: /Migrate eligible/i }))
    expect(screen.getByText(/1\/6 links migrated/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Migrate eligible \(0\)/i })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /^Undo migration of/i }))
    expect(Object.keys(useSimulationStore.getState().edgeDecisions)).toHaveLength(0)
    expect(screen.getByText(/0\/6 links migrated/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Migrate eligible \(1\)/i })).toBeEnabled()
  })
})

describe('Escape closes the tour and the quarter report (WP7b)', () => {
  it('SimTour: Escape = Skip', () => {
    const onClose = vi.fn()
    render(<SimTour onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('QuarterReport: Escape closes', () => {
    const onClose = vi.fn()
    render(
      <QuarterReport
        report={{
          from: 'Q1 2026',
          to: 'Q2 2026',
          clockFrom: 3,
          clockTo: 2.75,
          over: 0,
          clearedFrom: 0,
          clearedTo: 0,
          totalPhases: 9,
          events: [],
          aiProgress: [],
          recommend: '',
        }}
        onClose={onClose}
      />
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('the Resume strip comes back on a new excursion (WP7e)', () => {
  it('markSimResume clears the session "dismissed" flag', () => {
    sessionStorage.setItem('sim:resume:dismissed', '1')
    markSimResume()
    expect(sessionStorage.getItem('sim:resume:dismissed')).toBeNull()
    expect(sessionStorage.getItem('sim:resume')).toBe('1')
  })
})
