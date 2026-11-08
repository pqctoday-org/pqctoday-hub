// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimelineDocumentCard } from './TimelineDocumentCard'
import type { TimelineDocumentRow } from './TimelineDocumentDetailPopover'
vi.mock('@/hooks/useRevisions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useRevisions')>()),
  useRevisions: () => ({ revisions: [], isLoading: false }),
}))

const row: TimelineDocumentRow = {
  countryName: 'Canada',
  org: 'Sample body',
  phase: 'Migration',
  type: 'Milestone',
  title: 'Fictional period fixture',
  startYear: 2024,
  endYear: 2035,
  description: 'Display only',
}
describe('Document cards preserve exact source years', () => {
  it.each([
    [2024, 2024, false, '2024'],
    [2024, 2035, false, '2024–2035'],
    [2023, 2035, false, '2023–2035'],
    [2024, 2035, true, '2024 onward (no end date stated by source)'],
  ] as const)('shows %s–%s with openEnded=%s as %s', (startYear, endYear, openEnded, label) => {
    render(
      <TimelineDocumentCard
        row={{ ...row, startYear, endYear, openEnded }}
        onViewDetails={() => {}}
      />
    )
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.queryByText(/< 2024/)).not.toBeInTheDocument()
  })
})
