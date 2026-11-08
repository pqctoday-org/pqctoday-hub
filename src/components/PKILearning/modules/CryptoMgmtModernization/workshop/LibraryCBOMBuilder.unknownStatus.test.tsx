// SPDX-License-Identifier: AGPL-3.0-only
// A component with no catalogue record has no known validation status. The SBOM
// inventory export must say "unknown" for it (shown as "Unknown"), not "not-validated",
// while a component that does match a catalogue record keeps that record's status.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LibraryCBOMBuilder } from './LibraryCBOMBuilder'
import { RiskAnalysisEngine } from './RiskAnalysisEngine'
import { CRYPTO_LIBRARIES } from '../data/cryptoLibraries'
import type { CbomExportItem } from '../data/workshopTypes'

const publish = vi.fn()
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

const paste = (components: { name: string; version?: string }[]) => {
  render(<LibraryCBOMBuilder onCbomExport={publish} />)
  fireEvent.click(screen.getByRole('button', { name: 'SBOM → CBOM' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Paste components-shaped JSON' }), {
    target: { value: JSON.stringify({ components }) },
  })
}
const lastExport = () => publish.mock.lastCall![0] as CbomExportItem[]

beforeEach(() => publish.mockClear())

describe('SBOM inventory export: components with no catalogue record', () => {
  it('exports "unknown" for both validation statuses and shows "Unknown", not "not validated"', () => {
    paste([{ name: 'SBOM-only row', version: '9' }])
    const [item] = lastExport()
    expect(item.fipsStatus).toBe('unknown')
    expect(item.esvStatus).toBe('unknown')
    expect(item.notes).toMatch(/No posture record/)
    expect(screen.getAllByText('Unknown').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('not validated')).not.toBeInTheDocument()
  })

  it('keeps the catalogue statuses of a component that matches a record', () => {
    const lib = CRYPTO_LIBRARIES.find((l) => l.id === 'openssl-3.5')!
    paste([{ name: 'OpenSSL', version: '3.5.0' }])
    const [item] = lastExport()
    expect(item.fipsStatus).toBe(lib.fipsStatus)
    expect(item.esvStatus).toBe(lib.esvStatus)
    expect(item.fipsStatus).not.toBe('unknown')
  })
})

describe('risk analysis of an exported component with unknown status', () => {
  const unknownItem: CbomExportItem = {
    name: 'SBOM-only row',
    version: '9',
    type: 'library',
    fipsStatus: 'unknown',
    esvStatus: 'unknown',
    pqcSupport: '—',
    posture: 'yellow',
    notes: 'No posture record — add to inventory and research.',
  }

  it('says the statuses are not established instead of reporting a failed validation', () => {
    render(<RiskAnalysisEngine cbomAssets={[unknownItem]} />)
    expect(screen.getByText('FIPS 140-3 status not established')).toBeInTheDocument()
    expect(screen.getByText('SP 800-90B ESV status not established')).toBeInTheDocument()
    expect(screen.queryByText('No FIPS 140-3 validation')).not.toBeInTheDocument()
    expect(screen.queryByText('No SP 800-90B ESV validation')).not.toBeInTheDocument()
  })
})
