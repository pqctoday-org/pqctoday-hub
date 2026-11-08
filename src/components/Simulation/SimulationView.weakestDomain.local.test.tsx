// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SimulationView } from './SimulationView'
import { SimConceptPeek } from './autorun/SimConceptPeek'
import { EXEC_TOUR_CONCEPTS } from './autorun/execTourConfig'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { loadSampleOrganisation } from './sampleOrganisation'
import { SIM_TREES, flattenTree, isGatingStep, achievedTreeLevel } from '@/simulation'
import { deriveMaturity, MATURITY_DOMAINS } from '@/data/maturityModel'

const phone = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: phone }))

// Seed only existing completion keys, leaving the entire vendor phase undone.
// This exercises the real activity-tree -> domain -> scoreboard/view pipeline;
// neither deriveMaturity nor any SimulationView numerical result is mocked.
function unevenProgress() {
  const auto = Object.entries(SIM_TREES).flatMap(([phase, tree]) =>
    phase === 'p7'
      ? []
      : flattenTree(tree)
          .filter(isGatingStep)
          .map((step) => `${phase}::${step.to}`)
  )
  const levels = new Map(
    Object.entries(SIM_TREES).map(([phase, tree]) => [
      phase,
      achievedTreeLevel(tree, (step) => auto.includes(`${phase}::${step.to}`)),
    ])
  )
  const domains = deriveMaturity(true, (phase) => levels.get(phase) ?? 0)
  expect(domains.scores.vendor).toBe(1)
  expect(Object.values(domains.scores).some((score) => score >= 2)).toBe(true)
  expect(domains.overall).toBe(1)
  useSimulationStore.setState({ auto, tourSeen: true })
}
function show() {
  return render(
    <MemoryRouter initialEntries={['/simulation']}>
      <SimulationView />
    </MemoryRouter>
  )
}
beforeEach(() => {
  phone.mockReturnValue(false)
  useSimulationStore.getState().reset()
  useAssessmentResultStore.getState().reset()
  loadSampleOrganisation()
  unevenProgress()
})

describe('weakest-domain maturity across Simulation surfaces', () => {
  it('retains zero for an unassessed weak domain instead of averaging its advanced peers', () => {
    const levels = (phase: string) => (phase === 'p7' ? 0 : 4)
    const result = deriveMaturity(false, levels)
    expect(result.scores).toEqual({
      inventory: 4,
      governance: 4,
      pilots: 4,
      vendor: 0,
      compliance: 4,
      agility: 4,
      risk: 4,
    })
    expect(result.overall).toBe(0)
    expect(result.gating).toEqual(['vendor'])
    const mean =
      Object.values(result.scores).reduce((sum, value) => sum + value, 0) / MATURITY_DOMAINS.length
    expect(mean).toBeCloseTo(24 / 7)
    expect(result.overall).not.toBe(mean)
    const assessed = deriveMaturity(true, levels)
    expect(assessed.scores.vendor).toBe(1)
    expect(assessed.overall).toBe(1)
  })

  it('shows the assessment floor rather than peer average in the desktop header, Progress and Signals', () => {
    show()
    const header = screen.getByTitle(
      'Program-wide maturity — full detail (objectives, HNDL/TNFL tracks) is in the Signals tab.'
    )
    expect(within(header).getByText('1.0/4')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Progress' }))
    expect(screen.getByText(/Program maturity: L1 \/ 4/)).toBeInTheDocument()
    expect(screen.getByText(/weakest:.*Vendor/)).toBeInTheDocument()
    // The individual completed-phase controls remain advanced while the
    // program headline remains low: equal-level fixtures cannot catch an average.
    expect(useSimulationStore.getState().auto.length).toBeGreaterThan(0)
    expect(useSimulationStore.getState().auto.some((id) => id.startsWith('p7::'))).toBe(false)
    fireEvent.click(screen.getByRole('tab', { name: 'Signals' }))
    expect(screen.getByText('Maturity 1.0 / 4')).toBeInTheDocument()
  })

  it('uses the same low maturity in the phone summary and explains its scale', () => {
    phone.mockReturnValue(true)
    show()
    expect(screen.getByText('Level 1 of 4')).toBeInTheDocument()
    expect(
      screen.getByText(
        'The weakest domain across the framework’s own 0–4 ladder — not a percentage of what this simulation happens to offer.'
      )
    ).toBeInTheDocument()
  })

  it('does not invent a progressed maturity headline when the assessment prerequisite is absent', () => {
    useAssessmentResultStore.getState().reset()
    show()
    expect(screen.getByRole('link', { name: 'Start the assessment' })).toHaveAttribute(
      'href',
      '/assess'
    )
    expect(screen.queryByText('1.0/4')).not.toBeInTheDocument()
    expect(screen.queryByText('Level 1 of 4')).not.toBeInTheDocument()
  })

  it('renders the actual concept explanation as lowest, not average, for the uneven-domain scenario', () => {
    render(<SimConceptPeek concepts={[EXEC_TOUR_CONCEPTS['weakest-domain-maturity']]} />)
    expect(screen.getByText('Maturity = your weakest domain')).toBeInTheDocument()
    expect(
      screen.getByText(/isn’t an average across domains — it’s the lowest of them/)
    ).toBeInTheDocument()
  })
})
