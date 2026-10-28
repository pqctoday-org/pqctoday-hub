// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The FIPS 205 parameter-set table must read on a phone: below 640 px each parameter set is a
 * stacked block with its column headings as labels (so the signature size, the NIST category and
 * the note are all visible), from 640 px up it is a table. jsdom does not apply Tailwind, so these
 * assertions pin the markup and classes that produce that layout, not the pixels.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SLHDSAIntroduction } from './SLHDSAIntroduction'

// FIPS 205 Table 2: the six SHA-2 sets and their signature sizes in bytes.
const SIGNATURE_BYTES = new Map([
  ['SHA2-128s', '7,856'],
  ['SHA2-128f', '17,088'],
  ['SHA2-192s', '16,224'],
  ['SHA2-192f', '35,664'],
  ['SHA2-256s', '29,792'],
  ['SHA2-256f', '49,856'],
])
const HEADINGS = ['Param set', 'n', 'h', 'd', 'h/d', 'a', 'k', 'Sig (B)', 'NIST category', 'Note']

const renderIntro = () =>
  render(
    <MemoryRouter>
      <SLHDSAIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )

describe('SLH-DSA Learn tab: parameter-set table on a phone', () => {
  it('has a stacked twin with one block per parameter set, shown only below 640 px', () => {
    renderIntro()
    const stacked = screen.getByTestId('slhdsa-param-sets-stacked')
    expect(stacked).toHaveClass('sm:hidden')
    expect(within(stacked).getAllByRole('listitem')).toHaveLength(6)
    expect(
      within(stacked)
        .getAllByRole('term')
        .slice(0, HEADINGS.length - 1)
        .map((t) => t.textContent)
    ).toEqual(HEADINGS.slice(1))
  })

  it('shows the signature size, NIST category and note of every parameter set in its block', () => {
    renderIntro()
    const items = within(screen.getByTestId('slhdsa-param-sets-stacked')).getAllByRole('listitem')
    expect(items.map((li) => within(li).getByText(/^SHA2-/).textContent)).toEqual([
      ...SIGNATURE_BYTES.keys(),
    ])
    for (const li of items) {
      const block = within(li)
      const name = block.getByText(/^SHA2-/).textContent!
      // the value under "Sig (B)" is the FIPS 205 Table 2 size
      const sigLabel = block.getByText('Sig (B)')
      // eslint-disable-next-line testing-library/no-node-access -- the value sits beside its label
      expect(sigLabel.parentElement).toHaveTextContent(SIGNATURE_BYTES.get(name)!)
      expect(block.getByText('NIST category')).toBeInTheDocument()
      expect(block.getByText('Note')).toBeInTheDocument()
    }
  })

  it('keeps all ten columns in the table from 640 px up, in a wrapper hidden on a phone', () => {
    renderIntro()
    const wrap = screen.getByTestId('slhdsa-param-sets-table')
    expect(wrap).toHaveClass('hidden', 'sm:block')
    const table = within(within(wrap).getByRole('table', { name: 'FIPS 205 parameter sets' }))
    expect(table.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(HEADINGS)
    expect(table.getAllByRole('row')).toHaveLength(7)
  })
})
