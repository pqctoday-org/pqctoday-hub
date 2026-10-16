// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { useModuleStore } from '@/store/useModuleStore'
import {
  collectionFromRecords,
  collectionSaveRequest,
  readCollection,
} from '@/services/research/libraryCollection'
import type { ExecutiveDocument } from '@/services/storage/types'

// The Library after a release that moved the saved draft from -04 to -05.
vi.mock('@/data/libraryData', () => ({
  REFERENCE_ID_ALIASES: {},
  libraryData: [
    {
      referenceId: 'draft-ietf-tls-mlkem',
      documentTitle: 'ML-KEM for TLS 1.3',
      downloadUrl: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem-05',
      lifecycleLabel: 'Draft',
    },
    {
      referenceId: 'FIPS 203',
      documentTitle: 'ML-KEM',
      lastUpdateDate: '2024-08-13',
      lifecycleLabel: 'Released',
    },
  ],
}))

import { ChangedSinceSaved } from './ChangedSinceSaved'

const seed = (records: Parameters<typeof collectionFromRecords>[1]) => {
  const req = collectionSaveRequest(collectionFromRecords('KEM', records), 'library-collection:1')
  const doc: ExecutiveDocument = { ...req, id: 'c1', createdAt: 1, approvalStatus: 'draft' }
  const s = useModuleStore.getState()
  useModuleStore.setState({ artifacts: { ...s.artifacts, executiveDocuments: [doc] } })
}

const wrap = (placement: 'library' | 'workspace') =>
  render(
    <MemoryRouter>
      <ChangedSinceSaved placement={placement} />
    </MemoryRouter>
  )

describe('ChangedSinceSaved', () => {
  beforeEach(() => {
    const s = useModuleStore.getState()
    useModuleStore.setState({ artifacts: { ...s.artifacts, executiveDocuments: [] } })
  })

  it('after a release bumps a saved draft, the next visit lists it with links', async () => {
    seed([
      {
        referenceId: 'draft-ietf-tls-mlkem',
        documentTitle: 'ML-KEM for TLS 1.3',
        downloadUrl: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem-04',
        lifecycleLabel: 'Draft',
      },
      {
        referenceId: 'FIPS 203',
        documentTitle: 'ML-KEM',
        lastUpdateDate: '2024-08-13',
        lifecycleLabel: 'Released',
      },
    ])
    wrap('library')
    const list = await screen.findByTestId('changed-since-saved-library')
    expect(list).toHaveTextContent('1 record in your collections changed since you saved it')
    expect(list).toHaveTextContent('New revision: draft -04 → draft -05')
    expect(screen.getByRole('link', { name: 'Open record' })).toHaveAttribute(
      'href',
      '/library?ref=draft-ietf-tls-mlkem'
    )
    expect(screen.getByRole('link', { name: 'Revisions' })).toHaveAttribute(
      'href',
      '/revisions?domain=library&entity=draft-ietf-tls-mlkem'
    )

    fireEvent.click(screen.getByLabelText('Mark draft-ietf-tls-mlkem as seen'))
    const doc = useModuleStore.getState().artifacts.executiveDocuments?.[0]
    expect(doc && readCollection(doc)?.entries[0].saved.revision).toBe('draft -05')
    await waitFor(() =>
      expect(screen.queryByTestId('changed-since-saved-library')).not.toBeInTheDocument()
    )
  })

  it('says so in the workspace when nothing changed, and hides on the Library page', async () => {
    seed([
      {
        referenceId: 'FIPS 203',
        documentTitle: 'ML-KEM',
        lastUpdateDate: '2024-08-13',
        lifecycleLabel: 'Released',
      },
    ])
    const { unmount } = wrap('workspace')
    expect(await screen.findByTestId('changed-since-saved-workspace')).toHaveTextContent(
      'Nothing in your collections has changed'
    )
    unmount()
    wrap('library')
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByTestId('changed-since-saved-library')).not.toBeInTheDocument()
  })
})
