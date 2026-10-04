// SPDX-License-Identifier: GPL-3.0-only
// URL params owned by the Gantt chart and its Documents panel:
//   ?phase ?deadlines=1 ?etype ?gsort ?gdir  (filters/sort, replace)
//   ?event from a Documents-panel click       (push; close = replace)
//   ?docview=cards|table                      (replace)
import type { ReactElement } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigationType } from 'react-router'
import '@testing-library/jest-dom'
import { SimpleGanttChart } from './SimpleGanttChart'
import type { GanttCountryData, TimelineEvent, TimelinePhase } from '../../types/timeline'
import type { TimelineDocumentRow } from './TimelineDocumentDetailPopover'
import { Button } from '@/components/ui/button'

vi.mock('./GanttDetailPopover', () => ({
  GanttDetailPopover: ({ isOpen, phase }: { isOpen: boolean; phase: TimelinePhase | null }) =>
    isOpen ? <div data-testid="gantt-popover">{phase?.title}</div> : null,
}))
vi.mock('./TimelineDocumentDetailPopover', () => ({
  TimelineDocumentDetailPopover: ({
    isOpen,
    row,
    onClose,
  }: {
    isOpen: boolean
    row: TimelineDocumentRow | null
    onClose: () => void
  }) =>
    isOpen && row ? (
      <div data-testid="doc-popover">
        {row.title}
        <Button onClick={onClose}>Close details</Button>
      </div>
    ) : null,
}))
vi.mock('../common/CountryFlag', () => ({ CountryFlag: () => null }))
vi.mock('../../utils/analytics', () => ({ logEvent: vi.fn(), logTimelineFilterText: vi.fn() }))
vi.mock('../common/FilterDropdown', () => ({
  FilterDropdown: ({
    items,
    onSelect,
    selectedId,
    defaultLabel,
  }: {
    items: { id: string; label: string }[]
    onSelect: (id: string) => void
    selectedId: string
    defaultLabel: string
  }) => (
    <div data-testid={`dropdown-${defaultLabel}`} data-selected={selectedId}>
      {items.map((item) => (
        <Button key={item.id} onClick={() => onSelect(item.id)}>
          {`${defaultLabel}:${item.id}`}
        </Button>
      ))}
    </div>
  ),
}))

const ev = (eventId: string, phase: string, type: string, title: string, startYear: number) =>
  ({ eventId, phase, type, title, startYear, endYear: startYear }) as unknown as TimelineEvent
const row = (e: TimelineEvent): TimelinePhase =>
  ({
    phase: e.phase,
    type: e.type,
    title: e.title,
    startYear: e.startYear,
    endYear: e.endYear,
    description: '',
    events: [e],
  }) as TimelinePhase

const MIG = ev('US-MIG', 'Migration', 'Phase', 'US Migration', 2027)
const DL = ev('US-DL', 'Deadline', 'Milestone', 'US Deadline', 2030)
const POL = ev('US-POL', 'Policy', 'Milestone', 'US Policy', 2025)
const CA_TEST = ev('CA-TEST', 'Testing', 'Phase', 'Canada Testing', 2026)

const DATA: GanttCountryData[] = [
  {
    country: {
      countryName: 'United States',
      flagCode: 'US',
      bodies: [{ name: 'NIST', fullName: 'NIST', countryCode: 'US', events: [MIG, DL, POL] }],
    },
    phases: [row(MIG), row(DL), row(POL)],
  },
  {
    country: {
      countryName: 'Canada',
      flagCode: 'CA',
      bodies: [{ name: 'CSE', fullName: 'CSE', countryCode: 'CA', events: [CA_TEST] }],
    },
    phases: [row(CA_TEST)],
  },
]

function Probe() {
  const loc = useLocation()
  const nav = useNavigationType()
  return (
    <div data-testid="probe" data-nav={nav}>
      {loc.search}
    </div>
  )
}
const params = () => new URLSearchParams(screen.getByTestId('probe').textContent ?? '')
const navType = () => screen.getByTestId('probe').getAttribute('data-nav')

