import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, AlertTriangle, Info } from 'lucide-react'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import {
  AVAILABLE_INDUSTRIES,
  AVAILABLE_ALGORITHMS,
  AVAILABLE_COMPLIANCE,
} from '../../hooks/useAssessmentEngine'
import clsx from 'clsx'

const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-2 mb-6">
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className="flex items-center gap-2">
        <div
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
            i === current
              ? 'border-primary text-primary bg-primary/10'
              : i < current
                ? 'border-green-500 text-green-400 bg-green-500/10'
                : 'border-border text-muted-foreground'
          )}
        >
          {i < current ? '✓' : i + 1}
        </div>
        {i < total - 1 && (
          <div className={clsx('w-8 md:w-12 h-0.5', i < current ? 'bg-green-500' : 'bg-border')} />
        )}
      </div>
    ))}
  </div>
)

const Step1Industry = () => {
  const { industry, setIndustry } = useAssessmentStore()

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">What industry are you in?</h3>
      <p className="text-sm text-muted-foreground">
        Quantum risk varies significantly by sector. Select the industry that best describes your
        organization.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {AVAILABLE_INDUSTRIES.map((ind) => (
          <button
            key={ind}
            onClick={() => setIndustry(ind)}
            className={clsx(
              'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
              industry === ind
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {ind}
          </button>
        ))}
      </div>
    </div>
  )
}

const Step2Crypto = () => {
  const { currentCrypto, toggleCrypto } = useAssessmentStore()

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">What cryptography do you use today?</h3>
      <p className="text-sm text-muted-foreground">
        Select all algorithms currently in use across your systems. Don&apos;t worry if you&apos;re
        unsure — select the ones you know about.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {AVAILABLE_ALGORITHMS.map((algo) => {
          const isVulnerable = [
            'RSA-2048',
            'RSA-4096',
            'ECDSA P-256',
            'ECDSA P-384',
            'ECDH',
            'Ed25519',
            'DH (Diffie-Hellman)',
          ].includes(algo)
          return (
            <button
              key={algo}
              onClick={() => toggleCrypto(algo)}
              className={clsx(
                'p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center justify-between',
                currentCrypto.includes(algo)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              <span>{algo}</span>
              {isVulnerable && <AlertTriangle size={14} className="text-amber-400 shrink-0" />}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <AlertTriangle size={12} className="text-amber-400" />= Quantum-vulnerable algorithm
      </p>
    </div>
  )
}

const Step3Sensitivity = () => {
  const { dataSensitivity, setDataSensitivity } = useAssessmentStore()

  const levels = [
    {
      value: 'low' as const,
      label: 'Low',
      description: 'Public data, marketing content, non-sensitive business data',
      color: 'border-green-500 bg-green-500/10 text-green-400',
    },
    {
      value: 'medium' as const,
      label: 'Medium',
      description: 'Internal business data, employee information, general customer data',
      color: 'border-blue-500 bg-blue-500/10 text-blue-400',
    },
    {
      value: 'high' as const,
      label: 'High',
      description: 'Financial records, health data, personal identifiable information (PII)',
      color: 'border-amber-500 bg-amber-500/10 text-amber-400',
    },
    {
      value: 'critical' as const,
      label: 'Critical',
      description: 'State secrets, classified data, long-lived cryptographic keys, nuclear/defense',
      color: 'border-destructive bg-destructive/10 text-destructive',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">How sensitive is your data?</h3>
      <p className="text-sm text-muted-foreground">
        Data sensitivity determines your exposure to &ldquo;Harvest Now, Decrypt Later&rdquo; (HNDL)
        attacks.
      </p>

      <div className="glass-panel p-4 border-l-4 border-l-amber-500 mb-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-amber-400">HNDL</strong>: Adversaries collect encrypted data
            today and wait for quantum computers to decrypt it. If your data needs to remain
            confidential for 10+ years, the threat is <em>already active</em>.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => setDataSensitivity(level.value)}
            className={clsx(
              'w-full p-4 rounded-lg border text-left transition-colors',
              dataSensitivity === level.value
                ? level.color
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            <span className="font-bold text-sm">{level.label}</span>
            <p className="text-xs mt-1 opacity-80">{level.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

const Step4Compliance = () => {
  const { complianceRequirements, toggleCompliance } = useAssessmentStore()

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        Which compliance frameworks apply to you?
      </h3>
      <p className="text-sm text-muted-foreground">
        Select all regulatory or compliance frameworks your organization must adhere to. This helps
        identify PQC-related obligations.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {AVAILABLE_COMPLIANCE.map((fw) => (
          <button
            key={fw}
            onClick={() => toggleCompliance(fw)}
            className={clsx(
              'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
              complianceRequirements.includes(fw)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {fw}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Don&apos;t see your framework? Skip this step — it won&apos;t affect your risk score
        significantly.
      </p>
    </div>
  )
}

const Step5Migration = () => {
  const { migrationStatus, setMigrationStatus } = useAssessmentStore()

  const statuses = [
    {
      value: 'started' as const,
      label: 'Already Started',
      description: 'We have begun implementing PQC algorithms in production or testing.',
    },
    {
      value: 'planning' as const,
      label: 'Planning to Start',
      description: "We have a roadmap or budget allocated but haven't started implementation.",
    },
    {
      value: 'not-started' as const,
      label: 'Not Started',
      description: 'We have not begun any PQC migration activities.',
    },
    {
      value: 'unknown' as const,
      label: "Don't Know",
      description: "We're unsure about our current PQC migration status.",
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">What is your PQC migration status?</h3>
      <p className="text-sm text-muted-foreground">
        Understanding where you are in the migration journey helps prioritize recommendations.
      </p>
      <div className="space-y-3">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => setMigrationStatus(s.value)}
            className={clsx(
              'w-full p-4 rounded-lg border text-left transition-colors',
              migrationStatus === s.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            <span className="font-bold text-sm">{s.label}</span>
            <p className="text-xs mt-1 opacity-80">{s.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

interface AssessWizardProps {
  onComplete: () => void
}

export const AssessWizard: React.FC<AssessWizardProps> = ({ onComplete }) => {
  const {
    currentStep,
    setStep,
    industry,
    currentCrypto,
    dataSensitivity,
    migrationStatus,
    markComplete,
  } = useAssessmentStore()

  const stepComponents = [
    <Step1Industry key="industry" />,
    <Step2Crypto key="crypto" />,
    <Step3Sensitivity key="sensitivity" />,
    <Step4Compliance key="compliance" />,
    <Step5Migration key="migration" />,
  ]

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!industry
      case 1:
        return currentCrypto.length > 0
      case 2:
        return !!dataSensitivity
      case 3:
        return true // Compliance is optional
      case 4:
        return !!migrationStatus
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < stepComponents.length - 1) {
      setStep(currentStep + 1)
    } else {
      markComplete()
      onComplete()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator current={currentStep} total={stepComponents.length} />

      <div className="glass-panel p-6 md:p-8 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* eslint-disable-next-line security/detect-object-injection */}
            {stepComponents[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 px-5 py-2 rounded-lg border border-border hover:bg-muted/10 disabled:opacity-50 transition-colors text-foreground text-sm"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex items-center gap-1 px-5 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
        >
          {currentStep === stepComponents.length - 1 ? 'Generate Report' : 'Next'}
          {currentStep < stepComponents.length - 1 && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  )
}
