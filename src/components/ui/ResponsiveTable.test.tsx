// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- indices into the fixture arrays above */
/**
 * The shared responsive table: below 640 px each row is a stacked block (first cell as heading, each
 * other cell under its column heading) with no minimum width, and from 640 px up it is a real table.
 * jsdom does not apply Tailwind, so these assertions pin the markup and classes that produce that
 * layout, not the pixels.
 */
import type { ComponentProps } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ResponsiveTable } from './ResponsiveTable'

const HEAD = ['Where', 'Document and version', 'Top row']
const ROWS = [
  ['CEM Annex B', 'Table B.3', <a href="https://example.org/a">a link</a>],
  ['Security boxes', 'Version 2, February 2025', 'Column text one'],
  ['Smart cards', 'Version 2, February 2025', 'Column text two'],
]

const renderTable = (props: Partial<ComponentProps<typeof ResponsiveTable>> = {}) =>
  render(<ResponsiveTable caption="Three scenarios" head={HEAD} rows={ROWS} {...props} />)

describe('ResponsiveTable', () => {
  it('shows the stacked list only below 640 px and the table only from 640 px up', () => {
    renderTable()
    const stacked = screen.getByTestId('responsive-table-stacked')
    expect(stacked).toHaveClass('sm:hidden')
    expect(stacked).not.toHaveClass('hidden')
    const tableWrap = screen.getByTestId('responsive-table-table')
    expect(tableWrap).toHaveClass('hidden', 'sm:block')
  })

  it('has no fixed minimum width on the table or anywhere in the markup', () => {
    const { container } = renderTable()
    expect(container.innerHTML).not.toMatch(/min-w-/)
    expect(
      within(screen.getByTestId('responsive-table-table')).getByRole('table').className
    ).not.toMatch(/min-w-/)
  })

  it('stacks each row: the first cell as the heading, then every other cell under its column heading', () => {
    renderTable()
    const stacked = within(screen.getByTestId('responsive-table-stacked'))
    const items = stacked.getAllByRole('listitem')
    expect(items).toHaveLength(ROWS.length)
    ROWS.forEach((row, i) => {
      const item = within(items[i])
      expect(item.getByText(row[0] as string)).toHaveClass('font-bold')
      // One term and one description per remaining column, the term being that column's heading.
      expect(item.getAllByRole('term').map((t) => t.textContent)).toEqual(HEAD.slice(1))
      expect(item.getAllByRole('definition')).toHaveLength(HEAD.length - 1)
    })
    // Every value sits under the heading of its own column.
    const second = within(items[1])
    const terms = second.getAllByRole('term')
    const defs = second.getAllByRole('definition')
    expect(terms[0]).toHaveTextContent('Document and version')
    expect(defs[0]).toHaveTextContent('Version 2, February 2025')
    expect(terms[1]).toHaveTextContent('Top row')
    expect(defs[1]).toHaveTextContent('Column text one')
    // The heading comes before the values in reading order.
    expect(
      second.getByText('Security boxes').compareDocumentPosition(terms[0]) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('keeps a real table from 640 px up, with the same cells and links as the stacked rows', () => {
    renderTable()
    const tableEl = within(screen.getByTestId('responsive-table-table')).getByRole('table')
    const table = within(tableEl)
    expect(tableEl).toHaveAccessibleName('Three scenarios')
    expect(table.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(HEAD)
    expect(table.getAllByRole('row')).toHaveLength(ROWS.length + 1)
    expect(table.getAllByRole('cell')).toHaveLength(ROWS.length * HEAD.length)
    expect(table.getByRole('cell', { name: 'Table B.3' })).toBeInTheDocument()
    const hrefs = (el: HTMLElement) =>
      within(el)
        .getAllByRole('link')
        .map((l) => l.getAttribute('href'))
    expect(hrefs(tableEl)).toEqual(['https://example.org/a'])
    expect(hrefs(screen.getByTestId('responsive-table-stacked'))).toEqual(['https://example.org/a'])
  })

  it('names the stacked list with the caption', () => {
    renderTable()
    expect(screen.getByRole('list', { name: 'Three scenarios' })).toBe(
      screen.getByTestId('responsive-table-stacked')
    )
  })

  it('accepts element headings and uses them as the labels of the stacked values', () => {
    renderTable({ head: ['Where', <span key="d">Document</span>, 'Top row'] })
    const stacked = within(screen.getByTestId('responsive-table-stacked'))
    expect(stacked.getAllByText('Document')).toHaveLength(ROWS.length)
  })

  it('uses a test id prefix and a text size when given', () => {
    renderTable({ testId: 'cc-example', size: 'sm', className: 'text-foreground/90' })
    const stacked = screen.getByTestId('cc-example-stacked')
    expect(stacked).toHaveClass('text-sm', 'text-foreground/90', 'sm:hidden')
    expect(screen.getByTestId('cc-example-table')).toHaveClass('text-foreground/90')
    expect(within(screen.getByTestId('cc-example-table')).getByRole('table')).toHaveClass('text-sm')
  })

  it('defaults to the small text size', () => {
    renderTable()
    expect(screen.getByTestId('responsive-table-stacked')).toHaveClass('text-xs')
  })

  it('can set the first column strong and centre the other columns in the table only', () => {
    renderTable({ strongFirstColumn: true, centerValues: true })
    const table = within(within(screen.getByTestId('responsive-table-table')).getByRole('table'))
    expect(table.getByRole('cell', { name: 'CEM Annex B' })).toHaveClass(
      'font-medium',
      'text-foreground'
    )
    expect(table.getByRole('cell', { name: 'Table B.3' })).toHaveClass('text-center')
    expect(table.getByRole('columnheader', { name: 'Top row' })).toHaveClass('text-center')
    expect(table.getByRole('columnheader', { name: 'Where' })).not.toHaveClass('text-center')
    // The stacked rows are never centred.
    expect(screen.getByTestId('responsive-table-stacked').innerHTML).not.toContain('text-center')
  })

  it('by default leaves the first column plain and the others left-aligned', () => {
    renderTable()
    const table = within(within(screen.getByTestId('responsive-table-table')).getByRole('table'))
    expect(table.getByRole('cell', { name: 'CEM Annex B' })).not.toHaveClass('font-medium')
    expect(table.getByRole('cell', { name: 'Table B.3' })).not.toHaveClass('text-center')
  })

  it('handles a table with a single column', () => {
    render(<ResponsiveTable caption="One column" head={['Only']} rows={[['a'], ['b']]} />)
    const stacked = within(screen.getByTestId('responsive-table-stacked'))
    expect(stacked.getAllByRole('listitem')).toHaveLength(2)
    expect(stacked.queryAllByRole('term')).toHaveLength(0)
  })
})
