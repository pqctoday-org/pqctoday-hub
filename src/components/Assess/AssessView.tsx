// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ClipboardCheck,
  RotateCcw,
  PlayCircle,
  Zap,
  ClipboardList,
  FileBarChart,
  X,
} from 'lucide-react'
import { AssessWizard } from './AssessWizard'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import type { AssessmentMode } from '../../store/useAssessmentStore'
import { metadata } from '../../data/industryAssessConfig'
import { usePhaseFilter } from '../../hooks/usePhaseFilter'
import { FRAMEWORK_PHASES } from '../../data/frameworkPhases'
import { ASSESS_STEP_MAPPINGS } from '../../data/assessStepToCswp39'
import { usePersonaStore } from '../../store/usePersonaStore'
import { PERSONA_NAV_PATHS, PERSONA_RECOMMENDED_MODE } from '../../data/personaConfig'
import { useSeedAssessFromPersona } from '../../hooks/assessment/useSeedAssessFromPersona'
import { Button } from '../ui/button'
import { PageHeader } from '../common/PageHeader'
import { WorkflowBreadcrumb } from '../shared/WorkflowBreadcrumb'
import { LayoutDashboard } from 'lucide-react'

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

// The wizard step keys (ASSESS_STEP_MAPPINGS) are declared in the same order as
// STEP_LABELS above, so we can pair each key with its human label by position.
// Used only by the (additive) phase overlay to name the Assess steps a given
// `?phase=` exercises; it does not touch wizard behaviour.
const ASSESS_STEP_LABELS: { key: string; label: string }[] = Object.keys(ASSESS_STEP_MAPPINGS).map(
  (key, i) => ({ key, label: STEP_LABELS[i] ?? key })
)

