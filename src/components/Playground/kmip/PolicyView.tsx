// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- index keys are typed
   `PolicyTone` / `Disposition` enum values and known preset file names, never
   user input. */
//
// PolicyView — the dedicated Policy screen. Left: the full catalog of crypto
// policies grouped by what they illustrate (selecting one activates it in the
// engine). Right: a visual breakdown of the active policy — resolved defaults
// (authoritative, from the engine's dry-run), an algorithm-disposition matrix,
// every rule colour-coded by family, a temporal timeline, and the raw YAML.
import { useEffect, useMemo, useState } from 'react'
import {
  Library,
  ShieldCheck,
  FlaskConical,
  CalendarClock,
  Grid3x3,
  List as ListIcon,
  Workflow,
  Code2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KmipEngine, PolicyStatus } from '@/wasm/kmip/kmipEngine'
import {
  POLICY_PRESETS,
  POLICY_CATEGORIES,
  type PolicyPreset,
  type PolicyTone,
} from '@/wasm/kmip/kmipMeta'
import {
  parsePolicyModel,
  temporalRules,
  dispositionOf,
  type PolicyModel,
  type Disposition,
} from './policyModel'
import { PolicyRulesDisplay, PolicyRulesLegend } from './PolicyRulesDisplay'
import { PolicyTimeline } from './PolicyTimeline'
import { PolicyGraphView } from './visual/PolicyGraphView'

/** Tone → dot colour for catalog chips. */
const TONE_DOT: Record<PolicyTone, string> = {
  permissive: 'bg-muted-foreground',
  classical: 'bg-status-info',
  pqc: 'bg-status-success',
  compliance: 'bg-primary',
  regional: 'bg-status-warning',
  hybrid: 'bg-status-success',
  migration: 'bg-status-warning',
  mechanism: 'bg-primary',
}

/** Match the active engine policy to a preset (built-in permissive aliases the
 * training-permissive preset). */
const isActive = (p: PolicyPreset, policy: PolicyStatus): boolean =>
  policy.name === p.name ||
  (p.name === 'training-permissive' && policy.name === 'built-in-permissive')

// Algorithms shown in the disposition matrix — PQC + classical, for contrast.
const MATRIX_ALGOS = [
  'ML-DSA-87',
  'ML-DSA-65',
  'ML-KEM-1024',
  'ML-KEM-768',
  'SLH-DSA-SHA2-256s',
  'FrodoKEM-1344',
  'Classic-McEliece-6688128',
  'AES-256',
  'RSA',
  'ECDSA-P256',
  'ECDSA-P384',
  'Ed25519',
  'ECDH-P256',
  'SHA-256',
  'SHA-1',
  '3DES',
]

const DISPOSITION_STYLE: Record<Disposition, { cls: string; label: string }> = {
  default: {
    cls: 'border-status-success/60 bg-status-success/15 text-status-success',
    label: 'default',
  },
  'rekey-to': {
    cls: 'border-status-success/50 bg-status-success/10 text-status-success',
    label: 'rekey →',
  },
  allowed: { cls: 'border-status-info/50 bg-status-info/10 text-status-info', label: 'allowed' },
  'rekey-from': {
    cls: 'border-status-warning/50 bg-status-warning/10 text-status-warning',
    label: '→ migrated',
  },
  denied: { cls: 'border-destructive/50 bg-destructive/10 text-destructive', label: 'denied' },
  neutral: { cls: 'border-border bg-muted/30 text-muted-foreground', label: '—' },
}

function DefaultPill({ label, algo }: { label: string; algo: string | null }) {
  const pqc = !!algo && /^(ML-|SLH-|FN-|Falcon|HQC|BIKE|Frodo|Classic)/i.test(algo)
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label} →
      </p>
      <p
        className={cn(
          'mt-0.5 font-mono text-sm font-semibold',
          algo ? (pqc ? 'text-status-success' : 'text-status-info') : 'text-muted-foreground'
        )}
      >
        {algo ?? 'denied'}
      </p>
    </div>
  )
}

type DetailTab = 'list' | 'visual' | 'timeline' | 'yaml'

