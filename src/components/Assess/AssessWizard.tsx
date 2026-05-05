// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, RotateCcw, Info, Link2 } from 'lucide-react'
import { Button } from '../ui/button'
import toast from 'react-hot-toast'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { usePersonaStore } from '../../store/usePersonaStore'

import type { AssessmentMode } from '../../store/useAssessmentStore'

import { StepIndicator } from './steps/StepIndicator'
import { StepPersonaInfoModal } from './steps/StepPersonaInfoModal'
import { Step1Industry } from './steps/Step1Industry'
import { Step2Country } from './steps/Step2Country'
import { Step3Crypto } from './steps/Step3Crypto'
import { Step4Sensitivity } from './steps/Step4Sensitivity'
import { Step5Compliance } from './steps/Step5Compliance'
import { Step6Migration } from './steps/Step6Migration'
import { Step7UseCases } from './steps/Step7UseCases'
import { Step8DataRetention } from './steps/Step8DataRetention'
import { StepCredentialLifetime } from './steps/StepCredentialLifetime'
import { Step9OrgScale } from './steps/Step9OrgScale'
import { Step10CryptoAgility } from './steps/Step10CryptoAgility'
import { Step11Infrastructure } from './steps/Step11Infrastructure'
import { Step13TimelinePressure } from './steps/Step13TimelinePressure'
import { CSWP39StepBadge } from '../shared/CSWP39StepBadge'
import { ASSESS_STEP_TO_CSWP39 } from '../../data/assessStepToCswp39'
import {
  logAssessStart,
  logAssessStep,
  logAssessComplete,
  logAssessReset,
} from '../../utils/analytics'

