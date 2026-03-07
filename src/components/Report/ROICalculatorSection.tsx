// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { CollapsibleSection } from './ReportContent'
import { INDUSTRY_BREACH_BASELINES } from '../../data/roiBaselines'
import type { AssessmentResult } from '../../hooks/assessmentTypes'

export interface ROISummary {
  migrationCost: number
  avoidedBreachCost: number
  complianceSavings: number
  netRoiPercent: number
  paybackMonths: number
}

interface ROICalculatorSectionProps {
  result: AssessmentResult
  industry: string
  defaultOpen?: boolean
  onSummaryChange: (summary: ROISummary) => void
}

function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`
}

interface ChartItem {
  name: string
  value: number
  fill: string
}
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value?: number; payload?: ChartItem }>
}
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.8125rem',
      }}
    >
      <p style={{ color: 'hsl(var(--foreground))' }}>{item.payload?.name}</p>
      <p style={{ color: item.payload?.fill, fontWeight: 600 }}>{formatUSD(item.value ?? 0)}</p>
    </div>
  )
}

export const ROICalculatorSection: React.FC<ROICalculatorSectionProps> = ({
  result,
  industry,
  defaultOpen = false,
  onSummaryChange,
}) => {
  const defaults = useMemo(() => {
    const algoCount = result.algorithmMigrations?.filter((a) => a.quantumVulnerable).length ?? 1
    const sysMultiplier = (() => {
      const profile = result.assessmentProfile
      if (!profile?.systemScale) return 1
      if (profile.systemScale === '200-plus') return 4
      if (profile.systemScale === '51-200') return 2
      if (profile.systemScale === '11-50') return 1.5
      return 1
    })()
    const migrationCost = Math.max(50_000, Math.round(algoCount * 50_000 * sysMultiplier))
    const breachProbability = Math.min(50, Math.round(result.riskScore / 2))
    return { migrationCost, breachProbability }
  }, [result])

  const [migrationCost, setMigrationCost] = useState(defaults.migrationCost)
  const [breachProbabilityPct, setBreachProbabilityPct] = useState(defaults.breachProbability)
  const [compliancePenalty, setCompliancePenalty] = useState(2_000_000)
  const [horizon, setHorizon] = useState(3)

  const computed = useMemo<ROISummary>(() => {
    const breachBaseline = INDUSTRY_BREACH_BASELINES[industry] ?? INDUSTRY_BREACH_BASELINES['Other']
    const mandatedFrameworks = result.complianceImpacts?.filter((c) => c.requiresPQC === true) ?? []
    const avoidedBreachCost = (breachProbabilityPct / 100) * breachBaseline * horizon
    const complianceSavings = compliancePenalty * mandatedFrameworks.length
    const totalBenefit = avoidedBreachCost + complianceSavings
    const netRoiPercent =
      migrationCost > 0 ? ((totalBenefit - migrationCost) / migrationCost) * 100 : 0
    const paybackMonths = totalBenefit > 0 ? migrationCost / (totalBenefit / 12) : Infinity
    return { migrationCost, avoidedBreachCost, complianceSavings, netRoiPercent, paybackMonths }
  }, [migrationCost, breachProbabilityPct, compliancePenalty, horizon, industry, result])

  useEffect(() => {
    onSummaryChange(computed)
  }, [computed, onSummaryChange])

  // Resolve CSS vars for Recharts (runs after mount, safe in component body)
  const style = getComputedStyle(document.documentElement)
  const primaryColor = `hsl(${style.getPropertyValue('--primary').trim()})`
  const successColor = `hsl(${style.getPropertyValue('--success') || '142 71% 45%'})`
  const destructiveColor = `hsl(${style.getPropertyValue('--destructive').trim()})`
  const accentColor = `hsl(${style.getPropertyValue('--accent').trim()})`

  const chartData = [
    { name: 'Migration Cost', value: computed.migrationCost, fill: destructiveColor },
    { name: 'Avoided Breach Cost', value: computed.avoidedBreachCost, fill: primaryColor },
    { name: 'Compliance Savings', value: computed.complianceSavings, fill: accentColor },
  ]

  const isPositiveROI = computed.netRoiPercent >= 0
  const roiColor = isPositiveROI ? successColor : destructiveColor

  return (
    <CollapsibleSection
      title="ROI & Financial Case"
      icon={<DollarSign size={18} className="text-primary" />}
      defaultOpen={defaultOpen}
      infoTip="roiCalculator"
    >
      {/* Print-only summary */}
      <div className="hidden print:block mb-4 text-sm">
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr>
              <td className="py-1 pr-4 font-medium">Migration Budget</td>
              <td>{formatUSD(computed.migrationCost)}</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 font-medium">Avoided Breach Cost</td>
              <td>{formatUSD(computed.avoidedBreachCost)}</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 font-medium">Compliance Savings</td>
              <td>{formatUSD(computed.complianceSavings)}</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 font-medium">Net ROI</td>
              <td>{formatPercent(computed.netRoiPercent)}</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 font-medium">Payback Period</td>
              <td>
                {isFinite(computed.paybackMonths)
                  ? `${Math.ceil(computed.paybackMonths)} months`
                  : 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Input controls */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label
            htmlFor="roi-migration-cost"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Total migration budget (USD)
          </label>
          <input
            id="roi-migration-cost"
            type="number"
            min={10_000}
            step={10_000}
            value={migrationCost}
            onChange={(e) => setMigrationCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label
            htmlFor="roi-breach-prob"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Annual breach probability (%)
          </label>
          <input
            id="roi-breach-prob"
            type="number"
            min={0}
            max={100}
            step={1}
            value={breachProbabilityPct}
            onChange={(e) =>
              setBreachProbabilityPct(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))
            }
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label
            htmlFor="roi-compliance-penalty"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Compliance penalty per incident (USD)
          </label>
          <input
            id="roi-compliance-penalty"
            type="number"
            min={0}
            step={100_000}
            value={compliancePenalty}
            onChange={(e) => setCompliancePenalty(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label
            htmlFor="roi-horizon"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Planning horizon (years)
          </label>
          <input
            id="roi-horizon"
            type="number"
            min={1}
            max={10}
            step={1}
            value={horizon}
            onChange={(e) =>
              setHorizon(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))
            }
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <DollarSign size={16} className="text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Migration Cost</p>
          <p className="text-xl font-bold text-foreground">{formatUSD(computed.migrationCost)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <TrendingUp size={16} className="mx-auto mb-1" style={{ color: roiColor }} />
          <p className="text-xs text-muted-foreground">Net ROI ({horizon}yr)</p>
          <p className="text-xl font-bold" style={{ color: roiColor }}>
            {formatPercent(computed.netRoiPercent)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <Clock size={16} className="text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Payback Period</p>
          <p className="text-xl font-bold text-foreground">
            {isFinite(computed.paybackMonths) ? `${Math.ceil(computed.paybackMonths)}mo` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="print:hidden mb-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <XAxis
              dataKey="name"
              tick={{
                fill: `hsl(${style.getPropertyValue('--muted-foreground').trim()})`,
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatUSD}
              tick={{
                fill: `hsl(${style.getPropertyValue('--muted-foreground').trim()})`,
                fontSize: 11,
              }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
        <AlertCircle size={13} className="shrink-0 mt-0.5" />
        <span>
          Breach cost baselines from IBM Cost of a Data Breach Report 2024. Figures are illustrative
          estimates for financial planning purposes only.
        </span>
      </div>
    </CollapsibleSection>
  )
}
