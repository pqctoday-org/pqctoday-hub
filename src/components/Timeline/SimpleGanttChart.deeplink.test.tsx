// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import {
  timelineData,
  transformToGanttData,
  eventLinkKey,
  findEventInGantt,
  findTimelineEvent,
  phaseRowKey,
  timelineEventPageUrl,
} from '../../data/timelineData'
import { applyTimelineScope } from '../../data/timelineScope'
import { SimpleGanttChart } from './SimpleGanttChart'
import type { TimelineEvent, TimelinePhase } from '../../types/timeline'

// Show which event the popover is focused on, not just the row.
vi.mock('./GanttDetailPopover', () => ({
  GanttDetailPopover: ({
    isOpen,
    phase,
    focusEvent,
  }: {
    isOpen: boolean
    phase: TimelinePhase | null
    focusEvent?: TimelineEvent | null
  }) =>
    isOpen ? (
      <div data-testid="detail-popover">
        <span data-testid="popover-row">{phase?.title}</span>
        <span data-testid="popover-event">{focusEvent?.title}</span>
      </div>
    ) : null,
}))

// Real data, structural assertions (the CSV changes over time).
const GANTT = transformToGanttData(applyTimelineScope(timelineData, {}))
const multi = GANTT.flatMap((c) => c.phases.map((p) => ({ c, p }))).find(
  ({ p }) => p.events.length > 1 && p.events[1].title !== p.events[0].title
)!
const nonFirst = multi.p.events[1]

describe('?event= resolution (timelineData helpers)', () => {
  it('has a grouped row whose second event differs from the row title', () => {
    expect(multi).toBeTruthy()
    expect(nonFirst.title).not.toBe(multi.p.title)
  })

  it('resolves every event by its event_id to the row containing it', () => {
    for (const c of GANTT)
      for (const p of c.phases)
        for (const e of p.events) {
          const r = findEventInGantt(GANTT, eventLinkKey(e))
          expect(r?.phase).toBe(p)
          expect(r?.event).toBe(e)
        }
  })

  it('resolves a non-first event by its title (old title links)', () => {
    const r = findEventInGantt(GANTT, nonFirst.title)
    expect(r?.event?.title).toBe(nonFirst.title)
    expect(r?.phase.events).toContain(r?.event)
  })

  it('returns null for an unknown id', () => {
    expect(findEventInGantt(GANTT, 'no-such-event-xyz')).toBeNull()
    expect(findTimelineEvent(timelineData, 'no-such-event-xyz')).toBeNull()
  })

  it('finds events in the unscoped data regardless of category', () => {
    const gov = timelineData
      .flatMap((c) => c.bodies.flatMap((b) => b.events))
      .find((e) => e.entityType === 'government')!
    const standardsOnly = transformToGanttData(
      applyTimelineScope(timelineData, { categories: ['standards'] })
    )
    expect(findEventInGantt(standardsOnly, eventLinkKey(gov))).toBeNull()
    expect(findTimelineEvent(timelineData, eventLinkKey(gov))).toBe(gov)
  })

  it('prefers event_id and builds an event page URL', () => {
    expect(eventLinkKey({ eventId: 'TL-1', title: 'T' })).toBe('TL-1')
    expect(eventLinkKey({ title: 'T' })).toBe('T')
    expect(timelineEventPageUrl('United States', 'TL 1')).toBe(
      '/timeline?country=United%20States&event=TL%201'
    )
    expect(timelineEventPageUrl('Canada')).toBe('/timeline?country=Canada')
  })
})

describe('SimpleGanttChart ?event= deep link', () => {
  const countryData = GANTT.filter((c) => c === multi.c)
  const renderAt = (event: string) =>
    render(
      <MemoryRouter initialEntries={[`/timeline?event=${encodeURIComponent(event)}`]}>
        <SimpleGanttChart
          data={countryData}
          regionFilter="All"
          onRegionSelect={() => {}}
          regionItems={[]}
          selectedCountry="All"
          onCountrySelect={() => {}}
          countryItems={[]}
        />
      </MemoryRouter>
    )

  it('opens the containing row focused on a non-first event (by event_id)', () => {
    renderAt(eventLinkKey(nonFirst))
    expect(screen.getByTestId('popover-row')).toHaveTextContent(multi.p.title)
    expect(screen.getByTestId('popover-event')).toHaveTextContent(nonFirst.title)
  })

  it('opens a non-first event by its title', () => {
    renderAt(nonFirst.title)
    expect(screen.getByTestId('popover-event')).toHaveTextContent(nonFirst.title)
  })

  it('tags each Gantt row with data-deeplink-id', () => {
    renderAt('no-such-event')
    expect(document.querySelector(`[data-deeplink-id="${phaseRowKey(multi.p)}"]`)).not.toBeNull()
    expect(screen.queryByTestId('detail-popover')).toBeNull()
  })
})
