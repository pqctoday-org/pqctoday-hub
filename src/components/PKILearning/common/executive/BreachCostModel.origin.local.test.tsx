// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { BreachCostModel } from './BreachCostModel'
import { BreachScenarioSimulator } from '../../modules/PQCBusinessCase/components/BreachScenarioSimulator'
import { CostOfInactionAnalyzer } from '../../modules/PQCBusinessCase/components/CostOfInactionAnalyzer'
import { useModuleStore } from '@/store/useModuleStore'
import { ANNUAL_BREACH_PROBABILITY_PCT } from '@/data/roiBaselines'
import type { ExecutiveDocument } from '@/services/storage/types'
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({
    industry: 'Other',
    country: 'United States',
    criticalThreatCount: 0,
    migrationDeadlineYear: null,
    frameworksByIndustry: [],
    isAssessmentComplete: false,
    assessmentResult: null,
  }),
}))
beforeEach(() => {
  localStorage.clear()
  useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [] } }))
})
afterEach(() => vi.restoreAllMocks())
const current = (type: string) =>
  useModuleStore.getState().artifacts.executiveDocuments!.find((doc) => doc.type === type)!
const restore = (doc: ExecutiveDocument) =>
  act(() =>
    useModuleStore.setState((s) => ({
      artifacts: { ...s.artifacts, executiveDocuments: [JSON.parse(JSON.stringify(doc))] },
    }))
  )
async function download() {
  let blob: Blob | undefined
  vi.spyOn(URL, 'createObjectURL').mockImplementation((value) => {
    blob = value as Blob
    return 'blob:sample'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  fireEvent.click(screen.getByRole('button', { name: '.md' }))
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob!)
  })
}
describe('Probability input origin remains distinct from a reference anchor', () => {
  it('separates Fig6 source anchor, model tier anchor and manual matching-value assumption without changing calculated values', () => {
    const inputs = vi.fn(),
      costs = vi.fn()
    render(
      <MemoryRouter>
        <BreachCostModel onInputsChanged={inputs} onCostCalculated={costs} />
      </MemoryRouter>
    )
    expect(inputs.mock.lastCall?.[0].annualBreachProbabilityOrigin).toBe('source-anchor')
    fireEvent.click(screen.getByRole('button', { name: /^SMB/ }))
    expect(inputs.mock.lastCall?.[0].annualBreachProbabilityOrigin).toBe('model-anchor')
    const tierCosts = costs.mock.lastCall?.[0]
    fireEvent.change(screen.getByLabelText('Annual Breach Probability'), {
      target: { value: '17.3' },
    })
    fireEvent.change(screen.getByLabelText('Annual Breach Probability'), {
      target: { value: String(ANNUAL_BREACH_PROBABILITY_PCT.smb) },
    })
    expect(inputs.mock.lastCall?.[0].annualBreachProbabilityOrigin).toBe('learner-assumption')
    expect(costs.mock.lastCall?.[0]).toEqual(tierCosts)
    fireEvent.click(screen.getByRole('button', { name: /^Average org/ }))
    expect(inputs.mock.lastCall?.[0].annualBreachProbabilityOrigin).toBe('source-anchor')
  })
  it('does not infer source origin for an old saved value merely because it equals the source anchor', () => {
    const inputs = vi.fn()
    render(
      <MemoryRouter>
        <BreachCostModel
          initialValues={{
            orgSizeTier: 'average',
            annualBreachProbPct: ANNUAL_BREACH_PROBABILITY_PCT.average,
          }}
          onInputsChanged={inputs}
        />
      </MemoryRouter>
    )
    expect(inputs.mock.lastCall?.[0].annualBreachProbabilityOrigin).toBe('restored-unrecorded')
    expect(
      screen.getByText(/Active probability origin: Restored scenario input/)
    ).toBeInTheDocument()
  })
  it('saves and reloads a learner override with its reference separate in saved data and a real Markdown blob', async () => {
    const view = render(
      <MemoryRouter>
        <BreachScenarioSimulator />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText('Annual Breach Probability'), {
      target: { value: '17.3' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const doc = JSON.parse(JSON.stringify(current('breach-scenario'))) as ExecutiveDocument
    expect(doc.inputs).toMatchObject({
      annualBreachProbPct: 17.3,
      annualBreachProbabilityOrigin: 'learner-assumption',
    })
    expect(doc.output).toMatchObject({
      probabilityProvenance: {
        activeProbabilityPct: 17.3,
        origin: 'learner-assumption',
        referenceProbabilityPct: ANNUAL_BREACH_PROBABILITY_PCT.average,
      },
    })
    view.unmount()
    restore(doc)
    render(
      <MemoryRouter>
        <BreachScenarioSimulator />
      </MemoryRouter>
    )
    expect(screen.getByText(/Active probability origin: Learner assumption/)).toBeInTheDocument()
    const md = await download()
    expect(md).toContain('Active scenario input: 17.3% — Learner assumption')
    expect(md).toContain('Reference anchor (average; historical typical-firm source reference)')
    expect(md).toContain(
      'The citation describes the reference anchor, not an edited or restored input.'
    )
  })
  it('Cost of Inaction save/export and restoration retain learner attribution instead of primary-verified', async () => {
    const output = vi.fn()
    const view = render(
      <MemoryRouter>
        <CostOfInactionAnalyzer onOutput={output} />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/Annual breach probability:/i), {
      target: { value: '18.2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const doc = JSON.parse(JSON.stringify(current('cost-of-inaction'))) as ExecutiveDocument
    expect(doc.inputs).toMatchObject({
      annualBreachProbabilityOrigin: 'learner-assumption',
      probabilityAnchorTier: 'average',
    })
    expect(doc.output).toMatchObject({
      scenario: {
        sourceStatus: {
          breachProbability: 'Learner assumption — not a source-verified probability',
        },
        probabilityProvenance: { activeProbabilityPct: 18.2, origin: 'learner-assumption' },
      },
    })
    view.unmount()
    restore(doc)
    render(
      <MemoryRouter>
        <CostOfInactionAnalyzer />
      </MemoryRouter>
    )
    const md = await download()
    expect(md).toContain('Active scenario input: 18.2% — Learner assumption')
    expect(md).not.toContain('primary-verified')
    expect(md).toContain('Reference anchor (average; historical typical-firm source reference)')
  })
})
