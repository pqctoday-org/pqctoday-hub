// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS6b — the Command Center grid's five facets live in the URL.
 *
 * Before this they were local `useState`, so no filtered view was linkable,
 * shareable, or reachable from another surface: the grid filtered correctly and
 * then discarded the result on navigation. That is why all 37 business tools
 * carried one identical discoverability score.
 *
 * These tests assert the round trip in both directions — a URL restores a
 * filtered view, and interacting with a filter writes the URL — because a
 * one-way implementation looks correct in a browser and still isn't shareable.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router'
import { BusinessToolsGrid } from './BusinessToolsGrid'
import { BUSINESS_TOOLS } from './businessToolsRegistry'

vi.mock('@/utils/analytics', () => ({
  logBusinessToolsSearch: vi.fn(),
  logBusinessToolsFilter: vi.fn(),
}))

/**
 * Renders the live query string into the DOM so assertions read it the same way
 * a user's address bar would — via the rendered output, not a captured ref.
 */
const UrlProbe = () => {
  const loc = useLocation()
  return <output data-testid="url-search">{loc.search}</output>
}

const renderGrid = (path = '/business/tools') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/business/tools"
          element={
            <>
              <BusinessToolsGrid />
              <UrlProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )

/** Current query string as the router sees it. */
const currentParams = () => new URLSearchParams(screen.getByTestId('url-search').textContent ?? '')

const ROI = BUSINESS_TOOLS.find((t) => t.id === 'roi-calculator')!
const RACI = BUSINESS_TOOLS.find((t) => t.id === 'raci-builder')!

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BusinessToolsGrid — URL is the source of truth', () => {
  it('restores a category-filtered view from the URL', () => {
    renderGrid(`/business/tools?cat=${encodeURIComponent(ROI.category)}`)
    expect(screen.getByText(ROI.name)).toBeInTheDocument()
    // RACI Builder is in a different category, so it must be filtered out.
    expect(ROI.category).not.toBe(RACI.category)
    expect(screen.queryByText(RACI.name)).toBeNull()
  })

  it('restores a text-searched view from the URL', () => {
    renderGrid('/business/tools?q=RACI')
    expect(screen.getByText(RACI.name)).toBeInTheDocument()
    expect(screen.queryByText(ROI.name)).toBeNull()
  })

  it('writes the search term to the URL as the user types', () => {
    renderGrid()
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'RACI' } })
    expect(currentParams().get('q')).toBe('RACI')
  })

  it('writes the category to the URL when a pill is clicked', () => {
    renderGrid()
    // eslint-disable-next-line security/detect-non-literal-regexp -- category name from our own registry
    fireEvent.click(screen.getByRole('button', { name: new RegExp(ROI.category, 'i') }))
    expect(currentParams().get('cat')).toBe(ROI.category)
  })

  it('clears a facet from the URL rather than writing a default sentinel', () => {
    // A default view must produce a clean URL — ?zone=all&phase=all&audience=all
    // is not a shareable link, it is noise that looks like state.
    renderGrid(`/business/tools?cat=${encodeURIComponent(ROI.category)}`)
    fireEvent.click(screen.getByRole('button', { name: /^All\s*\d+$/i }))
    expect(currentParams().get('cat')).toBeNull()
  })

  it('survives a full round trip — filter, read the URL, re-render from it', () => {
    // The seam that matters: writing the URL and reading it back must agree.
    // Testing only one half would pass with a write-only or read-only
    // implementation, which is exactly the bug this replaces.
    const view = renderGrid()
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'RACI' } })
    const shared = `/business/tools${screen.getByTestId('url-search').textContent}`
    view.unmount()

    // Fresh mount from the shared link only — no carried-over component state.
    renderGrid(shared)
    expect(screen.getByText(RACI.name)).toBeInTheDocument()
    expect(screen.queryByText(ROI.name)).toBeNull()
  })
})
