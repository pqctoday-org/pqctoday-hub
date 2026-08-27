// SPDX-License-Identifier: GPL-3.0-only
//
// AssessViewRedesign — the rebuilt /assess page (handoff: design_handoff_assess_redesign).
//
// Composition: outcome-framed track chooser → two-pane wizard (step-map rail +
// question pane with the single consolidated assist strip, reusing the real step
// components) → review → done. All legacy behaviours preserved from AssessView
// (deep links ?reset/?mode/?prefs/?phase/?step, persona auto-skip, resume/
// complete/phase banners, persona seeding, analytics, CSWP-3.9 badge). A
// completed assessment does NOT auto-redirect — the user decides.
//
// This is the DEFAULT /assess route; the previous page is preserved at
// /assess/legacy.
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import {
  ClipboardCheck,
  RotateCcw,
  PlayCircle,
  FileBarChart,
  X,
  LayoutDashboard,
} from 'lucide-react'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import type { AssessmentMode } from '../../../store/useAssessmentStore'
import { useComplianceSelectionStore } from '../../../store/useComplianceSelectionStore'
import { complianceFrameworks } from '../../../data/complianceData'
import { isSimResumePending } from '../../Simulation/simChrome'
import { metadata } from '../../../data/industryAssessConfig'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileAssessView } from '@/components/Mobile/screens/MobileAssessView'
import { usePhaseFilter } from '../../../hooks/usePhaseFilter'
import { FRAMEWORK_PHASES } from '../../../data/frameworkPhases'
import { ASSESS_STEP_MAPPINGS } from '../../../data/assessStepToCswp39'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { PERSONA_NAV_PATHS, PERSONA_RECOMMENDED_MODE } from '../../../data/personaConfig'
import { useSeedAssessFromPersona } from '../../../hooks/assessment/useSeedAssessFromPersona'
import { Button } from '../../ui/button'
import { PageHeader } from '../../common/PageHeader'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { logAssessComplete } from '../../../utils/analytics'
import { AssessTrackChooser } from './AssessTrackChooser'
import { AssessWizardScreen } from './AssessWizardScreen'
import { AssessReview } from './AssessReview'
import { AssessDone } from './AssessDone'
import { REFERENCE_ESTATES } from '@/data/assessmentScenarios'
import {
  keyAtStoreIndex,
  storeIndexOf,
  renderOrderFor,
  type AssessStepKey,
} from './assessFlowModel'

// Legacy-order step labels (the meaning of store.currentStep). Used by the
// resume banner + the phase overlay, identical to AssessView.
const STEP_LABELS = [
  'Industry',
  'Country',
  'Crypto',
  'Sensitivity',
  'Compliance',
  'Migration',
  'Use Cases',
  'Retention',
  'Credential',
  'Scale',
  'Agility',
  'Infra',
  'Timeline',
]

const ASSESS_STEP_LABELS: { key: string; label: string }[] = Object.keys(ASSESS_STEP_MAPPINGS).map(
  (key, i) => ({ key, label: STEP_LABELS[i] ?? key })
)

