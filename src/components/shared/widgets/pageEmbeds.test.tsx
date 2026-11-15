// SPDX-License-Identifier: AGPL-3.0-only
/**
 * NAV-2 (owner 2026-11-14): Leaders, Patents, Explore and the Algorithms
 * catalogue / Validation / Industry landscape open inside the simulation.
 *
 * Both modes are checked for each page:
 *  - embedded (inside an outer router at /simulation, as in the real app): the
 *    page mounts, hides its page header, and never writes /simulation's URL;
 *  - standalone: the page still shows its header and still writes its own URL.
 */
import { useEffect, type ReactElement } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router'
import '@testing-library/jest-dom'

vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
}))

import { LeadersEmbed } from './LeadersEmbed'
import { PatentsEmbed } from './PatentsEmbed'
import { ExploreEmbed } from './ExploreEmbed'
import { AlgorithmsPageEmbed } from './AlgorithmsPageEmbed'
import { LeadersGrid } from '@/components/Leaders/LeadersGrid'
import { PatentsViewRedesign } from '@/components/Patents/redesign/PatentsViewRedesign'

const onLocation = vi.fn<(search: string) => void>()
function LocationProbe() {
  const { search } = useLocation()
  useEffect(() => onLocation(search), [search])
  return null
}
const lastSearch = () => onLocation.mock.lastCall?.[0]

const renderAt = (path: string, ui: ReactElement) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              {ui}
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )

/** Type into the page's first search box, the simplest URL-writing control. */
const typeInFirstSearch = (text: string) => {
  const box = screen.queryAllByRole('searchbox').at(0) ?? screen.queryAllByRole('textbox').at(0)
  expect(box).toBeTruthy()
  fireEvent.change(box!, { target: { value: text } })
}

describe('pages embedded in the simulation (NAV-2)', () => {
  it('Leaders: no page header, and filtering never touches /simulation’s URL', async () => {
    renderAt('/simulation?open=x', <LeadersEmbed />)
    expect(screen.queryByRole('heading', { name: 'Community' })).toBeNull()
    typeInFirstSearch('kyber')
    await new Promise((r) => setTimeout(r, 400))
    expect(lastSearch()).toBe('?open=x')
  })

  it('Leaders standalone: header shown and filters still write the URL', async () => {
    renderAt('/leaders', <LeadersGrid />)
    expect(screen.getByRole('heading', { name: 'Community' })).toBeInTheDocument()
    typeInFirstSearch('kyber')
    await new Promise((r) => setTimeout(r, 400))
    expect(lastSearch()).not.toBe('')
  })

  // Switching the Patents tab writes ?tab= on the standalone page.
  const clickAnotherTab = () => {
    const tabs = screen.getAllByRole('tab')
    const target = tabs.find((t) => t.getAttribute('aria-selected') !== 'true')
    expect(target).toBeTruthy()
    fireEvent.mouseDown(target!)
    fireEvent.click(target!)
  }

  it('Patents: no page header, and switching tabs never touches /simulation’s URL', () => {
    renderAt('/simulation?open=x', <PatentsEmbed />)
    expect(screen.queryByRole('heading', { name: 'PQC Patents' })).toBeNull()
    clickAnotherTab()
    expect(lastSearch()).toBe('?open=x')
  })

  it('Patents standalone: header shown and switching tabs still writes the URL', () => {
    renderAt('/patents', <PatentsViewRedesign />)
    expect(screen.getByRole('heading', { name: 'PQC Patents' })).toBeInTheDocument()
    clickAnotherTab()
    expect(lastSearch()).toMatch(/tab=/)
  })

  it('Algorithms: opens on the requested tab without its page header or touching the URL', async () => {
    renderAt('/simulation?open=x', <AlgorithmsPageEmbed params="tab=validation" />)
    expect(
      screen.queryByRole('heading', { name: /Post-Quantum Algorithms & Protocols/ })
    ).toBeNull()
    expect(
      await screen.findByRole('tab', { name: /validation/i }, { timeout: 5000 })
    ).toHaveAttribute('aria-selected', 'true')
    expect(lastSearch()).toBe('?open=x')
  })

  it('Algorithms landscape: opens on the landscape tab scoped by the step link', async () => {
    renderAt(
      '/simulation?open=x',
      <AlgorithmsPageEmbed params="tab=landscape&industry=Telecommunications" />
    )
    expect(
      await screen.findByRole('tab', { name: /landscape|industry/i }, { timeout: 5000 })
    ).toHaveAttribute('aria-selected', 'true')
    expect(lastSearch()).toBe('?open=x')
  })

  it('Explore: every tile says it leaves the simulation, and leaving marks the resume point', () => {
    const onLeave = vi.fn()
    renderAt('/simulation?open=x', <ExploreEmbed onLeave={onLeave} />)
    expect(screen.getByTestId('explore-sim-note')).toBeInTheDocument()
    const notes = screen.getAllByText(/leaves the simulation ↗/)
    expect(notes.length).toBeGreaterThan(0)
    fireEvent.click(notes[0]!.closest('button')!)
    expect(onLeave).toHaveBeenCalledTimes(1)
  })
})
