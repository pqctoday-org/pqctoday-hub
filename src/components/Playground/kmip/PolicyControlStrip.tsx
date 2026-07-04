// SPDX-License-Identifier: GPL-3.0-only
//
// PolicyControlStrip — the persistent "brain" of the CACP playground. The active
// policy is the one decision that drives every operation below it, so it lives in
// a sticky strip at the top rather than buried in a column: one-click policy
// chips, the plain-English defaults the policy resolves to, an inline dry-run
// tester, and (Expert) the full rule breakdown. Flip the policy here and nothing
// else on the page changes — that's the agility story made visible.
import { Diamond } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KmipEngine, PolicyStatus } from '@/wasm/kmip/kmipEngine'
import { POLICY_PRESETS, type PolicyPreset } from '@/wasm/kmip/kmipMeta'
import { PolicyRulesView } from './PolicyRulesView'
import { PolicyTester } from './PolicyTester'

/** Is this resolved algorithm name a post-quantum one? Drives the green/blue
 * colouring of the resolved-default values. Classical = ECDSA / RSA / ECDH / AES. */
const isPqc = (algo?: string | null): boolean =>
  !!algo && /^(ML-|SLH-|FN-|Falcon|HQC|BIKE|Classic)/i.test(algo)

/** Match the active engine policy to a preset, honouring the same alias the main
 * view uses (the built-in permissive policy reports as `built-in-permissive`). */
const isActive = (p: PolicyPreset, policy: PolicyStatus): boolean =>
  policy.name === p.name ||
  (p.name === 'training-permissive' && policy.name === 'built-in-permissive')

/** One resolved default ("Signing default → ML-DSA-87"). */
function DefaultCard({ label, algo }: { label: string; algo?: string | null }) {
  return (
    <div className="min-w-[140px] flex-1 rounded-lg border border-border bg-background/50 px-2.5 py-2">
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label} →
      </p>
      <p
        className={`mt-0.5 font-mono text-[13px] font-semibold ${
          algo
            ? isPqc(algo)
              ? 'text-status-success'
              : 'text-status-info'
            : 'text-muted-foreground'
        }`}
      >
        {algo ?? '—'}
      </p>
    </div>
  )
}

export function PolicyControlStrip({
  engine,
  policy,
  policyYaml,
  busy,
  expert,
  onLoadPolicy,
  onOpenLibrary,
}: {
  engine: KmipEngine
  policy: PolicyStatus
  policyYaml: string | null
  busy: boolean
  expert: boolean
  onLoadPolicy: (preset: PolicyPreset) => void
  /** Switch to the dedicated Policy view (the full catalog + visualisation). */
  onOpenLibrary?: () => void
}) {
  // The signing + key-exchange algorithm the *active* policy resolves to, derived
  // by dry-running the two "let the policy decide" creates (no objects created,
  // no store mutation). Computed inline: dry_run is a cheap synchronous read of
  // current engine policy state, so it always reflects the live active policy
  // without a memo/effect to keep in sync. `policy` is referenced so the
  // dependency is explicit to readers even though dry_run reads engine state.
  const resolveDefault = (op: string): string | null => {
    void policy.fingerprint
    try {
      const r = engine.dryRun({ op })
      return r.kind === 'Deny' ? null : (r.algorithm ?? null)
    } catch {
      return null
    }
  }
  const defaults = {
    sign: resolveDefault('CreateKeyPair:Sign'),
    kem: resolveDefault('CreateKeyPair:KeyAgreement'),
  }

  const activePreset = POLICY_PRESETS.find((p) => isActive(p, policy))

  return (
    <section className="sticky top-0 z-10 mb-4 rounded-xl border border-status-warning/30 bg-status-warning/[0.04] p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Diamond size={15} className="text-status-warning shrink-0" fill="currentColor" />
        <h3 className="text-sm font-bold text-status-warning">Plane 1 · Active Policy</h3>
        <span className="text-[11.5px] text-muted-foreground">
          — the one decision that drives every operation below. Flip it; nothing else changes.
        </span>
      </div>

      {/* Policy chips — a curated quick-switch set (the full catalog lives in the
          Policy view). Always include the active policy even if not featured. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {POLICY_PRESETS.filter((p) => p.featured || isActive(p, policy)).map((p) => {
          const active = isActive(p, policy)
          return (
            <Button
              key={p.file}
              variant="ghost"
              disabled={busy}
              onClick={() => onLoadPolicy(p)}
              title={p.blurb}
              data-tour={`policy-chip-${p.file}`}
              className={`h-auto gap-2 rounded-lg border px-3 py-2 ${
                active
                  ? 'border-status-warning/60 bg-status-warning/10'
                  : 'border-border bg-background/40 hover:border-status-warning/40'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  active ? 'bg-status-warning shadow-glow' : 'bg-muted-foreground/60'
                }`}
              />
              <span className="text-[12.5px] font-semibold text-foreground">{p.label}</span>
              {active && (
                <span className="text-[9px] font-bold uppercase tracking-wide text-status-warning">
                  active
                </span>
              )}
            </Button>
          )
        })}
        {onOpenLibrary && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={onOpenLibrary}
            className="h-auto gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:border-primary/40"
          >
            All {POLICY_PRESETS.length} policies →
          </Button>
        )}
      </div>

      {/* Detail row: active-policy panel + inline dry-run tester */}
      <div className="mt-3 flex flex-wrap gap-3">
        <div className="min-w-[300px] flex-1 rounded-xl border border-border bg-background/40 p-3">
          <p className="text-[12.5px] text-foreground">
            {activePreset?.blurb ??
              'Built-in permissive — allows everything. Pick a policy to constrain the engine.'}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <DefaultCard label="Signing default" algo={defaults.sign} />
            <DefaultCard label="Key-exchange default" algo={defaults.kem} />
            <div className="min-w-[80px] rounded-lg border border-border bg-background/50 px-2.5 py-2 text-center">
              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                Rules
              </p>
              <p className="mt-0.5 text-[15px] font-bold text-foreground">
                {typeof policy.rules === 'number' ? policy.rules : '—'}
              </p>
            </div>
          </div>
        </div>
        <div className="w-full sm:w-[320px]">
          <PolicyTester engine={engine} />
        </div>
      </div>

      {/* Expert: the full per-rule breakdown + raw YAML, tucked away by default. */}
      {expert && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground">
            What this policy enforces (rule-by-rule)
          </summary>
          <PolicyRulesView yaml={policyYaml} />
        </details>
      )}
    </section>
  )
}
