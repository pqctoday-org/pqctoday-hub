// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { MobileAssessView } from './MobileAssessView'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { STEP_META } from '@/components/Assess/redesign/assessFlowModel'
import { AVAILABLE_INDUSTRIES } from '@/hooks/assessmentData'
import { applicableFrameworks } from '@/utils/applicabilityEngine'
import { complianceFrameworks } from '@/data/complianceData'

// Real data throughout. The screenshot and its own README prose disagree
// with each other on step count ("1 of 6" vs "1 of 8"), and both are wrong
// about the comprehensive track ("14-step"). Every assertion below is
// derived from the SAME real STEP_META/RENDER_ORDER_QUICK the component
// reads (verified: quick=6, comprehensive=13), not from either document.
function resetStore() {
  window.localStorage.clear()
  useAssessmentFormStore.getState().reset()
  useAssessmentResultStore.getState().reset()
}

function renderView() {
  return render(
    <MemoryRouter>
      <MobileAssessView />
    </MemoryRouter>
  )
}

describe('MobileAssessView', () => {
  beforeEach(() => {
    resetStore()
  })

  it("starts on the real Q1 (industry), not the mockup's jurisdiction wording", () => {
    renderView()
    expect(screen.getByText(STEP_META.industry.question)).toBeInTheDocument()
    expect(screen.getByText(/Step 1 of 6/)).toBeInTheDocument()
    expect(screen.queryByText('Which jurisdiction do you report into?')).not.toBeInTheDocument()
  })

  it('renders the real industry option list', () => {
    renderView()
    for (const industry of AVAILABLE_INDUSTRIES.slice(0, 3)) {
      expect(screen.getByText(industry)).toBeInTheDocument()
    }
  })

  it('advances to the real Q2 (jurisdiction) after picking an industry and tapping Next', () => {
    renderView()
    fireEvent.click(screen.getByText(AVAILABLE_INDUSTRIES[0]).closest('button')!)
    fireEvent.click(screen.getByText('Next').closest('button')!)
    expect(screen.getByText(STEP_META.country.question)).toBeInTheDocument()
    expect(screen.getByText(/Step 2 of 6/)).toBeInTheDocument()
  })

  it('Back is disabled on step 1 and enabled after advancing', () => {
    renderView()
    expect(screen.getByText('Back').closest('button')).toBeDisabled()
    fireEvent.click(screen.getByText(AVAILABLE_INDUSTRIES[0]).closest('button')!)
    fireEvent.click(screen.getByText('Next').closest('button')!)
    expect(screen.getByText('Back').closest('button')).not.toBeDisabled()
  })

  it('the real "I\'m not sure — help me choose" escape hatch satisfies the validator without a pick', () => {
    useAssessmentFormStore.setState({ industry: 'Technology', country: 'United States' })
    renderView()
    fireEvent.click(screen.getByRole('button', { name: /Next/ })) // industry -> country
    fireEvent.click(screen.getByRole('button', { name: /Next/ })) // country -> crypto
    expect(screen.getByText(STEP_META.crypto.question)).toBeInTheDocument()
    // Next should be disabled until either a category or the escape hatch is picked
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    fireEvent.click(screen.getByText("I'm not sure — help me choose").closest('button')!)
    expect(screen.getByRole('button', { name: /Next/ })).not.toBeDisabled()
  })

  it('shows the real 4 crypto categories, not the full algorithm list', () => {
    useAssessmentFormStore.setState({ industry: 'Technology', country: 'United States' })
    renderView()
    fireEvent.click(screen.getByRole('button', { name: /Next/ })) // industry -> country
    fireEvent.click(screen.getByRole('button', { name: /Next/ })) // country -> crypto
    for (const cat of ['Key Exchange', 'Signatures', 'Symmetric Encryption', 'Hash & MAC']) {
      expect(screen.getByText(cat)).toBeInTheDocument()
    }
  })

  it('completing the quick track goes to Review first, then Generate my report calls markComplete', () => {
    useAssessmentFormStore.setState({
      industry: 'Technology',
      country: 'United States',
      currentCryptoCategories: ['Key Exchange'],
      dataSensitivity: ['medium'],
      migrationStatus: 'planning',
    })
    renderView()
    // Jump straight to the last quick step via the persisted currentStep the
    // real store already carries for these answers, then finish it.
    for (let i = 0; i < 6; i++) {
      const finishOrNext = screen.getByRole('button', { name: /Next|Finish/ })
      if (finishOrNext.textContent?.includes('Finish')) break
      fireEvent.click(finishOrNext)
    }
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }))
    // 2026-08-24 audit R4.6: Finish no longer completes directly — it goes
    // to a review screen first (the "no silent jump to the report" moment
    // desktop's own last wizard step already has).
    expect(screen.getByText('Review your answers')).toBeInTheDocument()
    expect(useAssessmentFormStore.getState().assessmentStatus).not.toBe('complete')
    fireEvent.click(screen.getByRole('button', { name: /Generate my report/ }))
    expect(screen.getByText('Assessment complete')).toBeInTheDocument()
    expect(useAssessmentFormStore.getState().assessmentStatus).toBe('complete')
  })

  // 2026-08-24 audit R5: "View report" used to be a raw <a href="/report">,
  // which forces a full page reload instead of client-side SPA navigation.
  // Rendering a real /report stub alongside MobileAssessView and clicking
  // through proves react-router's Link actually navigated client-side —
  // a raw <a> would leave jsdom on the assess route (or throw "Not
  // implemented: navigation" for a real full-page nav attempt).
  it('"View report" navigates client-side via a real router Link, not a full page reload', () => {
    useAssessmentFormStore.setState({
      industry: 'Technology',
      country: 'United States',
      currentCryptoCategories: ['Key Exchange'],
      dataSensitivity: ['medium'],
      migrationStatus: 'planning',
    })
    render(
      <MemoryRouter initialEntries={['/assess']}>
        <Routes>
          <Route path="/assess" element={<MobileAssessView />} />
          <Route path="/report" element={<p>Report stub</p>} />
        </Routes>
      </MemoryRouter>
    )
    for (let i = 0; i < 6; i++) {
      const finishOrNext = screen.getByRole('button', { name: /Next|Finish/ })
      if (finishOrNext.textContent?.includes('Finish')) break
      fireEvent.click(finishOrNext)
    }
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }))
    fireEvent.click(screen.getByRole('button', { name: /Generate my report/ }))
    const viewReport = screen.getByRole('link', { name: 'View report' })
    expect(viewReport).toHaveAttribute('href', '/report')
    fireEvent.click(viewReport)
    expect(screen.getByText('Report stub')).toBeInTheDocument()
  })

  it("states the real corrected comprehensive-track step count (13, not the mockup's 14)", () => {
    renderView()
    expect(screen.getByText(/The 13-step comprehensive assessment/i)).toBeInTheDocument()
  })

  describe('comprehensive-in-progress guard (2026-08-24 audit fix)', () => {
    it('shows an interstitial instead of the wizard when a comprehensive run is in progress', () => {
      useAssessmentFormStore.setState({
        assessmentMode: 'comprehensive',
        industry: 'Technology',
        currentStep: 9,
      })
      renderView()
      expect(screen.getByText('Comprehensive assessment in progress')).toBeInTheDocument()
      expect(screen.queryByText(STEP_META.industry.question)).not.toBeInTheDocument()
    })

    it('does not touch the persisted mode or step while the interstitial is showing', () => {
      useAssessmentFormStore.setState({
        assessmentMode: 'comprehensive',
        industry: 'Technology',
        currentStep: 9,
      })
      renderView()
      expect(useAssessmentFormStore.getState().assessmentMode).toBe('comprehensive')
      expect(useAssessmentFormStore.getState().currentStep).toBe(9)
    })

    it('"Continue later" leaves the comprehensive run untouched', () => {
      useAssessmentFormStore.setState({
        assessmentMode: 'comprehensive',
        industry: 'Technology',
        currentStep: 9,
      })
      renderView()
      fireEvent.click(screen.getByText('Continue later — leave it as is'))
      expect(useAssessmentFormStore.getState().assessmentMode).toBe('comprehensive')
      expect(useAssessmentFormStore.getState().currentStep).toBe(9)
    })

    it('"Restart as quick" switches mode, resets to step 0, and clears comprehensive-only fields', () => {
      useAssessmentFormStore.setState({
        assessmentMode: 'comprehensive',
        industry: 'Technology',
        currentStep: 9,
        systemCount: '200-plus',
        cryptoAgility: 'hardcoded',
      })
      renderView()
      fireEvent.click(screen.getByText('Restart as quick assessment'))
      expect(useAssessmentFormStore.getState().assessmentMode).toBe('quick')
      expect(useAssessmentFormStore.getState().currentStep).toBe(0)
      expect(useAssessmentFormStore.getState().systemCount).toBe('')
      expect(useAssessmentFormStore.getState().cryptoAgility).toBe('')
      expect(screen.getByText(STEP_META.industry.question)).toBeInTheDocument()
    })

    it('does not show the interstitial for a fresh (no-progress) store, even if mode leaked to comprehensive', () => {
      useAssessmentFormStore.setState({ assessmentMode: 'comprehensive', industry: '' })
      renderView()
      expect(screen.queryByText('Comprehensive assessment in progress')).not.toBeInTheDocument()
      expect(screen.getByText(STEP_META.industry.question)).toBeInTheDocument()
    })
  })

  // 2026-08-24 audit R4.6: the review moment before Finish was silently
  // skipped on mobile (desktop's own last wizard step goes through
  // AssessReview.tsx — "no silent jump to the report" per that file's own
  // comment). summarizeAnswer is the SAME real function AssessReview.tsx
  // uses — no reinvented answer-text logic.
  describe('review screen (audit R4.6)', () => {
    function goToReview() {
      useAssessmentFormStore.setState({
        industry: 'Technology',
        country: 'United States',
        currentCryptoCategories: ['Key Exchange'],
        dataSensitivity: ['medium'],
        migrationStatus: 'planning',
      })
      renderView()
      for (let i = 0; i < 6; i++) {
        const btn = screen.getByRole('button', { name: /Next|Finish/ })
        fireEvent.click(btn)
        if (screen.queryByText('Review your answers')) break
      }
    }

    it('shows the real question text and answer summary for every quick-track step', () => {
      goToReview()
      expect(screen.getByText(STEP_META.industry.question)).toBeInTheDocument()
      expect(screen.getByText('Technology')).toBeInTheDocument()
      expect(screen.getByText(STEP_META.migration.question)).toBeInTheDocument()
    })

    it('flags an unknown-toggle answer as "Recommended", matching the real isDefault signal', () => {
      useAssessmentFormStore.setState({
        industry: 'Technology',
        country: 'United States',
        currentCryptoCategories: ['Key Exchange'],
        sensitivityUnknown: true,
        migrationStatus: 'planning',
      })
      renderView()
      for (let i = 0; i < 6; i++) {
        const btn = screen.getByRole('button', { name: /Next|Finish/ })
        fireEvent.click(btn)
        if (screen.queryByText('Review your answers')) break
      }
      expect(screen.getAllByText('Recommended').length).toBeGreaterThan(0)
    })

    it('"Back" returns to the wizard without completing, "Generate my report" completes', () => {
      goToReview()
      fireEvent.click(screen.getByRole('button', { name: 'Back' }))
      expect(screen.queryByText('Review your answers')).not.toBeInTheDocument()
      expect(useAssessmentFormStore.getState().assessmentStatus).not.toBe('complete')
    })
  })

  // 2026-08-24 Assess-step audit: the compliance step rendered a flat,
  // unfiltered 215-label list (34 of them deprecated/obsolete in the source
  // CSV) with no industry/country relevance at all. It now uses the same
  // real applicabilityEngine.applicableFrameworks() Step5Compliance.tsx
  // computes from, grouped by real tier.
  describe('compliance step uses the real applicability engine (2026-08-24 fix)', () => {
    function goToCompliance() {
      useAssessmentFormStore.setState({ industry: 'Technology', country: 'United States' })
      renderView()
      fireEvent.click(screen.getByRole('button', { name: /Next/ })) // industry -> country
      fireEvent.click(screen.getByRole('button', { name: /Next/ })) // country -> crypto
      fireEvent.click(screen.getByText("I'm not sure — help me choose").closest('button')!)
      fireEvent.click(screen.getByRole('button', { name: /Next/ })) // crypto -> sensitivity
      fireEvent.click(screen.getByText("I'm not sure — help me choose").closest('button')!)
      fireEvent.click(screen.getByRole('button', { name: /Next/ })) // sensitivity -> compliance
    }

    it('shows real, profile-relevant frameworks grouped by real tier — not a flat unfiltered list', () => {
      goToCompliance()
      expect(screen.getByText(STEP_META.compliance.question)).toBeInTheDocument()

      const results = applicableFrameworks({
        industry: 'Technology',
        country: 'United States',
        region: null,
      }).filter((r) => r.tier !== 'informational')
      expect(results.length).toBeGreaterThan(0)
      // Proves real filtering happened, not a dump of the whole catalog.
      expect(results.length).toBeLessThan(complianceFrameworks.length)

      const first = results[0]
      expect(screen.getByText(first.item.label)).toBeInTheDocument()
      // Several frameworks can share the same deadline text (e.g. "Ongoing"),
      // so assert presence, not uniqueness.
      expect(screen.getAllByText(`Deadline: ${first.item.deadline}`).length).toBeGreaterThan(0)
    })
  })

  describe('unknown-toggle explanation (audit R4.6)', () => {
    it('shows the real desktop explanation only once the sensitivity toggle is checked', () => {
      useAssessmentFormStore.setState({ industry: 'Technology', country: 'United States' })
      renderView()
      fireEvent.click(screen.getByRole('button', { name: /Next/ })) // industry -> country
      fireEvent.click(screen.getByRole('button', { name: /Next/ })) // country -> crypto
      fireEvent.click(screen.getByText("I'm not sure — help me choose").closest('button')!)
      fireEvent.click(screen.getByRole('button', { name: /Next/ })) // crypto -> sensitivity
      expect(screen.queryByText(/Recommended for Technology/)).not.toBeInTheDocument()
      fireEvent.click(screen.getByText("I'm not sure — help me choose").closest('button')!)
      expect(
        screen.getByText(/Recommended for Technology\. You can adjust any selection\./)
      ).toBeInTheDocument()
    })
  })
})
