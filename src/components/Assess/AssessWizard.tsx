import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import { usePersonaStore } from '../../store/usePersonaStore'
import { REGION_COUNTRIES_MAP } from '../../data/personaConfig'

import type { AssessmentMode } from '../../store/useAssessmentStore'

import { StepIndicator } from './steps/StepIndicator'
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
import { Step12VendorDependency } from './steps/Step12VendorDependency'
import { Step13TimelinePressure } from './steps/Step13TimelinePressure'

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
  'Vendors',
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
      s.currentCrypto.length > 0 || s.cryptoUnknown,
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
      !!s.migrationStatus,
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
      !!s.systemCount && !!s.teamSize,
  },
  {
    key: 'agility',
    component: <Step10CryptoAgility />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      !!s.cryptoAgility,
  },
  { key: 'infra', component: <Step11Infrastructure />, canProceed: () => true },
  {
    key: 'vendors',
    component: <Step12VendorDependency />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      !!s.vendorDependency || s.vendorUnknown,
  },
  {
    key: 'timeline',
    component: <Step13TimelinePressure />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      !!s.timelinePressure,
  },
] as const

const QUICK_STEP_KEYS = new Set([
  'industry',
  'country',
  'crypto',
  'sensitivity',
  'compliance',
  'migration',
])

export const AssessWizard: React.FC<AssessWizardProps> = ({
  onComplete,
  mode = 'comprehensive',
}) => {
  const store = useAssessmentStore()
  const { currentStep, setStep, markComplete, reset } = store

  const [isGenerating, setIsGenerating] = useState(false)

  // Pre-fill industry and country from persona store when fields are blank
  const personaIndustry = usePersonaStore((s) => s.selectedIndustry)
  const personaRegion = usePersonaStore((s) => s.selectedRegion)
  useEffect(() => {
    const { industry, country, setIndustry, setCountry } = useAssessmentStore.getState()
    if (!industry && personaIndustry) setIndustry(personaIndustry)
    if (!country && personaRegion && personaRegion !== 'global') {
      const regionCountries = REGION_COUNTRIES_MAP[personaRegion]
      if (regionCountries?.[0]) setCountry(regionCountries[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const steps = useMemo(
    () => (mode === 'quick' ? ALL_STEPS.filter((s) => QUICK_STEP_KEYS.has(s.key)) : [...ALL_STEPS]),
    [mode]
  )
  const stepTitles = mode === 'quick' ? STEP_TITLES_QUICK : STEP_TITLES_FULL

  const canProceed = () => {
    // eslint-disable-next-line security/detect-object-injection
    const step = steps[currentStep]
    return step ? step.canProceed(store) : false
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setStep(currentStep + 1)
    } else {
      setIsGenerating(true)
      setTimeout(() => {
        markComplete()
        onComplete()
      }, 300)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator current={currentStep} total={steps.length} titles={stepTitles} />

      <div className="glass-panel p-6 md:p-8">
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

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 px-5 py-2 rounded-lg border border-border hover:bg-muted/10 disabled:opacity-50 transition-colors text-foreground text-sm"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <button
          onClick={reset}
          className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
          title="Clear all answers and start over"
        >
          <RotateCcw size={13} />
          Reset
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed() || isGenerating}
          className="flex items-center gap-1 px-5 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
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
        </button>
      </div>
    </div>
  )
}
