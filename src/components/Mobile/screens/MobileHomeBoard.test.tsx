// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileHomeBoard } from './MobileHomeBoard'
import { PERSONA_JOURNEY_BOARD_VARIANTS, resolveRoleBoardVariant } from '@/data/personaConfig'

function renderBoard(props: Partial<React.ComponentProps<typeof MobileHomeBoard>> = {}) {
  return render(
    <MemoryRouter>
      <MobileHomeBoard persona="executive" onOpenRoleSwitch={vi.fn()} {...props} />
    </MemoryRouter>
  )
}

describe('MobileHomeBoard — persona selected', () => {
  it('renders all six real scenario chips for the persona, order-1 active by default', () => {
    renderBoard({ persona: 'executive' })
    const variants = PERSONA_JOURNEY_BOARD_VARIANTS.executive
    expect(variants).toHaveLength(6)
    for (const v of variants) {
      expect(screen.getByRole('radio', { name: v.chipLabel })).toBeInTheDocument()
    }
    const active = resolveRoleBoardVariant('executive', undefined)
    expect(screen.getByRole('radio', { name: active.chipLabel })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('renders the real headline/sub/CTAs for the active variant, never a literal', () => {
    renderBoard({ persona: 'executive', variantId: 'mandate' })
    const board = resolveRoleBoardVariant('executive', 'mandate').board
    expect(screen.getByText(board.headline)).toBeInTheDocument()
    expect(screen.getByText(board.sub)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: board.ctaPrimary })).toBeInTheDocument()
  })

  it('picking a different chip calls onSelectVariant with the real variant id', () => {
    const onSelectVariant = vi.fn()
    renderBoard({ persona: 'executive', variantId: 'mandate', onSelectVariant })
    const variants = PERSONA_JOURNEY_BOARD_VARIANTS.executive
    const other = variants.find((v) => v.id !== 'mandate')!
    fireEvent.click(screen.getByRole('radio', { name: other.chipLabel }))
    expect(onSelectVariant).toHaveBeenCalledWith(other.id)
  })

  it('the side card renders real rows, punchline and the correct provenance label', () => {
    renderBoard({ persona: 'executive', variantId: 'mandate' })
    const board = resolveRoleBoardVariant('executive', 'mandate').board
    for (const row of board.sideCard.rows) {
      expect(screen.getByText(row.label)).toBeInTheDocument()
      expect(screen.getByText(row.value)).toBeInTheDocument()
    }
    expect(screen.getByText(board.sideCard.punchline)).toBeInTheDocument()
  })

  it('supporting cards are collapsed by default and expand on tap', () => {
    renderBoard({ persona: 'executive', variantId: 'mandate' })
    const board = resolveRoleBoardVariant('executive', 'mandate').board
    expect(screen.queryByText(board.gridCards[0].title)).not.toBeInTheDocument()
    expect(screen.getByText(`Show ${board.gridCards.length}`)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(board.gridTitle) }))
    expect(screen.getByText(board.gridCards[0].title)).toBeInTheDocument()
    expect(screen.getByText('Hide')).toBeInTheDocument()
  })

  it('the track strip renders real chips, each linking to a real essentials module', () => {
    renderBoard({ persona: 'executive', variantId: 'mandate' })
    const board = resolveRoleBoardVariant('executive', 'mandate').board
    for (const chip of board.trackChips) {
      expect(screen.getByText(chip)).toBeInTheDocument()
    }
  })

  it('the "Change" button calls onOpenRoleSwitch', () => {
    const onOpenRoleSwitch = vi.fn()
    renderBoard({ persona: 'executive', onOpenRoleSwitch })
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    expect(onOpenRoleSwitch).toHaveBeenCalledTimes(1)
  })

  it('works for every persona, not just executive', () => {
    for (const persona of ['developer', 'architect', 'researcher', 'ops', 'curious'] as const) {
      const { unmount } = renderBoard({ persona })
      const board = resolveRoleBoardVariant(persona, undefined).board
      expect(screen.getByText(board.headline)).toBeInTheDocument()
      unmount()
    }
  })
})

describe('MobileHomeBoard — no persona (skipped personalization)', () => {
  it('shows the minimal skipped fallback, not a persona board', () => {
    renderBoard({ persona: null })
    expect(
      screen.getByText(/Post-quantum cryptography, explained and provable/)
    ).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('"Pick a role" calls onOpenRoleSwitch', () => {
    const onOpenRoleSwitch = vi.fn()
    renderBoard({ persona: null, onOpenRoleSwitch })
    fireEvent.click(screen.getByRole('button', { name: 'Pick a role' }))
    expect(onOpenRoleSwitch).toHaveBeenCalledTimes(1)
  })
})
