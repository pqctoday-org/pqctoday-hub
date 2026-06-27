// SPDX-License-Identifier: GPL-3.0-only
//
// PolicyScenario — "test the active policy". Runs a battery of representative
// requests through the engine's READ-ONLY dry-run against the currently-active
// policy and shows each decision (Allow / Deny / Rekey). It never creates keys
// and never changes the active policy, so the panel always reflects the selected
// policy and flipping the policy above + re-running is a side-by-side compare.
// (Replaces the old hardcoded classical→PQC demo, which silently overwrote the
// user's policy selection.)
//
// Accuracy note: different policies scope the same algorithm under different op
// names (RSA is denied via `CreateKeyPair` under PQC but via `Create` under
// CNSA), so an algorithm probe tries every creation op-form and reports the
// MOST restrictive verdict.
import { useMemo, useState } from 'react'
import { FlaskConical, Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KmipEngine, DryRunResult } from '@/wasm/kmip/kmipEngine'

type Kind = 'default' | 'algo' | 'existing'
interface Probe {
  id: string
  label: string
  sub: string
  kind: Kind
  op?: string
  currentAlgorithm?: string
  algorithm?: string
  length?: number
  /** algo probes: the creation op-forms to test (most-restrictive wins). */
  ops?: string[]
}

const PROBES: Probe[] = [
  {
    id: 'sign',
    label: 'New signing key',
    sub: 'let the policy choose the algorithm',
    kind: 'default',
    op: 'CreateKeyPair:Sign',
  },
  {
    id: 'kem',
    label: 'New key-exchange key',
    sub: 'let the policy choose the algorithm',
    kind: 'default',
    op: 'CreateKeyPair:KeyAgreement',
  },
  {
    id: 'rsa',
    label: 'A classical RSA-2048 key',
    sub: 'is legacy RSA still allowed?',
    kind: 'algo',
    algorithm: 'RSA',
    length: 2048,
    ops: ['Create', 'CreateKeyPair', 'CreateKeyPair:Sign'],
  },
  {
    id: 'mldsa44',
    label: 'A sub-Level-5 ML-DSA-44 key',
    sub: 'does the policy demand a higher security level?',
    kind: 'algo',
    algorithm: 'ML-DSA-44',
    ops: ['Create', 'CreateKeyPair', 'CreateKeyPair:Sign'],
  },
  {
    id: 'frodo',
    label: 'A FrodoKEM-1344 key',
    sub: 'a conservative KEM some regimes require and others reject',
    kind: 'algo',
    algorithm: 'FrodoKEM-1344',
    ops: ['Create', 'CreateKeyPair', 'CreateKeyPair:KeyAgreement'],
  },
  {
    id: 'legacy',
    label: 'Sign with a legacy ECDSA-P256 key',
    sub: 'allowed as-is, auto-migrated, or refused?',
    kind: 'existing',
    op: 'Sign',
    currentAlgorithm: 'ECDSA-P256',
  },
]

const RANK: Record<string, number> = { Deny: 2, Rekey: 1, Allow: 0 }
const moreRestrictive = (a: DryRunResult | null, b: DryRunResult): DryRunResult =>
  !a || (RANK[b.kind] ?? 0) > (RANK[a.kind] ?? 0) ? b : a

function decide(engine: KmipEngine, p: Probe): DryRunResult {
  try {
    if (p.kind === 'algo' && p.ops) {
      let worst: DryRunResult | null = null
      for (const op of p.ops) {
        worst = moreRestrictive(
          worst,
          engine.dryRun({ op, algorithm: p.algorithm, length: p.length })
        )
      }
      return worst ?? { kind: 'Allow' }
    }
    return engine.dryRun({ op: p.op!, currentAlgorithm: p.currentAlgorithm })
  } catch {
    return { kind: 'Deny', reason: 'engine error' }
  }
}

const TONE: Record<DryRunResult['kind'], { badge: string; text: string }> = {
  Allow: { badge: 'bg-status-success/15 text-status-success', text: 'text-status-success' },
  Rekey: { badge: 'bg-status-warning/15 text-status-warning', text: 'text-status-warning' },
  Deny: { badge: 'bg-destructive/15 text-destructive', text: 'text-destructive' },
}

