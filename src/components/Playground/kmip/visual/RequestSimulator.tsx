// SPDX-License-Identifier: GPL-3.0-only
//
// RequestSimulator — the Simulate tab. Build a KMIP request, run it, and show
// the AUTHORITATIVE verdict from the WASM engine's dryRun alongside the
// illustrative flow (which the graph animates). Since WP4b the engine's
// dryRun receives the FULL request (date, custom attrs, usage mask, mechanism
// params, key activation date), so temporal/attribute/mechanism rules are
// evaluated authoritatively — the "approximated" banner now signals genuine
// simulator drift, not a known blind spot.
import { FlaskConical, Play, Check, ArrowRight, Ban, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DryRunResult } from '@/wasm/kmip/kmipEngine'
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
} from './ruleCatalog'
import type { SimRequest } from './policySim'

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
}

const kindColor = (kind: string): string =>
  kind === 'Allow'
    ? 'text-status-success'
    : kind === 'Rekey'
      ? 'text-status-warning'
      : 'text-destructive'

export function RequestSimulator({
  req,
  onChange,
  onRun,
  running,
  guided,
  engineVerdict,
  approximated,
}: Props) {
  const patch = <K extends keyof SimRequest>(key: K, value: SimRequest[K]) =>
    onChange({ ...req, [key]: value })

  return (
    <div className="space-y-3 p-3.5">
      <div className="flex items-center gap-2">
        <FlaskConical size={15} className="text-primary" />
        <span className="text-[12.5px] font-semibold text-foreground">Simulate a request</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <FieldLabel>operation</FieldLabel>
          <SelectField value={req.op} options={KMIP_OPS} onChange={(v) => patch('op', v)} />
        </div>
        <div>
          <FieldLabel>key state</FieldLabel>
          <SelectField
            value={req.keyState}
            options={KEY_STATES}
            onChange={(v) => patch('keyState', v)}
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
              />
            </div>
            <div>
              <FieldLabel>padding</FieldLabel>
              <SelectField
                value={req.padding}
                options={['', ...PADDING_METHODS]}
                onChange={(v) => patch('padding', v)}
              />
            </div>
            <div>
              <FieldLabel>deterministic</FieldLabel>
              <SelectField
                value={req.deterministic}
                options={['', 'true', 'false']}
                onChange={(v) => patch('deterministic', v as SimRequest['deterministic'])}
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

      <Button variant="gradient" className="w-full gap-1.5" onClick={onRun} disabled={running}>
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
        </div>
      )}

      {approximated && (
        <div className="flex items-start gap-1.5 rounded-lg border border-status-info/40 bg-status-info/5 p-2 text-[11px] text-muted-foreground">
          <Info size={12} className="mt-0.5 shrink-0 text-status-info" />
          <span>
            The highlighted path is an illustrative approximation — the engine's verdict above is
            authoritative. (A per-rule engine trace lands in a later update.)
          </span>
        </div>
      )}
    </div>
  )
}
