// SPDX-License-Identifier: GPL-3.0-only
//
// Migration tab — validate a complete PQC migration against the real agility
// engine. Section 1 (this milestone): build the seven-key CLASSICAL estate
// with label-only requests and drive every key's crypto by hand. Sections 2/3
// (next milestones): flip to migration-pqc / migration-hybrid and watch the
// engine rekey the vulnerable keys on use + via the ReKey sweep.
//
// Contract with the engine: the "application" here NEVER names an algorithm,
// a curve, or a key size. It passes business key labels; the active policy's
// name_pattern rules decide everything else. That is the whole demo.

import { useCallback, useMemo, useState } from 'react'
import { ArrowRightLeft, Loader2, ShieldAlert, ShieldCheck, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MIGRATION_KEYS, MIGRATION_POLICIES } from './migrationKeys'
import { useMigrationEngine } from './useMigrationEngine'
import { MigrationKeyCard } from './MigrationKeyCard'

export function MigrationView() {
  const { engine, policyName, bootError } = useMigrationEngine()
  const [keystoreBump, setKeystoreBump] = useState(0)
  const [epoch, setEpoch] = useState(0)

  const onKeystoreChange = useCallback(() => setKeystoreBump((n) => n + 1), [])

  // Estate risk summary — recomputed from the REAL keystore after every op.
  const estate = useMemo(() => {
    void keystoreBump
    if (!engine) return { total: 0, safe: 0, atRisk: 0 }
    const keys = engine
      .listObjects()
      .filter((o) => o.objectType === 'SymmetricKey' || o.objectType === 'PrivateKey')
    return {
      total: keys.length,
      safe: keys.filter((k) => k.quantumSafe).length,
      atRisk: keys.filter((k) => !k.quantumSafe).length,
    }
  }, [engine, keystoreBump])

  /** Best-effort estate reset: revoke + destroy everything on this engine's
   * hermetic slot, clear the audit ring, bump the card epoch. */
  const onReset = useCallback(() => {
    if (!engine) return
    for (const o of engine.listObjects()) {
      if (o.state === 'Active') engine.runOp({ op: 'Revoke', uid: o.uid })
      engine.runOp({ op: 'Destroy', uid: o.uid })
    }
    engine.clearAudit()
    setEpoch((n) => n + 1)
    setKeystoreBump((n) => n + 1)
  }, [engine])

  if (bootError) {
    return (
      <p className="text-sm text-status-error" data-testid="migration-boot-error">
        Migration engine failed to start: {bootError}
      </p>
    )
  }
  if (!engine) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 size={14} className="animate-spin" /> starting the migration engine…
      </p>
    )
  }

  return (
    <div className="space-y-4" data-tour="migration-root">
      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      <div>
        <h3 className="flex items-center gap-2 font-semibold text-primary">
          <ArrowRightLeft size={16} /> PQC Migration — label-only crypto, policy-driven algorithms
        </h3>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
          The application below never names an algorithm — it asks for keys by{' '}
          <em>business label</em> and the active policy decides what each label means. Build the
          classical estate, exercise every key for real, then (next milestones) flip the policy and
          watch the engine migrate the vulnerable keys automatically. Every field is editable;
          tampering with a signature or ciphertext and re-checking it is part of the demo.
        </p>
      </div>

      {/* ── Policy rail ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2" data-tour="migration-policy-rail">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Policy
        </span>
        {MIGRATION_POLICIES.map((p) => {
          const active = policyName === p.name
          return (
            <Button
              key={p.name}
              variant="ghost"
              size="sm"
              role="radio"
              aria-checked={active}
              disabled={!p.available}
              title={p.blurb}
              className={cn(
                'h-7 rounded-full border px-3 text-[11px] font-medium',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground',
                p.available ? 'hover:border-primary/60' : 'cursor-not-allowed opacity-50',
              )}
              data-testid={`migration-policy-${p.name}`}
            >
              {p.label}
            </Button>
          )
        })}
        <span className="text-[11px] text-muted-foreground">
          — Hybrid and Full PQC unlock with the rekey milestones.
        </span>

        {/* estate summary + reset */}
        <span className="ml-auto flex items-center gap-2">
          {estate.total > 0 && (
            <span className="flex items-center gap-2 text-[11px]" data-testid="migration-summary">
              <span className="inline-flex items-center gap-1 text-status-success">
                <ShieldCheck size={12} /> {estate.safe} safe
              </span>
              <span className="inline-flex items-center gap-1 text-status-error">
                <ShieldAlert size={12} /> {estate.atRisk} at risk
              </span>
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 gap-1.5 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={13} /> Reset estate
          </Button>
        </span>
      </div>

      {/* ── Section 1 · classical estate ──────────────────────────────────── */}
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3" data-tour="migration-estate">
        {MIGRATION_KEYS.map((k) => (
          <MigrationKeyCard
            key={k.id}
            config={k}
            engine={engine}
            onKeystoreChange={onKeystoreChange}
            epoch={epoch}
          />
        ))}
      </div>
    </div>
  )
}
