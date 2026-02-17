import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, AlertTriangle, Info } from 'lucide-react'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import {
  AVAILABLE_INDUSTRIES,
  AVAILABLE_ALGORITHMS,
  AVAILABLE_COMPLIANCE,
  AVAILABLE_USE_CASES,
  AVAILABLE_INFRASTRUCTURE,
  VULNERABLE_ALGORITHMS,
} from '../../hooks/useAssessmentEngine'
import clsx from 'clsx'

const STEP_TITLES = [
  'Industry',
  'Crypto',
  'Sensitivity',
  'Compliance',
  'Migration',
  'Use Cases',
  'Retention',
  'Scale',
  'Agility',
  'Infra',
  'Vendors',
  'Timeline',
]

const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <>
    {/* Compact display for small screens */}
    <div className="flex items-center justify-center gap-3 mb-6 sm:hidden">
      <span className="text-sm font-bold text-primary">
        Step {current + 1} of {total}
      </span>
      <div className="flex-1 max-w-48 h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
    </div>

    {/* Full step indicator for larger screens */}
    <div
      className="hidden sm:flex items-center gap-1 md:gap-2 mb-6 overflow-x-auto pb-2"
      role="group"
      aria-label="Assessment progress"
    >
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-1 md:gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              aria-current={i === current ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${STEP_TITLES[i] ?? ''}${i < current ? ' (completed)' : i === current ? ' (current)' : ''}`}
              className={clsx(
                'w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border-2 transition-colors',
                i === current
                  ? 'border-primary text-primary bg-primary/10'
                  : i < current
                    ? 'border-success text-success bg-success/10'
                    : 'border-border text-muted-foreground'
              )}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span
              className={clsx(
                'text-[9px] md:text-[10px] font-medium transition-colors',
                i === current ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {/* eslint-disable-next-line security/detect-object-injection */}
              {STEP_TITLES[i]}
            </span>
          </div>
          {i < total - 1 && (
            <div
              className={clsx(
                'w-4 md:w-8 h-0.5 self-start mt-3.5',
                i < current ? 'bg-success' : 'bg-border'
              )}
            />
          )}
        </div>
      ))}
    </div>
  </>
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
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
        role="radiogroup"
        aria-label="Industry selection"
      >
        {AVAILABLE_INDUSTRIES.map((ind) => (
          <button
            key={ind}
            role="radio"
            aria-checked={industry === ind}
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
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
        role="group"
        aria-label="Algorithm selection"
      >
        {AVAILABLE_ALGORITHMS.map((algo) => {
          const isVulnerable = VULNERABLE_ALGORITHMS.has(algo)
          return (
            <button
              key={algo}
              aria-pressed={currentCrypto.includes(algo)}
              onClick={() => toggleCrypto(algo)}
              className={clsx(
                'p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center justify-between',
                currentCrypto.includes(algo)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              <span>{algo}</span>
              {isVulnerable && <AlertTriangle size={14} className="text-warning shrink-0" />}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <AlertTriangle size={12} className="text-warning" />= Quantum-vulnerable algorithm
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
      color: 'border-success bg-success/10 text-success',
    },
    {
      value: 'medium' as const,
      label: 'Medium',
      description: 'Internal business data, employee information, general customer data',
      color: 'border-primary bg-primary/10 text-primary',
    },
    {
      value: 'high' as const,
      label: 'High',
      description: 'Financial records, health data, personal identifiable information (PII)',
      color: 'border-warning bg-warning/10 text-warning',
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

      <div className="glass-panel p-4 border-l-4 border-l-warning mb-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-warning">HNDL</strong>: Adversaries collect encrypted data today
            and wait for quantum computers to decrypt it. If your data needs to remain confidential
            for 10+ years, the threat is <em>already active</em>.
          </p>
        </div>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="Data sensitivity level">
        {levels.map((level) => (
          <button
            key={level.value}
            role="radio"
            aria-checked={dataSensitivity === level.value}
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
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
        role="group"
        aria-label="Compliance framework selection"
      >
        {AVAILABLE_COMPLIANCE.map((fw) => (
          <button
            key={fw}
            aria-pressed={complianceRequirements.includes(fw)}
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
      <div className="space-y-3" role="radiogroup" aria-label="Migration status">
        {statuses.map((s) => (
          <button
            key={s.value}
            role="radio"
            aria-checked={migrationStatus === s.value}
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

const Step6UseCases = () => {
  const { cryptoUseCases, toggleCryptoUseCase } = useAssessmentStore()

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Where do you use cryptography?</h3>
      <p className="text-sm text-muted-foreground">
        Select all cryptographic use cases in your organization. This helps prioritize which
        migrations are most urgent.
      </p>
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
        role="group"
        aria-label="Cryptographic use case selection"
      >
        {AVAILABLE_USE_CASES.map((uc) => (
          <button
            key={uc}
            aria-pressed={cryptoUseCases.includes(uc)}
            onClick={() => toggleCryptoUseCase(uc)}
            className={clsx(
              'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
              cryptoUseCases.includes(uc)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {uc}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Not sure? Skip this step — we&apos;ll provide general recommendations.
      </p>
    </div>
  )
}

const Step7DataRetention = () => {
  const { dataRetention, setDataRetention } = useAssessmentStore()

  const options = [
    {
      value: 'under-1y' as const,
      label: 'Less than 1 year',
      description: 'Short-lived sessions, temporary tokens',
    },
    {
      value: '1-5y' as const,
      label: '1-5 years',
      description: 'Typical business records, customer data',
    },
    {
      value: '5-10y' as const,
      label: '5-10 years',
      description: 'Financial records, audit trails',
    },
    {
      value: '10-25y' as const,
      label: '10-25 years',
      description: 'Healthcare records, legal documents, PII',
    },
    {
      value: '25-plus' as const,
      label: '25+ years',
      description: 'Regulatory archives, insurance, government records',
    },
    {
      value: 'indefinite' as const,
      label: 'Indefinite',
      description: 'Classified data, state secrets, cryptographic keys',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        How long must your data stay confidential?
      </h3>
      <p className="text-sm text-muted-foreground">
        Longer data retention means greater exposure to &ldquo;Harvest Now, Decrypt Later&rdquo;
        attacks.
      </p>

      <div className="glass-panel p-4 border-l-4 border-l-warning mb-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            If your encrypted data needs to remain confidential past ~2035, adversaries may already
            be harvesting it today for future quantum decryption.
          </p>
        </div>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="Data retention period">
        {options.map((opt) => (
          <button
            key={opt.value}
            role="radio"
            aria-checked={dataRetention === opt.value}
            onClick={() => setDataRetention(opt.value)}
            className={clsx(
              'w-full p-4 rounded-lg border text-left transition-colors',
              dataRetention === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            <span className="font-bold text-sm">{opt.label}</span>
            <p className="text-xs mt-1 opacity-80">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

const Step8OrgScale = () => {
  const { systemCount, setSystemCount, teamSize, setTeamSize } = useAssessmentStore()

  const systemOptions = [
    { value: '1-10' as const, label: '1-10 systems' },
    { value: '11-50' as const, label: '11-50 systems' },
    { value: '51-200' as const, label: '51-200 systems' },
    { value: '200-plus' as const, label: '200+ systems' },
  ]

  const teamOptions = [
    { value: '1-10' as const, label: '1-10 engineers' },
    { value: '11-50' as const, label: '11-50 engineers' },
    { value: '51-200' as const, label: '51-200 engineers' },
    { value: '200-plus' as const, label: '200+ engineers' },
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-foreground">What is your organizational scale?</h3>
      <p className="text-sm text-muted-foreground">
        Migration scope and team capacity directly affect timelines and effort.
      </p>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Systems using cryptography</h4>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Number of systems">
          {systemOptions.map((opt) => (
            <button
              key={opt.value}
              role="radio"
              aria-checked={systemCount === opt.value}
              onClick={() => setSystemCount(opt.value)}
              className={clsx(
                'p-3 rounded-lg border text-center text-sm font-medium transition-colors',
                systemCount === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Engineering team size</h4>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Team size">
          {teamOptions.map((opt) => (
            <button
              key={opt.value}
              role="radio"
              aria-checked={teamSize === opt.value}
              onClick={() => setTeamSize(opt.value)}
              className={clsx(
                'p-3 rounded-lg border text-center text-sm font-medium transition-colors',
                teamSize === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const Step9CryptoAgility = () => {
  const { cryptoAgility, setCryptoAgility } = useAssessmentStore()

  const options = [
    {
      value: 'fully-abstracted' as const,
      label: 'Fully Abstracted',
      description: 'Crypto library wrappers or config-driven — easy to swap algorithms.',
    },
    {
      value: 'partially-abstracted' as const,
      label: 'Partially Abstracted',
      description: 'Some systems use wrappers, others have algorithms hardcoded.',
    },
    {
      value: 'hardcoded' as const,
      label: 'Hardcoded Throughout',
      description: 'Algorithms are embedded directly in application code.',
    },
    {
      value: 'unknown' as const,
      label: 'Unknown / Not Assessed',
      description: "We haven't evaluated our cryptographic agility.",
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        How easily can you swap cryptographic algorithms?
      </h3>
      <p className="text-sm text-muted-foreground">
        Crypto agility is a major factor in migration complexity. Abstracted implementations are far
        easier to migrate.
      </p>
      <div className="space-y-3" role="radiogroup" aria-label="Crypto agility level">
        {options.map((opt) => (
          <button
            key={opt.value}
            role="radio"
            aria-checked={cryptoAgility === opt.value}
            onClick={() => setCryptoAgility(opt.value)}
            className={clsx(
              'w-full p-4 rounded-lg border text-left transition-colors',
              cryptoAgility === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            <span className="font-bold text-sm">{opt.label}</span>
            <p className="text-xs mt-1 opacity-80">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

const Step10Infrastructure = () => {
  const { infrastructure, toggleInfrastructure } = useAssessmentStore()

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        What infrastructure affects your cryptography?
      </h3>
      <p className="text-sm text-muted-foreground">
        Infrastructure dependencies can significantly impact migration complexity and timelines.
      </p>

      <div className="glass-panel p-4 border-l-4 border-l-warning mb-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            HSMs and legacy systems are typically the hardest to migrate to PQC algorithms.
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
        role="group"
        aria-label="Infrastructure selection"
      >
        {AVAILABLE_INFRASTRUCTURE.map((item) => (
          <button
            key={item}
            aria-pressed={infrastructure.includes(item)}
            onClick={() => toggleInfrastructure(item)}
            className={clsx(
              'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
              infrastructure.includes(item)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">None of these apply? Skip this step.</p>
    </div>
  )
}

const Step11VendorDependency = () => {
  const { vendorDependency, setVendorDependency } = useAssessmentStore()

  const options = [
    {
      value: 'heavy-vendor' as const,
      label: 'Heavy Vendor Dependency',
      description: 'We rely primarily on vendor-provided crypto (SaaS, SDK, managed services).',
    },
    {
      value: 'open-source' as const,
      label: 'Open Source Libraries',
      description: 'We use open-source crypto libraries that we control and can update.',
    },
    {
      value: 'mixed' as const,
      label: 'Mixed',
      description: 'Combination of vendor-provided and self-managed crypto libraries.',
    },
    {
      value: 'in-house' as const,
      label: 'In-House Implementations',
      description: 'We build and maintain our own cryptographic implementations.',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        How do you manage cryptographic dependencies?
      </h3>
      <p className="text-sm text-muted-foreground">
        Vendor dependencies affect your control over migration timelines. Heavy vendor reliance
        means you depend on their PQC roadmap.
      </p>
      <div className="space-y-3" role="radiogroup" aria-label="Vendor dependency model">
        {options.map((opt) => (
          <button
            key={opt.value}
            role="radio"
            aria-checked={vendorDependency === opt.value}
            onClick={() => setVendorDependency(opt.value)}
            className={clsx(
              'w-full p-4 rounded-lg border text-left transition-colors',
              vendorDependency === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            <span className="font-bold text-sm">{opt.label}</span>
            <p className="text-xs mt-1 opacity-80">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

const Step12TimelinePressure = () => {
  const { timelinePressure, setTimelinePressure } = useAssessmentStore()

  const options = [
    {
      value: 'within-1y' as const,
      label: 'Regulatory Deadline Within 1 Year',
      description: 'We have a compliance mandate requiring PQC adoption within 12 months.',
    },
    {
      value: 'within-2-3y' as const,
      label: 'Regulatory Deadline Within 2-3 Years',
      description: 'Our compliance framework requires PQC adoption by 2028-2029.',
    },
    {
      value: 'internal-deadline' as const,
      label: 'Internal Deadline Set',
      description: 'Our organization has set its own PQC migration target date.',
    },
    {
      value: 'no-deadline' as const,
      label: 'No Specific Deadline',
      description: 'We have no regulatory or internal deadline for PQC migration.',
    },
    {
      value: 'unknown' as const,
      label: "Don't Know",
      description: "We're unsure about any applicable deadlines.",
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Do you have a migration deadline?</h3>
      <p className="text-sm text-muted-foreground">
        Timeline pressure affects how aggressively migration must be prioritized.
      </p>
      <div className="space-y-3" role="radiogroup" aria-label="Migration timeline pressure">
        {options.map((opt) => (
          <button
            key={opt.value}
            role="radio"
            aria-checked={timelinePressure === opt.value}
            onClick={() => setTimelinePressure(opt.value)}
            className={clsx(
              'w-full p-4 rounded-lg border text-left transition-colors',
              timelinePressure === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            <span className="font-bold text-sm">{opt.label}</span>
            <p className="text-xs mt-1 opacity-80">{opt.description}</p>
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
    dataRetention,
    systemCount,
    teamSize,
    cryptoAgility,
    vendorDependency,
    timelinePressure,
    markComplete,
  } = useAssessmentStore()

  const [isGenerating, setIsGenerating] = useState(false)

  const stepComponents = [
    <Step1Industry key="industry" />,
    <Step2Crypto key="crypto" />,
    <Step3Sensitivity key="sensitivity" />,
    <Step4Compliance key="compliance" />,
    <Step5Migration key="migration" />,
    <Step6UseCases key="use-cases" />,
    <Step7DataRetention key="retention" />,
    <Step8OrgScale key="scale" />,
    <Step9CryptoAgility key="agility" />,
    <Step10Infrastructure key="infra" />,
    <Step11VendorDependency key="vendors" />,
    <Step12TimelinePressure key="timeline" />,
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
      case 5:
        return true // Use cases optional
      case 6:
        return !!dataRetention
      case 7:
        return !!systemCount && !!teamSize
      case 8:
        return !!cryptoAgility
      case 9:
        return true // Infrastructure optional
      case 10:
        return !!vendorDependency
      case 11:
        return !!timelinePressure
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < stepComponents.length - 1) {
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
      <StepIndicator current={currentStep} total={stepComponents.length} />

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
          disabled={!canProceed() || isGenerating}
          className="flex items-center gap-1 px-5 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
        >
          {isGenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : currentStep === stepComponents.length - 1 ? (
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
