import React, { useState, useMemo } from 'react'
import { TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

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

// Quantum-enabled attacks are estimated to have higher per-record costs
// due to ability to decrypt all historical data at once
const QUANTUM_MULTIPLIER = 2.5

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
  const [dataRecords, setDataRecords] = useState(100000)
  const [regulatoryFines, setRegulatoryFines] = useState(500000)
  const [yearsOfData, setYearsOfData] = useState(5)

  const baseCosts = INDUSTRY_BREACH_COSTS[industry] || INDUSTRY_BREACH_COSTS['Other']

  const costs = useMemo(() => {
    // Classical breach
    const classicalPerRecord = baseCosts.perRecord * dataRecords
    const classicalFines = regulatoryFines
    const classicalReputational = baseCosts.avgTotal * 0.25
    const classicalCost = classicalPerRecord + classicalFines + classicalReputational

    // Quantum-enabled breach: amplified because attacker can decrypt stored data
    const quantumPerRecord = baseCosts.perRecord * QUANTUM_MULTIPLIER * dataRecords
    const quantumHistoricalData = baseCosts.perRecord * dataRecords * yearsOfData * 0.3
    const quantumFines = regulatoryFines * 1.5
    const quantumReputational = baseCosts.avgTotal * 0.5
    const quantumCost =
      quantumPerRecord + quantumHistoricalData + quantumFines + quantumReputational

    const delta = quantumCost - classicalCost

    onCostCalculated?.({ classicalCost, quantumCost, delta })
    return { classicalCost, quantumCost, delta }
  }, [dataRecords, regulatoryFines, yearsOfData, baseCosts, onCostCalculated])

  return (
    <div className="space-y-6">
      {/* Input controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
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
          <p className="text-center text-sm font-mono text-primary mt-1">
            {dataRecords.toLocaleString()}
          </p>
        </div>
        <div className="glass-panel p-4">
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
          <p className="text-center text-sm font-mono text-primary mt-1">
            {formatCurrency(regulatoryFines)}
          </p>
        </div>
        <div className="glass-panel p-4">
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
          <p className="text-center text-sm font-mono text-primary mt-1">{yearsOfData} years</p>
        </div>
      </div>

      {/* Cost comparison */}
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
            {((costs.delta / costs.classicalCost) * 100).toFixed(0)}% increase over classical
          </p>
        </div>
      </div>

      {/* Breakdown detail */}
      <details className="glass-panel p-4">
        <summary className="text-sm font-medium text-foreground cursor-pointer">
          Cost Breakdown Methodology
        </summary>
        <div className="mt-3 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Per-record cost ({industry}):</strong> ${baseCosts.perRecord} classical, $
            {Math.round(baseCosts.perRecord * QUANTUM_MULTIPLIER)} quantum-amplified
          </p>
          <p>
            <strong>HNDL factor:</strong> {yearsOfData} years of stored encrypted data becomes
            vulnerable
          </p>
          <p>
            <strong>Regulatory multiplier:</strong> 1.5x for quantum breach (novel attack vector,
            potential negligence claims)
          </p>
          <p>
            <strong>Reputational damage:</strong> 25% of average total breach cost (classical), 50%
            (quantum — greater media attention)
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
