// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useState } from 'react'
import { TrendingDown, AlertTriangle, DollarSign, Calendar, Percent, Info } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { DELAY_COST_PROFILES } from '../data/businessCaseScenarios'
import { resolveIndustryBreachBaseline } from '@/utils/roiMath'
import {
  DELAY_MODEL_DEFAULTS,
  projectDelayScenario,
  type DelayScenarioInputs,
} from '@/utils/delayCostModel'

function fmt(n: number): string {
  const sign = n < 0 ? '-' : ''
  const a = Math.abs(n)
  if (a >= 1_000_000_000) return `${sign}$${(a / 1_000_000_000).toFixed(1)}B`
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(1)}M`
  if (a >= 1_000) return `${sign}$${(a / 1_000).toFixed(0)}K`
  return `${sign}$${a.toFixed(0)}`
}

interface BreachOutput {
  classicalCostUSD: number
  quantumCostUSD: number
  deltaUSD: number
}

interface InactionOutput {
  costOfInactionUSD: number
  delayYears: number
}

interface CostOfInactionAnalyzerProps {
  breachOutput?: BreachOutput | null
  onOutput?: (output: InactionOutput) => void
}

export const CostOfInactionAnalyzer: React.FC<CostOfInactionAnalyzerProps> = ({
  breachOutput,
  onOutput,
}) => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const [selectedIndustry, setSelectedIndustry] = useState<string>('Finance & Banking')
  const [delayYears, setDelayYears] = useState<number>(2)
  const [annualBreachProbPct, setAnnualBreachProbPct] = useState<number>(
    DELAY_MODEL_DEFAULTS.annualBreachProbPct
  )

  const profile = useMemo(
    () =>
      DELAY_COST_PROFILES.find((p) => p.industry === selectedIndustry) ?? DELAY_COST_PROFILES[0],
    [selectedIndustry]
  )

  const inputs: DelayScenarioInputs = useMemo(() => {
    // The Breach Simulator's quantumCost is already an HNDL-amplified single-event
    // cost; use it directly. Without it, amplify the classical industry baseline
    // (single source of truth) by the profile's HNDL factor — once.
    const override = (breachOutput?.quantumCostUSD ?? 0) > 0 ? breachOutput!.quantumCostUSD : null
    const classicalBaseline = resolveIndustryBreachBaseline(selectedIndustry)
    const quantumBreachPerEvent = override ?? classicalBaseline * profile.hndlExposureMultiplier
    return {
      quantumBreachPerEvent,
      annualBreachProbPct,
      migrationCostUSD: profile.migrationCostUSD,
      delayPremiumPerYear: profile.delayPremiumPerYear,
      regulatoryPenaltyUSD: profile.regulatoryPenaltyUSD,
      hardDeadlineYear: profile.hardDeadline,
      currentYear: new Date().getFullYear(),
      horizonYears: DELAY_MODEL_DEFAULTS.horizonYears,
      discountRatePct: DELAY_MODEL_DEFAULTS.discountRatePct,
      residualFactor: DELAY_MODEL_DEFAULTS.residualFactor,
    }
  }, [breachOutput, selectedIndustry, profile, annualBreachProbPct])

  const nowResult = useMemo(() => projectDelayScenario(inputs, 0), [inputs])
  const delayedResult = useMemo(
    () => projectDelayScenario(inputs, delayYears),
    [inputs, delayYears]
  )
  const costOfInaction = delayedResult.total - nowResult.total

  useEffect(() => {
    onOutput?.({ costOfInactionUSD: costOfInaction, delayYears })
  }, [onOutput, costOfInaction, delayYears])

  const exportMarkdown = useMemo(() => {
    let md = `# PQC Cost of Inaction — ${selectedIndustry}\n\n`
    md += `**Generated:** ${new Date().toLocaleDateString()}\n\n`
    md += `| Metric | Value |\n|--------|-------|\n`
    md += `| Migrate now (${inputs.horizonYears}-yr NPV) | ${fmt(nowResult.total)} |\n`
    md += `| Delay ${delayYears}yr (${inputs.horizonYears}-yr NPV) | ${fmt(delayedResult.total)} |\n`
    md += `| **Cost of inaction (delay ${delayYears}yr)** | **${fmt(costOfInaction)}** |\n`
    md += `| Annual breach probability | ${annualBreachProbPct}% |\n\n`
    md += `## Delay ${delayYears}yr breakdown (NPV)\n\n`
    md += `| Component | Value |\n|-----------|-------|\n`
    md += `| Migration (with delay premium) | ${fmt(delayedResult.totalMigration)} |\n`
    md += `| Expected breach loss | ${fmt(delayedResult.totalBreach)} |\n`
    md += `| Regulatory penalties | ${fmt(delayedResult.totalPenalty)} |\n\n`
    md += `*Illustrative — IBM Cost of a Data Breach 2024 baselines, NIST IR 8547. Discounted at ${inputs.discountRatePct}% over ${inputs.horizonYears} years; ${Math.round(inputs.residualFactor * 100)}% HNDL residual after migration.*\n`
    return md
  }, [
    selectedIndustry,
    delayYears,
    annualBreachProbPct,
    nowResult.total,
    delayedResult,
    costOfInaction,
    inputs,
  ])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <span>past {profile.hardDeadline} deadline →</span>
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
      </div>

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
              Base {fmt(profile.migrationCostUSD)} + {fmt(profile.delayPremiumPerYear * delayYears)}{' '}
              premium, discounted
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Expected breach loss</p>
            <p className="font-semibold text-status-error">{fmt(delayedResult.totalBreach)}</p>
            <p className="text-xs text-muted-foreground">
              Full exposure while unmigrated, then a {Math.round(inputs.residualFactor * 100)}% HNDL
              residual
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Regulatory penalties</p>
            <p className="font-semibold text-status-warning">{fmt(delayedResult.totalPenalty)}</p>
            <p className="text-xs text-muted-foreground">
              {fmt(profile.regulatoryPenaltyUSD)}/yr once past the {profile.hardDeadline} deadline
              unmigrated
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
            <strong>Breach loss:</strong> the quantum-enabled breach cost (from the Breach Simulator
            if you ran it, otherwise the IBM 2024 industry baseline × this industry&apos;s HNDL
            factor) × your {annualBreachProbPct}% annual probability. HNDL is applied once, not
            twice.
          </p>
          <p>
            <strong>Migrating now is not zero-risk:</strong> data harvested before you migrate stays
            decryptable, so a {Math.round(inputs.residualFactor * 100)}% residual exposure persists
            after migration.
          </p>
          <p>
            <strong>Penalties</strong> accrue only for years you remain unmigrated past the{' '}
            {profile.hardDeadline} deadline — a short delay that still beats it incurs none.
          </p>
          <p>
            <strong>NPV:</strong> all cash flows are discounted at {inputs.discountRatePct}% over{' '}
            {inputs.horizonYears} years, matching the ROI Calculator.
          </p>
          <p className="italic">
            Illustrative estimates — IBM Cost of a Data Breach 2024 baselines and NIST IR 8547
            urgency guidance. Pair with your finance model before committing capital.
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
            inputs: { selectedIndustry, delayYears, annualBreachProbPct },
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
