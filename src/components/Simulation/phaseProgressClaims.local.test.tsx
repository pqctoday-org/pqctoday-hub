// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { DecisionSection } from './sections'
import { SimPhaseRunComplete } from './autorun/SimPhaseRunComplete'
import { completeStepGenuine } from './autorun/simAutoRun'
import { SIM_TREES, flattenTree, type TreeStep } from '@/simulation'
import { useSimulationStore } from '@/store/useSimulationStore'
import type { MoveCtx } from '@/data/simMoves'
import type { PhaseId } from '@/data/frameworkPhases'

const ctx: MoveCtx = {
  country: { id: 'DE', label: 'Germany (BSI)', hybrid: 'required', endState: 'hybrid' },
  sector: { id: 'healthcare', label: 'Healthcare', x: 10 },
  size: { id: 'mid', label: 'Mid-size' },
  over: 0,
}
const tree = SIM_TREES.p0!
const band = tree.levels[0]!
const act = band.activities[0]!
const nextMove = { band, act, step: act.steps[0]! }
const gate = { id: 'G0', criterion: 'Review the fictional mandate and scope.' }
const callbacks = {
  onVisitRef: vi.fn(),
  canEmbed: () => false,
  onOpenStep: vi.fn(),
}
function phaseCard(cleared: boolean) {
  return (
    <MemoryRouter>
      <DecisionSection
        phaseId="p0"
        ctx={ctx}
        nextMove={cleared ? null : nextMove}
        level={cleared ? 4 : 0}
        stepsDone={cleared ? 1 : 0}
        stepsTotal={1}
        gate={gate}
        pitfalls={tree.pitfalls}
        {...callbacks}
      />
    </MemoryRouter>
  )
}
function workshopFixture(): { phase: PhaseId; step: TreeStep } {
  for (const [phase, candidate] of Object.entries(SIM_TREES)) {
    const step = candidate && flattenTree(candidate).find((item) => item.kind === 'workshop')
    if (step) return { phase: phase as PhaseId, step }
  }
  throw new Error('Current scenario trees must contain a workshop fixture')
}
beforeEach(() => {
  vi.clearAllMocks()
  useSimulationStore.getState().reset()
})
afterEach(() => {
  useSimulationStore.getState().reset()
})

describe('sample phase progress is not certification', () => {
  it('retains cleared-phase credit with a sample-gate caption and no certification claim', () => {
    render(phaseCard(true))
    expect(screen.getByText('✓ PHASE CLEARED')).toBeInTheDocument()
    expect(screen.getByText('Scenario progress complete — sample Gate G0.')).toBeInTheDocument()
    expect(
      screen.queryByText(/Every maturity level earned|Gate .* certified/i)
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Option [A-Z]:/ })).not.toBeInTheDocument()
    expect(callbacks.onOpenStep).not.toHaveBeenCalled()
  })

  it('shows an actual next decision while incomplete and clears the completion caption on rerender', () => {
    const view = render(phaseCard(true))
    view.rerender(phaseCard(false))
    expect(screen.queryByText('✓ PHASE CLEARED')).not.toBeInTheDocument()
    expect(screen.queryByText(/Scenario progress complete/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Option [A-Z]:/ }).length).toBeGreaterThan(0)
    expect(
      screen.queryByText(/Every maturity level earned|Gate .* certified/i)
    ).not.toBeInTheDocument()
  })

  it('describes a guided phase tour and its exit criterion without declaring the criterion met', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <SimPhaseRunComplete
          phaseFocus={{
            phase: 'p0',
            name: 'Sample executive mandate',
            summary: 'Fictional chapter learning context.',
            gate: gate.criterion,
          }}
          onClose={onClose}
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Sample executive mandate tour complete' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('You’ve reached the end of this phase’s guided tour.')
    ).toBeInTheDocument()
    expect(screen.getByText('Phase exit criterion:')).toBeInTheDocument()
    expect(screen.getByText(gate.criterion, { exact: false })).toBeInTheDocument()
    expect(
      screen.queryByText(/Exit gate met|Gate .* certified|Every maturity level earned/i)
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['narrated-example', 'viewed'],
    ['learner', 'practiced'],
  ] as const)(
    'preserves %s activity credit in the actual portable learning record as %s',
    (origin, status) => {
      const { phase, step } = workshopFixture()
      expect(completeStepGenuine(step, 'financial', { phase, origin })).toBe(true)
      const state = useSimulationStore.getState()
      expect(state.visitedWorkshops).toContain(step.workshopId)
      const record = state.evidence.find((item) => item.resourceId === step.workshopId)
      expect(record).toMatchObject({ phase, kind: 'workshop', origin, status })
      const exported = JSON.parse(state.exportSave())
      expect(exported.state.visitedWorkshops).toContain(step.workshopId)
      expect(
        exported.state.evidence.find(
          (item: { resourceId: string }) => item.resourceId === step.workshopId
        )
      ).toEqual(record)
      expect(record).not.toHaveProperty('certified')
      expect(record?.status).not.toMatch(/certif/i)
      expect(record?.origin).not.toMatch(/certif/i)
    }
  )
})
