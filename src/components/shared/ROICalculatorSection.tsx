// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  ChevronDown,
  Calculator,
  Percent,
} from 'lucide-react'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import { FRAMEWORK_PENALTY_BASELINES } from '@/data/roiBaselines'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_COMPLIANCE_INCIDENT_RATE,
  breachProbabilityFromRiskScore,
  computeAnnualBreachSavings,
  computeAnnualComplianceSavings,
  computeMigrationCostFromProfile,
  computeROI,
  resolveIndustryBreachBaseline,
  selectCompliancePenalty,
  type MigrationCostDetails,
} from '@/utils/roiMath'

export interface ROISummary {
  migrationCost: number
  avoidedBreachCost: number
  complianceSavings: number
  netRoiPercent: number
  paybackMonths: number
  /** Added in Phase 2. Lifetime cost = migrationCost + annualOpex × horizon. */
  totalCost?: number
  /** Added in Phase 2. horizonYears × (annual breach savings + annual compliance savings). */
  costOfInaction?: number
  /** Added in Phase 2. Present when a discount rate is in effect. */
  npv?: number
}

interface ROICalculatorSectionProps {
  result: AssessmentResult
  industry: string
  defaultOpen?: boolean
  onSummaryChange: (summary: ROISummary) => void
  infoTip?: React.ReactNode
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

// ── Computation Breakdown (collapsible) ──────────────────────────────────

type ComputationDetails = MigrationCostDetails & {
  riskScore: number
  mandatedCount: number
  mandatedFrameworks: string[]
  maxPenaltyFramework: { name: string; penalty: number } | null
}

function MultiplierBadge({ value }: { value: number }) {
  const isDiscount = value < 1
  const isNeutral = value === 1
  return (
    <span
      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
        isNeutral
          ? 'bg-muted text-muted-foreground'
          : isDiscount
            ? 'bg-success/10 text-success'
            : 'bg-destructive/10 text-destructive'
      }`}
    >
      {value}x
    </span>
  )
}

function BreakdownRow({
  label,
  value,
  detail,
  multiplier,
}: {
  label: string
  value: string
  detail?: string
  multiplier?: number
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground">{label}</span>
          {multiplier !== undefined && <MultiplierBadge value={multiplier} />}
        </div>
        {detail && (
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{detail}</p>
        )}
      </div>
      <span className="text-xs font-mono text-foreground shrink-0">{value}</span>
    </div>
  )
}

function ComputationBreakdown({
  details,
  industry,
  breachProbabilityPct,
  compliancePenalty,
}: {
  details: ComputationDetails
  industry: string
  breachProbabilityPct: number
  compliancePenalty: number
}) {
  const [open, setOpen] = useState(false)
  const breachBaseline = resolveIndustryBreachBaseline(industry)

  const statusLabels: Record<string, string> = {
    started: 'Already started',
    planning: 'Planning phase',
    'not-started': 'Not started',
    unknown: 'Unknown',
  }
  const agilityLabels: Record<string, string> = {
    'fully-abstracted': 'Fully abstracted',
    'partially-abstracted': 'Partially abstracted',
    hardcoded: 'Hardcoded',
    unknown: 'Unknown',
  }
  const vendorLabels: Record<string, string> = {
    'open-source': 'Open source',
    'in-house': 'In-house',
    mixed: 'Mixed',
    'heavy-vendor': 'Heavy vendor',
    Unknown: 'Unknown',
  }

  return (
    <div className="print:hidden mb-5">
      <Button
        variant="ghost"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Calculator size={13} className="text-primary shrink-0" />
        <span className="font-medium">How are these values computed?</span>
        <ChevronDown
          size={13}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </Button>

      {open && (
        <div className="mt-3 rounded-lg border border-border bg-muted/20 p-4 space-y-4">
          {/* Migration Cost Derivation */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Migration Cost
            </p>
            <div className="divide-y divide-border/50">
              <BreakdownRow
                label="Algorithm base"
                value={formatUSD(details.algoBase)}
                detail={`${details.algoCount} vulnerable algorithm${details.algoCount !== 1 ? 's' : ''} × $30K × ${details.sysScale}x system scale`}
              />
              <BreakdownRow
                label="Infrastructure base"
                value={formatUSD(details.infraBase)}
                detail={
                  details.infraLayers.length > 0
                    ? `${details.infraLayers.length} layer${details.infraLayers.length !== 1 ? 's' : ''}: ${details.infraLayers.join(', ')}`
                    : details.infraBase > 0
                      ? 'Estimated (infrastructure unknown)'
                      : 'No layers selected'
                }
              />
              <BreakdownRow
                label="Base cost"
                value={formatUSD(details.baseCost)}
                detail="Algorithm base + Infrastructure base"
              />
              <BreakdownRow
                label="Vendor dependency"
                value={vendorLabels[details.vendorLabel] ?? details.vendorLabel}
                multiplier={details.vendorMul}
              />
              <BreakdownRow
                label="Migration status"
                value={statusLabels[details.migrationStatus] ?? details.migrationStatus}
                multiplier={details.migrationDiscount}
              />
              <BreakdownRow
                label="Crypto agility"
                value={agilityLabels[details.agilityLabel] ?? details.agilityLabel}
                multiplier={details.agilityMul}
              />
              <BreakdownRow
                label="Team size"
                value={details.teamLabel}
                multiplier={details.teamMul}
              />
            </div>
            <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Final migration cost</span>
              <span className="text-xs font-mono font-bold text-foreground">
                {formatUSD(details.migrationCost)}
              </span>
            </div>
          </div>

          {/* Breach Probability */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Breach Probability
            </p>
            <div className="divide-y divide-border/50">
              <BreakdownRow
                label="Risk score"
                value={`${details.riskScore}`}
                detail={`${details.riskScore} ÷ 2 = ${Math.round(details.riskScore / 2)}% (capped at 50%)`}
              />
              <BreakdownRow
                label="Auto-calculated probability"
                value={`${breachProbabilityPct}%`}
              />
              <BreakdownRow
                label="Industry breach baseline"
                value={formatUSD(breachBaseline)}
                detail={`${industry} — IBM Cost of a Data Breach 2024`}
              />
            </div>
          </div>

          {/* Compliance Penalty */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Compliance Penalty
            </p>
            <div className="divide-y divide-border/50">
              <BreakdownRow
                label="PQC-mandating frameworks"
                value={`${details.mandatedCount}`}
                detail={
                  details.mandatedCount > 0
                    ? details.mandatedFrameworks.join(', ')
                    : 'None selected — using $2M default'
                }
              />
              {details.maxPenaltyFramework && (
                <BreakdownRow
                  label="Highest framework penalty"
                  value={formatUSD(details.maxPenaltyFramework.penalty)}
                  detail={`${details.maxPenaltyFramework.name} — ${FRAMEWORK_PENALTY_BASELINES[details.maxPenaltyFramework.name]?.source ?? 'regulatory enforcement data'}`}
                />
              )}
              <BreakdownRow label="Penalty per incident" value={formatUSD(compliancePenalty)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const ROICalculatorSection: React.FC<ROICalculatorSectionProps> = ({
  result,
  industry,
  defaultOpen = false,
  onSummaryChange,
  infoTip,
}) => {
  const defaults = useMemo(() => {
    const { migrationCost, details: costDetails } = computeMigrationCostFromProfile(result)

    const breachProbability = breachProbabilityFromRiskScore(result.riskScore)

    const mandatedFrameworks =
      result.complianceImpacts?.filter((c) => c.requiresPQC === true).map((c) => c.framework) ?? []
    const { penalty: compliancePenalty, driverFramework: maxPenaltyFramework } =
      selectCompliancePenalty(mandatedFrameworks)

    const details: ComputationDetails = {
      ...costDetails,
      riskScore: result.riskScore,
      mandatedCount: mandatedFrameworks.length,
      mandatedFrameworks,
      maxPenaltyFramework,
    }

    return {
      migrationCost,
      breachProbability,
      compliancePenalty,
      details,
    }
  }, [result])

  const [migrationCost, setMigrationCost] = useState(defaults.migrationCost)
  const [breachProbabilityPct, setBreachProbabilityPct] = useState(defaults.breachProbability)
  const [compliancePenalty, setCompliancePenalty] = useState(defaults.compliancePenalty)
  const [horizon, setHorizon] = useState(3)
  const [annualOpex, setAnnualOpex] = useState(Math.round(defaults.migrationCost * 0.15))
  const [discountRatePct, setDiscountRatePct] = useState(10)

  const computed = useMemo<ROISummary>(() => {
    const breachBaseline = resolveIndustryBreachBaseline(industry)
    const mandatedFrameworkCount =
      result.complianceImpacts?.filter((c) => c.requiresPQC === true).length ?? 0

    const annualBreachSavings = computeAnnualBreachSavings({
      breachBaseline,
      breachProbabilityPct,
    })
    const annualComplianceSavings = computeAnnualComplianceSavings({
      frameworkCount: mandatedFrameworkCount,
      penaltyPerIncident: compliancePenalty,
      incidentRate: DEFAULT_COMPLIANCE_INCIDENT_RATE,
    })

    const { roiPercent, paybackMonths, totalBenefit, totalCost, npv } = computeROI({
      migrationCost,
      annualOpex,
      annualBenefit: annualBreachSavings + annualComplianceSavings,
      horizonYears: horizon,
      discountRate: discountRatePct / 100,
    })

    return {
      migrationCost,
      avoidedBreachCost: annualBreachSavings * horizon,
      complianceSavings: annualComplianceSavings * horizon,
      netRoiPercent: roiPercent,
      paybackMonths,
      totalCost,
      costOfInaction: totalBenefit,
      npv,
    }
  }, [
    migrationCost,
    annualOpex,
    breachProbabilityPct,
    compliancePenalty,
    horizon,
    discountRatePct,
    industry,
    result,
  ])

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
      infoTip={infoTip}
    >
      {/* Print-only summary */}
      <div className="hidden print:block mb-4 text-sm">
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr>
              <td className="py-1 pr-4 font-medium">Capital Expenditure</td>
              <td>{formatUSD(computed.migrationCost)}</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 font-medium">Annual Opex</td>
              <td>{formatUSD(annualOpex)}</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 font-medium">Total Cost ({horizon}yr)</td>
              <td>{formatUSD(computed.totalCost ?? computed.migrationCost)}</td>
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
              <td className="py-1 pr-4 font-medium">Cost of Inaction ({horizon}yr)</td>
              <td>{formatUSD(computed.costOfInaction ?? 0)}</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 font-medium">NPV @ {discountRatePct}%</td>
              <td>{formatUSD(computed.npv ?? 0)}</td>
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

      {/* Computation breakdown */}
      <ComputationBreakdown
        details={defaults.details}
        industry={industry}
        breachProbabilityPct={breachProbabilityPct}
        compliancePenalty={compliancePenalty}
      />

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
        <div>
          <label
            htmlFor="roi-annual-opex"
            className="block text-xs font-medium text-muted-foreground mb-1"
          >
            Annual opex (USD)
          </label>
          <input
            id="roi-annual-opex"
            type="number"
            min={0}
            step={10_000}
            value={annualOpex}
            onChange={(e) => setAnnualOpex(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label
            htmlFor="roi-discount-rate"
            className="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"
          >
            <Percent size={11} />
            Discount rate (WACC, %)
          </label>
          <input
            id="roi-discount-rate"
            type="number"
            min={0}
            max={30}
            step={1}
            value={discountRatePct}
            onChange={(e) =>
              setDiscountRatePct(Math.min(30, Math.max(0, parseInt(e.target.value, 10) || 0)))
            }
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <DollarSign size={16} className="text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Total Cost ({horizon}yr)</p>
          <p className="text-lg font-bold text-foreground">
            {formatUSD(computed.totalCost ?? computed.migrationCost)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <TrendingDown size={16} className="text-status-warning mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Cost of Inaction</p>
          <p className="text-lg font-bold text-status-warning">
            {formatUSD(computed.costOfInaction ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <TrendingUp size={16} className="mx-auto mb-1" style={{ color: roiColor }} />
          <p className="text-xs text-muted-foreground">NPV @ {discountRatePct}%</p>
          <p
            className="text-lg font-bold"
            style={{
              color: (computed.npv ?? 0) >= 0 ? successColor : destructiveColor,
            }}
          >
            {formatUSD(computed.npv ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <TrendingUp size={16} className="mx-auto mb-1" style={{ color: roiColor }} />
          <p className="text-xs text-muted-foreground">Net ROI ({horizon}yr)</p>
          <p className="text-lg font-bold" style={{ color: roiColor }}>
            {formatPercent(computed.netRoiPercent)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <Clock size={16} className="text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Payback</p>
          <p className="text-lg font-bold text-foreground">
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
          Breach cost baselines from IBM Cost of a Data Breach Report 2024. Compliance penalties
          from published regulatory enforcement data. Figures are illustrative estimates for
          financial planning purposes only.
        </span>
      </div>
    </CollapsibleSection>
  )
}
