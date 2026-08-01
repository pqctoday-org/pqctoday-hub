// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the shared, persona-agnostic PersonaBoardView skeleton. Renders
 * each of the 6 real PERSONA_JOURNEY_BOARD entries and asserts the shared
 * rendering contract holds for all of them: headline renders, all 3 grid
 * cards render with only the 3rd highlighted, the capstone chip is present
 * for the 5 personas that define one and genuinely absent (not an empty
 * chip) for researcher, and researcher's customSideCard override slot fully
 * replaces the data-driven side card.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersonaBoardView } from './PersonaBoardView'
import { PERSONA_JOURNEY_BOARD } from '@/data/personaConfig'
import type { PersonaId } from '@/data/learningPersonas'

const ALL_PERSONAS = Object.keys(PERSONA_JOURNEY_BOARD) as PersonaId[]

describe('PersonaBoardView', () => {
  it('covers all 6 real personas', () => {
    expect(ALL_PERSONAS).toHaveLength(6)
  })

  it.each(ALL_PERSONAS)('renders the %s board headline from config', (personaId) => {
    render(<PersonaBoardView personaId={personaId} />)
    // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
    expect(screen.getByText(PERSONA_JOURNEY_BOARD[personaId].headline)).toBeInTheDocument()
  })

  it.each(ALL_PERSONAS)(
    'renders all 3 grid cards for %s, with only the 3rd carrying the highlight',
    (personaId) => {
      render(<PersonaBoardView personaId={personaId} />)
      // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
      const board = PERSONA_JOURNEY_BOARD[personaId]

      board.gridCards.forEach((card) => {
        expect(screen.getByText(card.title)).toBeInTheDocument()
      })

      const card0 = screen.getByTestId('grid-card-0')
      const card1 = screen.getByTestId('grid-card-1')
      const card2 = screen.getByTestId('grid-card-2')

      expect(card0.getAttribute('data-highlighted')).toBe('false')
      expect(card1.getAttribute('data-highlighted')).toBe('false')
      expect(card2.getAttribute('data-highlighted')).toBe('true')

      // The highlight must show up as an actual visual treatment too, not
      // just the data attribute.
      expect(card2.className).toMatch(/border-accent/)
      expect(card0.className).not.toMatch(/border-accent\/50/)
      expect(card1.className).not.toMatch(/border-accent\/50/)
    }
  )

  it('has a capstone chip for exactly the 5 personas that define one', () => {
    const personasWithCapstone = ALL_PERSONAS.filter(
      // eslint-disable-next-line security/detect-object-injection -- id is drawn from ALL_PERSONAS itself
      (id) => PERSONA_JOURNEY_BOARD[id].capstoneChip !== undefined
    )
    expect(personasWithCapstone).toHaveLength(5)
    expect(personasWithCapstone).not.toContain('researcher')
  })

  it.each(
    ALL_PERSONAS.filter(
      // eslint-disable-next-line security/detect-object-injection -- id is drawn from ALL_PERSONAS itself
      (id) => PERSONA_JOURNEY_BOARD[id].capstoneChip !== undefined
    )
  )('renders the capstone chip with its configured label for %s', (personaId) => {
    render(<PersonaBoardView personaId={personaId} />)
    // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
    const board = PERSONA_JOURNEY_BOARD[personaId]
    expect(screen.getByTestId('capstone-chip').textContent).toBe(board.capstoneChip?.label)
  })

  it('renders NO capstone chip at all for researcher (not an empty one)', () => {
    expect(PERSONA_JOURNEY_BOARD.researcher.capstoneChip).toBeUndefined()
    render(<PersonaBoardView personaId="researcher" />)
    expect(screen.queryByTestId('capstone-chip')).toBeNull()
  })

  it('renders the default data-driven side card when no override is passed', () => {
    render(<PersonaBoardView personaId="executive" />)
    expect(screen.getByTestId('default-side-card')).toBeInTheDocument()
    expect(screen.getByText(PERSONA_JOURNEY_BOARD.executive.sideCard.title)).toBeInTheDocument()
  })

  it('replaces the default side card with customSideCard for researcher', () => {
    render(
      <PersonaBoardView
        personaId="researcher"
        customSideCard={<div data-testid="field-watch-card">Lattice / ML-KEM: 6 revisions</div>}
      />
    )
    expect(screen.getByTestId('field-watch-card')).toBeInTheDocument()
    expect(screen.queryByTestId('default-side-card')).toBeNull()
    // The static config's stub side-card title must not leak through once
    // the live field-watch override is supplied.
    expect(screen.queryByText(PERSONA_JOURNEY_BOARD.researcher.sideCard.title)).toBeNull()
  })

  it('ignores customSideCard for every persona other than researcher', () => {
    render(
      <PersonaBoardView
        personaId="executive"
        customSideCard={<div data-testid="field-watch-card">Should not render here</div>}
      />
    )
    expect(screen.queryByTestId('field-watch-card')).toBeNull()
    expect(screen.getByTestId('default-side-card')).toBeInTheDocument()
  })
})
