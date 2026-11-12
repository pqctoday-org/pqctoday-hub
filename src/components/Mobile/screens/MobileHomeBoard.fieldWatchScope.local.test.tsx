// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { MobileHomeBoard } from './MobileHomeBoard'
import {
  PERSONA_JOURNEY_BOARD_VARIANTS,
  RESEARCHER_FIELD_WATCH_VARIANT_ID,
  resolveRoleBoardVariant,
} from '@/data/personaConfig'
import { useResearchFieldsStore } from '@/store/useResearchFieldsStore'
import type { FieldWatchRow } from '@/data/researchFieldWatch'
const release = Date.parse('2026-11-01T00:00:00Z')
const start = release - 90 * 86400000
const record: FieldWatchRow = {
  referenceId: 'sample-one',
  algorithmFamily: 'ML-KEM;SLH-DSA',
  lastUpdateDateMs: release - 86400000,
  isDeprecated: true,
  deprecatedAtMs: release - 86400000,
  researchTopics: ['cryptanalysis'],
}
let rows = [record]
let windowStart: number | null = start
vi.mock('@/data/researchFieldWatch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/researchFieldWatch')>()
  return {
    ...actual,
    loadFieldWatchCorpus: () => ({
      rows,
      releaseDateMs: windowStart === null ? null : release,
      windowStartMs: windowStart,
      otherShare: actual.computeOtherFieldShare(rows),
      topicTaggedCount: actual.countTopicTaggedRows(rows),
    }),
  }
})

beforeEach(() => {
  localStorage.setItem('pqc-feature-exec-decision-mode', '0')
  rows = [record]
  windowStart = start
  useResearchFieldsStore.setState({ followedFields: [], followedTopics: [] })
})

function renderFieldWatch() {
  return render(
    <MemoryRouter>
      <MobileHomeBoard
        persona="researcher"
        variantId={RESEARCHER_FIELD_WATCH_VARIANT_ID}
        onOpenRoleSwitch={vi.fn()}
      />
    </MemoryRouter>
  )
}

describe('phone reuses the functional shared field-watch card', () => {
  it('renders the same unique aggregate and interests editor without an authored negative result', () => {
    useResearchFieldsStore.setState({
      followedFields: ['lattice-based', 'hash-based'],
      followedTopics: ['cryptanalysis'],
    })
    renderFieldWatch()
    expect(screen.getByTestId('field-watch-card')).toBeVisible()
    expect(screen.getAllByTestId('field-watch-row')).toHaveLength(3)
    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('1 record')
    expect(screen.getByTestId('field-watch-punchline')).toHaveTextContent(
      'Unique Hub catalogue records marked deprecated: 1.'
    )
    expect(
      screen.queryByText('Nothing in the fields you follow was retracted.')
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Edit your fields/ }))
    expect(screen.getAllByTestId('filter-dropdown')).toHaveLength(2)
    fireEvent.click(screen.getAllByTestId('filter-dropdown')[0])
    fireEvent.click(screen.getByRole('option', { name: 'Lattice-based' }))
    expect(useResearchFieldsStore.getState().followedFields).toEqual(['hash-based'])
    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('1 record')
  })
  it('with no interests offers the real picker without a computed zero result', () => {
    renderFieldWatch()
    expect(screen.getByTestId('field-watch-card')).toBeVisible()
    expect(screen.queryByTestId('corpus-deprecated')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('filter-dropdown')).toHaveLength(2)
  })
  it('an empty corpus does not fabricate a record or scientific retraction finding', () => {
    rows = []
    useResearchFieldsStore.setState({
      followedFields: ['lattice-based'],
      followedTopics: [],
    })
    renderFieldWatch()
    expect(screen.getByTestId('corpus-deprecated')).toHaveTextContent('0 records')
    expect(screen.getByText(/Hub catalogue status is not evidence/)).toBeVisible()
  })
  it('an unavailable reporting window is unassessed rather than a zero-record claim', () => {
    windowStart = null
    useResearchFieldsStore.setState({
      followedFields: ['lattice-based'],
      followedTopics: [],
    })
    renderFieldWatch()
    expect(screen.getByTestId('field-watch-window-unavailable')).toHaveTextContent(
      'Counts are not assessed'
    )
    expect(screen.queryByTestId('corpus-deprecated')).not.toBeInTheDocument()
  })

  it('keeps other researcher card content and the stable variant-selection action', () => {
    const other = PERSONA_JOURNEY_BOARD_VARIANTS.researcher.find(
      (variant) => variant.id !== RESEARCHER_FIELD_WATCH_VARIANT_ID
    )!
    const onSelectVariant = vi.fn()
    render(
      <MemoryRouter>
        <MobileHomeBoard
          persona="researcher"
          variantId={other.id}
          onOpenRoleSwitch={vi.fn()}
          onSelectVariant={onSelectVariant}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(other.board.sideCard.punchline)).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-field-watch-scope')).not.toBeInTheDocument()
    const fieldWatch = PERSONA_JOURNEY_BOARD_VARIANTS.researcher.find(
      (variant) => variant.id === RESEARCHER_FIELD_WATCH_VARIANT_ID
    )!
    fireEvent.click(screen.getByRole('radio', { name: fieldWatch.chipLabel }))
    expect(onSelectVariant).toHaveBeenCalledWith(RESEARCHER_FIELD_WATCH_VARIANT_ID)
  })

  it('preserves the unrelated executive board', () => {
    const board = resolveRoleBoardVariant('executive', 'mandate').board
    render(
      <MemoryRouter>
        <MobileHomeBoard persona="executive" variantId="mandate" onOpenRoleSwitch={vi.fn()} />
      </MemoryRouter>
    )
    expect(screen.getByText(board.sideCard.punchline)).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-field-watch-scope')).not.toBeInTheDocument()
  })
})
