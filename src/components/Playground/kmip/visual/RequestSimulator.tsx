// SPDX-License-Identifier: GPL-3.0-only
//
// RequestSimulator — the Simulate tab. Build a KMIP request, run it, and show
// the AUTHORITATIVE verdict from the WASM engine's dryRun alongside the
// illustrative flow (which the graph animates). Since WP4b the engine's
// dryRun receives the FULL request (date, custom attrs, usage mask, mechanism
// params, key activation date), so temporal/attribute/mechanism rules are
// evaluated authoritatively — the "approximated" banner now signals genuine
// simulator drift, not a known blind spot.
import {
  FlaskConical,
  Play,
  Check,
  ArrowRight,
  Ban,
  Info,
  Waypoints,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DryRunResult, DryRunTraceStep } from '@/wasm/kmip/kmipEngine'
import type { PolicyExample } from '@/wasm/kmip/kmipMeta'
import { FieldLabel, SelectField, TagEditor } from './editorControls'
import {
  KMIP_OPS,
  KEY_STATES,
  ALGO_SUGGESTIONS,
  USAGE_FLAGS,
  HASH_NAMES,
  BLOCK_MODES,
  PADDING_METHODS,
  CKM_SUGGESTIONS,
  RULE_CATALOG,
  isRuleTypeId,
} from './ruleCatalog'
import type { SimRequest } from './policySim'
import type { EditablePolicy, EditableRule } from './policyEditModel'

interface Props {
  req: SimRequest
  onChange: (next: SimRequest) => void
  onRun: () => void
  running: boolean
  guided: boolean
  /** Authoritative engine verdict from dryRun. */
  engineVerdict: DryRunResult | null
  /** True when the illustrative trace's decider disagrees with the engine. */
  approximated: boolean
  /** The edited policy — resolves each trace step's rule index to its title. */
  policy: EditablePolicy
  /** The active preset's worked example, if it has one (A-grade review #16). */
  example?: PolicyExample
  onLoadExample: () => void
}

const kindColor = (kind: string): string =>
  kind === 'Allow'
    ? 'text-status-success'
    : kind === 'Rekey'
      ? 'text-status-warning'
      : 'text-destructive'

/** The engine's per-rule trace is 1-based over the rules it actually saw —
 * ENABLED rules only, in order (disabled ones are serialized as comments, so
 * the engine's index never counts them). Mirrors
 * `PolicyGraphView.tsx::engineTraceToSim`'s indexing exactly. */
const ruleForTraceStep = (policy: EditablePolicy, step: DryRunTraceStep) =>
  policy.rules.filter((r) => r.enabled)[step.index - 1] ?? null

const EFFECT_FALLBACK: Record<string, string> = {
  pass: "checked — doesn't apply to this request",
  skip: 'never reached — an earlier rule in this pass already decided',
  resolve: 'resolved the algorithm',
  deny: 'denied the request',
}

/** Denial → remedy (A-grade review item #17) — name what would satisfy the
 * exact rule that fired, using its own fields, not a generic "denied" dead
 * end. `null` when the rule type has no templated remedy (falls back to the
 * rule's own `reason` text). */
