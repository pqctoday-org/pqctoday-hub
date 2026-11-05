// SPDX-License-Identifier: AGPL-3.0-only
import { Button } from '@/components/ui/button'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { KmipProtocolExplorer } from '@/components/PKILearning/modules/KmsPqc/workshop/KmipProtocolExplorer'
import { KMIP_READINESS_CHECKLIST } from '@/components/PKILearning/modules/KmsPqc/data/kmsConstants'
import { ClosureHandoverRegister } from '@/components/PKILearning/modules/VerificationClosure/workshop/ClosureHandoverRegister'
import { MerkleWorkshopSteps } from '@/components/PKILearning/modules/MerkleTreeCerts/workshop/MerkleWorkshopSteps'
import { SponsorView } from '@/components/Sponsor/SponsorView'
import { EXAMPLE_REPORT_URL } from '@/data/exampleReport'
import { InfraModernizationPlanner } from './InfraModernizationPlanner'

const saved = vi.hoisted(() => vi.fn())
vi.mock('@/wasm/kmip/kmipEngine', () => ({
  getKmipEngine: () => Promise.reject(new Error('No engine used by review test')),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => undefined }))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (select: (state: { addExecutiveDocument: typeof saved }) => unknown) =>
    select({ addExecutiveDocument: saved }),
}))
vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({ exportData, onExport }: { exportData: string; onExport: () => void }) => (
    <>
      <pre data-testid="export-content">{exportData}</pre>
      <Button onClick={onExport}>Save sample plan</Button>
    </>
  ),
}))
vi.mock('@/components/shared/PersonaPageNote', () => ({ PersonaPageNote: () => null }))
vi.mock('@/components/PKILearning/common/WorkshopStepHeader', () => ({
  WorkshopStepHeader: () => null,
}))
vi.mock('@/components/PKILearning/modules/MerkleTreeCerts/workshop/MerkleTreeBuilder', () => ({
  MerkleTreeBuilder: () => null,
}))
vi.mock(
  '@/components/PKILearning/modules/MerkleTreeCerts/workshop/InclusionProofGenerator',
  () => ({ InclusionProofGenerator: () => null })
)
vi.mock('@/components/PKILearning/modules/MerkleTreeCerts/workshop/ProofVerifier', () => ({
  ProofVerifier: () => null,
}))
vi.mock('@/components/PKILearning/modules/MerkleTreeCerts/workshop/SizeComparison', () => ({
  SizeComparison: () => null,
}))
vi.mock('@/components/PKILearning/modules/MerkleTreeCerts/workshop/CTLogSimulator', () => ({
  CTLogSimulator: () => null,
}))
beforeEach(() => vi.clearAllMocks())

describe('educational selections do not establish performed checks', () => {
  it('keeps all KMIP participation credit without declaring readiness', () => {
    render(
      <MemoryRouter>
        <KmipProtocolExplorer />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Readiness' }))
    expect(
      screen.queryByText('Sample checklist reviewed — technical readiness not assessed.')
    ).not.toBeInTheDocument()
    for (const item of KMIP_READINESS_CHECKLIST)
      fireEvent.click(screen.getByRole('button', { name: (name) => name.includes(item.title) }))
    expect(
      screen.getByText('Sample checklist reviewed — technical readiness not assessed.')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        `Reviewed: ${KMIP_READINESS_CHECKLIST.length}/${KMIP_READINESS_CHECKLIST.length}`
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/Your environment is ready/)).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', {
        name: (name) => name.includes(KMIP_READINESS_CHECKLIST[0].title),
      })
    )
    expect(
      screen.queryByText('Sample checklist reviewed — technical readiness not assessed.')
    ).not.toBeInTheDocument()
  })
  it('treats fully populated fictional closure fields as entries, not archive operations', () => {
    render(<ClosureHandoverRegister />)
    const fields = screen.getAllByRole('button', { name: /^Owner for/ })
    for (const field of fields) {
      fireEvent.click(field)
      fireEvent.click(screen.getByRole('option', { name: 'Crypto Gov Owner' }))
    }
    for (const field of screen.getAllByLabelText(/^Handover date for/))
      fireEvent.change(field, { target: { value: '2028-05-01' } })
    for (const button of screen.getAllByRole('button', { name: /☐/ })) fireEvent.click(button)
    expect(
      screen.getByText('Sample checklist entries complete — closure not assessed')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/No closure record or evidence dossier has been generated or archived/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/program can close/)).not.toBeInTheDocument()
  })
  it('preserves a preselected TLS topic in exported and saved sample inputs without verification', () => {
    render(<InfraModernizationPlanner />)
    expect(screen.getByRole('button', { name: 'TLS 1.3' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('export-content')).toHaveTextContent(
      'Selected protocol planning topics: - TLS 1.3'
    )
    expect(screen.getByTestId('export-content')).toHaveTextContent(
      'protocol compatibility is not assessed'
    )
    expect(screen.getByTestId('export-content')).not.toHaveTextContent('Protocols verified')
    fireEvent.click(screen.getByRole('button', { name: 'Save sample plan' }))
    const doc = saved.mock.calls[0][0]
    expect(doc.inputs.protocols['TLS 1.3']).toBe(true)
    expect(doc.data).toContain('This tool executes no handshakes')
    fireEvent.click(screen.getByRole('button', { name: 'TLS 1.3' }))
    expect(screen.getByTestId('export-content')).toHaveTextContent('No protocol topics selected.')
  })
  it('allows skipping straight to the last Merkle page but claims only self-marked review', () => {
    render(<MerkleWorkshopSteps initialStep={4} />)
    fireEvent.click(screen.getByRole('button', { name: /Complete/ }))
    expect(screen.getByText('Workshop review marked complete')).toBeInTheDocument()
    expect(screen.getByText(/Navigation and this button do not establish/)).toBeInTheDocument()
    expect(screen.queryByText(/You have built a Merkle tree/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }))
    expect(screen.queryByText('Workshop review marked complete')).not.toBeInTheDocument()
  })
  it('links sponsor readers to an illustrative assessment without audited-evidence promises', () => {
    render(
      <MemoryRouter>
        <SponsorView />
      </MemoryRouter>
    )
    expect(
      screen.getByText('Illustrative assessment report with sample planning inputs')
    ).toBeInTheDocument()
    expect(screen.getByText(/the sample is not audited evidence/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /See a sample assessment report/ })).toHaveAttribute(
      'href',
      EXAMPLE_REPORT_URL
    )
    expect(screen.queryByText(/Audit-ready PDF/)).not.toBeInTheDocument()
  })
})
