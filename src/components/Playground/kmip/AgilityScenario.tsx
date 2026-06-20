// SPDX-License-Identifier: GPL-3.0-only
//
// AgilityScenario — the headline demo: ONE unchanged operation ("create a
// signing key", "let the policy decide") resolves to a classical algorithm under
// one policy and a PQC algorithm under another, with zero code change. Then an
// existing classical key, signed under a PQC policy, is flagged for migration
// (rekey). This is the thing KMIP alone can't do — the agility control plane.
import { useState } from 'react'
import { Wand2, Loader2, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type KmipEngine, type PolicyDecision, decisionOf } from '@/wasm/kmip/kmipEngine'

interface Step {
  title: string
  policy: string
  op?: string
  decision?: PolicyDecision
  detail: string
  ok: boolean
  highlight?: boolean
}

const decisionTone: Record<PolicyDecision['kind'], string> = {
  Allow: 'bg-status-success/15 text-status-success',
  Rekey: 'bg-status-warning/15 text-status-warning',
  Deny: 'bg-destructive/15 text-destructive',
  Unknown: 'bg-muted text-muted-foreground',
}

export function AgilityScenario({
  engine,
  busy,
  onBusyChange,
  onChanged,
}: {
  engine: KmipEngine
  /** True while a manual op is running elsewhere on the page — disables the
   * scenario button so the two drivers can't hit the engine at once. */
  busy: boolean
  /** Report the scenario's own running state up, so the parent disables the
   * manual controls while the scenario plays. */
  onBusyChange: (running: boolean) => void
  onChanged: () => void
}) {
  const [steps, setSteps] = useState<Step[]>([])
  const [running, setRunning] = useState(false)
  const [resolved, setResolved] = useState<{ classical?: string; pqc?: string }>({})

  const activate = async (file: string) => {
    const yaml = await fetch(`/kmip-policies/${file}`).then((r) => r.text())
    engine.loadPolicy(yaml)
  }
  const tick = () => new Promise((r) => setTimeout(r, 120))

  const runScenario = async () => {
    setRunning(true)
    onBusyChange(true)
    setSteps([])
    setResolved({})
    const out: Step[] = []
    const push = async (s: Step) => {
      out.push(s)
      setSteps([...out])
      await tick()
    }
    try {
      await activate('classical.yaml')
      await push({
        title: 'Activate the Classical policy',
        policy: 'classical',
        detail: 'Pre-PQC baseline — classical defaults.',
        ok: true,
      })

      const c1 = engine.runOp({ op: 'CreateKeyPair', intent: 'sign' })
      const d1 = decisionOf(c1)
      const priv1 = String(c1.summary.privateKeyUid ?? '')
      const pub1 = String(c1.summary.publicKeyUid ?? '')
      setResolved((r) => ({ ...r, classical: d1.algorithm }))
      await push({
        title: 'Create a signing key — "let the policy decide"',
        policy: 'classical',
        op: 'CreateKeyPair',
        decision: d1,
        detail: `Policy resolved the algorithm → ${d1.algorithm ?? '?'}`,
        ok: c1.ok,
      })

      engine.runOp({ op: 'Activate', uid: priv1 })
      engine.runOp({ op: 'Activate', uid: pub1 })
      const s1 = engine.runOp({ op: 'Sign', uid: priv1, text: 'agility demo' })
      await push({
        title: 'Sign a document',
        policy: 'classical',
        op: 'Sign',
        detail: `${Number(s1.summary.signatureLen) || 0}-byte classical signature`,
        ok: s1.ok,
      })

      await activate('pqc.yaml')
      await push({
        title: 'Flip to the PQC policy — application code is UNCHANGED',
        policy: 'pqc',
        detail: 'Every call below is identical to the ones above.',
        ok: true,
        highlight: true,
      })

      const c2 = engine.runOp({ op: 'CreateKeyPair', intent: 'sign' })
      const d2 = decisionOf(c2)
      setResolved((r) => ({ ...r, pqc: d2.algorithm }))
      await push({
        title: 'Create a signing key — the exact same call',
        policy: 'pqc',
        op: 'CreateKeyPair',
        decision: d2,
        detail: `Policy resolved the algorithm → ${d2.algorithm ?? '?'}`,
        ok: c2.ok,
        highlight: true,
      })

      // Re-sign the OLD classical key — still under the canonical pqc.yaml. The
      // engine substitutes ECDSA-P256 → ML-DSA-87 and runs the transparent
      // auto-rekey transaction: a new PQC key is generated, the old one is
      // deactivated + superseded, and the signature comes back under ML-DSA-87.
      const s2 = engine.runOp({ op: 'Sign', uid: priv1, text: 'agility demo' })
      const d3 = decisionOf(s2)
      // Only claim a migration when the engine actually returned a Rekey
      // decision — a plain Allow (substitution didn't fire) must NOT be dressed
      // up as "migrated → superseded". The target algorithm is the engine's own
      // `d3.algorithm`, never a hardcoded guess.
      const migrated = d3.kind === 'Rekey'
      const sigLen = Number(s2.summary?.signatureLen) || 0
      await push({
        title: migrated
          ? 'Sign the OLD classical key — engine auto-migrates it'
          : 'Sign the OLD classical key under the PQC policy',
        policy: 'pqc',
        op: 'Sign',
        decision: d3,
        detail: !s2.ok
          ? (s2.message ?? 'policy refused the operation')
          : migrated
            ? `transparently migrated → ${d3.algorithm ?? '?'}: ${sigLen}-byte PQC signature; old key deactivated + superseded`
            : `re-signed${d3.algorithm ? ` → ${d3.algorithm}` : ''} (no migration fired): ${sigLen}-byte signature`,
        ok: s2.ok,
        highlight: true,
      })

      onChanged()
    } catch (e) {
      // A wasm panic surfaces as a thrown JS Error (or a JSON.parse failure on a
      // malformed return) — surface it as a failed step instead of leaving the
      // sequence silently half-finished.
      out.push({
        title: 'Scenario aborted — engine error',
        policy: '—',
        detail: e instanceof Error ? e.message : String(e),
        ok: false,
      })
      setSteps([...out])
    } finally {
      setRunning(false)
      onBusyChange(false)
    }
  }

  return (
    <section className="rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2 text-foreground">
            <Wand2 size={16} className="text-primary" /> Watch crypto agility happen
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            One unchanged operation. Two policies. The algorithm migrates classical → post-quantum —
            driven entirely by policy.
          </p>
        </div>
        <Button onClick={runScenario} disabled={running || busy} className="gap-1.5">
          {running ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Run the
          agility scenario
        </Button>
      </div>

      {/* The payoff: same call, two algorithms */}
      {(resolved.classical || resolved.pqc) && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
          <ShieldCheck size={16} className="text-primary shrink-0" />
          <span className="text-muted-foreground">Same call</span>
          <code className="text-foreground">CreateKeyPair (signing)</code>
          <span className="font-mono text-foreground">{resolved.classical ?? '…'}</span>
          <ArrowRight size={14} className="text-primary" />
          <span className="font-mono text-status-success font-semibold">{resolved.pqc ?? '…'}</span>
          <span className="text-xs text-muted-foreground ml-auto">zero code change</span>
        </div>
      )}

      {steps.length > 0 && (
        <ol className="mt-3 space-y-1.5">
          {steps.map((s, i) => (
            <li
              key={i}
              className={`flex items-start gap-2 rounded-md border p-2 ${
                s.highlight ? 'border-primary/40 bg-primary/[0.04]' : 'border-border'
              }`}
            >
              {s.ok ? (
                <CheckCircle2 size={15} className="text-status-success mt-0.5 shrink-0" />
              ) : s.decision?.kind === 'Rekey' ? (
                <ArrowRight size={15} className="text-status-warning mt-0.5 shrink-0" />
              ) : (
                <XCircle size={15} className="text-destructive mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-foreground">{s.title}</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-muted text-muted-foreground">
                    {s.policy}
                  </span>
                  {s.decision && s.decision.kind !== 'Unknown' && (
                    <span
                      className={`text-[10px] px-1.5 rounded font-semibold ${decisionTone[s.decision.kind]}`}
                    >
                      {s.decision.kind}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground break-all">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
