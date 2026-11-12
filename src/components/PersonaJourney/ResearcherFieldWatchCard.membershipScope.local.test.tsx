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

describe('unique reference aggregate retains category detail', () => {
  it('counts one reference once across two followed families and one topic', () => {
    const summary = computeResearchFieldWatch(['lattice-based', 'hash-based'], start, rows, [
      'cryptanalysis',
    ])
    expect(new Set(rows.map((item) => item.referenceId)).size).toBe(1)
    expect(summary.totalDeprecatedInWindow).toBe(1)
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('1 record')
    expect(screen.getByTestId('field-watch-punchline')).toHaveTextContent(
      'Unique Hub catalogue records marked deprecated: 1.'
    )
    expect(screen.getByText(/Each reference ID counts once/)).toBeVisible()
    expect(summary.fields.map((f) => f.deprecatedCount)).toEqual([1, 1])
    expect(summary.topics[0].deprecatedCount).toBe(1)
    expect(screen.getByTestId('corpus-deprecated')).not.toHaveTextContent('docs')
    expect(
      screen.getByText(/Hub catalogue status is not evidence of a scientific retraction/)
    ).toBeVisible()
  })

  it('keeps a single-category count unchanged with a singular match label', () => {
    useResearchFieldsStore.setState({
      followedFields: ['lattice-based'],
      followedTopics: [],
    })
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('1 record')
  })

  it('reports zero category matches without a no-retraction finding', () => {
    rows = [{ ...row, isDeprecated: false, deprecatedAtMs: null }]
    render(<ResearcherFieldWatchCard />)
    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('0 records')
    expect(screen.getByTestId('field-watch-punchline')).not.toHaveTextContent(/nothing.*retracted/i)
  })
})

describe('unique aggregate preserves existing selection and strict date predicate', () => {
  it('counts distinct IDs, deduplicates repeated IDs and retains per-category counts', () => {
    const input = [row, { ...row }, { ...row, referenceId: 'sample-second' }]
    const result = computeResearchFieldWatch(['lattice-based', 'hash-based'], start, input, [
      'cryptanalysis',
    ])
    expect(result.totalDeprecatedInWindow).toBe(2)
    expect(result.fields.map((f) => f.deprecatedCount)).toEqual([3, 3])
    expect(result.topics[0].deprecatedCount).toBe(3)
  })
  it.each([null, NaN, start, start - 1])(
    'excludes an unusable or out-of-window deprecation date: %s',
    (date) => {
      const result = computeResearchFieldWatch(['lattice-based'], start, [
        { ...row, deprecatedAtMs: date },
      ])
      expect(result.totalDeprecatedInWindow).toBe(0)
      expect(result.fields[0].deprecatedCount).toBe(0)
    }
  )
  it('does not count inactive deprecation status, unfollowed categories or unknown topics', () => {
    expect(
      computeResearchFieldWatch(['lattice-based'], start, [{ ...row, isDeprecated: false }])
        .totalDeprecatedInWindow
    ).toBe(0)
    expect(computeResearchFieldWatch(['code-based'], start, [row]).totalDeprecatedInWindow).toBe(0)
    expect(
      computeResearchFieldWatch(
        [],
        start,
        [{ ...row, researchTopics: ['unknown-topic'] }],
        ['unknown-topic']
      ).totalDeprecatedInWindow
    ).toBe(0)
  })
  it('keeps empty input, empty interests and an unavailable reporting window at zero', () => {
    expect(computeResearchFieldWatch(['lattice-based'], start, []).totalDeprecatedInWindow).toBe(0)
    expect(computeResearchFieldWatch([], start, [row]).totalDeprecatedInWindow).toBe(0)
    expect(computeResearchFieldWatch(['lattice-based'], null, [row]).totalDeprecatedInWindow).toBe(
      0
    )
  })
})
