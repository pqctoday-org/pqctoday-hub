// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LibraryCBOMBuilder } from './LibraryCBOMBuilder'
import { CRYPTO_LIBRARIES } from '../data/cryptoLibraries'
import { HSM_VENDORS } from '../data/hsmVendors'

const save = vi.fn()
const matchById = vi.fn(() => null)
vi.mock('@/hooks/useAlgorithmTransitionsForAssessment', () => ({
  useAlgorithmTransitionsForAssessment: () => [],
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({ myProducts: [] }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => undefined }))
vi.mock('@/hooks/useLiveCmvpStatus', () => ({
  useLiveCmvpStatus: () => ({ matchById }),
}))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (s: unknown) => unknown) => selector({ addExecutiveDocument: save }),
}))

const savedMarkdown = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  return save.mock.lastCall![0].data as string
}
beforeEach(() => {
  save.mockClear()
  matchById.mockClear()
})

describe('mixed catalogue certificate scope', () => {
  it('labels library status as reported, retains every catalogue row and typed certificate lookup', () => {
    render(<LibraryCBOMBuilder />)
    fireEvent.click(screen.getByRole('button', { name: 'Library posture' }))
    expect(screen.getByRole('columnheader', { name: 'Reported FIPS status' })).toBeInTheDocument()
    expect(
      screen.getByText(/CMVP snapshot links cover FIPS 140-3 records only/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/A missing link does not establish certificate absence or validity/)
    ).toBeInTheDocument()
    const md = savedMarkdown()
    expect(md).toContain('| Component | Version | Reported FIPS status |')
    expect(screen.getAllByRole('row')).toHaveLength(CRYPTO_LIBRARIES.length + 1)
    for (const lib of CRYPTO_LIBRARIES) {
      expect(screen.getAllByText(lib.name, { exact: true }).length).toBeGreaterThan(0)
      if (lib.cmvpCertNumber)
        expect(matchById).toHaveBeenCalledWith(lib.cmvpCertNumber, 'FIPS 140-3')
    }
    expect(screen.getByText(/#3622 .*FIPS 140-2, historical/)).toBeInTheDocument()
  })
  it('keeps the HSM mode and recorded levels without claiming a uniform standard or level', () => {
    render(<LibraryCBOMBuilder />)
    fireEvent.click(screen.getByRole('button', { name: 'HSM inventory' }))
    expect(screen.getByRole('columnheader', { name: 'Reported FIPS level' })).toBeInTheDocument()
    const md = savedMarkdown()
    expect(save.mock.lastCall![0].inputs.mode).toBe('hsm')
    expect(md).toContain(
      '| Vendor | Product | Firmware | Reported FIPS level | Reported FIPS status |'
    )
    for (const hsm of HSM_VENDORS) {
      expect(md).toContain(hsm.product)
      if (hsm.notes) expect(md).toContain(hsm.notes.replace(/\|/g, '\\|'))
      if (hsm.cmvpCertNumber)
        expect(matchById).toHaveBeenCalledWith(hsm.cmvpCertNumber, 'FIPS 140-3')
    }
    expect(screen.getByText(/#3925 .*FIPS 140-2 L3, historical/)).toBeInTheDocument()
  })
})
