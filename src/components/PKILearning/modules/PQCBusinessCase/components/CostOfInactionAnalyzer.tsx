// SPDX-License-Identifier: GPL-3.0-only
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
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { DELAY_COST_PROFILES } from '../data/businessCaseScenarios'
import {
  resolveIndustryBreachBaseline,
  computeMigrationCostFromProfile,
  reconcileEstimates,
  MIGRATION_COST_FLOOR,
} from '@/utils/roiMath'
import { ANNUAL_BREACH_PROBABILITY_PCT, type OrgSizeTier } from '@/data/roiBaselines'
import {
  DELAY_MODEL_DEFAULTS,
  projectDelayScenario,
  crossoverYear,
  type DelayScenarioInputs,
} from '@/utils/delayCostModel'
import { DATA_SHELF_LIFE_YEARS, DATA_SENSITIVITY_LABELS } from '@/utils/breachCostModel'
import { computeMoscaVerdict } from '@/utils/moscaTheorem'
import { deriveIndustryMandate, deriveIndustryPenalty } from '@/utils/inactionDrivers'
import type { BreachOutput, InactionOutput } from '../types'

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
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const [selectedIndustry, setSelectedIndustry] = useState<string>(
    data.industry || 'Finance & Banking'
  )
  const [delayYears, setDelayYears] = useState<number>(2)
  const [annualBreachProbPct, setAnnualBreachProbPct] = useState<number>(
    DELAY_MODEL_DEFAULTS.annualBreachProbPct
  )
  const [migrationDurationYears, setMigrationDurationYears] = useState<number>(
    DELAY_MODEL_DEFAULTS.migrationDurationYears
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
  const penalty = useMemo(() => deriveIndustryPenalty(selectedIndustry), [selectedIndustry])

  // Independent second migration-cost estimate from the user's assessment
  // profile — the same cross-check the ROI Calculator already runs.
  const assessmentDerived = useMemo(
    () =>
      data.isAssessmentComplete && data.assessmentResult
        ? computeMigrationCostFromProfile(data.assessmentResult)
        : null,
    [data.isAssessmentComplete, data.assessmentResult]
  )
  const migrationCostUSD = assessmentDerived?.migrationCost ?? profile.migrationCostUSD
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
      mandateType: mandate.mandateType,
      hardDeadlineYear: mandate.deadlineYear,
      annualFineUSD: penalty.annualFineUSD,
      cliffLossUSD: penalty.cliffLossUSD,
      currentYear,
      horizonYears: DELAY_MODEL_DEFAULTS.horizonYears,
      discountRatePct: DELAY_MODEL_DEFAULTS.discountRatePct,
    }
  }, [
    chainedFromSimulator,
    selectedIndustry,
    dataSensitivityClass,
    annualBreachProbPct,
    migrationCostUSD,
    profile.delayPremiumPerYear,
    migrationDurationYears,
    mandate,
    penalty,
    currentYear,
  ])

  const nowResult = useMemo(() => projectDelayScenario(inputs, 0), [inputs])
  const delayedResult = useMemo(
    () => projectDelayScenario(inputs, delayYears),
    [inputs, delayYears]
  )
  const costOfInaction = delayedResult.total - nowResult.total
  const crossover = useMemo(
    () => crossoverYear(nowResult.rows, delayedResult.rows),
    [nowResult, delayedResult]
  )

  useEffect(() => {
    onOutput?.({
      costOfInactionUSD: costOfInaction,
      delayYears,
      crossoverYear: crossover,
      latestSafeStartYear: moscaVerdict.latestSafeStartYear,
      alreadyLate: moscaVerdict.alreadyLate,
    })
  }, [onOutput, costOfInaction, delayYears, crossover, moscaVerdict])

  const mandateLabel =
    mandate.mandateType === 'HARD'
      ? 'binding deadline'
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
    md += `| Regulatory deadline | ${mandate.deadlineYear} (${mandateLabel} — ${mandate.driverName}) |\n`
    md += `| Mosca latest safe start | ${Math.round(moscaVerdict.latestSafeStartYear)} (median CRQC arrival ${moscaVerdict.crqcYear}) |\n`
    md += `| Crossover year | ${crossover ?? `beyond the ${inputs.horizonYears}-year horizon`} |\n\n`
    md += `## Delay ${delayYears}yr breakdown (NPV)\n\n`
    md += `| Component | Value |\n|-----------|-------|\n`
    md += `| Migration (with delay premium) | ${fmt(delayedResult.totalMigration)} |\n`
    md += `| Expected breach loss | ${fmt(delayedResult.totalBreach)} |\n`
    md += `| Regulatory fine (${penalty.annualFineDriver ?? 'none'}) | ${fmt(delayedResult.totalFine)} |\n`
    md += `| Regulatory cliff loss (${penalty.cliffLossDriver ?? 'none'}) | ${fmt(delayedResult.totalCliff)} |\n\n`
    if (migrationCostRecon) {
      md += `Assessment-profile migration estimate: ${fmt(migrationCostRecon.assessmentCost)} (${migrationCostRecon.recon.verdict} with the industry baseline).\n\n`
    }
    md += `## Year-by-year (cumulative NPV)\n\n`
    md += `| Year | Migrate Now | Delay ${delayYears}yr | Δ |\n|---|---|---|---|\n`
    nowResult.rows.forEach((row, i) => {
      const delayed = delayedResult.rows[i]
      md += `| ${row.year} | ${fmt(row.cumulativeTotal)} | ${fmt(delayed.cumulativeTotal)} | ${fmt(delayed.cumulativeTotal - row.cumulativeTotal)} |\n`
    })
    md += `\n*Illustrative — same probability-weighted breach model as the Breach Scenario Simulator (IBM 2025 baseline, GRI 2025 CRQC-arrival curve); deadline/penalty traced to complianceData.ts and the timeline CSV. Discounted at ${inputs.discountRatePct}% over ${inputs.horizonYears} years. Migration cost and delay premium are analyst estimates, not cited figures.*\n`
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
    penalty,
    nowResult,
    delayedResult,
    costOfInaction,
    inputs,
    migrationCostRecon,
  ])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">Industry</div>
          <FilterDropdown
            items={DELAY_COST_PROFILES.map((p) => ({ id: p.industry, label: p.industry }))}
            selectedId={selectedIndustry}
            onSelect={setSelectedIndustry}
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
            <span>past {mandate.deadlineYear} →</span>
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
      </div>

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
        <div className="glass-panel p-4 border bg-status-error/5 border-status-error/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-status-error" />
            <span className="text-xs text-muted-foreground">Cost of Inaction</span>
          </div>
          <div className="text-2xl font-bold text-status-error">{fmt(costOfInaction)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Extra cost from delaying {delayYears} year{delayYears !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Mosca's inequality + crossover year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass-panel p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-primary" />
            <span className="text-xs font-medium text-foreground">Mosca&apos;s inequality</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {DATA_SENSITIVITY_LABELS[dataSensitivityClass]} must stay secure for {shelfLifeYears}{' '}
            years; migration takes {migrationDurationYears}.{' '}
            {moscaVerdict.alreadyLate ? (
              <>
                Already past the latest safe start (
                <strong className="text-status-error">
                  {Math.round(moscaVerdict.latestSafeStartYear)}
                </strong>
                ) for the median CRQC arrival year ({moscaVerdict.crqcYear}).
              </>
            ) : (
              <>
                Migration should start no later than{' '}
                <strong className="text-primary">
                  {Math.round(moscaVerdict.latestSafeStartYear)}
                </strong>{' '}
                to stay protected through the median CRQC arrival year ({moscaVerdict.crqcYear}).
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
                Delaying {delayYears} year{delayYears !== 1 ? 's' : ''} permanently costs more
                starting <strong className="text-status-error">{crossover}</strong>.
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
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar size={14} className="text-primary" />
          {inputs.horizonYears}-Year Cost Comparison (cumulative NPV)
        </h4>
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

      {/* Cost breakdown for delayed scenario */}
      <div className="glass-panel p-4 border-l-4 border-l-status-warning space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          Delay {delayYears}yr — Cost Breakdown ({inputs.horizonYears}-year NPV)
        </h4>
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
            <p className="text-xs text-muted-foreground mb-0.5">Regulatory exposure</p>
            <p className="font-semibold text-status-warning">{fmt(delayedResult.totalPenalty)}</p>
            <p className="text-xs text-muted-foreground">
              {mandate.mandateType === 'HARD' ? (
                <>
                  {penalty.annualFineUSD > 0 &&
                    `${fmt(penalty.annualFineUSD)}/yr fine (${penalty.annualFineDriver}) `}
                  {penalty.cliffLossUSD > 0 &&
                    `+ ${fmt(penalty.cliffLossUSD)} one-time loss (${penalty.cliffLossDriver}) `}
                  {penalty.annualFineUSD === 0 && penalty.cliffLossUSD === 0
                    ? `no priced penalty found for this industry's binding frameworks — `
                    : ''}
                  once unmigrated past the {mandate.deadlineYear} deadline ({mandate.driverName}).
                </>
              ) : mandate.mandateType === 'SOFT' ? (
                <>
                  {mandate.deadlineYear} is a guidance target ({mandate.driverName}), not a binding
                  mandate — no penalty modeled.
                </>
              ) : (
                <>
                  No binding PQC mandate found for {selectedIndustry} — {mandate.deadlineYear} is a
                  planning anchor ({mandate.driverName}), not a penalty trigger.
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
            Simulator — a blend of &quot;no CRQC exists&quot; and &quot;CRQC exists&quot; outcomes
            weighted by the GRI 2025 survey&apos;s CRQC-arrival curve, with HNDL exposure decayed by{' '}
            {DATA_SENSITIVITY_LABELS[dataSensitivityClass]}&apos;s {shelfLifeYears}-year shelf life,
            at your {annualBreachProbPct}% annual breach probability.{' '}
            {chainedFromSimulator
              ? 'Inputs carried over from the Breach Scenario Simulator step.'
              : `Defaults: ${DELAY_MODEL_DEFAULTS.baseYearsOfData} years of harvested data, ${DELAY_MODEL_DEFAULTS.hndlFactorPct}% HNDL exposure.`}
          </p>
          <p>
            <strong>Migrating now is not zero-risk:</strong> data harvested before you migrate stays
            decryptable, so a residual HNDL tail persists after migration — exposure ramps down over
            the {migrationDurationYears}-year migration window rather than switching off instantly,
            and no further data is harvested once migration begins.
          </p>
          <p>
            <strong>Deadline:</strong>{' '}
            {mandate.mandateType === 'HARD'
              ? `a binding requirement (${mandate.driverName})`
              : mandate.mandateType === 'SOFT'
                ? `guidance, not a binding mandate (${mandate.driverName})`
                : 'no framework or country mandate applies to this industry'}{' '}
            — {mandate.deadlineYear}{' '}
            {mandate.driverSource === 'planning-anchor'
              ? 'is a NIST IR 8547 (draft) planning anchor, not a deadline you can be penalized against.'
              : 'is derived from complianceData.ts / the timeline CSV, not hand-picked.'}{' '}
            Penalties accrue only once migration is fully complete and past a HARD deadline — a
            short delay that still finishes before it incurs none.
          </p>
          <p>
            <strong>Mosca&apos;s inequality:</strong> shelf life + migration time compared against
            the median CRQC arrival year ({moscaVerdict.crqcYear}, GRI 2025 consensus scenario) —
            the same decision rule the Breach Scenario Simulator uses.
          </p>
          <p>
            <strong>NPV:</strong> all cash flows are discounted at {inputs.discountRatePct}% over{' '}
            {inputs.horizonYears} years, matching the ROI Calculator.
          </p>
          <p className="italic">
            Illustrative estimates. Migration cost and delay premium are industry-analyst estimates,
            not cited figures. Pair with your finance model before committing capital.
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
            inputs: { selectedIndustry, delayYears, annualBreachProbPct, migrationDurationYears },
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
