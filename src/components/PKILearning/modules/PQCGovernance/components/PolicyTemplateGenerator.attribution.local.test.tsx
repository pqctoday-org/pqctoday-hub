// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PolicyTemplateGenerator } from './PolicyTemplateGenerator'
import { useModuleStore } from '@/store/useModuleStore'
vi.mock('@/hooks/useExecutiveModuleData', () => {
  const data = { frameworksByIndustry: [], myFrameworks: [], migrationDeadlineYear: null }
  return { useExecutiveModuleData: () => data }
})
beforeEach(() => {
  localStorage.clear()
  useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [] } }))
})
const saved = () => useModuleStore.getState().artifacts.executiveDocuments![0].data
const save = () => fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
describe('sample policy rules source attribution', () => {
  it('keeps an empty draft educational without inventing a prescribed loop', () => {
    render(<PolicyTemplateGenerator />)
    expect(screen.getByRole('heading', { name: 'Hub sample KPI drift rules' })).toBeInTheDocument()
    save()
    expect(saved()).toContain('## Hub sample KPI drift rules')
    expect(saved()).toContain('No sample drift rules defined')
    expect(saved()).toContain('§5.2 - Crypto Security Policy Enforcement')
    expect(saved()).toContain('§6.5 - Maturity Assessment for Crypto Agility')
    expect(saved()).not.toMatch(/§5.4|Measuring Migration Progress|Per §5.4/)
  })
  it('exports a learner-chosen threshold and action without turning them into NIST requirements', () => {
    render(<PolicyTemplateGenerator />)
    fireEvent.click(screen.getByRole('button', { name: '+ Add drift rule' }))
    for (const [name, value] of [
      ['KPI', 'Sample coverage'],
      ['Threshold', '< 17%'],
      ['Policy action', 'Discuss scope'],
    ] as const)
      fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } })
    save()
    expect(saved()).toContain('| Sample coverage | < 17% | Discuss scope |')
    expect(saved()).toContain('not a NIST-prescribed feedback loop or maturity assessment')
    expect(saved()).not.toContain('Measuring Migration Progress')
    const inputs = useModuleStore.getState().artifacts.executiveDocuments![0].inputs as {
      kpiDriftRules: unknown[]
    }
    expect(inputs.kpiDriftRules).toEqual([
      { kpi: 'Sample coverage', threshold: '< 17%', policyAction: 'Discuss scope' },
    ])
  })
})
