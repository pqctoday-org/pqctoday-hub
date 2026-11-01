// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CostModelExplorer } from '@/components/PKILearning/modules/PQCBusinessCase/components/CostModelExplorer'
import { useSimulationStore } from '@/store/useSimulationStore'
import { setAutoRunFill } from './autoRunFill'

vi.mock('@/hooks/useSavedArtifactInputs', () => ({
  useSavedArtifactInputs: () => ({
    systems: 80,
    itBudgetAnnual: 10_000_000,
    complexity: 2,
    horizonYears: 3,
  }),
}))

afterEach(() => setAutoRunFill(false))

describe('costing presentation', () => {
  it('shows the bank sample scope during the overview, rather than an unrelated saved scenario', () => {
    useSimulationStore.setState({ sector: 'financial' })
    setAutoRunFill(true)
    render(<CostModelExplorer />)
    expect(screen.getByLabelText('Systems in scope')).toHaveValue('250')
    expect(screen.getByLabelText('Planning horizon (years)')).toHaveValue('5')
  })

  it('preserves the saved scenario for manual use outside the overview', () => {
    setAutoRunFill(false)
    render(<CostModelExplorer />)
    expect(screen.getByLabelText('Systems in scope')).toHaveValue('80')
    expect(screen.getByLabelText('Planning horizon (years)')).toHaveValue('3')
  })
})