function detail(d: DryRunResult): string {
  if (d.kind === 'Rekey') return `${d.from} → ${d.to}`
  if (d.kind === 'Deny') return d.reason || d.denyReason || 'denied'
  return d.algorithm ? `→ ${d.algorithm}` : 'allowed'
}

interface Row {
  probe: Probe
  decision: DryRunResult
}

export function PolicyScenario({
  engine,
  policyFingerprint,
  policyLabel,
  busy,
  onBusyChange,
}: {
  engine: KmipEngine
  /** Changes when the active policy changes — re-evaluates the battery. */
  policyFingerprint?: string
  policyLabel: string
  busy: boolean
  onBusyChange: (b: boolean) => void
}) {
  // Always reflect the active policy: the verdicts are a pure function of it, so
  // derive them (no effect/setState) — the panel updates the instant you switch.
  const liveRows = useMemo<Row[]>(() => {
    // `decide` reads live engine policy state; the fingerprint is the recompute
    // trigger (referenced so the dependency is explicit to readers + the linter).
    void policyFingerprint
    return PROBES.map((probe) => ({ probe, decision: decide(engine, probe) }))
  }, [engine, policyFingerprint])
  // The button re-plays the same verdicts with a staggered reveal. A reveal from
  // a previous policy (fingerprint mismatch) collapses to "show all".
  const [reveal, setReveal] = useState<{ fp?: string; n: number } | null>(null)
  const [running, setRunning] = useState(false)
  const rows = reveal && reveal.fp === policyFingerprint ? liveRows.slice(0, reveal.n) : liveRows

  const run = async () => {
    setRunning(true)
    onBusyChange(true)
    for (let n = 0; n <= liveRows.length; n++) {
      setReveal({ fp: policyFingerprint, n })
      await new Promise((r) => setTimeout(r, 110))
    }
    setRunning(false)
    onBusyChange(false)
  }

  const denied = rows.filter((r) => r.decision.kind === 'Deny').length
  const rekeyed = rows.filter((r) => r.decision.kind === 'Rekey').length

  return (
    <section className="rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2 text-foreground">
            <FlaskConical size={16} className="text-primary" /> Test the active policy
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Six representative requests, dry-run against{' '}
            <span className="font-semibold text-foreground">{policyLabel}</span> — no keys are
            created and your selection doesn&apos;t change. Flip the policy above and run again to
            compare.
          </p>
        </div>
        <Button onClick={run} disabled={running || busy} className="gap-1.5">
          {running ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}{' '}
          Run policy test
        </Button>
      </div>

      {rows.length > 0 && (
        <>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="rounded bg-status-success/15 px-1.5 py-0.5 font-semibold text-status-success">
              {rows.filter((r) => r.decision.kind === 'Allow').length} allowed
            </span>
            {rekeyed > 0 && (
              <span className="rounded bg-status-warning/15 px-1.5 py-0.5 font-semibold text-status-warning">
                {rekeyed} auto-migrated
              </span>
            )}
            {denied > 0 && (
              <span className="rounded bg-destructive/15 px-1.5 py-0.5 font-semibold text-destructive">
                {denied} denied
              </span>
            )}
          </div>
          <ol className="mt-2 space-y-1.5">
            {rows.map(({ probe, decision }, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border border-border bg-card p-2"
              >
                {decision.kind === 'Allow' ? (
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-status-success" />
                ) : decision.kind === 'Rekey' ? (
                  <ArrowRight size={15} className="mt-0.5 shrink-0 text-status-warning" />
                ) : (
                  <XCircle size={15} className="mt-0.5 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-foreground">{probe.label}</span>
                    <span
                      className={`rounded px-1.5 text-[10px] font-semibold ${TONE[decision.kind].badge}`}
                    >
                      {decision.kind}
                    </span>
                    <span className={`font-mono text-xs ${TONE[decision.kind].text} break-all`}>
                      {detail(decision)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{probe.sub}</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
