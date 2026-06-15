// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SimulationView } from './SimulationView'
import { useSimulationStore } from '@/store/useSimulationStore'

const renderPage = () =>
  render(
    <MemoryRouter>
      <SimulationView />
    </MemoryRouter>
  )

beforeEach(() => {
  useSimulationStore.getState().reset()
  // suppress the first-run tour (WS-12) for the gameplay tests
  useSimulationStore.setState({ tourSeen: true })
})

describe('SimulationView (Mission Control)', () => {
  it('renders the console shell, setup dials and KPI ribbon', () => {
    renderPage()
    expect(screen.getByText('PQC Today Sim')).toBeInTheDocument()
    expect(screen.getByText('PQC Migration Simulation')).toBeInTheDocument()
    expect(screen.getByText('ORG ⟳')).toBeInTheDocument()
    expect(screen.getByText('SEAT ⟳')).toBeInTheDocument()
    expect(screen.getByText(/Mosca/)).toBeInTheDocument()
    expect(screen.getByText('Phases cleared')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /End Quarter/ })).toBeInTheDocument()
    // exit affordance back to the hub
    expect(screen.getByRole('link', { name: /Exit to hub/i })).toHaveAttribute('href', '/')
  })

  it('clicking a phase in the journey switches the active phase ops', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Pilots/i })) // P5
    expect(screen.getByText(/PHASE 5/)).toBeInTheDocument()
  })

  it('the tree drives the next move; the right call opens the module embedded in the sim', () => {
    renderPage()
    expect(screen.getByText('Next move — pick the right play')).toBeInTheDocument()
    // default phase p0, fresh state → first unlocked step is 0.1 Learn: PQC Business Case
    fireEvent.click(screen.getByRole('button', { name: /Learn: PQC Business Case/ }))
    expect(screen.getByText(/Right call/)).toBeInTheDocument()
    // CTA opens the module IN the sim (embedded), under a persistent "Simulation mode" bar
    fireEvent.click(screen.getByRole('button', { name: /open here/i }))
    expect(screen.getByText(/Simulation mode/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to board/i })).toBeInTheDocument()
  })

  it('opening a Learn/Activity resource from the list keeps the sim header (embeds, no navigation)', () => {
    renderPage()
    // the "Open a resource" lists now embed in-sim: such items say "opens in simulation"
    const embeddable = screen.getAllByText('opens in simulation')
    expect(embeddable.length).toBeGreaterThan(0)
    const btn = embeddable[0].closest('button')
    expect(btn).not.toBeNull()
    fireEvent.click(btn!)
    // if it had navigated, SimulationView would unmount and the header would vanish
    expect(screen.getByText('PQC Today Sim')).toBeInTheDocument()
    expect(screen.getByText(/Simulation mode/i)).toBeInTheDocument()
  })

  it('a wrong move surfaces a framework Common Failure', () => {
    renderPage()
    const correctBtn = screen.getByRole('button', { name: /Learn: PQC Business Case/ })
    const grid = correctBtn.parentElement as HTMLElement
    const wrong = within(grid)
      .getAllByRole('button')
      .find((b) => !/PQC Business Case/.test(b.textContent ?? ''))
    fireEvent.click(wrong!)
    expect(screen.getByText('✕ Common failure')).toBeInTheDocument()
  })

  it('right column shows phase artifacts and gates the architecture view by phase', () => {
    renderPage()
    // p0 (Executive Mandate) produces artifacts but is not an architecture phase
    expect(screen.getByText(/Executive Mandate artifacts/)).toBeInTheDocument()
    expect(screen.queryByText(/Your architecture/)).not.toBeInTheDocument()
    // P1 (Discovery) acts on the estate → architecture view appears
    fireEvent.click(screen.getByRole('button', { name: /Discovery/i }))
    expect(screen.getByText(/Your architecture/)).toBeInTheDocument()
  })

  it('End Quarter advances the turn and opens the Quarter Report', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /End Quarter/ }))
    expect(screen.getByText('Quarter Report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue/ })).toBeInTheDocument()
  })

  // WS-01 — one tree-gated source of truth: the Quarter Report's cleared count
  // can never disagree with the board, and the AI advances the tree (via `auto`),
  // never the legacy `checks` counter.
  it('the Quarter Report never contradicts the board; AI advances the tree, not checks', () => {
    renderPage()
    for (let i = 0; i < 12; i++) {
      fireEvent.click(screen.getByRole('button', { name: /End Quarter/ }))
      const dialog = screen.getByRole('dialog')
      // both board and report render "Phases cleared" as "n/8"; while the report
      // is open they must show the SAME number.
      const reportVal = within(dialog).getByText(/^\d+\/8$/).textContent
      const boardVals = screen
        .getAllByText(/^\d+\/8$/)
        .filter((el) => !dialog.contains(el))
        .map((el) => el.textContent)
      expect(boardVals).toContain(reportVal)
      fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
    }
    // Option A: AI completes real tree steps, so `checks` stays 0 for every
    // tree-backed phase (it now only matters for the treeless `foundations`).
    const { checks } = useSimulationStore.getState()
    for (const p of ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']) {
      expect(checks[p] ?? 0).toBe(0)
    }
  })

  // WS-12 — the first-run guide shows on a fresh visit, is skippable, and is
  // remembered (does not reappear once dismissed).
  it('shows a skippable first-run guide that is remembered after dismissal', () => {
    useSimulationStore.setState({ tourSeen: false })
    renderPage()
    expect(screen.getByRole('dialog', { name: /simulation guide/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Skip$/ }))
    expect(useSimulationStore.getState().tourSeen).toBe(true)
    expect(screen.queryByRole('dialog', { name: /simulation guide/i })).not.toBeInTheDocument()
  })

  // WS-13 — accessibility: the live feed is a polite log and severity carries a
  // non-colour (text) signal, not colour alone.
  it('exposes the live feed as a polite log with non-colour severity cues', () => {
    renderPage()
    const feed = screen.getByRole('log', { name: /live event feed/i })
    expect(feed).toHaveAttribute('aria-live', 'polite')
    expect(within(feed).getAllByText(/^(Danger|Warning|Success|Info):$/).length).toBeGreaterThan(0)
  })
})
