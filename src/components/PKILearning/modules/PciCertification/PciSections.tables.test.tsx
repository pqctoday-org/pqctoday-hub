// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: PCI author
/**
 * Every table in the PCI lesson must read on a phone: below 640 px each row is a stacked block with its
 * column headings as labels, from 640 px up it is a table, and nothing keeps a fixed minimum width
 * that would scroll sideways inside a 390 px page. jsdom does not apply Tailwind, so these assertions
 * pin the markup and classes that produce that layout, not the pixels.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import {
  PciOperatingStack,
  PciP2peKif,
  PciPinSecurity,
  PciPqcTruth,
  PciPtsApproval,
  PciV5Changes,
} from './components/sections/PciSections'
import { PCI_PQC_FINDINGS, PCI_STACK, PCI_V5_CHANGES } from './data/pciData'

const renderSection = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('PCI lesson tables on a phone', () => {
  it.each([
    ['PciPtsApproval', <PciPtsApproval key="a" />],
    ['PciV5Changes', <PciV5Changes key="b" />],
    ['PciPqcTruth', <PciPqcTruth key="c" />],
    ['PciOperatingStack', <PciOperatingStack key="d" />],
    ['PciPinSecurity', <PciPinSecurity key="e" />],
    ['PciP2peKif', <PciP2peKif key="f" />],
  ])(
    '%s has no fixed minimum width and no table scrolling inside a narrow box on a phone',
    (_n, ui) => {
      renderSection(ui)
      expect(document.body.innerHTML).not.toMatch(/min-w-\[/)
      // Every table is only displayed from 640 px up, in a wrapper that is hidden below that.
      screen.queryAllByRole('table').forEach((table) => {
        // eslint-disable-next-line testing-library/no-node-access -- the wrapper's classes are what hides the table on a phone
        expect(table.parentElement).toHaveClass('hidden', 'sm:block')
      })
    }
  )

  it('each of the four tables has a stacked twin with one block per row', () => {
    const cases: [React.ReactElement, string, number, number][] = [
      [<PciV5Changes key="a" />, 'pci-v5-changes', PCI_V5_CHANGES.length, 3],
      [<PciPqcTruth key="b" />, 'pci-pqc-findings', PCI_PQC_FINDINGS.length, 3],
      [<PciOperatingStack key="c" />, 'pci-operating-stack', PCI_STACK.length, 6],
      [<PciPinSecurity key="d" />, 'pci-pin-requirements', 6, 2],
    ]
    for (const [ui, id, rowCount, columns] of cases) {
      const { unmount } = renderSection(ui)
      const stacked = within(screen.getByTestId(`${id}-stacked`))
      expect(stacked.getAllByRole('listitem'), id).toHaveLength(rowCount)
      // Every value but the first sits under a column heading.
      expect(stacked.getAllByRole('term'), id).toHaveLength(rowCount * (columns - 1))
      const table = within(within(screen.getByTestId(`${id}-table`)).getByRole('table'))
      expect(table.getAllByRole('columnheader'), id).toHaveLength(columns)
      expect(table.getAllByRole('row'), id).toHaveLength(rowCount + 1)
      expect(screen.getByTestId(`${id}-stacked`), id).toHaveClass('sm:hidden')
      unmount()
    }
  })

  it('the stacked rows carry the same text as the table rows', () => {
    renderSection(<PciOperatingStack />)
    const stacked = within(screen.getByTestId('pci-operating-stack-stacked'))
    const table = within(screen.getByTestId('pci-operating-stack-table'))
    for (const layer of PCI_STACK) {
      expect(stacked.getByText(layer.name)).toBeInTheDocument()
      expect(table.getByText(layer.name)).toBeInTheDocument()
      expect(stacked.getAllByText(layer.whoAssesses).length).toBeGreaterThan(0)
      expect(table.getAllByText(layer.whoAssesses).length).toBeGreaterThan(0)
    }
    // Column headings become the labels, including the one built from the anchor product name.
    expect(stacked.getAllByRole('term').map((t) => t.textContent)).toContain('Evidence')
    expect(stacked.getAllByText(/’s role$/)).toHaveLength(PCI_STACK.length)
  })

  it('keeps the open-question marker on the first cell of a finding in both layouts', () => {
    renderSection(<PciPqcTruth />)
    const open = PCI_PQC_FINDINGS.filter((f) => f.status === 'open').length
    expect(open).toBeGreaterThan(0)
    expect(
      within(screen.getByTestId('pci-pqc-findings-stacked')).getAllByText('open question')
    ).toHaveLength(open)
    expect(
      within(screen.getByTestId('pci-pqc-findings-table')).getAllByText('open question')
    ).toHaveLength(open)
  })

  it('marks a document this module does not use on the first cell of its finding in both layouts', () => {
    renderSection(<PciPqcTruth />)
    const notUsed = PCI_PQC_FINDINGS.filter((f) => (f.status as string) === 'not used').length
    for (const id of ['pci-pqc-findings-stacked', 'pci-pqc-findings-table']) {
      expect(within(screen.getByTestId(id)).queryAllByText('not used'), id).toHaveLength(notUsed)
    }
  })
})
