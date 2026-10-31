// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LibraryCBOMBuilder } from './LibraryCBOMBuilder'
import { downloadCbomJson } from '@/services/cbom/cycloneDx'
import type { AssessmentTransition } from '@/hooks/useAlgorithmTransitionsForAssessment'

let mockTransitions: AssessmentTransition[] = []
const save = vi.fn()
vi.mock('@/hooks/useAlgorithmTransitionsForAssessment', () => ({
  useAlgorithmTransitionsForAssessment: () => mockTransitions,
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({ myProducts: [] }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => undefined }))
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
    pqc: 'ML-KEM-512',
    function: 'Encryption/KEM',
    deprecationDate: '',
    standardizationDate: '',
    region: 'NIST',
    status: 'FIPS 203',
  }
}
const downloaded = () => JSON.parse(vi.mocked(downloadCbomJson).mock.calls.at(-1)![0])

beforeEach(() => {
  mockTransitions = [
    row('RSA-2048', 'RSA', '2048-bit'),
    row('ECDH P-256', 'ECDH (P-256)', '256-bit'),
    row('AES-256', 'AES-256', '256-bit'),
  ]
  save.mockClear()
  vi.mocked(downloadCbomJson).mockClear()
})

describe('LibraryCBOMBuilder assessment download and save', () => {
  it('uses the displayed assessment algorithms for both the download and saved report summary', () => {
    render(<LibraryCBOMBuilder />)
    expect(screen.getByText('RSA')).toBeInTheDocument()
    expect(screen.getByText('ECDH (P-256)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Download CycloneDX 1.7' }))
    const doc = downloaded()
    expect(doc.components).toHaveLength(3)
    expect(doc.components.every((c: { type: string }) => c.type === 'cryptographic-asset')).toBe(
      true
    )
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    const summary = save.mock.calls.at(-1)![0].inputs.reportSummary
    expect(summary.algorithms.map((a: { name: string }) => a.name)).toEqual(
      doc.components.map((c: { name: string }) => c.name)
    )
    expect(summary.componentCount).toBe(3)
    expect(summary.basis).toBe('assessment-self-report')
    expect(summary.quantumUnassessedCount).toBe(3)
  })

  it('refreshes and clears the export with the displayed selections, while retaining library-mode exports', () => {
    const view = render(<LibraryCBOMBuilder />)
    mockTransitions = [row('RSA-4096', 'RSA', '4096-bit')]
    view.rerender(<LibraryCBOMBuilder />)
    fireEvent.click(screen.getByRole('button', { name: 'Download CycloneDX 1.7' }))
    expect(downloaded().components.map((c: { name: string }) => c.name)).toEqual(['RSA (4096-bit)'])
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(save.mock.calls.at(-1)![0].data).toContain('4096-bit')
    expect(save.mock.calls.at(-1)![0].data).not.toContain('2048-bit')
    mockTransitions = []
    view.rerender(<LibraryCBOMBuilder />)
    fireEvent.click(screen.getByRole('button', { name: 'Download CycloneDX 1.7' }))
    expect(downloaded().components).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: /^Library posture$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Download CycloneDX 1.7' }))
    expect(downloaded().components.some((c: { type: string }) => c.type === 'library')).toBe(true)
  })
})
