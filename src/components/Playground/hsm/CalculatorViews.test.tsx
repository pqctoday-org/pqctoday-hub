// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SaveRequest } from '@/components/BusinessCenter/architecturePack/saveArtifact'
import { CertCapacityCalculator } from '@/components/PKILearning/modules/PKIWorkshop/CertCapacityCalculator'
import { HsmCapacityCalculator } from './HsmCapacityCalculator'
import { Button } from '@/components/ui/button'

const spies = vi.hoisted(() => ({ download: vi.fn(), save: vi.fn() }))
vi.mock('@/utils/csvExport', async (original) => ({
  ...(await original<typeof import('@/utils/csvExport')>()),
  downloadCsv: spies.download,
}))
vi.mock('@/components/BusinessCenter/operationsPack/SaveToOperationsPack', () => ({
  SaveToOperationsPack: ({ build }: { build: () => SaveRequest }) => (
    <Button onClick={() => spies.save(build())}>Save snapshot</Button>
  ),
}))
beforeEach(() => vi.clearAllMocks())

describe('corrected calculator screens and exports', () => {
  it('keeps fractional certificate renewal values in CSV and saved inputs, without CPU outputs', () => {
    render(<CertCapacityCalculator />)
    expect(screen.getByText('Root CA → intermediate CA → leaf')).toBeInTheDocument()
    expect(screen.getByText(/TLS sends two certificates/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Leaf renewal interval (days)'), {
      target: { value: '240' },
    })
    expect(screen.getByText(/1.521 renewals per year/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Export educational estimate (CSV)' }))
    const csv = spies.download.mock.calls[0][0] as string
    expect(csv).toContain('1.5208333333333333')
    expect(csv).toContain('Certificate-related payload bytes')
    expect(csv).not.toContain('CPU core')
    fireEvent.click(screen.getByRole('button', { name: 'Save snapshot' }))
    const saved = spies.save.mock.calls[0][0]
    expect(saved.inputs.modelVersion).toBe('2')
    expect(saved.inputs.rows[3].payloadBytes).toBe(14899)
    expect(saved.data).toContain('root excluded')
    expect(saved.inputs.rows[3]).not.toHaveProperty('cpuCorePercent')
  })
  it('uses 70%/N+1, preserves 4/3/3 inventory and exports separate payment assumptions', () => {
    render(<HsmCapacityCalculator />)
    expect(screen.getByLabelText('Target utilisation (%)')).toHaveValue(70)
    expect(screen.getByRole('button', { name: /Local redundancy per site/ })).toHaveTextContent(
      'N+1'
    )
    fireEvent.change(screen.getByLabelText('Number of sites'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save snapshot' }))
    const saved = spies.save.mock.calls[0][0]
    expect(saved.inputs.scenarios).toHaveLength(5)
    expect(saved.inputs.scenarios[0].siteAllocations).toEqual([4, 3, 3])
    expect(saved.inputs.scenarios[3].siteAllocations).toEqual([1, 1, 0])
    expect(saved.inputs.scenarios[3].fleet).toBe('payment')
    expect(saved.inputs.targetUtilizationPct).toBe(70)
    expect(saved.data).toContain('4 / 3 / 3')
    expect(saved.data).toContain('Fictional educational input')
    fireEvent.click(screen.getByRole('button', { name: 'Export educational estimate (CSV)' }))
    const csv = spies.download.mock.calls[0][0] as string
    expect(csv).toContain('Transactions/s per site')
    expect(csv).toContain('Transactions/s aggregate')
    expect(csv).toContain('payment')
    expect(csv).toContain('Workload recipes and inputs')
  })
  it('shows unsupported operations and carries the failure into both export formats', () => {
    render(<HsmCapacityCalculator />)
    fireEvent.change(screen.getByLabelText('Fictional profile A: ML-DSA-65 operations/s'), {
      target: { value: '0' },
    })
    expect(screen.getByText(/Unsupported operation: ML-DSA-65/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save snapshot' }))
    const saved = spies.save.mock.calls[0][0]
    expect(saved.inputs.scenarios[1].hsmsRequired).toBeNull()
    expect(saved.inputs.scenarios[1].sufficient).toBe(false)
    expect(saved.data).toContain('Unsupported: ML-DSA-65')
    expect(saved.data).not.toContain('Infinity')
    fireEvent.click(screen.getByRole('button', { name: 'Export educational estimate (CSV)' }))
    expect(spies.download.mock.calls[0][0]).toContain('Unsupported')
  })
  it('keeps the displayed selected signing recipe and saved recipe consistent', () => {
    render(<HsmCapacityCalculator />)
    fireEvent.click(screen.getByRole('button', { name: /PQC artifact signature/ }))
    fireEvent.click(screen.getByRole('option', { name: 'SLH-DSA-128s' }))
    expect(screen.getByText(/PQC: one SLH-DSA-128s signature per artifact/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save snapshot' }))
    const saved = spies.save.mock.calls[0][0]
    expect(
      saved.inputs.useCases.find((u: { label: string }) => u.label.includes('Code')).pqcRecipe
    ).toEqual({ 'slh-dsa-128s': 1 })
  })
  it('exports optional certificate storage and expanded-key assumptions separately', () => {
    render(<HsmCapacityCalculator />)
    fireEvent.click(screen.getByLabelText('Store certificate on HSM'))
    fireEvent.click(
      screen.getByRole('button', { name: 'Export storage assumptions (CSV)', hidden: true })
    )
    const csv = spies.download.mock.calls[0][0] as string
    expect(csv).toContain('includeCertificate')
    expect(csv).toContain('4032')
    expect(csv).toContain('not physical object-slot capacity')
  })
})
