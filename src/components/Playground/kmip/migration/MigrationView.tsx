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

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Boxes, Loader2, ShieldAlert, ShieldCheck, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AuditEvent, KmipEngine, OpResult } from '@/wasm/kmip/kmipEngine'
import { MIGRATION_KEYS, MIGRATION_POLICIES, type MigrationPolicyChip } from './migrationKeys'
import { useMigrationEngine } from './useMigrationEngine'
import { MigrationKeyCard } from './MigrationKeyCard'

export function MigrationView() {
  const { engine, policyName, bootError } = useMigrationEngine()
  const [keystoreBump, setKeystoreBump] = useState(0)
  const [epoch, setEpoch] = useState(0)
  // Active policy name — starts from the engine's boot policy, then tracks
  // whatever the rail last switched to.
  const [activePolicy, setActivePolicy] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)
  useEffect(() => {
    if (policyName && activePolicy === null) setActivePolicy(policyName)
  }, [policyName, activePolicy])

  const onKeystoreChange = useCallback(() => setKeystoreBump((n) => n + 1), [])

  // Per-mode KMIP audit log — every op is bucketed by the policy active when it
  // ran, so you can compare the exact wire/engine trail under Classical vs
  // Hybrid vs Full PQC.
  const modeOf = (policy: string | null): 'classical' | 'hybrid' | 'pqc' =>
    policy === 'migration-pqc' ? 'pqc' : policy === 'migration-hybrid' ? 'hybrid' : 'classical'
  const [logs, setLogs] = useState<Record<'classical' | 'hybrid' | 'pqc', LogEntry[]>>({
    classical: [],
    hybrid: [],
    pqc: [],
  })
  const onOpLog = useCallback(
    (op: string, keyLabel: string, result: OpResult) => {
      const mode = modeOf(activePolicy)
      setLogs((l) => ({
        ...l,
        [mode]: [
          ...l[mode],
          { op, keyLabel, ok: result.ok, message: result.message, events: result.audit ?? [] },
        ],
      }))
    },
    [activePolicy],
  )

  /** Flip the active crypto-agility policy. Loading a new policy does NOT
   * touch existing keys — they stay classical (and at-risk) until each is
   * exercised (Encrypt / Sign / Establish), at which point the engine rekeys
   * it to the policy's PQC/hybrid target on first use. */
  const switchPolicy = useCallback(
    async (chip: MigrationPolicyChip) => {
      if (!engine || !chip.available || switching) return
      setSwitching(true)
      try {
        const yaml = await fetch(`/kmip-policies/${chip.file}`).then((r) => r.text())
        const res = engine.loadPolicy(yaml)
        if (res.ok) {
          setActivePolicy(engine.policyStatus().name ?? chip.name)
          setKeystoreBump((n) => n + 1)
        }
      } finally {
        setSwitching(false)
      }
    },
    [engine, switching],
  )

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
          const active = activePolicy === p.name
          return (
            <Button
              key={p.name}
              variant="ghost"
              size="sm"
              role="radio"
              aria-checked={active}
              disabled={!p.available || switching}
              title={p.blurb}
              onClick={() => switchPolicy(p)}
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
          — switch, then exercise an at-risk key (Encrypt / Sign / Establish) to migrate it.
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

      {/* ── Migration map — label → algorithm per mode ────────────────────── */}
      <MigrationMap activePolicy={activePolicy} />

      {/* ── Section 1 · classical estate ──────────────────────────────────── */}
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3" data-tour="migration-estate">
        {MIGRATION_KEYS.map((k) => (
          <MigrationKeyCard
            key={k.id}
            config={k}
            engine={engine}
            onKeystoreChange={onKeystoreChange}
            onOpLog={onOpLog}
            epoch={epoch}
          />
        ))}
      </div>

      {/* ── Keystore inspector — the REAL KMIP objects on this tab's engine ── */}
      <MigrationKeystore engine={engine} bump={keystoreBump} />

      {/* ── Per-mode KMIP audit logs (collapsible) ─────────────────────────── */}
      <MigrationLogs logs={logs} onClear={() => setLogs({ classical: [], hybrid: [], pqc: [] })} />
    </div>
  )
}

