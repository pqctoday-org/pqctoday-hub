// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { TimelineView } from './TimelineView'
import {
  timelineData,
  eventLinkKey,
  findEventInGantt,
  transformToGanttData,
} from '../../data/timelineData'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { Button } from '@/components/ui/button'

vi.mock('@/services/search/useSemanticSearch', () => ({
  useSemanticSearch: vi.fn(() => ({ hits: [], mode: 'idle' as const, loading: false })),
}))
vi.mock('./SimpleGanttChart', () => ({
  SimpleGanttChart: ({
    selectedCountry,
    showOnlyMyCountries,
    onClearAll,
  }: {
    selectedCountry: string
    showOnlyMyCountries?: boolean
    onClearAll?: () => void
  }) => (
    <div data-testid="simple-gantt-chart" data-show-only={String(!!showOnlyMyCountries)}>
      Selected: {selectedCountry}
      <Button onClick={onClearAll}>gantt-clear-all</Button>
    </div>
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
const showOnly = () => screen.getByTestId('simple-gantt-chart').getAttribute('data-show-only')

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

  it('"My countries only" hiding the event is turned off for the visit, and Undo turns it back on', () => {
    const other = timelineData.find((c) => c.countryName !== GOV.countryName)!.countryName
    useBookmarkStore.setState({ myTimelineCountries: [other] })
    useBookmarkStore.getState().setShowOnlyTimelineCountries(true)
    renderAt(`?event=${encodeURIComponent(eventLinkKey(GOV))}`)
    expect(showOnly()).toBe('false')
    // The saved preference is not overwritten by a deep link.
    expect(useBookmarkStore.getState().showOnlyTimelineCountries).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(showOnly()).toBe('true')
  })

  it('an event hidden by the Gantt ?deadlines / ?etype filters clears them, with a notice', () => {
    const row = findEventInGantt(
      transformToGanttData(timelineData.filter((c) => c.countryName === GOV.countryName)),
      eventLinkKey(GOV)
    )!.phase
    const otherEtype = row.type === 'Phase' ? 'Milestone' : 'Phase'
    renderAt(`?etype=${otherEtype}&event=${encodeURIComponent(eventLinkKey(GOV))}`)
    expect(screen.getByTestId('deeplink-notice-widened')).toHaveTextContent(
      'cleared the phase/type filter'
    )
    expect(params().has('etype')).toBe(false)
  })

  it('a stored region that hides the event switches to its country', () => {
    const outside = ALL.find((e) => e.countryName === 'France')!
    usePersonaStore.getState().setRegion('apac')
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

describe('TimelineView ?country= vs saved "My countries only"', () => {
  const [A, B] = timelineData.map((c) => c.countryName)
  beforeEach(() => {
    usePersonaStore.getState().setRegion(null)
    usePersonaStore.setState({ selectedPersona: null })
    useBookmarkStore.setState({ myTimelineCountries: [A] })
    useBookmarkStore.getState().setShowOnlyTimelineCountries(true)
  })

  it('a country outside My countries widens for the visit, with a notice; saved pref kept', () => {
    renderAt(`?country=${encodeURIComponent(B)}`)
    expect(screen.getByTestId('deeplink-notice-widened')).toHaveTextContent(B)
    expect(showOnly()).toBe('false')
    expect(useBookmarkStore.getState().showOnlyTimelineCountries).toBe(true)
  })

  it('Undo restores the filter and drops ?country', () => {
    renderAt(`?country=${encodeURIComponent(B)}`)
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(showOnly()).toBe('true')
    expect(params().has('country')).toBe(false)
  })

  it('a country inside My countries needs no notice', () => {
    renderAt(`?country=${encodeURIComponent(A)}`)
    expect(screen.queryByTestId('deeplink-notice-widened')).toBeNull()
    expect(showOnly()).toBe('true')
  })

  it('Clear all removes the Gantt params and turns "My countries only" off (saved)', () => {
    renderAt(
      `?country=${encodeURIComponent(A)}&phase=Migration&deadlines=1&etype=Phase&gsort=organization&gdir=desc&q=x`
    )
    fireEvent.click(screen.getByRole('button', { name: 'gantt-clear-all' }))
    const p = params()
    for (const k of ['country', 'q', 'phase', 'deadlines', 'etype', 'gsort', 'gdir'])
      expect(p.has(k)).toBe(false)
    expect(showOnly()).toBe('false')
    expect(useBookmarkStore.getState().showOnlyTimelineCountries).toBe(false)
  })
})

describe('storedRegionDefault', () => {
  it("a stored 'global' region does not hide a country event", () => {
    const france = ALL.find((e) => e.countryName === 'France')!
    usePersonaStore.getState().setRegion('global')
    renderAt(`?event=${encodeURIComponent(eventLinkKey(france))}`)
    expect(screen.queryByTestId('deeplink-notice-widened')).toBeNull()
  })

  it("treats the persona store's 'global' default as no region filter", async () => {
    const { storedRegionDefault } = await import('./TimelineView')
    expect(storedRegionDefault('global')).toBeNull()
    expect(storedRegionDefault(null)).toBeNull()
    expect(storedRegionDefault(undefined)).toBeNull()
    expect(storedRegionDefault('eu')).toBe('eu')
  })
})
