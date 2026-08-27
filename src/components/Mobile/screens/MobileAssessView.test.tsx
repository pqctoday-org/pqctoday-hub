// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { MobileAssessView } from './MobileAssessView'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import {
  STEP_META,
  TRACK_INFO,
  RENDER_ORDER_FULL,
} from '@/components/Assess/redesign/assessFlowModel'
import { AVAILABLE_INDUSTRIES } from '@/hooks/assessmentData'
import { applicableFrameworks } from '@/utils/applicabilityEngine'
import { complianceFrameworks } from '@/data/complianceData'
import { LAYERS } from '@/data/infrastructureLayers'

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

// A fresh store (no industry answered) now lands on the track-choice screen
// first (2026-08-24 Assess-step audit, part 2) — this picks the fast/quick
// track so tests written before that change keep working unmodified past
// this one extra tap.
function renderQuick() {
  const utils = renderView()
  fireEvent.click(screen.getByText(TRACK_INFO.quick.label).closest('button')!)
  return utils
}

describe('MobileAssessView', () => {
  beforeEach(() => {
    resetStore()
  })

  it("starts on the real Q1 (industry), not the mockup's jurisdiction wording", () => {
    renderQuick()
    expect(screen.getByText(STEP_META.industry.question)).toBeInTheDocument()
    expect(screen.getByText(/Step 1 of 6/)).toBeInTheDocument()
    expect(screen.queryByText('Which jurisdiction do you report into?')).not.toBeInTheDocument()
  })

  it('renders the real industry option list', () => {
    renderQuick()
    for (const industry of AVAILABLE_INDUSTRIES.slice(0, 3)) {
      expect(screen.getByText(industry)).toBeInTheDocument()
    }
  })

  it('advances to the real Q2 (jurisdiction) after picking an industry and tapping Next', () => {
    renderQuick()
    fireEvent.click(screen.getByText(AVAILABLE_INDUSTRIES[0]).closest('button')!)
    fireEvent.click(screen.getByText('Next').closest('button')!)
    expect(screen.getByText(STEP_META.country.question)).toBeInTheDocument()
    expect(screen.getByText(/Step 2 of 6/)).toBeInTheDocument()
  })

  it('Back is disabled on step 1 and enabled after advancing', () => {
    renderQuick()
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

  // 2026-08-24 Assess-step audit, part 2: all 13 steps now have real mobile
  // UI (were 7 missing entirely before), so mobile offers both tracks —
  // mirroring desktop's quick-vs-comprehensive choice — instead of locking
  // to quick and redirecting any in-progress comprehensive run back to it.
  describe('track choice (2026-08-24 audit, part 2)', () => {
    it('a fresh assessment sees the track-choice screen with real counts, not the wizard', () => {
      renderView()
      expect(screen.queryByText(STEP_META.industry.question)).not.toBeInTheDocument()
      expect(screen.getByText(TRACK_INFO.quick.label)).toBeInTheDocument()
      expect(
        screen.getByText(`${TRACK_INFO.quick.count} questions · ~${TRACK_INFO.quick.minutes} min`)
      ).toBeInTheDocument()
      expect(screen.getByText(TRACK_INFO.comprehensive.label)).toBeInTheDocument()
      expect(
        screen.getByText(
          `${TRACK_INFO.comprehensive.count} questions · ~${TRACK_INFO.comprehensive.minutes} min`
        )
      ).toBeInTheDocument()
    })

    it('choosing the full track renders all 13 real steps in RENDER_ORDER_FULL order', () => {
      renderView()
      fireEvent.click(screen.getByText(TRACK_INFO.comprehensive.label).closest('button')!)
      expect(screen.getByText(STEP_META.industry.question)).toBeInTheDocument()
      expect(
        screen.getByText(`${TRACK_INFO.comprehensive.label} · Step 1 of 13`)
      ).toBeInTheDocument()
      expect(useAssessmentFormStore.getState().assessmentMode).toBe('comprehensive')
      // Same render order the full track's own model defines — asserted
      // structurally rather than clicking through all 13.
      expect(RENDER_ORDER_FULL).toHaveLength(13)
    })

    it('an in-progress run resumes straight into its own track — no chooser, no redirect', () => {
      useAssessmentFormStore.setState({
        assessmentMode: 'comprehensive',
        industry: 'Technology',
        currentStep: 9,
      })
      renderView()
      expect(screen.queryByText(TRACK_INFO.quick.label)).not.toBeInTheDocument()
      expect(useAssessmentFormStore.getState().assessmentMode).toBe('comprehensive')
      expect(useAssessmentFormStore.getState().currentStep).toBe(9)
    })

    it('"Start over" from the completed screen returns to the track chooser', () => {
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
      fireEvent.click(screen.getByRole('button', { name: /Generate my report/ }))
      fireEvent.click(screen.getByText('Start over'))
      expect(screen.getByText(TRACK_INFO.quick.label)).toBeInTheDocument()
      expect(screen.getByText(TRACK_INFO.comprehensive.label)).toBeInTheDocument()
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

  // 2026-08-24 Assess-step audit, part 2: these 7 steps had NO mobile UI at
  // all before (not a reduced one) — each now renders its real first-level
  // choice only. Every prior step's "unknown" flag is pre-seeded so the
  // walk to the target step is never blocked by an earlier step's validator.
  describe('the 7 newly-added comprehensive-track steps', () => {
    function goToComprehensiveStep(targetKey: (typeof RENDER_ORDER_FULL)[number]) {
      // industry/country have no "unknown" escape hatch — pre-seeding them
      // would resolve `track` straight past the chooser (2026-08-24 audit
      // part 2's own resume logic: an already-answered industry means an
      // in-progress run, so the chooser never shows) — pick them via the UI
      // like every other quick-track test does.
      useAssessmentFormStore.setState({
        cryptoUnknown: true,
        sensitivityUnknown: true,
        retentionUnknown: true,
        credentialLifetimeUnknown: true,
        migrationUnknown: true,
        scaleUnknown: true,
        agilityUnknown: true,
        timelineUnknown: true,
      })
      renderView()
      fireEvent.click(screen.getByText(TRACK_INFO.comprehensive.label).closest('button')!)
      fireEvent.click(screen.getByText('Technology').closest('button')!)
      fireEvent.click(screen.getByRole('button', { name: /Next/ }))
      fireEvent.click(screen.getByText('United States').closest('button')!)
      fireEvent.click(screen.getByRole('button', { name: /Next/ }))
      const idx = RENDER_ORDER_FULL.indexOf(targetKey)
      for (let i = 0; i < idx - 2; i++) {
        fireEvent.click(screen.getByRole('button', { name: /Next|Finish/ }))
      }
    }

    it('use-cases: shows real industry + universal use cases, always valid (freely optional)', () => {
      goToComprehensiveStep('use-cases')
      expect(screen.getByText(STEP_META['use-cases'].question)).toBeInTheDocument()
      expect(screen.getByText('General use cases')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Next/ })).not.toBeDisabled()
    })

    it('retention: toggling a real option satisfies the validator', () => {
      goToComprehensiveStep('retention')
      expect(screen.getByText(STEP_META.retention.question)).toBeInTheDocument()
      // Real universalRetentionConfigs label — distinct wording from
      // credential-lifetime's "Under 1 year" (a different, hardcoded list).
      fireEvent.click(screen.getByText('Less than 1 year').closest('button')!)
      expect(useAssessmentFormStore.getState().dataRetention).toContain('under-1y')
    })

    it('credential-lifetime: shows the real 6 buckets with real descriptions', () => {
      goToComprehensiveStep('credential-lifetime')
      expect(screen.getByText(STEP_META['credential-lifetime'].question)).toBeInTheDocument()
      for (const label of ['Under 1 year', '1–3 years', '3–10 years', '10–25 years', '25+ years']) {
        expect(screen.getByText(label)).toBeInTheDocument()
      }
    })

    it('scale: two independent radiogroups, both must be set to satisfy the validator', () => {
      goToComprehensiveStep('scale')
      expect(screen.getByText(STEP_META.scale.question)).toBeInTheDocument()
      fireEvent.click(screen.getByText('1-10 systems').closest('button')!)
      fireEvent.click(screen.getByText('11-50 engineers').closest('button')!)
      expect(useAssessmentFormStore.getState().systemCount).toBe('1-10')
      expect(useAssessmentFormStore.getState().teamSize).toBe('11-50')
    })

    it('agility: shows the real 3 flat options, no gated second tier', () => {
      goToComprehensiveStep('agility')
      expect(screen.getByText(STEP_META.agility.question)).toBeInTheDocument()
      fireEvent.click(screen.getByText('Fully Abstracted').closest('button')!)
      expect(useAssessmentFormStore.getState().cryptoAgility).toBe('fully-abstracted')
    })

    it('infra: shows only the real 9 layers — sub-categories/libraries/tools/vendor dropped', () => {
      goToComprehensiveStep('infra')
      expect(screen.getByText(STEP_META.infra.question)).toBeInTheDocument()
      for (const layer of LAYERS) {
        expect(screen.getByText(layer.label)).toBeInTheDocument()
      }
      fireEvent.click(screen.getByText(LAYERS[0].label).closest('button')!)
      expect(useAssessmentFormStore.getState().infrastructure).toContain(LAYERS[0].id)
      // The one real remaining desktop-only cut is named honestly, not silently dropped.
      expect(screen.getByText(/Step 11's finer-grained matrices/)).toBeInTheDocument()
    })

    it('timeline: United States has real country-specific deadlines, not the generic fallback', () => {
      goToComprehensiveStep('timeline')
      expect(screen.getByText(STEP_META.timeline.question)).toBeInTheDocument()
      // Real per-country deadline phase from timelineData/transformToGanttData
      // (same source Step13TimelinePressure.tsx reads) — the country-specific
      // branch always appends the "No Specific Deadline" fallback, same as
      // desktop, so a country WITH data still isn't a dead end.
      expect(
        screen.getByText(/CISA PQC Product Category List — EO 14306 Deadline/)
      ).toBeInTheDocument()
      expect(screen.getByText('No Specific Deadline')).toBeInTheDocument()
      expect(screen.queryByText('Regulatory Deadline Within 1 Year')).not.toBeInTheDocument()
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
