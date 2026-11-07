// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { BreachScenarioSimulator } from './BreachScenarioSimulator'
import { useModuleStore } from '@/store/useModuleStore'

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
vi.mock('./ForgeryRiskPanel', () => ({ ForgeryRiskPanel: () => null }))
beforeEach(() => {
  localStorage.clear()
  useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [] } }))
})

async function downloadMarkdown() {
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

describe('Breach scenario UI and actual Markdown retain method limits', () => {
  it('exports the changed corpus and the same conditional-loss method, without promising recurring cash savings', async () => {
    render(
      <MemoryRouter>
        <BreachScenarioSimulator />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText('Years of Stored Data (HNDL)'), {
      target: { value: '20' },
    })
    expect(
      screen.getByText(/Compare conditional avoided-loss estimates with initial migration work/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/breach cost savings compound annually/)).not.toBeInTheDocument()
    const markdown = await downloadMarkdown()
    expect(markdown).toContain('Corpus: 20 years')
    expect(markdown).toContain('decryption gap: 0 (newest data assumed fresh)')
    expect(markdown).toContain('E = S/2 when Y > S')
    expect(markdown).toContain('M = 1 + C × (1 − exp(−E × f / C))')
    expect(markdown).toContain('Each year uses its own cumulative scenario probability P_t')
    expect(markdown).toContain('not realized cash savings or an investment return')
    expect(markdown).not.toContain('discounted as a level annuity')
    expect(markdown).not.toContain('compound annually')
    const saved = useModuleStore
      .getState()
      .artifacts.executiveDocuments!.find((doc) => doc.type === 'breach-scenario')!
    expect(saved.inputs).toMatchObject({ yearsOfData: 20 })
    expect(saved.data).toContain('Assumptions and calculation method')
  })
})
