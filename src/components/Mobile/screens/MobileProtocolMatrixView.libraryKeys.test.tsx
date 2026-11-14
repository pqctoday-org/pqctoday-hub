// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'

// A row that lists one dual-licensed product under both libraries, as the data
// once did for wolfTPM: each list entry must still be its own React child.
vi.mock('@/data/pqcProtocolMatrix', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/data/pqcProtocolMatrix')>()
  const template = real.PROTOCOL_MATRIX.find((r) => r.id === 'tpm')!
  const both = { productId: 'wolftpm-pqc', name: 'wolfTPM PQC' }
  return {
    ...real,
    PROTOCOL_MATRIX: [{ ...template, ossLibraries: [both], commercialLibraries: [both] }],
  }
})

import { MobileProtocolMatrixView } from './MobileProtocolMatrixView'

describe('MobileProtocolMatrixView — library chips', () => {
  afterEach(() => vi.restoreAllMocks())

  it('keys each chip by list and product, so a product in both lists raises no duplicate-key warning', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <MemoryRouter initialEntries={['/algorithms?tab=support&protocol=tpm']}>
        <MobileProtocolMatrixView />
      </MemoryRouter>
    )
    const sheet = screen.getByTestId('protocol-matrix-detail-sheet')
    expect(within(sheet).getAllByRole('link', { name: 'wolfTPM PQC' })).toHaveLength(2)
    const duplicateKey = errors.mock.calls.some((c) => String(c[0]).includes('same key'))
    expect(duplicateKey).toBe(false)
  })
})