const baseProps = {
  data: DATA,
  regionFilter: 'All',
  onRegionSelect: vi.fn(),
  regionItems: [{ id: 'All', label: 'All' }],
  selectedCountry: 'All',
  onCountrySelect: vi.fn(),
  countryItems: [{ id: 'All', label: 'All', icon: null }],
}

const renderAt = (search: string, ui: ReactElement = <SimpleGanttChart {...baseProps} />) =>
  render(
    <MemoryRouter initialEntries={[`/timeline${search}`]}>
      {ui}
      <Probe />
    </MemoryRouter>
  )

/** Titles of the rendered Gantt rows, in order (rows carry data-deeplink-id). */
const rowIds = () =>
  Array.from(document.querySelectorAll('tbody tr[data-deeplink-id]')).map((r) =>
    r.getAttribute('data-deeplink-id')
  )

describe('Gantt ?phase / ?deadlines / ?etype', () => {
  it('reads ?phase on load (case-insensitive)', () => {
    renderAt('?phase=migration')
    expect(rowIds()).toEqual(['US-MIG'])
    expect(screen.getByTestId('dropdown-All Phases')).toHaveAttribute('data-selected', 'Migration')
  })

  it('ignores an unknown ?phase / ?etype', () => {
    renderAt('?phase=bogus&etype=nope')
    expect(rowIds()).toHaveLength(4)
  })

  it('writes ?phase on select (replace) and clears it via the chip', () => {
    renderAt('')
    fireEvent.click(screen.getByText('All Phases:Testing'))
    expect(params().get('phase')).toBe('Testing')
    expect(navType()).toBe('REPLACE')
    expect(rowIds()).toEqual(['CA-TEST'])
    fireEvent.click(screen.getByRole('button', { name: /remove testing filter|clear testing/i }))
    expect(params().has('phase')).toBe(false)
  })

  it('reads ?deadlines=1 and the toggle writes / clears it', () => {
    renderAt('?deadlines=1')
    const toggle = screen.getByRole('button', { name: 'Show deadlines only' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(rowIds()).toEqual(['US-DL'])
    fireEvent.click(toggle)
    expect(params().has('deadlines')).toBe(false)
    expect(rowIds()).toHaveLength(4)
    fireEvent.click(toggle)
    expect(params().get('deadlines')).toBe('1')
    expect(params().has('phase')).toBe(false)
    expect(navType()).toBe('REPLACE')
  })

  it('?phase=Deadline is read as the Deadlines toggle', () => {
    renderAt('?phase=Deadline')
    expect(screen.getByRole('button', { name: 'Show deadlines only' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('reads and writes ?etype', () => {
    renderAt('?etype=Milestone')
    expect(rowIds()).toEqual(['US-POL', 'US-DL'])
    fireEvent.click(screen.getByText('All Types:Phase'))
    expect(params().get('etype')).toBe('Phase')
    expect(rowIds()).toEqual(['CA-TEST', 'US-MIG'])
  })
})

describe('Gantt ?gsort / ?gdir', () => {
  const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(name) })

  it('reads the sort on load', () => {
    renderAt('?gsort=organization&gdir=desc')
    expect(header('Organization')).toHaveAttribute('aria-sort', 'descending')
    // NIST (US) before CSE (CA) when descending by organization.
    expect(rowIds()[0]).toBe('US-POL')
  })

  it('writes the sort on header click; defaults are not written', () => {
    renderAt('')
    fireEvent.click(header('Country'))
    expect(params().get('gdir')).toBe('desc')
    expect(params().has('gsort')).toBe(false)
    expect(navType()).toBe('REPLACE')
    fireEvent.click(header('Organization'))
    expect(params().get('gsort')).toBe('organization')
    expect(params().has('gdir')).toBe(false)
  })

  it('unknown sort values fall back to country/asc', () => {
    renderAt('?gsort=zzz&gdir=sideways')
    expect(header('Country')).toHaveAttribute('aria-sort', 'ascending')
  })
})

describe('Clear all + "My countries only"', () => {
  it('without onClearAll, clears the Gantt params and turns "My countries only" off', () => {
    const onSetShowOnly = vi.fn()
    renderAt(
      '?phase=Testing&etype=Milestone&gsort=organization&gdir=desc',
      <SimpleGanttChart
        {...baseProps}
        showOnlyMyCountries
        onSetShowOnlyMyCountries={onSetShowOnly}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }))
    const p = params()
    for (const k of ['phase', 'etype', 'deadlines', 'gsort', 'gdir']) expect(p.has(k)).toBe(false)
    expect(onSetShowOnly).toHaveBeenCalledWith(false)
  })

  it('delegates to onClearAll (one URL write) when given', () => {
    const onClearAll = vi.fn()
    renderAt(
      '?phase=Testing&etype=Milestone',
      <SimpleGanttChart {...baseProps} onClearAll={onClearAll} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }))
    expect(onClearAll).toHaveBeenCalledTimes(1)
  })

  it('"My countries only" counts as an active filter with its own chip', () => {
    const onSetShowOnly = vi.fn()
    renderAt(
      '',
      <SimpleGanttChart
        {...baseProps}
        myCountries={['Canada']}
        showOnlyMyCountries
        onSetShowOnlyMyCountries={onSetShowOnly}
      />
    )
    expect(rowIds()).toEqual(['CA-TEST'])
    const chip = screen.getByText('My countries only').closest('span, div')!
    fireEvent.click(within(chip as HTMLElement).getByRole('button'))
    expect(onSetShowOnly).toHaveBeenCalledWith(false)
  })
})

describe('?event from a linked row hidden by ?phase', () => {
  it('drops the hiding phase filter and opens the Gantt popover', () => {
    renderAt('?phase=Testing&event=US-MIG')
    expect(screen.getByTestId('gantt-popover')).toHaveTextContent('US Migration')
    expect(params().has('phase')).toBe(false)
  })
})

describe('Documents panel: ?event and ?docview', () => {
  const us = { ...baseProps, selectedCountry: 'United States' }

  it('a card click opens the document popover and pushes ?event; close removes it (replace)', () => {
    renderAt('', <SimpleGanttChart {...us} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'View details for US Deadline' })[0])
    expect(screen.getByTestId('doc-popover')).toHaveTextContent('US Deadline')
    expect(screen.queryByTestId('gantt-popover')).toBeNull()
    expect(params().get('event')).toBe('US-DL')
    expect(navType()).toBe('PUSH')
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }))
    expect(screen.queryByTestId('doc-popover')).toBeNull()
    expect(params().has('event')).toBe(false)
    expect(navType()).toBe('REPLACE')
  })

  it('an arriving ?event opens the Gantt popover, not the document popover', () => {
    renderAt('?event=US-DL', <SimpleGanttChart {...us} />)
    expect(screen.getByTestId('gantt-popover')).toHaveTextContent('US Deadline')
    expect(screen.queryByTestId('doc-popover')).toBeNull()
  })

  it('reads ?docview=table and the toggle writes / clears it', () => {
    renderAt('?docview=table', <SimpleGanttChart {...us} />)
    const [cards, table] = screen.getAllByRole('radio')
    expect(table).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('table', { name: /Policy documents/ })).toBeInTheDocument()
    fireEvent.click(cards)
    expect(params().has('docview')).toBe(false)
    expect(navType()).toBe('REPLACE')
    fireEvent.click(screen.getAllByRole('radio')[1])
    expect(params().get('docview')).toBe('table')
  })

  it('an unknown ?docview falls back to cards', () => {
    renderAt('?docview=grid', <SimpleGanttChart {...us} />)
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true')
  })

  it('embedded (sim): filters and the document popover never touch the URL', () => {
    renderAt('?phase=Testing', <SimpleGanttChart {...us} embedded />)
    // ?phase is ignored inside the embed.
    expect(rowIds()).toHaveLength(3)
    fireEvent.click(screen.getAllByRole('button', { name: 'View details for US Deadline' })[0])
    expect(screen.getByTestId('doc-popover')).toBeInTheDocument()
    expect(params().has('event')).toBe(false)
  })
})
