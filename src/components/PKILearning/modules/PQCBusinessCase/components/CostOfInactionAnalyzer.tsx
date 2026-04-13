// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { TrendingDown, AlertTriangle, DollarSign, Calendar } from 'lucide-react'
import {
  DELAY_COST_PROFILES,
  annualBreachRisk,
  type DelayCostProfile,
} from '../data/businessCaseScenarios'
import { INDUSTRY_BREACH_BASELINES } from '@/data/roiBaselines'

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

interface YearRow {
  year: number
  cumulativeMigrationCost: number
  cumulativeBreachRisk: number
  cumulativePenalty: number
  total: number
}

function computeRows(profile: DelayCostProfile, breachBaseline: number, delay: number): YearRow[] {
  const now = new Date().getFullYear()
  const rows: YearRow[] = []
  let cumMigration = 0
  let cumBreach = 0
  let cumPenalty = 0

  for (let d = 0; d <= 5; d++) {
    const yr = now + d
    // Migration cost: base cost incurred in migration year, premium for each year of delay
    if (d === delay) {
      cumMigration += profile.migrationCostUSD + profile.delayPremiumPerYear * delay
    }
    // Annual breach risk: accumulates while still on classical crypto (before migration)
    if (d < delay) {
      cumBreach += annualBreachRisk(breachBaseline, profile.hndlExposureMultiplier)
    }
    // Regulatory penalty: starts after hard deadline if not yet migrated
    if (yr > profile.hardDeadline && d >= delay === false) {
      cumPenalty += profile.regulatoryPenaltyUSD
    }
    if (yr > profile.hardDeadline && d < delay) {
      cumPenalty += profile.regulatoryPenaltyUSD
    }
    rows.push({
      year: yr,
      cumulativeMigrationCost: cumMigration,
      cumulativeBreachRisk: cumBreach,
      cumulativePenalty: cumPenalty,
      total: cumMigration + cumBreach + cumPenalty,
    })
  }
  return rows
}

export const CostOfInactionAnalyzer: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('Finance & Banking')
  const [migrateNowDelay] = useState(0)
  const [delayYears, setDelayYears] = useState<number>(2)

  const profile = useMemo(
    () =>
      DELAY_COST_PROFILES.find((p) => p.industry === selectedIndustry) ?? DELAY_COST_PROFILES[0],
    [selectedIndustry]
  )

  const breachBaseline = useMemo(
    () => INDUSTRY_BREACH_BASELINES[selectedIndustry] ?? INDUSTRY_BREACH_BASELINES['Other'],
    [selectedIndustry]
  )

  const rowsNow = useMemo(
    () => computeRows(profile, breachBaseline, migrateNowDelay),
    [profile, breachBaseline, migrateNowDelay]
  )

  const rowsDelayed = useMemo(
    () => computeRows(profile, breachBaseline, delayYears),
    [profile, breachBaseline, delayYears]
  )

  const finalNow = rowsNow[rowsNow.length - 1]
  const finalDelayed = rowsDelayed[rowsDelayed.length - 1]
  const costOfInaction = finalDelayed.total - finalNow.total

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="industry-select" className="text-sm font-medium text-foreground">
            Industry
          </label>
          <select
            id="industry-select"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2"
          >
            {DELAY_COST_PROFILES.map((p) => (
              <option key={p.industry} value={p.industry}>
                {p.industry}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Migration delay:{' '}
            <span className="text-primary font-bold">
              {delayYears} year{delayYears !== 1 ? 's' : ''}
            </span>
          </label>
          <input
            type="range"
            min={1}
            max={3}
            value={delayYears}
            onChange={(e) => setDelayYears(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label="Migration delay in years"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 year</span>
            <span>2 years</span>
            <span>3 years</span>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-4 border bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground">Migrate Now (5-yr total)</span>
          </div>
          <div className="text-2xl font-bold text-primary">{fmt(finalNow.total)}</div>
          <div className="text-xs text-muted-foreground mt-1">Migration + residual exposure</div>
        </div>
        <div className="glass-panel p-4 border bg-status-warning/5 border-status-warning/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={14} className="text-status-warning" />
            <span className="text-xs text-muted-foreground">Delay {delayYears}yr (5-yr total)</span>
          </div>
          <div className="text-2xl font-bold text-status-warning">{fmt(finalDelayed.total)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Higher migration cost + accumulated risk
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
          5-Year Cost Comparison
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
              {rowsNow.map((row, i) => {
                const delayed = rowsDelayed[i]
                const delta = delayed.total - row.total
                return (
                  <tr key={row.year} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="py-2 px-3 font-medium text-foreground">{row.year}</td>
                    <td className="py-2 px-3 text-right text-primary">{fmt(row.total)}</td>
                    <td className="py-2 px-3 text-right text-status-warning">
                      {fmt(delayed.total)}
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
          Delay {delayYears}yr — Cost Breakdown (5-year cumulative)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Migration (with delay premium)</p>
            <p className="font-semibold text-foreground">
              {fmt(finalDelayed.cumulativeMigrationCost)}
            </p>
            <p className="text-xs text-muted-foreground">
              Base {fmt(profile.migrationCostUSD)} + {fmt(profile.delayPremiumPerYear * delayYears)}{' '}
              premium
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Accumulated breach risk</p>
            <p className="font-semibold text-status-error">
              {fmt(finalDelayed.cumulativeBreachRisk)}
            </p>
            <p className="text-xs text-muted-foreground">
              {delayYears} years HNDL × {profile.hndlExposureMultiplier}× multiplier
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Regulatory penalties</p>
            <p className="font-semibold text-status-warning">
              {fmt(finalDelayed.cumulativePenalty)}
            </p>
            <p className="text-xs text-muted-foreground">
              Hard deadline: {profile.hardDeadline} — {fmt(profile.regulatoryPenaltyUSD)}/yr
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Estimates use IBM Cost of a Data Breach 2024 baselines, NIST IR 8547 urgency guidance, and
        industry analyst migration cost projections. All figures are illustrative for planning
        purposes only.
      </p>
    </div>
  )
}
