// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ShieldAlert, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useActuarialModel, type InsuranceLensInputs } from '@/hooks/business/useActuarialModel'
import breachData from '@/data/actuarial/breachCostByIndustry.json'
import { usePersonaStore } from '@/store/usePersonaStore'

const INDUSTRY_ITEMS = breachData.industries.map((i) => ({ id: i.id, label: i.label }))

const DEFAULT_MIGRATION: number[] = [0.05, 0.12, 0.22, 0.35, 0.5, 0.63, 0.74, 0.83, 0.9, 0.95]

const COVERAGE_STATUS_CONFIG = {
  covered: {
    label: 'Covered',
    className: 'bg-status-success/20 text-status-success border-status-success/30',
  },
  excluded: {
    label: 'Excluded',
    className: 'bg-status-error/20 text-status-error border-status-error/30',
  },
  ambiguous: {
    label: 'Ambiguous',
    className: 'bg-status-warning/20 text-status-warning border-status-warning/30',
  },
}

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  tooltip,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  tooltip: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground flex items-center gap-1">
          {label}
          <span title={tooltip} className="text-muted-foreground cursor-help" aria-label={tooltip}>
            <Info size={11} />
          </span>
        </label>
        <span className="text-xs font-mono text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
        aria-label={label}
      />
    </div>
  )
}

