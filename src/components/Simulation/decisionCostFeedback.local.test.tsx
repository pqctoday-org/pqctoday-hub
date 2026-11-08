// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DecisionSection } from './sections'
import { SIM_TREES } from '@/simulation'
import type { MoveCtx } from '@/data/simMoves'
const ctx: MoveCtx = {
  country: { id: 'DE', label: 'Germany (BSI)', hybrid: 'required', endState: 'hybrid' },
  sector: { id: 'healthcare', label: 'Healthcare', x: 10 },
  size: { id: 'mid', label: 'Mid-size' },
  over: 0,
}
const phase = SIM_TREES.p0!
const band = phase.levels[0]!
const act = band.activities[0]!
const nextMove = { band, act, step: act.steps[0]! }
function sample(allowRetry: boolean) {
  const onTrapPicked = vi.fn(),
    onWrongPick = vi.fn()
  render(
    <MemoryRouter>
      <DecisionSection
        phaseId="p0"
        ctx={ctx}
        nextMove={nextMove}
        level={0}
        stepsDone={0}
        stepsTotal={5}
        pitfalls={phase.pitfalls}
        onVisitRef={() => {}}
        canEmbed={() => false}
        onOpenStep={() => {}}
        allowRetry={allowRetry}
        wrongPickCostQuarters={2}
        onTrapPicked={onTrapPicked}
        onWrongPick={onWrongPick}
      />
    </MemoryRouter>
  )
  const wrong = screen
    .getAllByRole('button', { name: /^Option [A-Z]:/ })
    .find((el) => !el.getAttribute('aria-label')?.includes(act.decision ?? nextMove.step.label))!
  fireEvent.click(wrong)
  return { onTrapPicked, onWrongPick }
}
describe('wrong-pick feedback matches charged consequences', () => {
  it('Easy displays free retry and invokes neither charge callback', () => {
    const callbacks = sample(true)
    expect(
      screen.getByText('Easy mode: retry without a score penalty or clock setback.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/This pick cost you/)).not.toBeInTheDocument()
    expect(callbacks.onTrapPicked).not.toHaveBeenCalled()
    expect(callbacks.onWrongPick).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(screen.queryByText(/Easy mode: retry/)).not.toBeInTheDocument()
  })
  it('charged mode reports exact two-quarter cost and calls each charge callback once', () => {
    const callbacks = sample(false)
    expect(
      screen.getByText('This pick cost you 2 quarters of rework — the pick stands.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/Easy mode: retry/)).not.toBeInTheDocument()
    expect(callbacks.onTrapPicked).toHaveBeenCalledTimes(1)
    expect(callbacks.onWrongPick).toHaveBeenCalledTimes(1)
  })
})
