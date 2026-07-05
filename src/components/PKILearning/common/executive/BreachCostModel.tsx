// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useEffect } from 'react'
import { TrendingUp, AlertTriangle, DollarSign, Sliders, Zap, Info, Percent } from 'lucide-react'
import { resolveIndustryBreachBaseline } from '@/utils/roiMath'
import { computeBreachCosts, HNDL_MULTIPLIER_CAP } from '@/utils/breachCostModel'

interface BreachCostModelProps {
  industry?: string
  onCostCalculated?: (costs: { classicalCost: number; quantumCost: number; delta: number }) => void
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount.toFixed(0)}`
}

export const BreachCostModel: React.FC<BreachCostModelProps> = ({
  industry = 'Other',
  onCostCalculated,
}) => {
  // Scenario inputs. "Breach severity" scales the authoritative industry-average
  // total breach cost, rather than a fabricated flat per-record figure.
  const [breachScale, setBreachScale] = useState(1)
  const [yearsOfData, setYearsOfData] = useState(5)
  const [annualBreachProbPct, setAnnualBreachProbPct] = useState(15)
  const [hndlFactorPct, setHndlFactorPct] = useState(30)

  // Single source of truth — the same IBM 2024 baseline the ROI Calculator and
  // Cost Model Explorer use. No private, drifted table.
  const baseline = resolveIndustryBreachBaseline(industry)

  const costs = useMemo(
    () =>
      computeBreachCosts({
        baseline,
        breachScale,
        yearsOfData,
        hndlFactorPct,
        annualBreachProbPct,
      }),
    [baseline, breachScale, yearsOfData, hndlFactorPct, annualBreachProbPct]
  )

  // Emit in an effect, not during render/useMemo (the previous model called the
  // parent setter inside useMemo — a side effect during render).
  useEffect(() => {
    onCostCalculated?.({
      classicalCost: costs.classicalSLE,
      quantumCost: costs.quantumSLE,
      delta: costs.delta,
    })
  }, [onCostCalculated, costs.classicalSLE, costs.quantumSLE, costs.delta])

  const pctIncrease = costs.classicalSLE > 0 ? (costs.delta / costs.classicalSLE) * 100 : 0

  return (
    <div className="space-y-6">
      {/* ── Scenario Inputs ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Sliders size={16} className="text-primary shrink-0" />
          Scenario Inputs
        </summary>
        <div className="mt-4">
          <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2 mb-4">
            <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Industry baseline ({industry}):{' '}
              <span className="font-mono text-foreground font-semibold">
                {formatCurrency(baseline)}
              </span>{' '}
              average total breach cost &mdash; IBM Cost of a Data Breach 2024. This total already
              includes detection, notification, lost business and reputational damage, so those are
              not added again.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="breach-severity"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Breach Severity (× industry average)
              </label>
              <input
                id="breach-severity"
                type="range"
                min={0.25}
                max={4}
                step={0.25}
                value={breachScale}
                onChange={(e) => setBreachScale(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0.25×</span>
                <span className="text-sm font-mono text-primary">{breachScale.toFixed(2)}×</span>
                <span>4×</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="breach-years-data"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Years of Stored Data (HNDL)
              </label>
              <input
                id="breach-years-data"
                type="range"
                min={1}
                max={25}
                value={yearsOfData}
                onChange={(e) => setYearsOfData(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 yr</span>
                <span className="text-sm font-mono text-primary">{yearsOfData} years</span>
                <span>25 yrs</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="breach-annual-prob"
                className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1"
              >
                <Percent size={13} className="text-muted-foreground" />
                Annual Breach Probability
              </label>
              <input
                id="breach-annual-prob"
                type="range"
                min={1}
                max={50}
                value={annualBreachProbPct}
                onChange={(e) => setAnnualBreachProbPct(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1%</span>
                <span className="text-sm font-mono text-primary">{annualBreachProbPct}%</span>
                <span>50%</span>
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* ── Quantum Assumptions ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Zap size={16} className="text-primary shrink-0" />
          Quantum Assumptions
        </summary>
        <div className="mt-4">
          <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2 mb-4">
            <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              The single quantum effect modelled here is{' '}
              <strong className="text-foreground">harvest-now-decrypt-later</strong>: once a quantum
              computer exists, a breach exposes years of accumulated harvested data, not just
              today&apos;s. Amplification = 1 + (years × exposure), capped at{' '}
              {1 + HNDL_MULTIPLIER_CAP}×.
            </p>
          </div>
          <div className="max-w-sm">
            <label
              htmlFor="breach-hndl-factor"
              className="block text-sm font-medium text-foreground mb-2"
            >
              HNDL Exposure Factor
            </label>
            <input
              id="breach-hndl-factor"
              type="range"
              min={5}
              max={100}
              step={5}
              value={hndlFactorPct}
              onChange={(e) => setHndlFactorPct(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5%</span>
              <span className="text-sm font-mono text-primary">{hndlFactorPct}%</span>
              <span>100%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Amplification:{' '}
              <span className="text-foreground font-bold">{costs.hndlMultiplier.toFixed(2)}×</span>
            </p>
          </div>
        </div>
      </details>

      {/* ── Per-event cost comparison (SLE) ── */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Cost <em>if</em> a breach occurs (single-loss expectancy):
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-6 text-center">
            <DollarSign size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Classical Breach</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(costs.classicalSLE)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{industry} average × severity</p>
          </div>
          <div className="glass-panel p-6 text-center border-status-error/30 border-2">
            <AlertTriangle size={24} className="mx-auto text-status-error mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Quantum-Enabled Breach</p>
            <p className="text-3xl font-bold text-status-error">
              {formatCurrency(costs.quantumSLE)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Includes HNDL historical exposure</p>
          </div>
          <div className="glass-panel p-6 text-center">
            <TrendingUp size={24} className="mx-auto text-status-warning mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Additional Quantum Risk</p>
            <p className="text-3xl font-bold text-status-warning">{formatCurrency(costs.delta)}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {pctIncrease.toFixed(0)}% increase over classical
            </p>
          </div>
        </div>
      </div>

      {/* ── Expected annual loss (ALE) ── */}
      <div className="glass-panel p-4 border-l-4 border-l-primary">
        <div className="flex items-start gap-2 mb-3">
          <Info size={14} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            A breach cost is not an annual cost. <strong>Expected annual loss</strong> = breach cost
            × the {annualBreachProbPct}% annual probability — this is the figure that belongs in an
            ROI model, and what the ROI Calculator (Step 2) multiplies out.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Classical — annual expected loss</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(costs.classicalALE)}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Quantum — annual expected loss</p>
            <p className="text-xl font-bold text-status-error">
              {formatCurrency(costs.quantumALE)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Breakdown ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <AlertTriangle size={16} className="text-status-error shrink-0" />
          How the quantum breach is built
        </summary>
        <div className="mt-3 space-y-1 bg-muted/50 rounded-lg p-3">
          <p className="text-xs font-mono text-muted-foreground">
            Classical: {formatCurrency(baseline)} × {breachScale.toFixed(2)} severity ={' '}
            <span className="text-foreground font-semibold">
              {formatCurrency(costs.classicalSLE)}
            </span>
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            HNDL amplification: 1 + min({HNDL_MULTIPLIER_CAP}, {yearsOfData}yr × {hndlFactorPct}%) ={' '}
            <span className="text-foreground font-semibold">
              {costs.hndlMultiplier.toFixed(2)}×
            </span>
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            Quantum: {formatCurrency(costs.classicalSLE)} × {costs.hndlMultiplier.toFixed(2)} ={' '}
            <span className="text-status-error font-bold">{formatCurrency(costs.quantumSLE)}</span>{' '}
            (+{formatCurrency(costs.delta)} vs. classical)
          </p>
        </div>
      </details>

      {/* ── Methodology ── */}
      <details className="glass-panel p-4">
        <summary className="text-sm font-medium text-foreground cursor-pointer">
          Calculation Methodology
        </summary>
        <div className="mt-3 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Baseline:</strong> the industry average total breach cost (IBM Cost of a Data
            Breach 2024), shared with the ROI Calculator and Cost Model Explorer — one source, no
            drift. It already includes reputational and lost-business costs, so those are not added
            separately.
          </p>
          <p>
            <strong>Severity:</strong> scales that average up or down for your scenario, instead of
            a flat per-record cost that would grow without bound.
          </p>
          <p>
            <strong>Quantum effect (HNDL only):</strong> 1 + (years × exposure factor), capped at{' '}
            {1 + HNDL_MULTIPLIER_CAP}×. A quantum computer changes how much data is exposed, not the
            unit cost of a record — so there is a single amplification, not a separate per-record
            multiplier.
          </p>
          <p>
            <strong>Impact vs likelihood:</strong> the cards above are the cost <em>if</em> a breach
            happens (SLE); expected annual loss (ALE) = SLE × annual probability.
          </p>
          <p className="text-xs italic mt-2">
            Educational estimates for planning. Actual costs vary widely by organization size,
            geography, and regulatory environment.
          </p>
        </div>
      </details>
    </div>
  )
}