/** One KMIP operation's audit trail, tagged with the key it touched. */
interface LogEntry {
  op: string
  keyLabel: string
  ok: boolean
  message: string | null
  events: AuditEvent[]
}

/** Three collapsible KMIP logs — one per policy mode. Each groups the audit
 * events of every operation run while that policy was active, so you can read
 * exactly what the engine did under Classical vs Hybrid vs Full PQC. */
function MigrationLogs({
  logs,
  onClear,
}: {
  logs: Record<'classical' | 'hybrid' | 'pqc', LogEntry[]>
  onClear: () => void
}) {
  const total = logs.classical.length + logs.hybrid.length + logs.pqc.length
  const PLANE: Record<string, string> = { p1: 'policy', p2: 'kmip', p3: 'pkcs11' }
  const sections: { mode: 'classical' | 'hybrid' | 'pqc'; label: string }[] = [
    { mode: 'classical', label: 'Classical' },
    { mode: 'hybrid', label: 'Hybrid' },
    { mode: 'pqc', label: 'Full PQC' },
  ]
  return (
    <div className="rounded-xl border border-border bg-card p-4" data-testid="migration-logs">
      <div className="mb-2 flex items-center gap-2">
        <h4 className="text-sm font-semibold text-primary">KMIP logs by mode</h4>
        <span className="text-[11px] text-muted-foreground">
          — every operation's engine audit trail, grouped by the policy active when it ran
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="ml-auto h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      </div>
      <div className="space-y-2">
        {sections.map(({ mode, label }) => {
          const entries = logs[mode]
          return (
            <details
              key={mode}
              className="rounded-lg border border-border bg-background"
              data-testid={`migration-log-${mode}`}
            >
              <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium">
                {label}
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  {entries.length} operation{entries.length === 1 ? '' : 's'}
                </span>
              </summary>
              {entries.length > 0 && (
                <ol className="space-y-1.5 px-3 pb-3 pt-1">
                  {entries.map((e, i) => (
                    <li key={i} className="rounded border border-border/60 bg-card p-2 text-[11px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-semibold text-foreground">{e.op}</span>
                        <span className="text-muted-foreground">{e.keyLabel}</span>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[9.5px] font-semibold',
                            e.ok
                              ? 'bg-status-success/15 text-status-success'
                              : 'bg-status-error/15 text-status-error',
                          )}
                        >
                          {e.ok ? 'OK' : 'refused'}
                        </span>
                        {!e.ok && e.message && (
                          <span className="text-[10.5px] text-status-error">{e.message}</span>
                        )}
                      </div>
                      {e.events.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px] text-muted-foreground">
                          {e.events.map((ev, j) => (
                            <span
                              key={j}
                              className="rounded bg-muted px-1 py-0.5"
                              title={JSON.stringify(ev.event)}
                            >
                              {PLANE[ev.plane] ?? ev.plane}:{String(ev.event.type ?? '?')}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </details>
          )
        })}
      </div>
    </div>
  )
}

/** Static reference: which key label serves which operation, and what each
 * policy resolves it to. The column matching the active policy is highlighted
 * so it's obvious which algorithm is in force per label right now. */
function MigrationMap({ activePolicy }: { activePolicy: string | null }) {
  const mode =
    activePolicy === 'migration-pqc'
      ? 'pqc'
      : activePolicy === 'migration-hybrid'
        ? 'hybrid'
        : 'classical'
  const col = (m: string) =>
    cn('py-1.5 px-3 font-mono', mode === m && 'bg-primary/10 font-semibold text-primary')
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
      <h4 className="mb-2 text-sm font-semibold text-primary">
        Migration map — which label, which operation, which algorithm per mode
      </h4>
      <table className="w-full min-w-[720px] text-left text-[11px]">
        <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-1.5 px-3 font-medium">Key label</th>
            <th className="py-1.5 px-3 font-medium">Operation</th>
            <th className={cn('py-1.5 px-3 font-medium', mode === 'classical' && 'text-primary')}>
              Classical
            </th>
            <th className={cn('py-1.5 px-3 font-medium', mode === 'hybrid' && 'text-primary')}>
              Hybrid
            </th>
            <th className={cn('py-1.5 px-3 font-medium', mode === 'pqc' && 'text-primary')}>
              Full PQC
            </th>
          </tr>
        </thead>
        <tbody>
          {MIGRATION_KEYS.map((k) => (
            <tr key={k.id} className="border-b border-border/50">
              <td className="py-1.5 px-3 font-mono font-medium">{k.defaultLabel}</td>
              <td className="py-1.5 px-3 text-muted-foreground">{k.operation}</td>
              <td className={col('classical')}>{k.classicalAlgorithm}</td>
              <td className={col('hybrid')}>{k.hybridAlgorithm}</td>
              <td className={col('pqc')}>{k.pqcAlgorithm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Live table of every KMIP object on the Migration tab's dedicated engine
 * instance. This is where a rekey becomes visible: the old key flips to
 * `Deactivated` and a fresh `Active` successor appears under the SAME label
 * but a quantum-safe algorithm. (The other playground tabs run a different
 * engine instance, so they don't show these objects.) */
function MigrationKeystore({ engine, bump }: { engine: KmipEngine; bump: number }) {
  const objects = useMemo(() => {
    void bump
    return engine
      .listObjects()
      .filter((o) => o.objectType !== 'SecretData')
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '') || a.objectType.localeCompare(b.objectType))
  }, [engine, bump])

  const byUid = useMemo(() => new Map(objects.map((o) => [o.uid, o])), [objects])
  const shortUid = (uid: string) => uid.replace(/^urn:pqctoday:obj:/, '').slice(0, 8)

  if (objects.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4" data-testid="migration-keystore">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
        <Boxes size={15} /> Key objects on this engine
        <span className="text-[11px] font-normal text-muted-foreground">
          — {objects.length} objects; deactivated rows are superseded predecessors, linked to their
          rekeyed successor
        </span>
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[11px]">
          <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-1.5 pr-3 font-medium">Label</th>
              <th className="py-1.5 pr-3 font-medium">UID</th>
              <th className="py-1.5 pr-3 font-medium">Type</th>
              <th className="py-1.5 pr-3 font-medium">Algorithm</th>
              <th className="py-1.5 pr-3 font-medium">Bits</th>
              <th className="py-1.5 pr-3 font-medium">State</th>
              <th className="py-1.5 pr-3 font-medium">Quantum</th>
              <th className="py-1.5 pr-3 font-medium">Rekey lineage</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {objects.map((o) => {
              const superseded = o.state === 'Deactivated'
              const successor = o.supersedes ? byUid.get(o.supersedes) : undefined
              return (
                <tr
                  key={o.uid}
                  className={cn('border-b border-border/50', superseded && 'opacity-60')}
                  data-testid={`migration-obj-${o.name ?? o.uid}-${o.objectType}`}
                >
                  <td className="py-1.5 pr-3 font-sans">{o.name ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{shortUid(o.uid)}…</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{o.objectType}</td>
                  <td className="py-1.5 pr-3 font-semibold text-foreground">{o.algorithm}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{o.length || '—'}</td>
                  <td className="py-1.5 pr-3">
                    <span className={cn(superseded ? 'text-muted-foreground' : 'text-foreground')}>
                      {o.state}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3">
                    {o.quantumSafe ? (
                      <span className="inline-flex items-center gap-1 text-status-success">
                        <ShieldCheck size={11} /> safe
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-status-error">
                        <ShieldAlert size={11} /> at risk
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3">
                    {o.supersedes ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <ArrowRightLeft size={10} /> superseded by {shortUid(o.supersedes)}…
                        {successor ? ` (${successor.algorithm})` : ''}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
