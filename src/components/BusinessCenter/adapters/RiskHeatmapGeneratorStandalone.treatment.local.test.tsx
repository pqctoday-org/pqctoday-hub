// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { RiskHeatmapGeneratorStandalone } from './RiskHeatmapGeneratorStandalone'
import { DEFAULT_RISK_ENTRIES, useRiskRegisterStore } from '@/store/useRiskRegisterStore'
import { useSimulationStore } from '@/store/useSimulationStore'
import { bankRiskEntries } from '@/components/Simulation/autorun/executiveBankCase'

const bank = vi.hoisted(() => ({ on: false }))
vi.mock('@/components/Simulation/autorun/autoRunFill', () => ({
  isExecutiveBankOverview: (sector: string) => bank.on && sector === 'financial',
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({ myFrameworks: [], myProducts: [], myThreats: [] }),
}))

const renderTool = () =>
  render(
    <MemoryRouter>
      <RiskHeatmapGeneratorStandalone />
    </MemoryRouter>
  )

beforeEach(() => {
  bank.on = false
  useSimulationStore.setState({ sector: '' } as never)
  useRiskRegisterStore.setState({ riskEntries: [], lastSavedKey: null })
})

describe('risk treatment plan', () => {
  it('lets a learner treat the L4/I5 sample risk and shows it with its rationale in the Treatment Summary and Priority Order', () => {
    renderTool()
    fireEvent.click(screen.getByRole('button', { name: 'Load sample entries' }))
    expect(useRiskRegisterStore.getState().riskEntries).toEqual(DEFAULT_RISK_ENTRIES)
    const tls = DEFAULT_RISK_ENTRIES[0]
    expect([tls.likelihood, tls.impact]).toEqual([4, 5])
    fireEvent.click(
      screen.getByRole('button', {
        name: (name) => name.includes('score 20 (') && name.endsWith(tls.assetName),
      })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Mitigate' }))
    fireEvent.change(screen.getByPlaceholderText(/Brief rationale/), {
      target: { value: 'Public trust; hybrid TLS pilot first' },
    })
    expect(screen.getByRole('heading', { name: 'Treatment Summary' })).toBeInTheDocument()
    const summary = screen.getByRole('list', { name: 'Treatment decisions' })
    expect(within(summary).getByText(/Mitigate/)).toBeInTheDocument()
    expect(summary).toHaveTextContent(
      `#1 ${tls.assetName} (L4 × I5) — Mitigate: Public trust; hybrid TLS pilot first`
    )
    expect(screen.getAllByText('Treatment rationale:').length).toBe(1)
  })

  it('shows the bank walkthrough register here when that walkthrough is active and the store is empty', () => {
    bank.on = true
    useSimulationStore.setState({ sector: 'financial' } as never)
    renderTool()
    expect(screen.queryByText('No risk entries yet')).not.toBeInTheDocument()
    expect(screen.getByText(/Fictional bank teaching example/)).toBeInTheDocument()
    expect(
      screen.getAllByText(new RegExp(bankRiskEntries()[0].assetName.slice(0, 20))).length
    ).toBeGreaterThan(0)
  })
})
