// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PQCMigrationPriorityMap } from './PQCMigrationPriorityMap'
import { DEFAULT_ASSETS, DEFAULT_SCORING_WEIGHTS } from '../data/sensitivityConstants'

afterEach(() => vi.restoreAllMocks())
describe('priority-map current inputs', () => {
  it('recomputes after inventory, threat-year and weight changes and exports the displayed assumptions', async () => {
    const blobs: Blob[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return 'blob:sample'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const view = (name: string, year: number, weights = DEFAULT_SCORING_WEIGHTS) => (
      <MemoryRouter>
        <PQCMigrationPriorityMap
          assets={[{ ...DEFAULT_ASSETS[0], name }]}
          selectedMandates={[]}
          crqcYear={year}
          weights={weights}
        />
      </MemoryRouter>
    )
    const { rerender } = render(view('Original asset', 2030))
    fireEvent.click(screen.getByRole('button', { name: 'Export Markdown' }))
    const old = await blobs.at(-1)!.text()
    rerender(
      view('Changed asset', 2045, { sensitivity: 0, retention: 0, compliance: 0, hndlWindow: 100 })
    )
    expect(screen.queryByText('Original asset')).not.toBeInTheDocument()
    expect(screen.getByText('Changed asset')).toBeInTheDocument()
    expect(
      screen.getByText(/Illustrative quantum-threat year assumption: 2045/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Export Markdown' }))
    const current = await blobs.at(-1)!.text()
    expect(current).toContain('Changed asset')
    expect(current).not.toContain('Original asset')
    expect(current).toContain('assumption: 2045')
    expect(current).toContain('confidentiality window 100')
    expect(current).not.toBe(old)
  })
})
