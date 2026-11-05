// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ResearcherFieldWatchCard } from './ResearcherFieldWatchCard'
import { useResearchFieldsStore } from '@/store/useResearchFieldsStore'
import { computeResearchFieldWatch, type FieldWatchRow } from '@/data/researchFieldWatch'

const release = Date.parse('2026-11-01T00:00:00Z')
const start = release - 90 * 86400000
const row: FieldWatchRow = {
  referenceId: 'sample-one-record',
  algorithmFamily: 'ML-KEM;SLH-DSA',
  lastUpdateDateMs: release - 86400000,
  isDeprecated: true,
  deprecatedAtMs: release - 86400000,
  researchTopics: ['cryptanalysis'],
}
let rows = [row]
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
beforeEach(() => {
  rows = [row]
  useResearchFieldsStore.setState({
    followedFields: ['lattice-based', 'hash-based'],
    followedTopics: ['cryptanalysis'],
  })
})

describe('category membership total without a unique-document claim', () => {
  it('shows three category matches for one row in two followed families and one topic', () => {
    const summary = computeResearchFieldWatch(['lattice-based', 'hash-based'], start, rows, [
      'cryptanalysis',
    ])
    expect(new Set(rows.map((item) => item.referenceId)).size).toBe(1)
    expect(summary.totalDeprecatedInWindow).toBe(1 + 1 + 1)
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('3 category matches')
    expect(screen.getByTestId('field-watch-punchline')).toHaveTextContent(
      'Recorded category matches for Hub catalogue rows marked deprecated: 3.'
    )
    expect(screen.getByText(/This total counts those matches, not unique documents/)).toBeVisible()
    expect(screen.getByTestId('corpus-deprecated')).not.toHaveTextContent('docs')
    expect(
      screen.getByText(/Hub catalogue status is not evidence of a scientific retraction/)
    ).toBeVisible()
  })

  it('keeps a single-category count unchanged with a singular match label', () => {
    useResearchFieldsStore.setState({ followedFields: ['lattice-based'], followedTopics: [] })
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('1 category match')
  })

  it('reports zero category matches without a no-retraction finding', () => {
    rows = [{ ...row, isDeprecated: false, deprecatedAtMs: null }]
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('0 category matches')
    expect(screen.getByTestId('field-watch-punchline')).not.toHaveTextContent(/nothing.*retracted/i)
  })
})
