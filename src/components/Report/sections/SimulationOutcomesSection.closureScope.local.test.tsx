// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SimulationOutcomesSection } from './SimulationOutcomesSection'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument } from '@/services/storage/types'
import type { SimRoadmapInput } from '@/simulation/simRoadmap'
function documents(closure?: boolean) {
  const inputs: SimRoadmapInput = {
    sector: 'financial',
    size: 'mid',
    country: 'US',
    difficulty: 'easy',
    phases: [],
    clearedCount: 0,
    totalPhases: 9,
    readinessPct: 0,
    yearsToHorizon: 4,
    over: 0,
    ...(closure === undefined ? {} : { verifyCloseCleared: closure }),
  }
  const doc: ExecutiveDocument = {
    id: 'fictional-closure',
    moduleId: 'migration-program',
    type: 'sim-roadmap',
    title: 'Fictional classroom run',
    data: '# Sample run; no technical evidence',
    createdAt: 1,
    inputs,
  }
  useModuleStore.setState((state) => ({
    artifacts: { ...state.artifacts, executiveDocuments: [doc] },
  }))
}
const show = () =>
  render(
    <MemoryRouter>
      <SimulationOutcomesSection defaultOpen />
    </MemoryRouter>
  )
afterEach(() =>
  useModuleStore.setState((state) => ({
    artifacts: { ...state.artifacts, executiveDocuments: [] },
  }))
)
describe('simulation closure flag is an educational activity record', () => {
  it('true flag without technical records never asserts deployed key retirement or a dossier', () => {
    documents(true)
    show()
    expect(
      screen.getByText(/This fictional simulation recorded closure activity/)
    ).toHaveTextContent('does not establish that deployed keys have been retired')
    expect(
      screen.getByText(/This fictional simulation recorded closure activity/)
    ).toHaveTextContent('scoped key-lifecycle records and traceable test results')
    expect(screen.queryByText(/Full evidence dossier/)).not.toBeInTheDocument()
    expect(screen.queryByText(/decommissioned against the 5-point/)).not.toBeInTheDocument()
  })
  it('absent closure flag preserves legacy display without inventing closure activity', () => {
    documents()
    show()
    expect(screen.queryByText('Closure record', { exact: true })).not.toBeInTheDocument()
  })
})
