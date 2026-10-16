// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useModuleStore } from '@/store/useModuleStore'
import { readClaimMatrix } from '@/services/research/claimMatrix'
import {
  addToCollection,
  collectionSaveRequest,
  emptyCollection,
} from '@/services/research/libraryCollection'
import type { ExecutiveDocument } from '@/services/storage/types'

vi.mock('@/data/libraryData', () => ({
  REFERENCE_ID_ALIASES: {},
  libraryData: [{ referenceId: 'FIPS 203', documentTitle: 'ML-KEM', lifecycleLabel: 'Released' }],
}))

import { ClaimMatrixEditor } from './ClaimMatrixEditor'

const matrices = () =>
  (useModuleStore.getState().artifacts.executiveDocuments ?? []).filter(
    (d) => d.type === 'claim-matrix'
  )

describe('ClaimMatrixEditor', () => {
  beforeEach(() => {
    const s = useModuleStore.getState()
    useModuleStore.setState({ artifacts: { ...s.artifacts, executiveDocuments: [] } })
  })

  it('blocks saving a fact without a supporting record, then saves once one is given', async () => {
    render(<ClaimMatrixEditor />)
    fireEvent.click(screen.getByTestId('claim-matrix-add'))
    fireEvent.change(screen.getByLabelText('C1 claim'), {
      target: { value: 'ML-KEM is standardised' },
    })
    // Status: fact.
    fireEvent.click(screen.getByRole('button', { name: /C1 status/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Fact (with source)' }))
    expect(screen.getByTestId('claim-matrix-issues')).toHaveTextContent(
      'C1: a fact needs at least one supporting Library record id'
    )
    expect(screen.getByTestId('claim-matrix-save')).toBeDisabled()

    fireEvent.change(screen.getByLabelText('C1 supporting record ids'), {
      target: { value: 'FIPS 203; NOT-A-RECORD' },
    })
    await waitFor(() =>
      expect(screen.getByTestId('claim-matrix-issues')).toHaveTextContent(
        'C1: NOT-A-RECORD is not a Library record id.'
      )
    )
    expect(screen.getByTestId('claim-matrix-save')).toBeEnabled()
    fireEvent.click(screen.getByTestId('claim-matrix-save'))
    const m = readClaimMatrix(matrices()[0])
    expect(m?.claims[0]).toMatchObject({
      status: 'fact',
      supporting: ['FIPS 203', 'NOT-A-RECORD'],
    })
  })

  it('seeds claims from a collection’s annotations', async () => {
    const c = addToCollection(
      emptyCollection('KEM'),
      { referenceId: 'FIPS 203', documentTitle: 'ML-KEM' },
      'ML-KEM-768 targets category 3'
    )
    const doc: ExecutiveDocument = {
      ...collectionSaveRequest(c, 'library-collection:1'),
      id: 'c1',
      createdAt: 1,
    }
    const s = useModuleStore.getState()
    useModuleStore.setState({ artifacts: { ...s.artifacts, executiveDocuments: [doc] } })
    render(<ClaimMatrixEditor />)
    fireEvent.click(screen.getByRole('button', { name: /Add claims from a collection/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'From KEM' }))
    expect(screen.getByLabelText('C1 claim')).toHaveValue('ML-KEM-768 targets category 3')
    expect(screen.getByLabelText('C1 supporting record ids')).toHaveValue('FIPS 203')
  })
})
