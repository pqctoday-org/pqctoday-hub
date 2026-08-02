// SPDX-License-Identifier: GPL-3.0-only
/**
 * WP4.4 — the free instant "↺ try again" after a wrong pick is Easy-difficulty-
 * only; above Easy the pick sticks (the setback stays a real consequence, not an
 * inconvenience an instant do-over erases). The card still un-sticks on its own
 * once the player completes a real step elsewhere (sections.tsx's own moveKey
 * reset, unaffected by this change) — this only removes the FREE, INSTANT path.
 *
 * The gate rode on the retired GUIDED mode until 2026-08-02; it now reads
 * SimBalance.decisions.freeRetryOnWrongPick, which the MODE dial selects.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DecisionSection } from './sections'
import { SIM_TREES } from '@/simulation'
import type { MoveCtx } from '@/data/simMoves'

const ctx: MoveCtx = {
  country: { id: 'DE', label: 'Germany (BSI)', hybrid: 'required', endState: 'hybrid' },
  sector: { id: 'healthcare', label: 'Healthcare', x: 10 },
  size: { id: 'mid', label: 'Mid-size' },
  over: 0,
}

const p0 = SIM_TREES.p0!
const band = p0.levels[0]!
const act = band.activities[0]!
const nextMove = { band, act, step: act.steps[0]! }

function renderDecision(allowRetry: boolean) {
  return render(
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
    />
  )
}

function pickAWrongCard() {
  // p0's cards always include at least 2 wrong options (SIM_MOVES.p0 has 6 traps).
  const options = screen.getAllByRole('button', { name: /^Option [A-Z]:/ })
  const wrong = options.find(
    (el) => !el.getAttribute('aria-label')?.includes(nextMove.act.decision ?? nextMove.step.label)
  )
  fireEvent.click(wrong!)
}

describe('DecisionSection wrong-pick retry (WP4.4)', () => {
  it('shows the free "try again" retry when retries are allowed (Easy)', () => {
    renderDecision(true)
    pickAWrongCard()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('hides the retry when they are not, showing a stands-as-picked note instead', () => {
    renderDecision(false)
    pickAWrongCard()
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
    expect(screen.getByText(/the pick stands/i)).toBeInTheDocument()
  })

  it('defaults to pick-stands behaviour when the allowRetry prop is omitted', () => {
    render(
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
      />
    )
    pickAWrongCard()
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })
})
