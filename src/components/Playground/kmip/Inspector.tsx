// SPDX-License-Identifier: GPL-3.0-only
//
// Inspector — the right-hand "look inside" pane of the manual workbench. One
// tabbed card instead of three stacked bands: the Keystore the engine populated,
// the real KMIP TTLV wire response (Expert), and the cross-plane audit / activity
// trail. Tabs adapt to the disclosure mode — Guided shows Keystore + Activity;
// Expert adds the raw KMIP Wire tab and the PKCS#11 detail.
import { useState } from 'react'
import { Boxes, Server, Database, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KmipObject, AuditEvent, OpResult, OpSpec, PolicyStatus } from '@/wasm/kmip/kmipEngine'
import { WireTreeView } from './WireTreeView'
import { AuditTrailPanel } from './AuditTrailPanel'

type Tab = 'keystore' | 'wire' | 'audit'

/** A-grade review item #7 — download the session as a single JSON takeaway:
 * the active policy (name + source YAML), everything the engine populated
 * into the keystore, and the full cross-plane audit trail. */
function downloadSession(
  policy: PolicyStatus,
  policyYaml: string | null,
  objects: KmipObject[],
  audit: AuditEvent[]
) {
  const payload = {
    exportedAt: new Date().toISOString(),
    policy: {
      name: policy.name ?? 'built-in-permissive',
      fingerprint: policy.fingerprint,
      yaml: policyYaml,
    },
    keystore: objects,
    audit,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cacp-session-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function Inspector({
  objects,
  audit,
  result,
  lastSpec,
  policy,
  policyYaml,
  expert,
  onClearAudit,
}: {
  objects: KmipObject[]
  audit: AuditEvent[]
  result: OpResult | null
  lastSpec: OpSpec | null
  policy: PolicyStatus
  policyYaml: string | null
  expert: boolean
  onClearAudit: () => void
}) {
  const [tab, setTab] = useState<Tab>('keystore')
  // Guided mode has no Wire tab — fall back to Keystore without needing to sync
  // state when the mode toggles.
  const active: Tab = !expert && tab === 'wire' ? 'keystore' : tab

  const tabs: { id: Tab; label: string }[] = expert
    ? [
        { id: 'keystore', label: 'Keystore' },
        { id: 'wire', label: 'KMIP Wire' },
        { id: 'audit', label: 'Audit' },
      ]
    : [
        { id: 'keystore', label: 'Keystore' },
        { id: 'audit', label: 'Activity' },
      ]

  const metaCount =
    active === 'keystore'
      ? `${objects.length} object(s)`
      : active === 'audit'
        ? `${audit.length} event(s)`
        : result && result.responseWireLen > 0
          ? `${result.responseWireLen} bytes on the wire`
          : ''

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border bg-muted/20 px-2 py-1.5">
        {tabs.map((t) => {
          const on = active === t.id
          const Icon = t.id === 'keystore' ? Boxes : t.id === 'wire' ? Server : Database
          return (
            <Button
              key={t.id}
              variant="ghost"
              size="sm"
              aria-pressed={on}
              onClick={() => setTab(t.id)}
              data-tour={t.id === 'audit' ? 'insp-audit-tab' : undefined}
              className={`h-7 gap-1.5 rounded-md px-2.5 text-xs ${
                on ? 'bg-card text-foreground' : 'text-muted-foreground'
              }`}
            >
              <Icon size={13} /> {t.label}
            </Button>
          )
        })}
        <span className="ml-auto pr-1 text-[10px] text-muted-foreground">{metaCount}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={objects.length === 0 && audit.length === 0}
          onClick={() => downloadSession(policy, policyYaml, objects, audit)}
          title="Download the active policy, keystore, and audit trail as JSON"
          className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Download size={12} /> session
        </Button>
        {active === 'audit' && audit.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAudit}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            clear
          </Button>
        )}
      </div>

      <div className="p-4">
        {active === 'keystore' && <KeystoreTable objects={objects} expert={expert} />}
        {active === 'wire' && <WirePanel result={result} lastSpec={lastSpec} />}
        {active === 'audit' && <AuditTrailPanel events={audit} detailed={expert} />}
      </div>
    </section>
  )
}

export function KeystoreTable({ objects, expert }: { objects: KmipObject[]; expert: boolean }) {
  if (objects.length === 0)
    return (
      <p className="text-xs text-muted-foreground italic">No objects yet — create a key pair.</p>
    )
  return (
    <div className="overflow-auto max-h-72">
      <table className="w-full text-xs">
        <thead className="text-muted-foreground border-b border-border">
          <tr className="text-left">
            <th className="py-1 pr-2">Algorithm</th>
            <th className="py-1 pr-2">Type</th>
            <th className="py-1 pr-2">State</th>
            {expert && <th className="py-1">UID</th>}
          </tr>
        </thead>
        <tbody>
          {objects.map((o) => (
            <tr key={o.uid} className="border-b border-border/40">
              <td className="py-1 pr-2 font-medium text-foreground">
                {o.algorithm}
                {o.quantumSafe && (
                  <span className="ml-1 text-[9px] px-1 rounded bg-status-success/15 text-status-success align-middle">
                    PQC
                  </span>
                )}
              </td>
              <td className="py-1 pr-2 text-muted-foreground">{o.objectType}</td>
              <td className="py-1 pr-2 text-muted-foreground">
                {o.state}
                {/* Rekey lineage was tracked in the data but only rendered in
                    the Migration tab, so anyone driving the lifecycle from the
                    Agility Workbench saw the old and new key as two unrelated
                    rows with no hint that one replaced the other. */}
                {o.supersedes && (
                  <span
                    className="ml-1 text-[9px] px-1 rounded bg-primary/15 text-primary align-middle"
                    title={`Superseded by ${o.supersedes}`}
                  >
                    → {o.supersedes.slice(0, 8)}…
                  </span>
                )}
              </td>
              {expert && (
                <td className="py-1 font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">
                  {o.uid}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WirePanel({ result, lastSpec }: { result: OpResult | null; lastSpec: OpSpec | null }) {
  return (
    <>
      {lastSpec && (
        <div className="mb-2 rounded-md border border-border bg-muted/20 p-2 text-xs">
          <span className="text-muted-foreground">request → </span>
          <span className="font-mono text-foreground">{lastSpec.op}</span>
          {Object.entries(lastSpec)
            .filter(([k]) => k !== 'op')
            .map(([k, v]) => (
              <span key={k} className="font-mono text-muted-foreground ml-2">
                {k}=
                <span className="text-foreground">
                  {String(v).length > 24 ? `${String(v).slice(0, 24)}…` : String(v)}
                </span>
              </span>
            ))}
        </div>
      )}
      <WireTreeView root={result?.responseTree ?? null} />
      {result?.responseWireHex && (
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Raw bytes (hex) — the {result.responseWireLen} bytes exactly as they came off the wire
          </summary>
          <pre className="mt-1 max-h-40 overflow-auto rounded-md border border-border bg-muted/20 p-2 text-[10px] font-mono break-all whitespace-pre-wrap text-foreground">
            {result.responseWireHex}
          </pre>
        </details>
      )}
    </>
  )
}