const STEP_TITLES_FULL = [
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

const STEP_TITLES_QUICK = [
  'Industry',
  'Country',
  'Crypto',
  'Sensitivity',
  'Compliance',
  'Migration',
]

interface AssessWizardProps {
  onComplete: () => void
  mode?: AssessmentMode
}

/**
 * Steps that support "I don't know" auto-suggestion, categorized by technical depth.
 * - 'technical': auto-suggested for 'new' AND 'basics' proficiency
 * - 'general': auto-suggested only for 'new' proficiency
 */
const PROFICIENCY_SUGGEST_MAP: Record<string, 'technical' | 'general'> = {
  crypto: 'technical',
  scale: 'technical',
  agility: 'technical',
  infra: 'technical',
  sensitivity: 'general',
  compliance: 'general',
  migration: 'general',
  'use-cases': 'general',
  retention: 'general',
  'credential-lifetime': 'general',
  timeline: 'general',
}

const ALL_STEPS = [
  {
    key: 'industry',
    component: <Step1Industry />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      !!s.industry,
  },
  {
    key: 'country',
    component: <Step2Country />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      !!s.country,
  },
  {
    key: 'crypto',
    component: <Step3Crypto />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      s.currentCryptoCategories.length > 0 || s.cryptoUnknown,
  },
  {
    key: 'sensitivity',
    component: <Step4Sensitivity />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      s.dataSensitivity.length > 0 || s.sensitivityUnknown,
  },
  { key: 'compliance', component: <Step5Compliance />, canProceed: () => true },
  {
    key: 'migration',
    component: <Step6Migration />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      !!s.migrationStatus || s.migrationUnknown,
  },
  { key: 'use-cases', component: <Step7UseCases />, canProceed: () => true },
  {
    key: 'retention',
    component: <Step8DataRetention />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      s.dataRetention.length > 0 || s.retentionUnknown,
  },
  {
    key: 'credential-lifetime',
    component: <StepCredentialLifetime />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      s.credentialLifetime.length > 0 || s.credentialLifetimeUnknown,
  },
  {
    key: 'scale',
    component: <Step9OrgScale />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      (!!s.systemCount && !!s.teamSize) || s.scaleUnknown,
  },
  {
    key: 'agility',
    component: <Step10CryptoAgility />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      !!s.cryptoAgility || s.agilityUnknown,
  },
  { key: 'infra', component: <Step11Infrastructure />, canProceed: () => true },
  {
    key: 'timeline',
    component: <Step13TimelinePressure />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      !!s.timelinePressure || s.timelineUnknown,
  },
] as const

// Quick mode covers all 5 CSWP.39 process steps with minimal user input:
//   - govern: industry, country, compliance
//   - inventory: crypto, sensitivity
//   - identify-gaps: infra
//   - prioritise: timeline
//   - implement: migration
const QUICK_STEP_KEYS = new Set([
  'industry',
  'country',
  'crypto',
  'sensitivity',
  'compliance',
  'infra',
  'migration',
  'timeline',
])

export const AssessWizard: React.FC<AssessWizardProps> = ({
  onComplete,
  mode = 'comprehensive',
}) => {
  const [searchParams] = useSearchParams()
  const store = useAssessmentStore()
  const { currentStep, setStep, markComplete, reset } = store

  const [isGenerating, setIsGenerating] = useState(false)
  const [infoModalStep, setInfoModalStep] = useState<string | null>(null)

  // Deep link: ?step=<n> jumps to a specific wizard step (0-based index)
  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam !== null) {
      const steps =
        mode === 'quick' ? ALL_STEPS.filter((s) => QUICK_STEP_KEYS.has(s.key)) : ALL_STEPS
      const parsed = parseInt(stepParam, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed < steps.length) {
        setStep(parsed)
      }
    }
  }, [searchParams, setStep, mode])

  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  const steps = useMemo(
    () => (mode === 'quick' ? ALL_STEPS.filter((s) => QUICK_STEP_KEYS.has(s.key)) : [...ALL_STEPS]),
    [mode]
  )
  const stepTitles = mode === 'quick' ? STEP_TITLES_QUICK : STEP_TITLES_FULL

  // Auto-suggest "I don't know" based on persona role + proficiency level.
  // Executive persona always suggests on crypto/agility/infra (backward compat).
  // Proficiency 'new' suggests on ALL steps with unknown support.
  // Proficiency 'basics' suggests only on technical steps.
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  useEffect(() => {
    const s = useAssessmentStore.getState()
    // eslint-disable-next-line security/detect-object-injection
    const stepKey = steps[currentStep]?.key
    if (!stepKey) return

    // Executive persona always suggests on the 3 most technical steps
    const isExecutiveSuggest =
      selectedPersona === 'executive' &&
      (stepKey === 'crypto' || stepKey === 'scale' || stepKey === 'agility' || stepKey === 'infra')

    // Proficiency-based suggestion: 'technical' steps for basics+new, 'general' for new only
    // eslint-disable-next-line security/detect-object-injection
    const stepCategory = PROFICIENCY_SUGGEST_MAP[stepKey]
    const isProficiencySuggest =
      stepCategory !== undefined &&
      (experienceLevel === 'curious' ||
        (experienceLevel === 'basics' && stepCategory === 'technical'))

    if (!isExecutiveSuggest && !isProficiencySuggest) return

    // Apply auto-suggestion (only when user hasn't already made a selection)
    switch (stepKey) {
      case 'crypto':
        if (
          s.currentCryptoCategories.length === 0 &&
          s.currentCrypto.length === 0 &&
          !s.cryptoUnknown
        )
          s.setCryptoUnknown(true)
        break
      case 'sensitivity':
        if (s.dataSensitivity.length === 0 && !s.sensitivityUnknown) s.setSensitivityUnknown(true)
        break
      case 'compliance':
        if (s.complianceRequirements.length === 0 && !s.complianceUnknown)
          s.setComplianceUnknown(true)
        break
      case 'migration':
        if (!s.migrationStatus && !s.migrationUnknown) s.setMigrationUnknown(true)
        break
      case 'use-cases':
        if (s.cryptoUseCases.length === 0 && !s.useCasesUnknown) s.setUseCasesUnknown(true)
        break
      case 'retention':
        if (s.dataRetention.length === 0 && !s.retentionUnknown) s.setRetentionUnknown(true)
        break
      case 'credential-lifetime':
        if (s.credentialLifetime.length === 0 && !s.credentialLifetimeUnknown)
          s.setCredentialLifetimeUnknown(true)
        break
      case 'scale':
        if (!s.systemCount && !s.teamSize && !s.scaleUnknown) s.setScaleUnknown(true)
        break
      case 'agility':
        if (!s.cryptoAgility && !s.agilityUnknown) s.setAgilityUnknown(true)
        break
      case 'infra':
        if (s.infrastructure.length === 0 && !s.infrastructureUnknown)
          s.setInfrastructureUnknown(true)
        break
      case 'timeline':
        if (!s.timelinePressure && !s.timelineUnknown) s.setTimelineUnknown(true)
        break
    }
  }, [currentStep, selectedPersona, experienceLevel, steps])

  const canProceed = () => {
    // eslint-disable-next-line security/detect-object-injection
    const step = steps[currentStep]
    return step ? step.canProceed(store) : false
  }

  const handleNext = () => {
    if (currentStep === 0) {
      logAssessStart()
    }
    const stepLabel = stepTitles[currentStep] ?? String(currentStep + 1)
    logAssessStep(currentStep + 1, stepLabel)
    if (currentStep < steps.length - 1) {
      setStep(currentStep + 1)
    } else {
      setIsGenerating(true)
      setTimeout(() => {
        markComplete()
        logAssessComplete(selectedPersona ?? 'unknown')
        onComplete()
      }, 300)
    }
  }

  const stepsLeft = steps.length - 1 - currentStep
  const secLeft = stepsLeft * (mode === 'quick' ? 20 : 23)
  const mobileTimeLabel =
    stepsLeft === 0
      ? 'Last step'
      : secLeft >= 60
        ? `~${Math.ceil(secLeft / 60)} min remaining`
        : '< 1 min remaining'

  return (
    <div>
      <StepIndicator
        current={currentStep}
        total={steps.length}
        titles={stepTitles}
        onStepClick={(step) => setStep(step)}
        timeLabel={mobileTimeLabel}
      />

      <div className="glass-panel p-6 md:p-8">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            {stepsLeft === 0 ? (
              <span className="text-xs text-primary font-medium">Last step</span>
            ) : (
              <span className="text-xs text-muted-foreground/70">{mobileTimeLabel}</span>
            )}
            {(() => {
              // eslint-disable-next-line security/detect-object-injection
              const stepKey = steps[currentStep]?.key
              const cswp = stepKey ? ASSESS_STEP_TO_CSWP39[stepKey] : undefined
              return cswp ? (
                <CSWP39StepBadge
                  stepId={cswp}
                  hint={`This wizard step feeds the CSWP.39 ${cswp} step on the Command Center.`}
                />
              ) : null
            })()}
          </div>
          <Button
            variant="ghost"
            onClick={() => setInfoModalStep(steps[currentStep]?.key ?? null)}
            className="p-2 min-h-[44px] min-w-[44px] h-auto w-auto rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
            aria-label="How this step is personalized"
            title="How this step is personalized"
          >
            <Info size={14} />
          </Button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* eslint-disable-next-line security/detect-object-injection */}
            {steps[currentStep]?.component}
          </motion.div>
        </AnimatePresence>
      </div>

      <StepPersonaInfoModal
        stepKey={infoModalStep}
        open={!!infoModalStep}
        onClose={() => setInfoModalStep(null)}
      />

      {/* Navigation — sticky on mobile so buttons are always visible */}
      <div className="sticky bottom-0 mt-4 -mx-4 px-4 pb-4 pt-2 md:relative md:mx-0 md:px-0 md:pb-0 md:pt-0 bg-background/95 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none border-t border-border/50 md:border-0 safe-bottom">
        {!canProceed() && !isGenerating && (
          <p role="alert" className="text-xs text-status-warning text-center mb-2">
            Please complete the required selection to continue.
          </p>
        )}
        <div className="flex flex-wrap justify-between items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft size={16} />
            Previous
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              logAssessReset()
              reset()
            }}
            className="text-xs min-h-[44px] text-muted-foreground hover:text-destructive"
            title="Clear all answers and start over"
          >
            <RotateCcw size={13} />
            Reset
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              const url = new URL(window.location.href)
              url.searchParams.set('step', String(currentStep))
              navigator.clipboard.writeText(url.toString())
              toast.success('Resume link copied — your answers are saved on this device')
            }}
            className="text-xs min-h-[44px] gap-1 text-muted-foreground hover:text-primary"
            title="Copy a link to resume from this step — your answers are auto-saved locally"
          >
            <Link2 size={13} />
            Save link
          </Button>

          <Button
            variant="ghost"
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
            data-workshop-target={
              currentStep === steps.length - 1 ? 'assess-submit' : 'assess-next'
            }
            className="gap-1 font-bold"
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : currentStep === steps.length - 1 ? (
              'Generate Report'
            ) : (
              <>
                Next
                <ChevronRight size={16} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
