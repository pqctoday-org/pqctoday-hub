// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SimulationOutcomesSection } from './SimulationOutcomesSection'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument } from '@/services/storage/types'
import type { SimRoadmapInput } from '@/simulation/simRoadmap'

function seedDocs(docs: ExecutiveDocument[]) {
  useModuleStore.setState((state) => ({
    artifacts: { ...state.artifacts, executiveDocuments: docs },
  }))
}

const LEGACY_INPUT: SimRoadmapInput = {
  sector: 'healthcare',
  size: 'mid',
  country: 'DE',
  difficulty: 'realistic',
  phases: [
    { id: 'p0', name: 'Executive Mandate', level: 2, cleared: true },
    { id: 'p1', name: 'Discovery & Inventory', level: 1, cleared: false },
  ],
  clearedCount: 1,
  totalPhases: 9,
  readinessPct: 40,
  yearsToHorizon: 3.5,
  over: 0,
  // no compliancePct/objectives/score/verifyCloseCleared — pre-Wave-5 doc
}

const FULL_INPUT: SimRoadmapInput = {
  ...LEGACY_INPUT,
  clearedCount: 9,
  readinessPct: 92,
  compliancePct: 88,
  objectives: [
    {
      id: 'governance',
      label: 'Governance in place',
      byYear: 2027,
      done: true,
      achievedYear: 2026,
    },
    {
      id: 'critical',
      label: 'Critical assets protected',
      byYear: 2031,
      done: true,
      achievedYear: 2030,
    },
    { id: 'migration', label: 'Migration completed', byYear: 2035, done: false },
  ],
  score: {
    grade: 'A',
    overall: 95,
    parQuarters: 20,
    paceScore: 100,
    trapScore: 90,
    complianceScore: 88,
    onTimeScore: 100,
  },
  verifyCloseCleared: true,
}

const renderSection = () =>
  render(
    <MemoryRouter>
      <SimulationOutcomesSection defaultOpen />
    </MemoryRouter>
  )

const doc = (inputs: SimRoadmapInput, id = 'sim-roadmap-1'): ExecutiveDocument => ({
  id,
  moduleId: 'migration-program',
  type: 'sim-roadmap',
  title: `Simulation Roadmap — ${inputs.sector}`,
  data: '# roadmap',
  createdAt: 1751328000000,
  inputs,
})

describe('SimulationOutcomesSection (Wave 5, WP5.1)', () => {
  afterEach(() => seedDocs([]))

  it('empty state: shows a CTA to the Simulation when no run has ever been committed', () => {
    renderSection()
    expect(
      screen.getByText(/Play the Migration Simulation and commit your run/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open the Simulation/i })).toHaveAttribute(
      'href',
      '/simulation'
    )
  })

  it('degrades gracefully for a pre-Wave-5 doc missing the new optional fields', () => {
    seedDocs([doc(LEGACY_INPUT)])
    renderSection()
    // core fields (always present) still render
    expect(screen.getByText(/1\/9 phases/)).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
    // Wave-5-only blocks are simply absent, not broken/erroring
    expect(screen.queryByText('Compliance')).not.toBeInTheDocument()
    expect(screen.queryByText('Transformation objectives, with dates')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sim-outcomes-grade-card')).not.toBeInTheDocument()
    expect(screen.queryByText('Closure record')).not.toBeInTheDocument()
  })

  it('full state: renders readiness, compliance, phases, objectives with dates, grade, and closure', () => {
    seedDocs([doc(FULL_INPUT)])
    renderSection()
    expect(screen.getByText('92%')).toBeInTheDocument() // readiness
    expect(screen.getByText('88%')).toBeInTheDocument() // compliance
    expect(screen.getByText(/9\/9 phases/)).toBeInTheDocument()
    expect(screen.getByText('Governance in place')).toBeInTheDocument()
    expect(screen.getByText(/✓ 2026/)).toBeInTheDocument()
    const grade = screen.getByTestId('sim-outcomes-grade-card')
    expect(grade).toHaveTextContent('A')
    expect(screen.getByText('Closure record')).toBeInTheDocument()
  })

  it('hides the closure-record block when verify-close was not cleared', () => {
    seedDocs([doc({ ...FULL_INPUT, verifyCloseCleared: false })])
    renderSection()
    expect(screen.queryByText('Closure record')).not.toBeInTheDocument()
  })

  it('reads the NEWEST committed run when multiple sim-roadmap docs exist', () => {
    seedDocs([
      { ...doc({ ...LEGACY_INPUT, readinessPct: 10 }, 'sim-roadmap-older'), createdAt: 1000 },
      { ...doc({ ...LEGACY_INPUT, readinessPct: 77 }, 'sim-roadmap-newer'), createdAt: 2000 },
    ])
    renderSection()
    expect(screen.getByText('77%')).toBeInTheDocument()
    expect(screen.queryByText('10%')).not.toBeInTheDocument()
  })
})
