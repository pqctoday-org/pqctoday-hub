// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- `plane` values come from
   the engine's own AuditEvent union or the fixed local LANES tuple, never
   user input. */
//
// AuditTrailPanel — renders the FULL cross-plane trace, grouped into per-request
// transactions (by correlation_id). Each event shows its type-specific detail:
// the policy decision (Plane 1), the actual PKCS#11 function + mechanism + CK_RV
// (Plane 3), and the KMIP request/response (Plane 2). This is the artifact that
// proves "one request, three planes" — previously collapsed to just a type name.
import type { AuditEvent } from '@/wasm/kmip/kmipEngine'
import { PLANE_INFO, friendlyMechanism } from '@/wasm/kmip/kmipMeta'

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined)
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' ? (v as Record<string, unknown>) : {}

/** C4 (2026-08-28 gaps-remediation plan) — a forced `CpOverride`, as one
 * short line, or `''` when nothing was forced. The audit wire format
 * (`DecisionSummary`, plain serde derive, no `rename_all`) carries the raw
 * KMIP codepoints, not resolved names — unlike the wasm `dry_run` binding,
 * which resolves them for the Simulate tab's teaching-focused badge; a
 * second name table here for this denser, more technical trail view isn't
 * worth the duplication. `bool`/int fields ARE already human values, so
 * only the three codepoint fields show as hex. */
function cpOverrideLine(v: unknown): string {
  const cp = obj(v)
  const parts: string[] = []
  if (num(cp.hashing_algorithm) !== undefined)
    parts.push(`hash=0x${num(cp.hashing_algorithm)!.toString(16)}`)
  if (num(cp.block_cipher_mode) !== undefined)
    parts.push(`mode=0x${num(cp.block_cipher_mode)!.toString(16)}`)
  if (num(cp.padding_method) !== undefined)
    parts.push(`padding=0x${num(cp.padding_method)!.toString(16)}`)
  if (typeof cp.deterministic === 'boolean') parts.push(`deterministic=${cp.deterministic}`)
  if (num(cp.tag_length) !== undefined) parts.push(`tagLength=${cp.tag_length}`)
  if (num(cp.salt_length) !== undefined) parts.push(`saltLength=${cp.salt_length}`)
  return parts.join(', ')
}

/** One friendly line for an audit event, by type. In Guided mode (`detailed`
 * false) the PKCS#11 line drops the raw mechanism + CK_RV + latency, keeping
 * just the human-readable function name. Exported so a single-plane flat
 * list (the Developer tab's per-plane tabs) can reuse the exact same
 * per-type formatting this file's own swimlane view uses, rather than a
 * second copy of it. */