export const AssessViewRedesign: React.FC<{
  /** When true, renders headless inside the simulation: breadcrumb + PageHeader +
   *  the report/business-center banners are hidden, deep-link params are backed by
   *  local state (so it never corrupts the /simulation route), and completing the
   *  assessment calls `onComplete` (close the embed) instead of navigating away. */
  simEmbed?: boolean
  onComplete?: () => void
}> = ({ simEmbed = false, onComplete }) => {
  const isMobileShell = useIsMobileShell()
  const navigate = useNavigate()
  // In the sim embed, back the deep-link params with LOCAL state so the wizard
  // never reads/writes the /simulation route (it can't nest its own Router).
  const [realSearchParams, realSetSearchParams] = useSearchParams()
  const [embedSearchParams, setEmbedSearchParamsState] = useState(() => new URLSearchParams())
  const searchParams = simEmbed ? embedSearchParams : realSearchParams
  const setSearchParams: typeof realSetSearchParams = simEmbed
    ? (nextInit) =>
        setEmbedSearchParamsState((prev) => {
          const next = new URLSearchParams(
            typeof nextInit === 'function'
              ? (nextInit(prev) as URLSearchParams)
              : (nextInit as URLSearchParams)
          )
          return next.toString() === prev.toString() ? prev : next
        })
    : realSetSearchParams
  const {
    assessmentStatus,
    markComplete,
    reset,
    currentStep,
    setStep,
    lastWizardUpdate,
    assessmentMode,
    setAssessmentMode,
    industry,
  } = useAssessmentStore()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const { myFrameworks, snapshotFrameworks } = useComplianceSelectionStore()
  const recommendedMode = selectedPersona ? PERSONA_RECOMMENDED_MODE[selectedPersona] : null
  const [showResumeBanner, setShowResumeBanner] = useState(false)
  // Local view state: which screen of the flow is showing. A completed
  // assessment does NOT auto-jump anywhere — the user lands on the wizard (their
  // saved answers) and chooses: edit + regenerate, or use the "View Report" banner.
  // Seeded from ?screen= so a refresh on the review/done screen stays there
  // (only honored once the assessment is complete, else fall back to the wizard).
  const [screen, setScreen] = useState<'wizard' | 'review' | 'done'>(() => {
    const s = searchParams.get('screen')
    if ((s === 'review' || s === 'done') && assessmentStatus === 'complete') return s
    return 'wizard'
  })

  // Mirror the active screen into ?screen= (default 'wizard' omitted) so it's
  // refresh-restorable. The embed-aware setSearchParams keeps this off the real
  // /simulation route when embedded.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (screen === 'wizard') next.delete('screen')
        else next.set('screen', screen)
        return next
      },
      { replace: true }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // Migration-Program phase overlay (additive), identical to AssessView.
  const { activePhase, matches } = usePhaseFilter()
  const phase = activePhase ? FRAMEWORK_PHASES[activePhase] : null
  const phaseSteps = activePhase
    ? ASSESS_STEP_LABELS.filter(({ key }) =>
        // eslint-disable-next-line security/detect-object-injection
        matches(ASSESS_STEP_MAPPINGS[key].frameworkPhase)
      )
    : []

  const clearPhase = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('phase')
        return next
      },
      { replace: true }
    )
  }

  // ?reset=1 — clear prior state (workshop deep-link).
  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // ?mode=quick|comprehensive — force track.
  useEffect(() => {
    const m = searchParams.get('mode')
    if (m === 'quick' || m === 'comprehensive') {
      if (assessmentMode !== m) setAssessmentMode(m)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Persona-aware auto-skip of the chooser — render-time derivation (no effect),
  // identical to AssessView. Respects ?mode / ?prefs=off / prior mode.
  const personaAutoSkipApplies =
    !assessmentMode &&
    !!recommendedMode &&
    searchParams.get('prefs') !== 'off' &&
    !searchParams.get('mode')
  const effectiveAssessmentMode: AssessmentMode | null =
    assessmentMode ?? (personaAutoSkipApplies ? recommendedMode : null)

  const personaSeesBusinessCenter = selectedPersona
    ? (PERSONA_NAV_PATHS[selectedPersona]?.includes('/business') ?? false)
    : false

  useSeedAssessFromPersona()

  const handleStart = (mode: AssessmentMode) => {
    setAssessmentMode(mode)
  }

  /**
   * Load a reference estate and go straight to review — B+ remediation 4.4.
   *
   * Straight to REVIEW, not to the wizard: every question is already answered,
   * so walking the reader through thirteen pre-filled steps would waste their
   * time and imply they are expected to edit an estate that is deliberately
   * fixed. Review is also where they can see the whole profile at once, which
   * is what someone evaluating the tool actually wants to look at.
   */
  const handleStartScenario = (estateId: string) => {
    useAssessmentStore.getState().loadReferenceEstate(estateId)
    setScreen('review')
  }

  // Switch track from the control deck / rail. Preserve the current question
  // across the switch when it exists in the new track; otherwise restart at step 0.
  const handleSwitchTrack = (mode: AssessmentMode) => {
    if (mode === effectiveAssessmentMode) return
    const curKey = effectiveAssessmentMode
      ? keyAtStoreIndex(effectiveAssessmentMode, currentStep)
      : undefined
    setAssessmentMode(mode)
    if (curKey && renderOrderFor(mode).includes(curKey)) {
      setStep(storeIndexOf(mode, curKey))
    } else {
      setStep(0)
    }
  }

  // Last wizard step → review (no silent jump to the report).
  const goToReview = () => setScreen('review')

  // Edit a specific answer from the review screen.
  const editFromReview = (key: AssessStepKey) => {
    if (effectiveAssessmentMode) setStep(storeIndexOf(effectiveAssessmentMode, key))
    setScreen('wizard')
  }

  // Generate from review → mark complete + show the done screen (the upsell
  // lives there). The report is opened from the done screen's button.
  const generate = () => {
    // Snapshot the live CSV facts for every selected framework so the Report
    // can later detect if a deadline or label changed after this assessment.
    const snapshots = myFrameworks.flatMap((id) => {
      const fw = complianceFrameworks.find((f) => f.id === id)
      if (!fw) return []
      return [
        {
          id: fw.id,
          label: fw.label,
          deadline: fw.deadline,
          deadlineYear: fw.deadlineYear ?? undefined,
        },
      ]
    })
    snapshotFrameworks(snapshots)
    markComplete()
    logAssessComplete(selectedPersona ?? 'unknown')
    // Embedded in the sim → close back to the board (the sim owns the next move);
    // never navigate away from /simulation or show the standalone done screen.
    if (simEmbed) {
      onComplete?.()
      return
    }
    // Came from a sim run (the locked-sim gate sent the player to /assess) →
    // return to the now-unlocked simulation instead of stranding them on the
    // done/report screen. The report stays reachable from inside the sim.
    if (isSimResumePending()) {
      navigate('/simulation')
      return
    }
    setScreen('done')
  }

  // Retake from done → clear answers, back to the chooser.
  const retake = () => {
    reset()
    setAssessmentMode(null)
    setScreen('wizard')
  }

  // Fast-track upsell → switch to full track at the first full-only question.
  const continueToFull = () => {
    const firstFullOnly = renderOrderFor('comprehensive').find(
      (k) => !renderOrderFor('quick').includes(k)
    )
    setAssessmentMode('comprehensive')
    if (firstFullOnly) setStep(storeIndexOf('comprehensive', firstFullOnly))
    setScreen('wizard')
  }

  // No auto-redirect for completed assessments — the user decides what to do.

  // Resume banner for a saved in-progress assessment (<24h).
  useEffect(() => {
    if (assessmentStatus === 'complete') return
    const state = useAssessmentStore.getState()
    if (state.assessmentMode !== null && state.industry && state.lastWizardUpdate) {
      const ageMs = Date.now() - new Date(state.lastWizardUpdate).getTime()
      if (ageMs < 24 * 60 * 60 * 1000) {
        setShowResumeBanner(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line security/detect-object-injection
  const resumeStepLabel = STEP_LABELS[currentStep] ?? ''

  // Register this page's actions with the global top bar (page-action-strip
  // rollout, 2026-08-01) — info/endorse/flag render there now, not as a row
  // on the page itself. Mirrors TimelineView.tsx's pattern. Gated on
  // `!simEmbed` — PageHeader itself (and everything it used to render here)
  // was already suppressed for the embedded/sim case, so this preserves that.
  useEffect(() => {
    if (simEmbed) return
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      title: 'PQC Risk Assessment',
      dataSource: metadata
        ? `${metadata.filename} • Updated: ${metadata.lastUpdate.toLocaleDateString()}`
        : undefined,
      endorseUrl: buildEndorsementUrl({
        category: 'pqc-tool-endorsement',
        title: 'Endorse: PQC Risk Assessment',
        resourceType: 'Assess Tool',
        resourceId: 'PQC Risk Assessment',
        resourceDetails:
          '**Tool:** PQC Risk Assessment — personalized quantum risk score, migration priorities, and recommendations.',
        pageUrl: '/assess',
      }),
      endorseLabel: 'Assess Tool',
      endorseResourceType: 'Assess',
      flagUrl: buildFlagUrl({
        category: 'pqc-tool-endorsement',
        title: 'Flag: PQC Risk Assessment',
        resourceType: 'Assess Tool',
        resourceId: 'PQC Risk Assessment',
        resourceDetails:
          '**Tool:** PQC Risk Assessment — personalized quantum risk score, migration priorities, and recommendations.',
        pageUrl: '/assess',
      }),
      flagLabel: 'Assess Tool',
      flagResourceType: 'Assess',
    })
    return () => clearPageActions()
  }, [simEmbed])

  // Placed after every hook above (React rules; the desktop-only ones just
  // run and are discarded) but before the desktop JSX — a pure early return
  // with zero risk to the flag-off path (Rule 1). AssessViewRedesign is
  // rendered directly inside the simulation via simEmbed (SimulationView.tsx
  // passes it inline, no separate AssessEmbed.tsx wrapper), so simEmbed must
  // win over isMobileShell regardless of viewport width, same as Threats/
  // Library/Compliance/Migrate.
  if (isMobileShell && !simEmbed) {
    return <MobileAssessView />
  }

  return (
    <div className="animate-fade-in">
      {!simEmbed && (
        <>
          <PageHeader
            icon={ClipboardCheck}
            title="PQC Risk Assessment"
            description="Answer a few questions to get a personalized quantum risk score, migration priorities, and actionable recommendations for your organization."
          />
        </>
      )}

      {/* Phase overlay banner (additive). */}
      {phase && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
          data-testid="assess-phase-banner"
        >
          <div className="glass-panel border-l-4 border-l-primary p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {phase.number !== null ? `Phase ${phase.number} — ` : ''}
                  {phase.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{phase.tagline}</p>
                {phaseSteps.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Assess steps for this phase:{' '}
                    <span className="font-medium text-foreground/80">
                      {phaseSteps.map((s) => s.label).join(' · ')}
                    </span>
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPhase}
                className="shrink-0 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                data-testid="assess-clear-phase"
              >
                <X size={12} />
                Clear phase
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Already-complete banner — lets a returning user choose: edit the
          answers below, or jump to their existing report. Hidden on the
          review/done screens (which carry their own report CTA). */}
      {!simEmbed && assessmentStatus === 'complete' && screen === 'wizard' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="glass-panel border-l-4 border-l-success p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-foreground">
                Your assessment is complete. Edit any answer below to update it, view your
                personalized report, or open the Business Center to plan next steps.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/report')}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <FileBarChart size={12} />
                  View Report
                </Button>
                {personaSeesBusinessCenter && (
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => navigate('/business')}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <LayoutDashboard size={12} />
                    Command Center
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Resume banner — Continue-first hierarchy. */}
      {showResumeBanner &&
        lastWizardUpdate &&
        assessmentStatus !== 'complete' &&
        screen === 'wizard' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="glass-panel border-l-4 border-l-primary p-4">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-foreground">Resume saved assessment?</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    You left off at step {currentStep + 1} ({resumeStepLabel}) on{' '}
                    {new Date(lastWizardUpdate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    .
                  </p>
                </div>
                <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResumeBanner(false)}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <PlayCircle size={12} />
                    Continue
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      reset()
                      setShowResumeBanner(false)
                    }}
                    className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <RotateCcw size={12} />
                    Start over
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      {/* B+ remediation 4.4 (2026-08-10), placement corrected by a rendered-UI
          probe. The reference-estate offer lives on the track chooser — but
          `personaAutoSkipApplies` skips that chooser for EVERY persona with a
          recommended mode, which is all six. So the offer was unreachable for
          exactly the readers it was written for.

          Repeated here, once, at the very start of an untouched wizard: same
          problem the review named (a reader asked to describe an estate they do
          not have), and this is where they actually meet it. It disappears the
          moment they answer anything, so it never sits over work in progress. */}
      {effectiveAssessmentMode &&
        screen === 'wizard' &&
        currentStep === 0 &&
        assessmentStatus !== 'complete' &&
        !industry && (
          <div className="mb-4 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                No estate of your own to describe?
              </span>{' '}
              Assess a documented example organisation instead — every question pre-answered, and
              the report says on its face that it came from a reference estate.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {REFERENCE_ESTATES.map((estate) => (
                <Button
                  key={estate.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartScenario(estate.id)}
                  title={estate.basis}
                >
                  {estate.label}
                </Button>
              ))}
            </div>
          </div>
        )}

      {!effectiveAssessmentMode ? (
        <AssessTrackChooser
          onStart={handleStart}
          onStartScenario={handleStartScenario}
          recommendedMode={recommendedMode}
        />
      ) : screen === 'review' ? (
        <AssessReview
          mode={effectiveAssessmentMode}
          onEdit={editFromReview}
          onBack={() => setScreen('wizard')}
          onGenerate={generate}
        />
      ) : screen === 'done' ? (
        <AssessDone
          mode={effectiveAssessmentMode}
          onViewReport={() => navigate('/report')}
          onRetake={retake}
          onContinueToFull={continueToFull}
          onPlaySimulation={() => navigate('/simulation')}
        />
      ) : (
        <AssessWizardScreen
          mode={effectiveAssessmentMode}
          onComplete={goToReview}
          onExitToChooser={() => setAssessmentMode(null)}
          onSwitchTrack={handleSwitchTrack}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
        />
      )}
    </div>
  )
}
