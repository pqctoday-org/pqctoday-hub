// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { LibraryCBOMBuilder } from './LibraryCBOMBuilder'
import { eolLabel } from './cbomAdapters'

vi.mock('@/hooks/useAlgorithmTransitionsForAssessment', () => ({
  useAlgorithmTransitionsForAssessment: () => [],
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({ myProducts: [] }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => undefined }))
vi.mock('@/hooks/useLiveCmvpStatus', () => ({
  useLiveCmvpStatus: () => ({ matchById: () => null }),
}))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (s: unknown) => unknown) =>
    selector({ addExecutiveDocument: vi.fn() }),
}))

describe('SBOM → CBOM mode shows end-of-life', () => {
  it('flags openssl 1.1.1w from the payments sample as EoL (2023-09-11)', () => {
    render(<LibraryCBOMBuilder />)
    fireEvent.click(screen.getByRole('button', { name: 'SBOM → CBOM' }))
    expect(screen.getByRole('columnheader', { name: 'EoL' })).toBeInTheDocument()
    const row = screen.getAllByRole('row').find((r) => within(r).queryByText('openssl'))!
    expect(within(row).getByText('EoL (2023-09-11)')).toBeInTheDocument()
  })

  it('labels active, future-dated and unmatched rows without calling them EoL', () => {
    const now = new Date('2026-11-14T00:00:00Z')
    expect(eolLabel({ matched: true, eolDate: null }, now)).toBe('Active')
    expect(eolLabel({ matched: true, eolDate: '2030-04-08' }, now)).toBe(
      'Supported until 2030-04-08'
    )
    expect(eolLabel({ matched: false, eolDate: undefined }, now)).toBe('Unknown')
  })
})
