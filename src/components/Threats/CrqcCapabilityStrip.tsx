// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Activity, ChevronDown, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CRQC_ESTIMATE_KIND_LABELS,
  CRQC_QUBIT_THRESHOLDS,
  CURRENT_QUANTUM_COMPUTERS,
  getCrqcForecast,
  getCrqcMigrationDeadlines,
  getCrqcSiteDerivedScenarios,
  type CRQCEstimate,
} from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'

/**
 * Consolidated CRQC-timeline / capability strip (PER-PAGE-CHANGES Threats #5).
 *
 * Surfaces a single CTI-style banner on the Threats page: the one CRQC expert
 * forecast (`getCrqcForecast()`, ruling R5 — arrival forecasts only), the
 * migration deadlines regulators have set (shown separately, never as a
 * forecast), plus a compact modality-progress readout from the live
 * `CURRENT_QUANTUM_COMPUTERS` table. Both data sets are reused verbatim from
 * the QuantumThreats module — this component renders, it does not re-author.
 *
 * Additive: the headline strip is always visible; the per-source / per-machine
 * detail is collapsed by default, so nothing else on the page is affected when
 * it is not expanded.
 */

const CURRENT_YEAR = new Date().getFullYear()

export const CrqcCapabilityStrip: React.FC<{
  defaultExpanded?: boolean
  /**
   * Optionally-controlled expand state (Phase 7 item 2 of the 2026-pages plan):
   * when both `expanded` and `onExpandedChange` are supplied, the parent owns
   * the toggle (e.g. so it can share it with a sibling like CrqcTrajectoryChart)
   * and the internal `useState` below is bypassed entirely. Any existing caller
   * that only passes `defaultExpanded` (or nothing) keeps managing its own
   * state exactly as before.
   */
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}> = ({ defaultExpanded = false, expanded: controlledExpanded, onExpandedChange }) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isControlled = controlledExpanded !== undefined && onExpandedChange !== undefined
  const expanded = isControlled ? controlledExpanded : internalExpanded
  const setExpanded = (next: boolean | ((v: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(expanded) : next
    if (isControlled) {
      onExpandedChange(resolved)
    } else {
      setInternalExpanded(resolved)
    }
  }

  // The one CRQC window (ruling R5) — the same function the trajectory chart,
  // exposure hero, economics calculator and mobile screen read.
  const forecast = useMemo(() => getCrqcForecast(), [])
  const deadlines = useMemo(() => getCrqcMigrationDeadlines(), [])
  const scenarios = useMemo(() => getCrqcSiteDerivedScenarios(), [])
  const yearsToLow = forecast.low - CURRENT_YEAR

  const leadMachine = useMemo(
    () =>
      [...CURRENT_QUANTUM_COMPUTERS].sort(
        (a, b) => b.estimatedLogicalQubits - a.estimatedLogicalQubits
      )[0],
    []
  )

  // The most-urgent target needs the fewest logical qubits — show progress toward the
  // low-end Shor target for ECC-256, derived from the same CRQC_QUBIT_THRESHOLDS
  // the trajectory chart's reference lines use (Threats #1), not a separate hardcoded
  // number. Published estimates range to ~2,330+.
  const shorTargetQubits = CRQC_QUBIT_THRESHOLDS.bitcoinEcc256
  const progressPct = useMemo(
    () => Math.min(100, (leadMachine.estimatedLogicalQubits / shorTargetQubits) * 100),
    [leadMachine, shorTargetQubits]
  )

  return (
    <section
      className="glass-panel p-4 mb-4 border border-border"
      aria-labelledby="crqc-strip-heading"
      data-testid="crqc-capability-strip"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Activity size={20} className="text-warning mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2
              id="crqc-strip-heading"
              className="text-base font-bold text-foreground flex items-center gap-2 flex-wrap"
            >
              CRQC Capability Watch
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-warning/30 bg-warning/10 text-warning uppercase tracking-wide">
                CTI
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              When the clock stops: the published expert forecast of CRQC arrival, the migration
              deadlines regulators have set (deadlines, not forecasts), and how far today&apos;s
              hardware has come.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="crqc-strip-body"
          className="shrink-0 text-xs gap-1"
        >
          <Cpu size={14} aria-hidden="true" />
          {expanded ? 'Hide sources' : 'Sources'}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {/* Headline strip — always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            CRQC expert forecast
          </div>
          <div className="text-2xl font-bold text-warning">
            {forecast.low}–{forecast.high}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{forecast.label}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Migration deadlines (not forecasts)
          </div>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {deadlines.map((e) => (
              <li key={e.source}>
                <span className="font-semibold text-foreground">{e.source}</span>: {e.yearLow}–
                {e.yearHigh}
              </li>
            ))}
          </ul>
          <div className="text-[10px] text-muted-foreground mt-1">
            {yearsToLow > 0
              ? `The forecast's low end is ${yearsToLow} year${yearsToLow === 1 ? '' : 's'} out.`
              : 'The forecast window has opened.'}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Hardware progress
          </div>
          <div className="text-2xl font-bold text-primary">
            {leadMachine.estimatedLogicalQubits}
            <span className="text-sm font-normal text-muted-foreground">
              {' '}
              / ~{shorTargetQubits.toLocaleString()} LQ
            </span>
          </div>
          <div
            className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Logical-qubit progress toward the smallest Shor target"
          >
            <div className="h-full bg-primary rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            ~{shorTargetQubits.toLocaleString()} LQ is the low-end ECC-256 estimate
            (Google/Ethereum, 2026); earlier work ranged to ~2,330+ LQ (Roetteler et al. 2017,
            arXiv:1706.06752). The bar to break RSA-2048 keeps falling: ~20M physical qubits (2019)
            → &lt;1M (Gidney 2025) → &lt;100k projected (qLDPC, 2026).
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            The <em>logical</em>-qubit count for the same RSA-2048 target has fallen too: 2n+2,
            which gives 4,098 (2016-era estimate, arXiv:1611.07995) → ~1,730
            (Chevignard–Fouque–Schrottenloher, ePrint 2024/222) → ~1,537 (Gidney 2025,
            arXiv:2505.15917) — an algorithmic improvement independent of the
            physical-qubit-overhead cuts above.
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Lead: {leadMachine.vendor} {leadMachine.name} ({leadMachine.qubitType})
          </div>
        </div>
      </div>

      {/* Per-source + per-machine detail — collapsible */}
      {expanded && (
        <div id="crqc-strip-body" className="mt-4 space-y-4">
          <EstimateList title="CRQC arrival forecast — the window above" items={forecast.sources} />
          <EstimateList
            title="Migration deadlines and planning guidance — dates to finish migrating, not forecasts"
            items={deadlines}
          />
          <EstimateList
            title="Not in the window — a range this site derived; the source makes no arrival claim"
            items={scenarios}
          />
          <div>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Current modality progress (logical-qubit estimates)
            </h3>
            <ul className="space-y-1.5">
              {[...CURRENT_QUANTUM_COMPUTERS]
                .sort((a, b) => b.estimatedLogicalQubits - a.estimatedLogicalQubits)
                .map((m) => (
                  <li
                    key={`${m.vendor}-${m.name}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs"
                  >
                    <span className="font-mono font-semibold text-primary w-12 shrink-0">
                      {m.estimatedLogicalQubits} LQ
                    </span>
                    <span className="font-medium text-foreground sm:w-48 shrink-0">
                      {m.vendor} {m.name}
                    </span>
                    <span className="text-muted-foreground">
                      {m.qubitType} · {m.physicalQubits} physical · {m.year}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

/** One attributed list of CRQC_ESTIMATES entries, each tagged with its kind. */
function EstimateList({ title, items }: { title: string; items: CRQCEstimate[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((e) => (
          <li
            key={e.source}
            className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs"
          >
            <span className="font-mono font-semibold text-warning w-24 shrink-0">
              {e.yearLow}–{e.yearHigh}
            </span>
            <a
              href={e.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground sm:w-64 shrink-0 hover:text-primary hover:underline"
            >
              {e.source}
            </a>
            <span className="text-muted-foreground">
              <span className="font-semibold">{CRQC_ESTIMATE_KIND_LABELS[e.kind]}</span> ·{' '}
              {e.confidence}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
