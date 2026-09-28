// SPDX-License-Identifier: GPL-3.0-only
/**
 * W0.5 regression — a decision is ONE attempt.
 *
 * Observed on the audited build (Realistic, P0): clicking the same wrong option
 * twice charged the setback twice (Q1→Q2→Q3, traps 0→1→2), and choosing the
 * correct option afterwards still reported "Right call" despite the copy saying
 * "The pick stands". The option buttons carried no disabled state and no
 * already-chosen guard, so every click re-fired the penalty callbacks.
 *
 * These assert the user-visible invariant — one decision, one consequence —
 * not the implementation that delivers it.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DecisionSection } from './sections'
import { SIM_TREES } from '@/simulation'
import type { MoveCtx } from '@/data/simMoves'

const ctx: MoveCtx = {
  country: { id: 'US', label: 'United States', hybrid: 'allowed', endState: 'hybrid' },
  sector: { id: 'financial', label: 'Financial', x: 10 },
  size: { id: 'mid', label: 'Mid-size' },
  over: 0,
}

const p0 = SIM_TREES.p0!
const band = p0.levels[0]!
const act = band.activities[0]!
const nextMove = { band, act, step: act.steps[0]! }

const renderDecision = (
  onWrongPick: (label: string) => void,
  onTrapPicked: () => void,
  allowRetry = false
) =>
  // MemoryRouter: since 09-28 (WP1) the pick-stands branch renders the sound
  // move's deep link, so a wrong pick is never a dead end.
  render(
    <MemoryRouter>
      <DecisionSection
        phaseId="p0"
        ctx={ctx}
        nextMove={nextMove}
        level={0}
        stepsDone={0}
        stepsTotal={5}
        pitfalls={p0.pitfalls}
        onVisitRef={() => {}}
        canEmbed={() => false}
        onOpenStep={() => {}}
        allowRetry={allowRetry}
        onWrongPick={onWrongPick}
        onTrapPicked={onTrapPicked}
      />
    </MemoryRouter>
  )

const options = () => screen.getAllByRole('button', { name: /^Option [A-Z]:/ })
const correctLabel = nextMove.act.decision ?? nextMove.step.label
const wrongOptions = () =>
  options().filter((el) => !el.getAttribute('aria-label')?.includes(correctLabel))
const correctOption = () =>
  options().find((el) => el.getAttribute('aria-label')?.includes(correctLabel))!

describe('a decision is one attempt (W0.5 regression)', () => {
  it('charges the setback once when the same wrong option is clicked repeatedly', () => {
    const onWrongPick = vi.fn()
    const onTrapPicked = vi.fn()
    renderDecision(onWrongPick, onTrapPicked)

    const wrong = wrongOptions()[0]!
    fireEvent.click(wrong)
    fireEvent.click(wrong)
    fireEvent.click(wrong)

    expect(onWrongPick).toHaveBeenCalledTimes(1)
    expect(onTrapPicked).toHaveBeenCalledTimes(1)
  })

  it('does not charge again when a SECOND, different wrong option is clicked', () => {
    const onWrongPick = vi.fn()
    const onTrapPicked = vi.fn()
    renderDecision(onWrongPick, onTrapPicked)

    const wrongs = wrongOptions()
    expect(wrongs.length).toBeGreaterThan(1)
    fireEvent.click(wrongs[0]!)
    fireEvent.click(wrongs[1]!)

    expect(onWrongPick).toHaveBeenCalledTimes(1)
    expect(onTrapPicked).toHaveBeenCalledTimes(1)
  })

  it('does not report a right call after the pick has already stood', () => {
    // Realistic/Hard: "The pick stands." Clicking the correct option afterwards
    // must not retroactively turn a wrong attempt into a correct one.
    renderDecision(vi.fn(), vi.fn(), false)
    fireEvent.click(wrongOptions()[0]!)
    expect(screen.getByText(/the pick stands/i)).toBeInTheDocument()

    fireEvent.click(correctOption())
    expect(screen.queryByText(/right call/i)).not.toBeInTheDocument()
  })

  it('leaves the submitted options non-interactive once a pick is recorded', () => {
    renderDecision(vi.fn(), vi.fn(), false)
    fireEvent.click(wrongOptions()[0]!)
    for (const el of options()) {
      expect(el).toBeDisabled()
    }
  })
})
