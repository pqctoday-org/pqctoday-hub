// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import {
  TimelineDocumentDetailPopover,
  type TimelineDocumentRow,
} from './TimelineDocumentDetailPopover'
const row: TimelineDocumentRow = {
  countryName: 'Canada',
  org: 'Sample body',
  phase: 'Guidance',
  type: 'Milestone',
  title: 'Sample document period',
  startYear: 2024,
  endYear: 2024,
  description: 'Fictional display fixture',
}
describe('Document details preserve exact source periods', () => {
  it.each([
    [2016, 2016, false, '2016'],
    [2024, 2024, false, '2024'],
    [2024, 2035, false, '2024–2035'],
    [2024, 2024, true, '2024 onward (no end date stated by source)'],
  ] as const)('shows %s–%s with openEnded=%s as %s', (startYear, endYear, openEnded, label) => {
    render(
      <MemoryRouter>
        <TimelineDocumentDetailPopover
          isOpen
          row={{ ...row, startYear, endYear, openEnded }}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    )
    const details = screen.getByRole('dialog')
    expect(within(details).getByText(label)).toBeInTheDocument()
    expect(within(details).queryByText(/< 2024|2035\+/)).not.toBeInTheDocument()
  })
})
