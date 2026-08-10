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
import { MemoryRouter } from 'react-router'
import type { ReactElement } from 'react'
import { PersonaBoardView } from './PersonaBoardView'
import {
  PERSONA_JOURNEY_BOARD,
  PERSONA_JOURNEY_BOARD_VARIANTS,
  resolveRoleBoardVariant,
  RESEARCHER_FIELD_WATCH_VARIANT_ID,
} from '@/data/personaConfig'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'

const ALL_PERSONAS = Object.keys(PERSONA_JOURNEY_BOARD) as PersonaId[]

// ctaPrimary/ctaSecondary call useNavigate() (2026-08-01: the buttons used to
// have no click behavior at all) — every render needs a Router ancestor now.
function renderBoard(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('PersonaBoardView', () => {
  it('covers all 6 real personas', () => {
    expect(ALL_PERSONAS).toHaveLength(6)
  })

  it.each(ALL_PERSONAS)('renders the %s board headline from config', (personaId) => {
    renderBoard(<PersonaBoardView personaId={personaId} />)
    // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
    expect(screen.getByText(PERSONA_JOURNEY_BOARD[personaId].headline)).toBeInTheDocument()
  })

  it.each(ALL_PERSONAS)(
    'renders all 3 grid cards for %s, with only the 3rd carrying the highlight',
    (personaId) => {
      renderBoard(<PersonaBoardView personaId={personaId} />)
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
    renderBoard(<PersonaBoardView personaId={personaId} />)
    // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
    const board = PERSONA_JOURNEY_BOARD[personaId]
    expect(screen.getByTestId('capstone-chip').textContent).toBe(board.capstoneChip?.label)
  })

  it('renders NO capstone chip at all for researcher (not an empty one)', () => {
    expect(PERSONA_JOURNEY_BOARD.researcher.capstoneChip).toBeUndefined()
    renderBoard(<PersonaBoardView personaId="researcher" />)
    expect(screen.queryByTestId('capstone-chip')).toBeNull()
  })

  it('renders the default data-driven side card when no override is passed', () => {
    renderBoard(<PersonaBoardView personaId="executive" />)
    expect(screen.getByTestId('default-side-card')).toBeInTheDocument()
    expect(screen.getByText(PERSONA_JOURNEY_BOARD.executive.sideCard.title)).toBeInTheDocument()
  })

  it('replaces the default side card with customSideCard for researcher', () => {
    renderBoard(
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
    renderBoard(
      <PersonaBoardView
        personaId="executive"
        customSideCard={<div data-testid="field-watch-card">Should not render here</div>}
      />
    )
    expect(screen.queryByTestId('field-watch-card')).toBeNull()
    expect(screen.getByTestId('default-side-card')).toBeInTheDocument()
  })

  // 2026-08-01 bug fix: the CTA buttons rendered with zero click behavior at
  // all ("none of the buttons on the page does anything") — every persona
  // needs a real, non-empty destination for both CTAs, and clicking must
  // actually navigate there.
  it.each(ALL_PERSONAS)('%s: both CTAs have a real, non-empty href', (personaId) => {
    // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
    const board = PERSONA_JOURNEY_BOARD[personaId]
    expect(board.ctaPrimaryHref).toMatch(/^\//)
    expect(board.ctaSecondaryHref).toMatch(/^\//)
  })

  it("clicking ctaPrimary navigates to the board's configured ctaPrimaryHref", async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const { useLocation } = await import('react-router')
    const user = userEvent.setup()
    const seenLocations: string[] = []
    function LocationProbe() {
      const loc = useLocation()
      seenLocations.push(loc.pathname + loc.search)
      return null
    }
    render(
      <MemoryRouter initialEntries={['/']}>
        <PersonaBoardView personaId="executive" />
        <LocationProbe />
      </MemoryRouter>
    )
    await user.click(screen.getByText(PERSONA_JOURNEY_BOARD.executive.ctaPrimary))
    expect(seenLocations.at(-1)).toBe(PERSONA_JOURNEY_BOARD.executive.ctaPrimaryHref)
  })

  // 2026-08-01 bug fix: trackChips were plain <li>s with no link at all
  // ("link to learn modules are still not wired"). Each chip is positionally
  // 1:1 with the persona's real essentials module id (drift-guarded in
  // personaConfig.test.ts) and must link to that module's real page.
  it.each(ALL_PERSONAS)('%s: every trackChip links to its real /learn/:moduleId', (personaId) => {
    renderBoard(<PersonaBoardView personaId={personaId} />)
    const essentials = PERSONAS[personaId].essentials
    // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
    const chips = PERSONA_JOURNEY_BOARD[personaId].trackChips
    chips.forEach((chip, i) => {
      const link = screen.getByText(chip).closest('a')
      expect(link, `chip "${chip}" isn't rendered as a link`).not.toBeNull()
      expect(link).toHaveAttribute('href', `/learn/${essentials[i]}`)
    })
  })
})

/**
 * Board options — the three top use cases per role, added 2026-08-02.
 */
describe('PersonaBoardView — board options', () => {
  it.each(ALL_PERSONAS)('%s offers a chip for every one of its options', (personaId) => {
    renderBoard(<PersonaBoardView personaId={personaId} />)
    const chips = screen.getAllByRole('radio')
    expect(chips).toHaveLength(PERSONA_JOURNEY_BOARD_VARIANTS[personaId].length)
    // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
    for (const v of PERSONA_JOURNEY_BOARD_VARIANTS[personaId]) {
      expect(screen.getByText(v.chipLabel)).toBeInTheDocument()
    }
  })

  it.each(ALL_PERSONAS)('%s opens on its order-1 board when no variant is given', (personaId) => {
    renderBoard(<PersonaBoardView personaId={personaId} />)
    // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
    const first = PERSONA_JOURNEY_BOARD_VARIANTS[personaId][0]
    expect(screen.getByText(first.board.headline)).toBeInTheDocument()
    expect(screen.getByTestId(`board-variant-chip-${first.id}`)).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it.each(ALL_PERSONAS)('%s renders the requested variant, not the default', (personaId) => {
    // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
    const variants = PERSONA_JOURNEY_BOARD_VARIANTS[personaId]
    // The LAST option, not a fixed index. At three variants `variants[2]` was
    // the last one; at six it is the middle, so a hardcoded index would have
    // quietly stopped covering the tail of the chip row.
    const last = variants[variants.length - 1]
    renderBoard(<PersonaBoardView personaId={personaId} variantId={last.id} />)
    expect(screen.getByText(last.board.headline)).toBeInTheDocument()
    expect(screen.queryByText(variants[0].board.headline)).toBeNull()
  })

  it('exactly one option is selected at a time', () => {
    renderBoard(<PersonaBoardView personaId="developer" variantId="sizing" />)
    const checked = screen
      .getAllByRole('radio')
      .filter((c) => c.getAttribute('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
  })

  /**
   * The id can arrive from a persisted store or a hand-typed `?variant=`, so
   * a stale or invented value must degrade to the role's own board rather
   * than crash the home page.
   */
  it('falls back to the order-1 board for an unknown variant id', () => {
    renderBoard(<PersonaBoardView personaId="ops" variantId="retired-last-year" />)
    expect(
      screen.getByText(PERSONA_JOURNEY_BOARD_VARIANTS.ops[0].board.headline)
    ).toBeInTheDocument()
  })

  it('reports the picked option to its caller', async () => {
    const picked: string[] = []
    renderBoard(
      <PersonaBoardView personaId="architect" onSelectVariant={(id) => picked.push(id)} />
    )
    screen.getByTestId('board-variant-chip-keystores').click()
    expect(picked).toEqual(['keystores'])
  })

  /**
   * REGRESSION (2026-08-02). LandingView passed the researcher's live
   * field-watch card whenever the persona was researcher, so it replaced the
   * side card on ALL THREE researcher boards — silently discarding the two
   * that carry their own authored side cards (the reproducibility surface and
   * the CRQC consensus). Caught by rendering the boards, not by any test.
   */
  it('the researcher field-watch variant is one of the three real researcher variants', () => {
    const ids = PERSONA_JOURNEY_BOARD_VARIANTS.researcher.map((v) => v.id)
    expect(ids).toContain(RESEARCHER_FIELD_WATCH_VARIANT_ID)
  })

  it('the other two researcher boards carry their own side-card rows', () => {
    for (const v of PERSONA_JOURNEY_BOARD_VARIANTS.researcher) {
      if (v.id === RESEARCHER_FIELD_WATCH_VARIANT_ID) continue
      expect(v.board.sideCard.rows.length).toBeGreaterThan(0)
    }
  })
})

describe('resolveRoleBoardVariant — one fallback rule, shared by both callers', () => {
  it('returns the requested variant when it exists', () => {
    expect(resolveRoleBoardVariant('curious', 'mylife').id).toBe('mylife')
  })

  it('returns the order-1 variant for undefined or unknown ids', () => {
    expect(resolveRoleBoardVariant('curious', undefined).order).toBe(1)
    expect(resolveRoleBoardVariant('curious', 'nope').order).toBe(1)
  })

  it("every role's variants are ordered 1..6, with no gaps or repeats", () => {
    for (const personaId of ALL_PERSONAS) {
      // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
      expect(PERSONA_JOURNEY_BOARD_VARIANTS[personaId].map((v) => v.order)).toEqual([
        1, 2, 3, 4, 5, 6,
      ])
    }
  })

  it('PERSONA_JOURNEY_BOARD stays the order-1 board of each role', () => {
    for (const personaId of ALL_PERSONAS) {
      // eslint-disable-next-line security/detect-object-injection -- personaId is drawn from ALL_PERSONAS itself
      expect(PERSONA_JOURNEY_BOARD[personaId]).toBe(
        PERSONA_JOURNEY_BOARD_VARIANTS[personaId][0].board
      )
    }
  })
})
