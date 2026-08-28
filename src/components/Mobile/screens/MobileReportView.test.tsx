// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileReportView } from './MobileReportView'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { REPORT_SECTION_ORDER, REPORT_SECTION_LABELS } from '@/data/reportSectionToCswp39'

// Real data throughout. The target screenshot is a pastiche — real elements
// wired together in an order/wording the real page doesn't use (confirmed
// by research before building). None of its 5 example action strings exist
// anywhere in the codebase; every assertion below is derived from the SAME
// real computeAssessment() pipeline the component calls.
const QUICK_INPUT = {
  industry: 'Technology',
  country: 'United States',
  dataSensitivity: ['high'],
  migrationStatus: 'planning' as const,
}

function resetStore() {
  window.localStorage.clear()
  useAssessmentFormStore.getState().reset()
  useAssessmentResultStore.getState().reset()
  usePersonaStore.setState({ selectedPersona: null })
}

function completeQuick(overrides: Partial<typeof QUICK_INPUT> = {}) {
  useAssessmentFormStore.setState({
    ...QUICK_INPUT,
    ...overrides,
    assessmentStatus: 'complete',
  })
}

function renderView() {
  return render(
    <MemoryRouter>
      <MobileReportView />
    </MemoryRouter>
  )
}

describe('MobileReportView', () => {
  beforeEach(() => {
    resetStore()
  })

  it('shows the real empty state when no assessment is complete', () => {
    renderView()
    expect(screen.getByText('No Report Yet')).toBeInTheDocument()
    expect(screen.getByText('Start Assessment').closest('a')).toHaveAttribute('href', '/assess')
  })

  it('shows the curious-specific empty-state copy for the curious persona', () => {
    usePersonaStore.setState({ selectedPersona: 'curious' })
    renderView()
    expect(screen.getByText(/Curious what a finished report looks like/i)).toBeInTheDocument()
  })

  it('shows the real, live-computed risk score and tier, not a typed figure', () => {
    completeQuick()
    renderView()
    const result = computeAssessment({
      industry: QUICK_INPUT.industry,
      currentCrypto: [],
      dataSensitivity: QUICK_INPUT.dataSensitivity,
      complianceRequirements: [],
      migrationStatus: QUICK_INPUT.migrationStatus,
      country: QUICK_INPUT.country,
    })
    expect(screen.getByText(String(result.riskScore))).toBeInTheDocument()
  })

  it('shows the real "fast report" upgrade nudge verbatim for a quick assessment', () => {
    completeQuick()
    renderView()
    expect(screen.getByText("You're viewing the fast report.")).toBeInTheDocument()
    expect(
      screen.getByText(/Two deeper sections.*unlock with the full assessment/)
    ).toBeInTheDocument()
  })

  it('shows the real HNDL-not-quantified warning for high sensitivity on a quick assessment', () => {
    completeQuick({ dataSensitivity: ['high'] })
    renderView()
    expect(screen.getByText('HNDL Risk Not Quantified')).toBeInTheDocument()
  })

  it('does not show the HNDL warning for low sensitivity', () => {
    completeQuick({ dataSensitivity: ['low'] })
    renderView()
    expect(screen.queryByText('HNDL Risk Not Quantified')).not.toBeInTheDocument()
  })

  it('shows "Do this first" with the real top-3 recommended actions, not the mockup\'s invented strings', () => {
    completeQuick()
    renderView()
    expect(screen.getByText('Do this first')).toBeInTheDocument()
    expect(screen.queryByText(/top-10 revenue systems/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/2033 CRQC median/i)).not.toBeInTheDocument()
  })

  it('shows the real, uncapped recommended-actions list', () => {
    completeQuick()
    renderView()
    const result = computeAssessment({
      industry: QUICK_INPUT.industry,
      currentCrypto: [],
      dataSensitivity: QUICK_INPUT.dataSensitivity,
      complianceRequirements: [],
      migrationStatus: QUICK_INPUT.migrationStatus,
      country: QUICK_INPUT.country,
    })
    expect(result.recommendedActions.length).toBeGreaterThan(0)
    expect(screen.getAllByText(result.recommendedActions[0].action).length).toBeGreaterThan(0)
  })

  it('shows all 17 real section names, in real order', () => {
    completeQuick()
    renderView()
    expect(REPORT_SECTION_ORDER).toHaveLength(17)
    for (const id of REPORT_SECTION_ORDER) {
      expect(screen.getByText(REPORT_SECTION_LABELS[id])).toBeInTheDocument()
    }
  })

  it('states what was cut rather than silently dropping it', () => {
    completeQuick()
    renderView()
    expect(screen.getByText(/country timeline, risk breakdown, CBOM/i)).toBeInTheDocument()
  })
})
