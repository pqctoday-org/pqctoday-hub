// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { ManagementToolsAudit } from './ManagementToolsAudit'

const state = vi.hoisted(() => ({
  products: [] as Array<{ softwareName: string; infrastructureLayer: string }>,
  saved: undefined as
    undefined | { levels: Record<string, number>; sysPct: Record<string, number> },
  save: vi.fn(),
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({ myProducts: state.products, industry: 'financial' }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => state.saved }))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (select: (store: { addExecutiveDocument: typeof state.save }) => unknown) =>
    select({ addExecutiveDocument: state.save }),
}))
vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({ exportData, onExport }: { exportData: string; onExport: () => void }) => (
    <>
      <pre data-testid="export">{exportData}</pre>
      <Button onClick={onExport}>Save sample audit</Button>
    </>
  ),
}))

const names = [
  'Crypto Scanners',
  'Vulnerability Management',
  'Asset Management (CMDB / SBOM pipeline)',
  'Configuration Management (Policy-as-Code / CLM)',
  'Log Management / SIEM',
  'Zero-Trust Enforcement',
  'Data Classification Scanners',
]
function category(name: string) {
  return within(screen.getByRole('group', { name }))
}
beforeEach(() => {
  state.products = []
  state.saved = undefined
  state.save.mockReset()
})

describe('management category context and recorded coverage', () => {
  it.each([
    { softwareName: 'Example SIEM', infrastructureLayer: 'SIEM' },
    { softwareName: 'Example Database', infrastructureLayer: 'Database' },
  ])('does not infer any implementation from selected $softwareName', (product) => {
    state.products = [product]
    render(<ManagementToolsAudit />)
    for (const name of names) {
      expect(category(name).getByRole('slider')).toHaveValue('0')
      expect(category(name).getByText('None', { selector: 'span' })).toBeInTheDocument()
    }
    expect(screen.getByTestId('export')).toHaveTextContent('Hub tool-category rating:** 0%')
    expect(screen.getByText(/1 selected catalogue product available/)).toBeInTheDocument()
  })

  it('starts an empty context at zero and preserves a changed single category in the saved output', () => {
    render(<ManagementToolsAudit />)
    fireEvent.click(category('Crypto Scanners').getByRole('button', { name: 'Automated' }))
    fireEvent.change(category('Crypto Scanners').getByRole('slider'), { target: { value: '25' } })
    expect(
      category('Vulnerability Management').getByText('None', { selector: 'span' })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save sample audit' }))
    const saved = state.save.mock.calls[0][0]
    expect(saved.inputs.levels['crypto-scanner']).toBe(3)
    expect(saved.inputs.levels['vuln-management']).toBe(0)
    expect(saved.inputs.sysPct['crypto-scanner']).toBe(25)
    expect(saved.inputs.completeness).toBe(18)
    expect(saved.data).toContain('| Crypto Scanners | Automated (3/3) | 25% |')
    expect(saved.data).toContain('Hub tool-category rating:** 18%')
  })

  it('keeps the rubric distinct from zero systems coverage even when every rating is automated', () => {
    render(<ManagementToolsAudit />)
    for (const name of names)
      fireEvent.click(category(name).getByRole('button', { name: 'Automated' }))
    expect(screen.getByTestId('export')).toHaveTextContent('Hub tool-category rating:** 100%')
    expect(screen.getByTestId('export')).toHaveTextContent(
      'even 100% does not establish inventory coverage or implemented controls'
    )
    for (const name of names) expect(category(name).getByRole('slider')).toHaveValue('0')
    expect(screen.getByText(/all categories set to/)).toHaveTextContent(
      '100% with 0% systems coverage'
    )
  })

  it('restores recorded ratings and partial coverage without replacing them from catalogue context', () => {
    state.products = [{ softwareName: 'Unrelated catalogue SIEM', infrastructureLayer: 'SIEM' }]
    state.saved = {
      levels: Object.fromEntries(
        [
          'crypto-scanner',
          'vuln-management',
          'asset-management',
          'config-management',
          'log-siem',
          'zero-trust',
          'data-classification',
        ].map((id) => [id, id === 'log-siem' ? 2 : 0])
      ),
      sysPct: Object.fromEntries(
        [
          'crypto-scanner',
          'vuln-management',
          'asset-management',
          'config-management',
          'log-siem',
          'zero-trust',
          'data-classification',
        ].map((id) => [id, id === 'log-siem' ? 40 : 0])
      ),
    }
    render(<ManagementToolsAudit />)
    expect(
      category('Log Management / SIEM').getByText('Partial', { selector: 'span' })
    ).toBeInTheDocument()
    expect(category('Log Management / SIEM').getByRole('slider')).toHaveValue('40')
    expect(category('Crypto Scanners').getByText('None', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByTestId('export')).toHaveTextContent(
      '| Log Management / SIEM | Partial (2/3) | 40% |'
    )
  })
})
