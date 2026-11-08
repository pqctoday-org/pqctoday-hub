// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { FleetInteroperabilityMatrix } from '@/components/PKILearning/modules/AerospacePQC/workshop/FleetInteroperabilityMatrix'
import { DeviceSafetySimulator } from '@/components/PKILearning/modules/HealthcarePQC/workshop/DeviceSafetySimulator'
import { MEDICAL_DEVICE_CATALOG } from '@/components/PKILearning/modules/HealthcarePQC/data/healthcareConstants'
import {
  ManagementToolsAudit,
  TOOLS,
} from '@/components/PKILearning/modules/CryptoMgmtModernization/workshop/ManagementToolsAudit'
const saved = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({
    myProducts: [{ softwareName: 'Fictional scanner', infrastructureLayer: 'scanner' }],
    industry: 'Finance',
  }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => undefined }))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (state: { addExecutiveDocument: typeof saved }) => unknown) => {
    const state = { addExecutiveDocument: saved }
    return selector ? selector(state) : state
  },
}))
vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({ exportData, onExport }: { exportData: string; onExport: () => void }) => (
    <>
      <pre data-testid="export">{exportData}</pre>
      <Button onClick={onExport}>Save sample ratings</Button>
    </>
  ),
}))

describe('sample planning labels preserve the difference from tested capability', () => {
  it('keeps upgrade-category pairs at zero hypothetical deployment without claiming protected links', () => {
    render(<FleetInteroperabilityMatrix />)
    fireEvent.change(
      screen.getByRole('slider', { name: 'PQC deployment, percent of capable fleet' }),
      { target: { value: '0' } }
    )
    expect(screen.getByText('Hypothetical aircraft deployment share')).toBeInTheDocument()
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Gateway / retrofit planning case').length).toBeGreaterThan(0)
    expect(screen.getByText(/independently of the deployment slider/)).toBeInTheDocument()
    expect(
      screen.getByText(/does not protect an unchanged aircraft-to-ground hop/)
    ).toBeInTheDocument()
    expect(screen.queryByText('PQC-Protected Links')).not.toBeInTheDocument()
    expect(screen.queryByText('Native PQC')).not.toBeInTheDocument()
  })
  it('keeps review drafts per sample device while denying assessed submission coverage', () => {
    render(<DeviceSafetySimulator />)
    const considerations = [
      'Threat model includes quantum adversary',
      'Cryptographic inventory documented',
      'PQC algorithm selection justified',
      'Key management plan covers device lifetime',
      'Firmware update mechanism supports PQC signatures',
      'Post-market surveillance for crypto vulnerabilities',
      'SBOM includes cryptographic dependencies',
      'Hybrid mode transition plan documented',
    ]
    for (const label of considerations)
      fireEvent.click(screen.getByRole('button', { name: (name) => name.startsWith(label) }))
    expect(
      screen.getByText(
        /Sample checklist reviewed — device submission coverage and technical readiness not assessed/
      )
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Device:' }))
    fireEvent.click(screen.getByRole('option', { name: MEDICAL_DEVICE_CATALOG[1].name }))
    expect(screen.getByText('0/8 reviewed')).toBeInTheDocument()
    expect(
      screen.queryByText(/Sample checklist reviewed — device submission coverage/)
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Device:' }))
    fireEvent.click(screen.getByRole('option', { name: MEDICAL_DEVICE_CATALOG[0].name }))
    expect(screen.getByText('8/8 reviewed')).toBeInTheDocument()
    expect(
      screen.getByText(/Review selections are kept separately for each sample device/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/This device submission addresses/)).not.toBeInTheDocument()
    expect(
      screen.getByText(/No device benchmark or safety evaluation is executed here/)
    ).toBeInTheDocument()
  })
  it('shows the 100%-rating/0%-systems counterexample honestly in screen and saved output', () => {
    render(<ManagementToolsAudit />)
    expect(screen.getByText(/preselects Manual for every category/)).toBeInTheDocument()
    for (const button of screen.getAllByRole('button', { name: 'Automated' }))
      fireEvent.click(button)
    expect(screen.getByText('Hub Tool-Category Rating')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    for (const tool of TOOLS)
      expect(screen.getByRole('slider', { name: `Systems covered by ${tool.name}` })).toHaveValue(
        '0'
      )
    expect(screen.getByTestId('export')).toHaveTextContent(
      'even 100% does not establish inventory coverage or implemented controls'
    )
    expect(screen.getByTestId('export')).not.toHaveTextContent('Tool-chain completeness:')
    fireEvent.click(screen.getByRole('button', { name: 'Save sample ratings' }))
    const doc = saved.mock.calls[0][0]
    expect(Object.values(doc.inputs.levels)).toEqual(TOOLS.map(() => 3))
    expect(Object.values(doc.inputs.sysPct)).toEqual(TOOLS.map(() => 0))
    expect(doc.inputs.completeness).toBe(100)
    expect(doc.data).toContain('not NIST completeness thresholds')
  })
})
