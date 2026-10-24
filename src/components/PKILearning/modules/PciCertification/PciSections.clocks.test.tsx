// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: PCI author
/**
 * The PCI "scheme clocks" dates table must be readable on a phone: below 640 px each row is a stacked
 * block (date in bold, then the description, then the source on its own line) with no minimum width,
 * and from 640 px up it stays a real table. jsdom does not apply Tailwind, so these assertions pin the
 * markup and classes that produce that layout, not the pixels.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { PciPtsApproval } from './components/sections/PciSections'
import { PCI_SCHEME_CLOCKS } from './data/pciData'

const renderSection = () =>
  render(
    <MemoryRouter>
      <PciPtsApproval />
    </MemoryRouter>
  )

describe('PCI scheme-clocks table on a phone', () => {
  it('has no 520 px (or any fixed) minimum width on the table or anywhere in the section', () => {
    const { container } = renderSection()
    expect(container.innerHTML).not.toContain('min-w-[520px]')
    const table = within(screen.getByTestId('pci-clocks-table')).getByRole('table')
    expect(table.className).not.toMatch(/min-w-/)
  })

  it('shows the stacked list only below 640 px and the table only from 640 px up', () => {
    renderSection()
    const stacked = screen.getByTestId('pci-clocks-stacked')
    expect(stacked).toHaveClass('sm:hidden')
    expect(stacked).not.toHaveClass('hidden')
    const tableWrap = screen.getByTestId('pci-clocks-table')
    expect(tableWrap).toHaveClass('hidden', 'sm:block')
  })

  it('stacks each row as the date in bold, then the description, then the source on its own line', () => {
    renderSection()
    const stacked = within(screen.getByTestId('pci-clocks-stacked'))
    expect(stacked.getAllByRole('listitem')).toHaveLength(PCI_SCHEME_CLOCKS.length)
    const FOLLOWS = Node.DOCUMENT_POSITION_FOLLOWING
    PCI_SCHEME_CLOCKS.forEach((clock) => {
      const date = stacked.getByText(clock.when)
      const event = stacked.getByText(clock.event)
      expect(date).toHaveClass('font-bold')
      // Date, then description, in reading order, each in its own block.
      expect(date.compareDocumentPosition(event) & FOLLOWS).toBeTruthy()
      expect(date.tagName).toBe('P')
      expect(event.tagName).toBe('P')
    })
    // One citation per row, each in a block after (not inside) the description.
    const links = stacked.getAllByRole('link')
    expect(links).toHaveLength(PCI_SCHEME_CLOCKS.length)
    PCI_SCHEME_CLOCKS.forEach((clock) => {
      const event = stacked.getByText(clock.event)
      links.forEach((link) => expect(event).not.toContainElement(link))
    })
    const lastEvent = stacked.getByText(PCI_SCHEME_CLOCKS[PCI_SCHEME_CLOCKS.length - 1].event)
    expect(lastEvent.compareDocumentPosition(links[links.length - 1]) & FOLLOWS).toBeTruthy()
  })

  it('keeps a real table at 640 px and up, with the same text as the stacked list', () => {
    renderSection()
    const tableEl = within(screen.getByTestId('pci-clocks-table')).getByRole('table')
    const table = within(tableEl)
    expect(table.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'When',
      'What',
      'Source',
    ])
    expect(table.getAllByRole('row')).toHaveLength(PCI_SCHEME_CLOCKS.length + 1)
    expect(table.getAllByRole('cell')).toHaveLength(PCI_SCHEME_CLOCKS.length * 3)
    PCI_SCHEME_CLOCKS.forEach((clock) => {
      expect(table.getByRole('cell', { name: clock.when })).toBeInTheDocument()
      expect(table.getByRole('cell', { name: clock.event })).toBeInTheDocument()
    })
    // The same citations, in the same order, in both layouts.
    const linkTexts = (el: HTMLElement) =>
      within(el)
        .getAllByRole('link')
        .map((l) => l.textContent)
    expect(linkTexts(tableEl)).toEqual(linkTexts(screen.getByTestId('pci-clocks-stacked')))
  })
})
