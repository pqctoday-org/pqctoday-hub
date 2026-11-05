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

beforeEach(() => {
  localStorage.setItem('pqc-feature-exec-decision-mode', '0')
  useResearchFieldsStore.setState({ followedFields: [], followedTopics: [] })
})

describe('phone field-watch capability boundary', () => {
  it.each([false, true])(
    'does not report an authored negative result when followed choices exist: %s',
    (hasSelections) => {
      if (hasSelections)
        useResearchFieldsStore.setState({
          followedFields: ['lattice-based', 'hash-based'],
          followedTopics: ['cryptanalysis'],
        })
      render(
        <MemoryRouter>
          <MobileHomeBoard
            persona="researcher"
            variantId={RESEARCHER_FIELD_WATCH_VARIANT_ID}
            onOpenRoleSwitch={vi.fn()}
          />
        </MemoryRouter>
      )
      expect(screen.getByTestId('mobile-field-watch-scope')).toHaveTextContent(
        'Field-watch counts are not assessed in this phone summary'
      )
      expect(screen.getByText(/This card has not calculated matches/)).toHaveTextContent(
        'algorithm families or research topics'
      )
      expect(
        screen.queryByText('Nothing in the fields you follow was retracted.')
      ).not.toBeInTheDocument()
      expect(screen.queryByTestId('field-watch-punchline')).not.toBeInTheDocument()
      expect(screen.getByText(/This card has not calculated matches/)).toHaveTextContent(
        'Catalogue status is not evidence of a scientific retraction'
      )
    }
  )

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
