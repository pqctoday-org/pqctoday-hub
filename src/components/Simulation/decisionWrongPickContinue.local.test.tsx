// SPDX-License-Identifier: GPL-3.0-only
/**
 * 09-28 nav remediation (WP1) — a wrong pick on Realistic/Hard must never be a
 * dead end. The pick stands for scoring (one consequence, attempt kept), but the
 * sound move's open/complete control is exposed so the phase can still advance.
 * On Easy (D5) the free retry stays and the sound-move action is NOT shown — the
 * player retries instead of skipping the decision.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Button } from '@/components/ui/button'
import { DecisionSection } from './sections'
import { SIM_TREES, flattenTree, type TreeStep } from '@/simulation'
import { canResolveDeepLink } from '@/simulation/deepLinks'
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
const correctLabel = nextMove.act.decision ?? nextMove.step.label

function setupDecision(
  props: Partial<React.ComponentProps<typeof DecisionSection>> & { allowRetry: boolean }
) {
  const cb = {
    onOpenStep: vi.fn(),
    onWrongPick: vi.fn(),
    onTrapPicked: vi.fn(),
    onDecide: vi.fn(),
  }
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
        canEmbed={() => true}
        {...cb}
        {...props}
      />
    </MemoryRouter>
  )
  return cb
}

function pickWrong() {
  const options = screen.getAllByRole('button', { name: /^Option [A-Z]:/ })
  const wrong = options.find((el) => !el.getAttribute('aria-label')?.includes(correctLabel))
  fireEvent.click(wrong!)
}

describe('DecisionSection — wrong pick stays actionable (WP1)', () => {
  it('Realistic/Hard: exposes the sound move and opening it charges nothing more', () => {
    const spies = setupDecision({ allowRetry: false })
    pickWrong()
    expect(spies.onWrongPick).toHaveBeenCalledTimes(1)
    expect(spies.onTrapPicked).toHaveBeenCalledTimes(1)
    expect(spies.onDecide).toHaveBeenCalledTimes(1)

    const panel = screen.getByTestId('wrong-pick-continue')
    expect(panel).toHaveTextContent(/do the sound move to continue/i)
    fireEvent.click(screen.getByRole('button', { name: /open here/i }))
    expect(spies.onOpenStep).toHaveBeenCalledWith(nextMove.step)
    // no second consequence, no second decision
    expect(spies.onWrongPick).toHaveBeenCalledTimes(1)
    expect(spies.onTrapPicked).toHaveBeenCalledTimes(1)
    expect(spies.onDecide).toHaveBeenCalledTimes(1)
  })

  it('Realistic/Hard: renders the phone completion control in the wrong branch too', () => {
    setupDecision({
      allowRetry: false,
      canEmbed: () => false,
      renderCompletion: () => <Button type="button">Mark complete</Button>,
    })
    pickWrong()
    expect(screen.getByRole('button', { name: 'Mark complete' })).toBeInTheDocument()
  })

  it('a persisted wrong attempt (reload) still shows the way forward', () => {
    // Find the index of a wrong card by rendering once and reading the labels.
    setupDecision({ allowRetry: false })
    const options = screen.getAllByRole('button', { name: /^Option [A-Z]:/ })
    const wrongIdx = options.findIndex(
      (el) => !el.getAttribute('aria-label')?.includes(correctLabel)
    )
    document.body.innerHTML = ''
    setupDecision({
      allowRetry: false,
      attempt: { index: wrongIdx, correct: false, at: 'Q1 2026' },
    })
    expect(screen.getByTestId('wrong-pick-continue')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open here/i })).toBeInTheDocument()
  })

  it('desktop: offers the Progress-tab escape when wired', () => {
    const onShowProgress = vi.fn()
    setupDecision({ allowRetry: false, onShowProgress })
    pickWrong()
    fireEvent.click(screen.getByRole('button', { name: /choose any task on progress/i }))
    expect(onShowProgress).toHaveBeenCalledTimes(1)
  })

  it('phone (no onShowProgress): no Progress-tab affordance', () => {
    setupDecision({ allowRetry: false })
    pickWrong()
    expect(screen.queryByRole('button', { name: /progress/i })).not.toBeInTheDocument()
  })

  it('Easy (D5): free retry only — the sound-move action is not exposed', () => {
    setupDecision({ allowRetry: true })
    pickWrong()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.queryByTestId('wrong-pick-continue')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /open here/i })).not.toBeInTheDocument()
  })

  it('correct pick behaviour is unchanged', () => {
    const spies = setupDecision({ allowRetry: false })
    fireEvent.click(
      screen
        .getAllByRole('button', { name: /^Option [A-Z]:/ })
        .find((el) => el.getAttribute('aria-label')?.includes(correctLabel))!
    )
    expect(screen.getByText(/right call/i)).toBeInTheDocument()
    expect(screen.queryByTestId('wrong-pick-continue')).not.toBeInTheDocument()
    expect(spies.onWrongPick).not.toHaveBeenCalled()
  })
})

describe('a cleared attempt re-opens the decision (Reset run / difficulty restart)', () => {
  it('drops the stale local pick when the persisted attempt goes away', () => {
    const base = {
      phaseId: 'p0' as const,
      ctx,
      nextMove,
      level: 0,
      stepsDone: 0,
      stepsTotal: 5,
      pitfalls: p0.pitfalls,
      onVisitRef: () => {},
      canEmbed: () => true,
      onOpenStep: () => {},
      onDecide: () => {},
      allowRetry: false,
    }
    const { rerender } = render(
      <MemoryRouter>
        <DecisionSection {...base} />
      </MemoryRouter>
    )
    pickWrong()
    const options = screen.getAllByRole('button', { name: /^Option [A-Z]:/ })
    const idx = options.findIndex(
      (el) => el.hasAttribute('disabled') && el.className.includes('destructive')
    )
    // the parent persists the attempt …
    rerender(
      <MemoryRouter>
        <DecisionSection
          {...base}
          attempt={{ index: Math.max(0, idx), correct: false, at: 'Q1 2026' }}
        />
      </MemoryRouter>
    )
    expect(screen.getAllByRole('button', { name: /^Option [A-Z]:/ })[0]).toBeDisabled()
    // … then a reset clears it: the decision must be open again
    rerender(
      <MemoryRouter>
        <DecisionSection {...base} />
      </MemoryRouter>
    )
    for (const el of screen.getAllByRole('button', { name: /^Option [A-Z]:/ })) {
      expect(el).toBeEnabled()
    }
  })
})

describe('every gating tree step has a viable action path (WP1.4)', () => {
  it('each step resolves to a real route (so the wrong-branch action is never "resource moved")', () => {
    const broken: string[] = []
    for (const [phase, tree] of Object.entries(SIM_TREES)) {
      if (!tree) continue
      for (const step of flattenTree(tree) as TreeStep[]) {
        if (!canResolveDeepLink(step.to)) broken.push(`${phase}: ${step.kind} ${step.to}`)
      }
    }
    expect(broken).toEqual([])
  })
})
