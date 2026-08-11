// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Info, Play, Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import {
  SIM_CONSTANTS,
  type CostModelInputs,
  compareCostModels,
  mulberry32,
  sampleTriangular,
  percentile,
  programCostFor,
} from '@/utils/costModelSim'

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) return `$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`
  return `$${abs.toFixed(0)}`
}

const DRAWS = 1000
const BATCH = 25
const FRAME_MS = 30

interface MethodRow {
  key: string
  label: string
  why: string
  /** For point estimates. */
  point?: number
  /** For range methods (Monte Carlo, Scenario). */
  band?: { lo: number; mid: number; hi: number }
  color: string
}

export const CostModelExplorer: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  // Restore the last-saved scenario so the tool round-trips instead of
  // resetting to defaults on every visit.
  const savedInputs = useSavedArtifactInputs<CostModelInputs>('cost-model-comparison')
  const [inputs, setInputs] = useState<CostModelInputs>(
    savedInputs ?? {
      systems: 250,
      itBudgetAnnual: 50_000_000,
      complexity: 1.0,
      horizonYears: 5,
    }
  )

  const update = <K extends keyof CostModelInputs>(key: K, value: CostModelInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }))

  const comparison = useMemo(() => compareCostModels(inputs, { seed: 42 }), [inputs])

  const exportMarkdown = useMemo(() => {
    let md = `# Cost Model Comparison\n\n`
    md += `**Scenario:** ${inputs.systems} systems · ${formatCurrency(inputs.itBudgetAnnual)} IT budget · ${inputs.complexity.toFixed(1)}× complexity · ${inputs.horizonYears}yr\n\n`
    md += `| Method | Estimate |\n|--------|----------|\n`
    md += `| Parametric (budget-anchored) | ${formatCurrency(comparison.parametric)} |\n`
    md += `| Bottom-up (activity-based) | ${formatCurrency(comparison.bottomUp)} |\n`
    md += `| Probabilistic (Monte Carlo P50) | ${formatCurrency(comparison.monteCarlo.p50)} (P10–P90 ${formatCurrency(comparison.monteCarlo.p10)}–${formatCurrency(comparison.monteCarlo.p90)}) |\n`
    md += `| Judgemental (scenario expected) | ${formatCurrency(comparison.scenario.expected)} |\n`
    md += `| Analogical (historical) | ${formatCurrency(comparison.analogical)} |\n\n`
    md += `**Spread across methods:** ${comparison.spreadRatio.toFixed(1)}×\n\n`
    md += `**Cost of inaction (reference, not a migration cost):** ${formatCurrency(comparison.aleReference)}\n\n`
    md += `*Illustrative — the point is how far the methods diverge on identical inputs; triangulate rather than trust any single one.*\n`
    return md
  }, [inputs, comparison])

  const rows: MethodRow[] = useMemo(
    () => [
      {
        key: 'parametric',
        label: 'Parametric (budget-anchored)',
        why: `${SIM_CONSTANTS.budgetSharePct}% of IT budget × ${inputs.horizonYears}yr — ignores system count entirely, and is the lens most sensitive to programme duration.`,
        point: comparison.parametric,
        color: 'hsl(var(--primary))',
      },
      {
        key: 'bottomup',
        label: 'Bottom-up (activity-based)',
        why: `${formatCurrency(SIM_CONSTANTS.perSystemBase)}/system × complexity × ${inputs.systems} + ${formatCurrency(programCostFor(inputs.horizonYears))} standing program cost over ${inputs.horizonYears}yr.`,
        point: comparison.bottomUp,
        color: 'hsl(var(--secondary))',
      },
      {
        key: 'montecarlo',
        label: 'Probabilistic (Monte Carlo)',
        why: 'Samples an uncertain per-system cost → P10–P90 band. A range, not a point.',
        band: {
          lo: comparison.monteCarlo.p10,
          mid: comparison.monteCarlo.p50,
          hi: comparison.monteCarlo.p90,
        },
        color: 'hsl(var(--status-success))',
      },
      {
        key: 'scenario',
        label: 'Judgemental (scenario)',
        why: 'Optimistic / expected / conservative around the bottom-up number.',
        band: {
          lo: comparison.scenario.optimistic,
          mid: comparison.scenario.expected,
          hi: comparison.scenario.conservative,
        },
        color: 'hsl(var(--status-warning))',
      },
      {
        key: 'analogical',
        label: 'Analogical (historical)',
        why: `${formatCurrency(SIM_CONSTANTS.histPerSystem)}/system from past crypto migrations × ${inputs.systems} + ${formatCurrency(programCostFor(inputs.horizonYears))} standing program cost (illustrative).`,
        point: comparison.analogical,
        color: 'hsl(var(--primary))',
      },
    ],
    [comparison, inputs.systems, inputs.horizonYears]
  )

  // Shared axis scale across every bar (migration methods + ALE reference line).
  const axisMax = useMemo(() => {
    const values = [
      comparison.parametric,
      comparison.bottomUp,
      comparison.analogical,
      comparison.scenario.conservative,
      comparison.monteCarlo.p90,
      comparison.aleReference,
    ]
    return Math.max(...values, 1) * 1.05
  }, [comparison])

  const pct = (v: number) => `${Math.min(100, (v / axisMax) * 100)}%`

  // ── Animated Monte-Carlo detail ──────────────────────────────────────────
  const rawSamples = useMemo(() => {
    const rng = mulberry32(42)
    const base = SIM_CONSTANTS.perSystemBase * inputs.complexity
    const min = base * SIM_CONSTANTS.mcMinFactor
    const max = base * SIM_CONSTANTS.mcMaxFactor
    const arr: number[] = []
    for (let i = 0; i < DRAWS; i++) {
      arr.push(
        sampleTriangular(rng, min, base, max) * inputs.systems + SIM_CONSTANTS.fixedProgramCost
      )
    }
    return arr
  }, [inputs.complexity, inputs.systems])

  const [revealed, setRevealed] = useState(0)
  const [running, setRunning] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  // The histogram/percentiles below derive from the current sample prefix, so
  // when the scenario changes they update live — no reset needed.
  useEffect(() => {
    if (!running) return
    timer.current = setInterval(() => {
      setRevealed((r) => {
        const next = Math.min(DRAWS, r + BATCH)
        if (next >= DRAWS) setRunning(false)
        return next
      })
    }, FRAME_MS)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [running])

  const revealedStats = useMemo(() => {
    if (revealed === 0) return null
    const sorted = rawSamples.slice(0, revealed).sort((a, b) => a - b)
    return {
      p10: percentile(sorted, 10),
      p50: percentile(sorted, 50),
      p90: percentile(sorted, 90),
      sorted,
    }
  }, [rawSamples, revealed])

  // Histogram buckets over the full sample range so the shape settles in place.
  const histogram = useMemo(() => {
    const min = Math.min(...rawSamples)
    const max = Math.max(...rawSamples)
    const BUCKETS = 24
    const width = (max - min) / BUCKETS || 1
    const counts = new Array(BUCKETS).fill(0)
    for (let i = 0; i < revealed; i++) {
      const idx = Math.min(BUCKETS - 1, Math.floor((rawSamples[i] - min) / width))
      counts[idx] += 1
    }
    const peak = Math.max(...counts, 1)
    return { counts, peak, min, max }
  }, [rawSamples, revealed])

  const runSimulation = () => {
    setRevealed(0)
    setRunning(true)
  }

  return (
    <div className="space-y-6">
      {savedInputs && (
        <PreFilledBanner summary="Restored your last saved scenario — adjust the sliders below to update it." />
      )}
      {/* Framing */}
      <div className="bg-primary/5 rounded-lg p-3 border border-primary/30 flex items-start gap-2">
        <Info size={16} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Feel the difference.</strong> One scenario, six
          lenses. Five estimate the cost of <em>migrating</em>; the sixth (cost of inaction) is
          shown as a reference line, because it measures a different thing. Every figure is
          illustrative and driven by the sliders below — the lesson is how far the methods{' '}
          <em>diverge</em>.
        </p>
      </div>

      {/* Shared scenario inputs */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground">
          <Sliders size={16} className="text-primary" />
          Your scenario
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cme-systems" className="block text-sm font-medium text-foreground mb-2">
              Systems in scope
            </label>
            <input
              id="cme-systems"
              type="range"
              min={10}
              max={5000}
              step={10}
              value={inputs.systems}
              onChange={(e) => update('systems', parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>10</span>
              <span className="text-sm font-mono text-primary">{inputs.systems}</span>
              <span>5000</span>
            </div>
          </div>
          <div>
            <label htmlFor="cme-budget" className="block text-sm font-medium text-foreground mb-2">
              Annual IT budget
            </label>
            <input
              id="cme-budget"
              type="range"
              min={5_000_000}
              max={500_000_000}
              step={5_000_000}
              value={inputs.itBudgetAnnual}
              onChange={(e) => update('itBudgetAnnual', parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$5M</span>
              <span className="text-sm font-mono text-primary">
                {formatCurrency(inputs.itBudgetAnnual)}
              </span>
              <span>$500M</span>
            </div>
          </div>
          <div>
            <label
              htmlFor="cme-complexity"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Complexity / legacy factor
            </label>
            <input
              id="cme-complexity"
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={inputs.complexity}
              onChange={(e) => update('complexity', parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.5 modern</span>
              <span className="text-sm font-mono text-primary">
                {inputs.complexity.toFixed(1)}×
              </span>
              <span>2.0 legacy</span>
            </div>
          </div>
          <div>
            <label htmlFor="cme-horizon" className="block text-sm font-medium text-foreground mb-2">
              Planning horizon (years)
            </label>
            <input
              id="cme-horizon"
              type="range"
              min={1}
              max={10}
              step={1}
              value={inputs.horizonYears}
              onChange={(e) => update('horizonYears', parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span className="text-sm font-mono text-primary">{inputs.horizonYears} yr</span>
              <span>10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison chart */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-foreground">
            Five ways to price the same migration
          </div>
          <div className="text-xs text-muted-foreground">
            spread{' '}
            <span className="font-mono font-bold text-status-warning">
              {comparison.spreadRatio.toFixed(1)}×
            </span>
          </div>
        </div>

        <div className="relative space-y-3">
          {/* ALE reference line across the whole chart */}
          <div
            className="absolute top-0 bottom-6 border-l-2 border-dashed border-status-error/70 z-10 pointer-events-none"
            style={{ left: pct(comparison.aleReference) }}
          >
            <span className="absolute -top-1 left-1 text-[10px] text-status-error whitespace-nowrap">
              Cost of inaction {formatCurrency(comparison.aleReference)}
            </span>
          </div>

          {rows.map((row) => (
            <div key={row.key} className="relative">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium text-foreground">{row.label}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {row.band
                    ? `${formatCurrency(row.band.lo)} – ${formatCurrency(row.band.hi)}`
                    : formatCurrency(row.point ?? 0)}
                </span>
              </div>
              <div className="relative h-5 bg-muted/40 rounded">
                {row.band ? (
                  <>
                    <div
                      className="absolute top-0 bottom-0 rounded opacity-40"
                      style={{
                        left: pct(row.band.lo),
                        width: `${Math.max(0, ((row.band.hi - row.band.lo) / axisMax) * 100)}%`,
                        backgroundColor: row.color,
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5"
                      style={{ left: pct(row.band.mid), backgroundColor: row.color }}
                    />
                  </>
                ) : (
                  <div
                    className="absolute top-0 bottom-0 left-0 rounded"
                    style={{ width: pct(row.point ?? 0), backgroundColor: row.color }}
                  />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{row.why}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-foreground/90 mt-4 bg-muted/50 rounded-lg p-3">
          On this scenario the five migration-cost methods range from{' '}
          <strong>
            {formatCurrency(Math.min(...comparison.migrationPoints.filter((v) => v > 0)))}
          </strong>{' '}
          to <strong>{formatCurrency(Math.max(...comparison.migrationPoints))}</strong> — a{' '}
          <strong>{comparison.spreadRatio.toFixed(1)}× spread</strong> on identical inputs. No
          single number is &ldquo;the&rdquo; cost; that is exactly why you estimate more than one
          way and reconcile.
        </p>
        {/* Until 2026-08-10 only the parametric lens read the horizon, so this
            spread swung 2.4x -> 26.7x on the slider alone — it measured the
            slider, not the methods. Say what the horizon now does. (W4-1.) */}
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 leading-relaxed">
          <strong className="text-foreground/80">How the spread is built:</strong> all five lenses
          estimate the same quantity — the total cost of this programme — so all five respond to the
          planning horizon. Per-system work does not stretch with the schedule, but standing
          programme costs (PMO, governance, discovery) accrue for as long as the programme runs, so
          those scale while the per-system term does not. The parametric lens remains the most
          horizon-sensitive by construction, since it is a share of annual budget spent every year.
          The cost-of-inaction marker is a different quantity and is deliberately kept off the
          migration-cost comparison.
        </p>
      </div>

      {/* Animated Monte-Carlo detail */}
      <details className="glass-panel p-4" open>
        <summary className="text-sm font-semibold text-foreground cursor-pointer">
          Monte Carlo, run live
        </summary>
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            The probabilistic lens doesn&apos;t give a number — it gives a distribution. Run it and
            watch {DRAWS.toLocaleString()} draws build the shape. Each draw samples an uncertain
            average cost-per-system; the band is where the middle 80% lands (P10–P90).
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="default"
              onClick={runSimulation}
              disabled={running}
              className="inline-flex items-center gap-2"
            >
              <Play size={14} />
              {running ? 'Running…' : revealed > 0 ? 'Re-run' : 'Run Monte Carlo'}
            </Button>
            <span className="text-xs font-mono text-muted-foreground">
              {revealed.toLocaleString()} / {DRAWS.toLocaleString()} draws
            </span>
          </div>

          {/* Histogram */}
          <div className="flex items-end gap-0.5 h-24 border-b border-border">
            {histogram.counts.map((c, i) => (
              <div
                key={i}
                className="flex-1 bg-status-success/70 rounded-t transition-[height] duration-100"
                style={{ height: `${(c / histogram.peak) * 100}%` }}
              />
            ))}
          </div>

          {revealedStats && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded p-2">
                <div className="text-[11px] text-muted-foreground">P10</div>
                <div className="text-sm font-bold text-foreground">
                  {formatCurrency(revealedStats.p10)}
                </div>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <div className="text-[11px] text-muted-foreground">P50 (median)</div>
                <div className="text-sm font-bold text-foreground">
                  {formatCurrency(revealedStats.p50)}
                </div>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <div className="text-[11px] text-muted-foreground">P90</div>
                <div className="text-sm font-bold text-foreground">
                  {formatCurrency(revealedStats.p90)}
                </div>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* Bridge to the rest of the workshop */}
      <div className="bg-muted/50 rounded-lg p-3 border border-border">
        <p className="text-xs text-muted-foreground">
          Next, the <strong>ROI Calculator</strong> builds a defensible bottom-up estimate for your
          own estate and cross-checks it against your assessment — one honest number you can take to
          the board, with the humility this explorer just demonstrated.
        </p>
      </div>

      <ExportableArtifact
        title="Cost Model Comparison — Export"
        exportData={exportMarkdown}
        filename="cost-model-comparison"
        formats={['markdown', 'pdf', 'docx']}
        onExport={() =>
          addExecutiveDocument({
            id: `cost-model-comparison-${Date.now()}`,
            moduleId: 'pqc-business-case',
            type: 'cost-model-comparison',
            title: `Cost Model Comparison — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs,
            createdAt: Date.now(),
          })
        }
      >
        <p className="text-sm text-muted-foreground">
          Export the comparison as markdown, PDF, or DOCX — also saved to your Command Center Risk
          Artifacts.
        </p>
      </ExportableArtifact>

      <p className="text-[10px] italic text-muted-foreground">
        Illustrative simulation for building intuition. Figures derive from the sliders above and
        the labelled constants in each method — not from your organization&apos;s data.
      </p>
    </div>
  )
}
