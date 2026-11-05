// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DocumentTable } from './DocumentTable'
import type { GanttCountryData, TimelineEvent } from '@/types/timeline'
vi.mock('@/hooks/useRevisions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useRevisions')>()),
  useRevisions: () => ({ revisions: [], isLoading: false }),
}))
const sampleEvent = (
  title: string,
  startYear: number,
  endYear: number,
  openEnded = false
): TimelineEvent => ({
  title,
  startYear,
  endYear,
  openEnded,
  phase: 'Guidance',
  type: 'Milestone',
  description: `Sample ${title}`,
  entityType: 'government',
  orgName: 'Sample body',
  orgFullName: 'Sample body',
  countryName: 'Australia',
  flagCode: 'AU',
  eventId: `sample-${startYear}-${title}`,
  sourceUrl: `https://example.test/${title}`,
  sourceDate: `${startYear}-01-01`,
})
const events = [
  sampleEvent('Early sample', 2016, 2016),
  sampleEvent('ISM 2024 sample', 2024, 2024),
  sampleEvent('Finite sample', 2025, 2035),
  sampleEvent('Open sample', 2026, 2026, true),
]
const data: GanttCountryData[] = [
  {
    country: { countryName: 'Australia', flagCode: 'AU', bodies: [] },
    phases: [
      {
        phase: 'Guidance',
        type: 'Phase',
        title: events[0].title,
        startYear: 2016,
        endYear: 2035,
        openEnded: true,
        description: 'Chart aggregation only',
        events,
      },
    ],
  },
]
const labels = ['2016', '2024', '2025–2035', '2026 onward (no end date stated by source)']
describe('Document rows preserve individual source events', () => {
  it.each(['cards', 'table'] as const)(
    'shows every event with its own period and source identity in %s',
    (mode) => {
      const onSelect = vi.fn()
      render(
        <MemoryRouter initialEntries={[`/timeline?docview=${mode}`]}>
          <DocumentTable data={data} syncViewToUrl onSelectRow={onSelect} />
        </MemoryRouter>
      )
      events.forEach((event, i) => {
        const row =
          mode === 'cards'
            ? screen.getAllByRole('button', { name: `View details for ${event.title}` })[0]
            : screen
                .getAllByRole('row')
                .find((candidate) => within(candidate).queryByText(event.title))!
        expect(within(row).getByText(labels.at(i)!)).toBeInTheDocument()
        if (mode === 'cards')
          expect(
            within(row).getByRole('link', { name: `View source for ${event.title}` })
          ).toHaveAttribute('href', event.sourceUrl)
        fireEvent.click(
          mode === 'cards'
            ? row
            : within(row).getByRole('button', { name: `View details for ${event.title}` })
        )
        expect(onSelect).toHaveBeenLastCalledWith(
          expect.objectContaining({
            title: event.title,
            eventId: event.eventId,
            startYear: event.startYear,
            endYear: event.endYear,
            openEnded: event.openEnded,
            sourceUrl: event.sourceUrl,
            sourceDate: event.sourceDate,
          })
        )
      })
      expect(screen.getByText(/4 entries/)).toBeInTheDocument()
    }
  )
  it('labels a source-less phase as a phase summary without inventing a source identity', () => {
    const onSelect = vi.fn()
    render(
      <MemoryRouter>
        <DocumentTable
          data={[{ ...data[0], phases: [{ ...data[0].phases[0], events: [] }] }]}
          onSelectRow={onSelect}
        />
      </MemoryRouter>
    )
    expect(screen.getByText('Phase summary')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /View source/ })).not.toBeInTheDocument()
    fireEvent.click(
      screen.getAllByRole('button', { name: `View details for ${events[0].title}` })[0]
    )
    expect(onSelect.mock.lastCall?.[0].eventId).toBeUndefined()
    expect(onSelect.mock.lastCall?.[0].sourceUrl).toBeUndefined()
  })
})
