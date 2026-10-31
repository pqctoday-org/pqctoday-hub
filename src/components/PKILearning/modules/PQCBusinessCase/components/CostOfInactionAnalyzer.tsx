// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useMemo, useState } from 'react'
import {
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Calendar,
  Percent,
  Info,
  Clock,
  Wrench,
} from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { usePersonaStore } from '@/store/usePersonaStore'
import { DELAY_COST_PROFILES } from '../data/businessCaseScenarios'
import {
  resolveIndustryBreachBaseline,
  computeMigrationCostFromProfile,
  reconcileEstimates,
  MIGRATION_COST_FLOOR,
} from '@/utils/roiMath'
import {
  ANNUAL_BREACH_PROBABILITY_PCT,
  IBM_BASELINE_UNVERIFIED_NOTE,
  type OrgSizeTier,
} from '@/data/roiBaselines'
import {
  DELAY_MODEL_DEFAULTS,
  projectDelayScenario,
  crossoverYear,
  type DelayScenarioInputs,
} from '@/utils/delayCostModel'
import { DATA_SHELF_LIFE_YEARS, DATA_SENSITIVITY_LABELS } from '@/utils/breachCostModel'
import { computeMoscaVerdict } from '@/utils/moscaTheorem'
import { deriveIndustryMandate } from '@/utils/inactionDrivers'
import type { BreachOutput, InactionOutput, InactionScenarioRecord } from '../types'

const ORG_SIZE_TIER_OPTIONS: { tier: OrgSizeTier; label: string }[] = [
  { tier: 'smb', label: 'SMB' },
  { tier: 'average', label: 'Average' },
  { tier: 'fortune1000', label: 'F1000' },
]

