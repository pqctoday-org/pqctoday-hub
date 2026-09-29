// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { DocumentTable } from './DocumentTable'
import type { GanttCountryData, TimelinePhase } from '../../types/timeline'

const phase = (title: string, startYear: number): TimelinePhase =>
  ({
    phase: 'Policy',
    type: 'Milestone',
    title,
    startYear,
    endYear: startYear,
    description: '',
    events: [],
  }) as TimelinePhase

// Deliberately NOT in start-year order.
const DATA: GanttCountryData[] = [
  {
    country: {
      countryName: 'United States',
      flagCode: 'US',
      bodies: [{ name: 'NIST', fullName: 'NIST', countryCode: 'US', events: [] }],
    },
    phases: [phase('Late', 2031), phase('Early', 2026), phase('Middle', 2028)],
  },
]

describe('DocumentTable', () => {
  it('cards follow the table sort (start year ascending), not the raw row order', () => {
    render(
      <MemoryRouter>
        <DocumentTable data={DATA} />
      </MemoryRouter>
    )
    const order = screen
      .getAllByRole('button', { name: /^View details for / })
      .map((b) => b.getAttribute('aria-label'))
      .filter((v, i, a) => a.indexOf(v) === i)
    expect(order).toEqual([
      'View details for Early',
      'View details for Middle',
      'View details for Late',
    ])
  })

  it('without syncViewToUrl the view toggle is local (defaults to cards)', () => {
    render(
      <MemoryRouter initialEntries={['/timeline?docview=table']}>
        <DocumentTable data={DATA} />
      </MemoryRouter>
    )
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true')
  })
})
