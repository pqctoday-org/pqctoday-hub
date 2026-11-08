// SPDX-License-Identifier: AGPL-3.0-only
/** A hash-based KAT tile shows its strength note as a category, not as a strength claim. */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { KATView } from './KATView'
import { KDF_TILES as KAT_TILES } from './katTileConfig'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: false,
    moduleRef: { current: null },
    hSessionRef: { current: null },
    slotRef: { current: null },
    initialize: vi.fn(),
    addStepLog: vi.fn(),
    log: [],
    clearLog: vi.fn(),
    keys: [],
    removeKey: vi.fn(),
    clearKeys: vi.fn(),
  }),
}))

describe('KAT tiles: strength note', () => {
  const withNote = KAT_TILES.filter((t) => t.strengthNote)

  it('some tiles carry a strength note (the test below is not vacuous)', () => {
    expect(withNote.length).toBeGreaterThan(0)
  })

  it('labels a tile with a note as a hash category and prints the note under its name', () => {
    render(<KATView katParam={null} />)
    const tile = withNote[0]
    const heading = screen.getByRole('heading', { name: tile.name })
    const card = heading.closest('div')!.parentElement!
    const badge = card.querySelector('span[title]') as HTMLElement
    expect(badge.textContent).toMatch(/hash category$/)
    expect(badge).toHaveAttribute('title', tile.strengthNote)
    expect(card.querySelector('[data-testid="kat-strength-note"]')).toHaveTextContent(
      tile.strengthNote!
    )
  })

  it('does not add the category suffix to a tile without a note', () => {
    render(<KATView katParam={null} />)
    const plain = KAT_TILES.find((t) => !t.strengthNote)
    if (!plain) return
    const heading = screen.getByRole('heading', { name: plain.name })
    const card = heading.closest('div')!.parentElement!
    expect(card.textContent).not.toMatch(/hash category/)
    expect(card.querySelector('[data-testid="kat-strength-note"]')).toBeNull()
  })
})
