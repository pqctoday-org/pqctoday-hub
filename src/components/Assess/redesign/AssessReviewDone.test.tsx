// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssessReview } from './AssessReview'
import { AssessDone } from './AssessDone'
import { summarizeAnswer, type AssessReviewState } from './reviewModel'
import { useAssessmentStore } from '../../../store/useAssessmentStore'

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
      />
    )
    expect(screen.queryByText(/still locked/i)).not.toBeInTheDocument()
  })
})
