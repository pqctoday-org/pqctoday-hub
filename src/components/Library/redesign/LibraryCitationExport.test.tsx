// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { libraryData, type LibraryItem } from '@/data/libraryData'
import { logLibraryDownload } from '@/utils/analytics'

const downloads: { blob: Blob; name: string }[] = []
vi.mock('@/services/exportBundle', async (orig) => ({
  ...(await orig<typeof import('@/services/exportBundle')>()),
  downloadBlob: (blob: Blob, name: string) => downloads.push({ blob, name }),
}))

vi.mock('@/utils/analytics', async (orig) => ({
  ...(await orig<typeof import('@/utils/analytics')>()),
  logLibraryDownload: vi.fn(),
}))

import { LibraryCitationExport, itemsByReferenceIds } from './LibraryCitationExport'

const two = libraryData.slice(0, 2)

beforeEach(() => {
  downloads.length = 0
  vi.mocked(logLibraryDownload).mockClear()
})

describe('LibraryCitationExport', () => {
  it('exports the current filter as BibTeX and the bookmarks as CSL-JSON', async () => {
    const getItems = vi.fn((scope: 'bookmarked' | 'filtered') =>
      scope === 'filtered' ? two : two.slice(0, 1)
    )
    render(<LibraryCitationExport getItems={getItems} bookmarkCount={1} filteredCount={2} />)
    fireEvent.click(screen.getByTestId('library-cite-trigger'))
    expect(screen.getByTestId('library-cite-menu')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('library-cite-filtered-bib'))
    expect(downloads[0].name).toMatch(/^pqc-library-citations-\d{4}-\d{2}-\d{2}\.bib$/)
    const bib = await downloads[0].blob.text()
    expect(bib.match(/^@misc\{/gm)).toHaveLength(2)

    fireEvent.click(screen.getByTestId('library-cite-trigger'))
    fireEvent.click(screen.getByTestId('library-cite-bookmarked-json'))
    expect(downloads[1].name).toMatch(/^pqc-library-bookmarks-csl-\d{4}-\d{2}-\d{2}\.json$/)
    const csl = JSON.parse(await downloads[1].blob.text())
    expect(csl).toHaveLength(1)
    expect(csl[0].note).toContain(`PQC Today Library record ${two[0].referenceId}`)
  })

  it('logs one library download per export, naming the scope and format', () => {
    render(<LibraryCitationExport getItems={() => two} bookmarkCount={2} filteredCount={2} />)
    fireEvent.click(screen.getByTestId('library-cite-trigger'))
    fireEvent.click(screen.getByTestId('library-cite-filtered-bib'))
    expect(logLibraryDownload).toHaveBeenCalledTimes(1)
    expect(logLibraryDownload).toHaveBeenCalledWith('citations-filtered-bib')
  })

  it('disables a scope with nothing in it', () => {
    render(<LibraryCitationExport getItems={() => []} bookmarkCount={0} filteredCount={3} />)
    fireEvent.click(screen.getByTestId('library-cite-trigger'))
    expect(screen.getByTestId('library-cite-bookmarked-bib')).toBeDisabled()
    expect(screen.getByTestId('library-cite-filtered-bib')).not.toBeDisabled()
  })

  it('resolves bookmarked ids anywhere in the tree, in bookmark order', () => {
    const child: LibraryItem = { ...two[1], referenceId: 'child-ref', children: undefined }
    const tree: LibraryItem[] = [{ ...two[0], children: [child] }]
    expect(
      itemsByReferenceIds(tree, ['child-ref', 'missing', two[0].referenceId]).map(
        (i) => i.referenceId
      )
    ).toEqual(['child-ref', two[0].referenceId])
  })
})
