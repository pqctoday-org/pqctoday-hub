// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssessReview } from './AssessReview'
import { AssessDone } from './AssessDone'
import { summarizeAnswer, type AssessReviewState } from './reviewModel'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { useAssessmentResultStore } from '../../../store/useAssessmentResultStore'
import type { AssessmentResult } from '../../../hooks/assessmentTypes'

// Minimal-but-real shape twoTrackFromAssess/buildTwoTrackPlan actually read —
// mirrors the mock in assessBridge.test.ts.
const MOCK_ASSESS_RESULT = {
  recommendedActions: [
    {
      priority: 1,
      action: 'Migrate TLS key exchange to ML-KEM',
      category: 'immediate',
      relatedModule: '/migrate',
      cswp39Step: 'inventory',
    },
  ],
  migrationEffort: [],
  hndlRiskWindow: { isAtRisk: true },
  tnflRiskWindow: { isAtRisk: false },
} as unknown as AssessmentResult

const blank = (): AssessReviewState => ({
  industry: '',
  country: '',
  currentCryptoCategories: [],
  cryptoUnknown: false,
  dataSensitivity: [],
  sensitivityUnknown: false,
  complianceRequirements: [],
  complianceUnknown: false,
  cryptoUseCases: [],
  useCasesUnknown: false,
  dataRetention: [],
  retentionUnknown: false,
  credentialLifetime: [],
  credentialLifetimeUnknown: false,
  migrationStatus: '',
  migrationUnknown: false,
  systemCount: '',
  teamSize: '',
  scaleUnknown: false,
  cryptoAgility: '',
  agilityUnknown: false,
  infrastructure: [],
  infrastructureUnknown: false,
  timelinePressure: '',
  timelineUnknown: false,
})

describe('summarizeAnswer', () => {
  it('shows the value and flags smart-default answers', () => {
    expect(summarizeAnswer('industry', { ...blank(), industry: 'Healthcare' })).toEqual({
      text: 'Healthcare',
      isDefault: false,
    })
    const mig = summarizeAnswer('migration', { ...blank(), migrationUnknown: true })
    expect(mig.isDefault).toBe(true)
    expect(mig.text).toMatch(/recommended/i)
    // freely-optional with nothing chosen → "Skipped"
    expect(summarizeAnswer('compliance', blank()).text).toBe('Skipped')
  })
})

describe('AssessReview', () => {
  beforeEach(() => useAssessmentStore.getState().reset())

  it('lists answers, flags recommended defaults, and generates', async () => {
    const user = userEvent.setup()
    const store = useAssessmentStore.getState()
    store.setIndustry('Finance & Banking')
    store.setCountry('United States')
    store.setMigrationUnknown(true)

    const onGenerate = vi.fn()
    render(
      <AssessReview
        mode="comprehensive"
        onEdit={vi.fn()}
        onBack={vi.fn()}
        onGenerate={onGenerate}
      />
    )

    expect(screen.getByText('Review your answers')).toBeInTheDocument()
    expect(screen.getByText('What industry are you in?')).toBeInTheDocument()
    expect(screen.getByText('Finance & Banking')).toBeInTheDocument()
    // migration answered via "I'm not sure" → Recommended pill
    expect(screen.getAllByText('Recommended').length).toBeGreaterThanOrEqual(1)

    await user.click(screen.getByRole('button', { name: /generate my report/i }))
    expect(onGenerate).toHaveBeenCalled()
  })

  it('edits a specific step', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<AssessReview mode="quick" onEdit={onEdit} onBack={vi.fn()} onGenerate={vi.fn()} />)
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(onEdit).toHaveBeenCalledWith('industry')
  })
})

describe('AssessDone', () => {
  beforeEach(() => {
    useAssessmentResultStore.setState({ lastResult: null })
  })

  // WP5.6 — diagnostic preview (two-track sequencing + indicative maturity).
  it('diagnostics start collapsed and expand on click', async () => {
    const user = userEvent.setup()
    render(
      <AssessDone
        mode="comprehensive"
        onViewReport={vi.fn()}
        onRetake={vi.fn()}
        onContinueToFull={vi.fn()}
        onPlaySimulation={vi.fn()}
      />
    )
    expect(screen.queryByText(/Indicative program maturity/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Diagnostic preview/i }))
    expect(screen.getByText(/Indicative program maturity/i)).toBeInTheDocument()
  })

  it('shows Level 1 Aware (never higher) once an assessment exists, and links to the simulation', async () => {
    const user = userEvent.setup()
    useAssessmentResultStore.setState({ lastResult: MOCK_ASSESS_RESULT })
    const onPlaySimulation = vi.fn()
    render(
      <AssessDone
        mode="comprehensive"
        onViewReport={vi.fn()}
        onRetake={vi.fn()}
        onContinueToFull={vi.fn()}
        onPlaySimulation={onPlaySimulation}
      />
    )
    await user.click(screen.getByRole('button', { name: /Diagnostic preview/i }))
    expect(screen.getByText(/Level 1 — Aware/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /PQC migration simulation/i }))
    expect(onPlaySimulation).toHaveBeenCalled()
  })

  it('shows Level 0 (no assessment) and no two-track section when nothing has been assessed', async () => {
    const user = userEvent.setup()
    render(
      <AssessDone
        mode="comprehensive"
        onViewReport={vi.fn()}
        onRetake={vi.fn()}
        onContinueToFull={vi.fn()}
        onPlaySimulation={vi.fn()}
      />
    )
    await user.click(screen.getByRole('button', { name: /Diagnostic preview/i }))
    expect(screen.getByText(/Level 0 — Unaware/)).toBeInTheDocument()
    expect(screen.queryByText(/Two-track sequencing/i)).not.toBeInTheDocument()
  })

  it('renders the Track A / Track B split from the assessment', async () => {
    const user = userEvent.setup()
    useAssessmentResultStore.setState({ lastResult: MOCK_ASSESS_RESULT })
    render(
      <AssessDone
        mode="comprehensive"
        onViewReport={vi.fn()}
        onRetake={vi.fn()}
        onContinueToFull={vi.fn()}
        onPlaySimulation={vi.fn()}
      />
    )
    await user.click(screen.getByRole('button', { name: /Diagnostic preview/i }))
    expect(screen.getByText(/Two-track sequencing/i)).toBeInTheDocument()
    expect(screen.getByText(/Track A — Confidentiality/)).toBeInTheDocument()
    expect(screen.getByText(/Track B — Integrity/)).toBeInTheDocument()
    // HNDL is at risk, TNFL is not → Track A leads.
    expect(screen.getAllByText('Lead')).toHaveLength(1)
  })

  it('fast track foreshadows the locked sections and wires the buttons', async () => {
    const user = userEvent.setup()
    const onViewReport = vi.fn()
    const onContinueToFull = vi.fn()
    render(
      <AssessDone
        mode="quick"
        onViewReport={onViewReport}
        onRetake={vi.fn()}
        onContinueToFull={onContinueToFull}
        onPlaySimulation={vi.fn()}
      />
    )
    expect(screen.getByText(/report sections are still locked/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(onContinueToFull).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /view my risk report/i }))
    expect(onViewReport).toHaveBeenCalled()
  })

  it('full track shows no lock upsell', () => {
    render(
      <AssessDone
        mode="comprehensive"
        onViewReport={vi.fn()}
        onRetake={vi.fn()}
        onContinueToFull={vi.fn()}
        onPlaySimulation={vi.fn()}
      />
    )
    expect(screen.queryByText(/still locked/i)).not.toBeInTheDocument()
  })
})
