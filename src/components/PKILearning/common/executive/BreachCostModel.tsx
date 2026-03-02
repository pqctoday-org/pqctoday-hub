// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { TrendingUp, AlertTriangle, DollarSign, Sliders, Zap, Info } from 'lucide-react'

// Industry-specific breach cost baselines (per-record, in USD)
// Based on publicly available breach cost research data
const INDUSTRY_BREACH_COSTS: Record<string, { perRecord: number; avgTotal: number }> = {
  'Finance & Banking': { perRecord: 225, avgTotal: 5900000 },
  Healthcare: { perRecord: 239, avgTotal: 10930000 },
  'Government & Defense': { perRecord: 186, avgTotal: 4150000 },
  Technology: { perRecord: 195, avgTotal: 4970000 },
  Telecommunications: { perRecord: 188, avgTotal: 4290000 },
  'Energy & Utilities': { perRecord: 204, avgTotal: 4780000 },
  'Retail & E-Commerce': { perRecord: 165, avgTotal: 3280000 },
  Aerospace: { perRecord: 198, avgTotal: 4560000 },
  Automotive: { perRecord: 175, avgTotal: 3850000 },
  Other: { perRecord: 165, avgTotal: 4350000 },
}

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
  // Scenario inputs
  const [dataRecords, setDataRecords] = useState(100000)
  const [regulatoryFines, setRegulatoryFines] = useState(500000)
  const [yearsOfData, setYearsOfData] = useState(5)

  // Quantum assumptions (previously hardcoded)
  const [quantumMultiplier, setQuantumMultiplier] = useState(2.5)
  const [hndlExposureFactor, setHndlExposureFactor] = useState(30)
  const [regulatoryMultiplier, setRegulatoryMultiplier] = useState(1.5)

  const baseCosts = INDUSTRY_BREACH_COSTS[industry] || INDUSTRY_BREACH_COSTS['Other']

  const costs = useMemo(() => {
    // Classical breach
    const classicalPerRecord = baseCosts.perRecord * dataRecords
    const classicalFines = regulatoryFines
    const classicalReputational = baseCosts.avgTotal * 0.25
    const classicalCost = classicalPerRecord + classicalFines + classicalReputational

    // Quantum-enabled breach
    const quantumPerRecord = baseCosts.perRecord * quantumMultiplier * dataRecords
    const quantumHistoricalData =
      baseCosts.perRecord * dataRecords * yearsOfData * (hndlExposureFactor / 100)
    const quantumFines = regulatoryFines * regulatoryMultiplier
    const quantumReputational = baseCosts.avgTotal * 0.5
    const quantumCost =
      quantumPerRecord + quantumHistoricalData + quantumFines + quantumReputational

    const delta = quantumCost - classicalCost

    onCostCalculated?.({ classicalCost, quantumCost, delta })

    return {
      classicalPerRecord,
      classicalFines,
      classicalReputational,
      classicalCost,
      quantumPerRecord,
      quantumHistoricalData,
      quantumFines,
      quantumReputational,
      quantumCost,
      delta,
    }
  }, [
    dataRecords,
    regulatoryFines,
    yearsOfData,
    quantumMultiplier,
    hndlExposureFactor,
    regulatoryMultiplier,
    baseCosts,
    onCostCalculated,
  ])

  return (
    <div className="space-y-6">
      {/* ── Scenario Inputs ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Sliders size={16} className="text-primary shrink-0" />
          Scenario Inputs
        </summary>
        <div className="mt-4">
          {/* Industry baseline (display-only) */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2 mb-4">
            <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Industry baseline ({industry}):{' '}
              <span className="font-mono text-foreground font-semibold">
                ${baseCosts.perRecord}/record
              </span>
              , avg. total breach cost:{' '}
              <span className="font-mono text-foreground font-semibold">
                {formatCurrency(baseCosts.avgTotal)}
              </span>{' '}
              &mdash; IBM Cost of a Data Breach Report 2024
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="breach-data-records"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Data Records at Risk
              </label>
              <input
                id="breach-data-records"
                type="range"
                min="1000"
                max="10000000"
                step="1000"
                value={dataRecords}
                onChange={(e) => setDataRecords(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1K</span>
                <span className="text-sm font-mono text-primary">
                  {dataRecords.toLocaleString()}
                </span>
                <span>10M</span>
              </div>
            </div>
            <div>
              <label
                htmlFor="breach-regulatory-fines"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Expected Regulatory Fines
              </label>
              <input
                id="breach-regulatory-fines"
                type="range"
                min="0"
                max="50000000"
                step="100000"
                value={regulatoryFines}
                onChange={(e) => setRegulatoryFines(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>$0</span>
                <span className="text-sm font-mono text-primary">
                  {formatCurrency(regulatoryFines)}
                </span>
                <span>$50M</span>
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
                min="1"
                max="25"
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
          </div>
        </div>
      </details>

      {/* ── Quantum Assumptions ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <Zap size={16} className="text-primary shrink-0" />
          Quantum Assumptions
        </summary>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="breach-quantum-multiplier"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Quantum Amplification
            </label>
            <input
              id="breach-quantum-multiplier"
              type="range"
              min={1.0}
              max={5.0}
              step={0.1}
              value={quantumMultiplier}
              onChange={(e) => setQuantumMultiplier(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1.0&times;</span>
              <span className="text-sm font-mono text-primary">
                {quantumMultiplier.toFixed(1)}&times;
              </span>
              <span>5.0&times;</span>
            </div>
          </div>
          <div>
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
              value={hndlExposureFactor}
              onChange={(e) => setHndlExposureFactor(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5%</span>
              <span className="text-sm font-mono text-primary">{hndlExposureFactor}%</span>
              <span>100%</span>
            </div>
          </div>
          <div>
            <label
              htmlFor="breach-regulatory-multiplier"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Regulatory Fine Multiplier
            </label>
            <input
              id="breach-regulatory-multiplier"
              type="range"
              min={1.0}
              max={3.0}
              step={0.1}
              value={regulatoryMultiplier}
              onChange={(e) => setRegulatoryMultiplier(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1.0&times;</span>
              <span className="text-sm font-mono text-primary">
                {regulatoryMultiplier.toFixed(1)}&times;
              </span>
              <span>3.0&times;</span>
            </div>
          </div>
        </div>
      </details>

      {/* ── Cost Comparison KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 text-center">
          <DollarSign size={24} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">Classical Breach Cost</p>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(costs.classicalCost)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Based on {industry} industry averages
          </p>
        </div>
        <div className="glass-panel p-6 text-center border-status-error/30 border-2">
          <AlertTriangle size={24} className="mx-auto text-status-error mb-2" />
          <p className="text-sm text-muted-foreground mb-1">Quantum-Enabled Breach</p>
          <p className="text-3xl font-bold text-status-error">
            {formatCurrency(costs.quantumCost)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Includes HNDL historical data exposure
          </p>
        </div>
        <div className="glass-panel p-6 text-center">
          <TrendingUp size={24} className="mx-auto text-status-warning mb-2" />
          <p className="text-sm text-muted-foreground mb-1">Additional Quantum Risk</p>
          <p className="text-3xl font-bold text-status-warning">{formatCurrency(costs.delta)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {costs.classicalCost > 0 ? ((costs.delta / costs.classicalCost) * 100).toFixed(0) : 0}%
            increase over classical
          </p>
        </div>
      </div>

      {/* ── Classical Breach Breakdown ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <DollarSign size={16} className="text-muted-foreground shrink-0" />
          Classical Breach Breakdown
        </summary>
        <div className="mt-3 space-y-2">
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-mono text-muted-foreground">
              Per-record cost: ${baseCosts.perRecord} &times; {dataRecords.toLocaleString()} ={' '}
              <span className="text-foreground font-semibold">
                {formatCurrency(costs.classicalPerRecord)}
              </span>
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              Regulatory fines:{' '}
              <span className="text-foreground font-semibold">
                {formatCurrency(costs.classicalFines)}
              </span>
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              Reputational damage: {formatCurrency(baseCosts.avgTotal)} &times; 25% ={' '}
              <span className="text-foreground font-semibold">
                {formatCurrency(costs.classicalReputational)}
              </span>
            </p>
            <hr className="border-border my-1" />
            <p className="text-xs font-mono text-muted-foreground">
              Total:{' '}
              <span className="text-primary font-bold">{formatCurrency(costs.classicalCost)}</span>
            </p>
          </div>
        </div>
      </details>

      {/* ── Quantum-Enabled Breach Breakdown ── */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2">
          <AlertTriangle size={16} className="text-status-error shrink-0" />
          Quantum-Enabled Breach Breakdown
        </summary>
        <div className="mt-3 space-y-2">
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-mono text-muted-foreground">
              Quantum per-record: ${baseCosts.perRecord} &times; {quantumMultiplier.toFixed(1)}
              &times; &times; {dataRecords.toLocaleString()} ={' '}
              <span className="text-foreground font-semibold">
                {formatCurrency(costs.quantumPerRecord)}
              </span>
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              HNDL historical data: ${baseCosts.perRecord} &times; {dataRecords.toLocaleString()}{' '}
              &times; {yearsOfData} yrs &times; {hndlExposureFactor}% ={' '}
              <span className="text-foreground font-semibold">
                {formatCurrency(costs.quantumHistoricalData)}
              </span>
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              Regulatory fines: {formatCurrency(regulatoryFines)} &times;{' '}
              {regulatoryMultiplier.toFixed(1)}&times; ={' '}
              <span className="text-foreground font-semibold">
                {formatCurrency(costs.quantumFines)}
              </span>
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              Reputational damage: {formatCurrency(baseCosts.avgTotal)} &times; 50% ={' '}
              <span className="text-foreground font-semibold">
                {formatCurrency(costs.quantumReputational)}
              </span>
            </p>
            <hr className="border-border my-1" />
            <p className="text-xs font-mono text-muted-foreground">
              Total:{' '}
              <span className="text-status-error font-bold">
                {formatCurrency(costs.quantumCost)}
              </span>{' '}
              (+{formatCurrency(costs.delta)} vs. classical)
            </p>
          </div>
        </div>
      </details>

      {/* ── Methodology ── */}
      <details className="glass-panel p-4">
        <summary className="text-sm font-medium text-foreground cursor-pointer">
          Calculation Methodology
        </summary>
        <div className="mt-3 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Per-record cost ({industry}):</strong> ${baseCosts.perRecord} classical, $
            {Math.round(baseCosts.perRecord * quantumMultiplier)} quantum-amplified (
            {quantumMultiplier.toFixed(1)}&times; multiplier)
          </p>
          <p>
            <strong>HNDL factor:</strong> {yearsOfData} years of stored encrypted data becomes
            vulnerable, with {hndlExposureFactor}% exposure factor representing the fraction of
            historical data an attacker could retroactively decrypt.
          </p>
          <p>
            <strong>Regulatory multiplier:</strong> {regulatoryMultiplier.toFixed(1)}&times; for
            quantum breach (novel attack vector, potential negligence claims for not adopting PQC)
          </p>
          <p>
            <strong>Reputational damage:</strong> 25% of average total breach cost (classical), 50%
            (quantum &mdash; greater media attention, novel threat narrative)
          </p>
          <p className="text-xs italic mt-2">
            Note: These are educational estimates for planning purposes. Actual costs vary
            significantly by organization size, geography, and regulatory environment.
          </p>
        </div>
      </details>
    </div>
  )
}
