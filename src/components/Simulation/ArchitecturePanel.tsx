// SPDX-License-Identifier: GPL-3.0-only
/**
 * ArchitecturePanel — the Simulation's per-size migration board. Systems show
 * their product PQC status; each vulnerable protocol link is migratable now,
 * blocked (product/vendor has no PQC), or monitor-only (irreducible). You pick a
 * migration strategy (hybrid/pure, validated by the jurisdiction) and migrate
 * the eligible links; readiness = migrated ÷ vulnerable.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  ARCHITECTURES,
  edgeState,
  type EdgeState,
  type ProtocolEdge,
  type PqcStatus,
} from '@/data/simArchitecture'
import { checkChoice } from '@/data/jurisdiction'
import type { SimSize } from '@/data/moscaClock'

const STATUS_CHIP: Record<PqcStatus, string> = {
  available: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  partial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  roadmap: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  none: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

const NON_MIGRATABLE_BADGE: Partial<Record<EdgeState, { label: string; cls: string }>> = {
  blocked: { label: '⚡ blocked (product)', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
  vendor: { label: '⏳ vendor path', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  monitor: { label: '⚠ monitor-only', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
}

const edgeKey = (e: ProtocolEdge) => `${e.from}-${e.to}-${e.protocol}`

export function ArchitecturePanel({ size, country }: { size: SimSize; country: string }) {
  const arch = ARCHITECTURES[size]
  const byId = new Map(arch.nodes.map((n) => [n.id, n]))
  const [choice, setChoice] = useState<'hybrid' | 'pure'>('hybrid')
  const [migrated, setMigrated] = useState<Set<string>>(new Set())

  const verdict = checkChoice(country, choice)
  const canMigrate = verdict.level !== 'fail'

  const vulnerable = arch.edges.filter((e) => e.vulnerable)
  const migratable = vulnerable.filter((e) => edgeState(arch, e) === 'migratable')
  const done = migratable.filter((e) => migrated.has(edgeKey(e))).length
  const readinessPct = vulnerable.length ? Math.round((done / vulnerable.length) * 100) : 100

  const migrate = (e: ProtocolEdge) => {
    if (!canMigrate) return
    setMigrated((s) => new Set(s).add(edgeKey(e)))
  }
  const migrateAll = () => {
    if (!canMigrate) return
    setMigrated(new Set(migratable.map(edgeKey)))
  }

  const verdictCls =
    verdict.level === 'fail'
      ? 'text-red-600 dark:text-red-400'
      : verdict.level === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400'

  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Your architecture ({size})</h2>
        <span className="text-xs text-muted-foreground">
          {done}/{vulnerable.length} links migrated · ceiling {migratable.length} migratable now
        </span>
      </div>

      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${readinessPct}%` }}
        />
      </div>

      {/* Strategy + jurisdiction compliance */}
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
          disabled={!canMigrate || done === migratable.length}
          className="h-auto rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted"
        >
          Migrate all eligible
        </Button>
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
            const st = edgeState(arch, e)
            const isMigrated = migrated.has(edgeKey(e))
            const label = (
              <span className="min-w-0 truncate text-foreground">
                {byId.get(e.from)?.label}{' '}
                <span className="text-muted-foreground">—{e.protocol}→</span>{' '}
                {byId.get(e.to)?.label}
              </span>
            )
            if (st === 'migratable') {
              return (
                <li key={edgeKey(e)} className="flex items-center justify-between gap-2 text-xs">
                  {label}
                  {isMigrated ? (
                    <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ {choice}
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => migrate(e)}
                      disabled={!canMigrate}
                      className="h-auto shrink-0 rounded border border-primary/40 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
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
        Migrate the eligible links (hybrid or pure, per your jurisdiction). Blocked links wait on a
        product/vendor PQC release; monitor-only links are irreducible (defense-in-depth).
      </p>
    </div>
  )
}
