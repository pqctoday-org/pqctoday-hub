// SPDX-License-Identifier: AGPL-3.0-only
import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { TimelineExecutiveDeadline } from './TimelineExecutiveDeadline'
import type { EventType, GanttCountryData, Phase, TimelineEvent } from '@/types/timeline'

const year = new Date().getFullYear()
function row(
  country: string,
  title: string,
  offset: number,
  phase: Phase = 'Deadline',
  type: EventType = 'Milestone'
): GanttCountryData {
  const event: TimelineEvent = {
    title,
    phase,
    type,
    startYear: year + offset,
    endYear: year + offset,
    description: 'Fictional scope fixture',
    mandateType: 'HARD',
    entityType: 'government',
    orgName: country === 'Germany' ? 'Bundesamt' : 'Sample issuer',
    orgFullName: 'Sample issuer',
    countryName: country,
    flagCode: '',
  }
  return {
    country: {
      countryName: country,
      flagCode: '',
      bodies: [
        { name: event.orgName, fullName: event.orgFullName, countryCode: '', events: [event] },
      ],
    },
    phases: [
      {
        startYear: event.startYear,
        endYear: event.endYear,
        phase,
        type,
        title,
        description: event.description,
        events: [event],
      },
    ],
  }
}
const records = [
  row('United States', 'Earlier hidden US milestone', 1),
  row('Germany', 'Visible German milestone', 2),
  row('Global', 'Visible global-institution milestone', 3),
]
function show(props: Partial<ComponentProps<typeof TimelineExecutiveDeadline>> = {}) {
  return render(
    <MemoryRouter>
      <TimelineExecutiveDeadline
        ganttData={records}
        regionFilter="All"
        regionLabel="All countries"
        {...props}
      />
    </MemoryRouter>
  )
}
describe('executive deadline follows the visible timeline scope', () => {
  it('keeps the worldwide All view available', () => {
    show()
    expect(screen.getByText('Earlier hidden US milestone')).toBeVisible()
  })
  it('uses pending guidance from the visible country rather than a hidden binding record', () => {
    const german = row('Germany', 'Visible German guidance', 2)
    german.phases[0].events[0].mandateType = 'SOFT'
    show({ ganttData: [records[0], german], selectedCountry: 'Germany' })
    expect(screen.getByText('Visible German guidance')).toBeVisible()
    expect(screen.getByText(/its binding status is guidance or still under review/)).toBeVisible()
    expect(screen.queryByText('Earlier hidden US milestone')).not.toBeInTheDocument()
  })
  it('uses an explicit country rather than a hidden earlier national milestone', () => {
    show({ selectedCountry: 'Germany' })
    expect(screen.getByText('Visible German milestone')).toBeVisible()
    expect(screen.queryByText('Earlier hidden US milestone')).not.toBeInTheDocument()
    expect(screen.getByText(/In Germany,/)).toBeVisible()
  })
  it('keeps the Global institutional region distinct from All countries', () => {
    show({ regionFilter: 'global', regionLabel: 'Global institutions' })
    expect(screen.getByText('Visible global-institution milestone')).toBeVisible()
    expect(screen.queryByText('Earlier hidden US milestone')).not.toBeInTheDocument()
  })
  it.each(['Germany', 'Bundesamt'])('uses the chart country/issuer search %s', (searchText) => {
    show({ searchText })
    expect(screen.getByText('Visible German milestone')).toBeVisible()
    expect(screen.queryByText('Earlier hidden US milestone')).not.toBeInTheDocument()
  })
  it('does not report a deadline when the visible phase selection excludes deadlines', () => {
    show({ phaseFilter: 'Guidance' })
    expect(
      screen.getByText(/No upcoming binding regulation or deadline appears in this view/)
    ).toBeVisible()
    expect(screen.queryByText('Earlier hidden US milestone')).not.toBeInTheDocument()
  })
  it('applies the chart event-type selection without hiding a matching Phase row', () => {
    show({
      ganttData: [...records, row('Germany', 'Visible phase deadline', 4, 'Deadline', 'Phase')],
      eventTypeFilter: 'Phase',
    })
    expect(screen.getByText('Visible phase deadline')).toBeVisible()
    expect(screen.queryByText('Earlier hidden US milestone')).not.toBeInTheDocument()
  })
  it('applies saved-country narrowing and keeps a no-match view empty', () => {
    const view = show({ myCountries: ['Germany'], showOnlyMyCountries: true })
    expect(screen.getByText('Visible German milestone')).toBeVisible()
    view.unmount()
    show({ searchText: 'No matching sample issuer' })
    expect(
      screen.getByText(/No upcoming binding regulation or deadline appears in this view/)
    ).toBeVisible()
  })
  it('keeps an explicit country authoritative even when a different region is selected', () => {
    show({ selectedCountry: 'Germany', regionFilter: 'americas', regionLabel: 'Americas' })
    expect(screen.getByText('Visible German milestone')).toBeVisible()
  })
})
