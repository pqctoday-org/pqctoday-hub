// SPDX-License-Identifier: GPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { useModuleStore } from '@/store/useModuleStore'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import type { BundleFile } from '@/services/exportBundle'

const zipped = vi.hoisted(() => ({ files: [] as BundleFile[], downloads: [] as string[] }))

vi.mock('@/data/libraryData', () => ({
  REFERENCE_ID_ALIASES: {},
  libraryData: [
    {
      referenceId: 'FIPS 203',
      documentTitle: 'ML-KEM',
      downloadUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
      initialPublicationDate: '2024-08-13',
      lastUpdateDate: '2024-08-13',
      authorsOrOrganization: 'NIST',
      documentType: 'Standard',
      documentStatus: 'Final',
      lifecycleLabel: 'Released',
    },
  ],
}))

vi.mock('@/services/export/pdfExport', () => ({
  buildArtifactPdf: () => ({ output: () => new Blob(['%PDF']) }),
}))

vi.mock('@/services/exportBundle', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/services/exportBundle')>()
  return {
    ...orig,
    buildZipBundle: async (files: BundleFile[]) => {
      zipped.files = files
      return new Blob(['zip'])
    },
    downloadBlob: (_b: Blob, name: string) => {
      zipped.downloads.push(name)
    },
  }
})

import { EvidenceBundlePanel } from './EvidenceBundlePanel'

const renderPanel = (placement: 'library' | 'command-center') =>
  render(
    <MemoryRouter>
      <EvidenceBundlePanel placement={placement} />
    </MemoryRouter>
  )

describe('EvidenceBundlePanel', () => {
  beforeEach(() => {
    zipped.files = []
    zipped.downloads = []
    const s = useModuleStore.getState()
    useModuleStore.setState({ artifacts: { ...s.artifacts, executiveDocuments: [] } })
    useBookmarkStore.setState({ libraryBookmarks: [] })
  })

  it('downloads a bundle with nothing saved and links each gap to its tool', async () => {
    renderPanel('command-center')
    expect(screen.getByTestId('evidence-bundle-count')).toHaveTextContent(
      '0 bookmarked records · 0 saved run records'
    )
    expect(screen.getByRole('link', { name: 'Bookmark Library records' })).toHaveAttribute(
      'href',
      '/library'
    )
    expect(screen.getByRole('link', { name: 'Save a run from SP 800-90A DRBG' })).toHaveAttribute(
      'href',
      '/playground/drbg-demo'
    )

    fireEvent.click(screen.getByTestId('evidence-bundle-download'))
    await waitFor(() => expect(zipped.downloads).toHaveLength(1))
    expect(zipped.downloads[0]).toMatch(/^evidence-bundle-\d{4}-\d{2}-\d{2}\.zip$/)
    const md = zipped.files.find((f) => f.path === 'evidence-bundle/bundle.md')?.content as string
    expect(md).toContain('## What is missing')
    expect(zipped.files.map((f) => f.path)).toContain('evidence-bundle/bundle.pdf')
  })

  it('uses the typed title and author and includes the bookmarked records', async () => {
    useBookmarkStore.setState({ libraryBookmarks: ['FIPS 203', 'GONE-1'] })
    renderPanel('library')
    fireEvent.change(screen.getByLabelText('Title (optional)'), {
      target: { value: 'KEM sources' },
    })
    fireEvent.change(screen.getByLabelText('Author (optional)'), {
      target: { value: 'A. Researcher' },
    })
    fireEvent.click(screen.getByTestId('library-evidence-bundle-download'))
    await waitFor(() => expect(zipped.downloads).toHaveLength(1))
    const md = zipped.files.find((f) => f.path === 'evidence-bundle/bundle.md')?.content as string
    expect(md).toContain('# KEM sources')
    expect(md).toContain('- Author: A. Researcher')
    expect(md).toContain('| FIPS 203 | ML-KEM |')
    expect(md).toContain('GONE-1')
    const bib = zipped.files.find((f) => f.path.endsWith('.bib'))?.content as string
    expect(bib.match(/^@misc\{/gm)).toHaveLength(1)
  })
})
