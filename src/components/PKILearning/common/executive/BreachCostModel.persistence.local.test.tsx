// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { BreachCostModel } from './BreachCostModel'
import { BreachScenarioSimulator } from '../../modules/PQCBusinessCase/components/BreachScenarioSimulator'
import { useModuleStore } from '@/store/useModuleStore'
import { ANNUAL_BREACH_PROBABILITY_PCT } from '@/data/roiBaselines'
import type { ExecutiveDocument } from '@/services/storage/types'

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({
    industry: 'Other',
    criticalThreatCount: 0,
    migrationDeadlineYear: null,
    frameworksByIndustry: [],
  }),
}))

const saved = () => useModuleStore.getState().artifacts.executiveDocuments![0]
function mountScenario() {
  return render(
    <MemoryRouter>
      <BreachScenarioSimulator />
    </MemoryRouter>
  )
}
function installSaved(inputs: Record<string, unknown>) {
  const doc: ExecutiveDocument = {
    id: 'sample-breach-draft',
    moduleId: 'pqc-business-case',
    type: 'breach-scenario',
    title: 'Fictional saved scenario',
    inputs,
    data: 'Previous illustrative output',
    createdAt: 100,
  }
  useModuleStore.setState((s) => ({
    artifacts: { ...s.artifacts, executiveDocuments: [doc] },
  }))
}

beforeEach(() => {
  localStorage.clear()
  useModuleStore.setState((s) => ({
    artifacts: { ...s.artifacts, executiveDocuments: [] },
  }))
})

afterEach(() => vi.restoreAllMocks())

async function downloadMarkdown() {
  let captured: Blob | undefined
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    captured = blob as Blob
    return 'blob:sample-export'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  fireEvent.click(screen.getByRole('button', { name: '.md' }))
  expect(captured).toBeDefined()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(captured!)
  })
}

describe('Breach scenario probability persistence', () => {
  it('saves a decimal override, JSON-roundtrips, remounts and reproduces the export and computed output', async () => {
    const view = mountScenario()
    fireEvent.change(screen.getByLabelText('Annual Breach Probability'), {
      target: { value: '17.3' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const original = JSON.parse(JSON.stringify(saved())) as ExecutiveDocument
    expect(original.inputs).toMatchObject({ annualBreachProbPct: 17.3, orgSizeTier: 'average' })
    expect(original.output).toBeDefined()
    expect(original.data).toContain('| Probability-weighted expected annual loss |')
    const originalDownload = await downloadMarkdown()
    view.unmount()
    act(() =>
      useModuleStore.setState((s) => ({
        artifacts: { ...s.artifacts, executiveDocuments: [original] },
      }))
    )
    mountScenario()
    expect(screen.getByLabelText('Annual Breach Probability')).toHaveValue('17.3')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(saved().inputs).toEqual(original.inputs)
    expect(saved().output).toEqual(original.output)
    expect(saved().data).toEqual(original.data)
    expect(await downloadMarkdown()).toEqual(originalDownload)
  })

  it('preserves an explicit saved zero in emitted inputs, calculated annual loss and re-saved document', async () => {
    installSaved({ selectedIndustry: 'Other', orgSizeTier: 'fortune1000', annualBreachProbPct: 0 })
    const view = mountScenario()
    expect(screen.getByLabelText('Annual Breach Probability')).toHaveValue('0')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const originalDownload = await downloadMarkdown()
    expect(saved().inputs).toMatchObject({ orgSizeTier: 'fortune1000', annualBreachProbPct: 0 })
    expect(saved().data).toContain('| Probability-weighted expected annual loss | $0 |')
    const original = JSON.parse(JSON.stringify(saved())) as ExecutiveDocument
    view.unmount()
    act(() =>
      useModuleStore.setState((s) => ({
        artifacts: { ...s.artifacts, executiveDocuments: [original] },
      }))
    )
    mountScenario()
    expect(screen.getByLabelText('Annual Breach Probability')).toHaveValue('0')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(saved().inputs).toEqual(original.inputs)
    expect(saved().output).toEqual(original.output)
    expect(saved().data).toEqual(original.data)
    expect(await downloadMarkdown()).toEqual(originalDownload)
  })

  it('uses the unchanged tier default for a legacy saved draft without a probability override', () => {
    installSaved({ selectedIndustry: 'Other', orgSizeTier: 'smb' })
    mountScenario()
    expect(screen.getByLabelText('Annual Breach Probability')).toHaveValue(
      String(ANNUAL_BREACH_PROBABILITY_PCT.smb)
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(saved().inputs).toMatchObject({
      orgSizeTier: 'smb',
      annualBreachProbPct: ANNUAL_BREACH_PROBABILITY_PCT.smb,
    })
  })

  it('emits an override on slider edits and retains the existing tier-selection reset', () => {
    const inputs = vi.fn(),
      costs = vi.fn()
    render(
      <MemoryRouter>
        <BreachCostModel onInputsChanged={inputs} onCostCalculated={costs} />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText('Annual Breach Probability'), {
      target: { value: '19.2' },
    })
    expect(inputs.mock.lastCall?.[0].annualBreachProbPct).toBe(19.2)
    expect(costs.mock.lastCall?.[0].annualBreachProbPct).toBe(19.2)
    fireEvent.click(screen.getByRole('button', { name: /^SMB/ }))
    expect(inputs.mock.lastCall?.[0]).toMatchObject({
      orgSizeTier: 'smb',
      annualBreachProbPct: ANNUAL_BREACH_PROBABILITY_PCT.smb,
    })
  })
})
