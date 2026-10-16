// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { useModuleStore } from '@/store/useModuleStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { readCollection } from '@/services/research/libraryCollection'
import type { ExecutiveDocument } from '@/services/storage/types'

vi.mock('@/data/libraryData', () => ({
  libraryData: [
    {
      referenceId: 'FIPS 203',
      documentTitle: 'ML-KEM',
      lastUpdateDate: '2024-08-13',
      lifecycleLabel: 'Released',
    },
  ],
}))

import { AddToCollection } from './AddToCollection'
import { BookmarksToCollection } from './BookmarksToCollection'
import { CollectionsList } from './CollectionsList'

const record = {
  referenceId: 'FIPS 203',
  documentTitle: 'ML-KEM',
  lastUpdateDate: '2024-08-13',
  lifecycleLabel: 'Released',
}

const docs = (): ExecutiveDocument[] => useModuleStore.getState().artifacts.executiveDocuments ?? []
const collections = () => docs().filter((d) => d.type === 'library-collection')

const wrap = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Library collections UI', () => {
  beforeEach(() => {
    const s = useModuleStore.getState()
    useModuleStore.setState({ artifacts: { ...s.artifacts, executiveDocuments: [] } })
    useBookmarkStore.setState({ libraryBookmarks: [] })
  })

  it('creates a new collection from the drawer with an annotation', () => {
    wrap(<AddToCollection record={record} />)
    fireEvent.click(screen.getByTestId('add-to-collection-open'))
    expect(screen.getByTestId('add-to-collection-save')).toBeDisabled()
    fireEvent.change(screen.getByTestId('add-to-collection-name'), {
      target: { value: 'KEM sources' },
    })
    fireEvent.change(screen.getByTestId('add-to-collection-annotation'), {
      target: { value: 'the standard' },
    })
    fireEvent.click(screen.getByTestId('add-to-collection-save'))
    expect(collections()).toHaveLength(1)
    const c = readCollection(collections()[0])
    expect(c?.name).toBe('KEM sources')
    expect(c?.entries[0]).toMatchObject({
      referenceId: 'FIPS 203',
      annotation: 'the standard',
      saved: { revision: '2024-08-13', lifecycle: 'Released' },
    })
    expect(screen.getByTestId('add-to-collection-member')).toHaveTextContent('KEM sources')
  })

  it('edits the annotation in an existing collection without a duplicate', () => {
    wrap(<AddToCollection record={record} />)
    fireEvent.click(screen.getByTestId('add-to-collection-open'))
    fireEvent.change(screen.getByTestId('add-to-collection-name'), { target: { value: 'A' } })
    fireEvent.click(screen.getByTestId('add-to-collection-save'))
    fireEvent.change(screen.getByTestId('add-to-collection-annotation'), {
      target: { value: 'changed' },
    })
    fireEvent.click(screen.getByTestId('add-to-collection-save'))
    expect(collections()).toHaveLength(1)
    const c = readCollection(collections()[0])
    expect(c?.entries).toHaveLength(1)
    expect(c?.entries[0].annotation).toBe('changed')
    expect(collections()[0].revisions?.length).toBe(1)
  })

  it('saves bookmarks as a collection and leaves out ids no longer in the Library', async () => {
    useBookmarkStore.setState({ libraryBookmarks: ['FIPS 203', 'GONE-1'] })
    wrap(<BookmarksToCollection />)
    fireEvent.change(screen.getByTestId('bookmarks-to-collection-name'), {
      target: { value: 'From bookmarks' },
    })
    fireEvent.click(screen.getByTestId('bookmarks-to-collection-save'))
    await waitFor(() => expect(collections()).toHaveLength(1))
    const c = readCollection(collections()[0])
    expect(c?.name).toBe('From bookmarks')
    expect(c?.entries.map((e) => e.referenceId)).toEqual(['FIPS 203'])
    expect(screen.getByRole('status')).toHaveTextContent('1 bookmark is no longer in the Library')
  })

  it('lists collections and removes a record', () => {
    wrap(
      <>
        <AddToCollection record={record} />
        <CollectionsList />
      </>
    )
    expect(screen.getByTestId('collections-empty')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('add-to-collection-open'))
    fireEvent.change(screen.getByTestId('add-to-collection-name'), { target: { value: 'A' } })
    fireEvent.click(screen.getByTestId('add-to-collection-save'))
    expect(screen.getByTestId('collections-list')).toHaveTextContent('A1 record')
    fireEvent.click(screen.getByLabelText('Remove FIPS 203 from A'))
    expect(readCollection(collections()[0])?.entries).toHaveLength(0)
  })
})
