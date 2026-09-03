// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- array index swaps use numeric
   loop counters and map lookups use typed `BatchErrorContinuation` keys, never
   user input. */
//
// BatchView — illustrate KMIP's batch / "macro" capability: many operations in
// ONE Request Message (not N round trips). Pick a recipe (or build your own
// sequence), choose how failures are handled (Continue / Stop / Undo), and run.
// The result is the single shared Response Message decoded into per-item results.
// `$IDPlaceholder` chains Create → Activate → Sign without ever quoting a UID.
import { useState } from 'react'
import {
  Layers,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Trash2,
  ArrowUp,
  ArrowDown,
  CornerDownRight,
  Link2,
  Unlink2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { cn } from '@/lib/utils'
import {
  type KmipEngine,
  type OpSpec,
  type BatchResult,
  type BatchErrorContinuation,
  ID_PLACEHOLDER,
} from '@/wasm/kmip/kmipEngine'
import { WireTreeView } from './WireTreeView'

interface Recipe {
  id: string
  label: string
  desc: string
  cont: BatchErrorContinuation
  items: OpSpec[]
}

const RECIPES: Recipe[] = [
  {
    id: 'provision-sign',
    label: 'Provision a signing key',
    desc: 'CreateKeyPair → Activate → Sign, chained by ID-placeholder in ONE request.',
    cont: 'Continue',
    items: [
      { op: 'CreateKeyPair', intent: 'sign', algorithm: 'ML-DSA-65' },
      { op: 'Activate', uid: ID_PLACEHOLDER },
      { op: 'Sign', uid: ID_PLACEHOLDER, text: 'batch-signed payload' },
    ],
  },
  {
    id: 'provision-kem',
    label: 'Provision a KEM key',
    desc: 'CreateKeyPair (KEM) → Activate → Encapsulate in one round trip.',
    cont: 'Continue',
    items: [
      { op: 'CreateKeyPair', intent: 'kem', algorithm: 'ML-KEM-768' },
      { op: 'Activate', uid: ID_PLACEHOLDER },
      { op: 'Encapsulate', uid: ID_PLACEHOLDER },
    ],
  },
  {
    id: 'atomic-undo',
    label: 'Atomic batch (rollback on failure)',
    desc: 'Under Undo, if any item fails the earlier successes roll back (OperationUndone). Activate the PQC or CNSA policy first to make the classical key fail.',
    cont: 'Undo',
    items: [
      { op: 'Create', algorithm: 'AES', length: 256 },
      { op: 'CreateKeyPair', algorithm: 'RSA' },
      { op: 'Query' },
    ],
  },
  {
    id: 'undo-covers-kem',
    label: 'Rollback reaches Encapsulate (0.13.0)',
    desc: 'Provision a KEM key, Encapsulate with it, then hit a guaranteed failure (Destroy of a ghost UID) under Undo. Engine 0.13.0 taught rollback about the UID-minting KEM/split-key ops — every earlier item reports OperationUndone and the minted objects are genuinely gone. Before 0.13.0 the Encapsulate survived the "rollback".',
    cont: 'Undo',
    items: [
      { op: 'CreateKeyPair', intent: 'kem', algorithm: 'ML-KEM-768' },
      { op: 'Activate', uid: ID_PLACEHOLDER },
      { op: 'Encapsulate', uid: ID_PLACEHOLDER },
      { op: 'Destroy', uid: 'urn:pqctoday:ghost' },
    ],
  },
  {
    id: 'inventory',
    label: 'Server inventory',
    desc: 'Query + Locate together — capabilities and stored objects in one batch.',
    cont: 'Continue',
    items: [{ op: 'Query' }, { op: 'Locate' }],
  },
]

const CONT_INFO: Record<BatchErrorContinuation, string> = {
  Continue: 'Run every item, even after a failure.',
  Stop: 'Halt after the first failure; later items are not run.',
  Undo: 'Halt after the first failure AND roll back earlier successes.',
}

const ADDABLE: OpSpec['op'][] = [
  'CreateKeyPair',
  'Create',
  'Activate',
  'Sign',
  // SignatureVerify / Encrypt / Decrypt / Decapsulate were missing
  // (2026-07-04) — the builder couldn't express a full lifecycle round trip
  // (create → activate → protect → recover) that the policies gate.
  'SignatureVerify',
  'Encapsulate',
  'Decapsulate',
  'Encrypt',
  'Decrypt',
  'Query',
  'Locate',
  'Get',
  'Revoke',
  'Destroy',
]

/** The nearest earlier item that actually sets/empties the ID Placeholder for
 * item `i` — i.e. the last preceding item whose op isn't 'Query', the only
 * ADDABLE op `update_id_placeholder` (dispatcher/mod.rs) leaves untouched.
 * Checking `items[i-1]` directly missed `Locate → Query → $IDPlaceholder`:
 * the placeholder is still Locate's, but the immediate predecessor is Query. */
function placeholderProducer(items: OpSpec[], i: number): OpSpec | undefined {
  for (let j = i - 1; j >= 0; j--) {
    if (items[j].op !== 'Query') return items[j]
  }
  return undefined
}

/** The rewrite BatchView's per-item "chained"/"direct" toggle applies to
 *  `items[i]`: $IDPlaceholder ("chained" — follows whatever the previous
 *  item minted/matched) flips to a literal UID ("direct" — always the same
 *  object), seeded from the first live keystore UID (or '' if the store is
 *  empty, requiring a manual pick); a literal UID flips back to the
 *  placeholder. Items with no `uid` field at all (Query, etc.) are left
 *  untouched — there's nothing to chain. Exported so this behavior is
 *  unit-testable without mounting the component or a real KmipEngine. */
export function toggleItemChaining(items: OpSpec[], i: number, keystoreUids: string[]): OpSpec[] {
  return items.map((s, k) => {
    if (k !== i || s.uid === undefined) return s
    return { ...s, uid: s.uid === ID_PLACEHOLDER ? (keystoreUids[0] ?? '') : ID_PLACEHOLDER }
  })
}

/** One-line label for an item in the sequence. */
function itemLabel(spec: OpSpec): string {
  const bits: string[] = [spec.op]
  if (spec.algorithm) bits.push(spec.algorithm)
  else if (spec.intent) bits.push(`(${spec.intent})`)
  if (spec.length) bits.push(`${spec.length}-bit`)
  if (spec.text) bits.push(`"${spec.text.slice(0, 18)}"`)
  return bits.join(' ')
}

const statusIcon = (status: string) => {
  if (status === 'Success') return <CheckCircle2 size={14} className="text-status-success" />
  if (status === 'OperationUndone') return <RotateCcw size={14} className="text-status-warning" />
  if (status === 'OperationPending') return <Clock size={14} className="text-status-info" />
  return <XCircle size={14} className="text-destructive" />
}

export function BatchView({
  engine,
  busy,
  expert,
  onBusyChange,
  onChanged,
}: {
  engine: KmipEngine
  busy: boolean
  expert: boolean
  onBusyChange: (running: boolean) => void
  onChanged: () => void
}) {
  const [items, setItems] = useState<OpSpec[]>(RECIPES[0].items)
  const [cont, setCont] = useState<BatchErrorContinuation>('Continue')
  const [asyncMandatory, setAsyncMandatory] = useState(false)
  const [activeRecipe, setActiveRecipe] = useState<string | null>(RECIPES[0].id)
  const [result, setResult] = useState<BatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  // Live keystore UIDs for the per-item "chained"/"direct" toggle's UID
  // picker — same source CommandsView's own uid ParamField uses
  // (engine.listObjects()), recomputed on every render so a UID minted by
  // an earlier batch run shows up without a manual refresh.
  const keystoreUids = engine.listObjects().map((o) => o.uid)

  const loadRecipe = (r: Recipe) => {
    setItems(r.items.map((i) => ({ ...i })))
    setCont(r.cont)
    setActiveRecipe(r.id)
    setResult(null)
    setError(null)
  }

  const mutate = (fn: (xs: OpSpec[]) => OpSpec[]) => {
    setItems((xs) => fn(xs))
    setActiveRecipe(null)
  }
  const removeAt = (i: number) => mutate((xs) => xs.filter((_, k) => k !== i))
  /** Toggle item `i` between $IDPlaceholder ("chained" to whatever the
   * previous item minted/matched) and a literal UID picked from the live
   * keystore ("direct" — always the same object, no matter what runs
   * before it). Switching TO direct seeds the first keystore UID (or ''
   * if the store is empty) rather than leaving the placeholder in place,
   * so the item never silently keeps chained behaviour under a "direct"
   * label. */
  const setItemUid = (i: number, uid: string) =>
    mutate((xs) => xs.map((s, k) => (k === i ? { ...s, uid } : s)))
  const move = (i: number, dir: -1 | 1) =>
    mutate((xs) => {
      const j = i + dir
      if (j < 0 || j >= xs.length) return xs
      const next = xs.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  const addOp = (op: OpSpec['op']) =>
    mutate((xs) => [
      ...xs,
      op === 'CreateKeyPair'
        ? { op, intent: 'sign', algorithm: 'ML-DSA-65' }
        : op === 'Create'
          ? { op, algorithm: 'AES', length: 256 }
          : op === 'Sign'
            ? { op, uid: ID_PLACEHOLDER, text: 'hello' }
            : op === 'Encrypt'
              ? { op, uid: ID_PLACEHOLDER, text: 'hello' }
              : [
                    'Activate',
                    'Encapsulate',
                    'Decapsulate',
                    'SignatureVerify',
                    'Decrypt',
                    'Get',
                    'Revoke',
                    'Destroy',
                  ].includes(op)
                ? { op, uid: ID_PLACEHOLDER }
                : { op },
    ])

  const run = async () => {
    if (!items.length) return
    setRunning(true)
    onBusyChange(true)
    setError(null)
    await new Promise((r) => setTimeout(r, 0))
    try {
      const res = engine.runBatch({
        errorContinuation: cont,
        asynchronous: asyncMandatory ? 'Mandatory' : undefined,
        items,
      })
      setResult(res)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
      onBusyChange(false)
    }
  }

  const undone = result?.items.filter((i) => i.status === 'OperationUndone').length ?? 0
  const failed = result?.items.filter((i) => !i.ok && i.status !== 'OperationUndone').length ?? 0

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 font-semibold text-foreground">
          <Layers size={16} className="text-primary" /> Batch & macros
          <span className="text-xs font-normal text-muted-foreground">
            — many operations, ONE KMIP request
          </span>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          A KMIP batch carries several operations in a single Request Message. The active policy
          still governs every item, and <code className="text-foreground">{ID_PLACEHOLDER}</code>{' '}
          lets one item reference the object the previous item created — so
          Create&nbsp;→&nbsp;Activate&nbsp;→&nbsp;Sign is one round trip, not three.
        </p>

        {/* Recipes */}
        <p className="mt-3 mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Recipes
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RECIPES.map((r) => (
            <Button
              key={r.id}
              variant="ghost"
              disabled={busy}
              onClick={() => loadRecipe(r)}
              className={cn(
                'h-auto w-full flex-col items-start gap-0.5 whitespace-normal rounded-lg border px-3 py-2 text-left',
                activeRecipe === r.id
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-border bg-background/40 hover:border-primary/40'
              )}
            >
              <span className="text-[12.5px] font-semibold text-foreground">{r.label}</span>
              <p className="text-[10.5px] font-normal leading-snug text-muted-foreground">
                {r.desc}
              </p>
            </Button>
          ))}
        </div>
      </section>

      {/* Builder */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="text-xs font-semibold text-foreground">
            Sequence <span className="font-mono text-muted-foreground">({items.length})</span>
          </h4>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">add</span>
            <FilterDropdown
              items={ADDABLE}
              selectedId=""
              onSelect={(id) => {
                if (id !== 'All') addOp(id as OpSpec['op'])
              }}
              defaultLabel="＋ op…"
              defaultIcon={null}
              ariaLabel="Add operation"
              disabled={busy}
              noContainer
              size="sm"
            />
          </div>
        </div>

        <ol className="mt-3 space-y-1.5">
          {items.map((spec, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5"
            >
              <span className="font-mono text-[10px] text-muted-foreground w-4 text-right">
                {i + 1}
              </span>
              <span className="text-xs font-medium text-foreground">{itemLabel(spec)}</span>
              {spec.uid !== undefined && spec.uid === ID_PLACEHOLDER && (
                <span
                  className="inline-flex items-center gap-0.5 rounded bg-status-warning/15 px-1.5 py-0.5 text-[9px] font-semibold text-status-warning"
                  title={
                    placeholderProducer(items, i)?.op === 'Locate'
                      ? '§6.1.34: the placeholder only resolves if Locate matched EXACTLY one object — 0 or >1 matches empties it, and this item fails.'
                      : undefined
                  }
                >
                  <CornerDownRight size={9} /> prev key
                  {placeholderProducer(items, i)?.op === 'Locate' && ' (needs 1 match)'}
                </span>
              )}
              {spec.uid !== undefined && spec.uid !== ID_PLACEHOLDER && (
                <Input
                  value={spec.uid}
                  onChange={(e) => setItemUid(i, e.target.value)}
                  disabled={busy}
                  placeholder="paste or pick a UID"
                  list={keystoreUids.length ? `batch-uids-${i}` : undefined}
                  className="h-6 w-32 font-mono text-[10px]"
                  aria-label={`Item ${i + 1} UID`}
                />
              )}
              {keystoreUids.length > 0 && spec.uid !== undefined && spec.uid !== ID_PLACEHOLDER && (
                <datalist id={`batch-uids-${i}`}>
                  {keystoreUids.map((uid) => (
                    <option key={uid} value={uid} />
                  ))}
                </datalist>
              )}
              {spec.uid !== undefined && (
                <Button
                  variant="ghost"
                  onClick={() => mutate((xs) => toggleItemChaining(xs, i, keystoreUids))}
                  disabled={busy}
                  className="h-auto w-auto p-1 text-muted-foreground hover:text-foreground"
                  aria-label={
                    spec.uid === ID_PLACEHOLDER
                      ? 'Switch to a direct (literal) UID'
                      : 'Switch to chained ($IDPlaceholder)'
                  }
                  title={
                    spec.uid === ID_PLACEHOLDER
                      ? 'Chained — follows whatever the previous item minted/matched. Click to pin a literal UID instead.'
                      : 'Direct — always this literal UID, regardless of what runs before it. Click to chain to the previous item instead.'
                  }
                >
                  {spec.uid === ID_PLACEHOLDER ? <Link2 size={11} /> : <Unlink2 size={11} />}
                </Button>
              )}
              <div className="ml-auto flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  onClick={() => move(i, -1)}
                  disabled={busy || i === 0}
                  className="h-auto w-auto p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Move up"
                >
                  <ArrowUp size={12} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => move(i, 1)}
                  disabled={busy || i === items.length - 1}
                  className="h-auto w-auto p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Move down"
                >
                  <ArrowDown size={12} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => removeAt(i)}
                  disabled={busy}
                  className="h-auto w-auto p-1 text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="rounded-md border border-dashed border-border px-2 py-3 text-center text-[11px] text-muted-foreground">
              Empty — load a recipe or add an op.
            </li>
          )}
        </ol>

        {/* Error-continuation + run */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              On failure
            </p>
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
              {(['Continue', 'Stop', 'Undo'] as const).map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant="ghost"
                  aria-pressed={cont === c}
                  disabled={busy}
                  onClick={() => setCont(c)}
                  className={cn(
                    'h-7 rounded-md px-2.5 text-xs',
                    cont === c
                      ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground max-w-xs">{CONT_INFO[cont]}</p>
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              §8.1.2 Asynchronous
            </p>
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={asyncMandatory}
              disabled={busy}
              onClick={() => setAsyncMandatory((v) => !v)}
              className={cn(
                'h-7 rounded-md border border-border px-2.5 text-xs',
                asyncMandatory
                  ? 'bg-status-info/15 text-status-info border-status-info/40'
                  : 'text-muted-foreground'
              )}
            >
              {asyncMandatory ? 'Mandatory' : 'off'}
            </Button>
          </div>
          {asyncMandatory && (
            <p className="text-[11px] text-muted-foreground max-w-xs">
              One header setting for the whole batch — every eligible item queues as a background
              job (OperationPending + a correlation value) instead of running inline. Poll/Cancel/
              Process/Query and the negotiation ops aren't eligible and fail instead. A queued item
              hasn't produced a UID yet, so a $IDPlaceholder-chained recipe (like this one) fails
              its later steps honestly — items that don't reference an earlier item's UID queue
              cleanly instead.
            </p>
          )}
          <Button disabled={busy || items.length === 0} onClick={run} className="ml-auto gap-1.5">
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run
            batch
          </Button>
        </div>
        {error && (
          <p className="mt-2 rounded border border-destructive/40 bg-destructive/5 px-2 py-1 text-[11px] text-destructive">
            {error}
          </p>
        )}
      </section>

      {/* Results */}
      {result && (
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-semibold text-foreground">Batch result</h4>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                result.ok
                  ? 'bg-status-success/15 text-status-success'
                  : 'bg-destructive/15 text-destructive'
              )}
            >
              {result.ok
                ? 'all succeeded'
                : `${failed} failed${undone ? `, ${undone} undone` : ''}`}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {result.returned}/{result.requested} items returned · on-failure{' '}
              {result.errorContinuation} · {result.responseWireLen} bytes on the wire
            </span>
          </div>

          {result.returned < result.requested && (
            <p className="mt-2 text-[11px] text-status-warning">
              {result.requested - result.returned} item(s) after the failure were not processed (
              {result.errorContinuation}).
            </p>
          )}
          {undone > 0 && (
            <p className="mt-1 text-[11px] text-status-warning">
              Undo rolled back {undone} earlier success(es) — the batch is atomic.
            </p>
          )}

          <ol className="mt-3 space-y-1.5">
            {result.items.map((it, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5"
              >
                <span className="font-mono text-[10px] text-muted-foreground w-4 text-right mt-0.5">
                  {i + 1}
                </span>
                {statusIcon(it.status)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">{it.operation}</span>
                    <span
                      className={cn(
                        'text-[10px]',
                        it.ok
                          ? 'text-status-success'
                          : it.status === 'OperationUndone'
                            ? 'text-status-warning'
                            : it.status === 'OperationPending'
                              ? 'text-status-info'
                              : 'text-destructive'
                      )}
                    >
                      {it.status}
                    </span>
                  </div>
                  {it.message && (
                    <p className="text-[10.5px] text-muted-foreground break-all">{it.message}</p>
                  )}
                  {it.ok && summarize(it.summary) && (
                    <p className="text-[10.5px] text-muted-foreground break-all">
                      {summarize(it.summary)}
                    </p>
                  )}
                  {it.status === 'OperationPending' && it.asynchronousCorrelationValueHex && (
                    <p className="text-[10.5px] text-muted-foreground break-all">
                      Correlation value:{' '}
                      <span className="font-mono text-foreground">
                        {it.asynchronousCorrelationValueHex}
                      </span>{' '}
                      — redeem it with Poll in the Commands tab's Asynchronous Processing category.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {expert && result.requestWireHex && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                shared Request Message — {result.requestWireLen} bytes (hex) — every item above, ONE
                round trip
              </summary>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded border border-border bg-muted/40 p-2 font-mono text-[9.5px] text-muted-foreground">
                {result.requestWireHex}
              </pre>
            </details>
          )}
          {expert && result.responseTree && (
            <details className="mt-2" open>
              <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                shared Response Message — {result.responseWireLen} bytes
              </summary>
              <div className="mt-1.5">
                <WireTreeView root={result.responseTree} annotated />
              </div>
            </details>
          )}
        </section>
      )}
    </div>
  )
}

/** Compact one-liner from a batch item's summary object. */
function summarize(summary: Record<string, unknown>): string {
  const s = summary as Record<string, string | number | undefined>
  if (s.privateKeyUid) return `key pair ${String(s.privateKeyUid).slice(0, 30)}…`
  if (s.uid && s.state) return `${String(s.uid).slice(0, 30)}… → ${s.state}`
  if (s.signatureLen) return `${s.signatureLen}-byte signature`
  if (s.ciphertextLen) return `${s.ciphertextLen}-byte ciphertext`
  if (s.uid) return `${String(s.uid).slice(0, 36)}…`
  if (s.vendorIdentification) return `vendor "${s.vendorIdentification}"`
  if (Array.isArray((summary as { uids?: unknown[] }).uids))
    return `${(summary as { uids: unknown[] }).uids.length} object(s)`
  return ''
}