function remedyFor(rule: EditableRule | null): string | null {
  if (!rule) return null
  const algos = rule.lists.algorithms
  switch (rule.type) {
    case 'algorithm_denylist':
      return `Pick an algorithm this rule doesn't deny${algos?.length ? ` (it denies: ${algos.join(', ')})` : ''}, or disable/edit this rule.`
    case 'algorithm_allowlist':
      return `Pick one of this rule's allowed algorithms${algos?.length ? `: ${algos.join(', ')}` : ''}.`
    case 'require_usage_mask':
      return `Declare the required usage-mask flag(s) on the key: ${rule.lists.flags?.join(' + ') || '?'}.`
    case 'require_custom_attribute':
      return `Add the custom attribute x-${rule.scalars.attribute_name ?? '?'} to the request.`
    case 'min_key_length':
      return `Use a key of at least ${rule.scalars.min_bits ?? '?'} bits.`
    case 'temporal_cutoff':
      return `This algorithm class is cut off${rule.scalars.after ? ` after ${rule.scalars.after}` : ''} — move the as-of date earlier, or switch to a PQC algorithm.`
    case 'lifecycle_state_gate':
      return `The key must be in one of these states: ${rule.lists.allowed_states?.join(', ') ?? 'Active'}.`
    case 'hybrid_dual_sign_requirement':
      return `Use the composite ${rule.scalars.primary ?? '?'} + ${rule.scalars.secondary ?? '?'} signature during this window.`
    case 'mechanism_denylist':
      return `Pick a mechanism this rule doesn't deny${rule.lists.mechanisms?.length ? ` (it denies: ${rule.lists.mechanisms.join(', ')})` : ''}.`
    case 'mechanism_parameter_constraint':
      return rule.lists.allowed_block_cipher_modes?.length
        ? `Use an allowed block cipher mode: ${rule.lists.allowed_block_cipher_modes.join(', ')}.`
        : rule.lists.allowed_padding_methods?.length
          ? `Use an allowed padding method: ${rule.lists.allowed_padding_methods.join(', ')}.`
          : null
    case 'hash_algorithm_allowlist':
      return `Use one of the allowed hash algorithms: ${rule.lists.hashing_algorithms?.join(', ') ?? '?'}.`
    case 'mac_mechanism_policy':
      return `Use one of the allowed MAC algorithms: ${rule.lists.mac_algorithms?.join(', ') ?? '?'}.`
    default:
      return rule.scalars.reason ? `The rule's own reason: "${rule.scalars.reason}"` : null
  }
}

