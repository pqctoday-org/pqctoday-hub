// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- indices into the rows read from the table */
/**
 * The stateful vs stateless comparison table must show all three schemes on a phone. Below 640 px each
 * property is a stacked block with the LMS, SLH-DSA and ML-DSA values under their own labels (the
 * ML-DSA column is no longer cut off behind a sideways scroll); from 640 px up it stays one table.
 * jsdom does not apply Tailwind, so these assertions pin the markup and classes that produce that layout.
 */
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import { SLHDSALiveDemo } from './SLHDSALiveDemo'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    initialize: vi.fn(),
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    keys: [],
    log: [],
    registerKey: vi.fn(),
    clearLog: vi.fn(),
  }),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))

const CAPTION = 'Stateful vs Stateless Signature Comparison'

const renderDemo = () =>
  render(
    <MemoryRouter>
      <SLHDSALiveDemo context="slh-dsa" />
    </MemoryRouter>
  )

describe('SLH-DSA comparison table on a phone', () => {
  it('is shown as a table only from 640 px up, in a box that does not scroll sideways', () => {
    renderDemo()
    const table = screen.getByRole('table', { name: CAPTION })
    // eslint-disable-next-line testing-library/no-node-access -- the wrapper's classes are what hides the table on a phone
    expect(table.parentElement).toHaveClass('hidden', 'sm:block')
    expect(table.className).not.toMatch(/min-w-/)
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent)
    ).toEqual(['Property', 'LMS', 'SLH-DSA', 'ML-DSA'])
  })

  it('stacks every property with the ML-DSA value under its own label', () => {
    renderDemo()
    const table = within(screen.getByRole('table', { name: CAPTION }))
    const rows = table.getAllByRole('row').slice(1)
    const list = screen.getByRole('list', { name: CAPTION })
    expect(list).toHaveClass('sm:hidden')
    const stacked = within(list)
    const items = stacked.getAllByRole('listitem')
    expect(items).toHaveLength(rows.length)
    rows.forEach((row, i) => {
      const cells = within(row).getAllByRole('cell')
      const item = within(items[i])
      expect(item.getByText(cells[0].textContent as string)).toBeInTheDocument()
      expect(item.getAllByRole('term').map((t) => t.textContent)).toEqual([
        'LMS',
        'SLH-DSA',
        'ML-DSA',
      ])
      // The three values are the same text as the table cells, in the same order.
      expect(item.getAllByRole('definition').map((d) => d.textContent)).toEqual(
        cells.slice(1).map((c) => c.textContent)
      )
    })
  })

  it('keeps the ML-DSA signature and CNSA 2.0 values reachable in the stacked rows', () => {
    renderDemo()
    const stacked = within(screen.getByRole('list', { name: CAPTION }))
    expect(
      stacked.getByText('ML-DSA-87 only (the CNSA 2.0 table lists no other ML-DSA set)')
    ).toBeInTheDocument()
    expect(stacked.getByText('Lattice')).toBeInTheDocument()
  })
})