export function CyberInsuranceLensSection() {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const isExecutive = selectedPersona === 'executive'

  const [expanded, setExpanded] = useState(isExecutive)
  const [industryId, setIndustryId] = useState('financial')
  const [scenario] = useState<'optimistic' | 'pessimistic'>('pessimistic')
  const [migratedFractionByYear, setMigratedFractionByYear] = useState<number[]>(DEFAULT_MIGRATION)
  const [breachCostMult, setBreachCostMult] = useState(1.0)
  const [fineMult, setFineMult] = useState(1.0)

  const migratedBy2030 = migratedFractionByYear[4] // index 4 = 2030
  const setMigratedBy2030 = useCallback((v: number) => {
    // Linear ramp: 5% in 2026, target v in 2030, 95% by 2035
    setMigratedFractionByYear(
      DEFAULT_MIGRATION.map((base, i) => {
        const lerp = i / (DEFAULT_MIGRATION.length - 1)
        return Math.min(0.99, base + lerp * (v - DEFAULT_MIGRATION[4]))
      })
    )
  }, [])

  const inputs: InsuranceLensInputs = useMemo(
    () => ({ industryId, scenario, migratedFractionByYear, breachCostMult, fineMult }),
    [industryId, scenario, migratedFractionByYear, breachCostMult, fineMult]
  )

  const model = useActuarialModel(inputs)

  const chartData = model.years.map((year, i) => ({
    year,
    'Optimistic ALE': model.aleOptimistic[i],
    'Pessimistic ALE': model.alePessimistic[i],
  }))

  const peak2030Pessimistic = model.alePessimistic[4] ?? 0
  const premiumPct = Math.round((model.premiumImpactMultiplier - 1) * 100)

  return (
    <section aria-labelledby="insurance-lens-heading">
      {/* Section header — always visible */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-primary" aria-hidden="true" />
          <h2 id="insurance-lens-heading" className="text-base font-semibold text-foreground">
            Cyber Insurance Lens
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="gap-1.5 text-xs text-muted-foreground"
          aria-expanded={expanded}
          aria-controls="insurance-lens-body"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {/* Collapsed summary strip */}
      {!expanded && (
        <div className="glass-panel px-4 py-3 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
          <span>
            Industry:{' '}
            <span className="text-foreground font-medium">{model.inputsUsed.industryLabel}</span>
          </span>
          <span>
            2030 ALE (pessimistic):{' '}
            <span className="text-status-error font-mono font-medium">
              {formatUSD(peak2030Pessimistic)}
            </span>
          </span>
          <span>
            Premium uplift:{' '}
            <span className="text-status-warning font-mono font-medium">+{premiumPct}%</span>
          </span>
        </div>
      )}

      {/* Expanded body */}
      {expanded && (
        <div id="insurance-lens-body" className="space-y-4">
          {/* Disclaimer */}
          <div className="rounded-lg border border-status-warning/40 bg-status-warning/5 px-4 py-3">
            <p className="text-xs text-status-warning leading-relaxed">
              Educational model — values are derived from published industry averages (IBM CODB
              2024, Verizon DBIR 2024, NetDiligence 2024) and are{' '}
              <span className="font-semibold">not a substitute for actuarial certification</span> or
              formal insurance advice.
            </p>
          </div>

          {/* Industry selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Industry:</span>
            <FilterDropdown
              items={INDUSTRY_ITEMS}
              selectedId={industryId}
              onSelect={setIndustryId}
              label="Select industry"
              noContainer
            />
          </div>

          {/* 2×2 panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Panel 1: ALE curve */}
            <div className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-primary" aria-hidden="true" />
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Annual Loss Expectancy (2026–2035)
                </p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                  />
                  <YAxis
                    tickFormatter={(v) => formatUSD(v as number)}
                    tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                    width={56}
                  />
                  <Tooltip
                    formatter={(value) => [formatUSD(value as number), '']}
                    contentStyle={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      fontSize: 11,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="Optimistic ALE"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Pessimistic ALE"
                    stroke="var(--color-status-error, #f87171)"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 2"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                ALE = HNDL probability × breach cost × (1 − % migrated) × regulatory multiplier.{' '}
                <a
                  href="https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  NIST IR 8547
                </a>{' '}
                ·{' '}
                <a
                  href="https://globalriskinstitute.org/publication/2023-quantum-threat-timeline-report/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GRI Quantum Timeline 2023
                </a>
              </p>
            </div>

            {/* Panel 2: Premium impact */}
            <div className="glass-panel p-4 flex flex-col">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Projected Premium Uplift
              </p>
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <p
                  className="text-5xl font-bold tabular-nums"
                  style={{
                    color:
                      premiumPct > 30 ? 'var(--color-status-error)' : 'var(--color-status-warning)',
                  }}
                >
                  +{premiumPct}%
                </p>
                <p className="text-xs text-muted-foreground text-center max-w-[200px] leading-relaxed">
                  vs. current base premium, given {Math.round(migratedBy2030 * 100)}% migration by
                  2030
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                Anchored to quantum-rider uplift range +15–50% from{' '}
                <a
                  href="https://netdiligence.com/wp-content/uploads/2024/10/2024-NetDiligence-Cyber-Claims-Study.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  NetDiligence 2024
                </a>
                . Higher migration lowers uplift.
              </p>
            </div>

            {/* Panel 3: Coverage gap grid */}
            <div className="glass-panel p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Policy Coverage Gaps
              </p>
              <div className="space-y-2">
                {model.coverageGaps.map((gap) => {
                  const cfg = COVERAGE_STATUS_CONFIG[gap.status]
                  return (
                    <div key={gap.scenario} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-foreground">{gap.scenarioLabel}</span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                Based on{' '}
                <a
                  href="https://assets.lloyds.com/assets/pdf-market-bulletin-y5258/1/pdf-market-bulletin-y5258.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Lloyd's Y5258 quantum exclusion clause
                </a>
                . Actual coverage depends on specific policy wording.
              </p>
            </div>

            {/* Panel 4: Sensitivity sliders */}
            <div className="glass-panel p-4 space-y-4">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Sensitivity Controls
              </p>
              <SliderRow
                label="% migrated by 2030"
                value={migratedBy2030}
                min={0}
                max={1}
                step={0.05}
                format={(v) => `${Math.round(v * 100)}%`}
                tooltip="Fraction of your cryptographic infrastructure migrated to PQC algorithms by 2030. Higher = lower ALE and premium impact."
                onChange={setMigratedBy2030}
              />
              <SliderRow
                label="Breach cost multiplier"
                value={breachCostMult}
                min={0.5}
                max={2.0}
                step={0.1}
                format={(v) => `${v.toFixed(1)}×`}
                tooltip={`Scales the per-record breach cost vs. IBM CODB 2024 average ($${breachData.industries.find((i) => i.id === industryId)?.meanCostPerRecord ?? 0}/record). Use > 1 if your data is more sensitive than the industry average.`}
                onChange={setBreachCostMult}
              />
              <SliderRow
                label="Regulatory fine multiplier"
                value={fineMult}
                min={0.5}
                max={2.0}
                step={0.1}
                format={(v) => `${v.toFixed(1)}×`}
                tooltip="Override the regulatory fine component of ALE. > 1 for jurisdictions with aggressive enforcement history."
                onChange={setFineMult}
              />
              <div className="pt-1 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground">2030 ALE (pessimistic):</span>{' '}
                  <span className="font-mono text-status-error">
                    {formatUSD(peak2030Pessimistic)}
                  </span>
                  {' · '}
                  <span className="font-medium text-foreground">Breach exposure:</span>{' '}
                  <span className="font-mono">
                    {formatUSD(model.inputsUsed.costPerRecord * model.inputsUsed.meanBreachRecords)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
