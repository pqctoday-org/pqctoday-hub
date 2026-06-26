// SPDX-License-Identifier: GPL-3.0-only
/**
 * ArchitecturePanel — the Simulation's per-size migration board. Systems show
 * their product PQC status; each vulnerable protocol link is migratable now,
 * blocked (product/vendor has no PQC), or monitor-only (irreducible).
 *
 * Migrating a link needs BOTH gates (WS-04): the player must have completed
 * enough P5 activities to UNLOCK a link (effort) AND pick a sound strategy
 * hybrid/pure (judgment). Decisions persist in the store and drive the grounded
 * readiness KPI. A choice that the jurisdiction marks non-compliant still
 * migrates (it is quantum-safe) but lowers a SEPARATE compliance meter — it no
 * longer blocks the migration.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  ARCHITECTURES,
  edgeState,
  edgeKey,
  mermaidFromArchitecture,
  type EdgeState,
  type ProtocolEdge,
  type PqcStatus,
} from '@/data/simArchitecture'
import { checkChoice } from '@/data/jurisdiction'
import type { SimSize } from '@/data/moscaClock'
import { useSimulationStore } from '@/store/useSimulationStore'
import { MermaidDiagram } from './MermaidDiagram'

const STATUS_CHIP: Record<PqcStatus, string> = {
  available: 'bg-status-success/15 text-status-success',
  partial: 'bg-status-warning/15 text-status-warning',
  roadmap: 'bg-status-info/15 text-status-info',
  none: 'bg-status-error/15 text-status-error',
}

const NON_MIGRATABLE_BADGE: Partial<Record<EdgeState, { label: string; cls: string }>> = {
  blocked: { label: '⚡ blocked (product)', cls: 'bg-status-error/15 text-status-error' },
  vendor: { label: '⏳ vendor path', cls: 'bg-status-warning/15 text-status-warning' },
  monitor: { label: '⚠ monitor-only', cls: 'bg-status-warning/15 text-status-warning' },
}

export function ArchitecturePanel({
  size,
  country,
  p5Frac,
}: {
  size: SimSize
  country: string
  /** Fraction (0–1) of P5 activities completed — the effort gate that unlocks links. */
  p5Frac: number
}) {
  const arch = ARCHITECTURES[size]
  const byId = new Map(arch.nodes.map((n) => [n.id, n]))
  const [choice, setChoice] = useState<'hybrid' | 'pure'>('hybrid')
  const [view, setView] = useState<'list' | 'diagram'>('list')
  const edgeDecisions = useSimulationStore((s) => s.edgeDecisions)
  const setEdgeDecision = useSimulationStore((s) => s.setEdgeDecision)

  const verdict = checkChoice(country, choice)

  const vulnerable = arch.edges.filter((e) => e.vulnerable)
  const migratable = vulnerable.filter((e) => edgeState(arch, e) === 'migratable')
  const isMigrated = (e: ProtocolEdge) => Boolean(edgeDecisions[edgeKey(e)])
  const done = migratable.filter(isMigrated).length
  // Effort gate: completed P5 activities unlock the right to migrate this many links.
  const unlocked = Math.floor(Math.max(0, Math.min(1, p5Frac)) * migratable.length)
  const capacity = Math.max(0, unlocked - done) // links you may still migrate now
  const readinessPct = vulnerable.length
    ? Math.round((Math.min(done, unlocked) / vulnerable.length) * 100)
    : 100

  const migrate = (e: ProtocolEdge) => {
    if (capacity <= 0 || isMigrated(e)) return
    setEdgeDecision(edgeKey(e), choice)
  }
  const migrateAll = () => {
    // Migrate up to the remaining unlocked capacity. Use a local budget — the
    // `edgeDecisions` closure is the render snapshot and won't update mid-loop.
    let budget = capacity
    for (const e of migratable) {
      if (budget <= 0) break
      if (isMigrated(e)) continue
      setEdgeDecision(edgeKey(e), choice)
      budget--
    }
  }

  const verdictCls =
    verdict.level === 'fail'
      ? 'text-status-error'
      : verdict.level === 'warn'
        ? 'text-status-warning'
        : 'text-status-success'

  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Your architecture ({size})</h2>
        <span className="text-xs text-muted-foreground">
          {done}/{vulnerable.length} links migrated · {unlocked}/{migratable.length} unlocked via P5
        </span>
      </div>

      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-status-success transition-all"
          style={{ width: `${readinessPct}%` }}
        />
      </div>

      {/* View toggle: interactive list vs Mermaid diagram */}
      <div className="mb-3 flex gap-1.5">
        {(['list', 'diagram'] as const).map((v) => (
          <Button
            key={v}
            type="button"
            variant="ghost"
            onClick={() => setView(v)}
            className={`h-auto rounded-md border px-3 py-1 text-xs transition-colors ${
              view === v
                ? 'border-primary bg-primary/10 font-medium text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {v === 'list' ? 'List' : 'Diagram'}
          </Button>
        ))}
      </div>

      {view === 'diagram' ? (
        <div>
          <MermaidDiagram source={mermaidFromArchitecture(arch)} id={size} />
          <p className="mt-2 text-xs text-muted-foreground">
            Green nodes = PQC available · red = no PQC yet · dashed edges ⚠ = irreducible
            (monitor-only). Switch to List to migrate links.
          </p>
        </div>
      ) : (
        <>
          {/* Strategy + jurisdiction compliance (informational — never blocks) */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Strategy
            </span>
            {(['hybrid', 'pure'] as const).map((c) => (
              <Button
                key={c}
                type="button"
                variant="ghost"
                onClick={() => setChoice(c)}
                className={`h-auto rounded-md border px-3 py-1 text-xs transition-colors ${
                  choice === c
                    ? 'border-primary bg-primary/10 font-medium text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {c}
              </Button>
            ))}
            <span className={`text-xs ${verdictCls}`}>{verdict.reason}</span>
            <Button
              type="button"
              variant="ghost"
              onClick={migrateAll}
              disabled={capacity <= 0}
              className="h-auto rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted"
            >
              Migrate eligible ({capacity})
            </Button>
          </div>

          {capacity <= 0 && done < migratable.length && (
            <p className="mb-3 text-xs text-status-warning">
              Complete more P5 (Execute) activities to unlock the next link.
            </p>
          )}

          <div className="mb-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Systems
            </div>
            <div className="flex flex-wrap gap-1.5">
              {arch.nodes
                .filter((n) => n.layer !== 'Actor')
                .map((n) => (
                  <span
                    key={n.id}
                    className={`rounded px-2 py-0.5 text-xs ${STATUS_CHIP[n.pqcStatus]}`}
                    title={`${n.layer} · PQC ${n.pqcStatus}`}
                  >
                    {n.label}
                  </span>
                ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Protocols
            </div>
            <ul className="space-y-1">
              {arch.edges.map((e) => {
                const st = edgeState(arch, e)
                const migratedChoice = edgeDecisions[edgeKey(e)]
                const label = (
                  <span className="min-w-0 truncate text-foreground">
                    {byId.get(e.from)?.label}{' '}
                    <span className="text-muted-foreground">—{e.protocol}→</span>{' '}
                    {byId.get(e.to)?.label}
                  </span>
                )
                if (st === 'migratable') {
                  return (
                    <li
                      key={edgeKey(e)}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      {label}
                      {migratedChoice ? (
                        <span className="shrink-0 rounded bg-status-success/15 px-1.5 py-0.5 font-semibold text-status-success">
                          ✓ {migratedChoice}
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => migrate(e)}
                          disabled={capacity <= 0}
                          className="h-auto shrink-0 rounded border border-primary/40 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-40"
                        >
                          Migrate
                        </Button>
                      )}
                    </li>
                  )
                }
                const badge = NON_MIGRATABLE_BADGE[st]
                return (
                  <li key={edgeKey(e)} className="flex items-center justify-between gap-2 text-xs">
                    {label}
                    {badge && (
                      <span className={`shrink-0 rounded px-1.5 py-0.5 font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Migrate the eligible links (hybrid or pure). A non-compliant strategy still migrates but
            lowers your compliance score. Blocked links wait on a product/vendor PQC release;
            monitor-only links are irreducible (defense-in-depth).
          </p>
        </>
      )}
    </div>
  )
}
