// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DocumentTable } from './DocumentTable'
import type { GanttCountryData } from '@/types/timeline'
const data: GanttCountryData[] = [
  {
    country: { countryName: 'Canada', flagCode: 'CA', bodies: [] },
    phases: [
      { title: 'Sample early source', startYear: 2016, endYear: 2016, openEnded: false },
      { title: 'Sample 2024 source', startYear: 2024, endYear: 2024, openEnded: false },
      { title: 'Sample finite2035', startYear: 2024, endYear: 2035, openEnded: false },
      { title: 'Sample no end date', startYear: 2024, endYear: 2035, openEnded: true },
    ].map((p) => ({
      ...p,
      phase: 'Migration' as const,
      type: 'Phase' as const,
      description: 'Fictional period fixture',
      events: [],
    })),
  },
]
describe('Document table exact source periods', () => {
  it.each([
    ['Sample early source', '2016'],
    ['Sample 2024 source', '2024'],
    ['Sample finite2035', '2024–2035'],
    ['Sample no end date', '2024 onward (no end date stated by source)'],
  ])('keeps %s as %s', (title, label) => {
    render(
      <MemoryRouter initialEntries={['/timeline?docview=table']}>
        <DocumentTable data={data} syncViewToUrl />
      </MemoryRouter>
    )
    const row = screen
      .getAllByRole('row')
      .find((candidate) => within(candidate).queryByText(title))!
    expect(within(row).getByText(label)).toBeInTheDocument()
    expect(within(row).queryByText(/< 2024|2035\+/)).not.toBeInTheDocument()
  })
})