export function PolicyView({
  engine,
  policy,
  policyYaml,
  busy,
  expert,
  onLoadPolicy,
  onApplyYaml,
}: {
  engine: KmipEngine
  policy: PolicyStatus
  policyYaml: string | null
  busy: boolean
  expert: boolean
  onLoadPolicy: (preset: PolicyPreset) => void
  onApplyYaml: (yaml: string) => { ok: boolean; warnings?: string[]; error?: string } | undefined
}) {
  const [models, setModels] = useState<Record<string, PolicyModel>>({})
  const [detailTab, setDetailTab] = useState<DetailTab>('list')

  // Fetch + parse every preset once, so each catalog card can show a rule count
  // and the detail panel can render without a per-selection round trip.
  useEffect(() => {
    let alive = true
    Promise.all(
      POLICY_PRESETS.map((p) =>
        fetch(`/kmip-policies/${p.file}`)
          .then((r) => (r.ok ? r.text() : ''))
          .catch(() => '')
          .then((txt) => [p.file, txt] as const)
      )
    ).then((entries) => {
      if (!alive) return
      const next: Record<string, PolicyModel> = {}
      for (const [file, txt] of entries) if (txt) next[file] = parsePolicyModel(txt)
      setModels(next)
    })
    return () => {
      alive = false
    }
  }, [])

  const activePreset = POLICY_PRESETS.find((p) => isActive(p, policy))
  const activeModel = useMemo<PolicyModel | undefined>(() => {
    if (activePreset && models[activePreset.file]) return models[activePreset.file]
    return policyYaml ? parsePolicyModel(policyYaml) : undefined
  }, [activePreset, models, policyYaml])

  // Authoritative resolved defaults — a cheap dry-run of the live engine policy.
  const resolveDefault = (op: string): string | null => {
    void policy.fingerprint
    try {
      const r = engine.dryRun({ op })
      return r.kind === 'Deny' ? null : (r.algorithm ?? null)
    } catch {
      return null
    }
  }
  const signDefault = resolveDefault('CreateKeyPair:Sign')
  const kemDefault = resolveDefault('CreateKeyPair:KeyAgreement')

  const temporal = activeModel ? temporalRules(activeModel) : []
  const visualActive = detailTab === 'visual'

  const tabs: { id: DetailTab; label: string; icon: typeof ListIcon }[] = [
    { id: 'list', label: 'List', icon: ListIcon },
    { id: 'visual', label: 'Visual', icon: Workflow },
    { id: 'timeline', label: 'Timeline', icon: CalendarClock },
    { id: 'yaml', label: 'YAML', icon: Code2 },
  ]

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 items-start',
        !visualActive && 'lg:grid-cols-[300px_1fr]'
      )}
    >
      {/* ── Catalog (hidden in Visual mode — the palette has its own switcher) ─ */}
      <section
        className={cn('rounded-xl border border-border bg-card p-3', visualActive && 'hidden')}
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Library size={15} className="text-primary" /> Policy library
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">
            {POLICY_PRESETS.length}
          </span>
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Selecting a policy activates it — every plane obeys it instantly.
        </p>
        <div className="mt-3 space-y-3">
          {POLICY_CATEGORIES.map((cat) => {
            const presets = POLICY_PRESETS.filter((p) => p.category === cat)
            if (presets.length === 0) return null
            return (
              <div key={cat}>
                <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                  {cat}
                </p>
                <div className="space-y-1">
                  {presets.map((p) => {
                    const on = isActive(p, policy)
                    const ruleCount = models[p.file]?.rules.length
                    return (
                      <Button
                        key={p.file}
                        variant="ghost"
                        disabled={busy}
                        onClick={() => onLoadPolicy(p)}
                        title={p.blurb}
                        className={cn(
                          'h-auto w-full flex-col items-stretch gap-0.5 whitespace-normal rounded-lg border px-2.5 py-2 text-left',
                          on
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-border bg-background/40 hover:border-primary/40'
                        )}
                      >
                        <div className="flex w-full items-center gap-2">
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', TONE_DOT[p.tone])} />
                          <span className="text-[12.5px] font-semibold text-foreground">
                            {p.label}
                          </span>
                          {on && (
                            <span className="text-[8.5px] font-bold uppercase tracking-wide text-primary">
                              active
                            </span>
                          )}
                          {typeof ruleCount === 'number' && (
                            <span className="ml-auto text-[9px] font-mono text-muted-foreground">
                              {ruleCount} rule{ruleCount === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] font-normal leading-snug text-muted-foreground">
                          {p.illustrates}
                        </p>
                      </Button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Detail ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Header */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-foreground">
                {activePreset?.label ?? 'Built-in permissive'}
              </h3>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                {activeModel?.description ??
                  activePreset?.blurb ??
                  'Allows everything — pick a policy from the library to constrain the engine.'}
              </p>
            </div>
            <div className="text-right text-[10px] text-muted-foreground shrink-0">
              {activeModel?.authority && (
                <p>
                  authority{' '}
                  <span className="font-mono text-foreground">{activeModel.authority}</span>
                </p>
              )}
              {activeModel?.effective && (
                <p>
                  effective{' '}
                  <span className="font-mono text-foreground">{activeModel.effective}</span>
                </p>
              )}
            </div>
          </div>

          {/* Compliance chips */}
          {activeModel && activeModel.compliance.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {activeModel.compliance.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] text-foreground"
                >
                  <ShieldCheck size={10} className="text-status-info" />
                  {c.framework}
                  {c.tag && <span className="text-muted-foreground">· {c.tag}</span>}
                </span>
              ))}
            </div>
          )}

          {/* Resolved defaults (authoritative) */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <FlaskConical size={11} /> Resolved defaults
            </span>
            <DefaultPill label="Signing" algo={signDefault} />
            <DefaultPill label="Key exchange" algo={kemDefault} />
            <div className="rounded-lg border border-border bg-background/60 px-3 py-2 text-center">
              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                Rules
              </p>
              <p className="mt-0.5 text-sm font-bold text-foreground">
                {typeof policy.rules === 'number' ? policy.rules : (activeModel?.rules.length ?? 0)}
              </p>
            </div>
          </div>
        </section>

        {/* ── Sub-tab row ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 border-b border-border" role="tablist">
          {tabs.map((t) => {
            const Icon = t.icon
            const on = detailTab === t.id
            return (
              <Button
                key={t.id}
                variant="ghost"
                role="tab"
                aria-selected={on}
                onClick={() => setDetailTab(t.id)}
                className={cn(
                  '-mb-px inline-flex h-auto items-center gap-1.5 rounded-none border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors hover:bg-transparent',
                  on
                    ? 'border-primary font-semibold text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon size={13} />
                {t.label}
              </Button>
            )
          })}
          {visualActive && (
            <span className="ml-auto pr-2 text-[10.5px] text-muted-foreground">
              graph is the source of truth
            </span>
          )}
        </div>

        {/* ── List: disposition matrix + rule cards ─────────────────────── */}
        {detailTab === 'list' && (
          <>
            {activeModel && (
              <section className="rounded-xl border border-border bg-card p-4">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Grid3x3 size={14} className="text-primary" /> Algorithm disposition
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {MATRIX_ALGOS.map((algo) => {
                    const d = dispositionOf(activeModel, algo)
                    const s = DISPOSITION_STYLE[d]
                    return (
                      <div
                        key={algo}
                        className={cn('rounded-md border px-2 py-1', s.cls)}
                        title={`${algo}: ${s.label}`}
                      >
                        <span className="font-mono text-[10.5px] text-foreground">{algo}</span>
                        <span className="ml-1.5 text-[9px] font-semibold">{s.label}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-2 text-[9.5px] text-muted-foreground">
                  Derived from the rules below (ignores per-op scope, time bounds, and attribute
                  exceptions). For the engine's live verdict, use the Visual tab's simulator or the
                  dry-run tester on the Agility tab.
                </p>
              </section>
            )}

            <section className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs font-semibold text-foreground">What this policy enforces</h4>
                {activeModel && <PolicyRulesLegend rules={activeModel.rules} />}
              </div>
              <div className="mt-3">
                <PolicyRulesDisplay rules={activeModel?.rules ?? []} />
              </div>
            </section>
          </>
        )}

        {/* ── Visual: the node-graph editor ─────────────────────────────── */}
        {visualActive && (
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <PolicyGraphView
              key={activePreset?.file ?? '__builtin__'}
              engine={engine}
              initialYaml={policyYaml}
              presetFile={activePreset?.file ?? null}
              guided={!expert}
              onLoadPreset={onLoadPolicy}
              onApplyYaml={onApplyYaml}
            />
          </section>
        )}

        {/* ── Timeline ──────────────────────────────────────────────────── */}
        {detailTab === 'timeline' && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <CalendarClock size={14} className="text-status-warning" /> Timeline — time-bounded
              rules
            </h4>
            <div className="mt-3">
              {temporal.length > 0 ? (
                <PolicyTimeline rules={temporal} />
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  This policy has no time-bounded rules (temporal cutoffs or effective windows).
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── YAML ──────────────────────────────────────────────────────── */}
        {detailTab === 'yaml' && (
          <section className="rounded-xl border border-border bg-card p-4">
            <h4 className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Code2 size={14} className="text-primary" /> Policy source (YAML)
            </h4>
            {policyYaml ? (
              <pre className="mt-2 max-h-[32rem] overflow-auto whitespace-pre rounded border border-border bg-muted/40 p-2 font-mono text-[10.5px] leading-relaxed">
                {policyYaml}
              </pre>
            ) : (
              <p className="mt-2 text-[12px] text-muted-foreground">
                Built-in permissive policy — no source file. Pick a policy from the library.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