export function describe(ev: Record<string, unknown>, detailed: boolean): string {
  switch (ev.type) {
    case 'KmipRequestReceived':
      return `▸ ${str(ev.op)}${str(ev.request_summary) ? `  ·  ${str(ev.request_summary)}` : ''}`
    case 'PolicyDecided': {
      const o = obj(ev.outcome)
      const extra = str(o.algorithm_override) || str(o.new_algorithm)
      const rule = num(o.substituted_by_rule) ?? num(ev.fired_rule_index)
      // C4 (2026-08-28 gaps-remediation plan) — was dropped entirely here;
      // a forcing rule's rewrite was invisible in the audit trail.
      const forced = cpOverrideLine(o.cp_override)
      return `decision: ${str(o.type) || '?'}${extra ? ` → ${extra}` : ''}${detailed && rule ? `  (rule #${rule})` : ''}${forced ? `  · forced: ${forced}` : ''}`
    }
    case 'RekeyPlanned':
      return `rekey ${str(ev.from_algorithm)} → ${str(ev.new_algorithm)}${detailed ? `  (rule #${num(ev.triggered_by_rule) ?? '?'})` : ''}`
    case 'Pkcs11Call': {
      const fn = str(ev.function) || 'call'
      if (!detailed) return `HSM ran ${fn}`
      const lat = num(ev.latency_ms)
      return `${fn}  ·  ${friendlyMechanism(str(ev.mechanism))}  ·  ${str(ev.rv_name) || ''}${lat !== undefined ? `  ·  ${lat}ms` : ''}`
    }
    case 'KmipResponseSent': {
      const r = obj(ev.result)
      return `◂ ${str(r.type)}${str(r.reason) ? ` (${str(r.reason)})` : ''}`
    }
    case 'PolicyActivated': {
      const warn = Array.isArray(ev.warnings) ? ev.warnings.length : 0
      return `policy activated: ${str(ev.policy_name)}${warn ? `  (${warn} warning${warn > 1 ? 's' : ''})` : ''}`
    }
    default:
      return str(ev.type) || 'event'
  }
}

interface Txn {
  id: string
  op: string
  ok: boolean | null
  events: AuditEvent[]
}

function groupByTxn(events: AuditEvent[]): Txn[] {
  const map = new Map<string, AuditEvent[]>()
  for (const e of events) {
    const arr = map.get(e.correlation_id)
    if (arr) arr.push(e)
    else map.set(e.correlation_id, [e])
  }
  const txns: Txn[] = []
  for (const [id, evs] of map) {
    const reqOp = str(evs.find((e) => str(obj(e.event).op))?.event.op)
    const resp = evs.find((e) => e.event.type === 'KmipResponseSent')
    const ok = resp
      ? str(obj(resp.event).result && obj(obj(resp.event).result).type) === 'Success'
      : null
    txns.push({ id, op: reqOp || '(policy)', ok, events: evs })
  }
  return txns.reverse() // newest transaction first
}

/** The three planes, left to right — a fixed swimlane order regardless of
 * which plane a given transaction happens to touch first. */
const LANES: AuditEvent['plane'][] = ['p1', 'p2', 'p3']

export function AuditTrailPanel({
  events,
  detailed = true,
}: {
  events: AuditEvent[]
  /** Expert mode shows raw PKCS#11 mechanism + CK_RV + rule numbers. */
  detailed?: boolean
}) {
  if (events.length === 0)
    return <p className="text-xs text-muted-foreground italic">No events yet.</p>
  const txns = groupByTxn(events)
  return (
    <div className="overflow-auto max-h-80 space-y-2">
      {txns.map((t) => (
        <div key={t.id} className="rounded-md border border-border/60 overflow-hidden">
          <div className="flex items-center gap-2 px-2 py-1 bg-muted/40 text-xs">
            <span
              className={`w-1.5 h-1.5 rounded-full ${t.ok === false ? 'bg-destructive' : t.ok ? 'bg-status-success' : 'bg-muted-foreground'}`}
            />
            <span className="font-semibold text-foreground">{t.op}</span>
            <span className="font-mono text-[10px] text-muted-foreground ml-auto">
              {t.id.slice(0, 8)}
            </span>
          </div>
          {/* Swimlanes — one column per plane, so "one op → P1 decision → P2
              request/response → P3 mechanism call" reads top-to-bottom in its
              own lane instead of as an undifferentiated flat list. */}
          <div className="grid grid-cols-3 border-t border-border/30 bg-muted/10 text-[9px] font-semibold uppercase tracking-wide">
            {LANES.map((p) => (
              <span key={p} className={`${PLANE_INFO[p]?.tone ?? ''} px-2 py-1`}>
                {PLANE_INFO[p]?.label ?? p}
              </span>
            ))}
          </div>
          <div className="divide-y divide-border/30">
            {t.events.map((e, i) => (
              <div key={i} className="grid grid-cols-3">
                {LANES.map((p) => (
                  <span
                    key={p}
                    aria-hidden={p !== e.plane || undefined}
                    className="border-r border-border/20 px-2 py-1 text-[11px] font-mono text-muted-foreground break-all last:border-r-0"
                  >
                    {p === e.plane ? describe(obj(e.event), detailed) : ' '}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
