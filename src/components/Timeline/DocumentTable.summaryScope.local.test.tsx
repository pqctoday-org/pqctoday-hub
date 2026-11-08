// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { DocumentTable } from './DocumentTable'
import type { GanttCountryData, TimelineEvent } from '@/types/timeline'
vi.mock('@/data/timelineEnrichmentData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/data/timelineEnrichmentData')>()),
  timelineEnrichments: {
    'Australia:Sample body — Shared title': { fixture: 'matching legacy enrichment' },
  },
  getTimelineEnrichment: () => ({ fixture: 'matching legacy enrichment' }),
  hasSubstantiveEnrichment: () => true,
}))
vi.mock('@/hooks/useRevisions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useRevisions')>()),
  useRevisions: () => ({ revisions: [], isLoading: false }),
}))
vi.mock('@/components/ui/TrustScoreBadge', () => ({
  TrustScoreBadge: () => <span>Source trust fixture</span>,
}))
vi.mock('@/components/ui/ReviewedBadge', () => ({
  ReviewedBadge: () => <span>Source review fixture</span>,
}))
vi.mock('@/components/common/DocumentAnalysis', () => ({
  DocumentAnalysis: () => <div>Matched source analysis</div>,
}))
vi.mock('./TimelineAnalysisPanel', () => ({
  TimelineAnalysisPanel: () => <div>Matched timeline analysis</div>,
}))
const event: TimelineEvent = {
  title: 'Shared title',
  startYear: 2024,
  endYear: 2024,
  phase: 'Guidance',
  type: 'Milestone',
  description: 'Sample source',
  entityType: 'government',
  orgName: 'Sample body',
  orgFullName: 'Sample body',
  countryName: 'Australia',
  flagCode: 'AU',
  eventId: 'sample-event',
}
const data = (sourceEvent: boolean): GanttCountryData[] => [
  {
    country: {
      countryName: 'Australia',
      flagCode: 'AU',
      bodies: [{ name: 'Sample body', fullName: 'Sample body', countryCode: 'AU', events: [] }],
    },
    phases: [
      {
        phase: 'Guidance',
        type: 'Phase',
        title: 'Shared title',
        startYear: 2024,
        endYear: 2025,
        description: 'Phase summary fixture',
        events: sourceEvent ? [event] : [],
      },
    ],
  },
]
describe('Phase summaries cannot inherit source-event enrichment', () => {
  it.each(['cards', 'table'] as const)(
    'blocks matching legacy enrichment for a summary in %s and details',
    (mode) => {
      render(
        <MemoryRouter initialEntries={[`/timeline?docview=${mode}`]}>
          <DocumentTable data={data(false)} syncViewToUrl />
        </MemoryRouter>
      )
      expect(screen.queryByText('Enriched')).not.toBeInTheDocument()
      expect(screen.queryByText('Source trust fixture')).not.toBeInTheDocument()
      expect(screen.queryByText('Source review fixture')).not.toBeInTheDocument()
      const detail = screen
        .getAllByRole('button', { name: 'View details for Shared title' })
        .at(-1)!
      if (mode === 'table') expect(detail).toHaveAttribute('title', 'View details')
      fireEvent.click(detail)
      expect(screen.queryByText('Matched source analysis')).not.toBeInTheDocument()
      expect(screen.queryByText('Matched timeline analysis')).not.toBeInTheDocument()
    }
  )
  it.each(['cards', 'table'] as const)(
    'preserves normal source-event enrichment in %s and details',
    (mode) => {
      render(
        <MemoryRouter initialEntries={[`/timeline?docview=${mode}`]}>
          <DocumentTable data={data(true)} syncViewToUrl />
        </MemoryRouter>
      )
      if (mode === 'cards') {
        expect(screen.getByText('Enriched')).toBeInTheDocument()
        expect(screen.getByText('Source trust fixture')).toBeInTheDocument()
        expect(screen.getByText('Source review fixture')).toBeInTheDocument()
      }
      const detail = screen
        .getAllByRole('button', { name: 'View details for Shared title' })
        .at(-1)!
      fireEvent.click(detail)
      expect(screen.getByText('Matched source analysis')).toBeInTheDocument()
      expect(screen.getByText('Matched timeline analysis')).toBeInTheDocument()
    }
  )
})
