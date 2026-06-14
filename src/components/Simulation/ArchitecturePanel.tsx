// SPDX-License-Identifier: GPL-3.0-only
/**
 * ArchitecturePanel — the Simulation's per-size systems + protocols view.
 * Systems show their product PQC status; protocol edges show whether they're
 * migratable now, blocked on a product/vendor, or irreducible (monitor-only).
 * Readiness = migratable ÷ vulnerable links.
 */
import {
  ARCHITECTURES,
  computeReadiness,
  edgeState,
  type EdgeState,
  type PqcStatus,
} from '@/data/simArchitecture'
import type { SimSize } from '@/data/moscaClock'

const STATUS_CHIP: Record<PqcStatus, string> = {
  available: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  partial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  roadmap: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  none: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

const EDGE_BADGE: Record<EdgeState, { label: string; cls: string }> = {
  migratable: {
    label: '✓ migratable',
    cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  blocked: { label: '⚡ blocked (product)', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
  vendor: { label: '⏳ vendor path', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  monitor: { label: '⚠ monitor-only', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  safe: { label: 'safe', cls: 'bg-muted text-muted-foreground' },
}

export function ArchitecturePanel({ size }: { size: SimSize }) {
  const arch = ARCHITECTURES[size]
  const byId = new Map(arch.nodes.map((n) => [n.id, n]))
  const r = computeReadiness(arch)

  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Your architecture ({size})</h2>
        <span className="text-xs text-muted-foreground">
          {r.readinessPct}% migratable now · {r.vulnerable} vulnerable · {r.blocked} blocked ·{' '}
          {r.residual} residual
        </span>
      </div>

      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-emerald-500" style={{ width: `${r.readinessPct}%` }} />
      </div>

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
            const badge = EDGE_BADGE[edgeState(arch, e)]
            return (
              <li
                key={`${e.from}-${e.to}-${e.protocol}`}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="min-w-0 truncate text-foreground">
                  {byId.get(e.from)?.label}{' '}
                  <span className="text-muted-foreground">—{e.protocol}→</span>{' '}
                  {byId.get(e.to)?.label}
                </span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 font-semibold ${badge.cls}`}>
                  {badge.label}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Green = PQC available · red = product has no PQC yet (blocked) · amber = vendor path or
        irreducible (defense-in-depth). Readiness = migratable ÷ vulnerable links.
      </p>
    </div>
  )
}
