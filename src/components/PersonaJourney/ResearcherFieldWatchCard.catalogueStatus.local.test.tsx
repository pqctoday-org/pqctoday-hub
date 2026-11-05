// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResearcherFieldWatchCard } from './ResearcherFieldWatchCard'
import { useResearchFieldsStore } from '@/store/useResearchFieldsStore'
import type { FieldWatchRow } from '@/data/researchFieldWatch'
const release = Date.parse('2026-07-31T00:00:00Z'),
  start = release - 90 * 86400000
let rows: FieldWatchRow[] = []
vi.mock('@/data/researchFieldWatch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/researchFieldWatch')>()
  return {
    ...actual,
    loadFieldWatchCorpus: () => ({
      rows,
      releaseDateMs: release,
      windowStartMs: start,
      otherShare: actual.computeOtherFieldShare(rows),
      topicTaggedCount: actual.countTopicTaggedRows(rows),
    }),
  }
})
beforeEach(() =>
  useResearchFieldsStore.setState({ followedFields: ['lattice-based'], followedTopics: [] })
)
describe('catalogue deprecation is not scientific retraction evidence', () => {
  it('a deprecated catalogue sample has no scientific-retraction field but retains its exact count', () => {
    rows = [
      {
        referenceId: 'SAMPLE-REPLACED-EDITION',
        algorithmFamily: 'Lattice-based',
        lastUpdateDateMs: null,
        isDeprecated: true,
        deprecatedAtMs: release - 10 * 86400000,
      },
    ]
    render(<ResearcherFieldWatchCard />)
    expect(
      screen.getByText('Category matches for Hub catalogue rows marked deprecated')
    ).toBeInTheDocument()
    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('1 category match')
    expect(screen.getByTestId('field-watch-punchline')).toHaveTextContent(
      'Recorded category matches for Hub catalogue rows marked deprecated: 1.'
    )
    expect(
      screen.getByText(/Hub catalogue status is not evidence of a scientific retraction/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/were retracted|was retracted/)).not.toBeInTheDocument()
  })
  it('outside-window deprecation stays excluded without asserting no scientific retractions', () => {
    rows = [
      {
        referenceId: 'SAMPLE-OLD-REPLACEMENT',
        algorithmFamily: 'Lattice-based',
        lastUpdateDateMs: null,
        isDeprecated: true,
        deprecatedAtMs: start - 86400000,
      },
    ]
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('0 category matches')
    expect(screen.getByTestId('field-watch-punchline')).toHaveTextContent(
      'Recorded category matches for Hub catalogue rows marked deprecated: 0.'
    )
    expect(
      screen.queryByText('Nothing in the fields you follow was retracted.')
    ).not.toBeInTheDocument()
  })
})
