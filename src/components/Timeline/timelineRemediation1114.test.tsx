// SPDX-License-Identifier: AGPL-3.0-only
/**
 * /timeline remediation, 2026-11-14 — rendering checks: a grouped Gantt row
 * flags every year that holds a record and opens the record of the year
 * clicked; the popover lists every record of its row, names the issuer, and
 * switches between records; the Organization column is per row.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { ReactElement } from 'react'
import { GanttDetailPopover } from './GanttDetailPopover'
import { SimpleGanttChart } from './SimpleGanttChart'
import type { GanttCountryData, TimelineEvent, TimelinePhase } from '../../types/timeline'

vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return { ...actual, createPortal: (node: React.ReactNode) => node }
})
vi.mock('../../utils/analytics', () => ({ logEvent: vi.fn(), logTimelineFilterText: vi.fn() }))

const wrap = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

const ev = (over: Partial<TimelineEvent>): TimelineEvent => ({
  startYear: 2020,
  endYear: 2020,
  phase: 'Standardization',
  type: 'Milestone',
  title: 'Record',
  description: 'A record',
  orgName: 'NIST',
  orgFullName: 'National Institute of Standards and Technology',
  countryName: 'Testland',
  flagCode: 'tl',
  entityType: 'government',
  ...over,
})

const events = [
  ev({ eventId: 'tl-a', title: 'SP 800-208 Published', startYear: 2020, endYear: 2020 }),
  ev({ eventId: 'tl-b', title: 'FIPS 203 Published', startYear: 2024, endYear: 2024 }),
  ev({ eventId: 'tl-c', title: 'FIPS 204 Published', startYear: 2024, endYear: 2024 }),
  ev({
    eventId: 'tl-d',
    title: 'Agency Rule',
    startYear: 2022,
    endYear: 2022,
    orgName: 'CISA',
    orgFullName: 'Cybersecurity and Infrastructure Security Agency',
  }),
]
const row: TimelinePhase = {
  startYear: 2020,
  endYear: 2024,
  phase: 'Standardization',
  type: 'Milestone',
  title: events[0].title,
  description: events[0].description,
  events,
}

describe('GanttDetailPopover with a grouped row', () => {
  it('lists every record of the row and switches to the one picked', () => {
    wrap(<GanttDetailPopover isOpen onClose={() => {}} phase={row} />)
    const list = screen.getByTestId('gantt-row-events')
    expect(within(list).getAllByRole('button')).toHaveLength(4)
    expect(screen.getByRole('heading', { name: 'SP 800-208 Published' })).toBeInTheDocument()
    fireEvent.click(within(list).getByRole('button', { name: /FIPS 204 Published/ }))
    expect(screen.getByRole('heading', { name: 'FIPS 204 Published' })).toBeInTheDocument()
  })

  it('names the issuing body and country of the shown record', () => {
    wrap(<GanttDetailPopover isOpen onClose={() => {}} phase={row} focusEvent={events[3]} />)
    expect(screen.getByTestId('gantt-popover-org')).toHaveTextContent(
      'Cybersecurity and Infrastructure Security Agency (CISA)'
    )
    expect(screen.getByText('Testland')).toBeInTheDocument()
  })

  it('forgets a pick made in the popover once it closes', () => {
    const { rerender } = wrap(<GanttDetailPopover isOpen onClose={() => {}} phase={row} />)
    fireEvent.click(screen.getByRole('button', { name: /FIPS 204 Published/ }))
    rerender(
      <MemoryRouter>
        <GanttDetailPopover isOpen={false} onClose={() => {}} phase={row} />
      </MemoryRouter>
    )
    rerender(
      <MemoryRouter>
        <GanttDetailPopover isOpen onClose={() => {}} phase={row} />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'SP 800-208 Published' })).toBeInTheDocument()
  })

  it('hands the pick to a parent that controls the focus', () => {
    const onFocusEvent = vi.fn()
    wrap(<GanttDetailPopover isOpen onClose={() => {}} phase={row} onFocusEvent={onFocusEvent} />)
    fireEvent.click(screen.getByRole('button', { name: /FIPS 203 Published/ }))
    expect(onFocusEvent).toHaveBeenCalledWith(events[1])
  })
})

describe('SimpleGanttChart grouped milestone row', () => {
  const data: GanttCountryData[] = [
    {
      country: {
        countryName: 'Testland',
        flagCode: 'tl',
        bodies: [
          { name: 'NIST', fullName: '', countryCode: 'tl', events: events.slice(0, 3) },
          { name: 'CISA', fullName: '', countryCode: 'tl', events: events.slice(3) },
        ],
      },
      phases: [row],
    },
  ]
  const props = {
    data,
    regionFilter: 'All',
    onRegionSelect: () => {},
    regionItems: [],
    selectedCountry: 'All',
    onCountrySelect: () => {},
    countryItems: [],
    asOfYear: 2026,
  }

  it('flags each year that holds a record, with a count where it holds two', () => {
    wrap(<SimpleGanttChart {...props} />)
    expect(screen.getAllByTestId('milestone-flag')).toHaveLength(3) // 2020, 2022, 2024
    expect(screen.getByTestId('milestone-count')).toHaveTextContent('2')
  })

  it('opens the record of the year clicked', () => {
    wrap(<SimpleGanttChart {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /Standardization: Agency Rule \(2022\)/ }))
    expect(screen.getByRole('heading', { name: 'Agency Rule' })).toBeInTheDocument()
  })

  it("opens the record of the year on Enter, not the row's first", () => {
    wrap(<SimpleGanttChart {...props} />)
    fireEvent.keyDown(
      screen.getByRole('button', { name: /Standardization: Agency Rule \(2022\)/ }),
      {
        key: 'Enter',
      }
    )
    expect(screen.getByRole('heading', { name: 'Agency Rule' })).toBeInTheDocument()
  })

  it("names the row's own issuers in the Organization column", () => {
    wrap(<SimpleGanttChart {...props} />)
    expect(screen.getByTestId('gantt-row-org')).toHaveTextContent('NIST, CISA')
  })
})
