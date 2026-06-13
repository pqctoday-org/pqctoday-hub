// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Activity, ChevronDown, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CRQC_ESTIMATES,
  CURRENT_QUANTUM_COMPUTERS,
} from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'

/**
 * Consolidated CRQC-timeline / capability strip (PER-PAGE-CHANGES Threats #5).
 *
 * Surfaces a single CTI-style banner on the Threats page: the consensus
 * Z-estimate (the "when does the clock stop" year) reduced from the published
 * `CRQC_ESTIMATES`, plus a compact modality-progress readout from the live
 * `CURRENT_QUANTUM_COMPUTERS` table. Both data sets are reused verbatim from
 * the QuantumThreats module — this component renders, it does not re-author.
 *
 * Additive: the headline strip is always visible; the per-source / per-machine
 * detail is collapsed by default, so nothing else on the page is affected when
 * it is not expanded.
 */

const CURRENT_YEAR = 2026

export const CrqcCapabilityStrip: React.FC = () => {
  const [expanded, setExpanded] = useState(false)

  const consensus = useMemo(() => {
    const lows = CRQC_ESTIMATES.map((e) => e.yearLow)
    const highs = CRQC_ESTIMATES.map((e) => e.yearHigh)
    const earliest = Math.min(...lows)
    const latest = Math.max(...highs)
    // Median of the per-source midpoints as the headline Z-estimate.
    const mids = CRQC_ESTIMATES.map((e) => (e.yearLow + e.yearHigh) / 2).sort((a, b) => a - b)
    const mid = mids[Math.floor(mids.length / 2)]
    return {
      earliest,
      latest,
      zEstimate: Math.round(mid),
      yearsToEarliest: earliest - CURRENT_YEAR,
    }
  }, [])

  const leadMachine = useMemo(
    () =>
      [...CURRENT_QUANTUM_COMPUTERS].sort(
        (a, b) => b.estimatedLogicalQubits - a.estimatedLogicalQubits
      )[0],
    []
  )

  // The most-urgent target needs the fewest logical qubits — show progress
  // toward the smallest Shor target (≈1,200 logical qubits for ECC-256).
  const SHOR_TARGET_QUBITS = 1200
  const progressPct = useMemo(
    () => Math.min(100, (leadMachine.estimatedLogicalQubits / SHOR_TARGET_QUBITS) * 100),
    [leadMachine]
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
                CTI · Z-estimate
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              When the clock stops: consensus CRQC arrival window and how far today&apos;s hardware
              has come.
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
            Z — consensus estimate
          </div>
          <div className="text-2xl font-bold text-warning">~{consensus.zEstimate}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Window {consensus.earliest}–{consensus.latest} ({CRQC_ESTIMATES.length} sources)
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Earliest credible
          </div>
          <div className="text-2xl font-bold text-destructive">{consensus.earliest}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {consensus.yearsToEarliest > 0
              ? `${consensus.yearsToEarliest} years out at the low end`
              : 'Inside the planning horizon now'}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Hardware progress
          </div>
          <div className="text-2xl font-bold text-primary">
            {leadMachine.estimatedLogicalQubits}
            <span className="text-sm font-normal text-muted-foreground"> / ~1,200 LQ</span>
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
            Lead: {leadMachine.vendor} {leadMachine.name} ({leadMachine.qubitType})
          </div>
        </div>
      </div>

      {/* Per-source + per-machine detail — collapsible */}
      {expanded && (
        <div id="crqc-strip-body" className="mt-4 space-y-4">
          <div>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              CRQC arrival estimates
            </h3>
            <ul className="space-y-1.5">
              {CRQC_ESTIMATES.map((e) => (
                <li
                  key={e.source}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs"
                >
                  <span className="font-mono font-semibold text-warning w-24 shrink-0">
                    {e.yearLow}–{e.yearHigh}
                  </span>
                  <span className="font-medium text-foreground sm:w-64 shrink-0">{e.source}</span>
                  <span className="text-muted-foreground">{e.confidence}</span>
                </li>
              ))}
            </ul>
          </div>
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
