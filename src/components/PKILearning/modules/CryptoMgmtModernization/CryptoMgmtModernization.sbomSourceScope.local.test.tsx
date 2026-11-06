// SPDX-License-Identifier: AGPL-3.0-only
import { useState, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CryptoMgmtModernizationModule } from './index'
import { Button } from '@/components/ui/button'
import type { CbomExportItem } from './data/workshopTypes'
const config = vi.hoisted(() => ({ initialStep: 2 }))
vi.mock('@/components/PKILearning/common/ModuleShell', () => ({
  ModuleShell: ({ renderWorkshopStep }: { renderWorkshopStep: (step: number) => ReactNode }) => {
    const [step, setStep] = useState(config.initialStep)
    return (
      <>
        <nav>
          {[2, 3, 6, 7].map((n) => (
            <Button key={n} onClick={() => setStep(n)}>
              Step {n + 1}
            </Button>
          ))}
        </nav>
        {renderWorkshopStep(step)}
      </>
    )
  },
}))
function Consumer({ cbomAssets }: { cbomAssets: CbomExportItem[] }) {
  return (
    <p>
      Consumer received {cbomAssets.length} rows: {cbomAssets.map((a) => a.name).join(', ')}
    </p>
  )
}
vi.mock('./workshop/NoRegretROIBuilder', () => ({ NoRegretROIBuilder: Consumer }))
vi.mock('./workshop/RiskAnalysisEngine', () => ({ RiskAnalysisEngine: Consumer }))
vi.mock('./workshop/MitigateMigrateWizard', () => ({ MitigateMigrateWizard: Consumer }))
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
beforeEach(() => {
  config.initialStep = 2
})
describe('current draft and retained mapped source across module steps', () => {
  it('retains invalid draft text while downstream sees last valid rows, then distinguishes valid empty', () => {
    render(<CryptoMgmtModernizationModule />)
    fireEvent.click(screen.getByRole('button', { name: 'SBOM → CBOM' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Paste components-shaped JSON' }), {
      target: { value: '{"components":[{"name":"Last valid Ω","version":"1"}]}' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Paste components-shaped JSON' }), {
      target: { value: '{"components":' },
    })
    for (const step of [4, 7, 8]) {
      fireEvent.click(screen.getByRole('button', { name: 'Step ' + step }))
      expect(screen.getByLabelText('Step 3 mapping source')).toHaveTextContent(
        'current Step 3 draft is invalid or unsupported'
      )
      expect(screen.getByLabelText('Step 3 mapping source')).toHaveTextContent(
        'Retained last valid mapping: Pasted components draft, 1 rows'
      )
      expect(screen.getByText('Consumer received 1 rows: Last valid Ω')).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Step 3' }))
    expect(screen.getByRole('textbox', { name: 'Paste components-shaped JSON' })).toHaveValue(
      '{"components":'
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Malformed JSON')
    fireEvent.change(screen.getByRole('textbox', { name: 'Paste components-shaped JSON' }), {
      target: { value: '{"components":[]}' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Step 7' }))
    expect(screen.getByLabelText('Step 3 mapping source')).toHaveTextContent('valid but empty')
    expect(screen.getByLabelText('Step 3 mapping source')).toHaveTextContent(
      'not findings from that empty sample'
    )
    expect(screen.getByText('Consumer received 0 rows:')).toBeInTheDocument()
  })
  it('labels the absence of any mapping separately from a parsed empty sample', () => {
    config.initialStep = 3
    render(<CryptoMgmtModernizationModule />)
    expect(screen.getByLabelText('Step 3 mapping source')).toHaveTextContent(
      'No Step 3 components mapping has been made'
    )
    expect(screen.getByText('Consumer received 0 rows:')).toBeInTheDocument()
  })
})
