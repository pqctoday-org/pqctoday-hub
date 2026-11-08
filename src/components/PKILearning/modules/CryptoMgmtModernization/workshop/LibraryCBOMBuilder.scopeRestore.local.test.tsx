// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LibraryCBOMBuilder } from './LibraryCBOMBuilder'
import { downloadCbomJson } from '@/services/cbom/cycloneDx'
import type { AssessmentTransition } from '@/hooks/useAlgorithmTransitionsForAssessment'

let transitions: AssessmentTransition[] = []
let savedInputs: { mode?: string; [key: string]: unknown } | undefined
const save = vi.fn()
vi.mock('@/hooks/useAlgorithmTransitionsForAssessment', () => ({
  useAlgorithmTransitionsForAssessment: () => transitions,
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({ myProducts: [] }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => savedInputs }))
vi.mock('@/hooks/useLiveCmvpStatus', () => ({
  useLiveCmvpStatus: () => ({ matchById: () => null }),
}))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (s: unknown) => unknown) => selector({ addExecutiveDocument: save }),
}))
vi.mock('@/services/cbom/cycloneDx', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/cbom/cycloneDx')>()),
  downloadCbomJson: vi.fn(),
}))
function row(storedKey: string, classical: string, keySize: string): AssessmentTransition {
  return {
    storedKey,
    classical,
    keySize,
    pqc: 'Sample replacement',
    function: 'Encryption/KEM',
    deprecationDate: '',
    standardizationDate: '',
    region: 'Sample',
    status: 'Sample',
  }
}
const three = () => [
  row('RSA-2048', 'RSA', '2048-bit'),
  row('ECDH P-256', 'ECDH (P-256)', '256-bit'),
  row('AES-256', 'AES-256', '256-bit'),
]
function download() {
  fireEvent.click(screen.getByRole('button', { name: 'Download CycloneDX 1.7' }))
  return JSON.parse(vi.mocked(downloadCbomJson).mock.lastCall![0])
}
const modeOf = (doc: ReturnType<typeof JSON.parse>) =>
  doc.metadata.properties.find((p: { name: string }) => p.name === 'pqctoday:mode').value
beforeEach(() => {
  transitions = []
  savedInputs = undefined
  save.mockClear()
  vi.mocked(downloadCbomJson).mockClear()
})

describe('CBOM explicitly selected scope restoration', () => {
  it('restores an empty saved assessment scope, identifies it and saves an empty summary', () => {
    savedInputs = { mode: 'assessment', assessmentSeed: ['RSA-2048'] }
    render(<LibraryCBOMBuilder />)
    expect(screen.getByRole('button', { name: 'From your assessment' })).toBeInTheDocument()
    expect(
      screen.getByText(/No assessment algorithm or selected product records/)
    ).toBeInTheDocument()
    const doc = download()
    expect(modeOf(doc)).toBe('assessment')
    expect(doc.components).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(save.mock.lastCall?.[0].inputs).toMatchObject({
      mode: 'assessment',
      assessmentSeed: [],
      reportSummary: {
        mode: 'assessment',
        componentCount: 0,
        cryptoAssetCount: 0,
        quantumUnassessedCount: 0,
        algorithms: [],
      },
    })
  })

  it('keeps an explicitly chosen assessment view through clearing, save and JSON-remount without old algorithms', () => {
    transitions = three()
    savedInputs = { mode: 'libs' }
    const view = render(<LibraryCBOMBuilder />)
    expect(modeOf(download())).toBe('libs')
    fireEvent.click(screen.getByRole('button', { name: 'From your assessment' }))
    expect(download().components).toHaveLength(3)
    transitions = []
    view.rerender(<LibraryCBOMBuilder />)
    expect(screen.getByRole('button', { name: 'From your assessment' })).toBeInTheDocument()
    expect(download().components).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    savedInputs = JSON.parse(JSON.stringify(save.mock.lastCall![0].inputs))
    view.unmount()
    render(<LibraryCBOMBuilder />)
    const restored = download()
    expect(modeOf(restored)).toBe('assessment')
    expect(restored.components).toEqual([])
  })

  it.each([
    ['libs', false],
    ['libs', true],
    ['sbom', false],
    ['sbom', true],
  ] as const)('preserves explicit %s view with populated assessment=%s', (mode, populated) => {
    transitions = populated ? three() : []
    savedInputs = { mode }
    render(<LibraryCBOMBuilder />)
    const doc = download()
    expect(modeOf(doc)).toBe(mode)
    expect(doc.components.length).toBeGreaterThan(0)
    expect(doc.components.some((c: { type: string }) => c.type === 'library')).toBe(true)
  })

  it('keeps the existing fresh empty default without offering an unselected assessment view', () => {
    render(<LibraryCBOMBuilder />)
    expect(screen.queryByRole('button', { name: 'From your assessment' })).not.toBeInTheDocument()
    expect(modeOf(download())).toBe('libs')
  })
})