function fmt(n: number): string {
  const sign = n < 0 ? '-' : ''
  const a = Math.abs(n)
  if (a >= 1_000_000_000) return `${sign}$${(a / 1_000_000_000).toFixed(1)}B`
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(1)}M`
  if (a >= 1_000) return `${sign}$${(a / 1_000).toFixed(0)}K`
  return `${sign}$${a.toFixed(0)}`
}

interface CostOfInactionAnalyzerProps {
  breachOutput?: BreachOutput | null
  onOutput?: (output: InactionOutput) => void
}

export const CostOfInactionAnalyzer: React.FC<CostOfInactionAnalyzerProps> = ({
  breachOutput,
  onOutput,
}) => {
  const data = useExecutiveModuleData()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  // Restore the last-saved scenario so the tool round-trips instead of
  // resetting to defaults on every visit.
  const savedInputs = useSavedArtifactInputs<{
    selectedIndustry: string
    delayYears: number
    annualBreachProbPct: number
    migrationDurationYears: number
    migrationCostOverrideUSD?: number | null
    discountRatePct?: number
    verifiedEffectiveYear?: number
    verifiedAnnualConsequenceUSD?: number
    verifiedOneTimeConsequenceUSD?: number
    verifiedConsequenceSource?: string
  }>('cost-of-inaction')
  // `||`, not `??`. When no industry is set, useExecutiveModuleData returns an
  // EMPTY STRING, which is not nullish — so the 'Finance & Banking' fallback was
  // unreachable for exactly the users who needed it. The export then titled
  // itself "PQC Cost of Inaction — " with a dangling em-dash, and, worse, the
  // model still ran: the profile lookup falls back to DELAY_COST_PROFILES[0],
  // which IS Finance & Banking, so the document quietly used payment-card
  // sensitivity and a $4.5M migration cost without naming the industry those
  // assumptions came from. Found by reading an actual export, 2026-08-12.
  const [selectedIndustry, setSelectedIndustry] = useState<string>(
    savedInputs?.selectedIndustry || data.industry || 'Finance & Banking'
  )
  const [delayYears, setDelayYears] = useState<number>(savedInputs?.delayYears ?? 2)
  const [annualBreachProbPct, setAnnualBreachProbPct] = useState<number>(
    savedInputs?.annualBreachProbPct ?? DELAY_MODEL_DEFAULTS.annualBreachProbPct
  )
  const [migrationDurationYears, setMigrationDurationYears] = useState<number>(
    savedInputs?.migrationDurationYears ?? DELAY_MODEL_DEFAULTS.migrationDurationYears
  )
  const [migrationCostOverrideUSD, setMigrationCostOverrideUSD] = useState<number | null>(
    savedInputs?.migrationCostOverrideUSD ?? null
  )
  const [discountRatePct, setDiscountRatePct] = useState<number>(
    savedInputs?.discountRatePct ?? DELAY_MODEL_DEFAULTS.discountRatePct
  )
  const [verifiedEffectiveYear, setVerifiedEffectiveYear] = useState<number>(
    savedInputs?.verifiedEffectiveYear ?? new Date().getFullYear() + 4
  )
  const [verifiedAnnualConsequenceUSD, setVerifiedAnnualConsequenceUSD] = useState<number>(
    savedInputs?.verifiedAnnualConsequenceUSD ?? 0
  )
  const [verifiedOneTimeConsequenceUSD, setVerifiedOneTimeConsequenceUSD] = useState<number>(
    savedInputs?.verifiedOneTimeConsequenceUSD ?? 0
  )
  const [verifiedConsequenceSource, setVerifiedConsequenceSource] = useState<string>(
    savedInputs?.verifiedConsequenceSource ?? ''
  )

  const profile = useMemo(
    () =>
      DELAY_COST_PROFILES.find((p) => p.industry === selectedIndustry) ?? DELAY_COST_PROFILES[0],
    [selectedIndustry]
  )

  // Only trust the Breach Simulator's figures when it ran for THIS industry —
  // otherwise silently mixing industries would misattribute its numbers.
  const chainedFromSimulator =
    breachOutput && breachOutput.industry === selectedIndustry ? breachOutput : null

  const mandate = useMemo(
    () => deriveIndustryMandate(selectedIndustry, data.country),
    [selectedIndustry, data.country]
  )

  // Independent second migration-cost estimate from the user's assessment
  // profile — the same cross-check the ROI Calculator already runs.
  const assessmentDerived = useMemo(
    () =>
      data.isAssessmentComplete && data.assessmentResult
        ? computeMigrationCostFromProfile(data.assessmentResult)
        : null,
    [data.isAssessmentComplete, data.assessmentResult]
  )
  const suggestedMigrationCostUSD = assessmentDerived?.migrationCost ?? profile.migrationCostUSD
  const migrationCostUSD = migrationCostOverrideUSD ?? suggestedMigrationCostUSD
  const migrationCostRecon = useMemo(() => {
    if (!assessmentDerived) return null
    return {
      assessmentCost: assessmentDerived.migrationCost,
      lowConfidence: assessmentDerived.migrationCost === MIGRATION_COST_FLOOR,
      recon: reconcileEstimates(profile.migrationCostUSD, assessmentDerived.migrationCost),
    }
  }, [assessmentDerived, profile.migrationCostUSD])

  const dataSensitivityClass =
    chainedFromSimulator?.dataSensitivityClass ?? profile.dataSensitivityClass
  const shelfLifeYears = DATA_SHELF_LIFE_YEARS[dataSensitivityClass]

  const currentYear = new Date().getFullYear()
  const moscaVerdict = useMemo(
    () =>
      computeMoscaVerdict(
        { shelfLifeYears, migrationDurationYears, crqcScenario: 'consensus' },
        currentYear
      ),
    [shelfLifeYears, migrationDurationYears, currentYear]
  )

  const inputs: DelayScenarioInputs = useMemo(() => {
    const breachBaseline = chainedFromSimulator
      ? chainedFromSimulator.classicalCostUSD
      : resolveIndustryBreachBaseline(selectedIndustry)
    return {
      breachBaseline,
      breachScale: 1, // already baked into breachBaseline when chained (severity + region)
      baseYearsOfData: chainedFromSimulator?.yearsOfData ?? DELAY_MODEL_DEFAULTS.baseYearsOfData,
      hndlFactorPct: chainedFromSimulator?.hndlFactorPct ?? DELAY_MODEL_DEFAULTS.hndlFactorPct,
      dataSensitivityClass,
      annualBreachProbPct,
      migrationCostUSD,
      delayPremiumPerYear: profile.delayPremiumPerYear,
      migrationDurationYears,
      // A framework match is educational context, not proof that a dollar
      // consequence applies to this organization. Only explicit learner input
      // enters the calculation.
      mandateType:
        verifiedAnnualConsequenceUSD > 0 || verifiedOneTimeConsequenceUSD > 0 ? 'HARD' : 'NONE',
      hardDeadlineYear: verifiedEffectiveYear,
      annualFineUSD: verifiedAnnualConsequenceUSD,
      cliffLossUSD: verifiedOneTimeConsequenceUSD,
      currentYear,
      horizonYears: DELAY_MODEL_DEFAULTS.horizonYears,
      discountRatePct,
      crqcScenario: 'consensus',
    }
  }, [
    chainedFromSimulator,
    selectedIndustry,
    dataSensitivityClass,
    annualBreachProbPct,
    migrationCostUSD,
    profile.delayPremiumPerYear,
    migrationDurationYears,
    verifiedEffectiveYear,
    verifiedAnnualConsequenceUSD,
    verifiedOneTimeConsequenceUSD,
    discountRatePct,
    currentYear,
  ])

  const nowResult = useMemo(() => projectDelayScenario(inputs, 0), [inputs])
  const delayedResult = useMemo(
    () => projectDelayScenario(inputs, delayYears),
    [inputs, delayYears]
  )
  const costOfInaction = delayedResult.total - nowResult.total
  const scenarioRange = useMemo(() => {
    const incremental = (crqcScenario: 'slow' | 'fast') => {
      const scenarioInputs = { ...inputs, crqcScenario }
      return (
        projectDelayScenario(scenarioInputs, delayYears).total -
        projectDelayScenario(scenarioInputs, 0).total
      )
    }
    return { slow: incremental('slow'), fast: incremental('fast') }
  }, [inputs, delayYears])
  const scenarioLow = Math.min(scenarioRange.slow, scenarioRange.fast)
  const scenarioHigh = Math.max(scenarioRange.slow, scenarioRange.fast)
  const incrementalDrivers = useMemo(
    () => [
      {
        label: 'migration timing and delay premium',
        value: delayedResult.totalMigration - nowResult.totalMigration,
      },
      {
        label: 'expected breach exposure',
        value: delayedResult.totalBreach - nowResult.totalBreach,
      },
      {
        label: 'learner-verified consequence',
        value: delayedResult.totalPenalty - nowResult.totalPenalty,
      },
    ],
    [delayedResult, nowResult]
  )
  const largestDriver = [...incrementalDrivers].sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value)
  )[0]
  const nearZero = Math.abs(costOfInaction) < 1_000
  const crossover = useMemo(
    () => crossoverYear(nowResult.rows, delayedResult.rows),
    [nowResult, delayedResult]
  )

  // Shared with the export below (`output:`) so Board Pitch Builder can read
  // the same numbers whether it's chained live via props (in the linear
  // wizard) or reads the last saved artifact (Simulation, Business Center).
  const scenarioRecord: InactionScenarioRecord = useMemo(
    () => ({
      modelVersion: 'coi-2',
      asOfYear: currentYear,
      horizonYears: inputs.horizonYears,
      industry: selectedIndustry,
      delayYears,
      migrationDurationYears,
      migrationCostUSD,
      delayPremiumPerYearUSD: profile.delayPremiumPerYear,
      annualBreachProbPct,
      breachBaselineUSD: inputs.breachBaseline,
      baselineOrigin: chainedFromSimulator ? 'breach-simulator' : 'industry-default',
      baseYearsOfData: inputs.baseYearsOfData,
      hndlFactorPct: inputs.hndlFactorPct,
      dataSensitivityClass,
      discountRatePct,
      verifiedConsequence: {
        effectiveYear: verifiedEffectiveYear,
        annualUSD: verifiedAnnualConsequenceUSD,
        oneTimeUSD: verifiedOneTimeConsequenceUSD,
        sourceNote: verifiedConsequenceSource.trim(),
      },
      sourceStatus: {
        breachBaseline:
          'IBM 2025 sector assumption — one edition behind and not independently verified',
        breachProbability: 'Cyentia IRIS 2025 primary-verified',
        crqcCurve: 'GRI 2025 expert-survey bands, interpolated by this model',
      },
    }),
    [
      currentYear,
      inputs,
      selectedIndustry,
      delayYears,
      migrationDurationYears,
      migrationCostUSD,
      profile.delayPremiumPerYear,
      annualBreachProbPct,
      chainedFromSimulator,
      dataSensitivityClass,
      discountRatePct,
      verifiedEffectiveYear,
      verifiedAnnualConsequenceUSD,
      verifiedOneTimeConsequenceUSD,
      verifiedConsequenceSource,
    ]
  )

  const outputPayload: InactionOutput = useMemo(
    () => ({
      costOfInactionUSD: costOfInaction,
      delayYears,
      crossoverYear: crossover,
      latestSafeStartYear: moscaVerdict.latestSafeStartYear,
      alreadyLate: moscaVerdict.alreadyLate,
      scenario: scenarioRecord,
    }),
    [costOfInaction, delayYears, crossover, moscaVerdict, scenarioRecord]
  )

  useEffect(() => {
    onOutput?.(outputPayload)
  }, [onOutput, outputPayload])

  const mandateLabel =
    mandate.mandateType === 'HARD'
      ? 'candidate requirement date; applicability and effective date unverified'
      : mandate.mandateType === 'SOFT'
        ? 'guidance target'
        : 'planning anchor (no binding mandate found)'

  const exportMarkdown = useMemo(() => {
    let md = `# PQC Cost of Inaction — ${selectedIndustry}\n\n`
    md += `**Generated:** ${new Date().toLocaleDateString()}\n\n`
    md += `| Metric | Value |\n|--------|-------|\n`
    md += `| Migrate now (${inputs.horizonYears}-yr NPV) | ${fmt(nowResult.total)} |\n`
    md += `| Delay ${delayYears}yr (${inputs.horizonYears}-yr NPV) | ${fmt(delayedResult.total)} |\n`
    md += `| **Cost of inaction (delay ${delayYears}yr)** | **${fmt(costOfInaction)}** |\n`
    md += `| Annual breach probability | ${annualBreachProbPct}% |\n`
    md += `| Migration duration | ${migrationDurationYears} yr |\n`
    md += `| Planning date context | ${mandate.deadlineYear} (${mandateLabel} — ${mandate.driverName}; verify applicability and effective date) |\n`
    md += `| Mosca scenario threshold | ${Math.round(moscaVerdict.latestSafeStartYear)} (consensus median CRQC year ${moscaVerdict.crqcYear}; not a safe-date guarantee) |\n`
    md += `| Crossover year | ${crossover ?? `beyond the ${inputs.horizonYears}-year horizon`} |\n\n`
    md += `## Delay ${delayYears}yr breakdown (NPV)\n\n`
    md += `| Component | Value |\n|-----------|-------|\n`
    md += `| Migration (with delay premium) | ${fmt(delayedResult.totalMigration)} |\n`
    md += `| Expected breach loss | ${fmt(delayedResult.totalBreach)} |\n`
    md += `| Learner-verified annual consequence | ${fmt(delayedResult.totalFine)} |\n`
    md += `| Learner-verified one-time consequence | ${fmt(delayedResult.totalCliff)} |\n\n`
    md += `## Reproducible scenario inputs (model coi-2)\n\n`
    md += `| Input | Value / origin |\n|---|---|\n`
    md += `| As-of year / horizon | ${currentYear} / ${inputs.horizonYears} years |\n`
    md += `| Migration cost | ${fmt(migrationCostUSD)} (${migrationCostOverrideUSD === null ? 'suggested scenario value' : 'learner-entered'}) |\n`
    md += `| Delay premium | ${fmt(profile.delayPremiumPerYear)}/year (analyst assumption) |\n`
    md += `| Discount rate | ${discountRatePct}% (learner-adjustable assumption) |\n`
    md += `| Stored-data / HNDL assumptions | ${inputs.baseYearsOfData} years / ${inputs.hndlFactorPct}% |\n`
    md += `| Data class / assumed shelf life | ${DATA_SENSITIVITY_LABELS[dataSensitivityClass]} / ${shelfLifeYears} years |\n`
    md += `| Verified consequence effective year | ${verifiedAnnualConsequenceUSD > 0 || verifiedOneTimeConsequenceUSD > 0 ? verifiedEffectiveYear : 'not included'} |\n`
    md += `| Verified consequence source | ${verifiedConsequenceSource.trim() || 'none supplied'} |\n\n`
    if (migrationCostRecon) {
      md += `Assessment-profile migration estimate: ${fmt(migrationCostRecon.assessmentCost)} (${migrationCostRecon.recon.verdict} with the industry baseline).\n\n`
    }
    md += `## Year-by-year (cumulative NPV)\n\n`
    md += `| Year | Migrate Now | Delay ${delayYears}yr | Δ |\n|---|---|---|---|\n`
    nowResult.rows.forEach((row, i) => {
      const delayed = delayedResult.rows[i]
      md += `| ${row.year} | ${fmt(row.cumulativeTotal)} | ${fmt(delayed.cumulativeTotal)} | ${fmt(delayed.cumulativeTotal - row.cumulativeTotal)} |\n`
    })
    md += `\n*Illustrative financial scenario, not a forecast or investment recommendation. IBM 2025 per-sector baseline: one edition behind and not independently verified. GRI 2025 expert-survey bands are interpolated by this model. Migration cost, delay premium and most data shelf lives are assumptions. No framework-derived fine is included automatically; only the learner-entered, organization-verified consequence above enters the arithmetic.*\n`
    return md
  }, [
    selectedIndustry,
    delayYears,
    annualBreachProbPct,
    migrationDurationYears,
    mandate,
    mandateLabel,
    moscaVerdict,
    crossover,
    currentYear,
    migrationCostUSD,
    migrationCostOverrideUSD,
    profile.delayPremiumPerYear,
    discountRatePct,
    dataSensitivityClass,
    shelfLifeYears,
    verifiedEffectiveYear,
    verifiedAnnualConsequenceUSD,
    verifiedOneTimeConsequenceUSD,
    verifiedConsequenceSource,
    nowResult,
    delayedResult,
    costOfInaction,
    inputs,
    migrationCostRecon,
  ])

  return (
    <div className="space-y-6">
      {savedInputs && (
        <PreFilledBanner summary="Restored your last saved cost-of-inaction scenario — adjust the controls below to update it." />
      )}
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">Industry</div>
          <FilterDropdown
            items={DELAY_COST_PROFILES.map((p) => ({ id: p.industry, label: p.industry }))}
            selectedId={selectedIndustry}
            onSelect={(industry) => {
              setSelectedIndustry(industry)
              setMigrationCostOverrideUSD(null)
            }}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="inaction-delay" className="text-sm font-medium text-foreground">
            Migration delay:{' '}
            <span className="text-primary font-bold">
              {delayYears} year{delayYears !== 1 ? 's' : ''}
            </span>
          </label>
          <input
            id="inaction-delay"
            type="range"
            min={1}
            max={8}
            value={delayYears}
            onChange={(e) => setDelayYears(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 yr</span>
            <span>compare with start now</span>
            <span>8 yrs</span>
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="inaction-prob"
            className="text-sm font-medium text-foreground flex items-center gap-1"
          >
            <Percent size={13} className="text-muted-foreground" />
            Annual breach probability:{' '}
            <span className="text-primary font-bold">{annualBreachProbPct}%</span>
          </label>
          <div className="flex flex-wrap items-center gap-1">
            {ORG_SIZE_TIER_OPTIONS.map(({ tier, label }) => (
              <Button
                key={tier}
                type="button"
                variant="ghost"
                onClick={() => setAnnualBreachProbPct(ANNUAL_BREACH_PROBABILITY_PCT[tier])}
                className={`h-auto px-1.5 py-0.5 rounded-full border text-[10px] ${
                  annualBreachProbPct === ANNUAL_BREACH_PROBABILITY_PCT[tier]
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </Button>
            ))}
          </div>
          <input
            id="inaction-prob"
            type="range"
            min={1}
            max={25}
            // The IRIS tier anchors are fractional (8.7 / 9.3 / 12.8), so an
            // implicit step of 1 would snap the selected tier to a whole number
            // as soon as the slider was touched.
            step={0.1}
            value={annualBreachProbPct}
            onChange={(e) => setAnnualBreachProbPct(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1%</span>
            <span>25%</span>
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="inaction-migration-duration"
            className="text-sm font-medium text-foreground flex items-center gap-1"
          >
            <Wrench size={13} className="text-muted-foreground" />
            Migration takes:{' '}
            <span className="text-primary font-bold">{migrationDurationYears} yr</span>
          </label>
          <input
            id="inaction-migration-duration"
            type="range"
            min={1}
            max={6}
            value={migrationDurationYears}
            onChange={(e) => setMigrationDurationYears(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 yr</span>
            <span>6 yrs</span>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="inaction-migration-cost" className="text-sm font-medium text-foreground">
            Migration cost (USD)
          </label>
          <input
            id="inaction-migration-cost"
            type="number"
            min={0}
            step={10000}
            value={migrationCostUSD}
            onChange={(e) => setMigrationCostOverrideUSD(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {migrationCostOverrideUSD === null
              ? 'Suggested scenario value; replace it with a reviewed finance estimate.'
              : 'Learner-entered value.'}
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="inaction-discount-rate" className="text-sm font-medium text-foreground">
            Discount rate: <span className="font-bold text-primary">{discountRatePct}%</span>
          </label>
          <input
            id="inaction-discount-rate"
            type="range"
            min={0}
            max={20}
            step={0.5}
            value={discountRatePct}
            onChange={(e) => setDiscountRatePct(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>20%</span>
          </div>
        </div>
      </div>

      <details className="rounded-lg border border-border bg-muted/20 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Optional organization-verified consequence
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          No fine, contract loss or certification loss is inferred from the framework list. Enter a
          value only after your legal, compliance or commercial owner has confirmed that it applies
          to this organization and date.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Effective year</span>
            <input
              aria-label="Verified consequence effective year"
              type="number"
              min={currentYear}
              max={currentYear + 30}
              value={verifiedEffectiveYear}
              onChange={(e) => setVerifiedEffectiveYear(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Annual consequence (USD)</span>
            <input
              aria-label="Verified annual consequence"
              type="number"
              min={0}
              step={10000}
              value={verifiedAnnualConsequenceUSD}
              onChange={(e) => setVerifiedAnnualConsequenceUSD(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">One-time consequence (USD)</span>
            <input
              aria-label="Verified one-time consequence"
              type="number"
              min={0}
              step={10000}
              value={verifiedOneTimeConsequenceUSD}
              onChange={(e) =>
                setVerifiedOneTimeConsequenceUSD(Math.max(0, Number(e.target.value)))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Source or owner</span>
            <input
              aria-label="Verified consequence source or owner"
              type="text"
              value={verifiedConsequenceSource}
              onChange={(e) => setVerifiedConsequenceSource(e.target.value)}
              placeholder="e.g. Legal memo, 2026-10-01"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      </details>

      {breachOutput && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info size={12} className="shrink-0" />
          {chainedFromSimulator ? (
            <>
              Breach inputs (baseline, harvested data, HNDL exposure) carried over from the Breach
              Scenario Simulator for {selectedIndustry}.
            </>
          ) : (
            <>
              The Breach Scenario Simulator ran for {breachOutput.industry}, not {selectedIndustry}{' '}
              — using the {selectedIndustry} industry baseline instead.
            </>
          )}
        </p>
      )}

      <section
        aria-label="Scenario assumptions"
        className="rounded-lg border border-primary/25 bg-primary/5 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Scenario assumptions</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setMigrationCostOverrideUSD(null)
              setDiscountRatePct(DELAY_MODEL_DEFAULTS.discountRatePct)
              setVerifiedAnnualConsequenceUSD(0)
              setVerifiedOneTimeConsequenceUSD(0)
              setVerifiedConsequenceSource('')
            }}
          >
            Reset financial assumptions
          </Button>
        </div>
        <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="font-semibold text-foreground">Breach baseline</dt>
            <dd>
              {fmt(inputs.breachBaseline)} — IBM 2025 sector assumption, one edition behind and not
              independently verified
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Breach probability</dt>
            <dd>{annualBreachProbPct}% — Cyentia IRIS 2025 primary-verified</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">CRQC uncertainty</dt>
            <dd>GRI 2025 expert-survey bands, interpolated by this model</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Stored data / HNDL</dt>
            <dd>
              {inputs.baseYearsOfData} years / {inputs.hndlFactorPct}% (
              {chainedFromSimulator ? 'carried from Step 3' : 'example defaults'})
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Shelf life</dt>
            <dd>
              {shelfLifeYears} years for {DATA_SENSITIVITY_LABELS[dataSensitivityClass]} — modelling
              assumption
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Finance</dt>
            <dd>
              {inputs.horizonYears}-year horizon, {discountRatePct}% discount rate; migration and
              delay premium are scenario assumptions
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {IBM_BASELINE_UNVERIFIED_NOTE}
        </p>
      </section>

      {selectedPersona === 'executive' && (
        <section
          aria-label="Executive decision brief"
          className="rounded-lg border border-primary/30 bg-muted/20 p-4"
        >
          <h2 className="text-base font-semibold text-foreground">Executive decision brief</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-foreground">Decision being tested</dt>
              <dd className="text-muted-foreground">
                Start migration now or defer its start by {delayYears} year
                {delayYears === 1 ? '' : 's'}, over the same {inputs.horizonYears}-year horizon.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Modelled direction</dt>
              <dd className="text-muted-foreground">
                {nearZero
                  ? 'The two choices are within $1,000 in the central scenario.'
                  : costOfInaction > 0
                    ? `Deferral adds ${fmt(costOfInaction)} in the central scenario.`
                    : `Deferral reduces discounted NPV by ${fmt(Math.abs(costOfInaction))}, while leaving exposure higher for longer.`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Largest modelled driver</dt>
              <dd className="text-muted-foreground">
                {largestDriver.label} ({fmt(largestDriver.value)} incremental NPV).
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">Before using this result</dt>
              <dd className="text-muted-foreground">
                Replace example costs with finance-reviewed inputs, validate data lifetime and
                breach assumptions, and obtain written confirmation for any legal or commercial
                consequence.
              </dd>
            </div>
          </dl>
        </section>
      )}

      {/* Key metrics (NPV over the horizon) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-4 border bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground">
              Migrate Now ({inputs.horizonYears}-yr NPV)
            </span>
          </div>
          <div className="text-2xl font-bold text-primary">{fmt(nowResult.total)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Migration + residual HNDL exposure
          </div>
        </div>
        <div className="glass-panel p-4 border bg-status-warning/5 border-status-warning/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={14} className="text-status-warning" />
            <span className="text-xs text-muted-foreground">
              Delay {delayYears}yr ({inputs.horizonYears}-yr NPV)
            </span>
          </div>
          <div className="text-2xl font-bold text-status-warning">{fmt(delayedResult.total)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Accumulated exposure + delay premium
          </div>
        </div>
        <div
          className={`glass-panel p-4 border ${
            costOfInaction < 0
              ? 'bg-status-warning/5 border-status-warning/20'
              : 'bg-status-error/5 border-status-error/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle
              size={14}
              className={costOfInaction < 0 ? 'text-status-warning' : 'text-status-error'}
            />
            <span className="text-xs text-muted-foreground">Incremental NPV of deferral</span>
          </div>
          <div
            className={`text-2xl font-bold ${
              costOfInaction < 0 ? 'text-status-warning' : 'text-status-error'
            }`}
          >
            {fmt(costOfInaction)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Delay scenario minus migrate-now scenario
          </div>
          {/* A negative figure is a real result, not an error, and it must be
              explained rather than left to read as "$0 risk". At a high
              discount rate with no binding mandate, deferring the migration
              capex can outweigh the extra breach exposure it buys. */}
          {costOfInaction < 0 && (
            <div className="text-xs text-status-warning mt-2 leading-relaxed">
              Negative: at a {inputs.discountRatePct}% discount rate
              {mandate.mandateType !== 'HARD' && ' and with no binding mandate'}, deferring the
              migration spend is worth more in present-value terms than the added breach exposure it
              buys. That is a financing result, not a safety verdict. Set the discount rate to 0% to
              inspect undiscounted modelled dollars; that is not the same as an inflation-adjusted
              real-dollar analysis.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
        <h2 className="font-semibold text-foreground">CRQC scenario range</h2>
        <p className="mt-1 text-muted-foreground">
          Across the GRI expert-survey slow and fast bands, the incremental NPV ranges from{' '}
          <strong className="text-foreground">{fmt(scenarioLow)}</strong> to{' '}
          <strong className="text-foreground">{fmt(scenarioHigh)}</strong>. The headline uses the
          consensus midpoint. This range is scenario uncertainty, not a confidence interval.
        </p>
      </div>

      {/* Mosca's inequality + crossover year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass-panel p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-primary" />
            <span className="text-xs font-medium text-foreground">Mosca scenario threshold</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {DATA_SENSITIVITY_LABELS[dataSensitivityClass]} must stay secure for {shelfLifeYears}{' '}
            years; migration takes {migrationDurationYears}.{' '}
            {moscaVerdict.alreadyLate ? (
              <>
                In the consensus scenario, the latest-start threshold is already past (
                <strong className="text-status-error">
                  {Math.round(moscaVerdict.latestSafeStartYear)}
                </strong>
                ) for the median CRQC year ({moscaVerdict.crqcYear}). This is not a safe-date
                guarantee.
              </>
            ) : (
              <>
                The consensus-scenario threshold is{' '}
                <strong className="text-primary">
                  {Math.round(moscaVerdict.latestSafeStartYear)}
                </strong>{' '}
                when compared with the median CRQC year ({moscaVerdict.crqcYear}). This is a
                planning scenario, not a safe-date guarantee.
              </>
            )}
          </p>
        </div>
        <div className="glass-panel p-4 border-l-4 border-l-status-error">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-status-error" />
            <span className="text-xs font-medium text-foreground">Crossover year</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {crossover !== null ? (
              <>
                Delaying {delayYears} year{delayYears !== 1 ? 's' : ''} costs more from{' '}
                <strong className="text-status-error">{crossover}</strong> through the end of this
                {` ${inputs.horizonYears}`}-year horizon.
              </>
            ) : (
              <>
                Within this {inputs.horizonYears}-year horizon, delaying never permanently overtakes
                migrating now.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Side-by-side year table */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar size={14} className="text-primary" />
          {inputs.horizonYears}-Year Cost Comparison (cumulative NPV)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Year</th>
                <th className="text-right py-2 px-3 text-primary font-medium">Migrate Now</th>
                <th className="text-right py-2 px-3 text-status-warning font-medium">
                  Delay {delayYears}yr
                </th>
                <th className="text-right py-2 px-3 text-status-error font-medium">Δ Cost</th>
              </tr>
            </thead>
            <tbody>
              {nowResult.rows.map((row, i) => {
                const delayed = delayedResult.rows[i]
                const delta = delayed.cumulativeTotal - row.cumulativeTotal
                return (
                  <tr key={row.year} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="py-2 px-3 font-medium text-foreground">{row.year}</td>
                    <td className="py-2 px-3 text-right text-primary">
                      {fmt(row.cumulativeTotal)}
                    </td>
                    <td className="py-2 px-3 text-right text-status-warning">
                      {fmt(delayed.cumulativeTotal)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-semibold ${delta > 0 ? 'text-status-error' : 'text-status-success'}`}
                    >
                      {delta > 0 ? '+' : ''}
                      {fmt(delta)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* B+ remediation 4.6 (2026-08-10): end in a sentence, not a number.
          "A generated document the user cannot defend is worse than no
          document" — the tool produced correct figures and left the reader to
          work out what they meant. Every value below is read from the same
          computation the panels above render, so the sentence cannot disagree
          with the numbers it is summarising. */}
      <div className="glass-panel border-l-4 border-l-primary p-4">
        <h2 className="mb-1 text-sm font-semibold text-foreground">What this is telling you</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {nearZero ? (
            <>
              At the displayed precision, waiting {delayYears} year{delayYears === 1 ? '' : 's'}{' '}
              does not materially change the {inputs.horizonYears}-year NPV in the central scenario.
            </>
          ) : costOfInaction > 0 ? (
            <>
              Waiting {delayYears} year{delayYears === 1 ? '' : 's'} adds approximately{' '}
              <strong className="text-foreground">{fmt(costOfInaction)}</strong> over{' '}
              {inputs.horizonYears} years in the central scenario. The largest modelled driver is{' '}
              {largestDriver.label}.
            </>
          ) : (
            <>
              Waiting {delayYears} year{delayYears === 1 ? '' : 's'} lowers discounted NPV by
              approximately{' '}
              <strong className="text-foreground">{fmt(Math.abs(costOfInaction))}</strong> because
              spending is deferred, while the organization remains exposed for longer. This is a
              financing result, not a safety recommendation.
            </>
          )}{' '}
          The Mosca date shown above is a threshold under assumed data shelf life, migration time
          and the GRI consensus scenario; validate all three before using it in a decision.
        </p>
      </div>

      {/* Cost breakdown for delayed scenario */}
      <div className="glass-panel p-4 border-l-4 border-l-status-warning space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Delay {delayYears}yr — Cost Breakdown ({inputs.horizonYears}-year NPV)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Migration (with delay premium)</p>
            <p className="font-semibold text-foreground">{fmt(delayedResult.totalMigration)}</p>
            <p className="text-xs text-muted-foreground">
              Base {fmt(migrationCostUSD)} + {fmt(profile.delayPremiumPerYear * delayYears)}{' '}
              premium, discounted
            </p>
            {migrationCostRecon && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {migrationCostRecon.lowConfidence
                  ? 'Assessment profile too thin for a reliable second estimate.'
                  : migrationCostRecon.recon.verdict === 'aligned'
                    ? `Consistent with your assessment profile (${fmt(migrationCostRecon.assessmentCost)}).`
                    : `Your assessment profile estimates ${fmt(migrationCostRecon.assessmentCost)} — ${migrationCostRecon.recon.ratio.toFixed(1)}× different from the industry baseline.`}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Expected breach loss</p>
            <p className="font-semibold text-status-error">{fmt(delayedResult.totalBreach)}</p>
            <p className="text-xs text-muted-foreground">
              Full exposure while unmigrated, ramping to a residual HNDL tail (already-harvested
              data only) once migration completes
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Verified consequence</p>
            <p className="font-semibold text-status-warning">{fmt(delayedResult.totalPenalty)}</p>
            <p className="text-xs text-muted-foreground">
              {verifiedAnnualConsequenceUSD > 0 || verifiedOneTimeConsequenceUSD > 0 ? (
                <>
                  Learner-entered amounts apply while migration remains incomplete after{' '}
                  {verifiedEffectiveYear}. Source/owner:{' '}
                  {verifiedConsequenceSource.trim() ||
                    'not supplied — add one before relying on it'}
                  .
                </>
              ) : (
                <>
                  $0 by default. The {mandate.deadlineYear} date shown elsewhere (
                  {mandate.driverName}) is planning context only and does not prove a fine or
                  contract loss applies.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Methodology */}
      <details className="glass-panel p-4">
        <summary className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2">
          <Info size={14} className="text-muted-foreground" />
          How this is calculated
        </summary>
        <div className="mt-3 text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Breach loss:</strong> the same probability-weighted model as the Breach Scenario
            Simulator — a blend of &quot;no CRQC exists&quot; and &quot;CRQC exists&quot; outcomes.
            Each projected year is weighted by the probability, from the GRI 2025 survey&apos;s
            arrival curve, that a CRQC <em>exists by then</em> — not merely that one arrives in that
            particular year, since a machine built in 2032 is still there in 2040. HNDL exposure
            decays with {DATA_SENSITIVITY_LABELS[dataSensitivityClass]}&apos;s {shelfLifeYears}-year
            shelf life, measured at the moment the data would be decrypted rather than today: that
            is what migrating early buys you, because a corpus frozen well before a CRQC arrives has
            aged out of its own shelf life by the time anyone can read it. Applied at your{' '}
            {annualBreachProbPct}% annual breach probability.{' '}
            {chainedFromSimulator
              ? 'Inputs carried over from the Breach Scenario Simulator step.'
              : `Defaults: ${DELAY_MODEL_DEFAULTS.baseYearsOfData} years of harvested data, ${DELAY_MODEL_DEFAULTS.hndlFactorPct}% HNDL exposure.`}
          </p>
          <p>
            <strong>Migrating now is not zero-risk:</strong> data harvested before you migrate stays
            decryptable, so a residual HNDL tail persists after migration — exposure ramps down over
            the {migrationDurationYears}-year migration window rather than switching off instantly.
            For this educational scenario, the vulnerable corpus stops growing when migration
            begins; a real staged migration may keep creating quantum-vulnerable ciphertext on
            legacy systems.
          </p>
          <p>
            <strong>Planning date context:</strong>{' '}
            {mandate.mandateType === 'HARD'
              ? `a candidate requirement record (${mandate.driverName}), not a legal determination`
              : mandate.mandateType === 'SOFT'
                ? `guidance, not a binding mandate (${mandate.driverName})`
                : 'no framework or country mandate applies to this industry'}{' '}
            — {mandate.deadlineYear}{' '}
            {mandate.driverSource === 'planning-anchor'
              ? 'is a NIST IR 8547 planning anchor (final NIST guidance).'
              : 'is derived from the cited compliance/timeline record, but its applicability and effective date still require review.'}{' '}
            No dollar consequence is inferred from that record. If you enter a verified consequence,
            it applies only while migration remains incomplete after the effective year you
            supplied.
          </p>
          <p>
            <strong>Mosca&apos;s inequality:</strong> shelf life + migration time compared against
            the median CRQC year ({moscaVerdict.crqcYear}, GRI 2025 consensus scenario). The slow,
            consensus and fast curves interpolate expert-survey probability bands; they are not
            predictions or confidence intervals.
          </p>
          <p>
            <strong>NPV:</strong> cash flows are discounted at the learner-adjustable{' '}
            {inputs.discountRatePct}% rate over {inputs.horizonYears} years. Migration capex is
            modelled as one payment when migration starts; it is not spread across the programme.
          </p>
          <p className="italic">
            Illustrative financial scenario, not a forecast, actuarial opinion or investment
            recommendation. Migration cost, delay premium and most data shelf lives are assumptions.
            Pair the export with reviewed finance, legal and technical inputs before making a
            decision.
          </p>
        </div>
      </details>

      <ExportableArtifact
        title="Cost of Inaction — Export"
        exportData={exportMarkdown}
        filename="pqc-cost-of-inaction"
        formats={['markdown', 'pdf', 'docx']}
        onExport={() =>
          addExecutiveDocument({
            id: `cost-of-inaction-${Date.now()}`,
            moduleId: 'pqc-business-case',
            type: 'cost-of-inaction',
            title: `Cost of Inaction — ${selectedIndustry} (${new Date().toLocaleDateString()})`,
            data: exportMarkdown,
            inputs: {
              selectedIndustry,
              delayYears,
              annualBreachProbPct,
              migrationDurationYears,
              migrationCostOverrideUSD,
              discountRatePct,
              verifiedEffectiveYear,
              verifiedAnnualConsequenceUSD,
              verifiedOneTimeConsequenceUSD,
              verifiedConsequenceSource,
              scenario: scenarioRecord,
            },
            output: outputPayload,
            createdAt: Date.now(),
          })
        }
      >
        <p className="text-sm text-muted-foreground">
          Export the cost-of-inaction analysis as markdown, PDF, or DOCX. It is also saved to your
          Command Center Risk Artifacts.
        </p>
      </ExportableArtifact>
    </div>
  )
}
