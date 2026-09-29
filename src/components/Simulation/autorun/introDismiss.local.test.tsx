// SPDX-License-Identifier: GPL-3.0-only
/**
 * 09-28 nav remediation (WP3 / D4, D7) — Play-mode overlays must always offer a
 * way out that does NOT advance the run. The three auto-run intros used to exit
 * only via "Begin" (Escape also meant Begin), sat above the transport bar's Stop,
 * and `stop()` never cleared the pass intro (so it stayed on screen on desktop).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useSimAutoRunPlayer, passIntroFor } from './useSimAutoRunPlayer'
import { SimPhaseIntroModal } from './SimPhaseIntroModal'
import { SimPassIntroModal } from './SimPassIntroModal'
import { SimScenarioIntroCard } from './SimScenarioIntroCard'
import { SimArtifactReveal } from './SimArtifactReveal'
import { SimPhaseRunComplete } from './SimPhaseRunComplete'
import { SimExecWalkthroughComplete } from './SimExecWalkthroughComplete'
import { SimConceptPeek } from './SimConceptPeek'
import { EXEC_TOUR_CONCEPTS, EXEC_TOUR_OPENING_CONCEPTS } from './execTourConfig'
import { getScenario } from './scenarioConfig'

const noop = () => {}

beforeEach(() => {
  useSimulationStore.getState().reset()
  useModuleStore.setState((s) => ({
    modules: {},
    artifacts: { ...s.artifacts, executiveDocuments: [] },
  }))
})

type IntroCase = {
  name: string
  testId: string
  renderIt: (cb: { onBegin: () => void; onDismiss: () => void; onStop: () => void }) => void
}

const scenario = getScenario('US')
const intros: IntroCase[] = [
  {
    name: 'phase intro',
    testId: 'sim-phase-intro-backdrop',
    renderIt: (cb) => render(<SimPhaseIntroModal phase="p0" {...cb} />),
  },
  {
    name: 'pass intro',
    testId: 'sim-pass-intro-backdrop',
    renderIt: (cb) => render(<SimPassIntroModal pass={passIntroFor(1, scenario)} {...cb} />),
  },
  {
    name: 'scenario intro',
    testId: 'sim-scenario-intro-backdrop',
    renderIt: (cb) =>
      render(
        <SimScenarioIntroCard scenario={{ title: 'Scenario', summary: 'Why this clock' }} {...cb} />
      ),
  },
]

describe.each(intros)('$name — dismiss without advancing', ({ renderIt, testId }) => {
  const setup = () => {
    const cb = { onBegin: vi.fn(), onDismiss: vi.fn(), onStop: vi.fn() }
    renderIt(cb)
    return cb
  }

  it('✕ closes and pauses — never Begin', () => {
    const cb = setup()
    fireEvent.click(screen.getByRole('button', { name: /close and pause/i }))
    expect(cb.onDismiss).toHaveBeenCalledTimes(1)
    expect(cb.onBegin).not.toHaveBeenCalled()
  })

  it('Escape closes and pauses — never Begin', () => {
    const cb = setup()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(cb.onDismiss).toHaveBeenCalledTimes(1)
    expect(cb.onBegin).not.toHaveBeenCalled()
  })

  it('backdrop click closes and pauses; a click inside the card does not', () => {
    const cb = setup()
    fireEvent.click(screen.getByRole('dialog'))
    expect(cb.onDismiss).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId(testId))
    expect(cb.onDismiss).toHaveBeenCalledTimes(1)
    expect(cb.onBegin).not.toHaveBeenCalled()
  })

  it('Stop play ends the run; Begin still advances', () => {
    const cb = setup()
    fireEvent.click(screen.getByRole('button', { name: /stop play/i }))
    expect(cb.onStop).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /^begin/i }))
    expect(cb.onBegin).toHaveBeenCalledTimes(1)
    expect(cb.onDismiss).not.toHaveBeenCalled()
  })
})

describe('player — pauseAndDismissIntro / stop', () => {
  afterEach(() => vi.useRealTimers())
  const renderPlayer = () =>
    renderHook(() => useSimAutoRunPlayer({ openStep: noop, closeEmbed: noop }))

  it('dismissing the scenario intro leaves the run loaded but paused', () => {
    const { result } = renderPlayer()
    act(() => result.current.start())
    expect(result.current.scenarioIntro).not.toBeNull()
    act(() => result.current.pauseAndDismissIntro())
    expect(result.current.scenarioIntro).toBeNull()
    expect(result.current.running).toBe(true)
    expect(result.current.paused).toBe(true)
    // paused ⇒ the step effect is idle: no pass intro is armed behind it
    expect(result.current.passIntro).toBeNull()
  })

  it('stop() clears a pass intro (it used to stay on screen on desktop)', () => {
    vi.useFakeTimers()
    const { result } = renderPlayer()
    act(() => result.current.start())
    act(() => result.current.beginScenario())
    // the step beat arms the pass intro after a 500ms lead-in
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.passIntro).not.toBeNull()
    act(() => result.current.stop())
    expect(result.current.passIntro).toBeNull()
    expect(result.current.running).toBe(false)
  })

  it('dismissing a pass intro pauses and does not re-show it on resume', () => {
    vi.useFakeTimers()
    const { result } = renderPlayer()
    act(() => result.current.start())
    act(() => result.current.beginScenario())
    // the step beat arms the pass intro after a 500ms lead-in
    act(() => vi.advanceTimersByTime(600))
    const shown = result.current.passIntro
    expect(shown).not.toBeNull()
    act(() => result.current.pauseAndDismissIntro())
    expect(result.current.passIntro).toBeNull()
    expect(result.current.paused).toBe(true)
    act(() => result.current.resume())
    act(() => vi.advanceTimersByTime(600))
    expect(result.current.passIntro).toBeNull()
  })
})

describe('other play overlays', () => {
  it('the "document ready" card can be dismissed', () => {
    const onDismiss = vi.fn()
    render(<SimArtifactReveal type="program-charter" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss document card/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('phase-run complete: dialog semantics + Escape closes', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <SimPhaseRunComplete phaseFocus={null} onClose={onClose} />
      </MemoryRouter>
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('walkthrough complete: dialog semantics + Escape closes', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <SimExecWalkthroughComplete onClose={onClose} />
      </MemoryRouter>
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('tip cards show ONE at a time (four stacked used to cover the board and push a ✕ off-screen)', () => {
    const concepts = [...EXEC_TOUR_OPENING_CONCEPTS].map((id) => EXEC_TOUR_CONCEPTS[id])
    expect(concepts.length).toBeGreaterThan(1)
    const onDismiss = vi.fn()
    render(<SimConceptPeek concepts={concepts} onDismiss={onDismiss} />)
    expect(screen.getAllByTestId(/^concept-peek-/)).toHaveLength(1)
    expect(screen.getByText(new RegExp(`tip 1 of ${concepts.length}`))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /next tip/i }))
    expect(onDismiss).toHaveBeenCalledWith(concepts[0]!.id)
    onDismiss.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /hide tips/i }))
    expect(onDismiss.mock.calls.map((c) => c[0])).toEqual(concepts.map((c) => c.id))
  })
})
