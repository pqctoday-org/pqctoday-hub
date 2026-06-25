// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the DataTable primitive (M8). It consolidates the Compliance /
 * Software / Library tables, so its sorting, pagination, row interaction, and
 * tree expansion are load-bearing for several pages.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { DataTable, type ColumnDef } from './data-table'

interface Row {
  id: string
  name: string
  score: number
  children?: Row[]
}

const DATA: Row[] = [
  { id: '1', name: 'Charlie', score: 30 },
  { id: '2', name: 'Alice', score: 20 },
  { id: '3', name: 'Bob', score: 10 },
]

const COLUMNS: ColumnDef<Row>[] = [
  { id: 'name', header: 'Name', accessorKey: 'name', sortable: true },
  { id: 'score', header: 'Score', accessorKey: 'score', sortable: true },
]

const dataRowNames = () =>
  screen
    .getAllByRole('row')
    .slice(1) // drop the header row
    .map((r) => within(r).getAllByRole('cell')[0]?.textContent)

describe('DataTable', () => {
  it('renders headers and every row', () => {
    render(<DataTable data={DATA} columns={COLUMNS} getRowKey={(r) => r.id} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows the empty message when there is no data', () => {
    render(
      <DataTable data={[]} columns={COLUMNS} getRowKey={(r) => r.id} emptyMessage="Nothing here" />
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('sorts ascending then descending when a sortable header is clicked', () => {
    render(<DataTable data={DATA} columns={COLUMNS} getRowKey={(r) => r.id} />)
    const nameHeader = screen.getByText('Name')

    fireEvent.click(nameHeader)
    expect(dataRowNames()).toEqual(['Alice', 'Bob', 'Charlie'])
    expect(nameHeader.closest('th')).toHaveAttribute('aria-sort', 'ascending')

    fireEvent.click(nameHeader)
    expect(dataRowNames()).toEqual(['Charlie', 'Bob', 'Alice'])
    expect(nameHeader.closest('th')).toHaveAttribute('aria-sort', 'descending')
  })

  it('honours a defaultSort without any interaction', () => {
    render(
      <DataTable
        data={DATA}
        columns={COLUMNS}
        getRowKey={(r) => r.id}
        defaultSort={{ key: 'score', direction: 'asc' }}
      />
    )
    // score asc → Bob(10), Alice(20), Charlie(30)
    expect(dataRowNames()).toEqual(['Bob', 'Alice', 'Charlie'])
  })

  it('uses a custom cell renderer over the accessorKey', () => {
    const columns: ColumnDef<Row>[] = [
      { id: 'name', header: 'Name', cell: (row) => <span>★ {row.name}</span> },
    ]
    render(<DataTable data={DATA} columns={columns} getRowKey={(r) => r.id} />)
    expect(screen.getByText('★ Charlie')).toBeInTheDocument()
  })

  it('fires onRowClick with the clicked row', () => {
    const onRowClick = vi.fn()
    render(
      <DataTable data={DATA} columns={COLUMNS} getRowKey={(r) => r.id} onRowClick={onRowClick} />
    )
    fireEvent.click(screen.getByText('Alice'))
    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alice' }))
  })

  it('paginates and disables prev/next at the boundaries', () => {
    render(<DataTable data={DATA} columns={COLUMNS} getRowKey={(r) => r.id} pageSize={2} />)
    // page 1 of 2: first two rows, Previous disabled
    expect(screen.getByText(/Showing 1 to 2 of 3/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getAllByRole('row')).toHaveLength(1 + 2) // header + 2 rows

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText(/Showing 3 to 3 of 3/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getAllByRole('row')).toHaveLength(1 + 1) // header + last row
  })

  describe('tree mode', () => {
    const TREE: Row[] = [
      { id: 'p', name: 'Parent', score: 0, children: [{ id: 'c', name: 'Child', score: 1 }] },
    ]
    const getChildren = (r: Row) => r.children

    it('renders Expand/Collapse-all controls and hides children until expanded', () => {
      render(
        <DataTable
          data={TREE}
          columns={COLUMNS}
          getRowKey={(r) => r.id}
          getChildren={getChildren}
        />
      )
      expect(screen.getByRole('button', { name: 'Expand All' })).toBeInTheDocument()
      expect(screen.getByText('Parent')).toBeInTheDocument()
      expect(screen.queryByText('Child')).not.toBeInTheDocument()
    })

    it('reveals children after expanding a parent row', () => {
      render(
        <DataTable
          data={TREE}
          columns={COLUMNS}
          getRowKey={(r) => r.id}
          getChildren={getChildren}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Expand' }))
      expect(screen.getByText('Child')).toBeInTheDocument()
    })

    it('defaultExpandAll shows nested rows on mount', () => {
      render(
        <DataTable
          data={TREE}
          columns={COLUMNS}
          getRowKey={(r) => r.id}
          getChildren={getChildren}
          defaultExpandAll
        />
      )
      expect(screen.getByText('Child')).toBeInTheDocument()
    })
  })
})