const ModeSelector: React.FC<{
  onSelect: (mode: AssessmentMode) => void
  recommendedMode: AssessmentMode | null
}> = ({ onSelect, recommendedMode }) => (
  <div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button
        variant="ghost"
        onClick={() => onSelect('quick')}
        className="glass-panel h-auto p-6 flex-col items-start whitespace-normal hover:bg-transparent hover:border-primary/40 group"
        data-workshop-target="assess-mode-quick"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-warning/10 group-hover:bg-warning/20 transition-colors">
            <Zap className="text-warning" size={20} />
          </div>
          <span className="text-lg font-bold text-foreground">Quick</span>
          {recommendedMode === 'quick' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
              Recommended for you
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          8 questions covering your industry, crypto stack, data sensitivity, infrastructure, and
          migration status.
        </p>
        <span className="text-xs font-mono text-muted-foreground/60">~3 minutes</span>
      </Button>

      <Button
        variant="ghost"
        onClick={() => onSelect('comprehensive')}
        className="glass-panel h-auto p-6 flex-col items-start whitespace-normal hover:bg-transparent hover:border-primary/40 group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <ClipboardList className="text-primary" size={20} />
          </div>
          <span className="text-lg font-bold text-foreground">Comprehensive</span>
          {recommendedMode === 'comprehensive' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
              Recommended for you
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          13 questions including infrastructure, team capacity, crypto agility, and vendor
          dependencies for detailed migration planning.
        </p>
        <span className="text-xs font-mono text-muted-foreground/60">~5 minutes</span>
      </Button>
    </div>
  </div>
)

export const AssessView: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    assessmentStatus,
    markComplete,
    reset,
    currentStep,
    lastWizardUpdate,
    assessmentMode,
    setAssessmentMode,
  } = useAssessmentStore()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const recommendedMode = selectedPersona ? PERSONA_RECOMMENDED_MODE[selectedPersona] : null
  const [showResumeBanner, setShowResumeBanner] = useState(false)

  // Migration-Program phase overlay (additive). When `?phase=` is absent/invalid
  // `activePhase` is null and `matches()` is always true, so the page renders
  // exactly as before. When a phase is active we show a compact orienting
  // banner; the wizard itself is never altered.
  const { activePhase, matches } = usePhaseFilter()
  const phase = activePhase ? FRAMEWORK_PHASES[activePhase] : null
  const phaseSteps = activePhase
    ? ASSESS_STEP_LABELS.filter(({ key }) =>
        // eslint-disable-next-line security/detect-object-injection
        matches(ASSESS_STEP_MAPPINGS[key].frameworkPhase)
      )
    : []

  // Clear only the `phase` param, preserving every other query param (mode,
  // reset, prefs, deep-link cues) so existing deep-links keep working.
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

  // URL param `?reset=1` clears any prior assessment state. The workshop uses
  // this so the p-assess walkthrough always starts on a clean wizard regardless
  // of prior completions, "I'm not sure" toggles, or persisted answers.
  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // URL param `?mode=quick|comprehensive` forces the assessment mode (used by
  // the workshop's deep-link cues so a Quick-mode walkthrough always lands on
  // Quick mode regardless of the user's prior assessment state).
  useEffect(() => {
    const m = searchParams.get('mode')
    if (m === 'quick' || m === 'comprehensive') {
      if (assessmentMode !== m) setAssessmentMode(m)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Persona-aware mode auto-skip — when the user has a persona with a
  // recommended mode (PERSONA_RECOMMENDED_MODE) and no prior mode is set,
  // skip the ModeSelector step and drop directly into the wizard.
  // Respects:
  //   - `?mode=` URL param (handled by the effect above, wins).
  //   - `?prefs=off` URL param: shows ModeSelector even when persona
  //     resolves a recommendation (user opted out via Switch-mode link).
  //   - Prior `assessmentMode` in the persisted store (user already chose).
  //
  // Derived purely at render time (no useEffect). This avoids a race where
  // the click handler on "Switch mode" sets both `?prefs=off` AND clears
  // the mode, but an effect with stale deps re-applies the recommendation
  // before the URL update propagates. Render-time derivation reads the
  // current values atomically.
  const personaAutoSkipApplies =
    !assessmentMode &&
    !!recommendedMode &&
    searchParams.get('prefs') !== 'off' &&
    !searchParams.get('mode')
  const effectiveAssessmentMode =
    assessmentMode ?? (personaAutoSkipApplies ? recommendedMode : null)

  // Command Center is only shown to executive / architect / ops personas.
  const personaSeesBusinessCenter = selectedPersona
    ? (PERSONA_NAV_PATHS[selectedPersona]?.includes('/business') ?? false)
    : false

  useSeedAssessFromPersona()

  const handleModeSelect = (mode: AssessmentMode) => {
    setAssessmentMode(mode)
  }

  const handleComplete = () => {
    markComplete()
    navigate('/report')
  }

  // If assessment is already complete and no wizard interaction, redirect to report
  useEffect(() => {
    if (assessmentStatus === 'complete' && currentStep === 0) {
      navigate('/report', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check for saved incomplete assessment on mount
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

  return (
    <div className="animate-fade-in">
      <WorkflowBreadcrumb current="assess" />
      <PageHeader
        icon={ClipboardCheck}
        pageId="assess"
        title="PQC Risk Assessment"
        description="Answer a few questions to get a personalized quantum risk score, migration priorities, and actionable recommendations for your organization."
        dataSource={
          metadata
            ? `${metadata.filename} • Updated: ${metadata.lastUpdate.toLocaleDateString()}`
            : undefined
        }
        shareTitle="PQC Risk Assessment — Post-Quantum Cryptography Migration Tool"
        shareText="Get a personalized quantum risk score, migration priorities, and actionable recommendations for your organization."
      />

      {/* Phase overlay banner: only when `?phase=` resolves to a real phase.
          Orients the user to the active Migration-Program phase and names the
          Assess steps that phase exercises. Purely additive — non-destructive
          and the wizard below is unchanged. */}
      {phase && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
          data-testid="assess-phase-banner"
        >
          <div className="glass-panel p-4 border-l-4 border-l-primary">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {phase.number !== null ? `Phase ${phase.number} — ` : ''}
                  {phase.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{phase.tagline}</p>
                {phaseSteps.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Assess steps for this phase:{' '}
                    <span className="text-foreground/80 font-medium">
                      {phaseSteps.map((s) => s.label).join(' · ')}
                    </span>
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPhase}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
                data-testid="assess-clear-phase"
              >
                <X size={12} />
                Clear phase
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Banner: assessment already complete, link to report */}
      {assessmentStatus === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="glass-panel p-4 border-l-4 border-l-success">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-foreground">
                Your assessment is complete. View your personalized report or open the Business
                Center to plan next steps.
              </p>
              <div className="flex items-center gap-2 shrink-0">
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

      {/* Banner: resume in-progress assessment */}
      {showResumeBanner && lastWizardUpdate && assessmentStatus !== 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="glass-panel p-4 border-l-4 border-l-primary">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Resume saved assessment?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {/* eslint-disable-next-line security/detect-object-injection */}
                  You left off at step {currentStep + 1} ({STEP_LABELS[currentStep] ?? ''}) on{' '}
                  {new Date(lastWizardUpdate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  .
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
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
                  Start Over
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResumeBanner(false)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <PlayCircle size={12} />
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!effectiveAssessmentMode ? (
        <ModeSelector onSelect={handleModeSelect} recommendedMode={recommendedMode} />
      ) : (
        <>
          {/* "Switch mode" escape — always visible alongside the wizard so
              the user can change mode without picking through the store.
              Persona-auto-skipped users see it most prominently; users who
              actively chose see it as a non-intrusive secondary link. */}
          {recommendedMode && (
            <div className="mb-3 text-xs text-muted-foreground">
              You're in <span className="font-medium">{effectiveAssessmentMode}</span> mode.{' '}
              <Button
                variant="link"
                className="text-xs h-auto p-0 align-baseline"
                onClick={() => {
                  // Set ?prefs=off so the render-time auto-skip computes
                  // `effectiveAssessmentMode === null` and ModeSelector
                  // renders again. Also clear the persisted assessmentMode
                  // so the user can re-pick (the wizard reads from `mode`
                  // prop which derives from effectiveAssessmentMode).
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev)
                      next.set('prefs', 'off')
                      return next
                    },
                    { replace: true }
                  )
                  setAssessmentMode(null)
                }}
                data-testid="assess-switch-mode"
              >
                Switch to {effectiveAssessmentMode === 'quick' ? 'comprehensive' : 'quick'} mode
              </Button>
            </div>
          )}
          <AssessWizard onComplete={handleComplete} mode={effectiveAssessmentMode} />
        </>
      )}
    </div>
  )
}
