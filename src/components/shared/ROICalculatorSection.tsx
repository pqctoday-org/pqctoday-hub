// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DollarSign, TrendingUp, Clock, AlertCircle, ChevronDown, Calculator } from 'lucide-react'
import { CollapsibleSection } from '../ui/CollapsibleSection'
import {
  INDUSTRY_BREACH_BASELINES,
  FRAMEWORK_PENALTY_BASELINES,
  DEFAULT_FRAMEWORK_PENALTY,
  INFRA_LAYER_COST,
  DEFAULT_INFRA_LAYER_COST,
} from '@/data/roiBaselines'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import { Button } from '@/components/ui/button'

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

interface ComputationDetails {
  algoCount: number
  sysScale: number
  algoBase: number
  infraLayers: string[]
  infraBase: number
  vendorLabel: string
  vendorMul: number
  migrationStatus: string
  migrationDiscount: number
  agilityLabel: string
  agilityMul: number
  teamLabel: string
  teamMul: number
  baseCost: number
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
  const breachBaseline = INDUSTRY_BREACH_BASELINES[industry] ?? INDUSTRY_BREACH_BASELINES['Other']

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
                {formatUSD(
                  Math.max(
                    50_000,
                    Math.round(
                      details.baseCost *
                        details.vendorMul *
                        details.migrationDiscount *
                        details.agilityMul *
                        details.teamMul
                    )
                  )
                )}
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
    const profile = result.assessmentProfile
    const vulnAlgos = result.algorithmMigrations?.filter((a) => a.quantumVulnerable) ?? []
    const algoCount = vulnAlgos.length || 1

    // System scale — applied to algorithm base only (infra cost is per-layer, not per-system)
    const sysScaleMap: Record<string, number> = {
      '1-10': 1.0,
      '11-50': 1.3,
      '51-200': 1.8,
      '200-plus': 3.0,
    }
    const sysScale = sysScaleMap[profile?.systemScale ?? ''] ?? 1.0
    const algoBase = Math.max(50_000, algoCount * 30_000 * sysScale)

    // Infrastructure layer costs
    const infraLayers = profile?.infrastructure ?? []
    const infraBaseRaw =
      infraLayers.length > 0
        ? infraLayers.reduce(
            (sum, id) => sum + (INFRA_LAYER_COST[id] ?? DEFAULT_INFRA_LAYER_COST),
            0
          )
        : profile?.infrastructureUnknown
          ? DEFAULT_INFRA_LAYER_COST * 3
          : 0
    // Sub-category density multiplier: more sub-categories = more migration surfaces
    const subCats = profile?.infrastructureSubCategories ?? {}
    const totalSubCats = Object.values(subCats).reduce((sum, cats) => sum + cats.length, 0)
    const subCatMultiplier = Math.min(2.0, 1.0 + totalSubCats * 0.15)
    const infraBase = Math.round(infraBaseRaw * subCatMultiplier)

    // Vendor dependency multiplier
    const vendorMap: Record<string, number> = {
      'open-source': 0.8,
      'in-house': 0.7,
      mixed: 1.0,
      'heavy-vendor': 1.4,
    }
    const vendorMul = profile?.vendorUnknown
      ? 1.2
      : (vendorMap[profile?.vendorDependency ?? ''] ?? 1.0)

    // Migration status discount (already in progress = lower remaining cost)
    const migrationMap: Record<string, number> = {
      started: 0.4,
      planning: 0.7,
      'not-started': 1.0,
      unknown: 1.0,
    }
    const migrationDiscount = migrationMap[profile?.migrationStatus ?? 'not-started'] ?? 1.0

    // Crypto agility (hardcoded = major refactoring needed)
    const agilityMap: Record<string, number> = {
      'fully-abstracted': 0.6,
      'partially-abstracted': 0.85,
      hardcoded: 1.5,
      unknown: 1.2,
    }
    const agilityMul = agilityMap[profile?.cryptoAgility ?? ''] ?? 1.0

    // Team size (smaller teams = longer timelines = higher cost)
    const teamMap: Record<string, number> = {
      '200-plus': 0.85,
      '51-200': 0.95,
      '11-50': 1.0,
      '1-10': 1.3,
    }
    const teamMul = teamMap[profile?.teamSize ?? ''] ?? 1.0

    const baseCost = algoBase + infraBase
    const migrationCost = Math.max(
      50_000,
      Math.round(baseCost * vendorMul * migrationDiscount * agilityMul * teamMul)
    )

    // Breach probability (unchanged — riskScore already incorporates all factors)
    const breachProbability = Math.min(50, Math.round(result.riskScore / 2))

    // Compliance penalty — max framework-specific penalty across mandated frameworks
    const mandated = result.complianceImpacts?.filter((c) => c.requiresPQC === true) ?? []
    const compliancePenalty =
      mandated.length > 0
        ? Math.max(
            ...mandated.map(
              (ci) =>
                FRAMEWORK_PENALTY_BASELINES[ci.framework]?.annualPenalty ??
                DEFAULT_FRAMEWORK_PENALTY
            )
          )
        : 2_000_000

    // Identify which framework drove the max penalty
    const maxPenaltyFramework =
      mandated.length > 0
        ? mandated.reduce(
            (best, ci) => {
              const penalty =
                FRAMEWORK_PENALTY_BASELINES[ci.framework]?.annualPenalty ??
                DEFAULT_FRAMEWORK_PENALTY
              return penalty > best.penalty ? { name: ci.framework, penalty } : best
            },
            { name: '', penalty: 0 }
          )
        : null

    return {
      migrationCost,
      breachProbability,
      compliancePenalty,
      // Intermediate values for computation breakdown
      details: {
        algoCount,
        sysScale,
        algoBase,
        infraLayers,
        infraBase,
        vendorLabel: profile?.vendorUnknown ? 'Unknown' : (profile?.vendorDependency ?? 'Not set'),
        vendorMul,
        migrationStatus: profile?.migrationStatus ?? 'not-started',
        migrationDiscount,
        agilityLabel: profile?.cryptoAgility ?? 'Not set',
        agilityMul,
        teamLabel: profile?.teamSize ?? 'Not set',
        teamMul,
        baseCost,
        riskScore: result.riskScore,
        mandatedCount: mandated.length,
        mandatedFrameworks: mandated.map((c) => c.framework),
        maxPenaltyFramework,
      },
    }
  }, [result])

  const [migrationCost, setMigrationCost] = useState(defaults.migrationCost)
  const [breachProbabilityPct, setBreachProbabilityPct] = useState(defaults.breachProbability)
  const [compliancePenalty, setCompliancePenalty] = useState(defaults.compliancePenalty)
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
      infoTip={infoTip}
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
          Breach cost baselines from IBM Cost of a Data Breach Report 2024. Compliance penalties
          from published regulatory enforcement data. Figures are illustrative estimates for
          financial planning purposes only.
        </span>
      </div>
    </CollapsibleSection>
  )
}
