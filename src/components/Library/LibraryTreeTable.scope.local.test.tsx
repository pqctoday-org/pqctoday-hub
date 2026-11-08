// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LibraryTreeTable } from './LibraryTreeTable'
import { libraryData, type LibraryItem } from '@/data/libraryData'

function hierarchy() {
  const grandchild: LibraryItem = {
    ...libraryData[0],
    referenceId: 'sample-grandchild',
    documentTitle: 'Sample grandchild',
    children: undefined,
  }
  const child: LibraryItem = {
    ...libraryData[0],
    referenceId: 'sample-child',
    documentTitle: 'Sample child',
    children: [grandchild],
  }
  const parent: LibraryItem = {
    ...libraryData[0],
    referenceId: 'sample-parent',
    documentTitle: 'Sample parent',
    children: [child],
  }
  return { parent, child, grandchild }
}
const visibleIds = () =>
  screen
    .getAllByRole('row')
    .map((row) => row.getAttribute('data-deeplink-id'))
    .filter(Boolean)

describe('Library selected-result tree scope', () => {
  it('does not expose a filtered-out descendant when only its parent is selected, including expand-all', () => {
    const { parent } = hierarchy()
    render(<LibraryTreeTable data={[parent]} onOpen={vi.fn()} defaultExpandAll />)
    expect(visibleIds()).toEqual(['sample-parent'])
    expect(screen.queryByRole('button', { name: 'Collapse Sample parent' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Expand Sample parent' })).not.toBeInTheDocument()
  })

  it.each(['child', 'grandchild'] as const)(
    'keeps a selected %s as a root result when ancestors are not selected',
    (selected) => {
      const nodes = hierarchy()
      render(
        <LibraryTreeTable
          data={[selected === 'child' ? nodes.child : nodes.grandchild]}
          onOpen={vi.fn()}
        />
      )
      expect(visibleIds()).toEqual([`sample-${selected}`])
    }
  )

  it('preserves selected hierarchy relationships and cycle protection without injecting omitted rows', () => {
    const { parent, child } = hierarchy()
    const open = vi.fn()
    render(<LibraryTreeTable data={[parent, child]} onOpen={open} />)
    fireEvent.click(screen.getByRole('button', { name: 'Expand Sample parent' }))
    expect(visibleIds()).toEqual(['sample-parent', 'sample-child', 'sample-child'])
    expect(new Set(visibleIds())).toEqual(new Set(['sample-parent', 'sample-child']))
    expect(screen.queryByRole('button', { name: 'Expand Sample child' })).not.toBeInTheDocument()
    expect(open).not.toHaveBeenCalled()
    const { children: parentChildren } = parent
    const { children: childChildren } = child
    expect(parentChildren).toEqual([child])
    expect(childChildren?.[0].referenceId).toBe('sample-grandchild')
  })

  it('removes previously expanded rows immediately when their selection scope changes', () => {
    const { parent, child } = hierarchy()
    const open = vi.fn()
    const view = render(<LibraryTreeTable data={[parent, child]} onOpen={open} defaultExpandAll />)
    expect(new Set(visibleIds())).toEqual(new Set(['sample-parent', 'sample-child']))
    view.rerender(<LibraryTreeTable data={[parent]} onOpen={open} defaultExpandAll />)
    expect(visibleIds()).toEqual(['sample-parent'])
  })

  it('keeps cycle traversal bounded within selected IDs', () => {
    const { parent, child } = hierarchy()
    Object.assign(child, { children: [parent] })
    render(<LibraryTreeTable data={[parent, child]} onOpen={vi.fn()} defaultExpandAll />)
    expect(visibleIds()).toEqual(['sample-parent', 'sample-child', 'sample-child', 'sample-parent'])
  })
})
