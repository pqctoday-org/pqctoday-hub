// SPDX-License-Identifier: GPL-3.0-only
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

/** One friendly line for an audit event, by type. */
function describe(ev: Record<string, unknown>): string {
  switch (ev.type) {
    case 'KmipRequestReceived':
      return `▸ ${str(ev.op)}${str(ev.request_summary) ? `  ·  ${str(ev.request_summary)}` : ''}`
    case 'PolicyDecided': {
      const o = obj(ev.outcome)
      const extra = str(o.algorithm_override) || str(o.new_algorithm)
      const rule = num(o.substituted_by_rule) ?? num(ev.fired_rule_index)
      return `decision: ${str(o.type) || '?'}${extra ? ` → ${extra}` : ''}${rule ? `  (rule #${rule})` : ''}`
    }
    case 'RekeyPlanned':
      return `rekey ${str(ev.from_algorithm)} → ${str(ev.new_algorithm)}  (rule #${num(ev.triggered_by_rule) ?? '?'})`
    case 'Pkcs11Call': {
      const lat = num(ev.latency_ms)
      return `${str(ev.function) || 'call'}  ·  ${friendlyMechanism(str(ev.mechanism))}  ·  ${str(ev.rv_name) || ''}${lat !== undefined ? `  ·  ${lat}ms` : ''}`
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

export function AuditTrailPanel({ events }: { events: AuditEvent[] }) {
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
          <div className="divide-y divide-border/30">
            {t.events.map((e, i) => {
              const info = PLANE_INFO[e.plane] ?? { label: e.plane, tone: 'text-muted-foreground' }
              return (
                <div key={i} className="flex items-start gap-2 px-2 py-1 text-[11px]">
                  <span className={`${info.tone} font-semibold shrink-0 w-28`}>{info.label}</span>
                  <span className="font-mono text-muted-foreground break-all">
                    {describe(obj(e.event))}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
