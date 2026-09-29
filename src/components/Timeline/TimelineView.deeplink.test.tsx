// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { TimelineView } from './TimelineView'
import { timelineData, eventLinkKey } from '../../data/timelineData'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
}))
vi.mock('./SimpleGanttChart', () => ({
  SimpleGanttChart: ({ selectedCountry }: { selectedCountry: string }) => (
    <div data-testid="simple-gantt-chart">Selected: {selectedCountry}</div>
  ),
}))
vi.mock('./MobileTimelineList', () => ({
  MobileTimelineList: () => <div data-testid="mobile-timeline-list" />,
}))

function Probe() {
  const loc = useLocation()
  return <div data-testid="location-search">{loc.search}</div>
}
const renderAt = (search: string) =>
  render(
    <MemoryRouter initialEntries={[`/timeline${search}`]}>
      <TimelineView />
      <Probe />
    </MemoryRouter>
  )
const params = () => new URLSearchParams(screen.getByTestId('location-search').textContent ?? '')

const ALL = timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events))
const GOV = ALL.find((e) => e.entityType === 'government')!
const OTHER_COUNTRY = timelineData.find((c) => c.countryName !== GOV.countryName)!.countryName

describe('TimelineView ?event= deep link', () => {
  beforeEach(() => {
    usePersonaStore.getState().setRegion(null)
    usePersonaStore.setState({ selectedPersona: null })
    useBookmarkStore.getState().setShowOnlyTimelineCountries(false)
  })

  it('unknown event → not-found notice and the param is dropped', () => {
    renderAt('?event=no-such-event-xyz')
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('no-such-event-xyz')
    expect(params().has('event')).toBe(false)
  })

  it('event hidden by ?cat and another country → widens, notices, canonicalizes to event_id', () => {
    renderAt(
      `?cat=standards&country=${encodeURIComponent(OTHER_COUNTRY)}&event=${encodeURIComponent(GOV.title)}`
    )
    expect(screen.getByTestId('deeplink-notice-widened')).toBeInTheDocument()
    const p = params()
    expect(p.getAll('cat')).toEqual(expect.arrayContaining(['standards', 'government']))
    expect(p.get('country')).toBe(GOV.countryName)
    // A title link is rewritten to the stable id (or stays the title when none).
    expect(p.get('event')).toBe(eventLinkKey(GOV))
  })

  it('Undo restores the previous filters and drops the event', () => {
    renderAt(
      `?cat=standards&country=${encodeURIComponent(OTHER_COUNTRY)}&event=${encodeURIComponent(eventLinkKey(GOV))}`
    )
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    const p = params()
    expect(p.getAll('cat')).toEqual(['standards'])
    expect(p.get('country')).toBe(OTHER_COUNTRY)
    expect(p.has('event')).toBe(false)
  })

  it('"My countries only" hiding the event is turned off, and Undo turns it back on', () => {
    const other = timelineData.find((c) => c.countryName !== GOV.countryName)!.countryName
    useBookmarkStore.setState({ myTimelineCountries: [other] })
    useBookmarkStore.getState().setShowOnlyTimelineCountries(true)
    renderAt(`?event=${encodeURIComponent(eventLinkKey(GOV))}`)
    expect(useBookmarkStore.getState().showOnlyTimelineCountries).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(useBookmarkStore.getState().showOnlyTimelineCountries).toBe(true)
  })

  it('a stored region that hides the event switches to its country', () => {
    const outside = ALL.find(
      (e) => !['Global', 'International', 'G7', 'NATO', 'BIS', 'GSMA'].includes(e.countryName)
    )!
    usePersonaStore.getState().setRegion('global')
    renderAt(`?event=${encodeURIComponent(eventLinkKey(outside))}`)
    expect(screen.getByTestId('deeplink-notice-widened')).toBeInTheDocument()
    expect(params().get('country')).toBe(outside.countryName)
  })

  it('a visible event needs no notice', () => {
    renderAt(`?event=${encodeURIComponent(eventLinkKey(GOV))}`)
    expect(screen.queryByTestId('deeplink-notice-widened')).toBeNull()
    expect(screen.queryByTestId('deeplink-notice-not-found')).toBeNull()
    expect(params().get('event')).toBe(eventLinkKey(GOV))
  })
})
