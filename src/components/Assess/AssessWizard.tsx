import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, AlertTriangle, Info, RotateCcw } from 'lucide-react'
import { useAssessmentStore } from '../../store/useAssessmentStore'
import {
  AVAILABLE_INDUSTRIES,
  AVAILABLE_ALGORITHMS,
  AVAILABLE_COMPLIANCE,
  AVAILABLE_USE_CASES,
  AVAILABLE_INFRASTRUCTURE,
  VULNERABLE_ALGORITHMS,
} from '../../hooks/useAssessmentEngine'
import { timelineData, transformToGanttData } from '../../data/timelineData'
import {
  industryComplianceConfigs,
  industryUseCaseConfigs,
  industryRetentionConfigs,
  universalRetentionConfigs,
  industrySensitivityConfigs,
  getIndustryConfigs,
} from '../../data/industryAssessConfig'
import { InlineTooltip } from '../ui/InlineTooltip'
import clsx from 'clsx'

import type { AssessmentMode } from '../../store/useAssessmentStore'

const STEP_TITLES_FULL = [
  'Industry',
  'Country',
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

const STEP_TITLES_QUICK = [
  'Industry',
  'Country',
  'Crypto',
  'Sensitivity',
  'Compliance',
  'Migration',
]

const StepIndicator = ({
  current,
  total,
  titles,
}: {
  current: number
  total: number
  titles: string[]
}) => (
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
              aria-label={`Step ${i + 1}: ${titles[i] ?? ''}${i < current ? ' (completed)' : i === current ? ' (current)' : ''}`}
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
                'text-[9px] md:text-[10px] font-medium transition-colors whitespace-nowrap',
                i === current ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {/* eslint-disable-next-line security/detect-object-injection */}
              {titles[i]}
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

const Step2Country = () => {
  const { country, setCountry } = useAssessmentStore()

  const countries = useMemo(() => {
    const seen = new Set<string>()
    const list: Array<{ name: string; flagCode: string }> = []
    timelineData.forEach((c) => {
      if (!seen.has(c.countryName)) {
        seen.add(c.countryName)
        list.push({ name: c.countryName, flagCode: c.flagCode })
      }
    })
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        Which jurisdiction applies to your organization?
      </h3>
      <p className="text-sm text-muted-foreground">
        Your country&apos;s regulatory timeline will be used to align your migration deadline
        recommendations.
      </p>
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
        role="radiogroup"
        aria-label="Country selection"
      >
        {countries.map((c) => (
          <button
            key={c.name}
            role="radio"
            aria-checked={country === c.name}
            onClick={() => setCountry(c.name)}
            className={clsx(
              'p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
              country === c.name
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            <img
              src={`https://flagcdn.com/w20/${c.flagCode.toLowerCase()}.png`}
              alt=""
              aria-hidden="true"
              width={20}
              height={15}
              className="rounded-[2px] shrink-0"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            {c.name}
          </button>
        ))}
      </div>
    </div>
  )
}

const Step3Crypto = () => {
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

const SENSITIVITY_SCORE_TO_LEVEL: Record<number, string> = {
  0: 'low',
  5: 'medium',
  15: 'high',
  25: 'critical',
}

const SENSITIVITY_BADGE_STYLES: Record<string, { text: string; bg: string; label: string }> = {
  low: { text: 'text-success', bg: 'bg-success/15', label: 'Low' },
  medium: { text: 'text-primary', bg: 'bg-primary/15', label: 'Medium' },
  high: { text: 'text-warning', bg: 'bg-warning/15', label: 'High' },
  critical: { text: 'text-destructive', bg: 'bg-destructive/15', label: 'Critical' },
}

const Step4Sensitivity = () => {
  const { dataSensitivity, toggleDataSensitivity, industry } = useAssessmentStore()

  const industrySensitivities = useMemo(
    () => getIndustryConfigs(industrySensitivityConfigs, industry),
    [industry]
  )

  const universalLevels = [
    {
      value: 'low',
      label: 'Low',
      description: 'Public data, marketing content, non-sensitive business data',
      color: 'border-success bg-success/10 text-success',
    },
    {
      value: 'medium',
      label: 'Medium',
      description: 'Internal business data, employee information, general customer data',
      color: 'border-primary bg-primary/10 text-primary',
    },
    {
      value: 'high',
      label: 'High',
      description: 'Financial records, health data, personal identifiable information (PII)',
      color: 'border-warning bg-warning/10 text-warning',
    },
    {
      value: 'critical',
      label: 'Critical',
      description: 'State secrets, classified data, long-lived cryptographic keys, nuclear/defense',
      color: 'border-destructive bg-destructive/10 text-destructive',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">How sensitive is your data?</h3>
      <p className="text-sm text-muted-foreground">
        Data sensitivity determines your exposure to{' '}
        <InlineTooltip term="HNDL">&ldquo;Harvest Now, Decrypt Later&rdquo; (HNDL)</InlineTooltip>{' '}
        attacks. Select all that apply — your risk is assessed against the highest level present.
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

      {/* ── Industry-specific data types ── */}
      {industrySensitivities.length > 0 && (
        <>
          <div className="glass-panel p-3 border-l-4 border-l-primary">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Showing data types common in the{' '}
                <strong className="text-foreground">{industry}</strong> sector.
              </p>
            </div>
          </div>
          <div className="space-y-3" role="group" aria-label={`${industry} data sensitivity types`}>
            {industrySensitivities.map((item) => {
              const level = SENSITIVITY_SCORE_TO_LEVEL[item.sensitivityScore] ?? 'medium'
              const badge = SENSITIVITY_BADGE_STYLES[level]
              const isSelected = dataSensitivity.includes(level)
              return (
                <button
                  key={item.id}
                  aria-pressed={isSelected}
                  onClick={() => toggleDataSensitivity(level)}
                  className={clsx(
                    'w-full p-4 rounded-lg border text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm">{item.label}</span>
                    {badge && (
                      <span
                        className={clsx(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                          badge.text,
                          badge.bg
                        )}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 opacity-80">{item.description}</p>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* ── Universal sensitivity levels ── */}
      <div className={clsx(industrySensitivities.length > 0 && 'border-t border-border pt-3 mt-2')}>
        {industrySensitivities.length > 0 && (
          <p className="text-xs text-muted-foreground font-medium mb-2">
            General sensitivity levels
          </p>
        )}
        <div className="space-y-3" role="group" aria-label="Data sensitivity levels">
          {universalLevels.map((level) => (
            <button
              key={level.value}
              aria-pressed={dataSensitivity.includes(level.value)}
              onClick={() => toggleDataSensitivity(level.value)}
              className={clsx(
                'w-full p-4 rounded-lg border text-left transition-colors',
                dataSensitivity.includes(level.value)
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
    </div>
  )
}

const Step5Compliance = () => {
  const { complianceRequirements, toggleCompliance, industry } = useAssessmentStore()
  const country = useAssessmentStore((s) => s.country)

  // Build set of labels that match the selected country
  const countryMatchingLabels = useMemo(() => {
    if (!country || country === 'Global') return null // no filter
    const set = new Set<string>()
    for (const cfg of industryComplianceConfigs) {
      if (
        cfg.countries.length === 0 ||
        cfg.countries.includes('Global') ||
        cfg.countries.includes(country)
      ) {
        set.add(cfg.label)
      }
    }
    return set
  }, [country])

  const industryFrameworks = useMemo(() => {
    let configs = getIndustryConfigs(industryComplianceConfigs, industry)
    if (countryMatchingLabels) {
      configs = configs.filter((cfg) => countryMatchingLabels.has(cfg.label))
    }
    return configs
  }, [industry, countryMatchingLabels])
  const industryLabelSet = useMemo(
    () => new Set(industryFrameworks.map((f) => f.label)),
    [industryFrameworks]
  )
  const industrySpecificComplianceLabels = useMemo(() => {
    const set = new Set<string>()
    for (const cfg of industryComplianceConfigs) {
      if (cfg.industries.length > 0 && cfg.industries.length <= 2) {
        set.add(cfg.label)
      }
    }
    return set
  }, [])
  const universalFrameworks = useMemo(
    () =>
      AVAILABLE_COMPLIANCE.filter(
        (f) =>
          !industryLabelSet.has(f) &&
          (industry === 'Other' || !industry || !industrySpecificComplianceLabels.has(f)) &&
          (!countryMatchingLabels || countryMatchingLabels.has(f))
      ),
    [industryLabelSet, industry, industrySpecificComplianceLabels, countryMatchingLabels]
  )

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        Which compliance frameworks apply to you?
      </h3>
      <p className="text-sm text-muted-foreground">
        Select all regulatory or compliance frameworks your organization must adhere to. This helps
        identify PQC-related obligations.
      </p>

      {industryFrameworks.length > 0 && (
        <>
          <div className="glass-panel p-3 border-l-4 border-l-primary">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Showing frameworks commonly required in the{' '}
                <strong className="text-foreground">{industry}</strong> sector
                {country && country !== 'Global' && (
                  <>
                    {' '}
                    in <strong className="text-foreground">{country}</strong>
                  </>
                )}
                .
              </p>
            </div>
          </div>
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
            role="group"
            aria-label={`${industry} compliance frameworks`}
          >
            {industryFrameworks.map((fw) => (
              <button
                key={fw.id}
                aria-pressed={complianceRequirements.includes(fw.label)}
                onClick={() => toggleCompliance(fw.label)}
                className={clsx(
                  'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
                  complianceRequirements.includes(fw.label)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                )}
              >
                {fw.label}
              </button>
            ))}
          </div>
        </>
      )}

      {universalFrameworks.length > 0 && (
        <div className={clsx(industryFrameworks.length > 0 && 'border-t border-border pt-3 mt-2')}>
          {industryFrameworks.length > 0 && (
            <p className="text-xs text-muted-foreground font-medium mb-2">Universal frameworks</p>
          )}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
            role="group"
            aria-label="Universal compliance frameworks"
          >
            {universalFrameworks.map((fw) => (
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
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Don&apos;t see your framework? Skip this step — it won&apos;t affect your risk score
        significantly.
      </p>
    </div>
  )
}

const Step6Migration = () => {
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
      <h3 className="text-xl font-bold text-foreground">
        What is your <InlineTooltip term="PQC">PQC</InlineTooltip> migration status?
      </h3>
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

const Step7UseCases = () => {
  const { cryptoUseCases, toggleCryptoUseCase, industry } = useAssessmentStore()

  const industryUseCases = useMemo(
    () => getIndustryConfigs(industryUseCaseConfigs, industry),
    [industry]
  )
  const industryUseCaseLabelSet = useMemo(
    () => new Set(industryUseCases.map((uc) => uc.label)),
    [industryUseCases]
  )
  const industrySpecificUseCaseLabels = useMemo(() => {
    const set = new Set<string>()
    for (const cfg of industryUseCaseConfigs) {
      if (cfg.industries.length > 0 && cfg.industries.length <= 2) {
        set.add(cfg.label)
      }
    }
    return set
  }, [])
  const universalUseCases = useMemo(
    () =>
      AVAILABLE_USE_CASES.filter(
        (uc) =>
          !industryUseCaseLabelSet.has(uc) &&
          (industry === 'Other' || !industry || !industrySpecificUseCaseLabels.has(uc))
      ),
    [industryUseCaseLabelSet, industry, industrySpecificUseCaseLabels]
  )

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Where do you use cryptography?</h3>
      <p className="text-sm text-muted-foreground">
        Select all cryptographic use cases in your organization. This helps prioritize which
        migrations are most urgent.
      </p>

      {industryUseCases.length > 0 && (
        <>
          <div className="glass-panel p-3 border-l-4 border-l-primary">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Showing use cases common in the{' '}
                <strong className="text-foreground">{industry}</strong> sector.
              </p>
            </div>
          </div>
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
            role="group"
            aria-label={`${industry} use cases`}
          >
            {industryUseCases.map((uc) => (
              <button
                key={uc.id}
                aria-pressed={cryptoUseCases.includes(uc.label)}
                onClick={() => toggleCryptoUseCase(uc.label)}
                className={clsx(
                  'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
                  cryptoUseCases.includes(uc.label)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                )}
              >
                {uc.label}
              </button>
            ))}
          </div>
        </>
      )}

      {universalUseCases.length > 0 && (
        <div className={clsx(industryUseCases.length > 0 && 'border-t border-border pt-3 mt-2')}>
          {industryUseCases.length > 0 && (
            <p className="text-xs text-muted-foreground font-medium mb-2">General use cases</p>
          )}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
            role="group"
            aria-label="General cryptographic use cases"
          >
            {universalUseCases.map((uc) => (
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
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Not sure? Skip this step — we&apos;ll provide general recommendations.
      </p>
    </div>
  )
}

const Step8DataRetention = () => {
  const { dataRetention, toggleDataRetention, industry } = useAssessmentStore()

  const industryRetentionOptions = useMemo(
    () => getIndustryConfigs(industryRetentionConfigs, industry),
    [industry]
  )
  const industryRetentionIdSet = useMemo(
    () => new Set(industryRetentionOptions.map((r) => r.id)),
    [industryRetentionOptions]
  )
  const filteredUniversalOptions = useMemo(
    () => universalRetentionConfigs.filter((opt) => !industryRetentionIdSet.has(opt.id)),
    [industryRetentionIdSet]
  )

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        How long must your data stay confidential?
      </h3>
      <p className="text-sm text-muted-foreground">
        Select all categories that apply — <InlineTooltip term="HNDL">HNDL</InlineTooltip> risk is
        assessed against the longest period.
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

      {industryRetentionOptions.length > 0 && (
        <>
          <div className="glass-panel p-3 border-l-4 border-l-primary">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Showing retention periods common in the{' '}
                <strong className="text-foreground">{industry}</strong> sector.
              </p>
            </div>
          </div>
          <div className="space-y-3" role="group" aria-label={`${industry} retention periods`}>
            {industryRetentionOptions.map((opt) => (
              <button
                key={opt.id}
                aria-pressed={dataRetention.includes(opt.id)}
                onClick={() => toggleDataRetention(opt.id)}
                className={clsx(
                  'w-full p-4 rounded-lg border text-left transition-colors',
                  dataRetention.includes(opt.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                )}
              >
                <span className="font-bold text-sm">{opt.label}</span>
                <p className="text-xs mt-1 opacity-80">{opt.description}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {filteredUniversalOptions.length > 0 && (
        <div
          className={clsx(
            industryRetentionOptions.length > 0 && 'border-t border-border pt-3 mt-2'
          )}
        >
          {industryRetentionOptions.length > 0 && (
            <p className="text-xs text-muted-foreground font-medium mb-2">General ranges</p>
          )}
          <div className="space-y-3" role="group" aria-label="General data retention periods">
            {filteredUniversalOptions.map((opt) => (
              <button
                key={opt.id}
                aria-pressed={dataRetention.includes(opt.id)}
                onClick={() => toggleDataRetention(opt.id)}
                className={clsx(
                  'w-full p-4 rounded-lg border text-left transition-colors',
                  dataRetention.includes(opt.id)
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
      )}
    </div>
  )
}

const Step9OrgScale = () => {
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

const Step10CryptoAgility = () => {
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
        <InlineTooltip term="Crypto Agility">Crypto agility</InlineTooltip> is a major factor in
        migration complexity. Abstracted implementations are far easier to migrate.
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

const Step11Infrastructure = () => {
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
            <InlineTooltip term="HSM">HSMs</InlineTooltip> and legacy systems are typically the
            hardest to migrate to <InlineTooltip term="PQC">PQC</InlineTooltip> algorithms.
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

const Step12VendorDependency = () => {
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
        means you depend on their <InlineTooltip term="PQC">PQC</InlineTooltip> roadmap.
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

const CURRENT_YEAR = new Date().getFullYear()

function deriveTimelinePressure(
  endYear: number
): 'within-1y' | 'within-2-3y' | 'internal-deadline' {
  if (endYear <= CURRENT_YEAR + 1) return 'within-1y'
  if (endYear <= CURRENT_YEAR + 3) return 'within-2-3y'
  return 'internal-deadline'
}

const Step13TimelinePressure = () => {
  const { country, timelinePressure, setTimelinePressure } = useAssessmentStore()

  // Build country-specific deadline options from the timeline
  const countryDeadlines = useMemo(() => {
    if (!country) return []
    const ganttData = transformToGanttData(timelineData)
    const entry = ganttData.find((g) => g.country.countryName === country)
    if (!entry) return []
    return entry.phases.filter((p) => p.phase === 'Deadline')
  }, [country])

  const staticOptions = [
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

  const hasCountryDeadlines = countryDeadlines.length > 0

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Do you have a migration deadline?</h3>
      <p className="text-sm text-muted-foreground">
        Timeline pressure affects how aggressively migration must be prioritized.
      </p>

      {hasCountryDeadlines ? (
        <>
          <div className="glass-panel p-4 border-l-4 border-l-primary mb-2">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Deadlines below are sourced from {country}&apos;s official PQC regulatory timeline.
              </p>
            </div>
          </div>

          <div className="space-y-3" role="radiogroup" aria-label="Migration deadline">
            {countryDeadlines.map((phase) => {
              const derived = deriveTimelinePressure(phase.endYear)
              const isSelected = timelinePressure === derived
              return (
                <button
                  key={phase.title}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setTimelinePressure(derived)}
                  className={clsx(
                    'w-full p-4 rounded-lg border text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm">{phase.title}</span>
                    <span className="text-xs font-mono bg-muted/40 px-2 py-0.5 rounded shrink-0">
                      {phase.startYear === phase.endYear
                        ? phase.endYear
                        : `${phase.startYear}–${phase.endYear}`}
                    </span>
                  </div>
                  {phase.description && (
                    <p className="text-xs mt-1 opacity-80 line-clamp-2">{phase.description}</p>
                  )}
                </button>
              )
            })}

            {/* Always show fallback options */}
            <div className="border-t border-border pt-3 mt-2 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Other options</p>
              {['no-deadline' as const, 'unknown' as const].map((val) => {
                const opt = staticOptions.find((o) => o.value === val)!
                return (
                  <button
                    key={val}
                    role="radio"
                    aria-checked={timelinePressure === val}
                    onClick={() => setTimelinePressure(val)}
                    className={clsx(
                      'w-full p-4 rounded-lg border text-left transition-colors',
                      timelinePressure === val
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    <span className="font-bold text-sm">{opt.label}</span>
                    <p className="text-xs mt-1 opacity-80">{opt.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3" role="radiogroup" aria-label="Migration timeline pressure">
          {staticOptions.map((opt) => (
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
      )}
    </div>
  )
}

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
      s.currentCrypto.length > 0,
  },
  {
    key: 'sensitivity',
    component: <Step4Sensitivity />,
    canProceed: (s: typeof useAssessmentStore extends { getState: () => infer R } ? R : never) =>
      s.dataSensitivity.length > 0,
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
      s.dataRetention.length > 0,
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
      !!s.vendorDependency,
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

  const steps = useMemo(
    () => (mode === 'quick' ? ALL_STEPS.filter((s) => QUICK_STEP_KEYS.has(s.key)) : [...ALL_STEPS]),
    [mode]
  )
  const stepTitles = mode === 'quick' ? STEP_TITLES_QUICK : STEP_TITLES_FULL

  const canProceed = () => {
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
