// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileTimelineView } from './MobileTimelineView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { timelineData, transformToGanttData } from '@/data/timelineData'
import { applyTimelineScope } from '@/data/timelineScope'

// Real data throughout — timelineData is parsed synchronously from a bundled
// CSV at module load (no fixture needed, matching TimelineView.test.tsx's
// own approach). Assertions are structural (derived from the real data at
// test time) rather than hardcoded counts, since the underlying CSV changes
// over time.
// MobileTimelineView reads/writes ?country= and ?event=, so it needs a Router.
const renderView = (url = '/timeline') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <MobileTimelineView />
    </MemoryRouter>
  )

const REAL_GANTT_DATA = transformToGanttData(applyTimelineScope(timelineData, {}))

// Same "next imminent phase" logic as the component's own nextTwoPhases(),
// recomputed independently here as a test oracle so the banner assertion
// stays correct against whatever the real CSV currently contains, rather
// than assuming a specific phase is (or isn't) imminent this year.
function expectedNextUp(countryName: string) {
  const country = REAL_GANTT_DATA.find((d) => d.country.countryName === countryName)
  if (!country) return null
  const year = new Date().getFullYear()
  const phases = [...country.phases]
    .filter((p) => Number.isFinite(p.startYear) && p.startYear > 0)
    .sort((a, b) => a.startYear - b.startYear)
  const nextIdx = phases.findIndex((p) => p.startYear >= year)
  if (nextIdx < 0) return null
  const next = phases[nextIdx]
  if (next.startYear > year + 1) return null
  return next
}

describe('MobileTimelineView', () => {
  beforeEach(() => {
    localStorage.removeItem('timeline-mobile-view-mode')
  })

  afterEach(() => {
    usePersonaStore.getState().setRegion('global')
  })

  it("scopes the country list to the reader's region, matching REGION_COUNTRIES_MAP exactly", () => {
    usePersonaStore.getState().setRegion('americas')
    renderView()
    const expected = REAL_GANTT_DATA.filter((d) =>
      ['United States', 'Canada'].includes(d.country.countryName)
    )
    expect(
      screen.getByText(`${expected.length} countries tracked`, { exact: false })
    ).toBeInTheDocument()
    expect(screen.getByText('Americas PQC timeline')).toBeInTheDocument()
  })

  it('shows every tracked country when the region is global — matches the full real dataset', () => {
    usePersonaStore.getState().setRegion('global')
    renderView()
    expect(screen.getByText('Global PQC timeline')).toBeInTheDocument()
    expect(
      screen.getByText(`${REAL_GANTT_DATA.length} countries tracked`, { exact: false })
    ).toBeInTheDocument()
  })

  it("shows the reader's-country panel for a region with a real representative country (americas -> United States)", () => {
    usePersonaStore.getState().setRegion('americas')
    renderView()
    expect(screen.getByText(/When does this reach me, in United States\?/i)).toBeInTheDocument()
  })

  it("renders no reader's-country panel for a region with no single representative country (eu)", () => {
    usePersonaStore.getState().setRegion('eu')
    renderView()
    expect(screen.queryByText(/When does this reach me/i)).not.toBeInTheDocument()
  })

  it('states what was cut rather than silently dropping it', () => {
    renderView()
    expect(
      screen.getByText(/Switching region, a deadlines-only filter, phase-type color coding/i)
    ).toBeInTheDocument()
  })

  it('defaults to compact view (design handoff §17) when the reader has no stored preference', () => {
    usePersonaStore.getState().setRegion('americas')
    renderView()
    expect(screen.getByRole('button', { name: 'All phases' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Swipe' })).toHaveAttribute('aria-pressed', 'false')
  })

  it("honors a reader's own stored view-mode choice over the compact default", () => {
    localStorage.setItem('timeline-mobile-view-mode', 'swipe')
    usePersonaStore.getState().setRegion('americas')
    renderView()
    expect(screen.getByRole('button', { name: 'Swipe' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('the "Next 12 months" banner matches the real data — present only when the reader\'s next phase is this year or next, and never otherwise', () => {
    usePersonaStore.getState().setRegion('americas')
    renderView()
    const expected = expectedNextUp('United States')
    const banner = screen.queryByText('Next 12 months')
    if (expected) {
      expect(banner).toBeInTheDocument()
      expect(
        screen.getByText(`One marker lands: ${expected.title} (${expected.startYear}).`, {
          exact: false,
        })
      ).toBeInTheDocument()
    } else {
      expect(banner).not.toBeInTheDocument()
    }
  })

  describe('deep links', () => {
    const grouped = REAL_GANTT_DATA.flatMap((c) => c.phases).find(
      (p) => p.events.length > 1 && p.events[1].title !== p.events[0].title
    )!
    const target = grouped.events[1]

    it("?event=<event_id> opens that event (not its row's first) and shows its country", () => {
      usePersonaStore.getState().setRegion('americas')
      renderView(`/timeline?event=${encodeURIComponent(target.eventId ?? target.title)}`)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: target.title })).toBeInTheDocument()
      if (!['United States', 'Canada'].includes(target.countryName)) {
        expect(screen.getByTestId('deeplink-notice-widened')).toBeInTheDocument()
        expect(screen.getByText(`${target.countryName} PQC timeline`)).toBeInTheDocument()
      }
    })

    it('unknown ?event shows a not-found notice', () => {
      renderView('/timeline?event=no-such-event-xyz')
      expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('no-such-event-xyz')
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('?country= shows just that country', () => {
      const name = REAL_GANTT_DATA[0].country.countryName
      renderView(`/timeline?country=${encodeURIComponent(name)}`)
      expect(screen.getByText(`${name} PQC timeline`)).toBeInTheDocument()
      expect(screen.getByText('1 country tracked', { exact: false })).toBeInTheDocument()
    })
  })
})
