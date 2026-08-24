// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileCommandCenterView } from './MobileCommandCenterView'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { CSWP39_ZONE_DETAILS } from '@/data/cswp39ZoneData'

// Real data throughout. The mockup's framing (5 step-badges, an "N open ·
// nearest is X" strip, a live Cyber Insurance Lens) doesn't match live code
// (confirmed by research before building) — every assertion below is
// derived from the SAME real hooks/data the component reads.
function resetStore() {
  window.localStorage.clear()
  useAssessmentFormStore.getState().reset()
  useAssessmentResultStore.getState().reset()
}

function completeMinimalAssessment() {
  useAssessmentFormStore.setState({
    industry: 'Technology',
    country: 'United States',
    dataSensitivity: ['medium'],
    migrationStatus: 'not-started',
    assessmentStatus: 'complete',
  })
}

function renderView() {
  return render(
    <MemoryRouter>
      <MobileCommandCenterView />
    </MemoryRouter>
  )
}

describe('MobileCommandCenterView', () => {
  beforeEach(() => {
    resetStore()
  })

  it('shows the real WelcomeState (not a tiered dashboard) when nothing has been started', () => {
    renderView()
    expect(screen.getByText('Welcome to your PQC Command Center')).toBeInTheDocument()
    expect(screen.getByText("What's at risk?")).toBeInTheDocument()
    expect(screen.getByText('Who owns it?')).toBeInTheDocument()
  })

  it('shows the tiered dashboard once the reader has started (assessment complete)', () => {
    completeMinimalAssessment()
    renderView()
    expect(screen.queryByText('Welcome to your PQC Command Center')).not.toBeInTheDocument()
    expect(screen.getByText('Your next steps')).toBeInTheDocument()
  })

  it("shows all 6 real zones, not the mockup's 5 step-badges", () => {
    completeMinimalAssessment()
    renderView()
    for (const zone of Object.values(CSWP39_ZONE_DETAILS)) {
      expect(screen.getByText(zone.title)).toBeInTheDocument()
    }
    expect(Object.keys(CSWP39_ZONE_DETAILS)).toHaveLength(6)
  })

  it('expanding a zone reveals its real description and CSWP.39 reference', () => {
    completeMinimalAssessment()
    renderView()
    fireEvent.click(screen.getByText('Governance').closest('button')!)
    expect(screen.getByText(CSWP39_ZONE_DETAILS.governance.what)).toBeInTheDocument()
    expect(screen.getByText(CSWP39_ZONE_DETAILS.governance.cswpRef)).toBeInTheDocument()
  })

  it('does not show the Cyber Insurance Lens (real, but removed from /business on desktop)', () => {
    completeMinimalAssessment()
    renderView()
    expect(screen.queryByText(/cyber insurance/i)).not.toBeInTheDocument()
  })

  it("states the real 37-tool count, not the mockup's stale 34", () => {
    completeMinimalAssessment()
    renderView()
    expect(BUSINESS_TOOLS.length).toBeGreaterThan(0)
    expect(
      screen.getByText(new RegExp(`The ${BUSINESS_TOOLS.length} planning tools`))
    ).toBeInTheDocument()
    expect(screen.queryByText(/The 34 planning tools/)).not.toBeInTheDocument()
  })

  it('shows a "what\'s missing for the next tier" hint that doesn\'t exist on desktop, derived from real thresholds', () => {
    completeMinimalAssessment()
    renderView()
    fireEvent.click(screen.getByText('Assets').closest('button')!)
    // Nothing has been bookmarked/documented for Assets, so it isn't at
    // Tier 4 yet — a real, non-empty next-tier hint should surface.
    expect(screen.getByText(/^For (Risk-Informed|Repeatable|Adaptive):/)).toBeInTheDocument()
  })
})