export function RequestSimulator({
  req,
  onChange,
  onRun,
  running,
  guided,
  engineVerdict,
  policy,
  approximated,
  example,
  onLoadExample,
}: Props) {
  const patch = <K extends keyof SimRequest>(key: K, value: SimRequest[K]) =>
    onChange({ ...req, [key]: value })
  const denyStep =
    engineVerdict?.kind === 'Deny'
      ? engineVerdict.trace?.find((s) => s.effect === 'deny')
      : undefined
  const remedy =
    engineVerdict?.kind === 'Deny'
      ? remedyFor(denyStep ? ruleForTraceStep(policy, denyStep) : null)
      : null

  return (
    <div className="space-y-3 p-3.5">
      <div className="flex items-center gap-2">
        <FlaskConical size={15} className="text-primary" />
        <span className="text-[12.5px] font-semibold text-foreground">Simulate a request</span>
        {example && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadExample}
            className="ml-auto h-6 gap-1 px-2 text-[10.5px] text-primary hover:text-primary"
          >
            <Sparkles size={11} /> Load this policy's example
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <FieldLabel>operation</FieldLabel>
          <SelectField
            value={req.op}
            options={KMIP_OPS}
            onChange={(v) => patch('op', v)}
            ariaLabel="operation"
          />
        </div>
        <div>
          <FieldLabel>key state</FieldLabel>
          <SelectField
            value={req.keyState}
            options={KEY_STATES}
            onChange={(v) => patch('keyState', v)}
            ariaLabel="key state"
          />
        </div>
      </div>

      <div>
        <FieldLabel>algorithm on the key</FieldLabel>
        <TagEditor
          value={req.algorithm ? [req.algorithm] : []}
          suggestions={ALGO_SUGGESTIONS}
          onChange={(v) => patch('algorithm', v[v.length - 1] ?? '')}
          placeholder="algorithm…"
        />
      </div>

      <div>
        <FieldLabel>key name (label) — drives name_pattern rules</FieldLabel>
        <input
          type="text"
          value={req.keyName}
          onChange={(e) => patch('keyName', e.target.value)}
          placeholder="e.g. payments-db-cipher (leave empty for unnamed)"
          className="w-full rounded-lg border border-input bg-background/40 px-2 py-1.5 font-mono text-[12px] text-foreground outline-none focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <FieldLabel>request date</FieldLabel>
          <input
            type="date"
            value={/^\d{4}-\d{2}-\d{2}$/.test(req.date) ? req.date : ''}
            onChange={(e) => patch('date', e.target.value)}
            className="w-full rounded-lg border border-input bg-background/40 px-2 py-1.5 font-mono text-[12px] text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <FieldLabel>key bits</FieldLabel>
          <input
            type="number"
            value={req.bits}
            onChange={(e) => patch('bits', e.target.value)}
            placeholder="e.g. 2048"
            className="w-full rounded-lg border border-input bg-background/40 px-2 py-1.5 font-mono text-[12px] text-foreground outline-none focus:border-primary"
          />
        </div>
      </div>

      {!guided && (
        <>
          <div>
            <FieldLabel>custom attributes (name or name=value)</FieldLabel>
            <TagEditor
              value={req.attrs}
              suggestions={['x-pqctoday-purpose=research', 'x-pqctoday-assurance=high']}
              onChange={(v) => patch('attrs', v)}
              placeholder="x-attr or x-attr=value…"
            />
          </div>
          <div>
            <FieldLabel>usage-mask flags on the key</FieldLabel>
            <TagEditor
              value={req.usageFlags}
              suggestions={USAGE_FLAGS}
              onChange={(v) => patch('usageFlags', v)}
              placeholder="Sign / Verify / KeyAgreement…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <FieldLabel>hash (Sign/Verify)</FieldLabel>
              <TagEditor
                value={req.hash ? [req.hash] : []}
                suggestions={HASH_NAMES}
                onChange={(v) => patch('hash', v[v.length - 1] ?? '')}
                placeholder="SHA-256…"
              />
            </div>
            <div>
              <FieldLabel>CKM mechanism</FieldLabel>
              <TagEditor
                value={req.mechanism ? [req.mechanism] : []}
                suggestions={CKM_SUGGESTIONS}
                onChange={(v) => patch('mechanism', v[v.length - 1] ?? '')}
                placeholder="CKM_AES_GCM…"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <FieldLabel>block mode</FieldLabel>
              <SelectField
                value={req.blockMode}
                options={['', ...BLOCK_MODES]}
                onChange={(v) => patch('blockMode', v)}
                ariaLabel="block mode"
              />
            </div>
            <div>
              <FieldLabel>padding</FieldLabel>
              <SelectField
                value={req.padding}
                options={['', ...PADDING_METHODS]}
                onChange={(v) => patch('padding', v)}
                ariaLabel="padding"
              />
            </div>
            <div>
              <FieldLabel>deterministic</FieldLabel>
              <SelectField
                value={req.deterministic}
                options={['', 'true', 'false']}
                onChange={(v) => patch('deterministic', v as SimRequest['deterministic'])}
                ariaLabel="deterministic"
              />
            </div>
          </div>
          <div>
            <FieldLabel>key activated on (for key-age rules)</FieldLabel>
            <input
              type="date"
              value={/^\d{4}-\d{2}-\d{2}$/.test(req.keyActivatedOn) ? req.keyActivatedOn : ''}
              onChange={(e) => patch('keyActivatedOn', e.target.value)}
              className="w-full rounded-lg border border-input bg-background/40 px-2 py-1.5 font-mono text-[12px] text-foreground outline-none focus:border-primary"
            />
          </div>
        </>
      )}

      <Button
        variant="gradient"
        className="w-full gap-1.5"
        onClick={onRun}
        disabled={running}
        data-tour="run-simulate-btn"
      >
        <Play size={14} /> {running ? 'Running…' : 'Run through the pipeline'}
      </Button>

      {engineVerdict && (
        <div
          className={cn(
            'rounded-lg border p-2.5',
            engineVerdict.kind === 'Allow'
              ? 'border-status-success/50 bg-status-success/5'
              : engineVerdict.kind === 'Rekey'
                ? 'border-status-warning/50 bg-status-warning/5'
                : 'border-destructive/50 bg-destructive/5'
          )}
        >
          <div className="flex items-center gap-1.5">
            {engineVerdict.kind === 'Allow' ? (
              <Check size={15} className="text-status-success" />
            ) : engineVerdict.kind === 'Rekey' ? (
              <ArrowRight size={15} className="text-status-warning" />
            ) : (
              <Ban size={15} className="text-destructive" />
            )}
            <span
              className={cn(
                'text-[13px] font-bold uppercase tracking-wide',
                kindColor(engineVerdict.kind)
              )}
            >
              {engineVerdict.kind}
            </span>
            <span className="ml-auto text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
              engine verdict
            </span>
          </div>
          <div className="mt-1.5 font-mono text-[12px] text-foreground">
            {engineVerdict.kind === 'Allow' && <>resolved → {engineVerdict.algorithm ?? '—'}</>}
            {engineVerdict.kind === 'Rekey' && (
              <>
                {engineVerdict.from} → {engineVerdict.to}{' '}
                <span className="font-sans text-muted-foreground">(RekeyAndProceed)</span>
              </>
            )}
            {engineVerdict.kind === 'Deny' && (
              <span className="text-destructive">{engineVerdict.reason ?? 'denied'}</span>
            )}
          </div>
          {remedy && (
            <div className="mt-2 flex items-start gap-1.5 border-t border-destructive/20 pt-2 text-[11px] text-foreground">
              <Wrench size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
              <span>
                <span className="font-semibold">To allow this · </span>
                {remedy}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Precedence explainer + pass-grouped trace (A-grade review E1/E4) ── */}
      {engineVerdict?.trace && engineVerdict.trace.length > 0 && (
        <div className="space-y-2">
          <div
            data-tour="precedence-explainer"
            className="flex items-start gap-1.5 rounded-lg border border-border bg-muted/20 p-2.5 text-[10.5px] leading-relaxed text-muted-foreground"
          >
            <Waypoints size={13} className="mt-0.5 shrink-0 text-primary" />
            <p>
              <span className="font-semibold text-foreground">How a policy decides — </span>
              two passes, in rule order.{' '}
              <span className="font-semibold text-foreground">Pass 1 · Resolve</span> picks a
              default or substitutes the algorithm (the crypto-agility rekey);{' '}
              <span className="font-semibold text-foreground">Pass 2 · Gate</span> then allows or
              denies against the resolved algorithm. Within each pass it's{' '}
              <span className="font-semibold text-foreground">first-match-wins</span> — the first
              rule that applies decides, and every later rule in that pass never runs.
            </p>
          </div>

          {(['resolve', 'gate'] as const).map((pass) => {
            const steps = engineVerdict.trace!.filter((s) =>
              pass === 'resolve' ? s.effect === 'resolve' : s.effect !== 'resolve'
            )
            if (steps.length === 0) return null
            return (
              <div key={pass}>
                <p className="text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                  Pass {pass === 'resolve' ? '1' : '2'} · {pass === 'resolve' ? 'Resolve' : 'Gate'}
                </p>
                <div className="mt-1 space-y-1">
                  {steps.map((s) => {
                    const rule = ruleForTraceStep(policy, s)
                    const decided = s.effect === 'resolve' || s.effect === 'deny'
                    return (
                      <div
                        key={s.index}
                        className={cn(
                          'flex items-start gap-1.5 rounded-md border px-1.5 py-1 text-[10.5px]',
                          decided
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border bg-transparent text-muted-foreground'
                        )}
                      >
                        <span className="font-mono text-muted-foreground shrink-0">#{s.index}</span>
                        <span className="font-medium text-foreground shrink-0">
                          {rule && isRuleTypeId(rule.type)
                            ? RULE_CATALOG[rule.type].title
                            : s.effect}
                        </span>
                        <span className="text-muted-foreground">
                          {s.note || EFFECT_FALLBACK[s.effect] || s.effect}
                        </span>
                        {decided && (
                          <span className="ml-auto shrink-0 text-[9px] font-bold uppercase tracking-wide text-primary">
                            decided here
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {approximated && (
        <div className="flex items-start gap-1.5 rounded-lg border border-status-info/40 bg-status-info/5 p-2 text-[11px] text-muted-foreground">
          <Info size={12} className="mt-0.5 shrink-0 text-status-info" />
          <span>
            The highlighted path on the graph is an illustrative approximation that disagrees with
            the engine's verdict above — the engine is always authoritative. This should be rare; if
            it persists, the graph's node order may not match what was just edited.
          </span>
        </div>
      )}
    </div>
  )
}
