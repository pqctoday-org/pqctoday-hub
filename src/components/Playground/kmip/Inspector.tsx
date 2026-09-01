// SPDX-License-Identifier: GPL-3.0-only
//
// Inspector — the right-hand "look inside" pane of the manual workbench. One
// tabbed card instead of three stacked bands: the Keystore the engine populated,
// the real KMIP TTLV wire response (Expert), and the cross-plane audit / activity
// trail. Tabs adapt to the disclosure mode — Guided shows Keystore + Activity;
// Expert adds the raw KMIP Wire tab and the PKCS#11 detail.
import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Boxes, Server, Database, Download, ScanSearch, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  KmipObject,
  AuditEvent,
  OpResult,
  OpSpec,
  PolicyStatus,
  KmipEngine,
  EngineKeyAttributes,
} from '@/wasm/kmip/kmipEngine'
import { CKO_TABLE, CKK_TABLE } from '@/wasm/pkcs11Inspect'
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
  engine,
}: {
  objects: KmipObject[]
  audit: AuditEvent[]
  result: OpResult | null
  lastSpec: OpSpec | null
  policy: PolicyStatus
  policyYaml: string | null
  expert: boolean
  onClearAudit: () => void
  /** Lets the Keystore tab's row Inspect action read back a key's real
   * engine-side PKCS#11 attributes. Optional — a caller with no engine in
   * scope simply gets no Inspect action, not a crash. */
  engine?: KmipEngine
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
        {active === 'keystore' && (
          <KeystoreTable objects={objects} expert={expert} engine={engine} />
        )}
        {active === 'wire' && <WirePanel result={result} lastSpec={lastSpec} />}
        {active === 'audit' && <AuditTrailPanel events={audit} detailed={expert} />}
      </div>
    </section>
  )
}

/** The object types `find_handle_for_object` (hsm's wasm engine helper)
 * actually maps to a real PKCS#11 class — the only ones `engineKeyAttributes`
 * can resolve a live handle for. Certificate has its own dedicated demo
 * (Pkcs11CertificateDemo, a different attribute shape); the remaining KMIP
 * object types have no PKCS#11 cryptoki class at all. */
const INSPECTABLE_KEY_TYPES = new Set(['PrivateKey', 'PublicKey', 'SymmetricKey', 'SecretData'])

export function KeystoreTable({
  objects,
  expert,
  engine,
}: {
  objects: KmipObject[]
  expert: boolean
  engine?: KmipEngine
}) {
  const [inspectUid, setInspectUid] = useState<string | null>(null)
  const [inspectAttrs, setInspectAttrs] = useState<EngineKeyAttributes | null>(null)

  const openInspect = (uid: string) => {
    if (!engine) return
    setInspectUid(uid)
    try {
      setInspectAttrs(engine.engineKeyAttributes(uid))
    } catch (e) {
      setInspectAttrs({ error: e instanceof Error ? e.message : String(e) })
    }
  }

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
            {expert && <th className="py-1 pr-2">UID</th>}
            {engine && <th className="py-1" />}
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
                <td className="py-1 pr-2 font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">
                  {o.uid}
                </td>
              )}
              {engine && (
                <td className="py-1 text-right">
                  {INSPECTABLE_KEY_TYPES.has(o.objectType) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInspect(o.uid)}
                      title="Inspect this key's real PKCS#11 engine attributes"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <ScanSearch size={12} />
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {inspectUid && inspectAttrs && (
        <EngineKeyAttrModal
          uid={inspectUid}
          attrs={inspectAttrs}
          onClose={() => {
            setInspectUid(null)
            setInspectAttrs(null)
          }}
        />
      )}
    </div>
  )
}

const attrRow = (label: string, value: ReactNode) => (
  <>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="text-foreground">{value}</dd>
  </>
)

const boolLabel = (v: boolean | undefined) => (v === undefined ? '(unknown)' : v ? 'true' : 'false')

/** The Keystore row's "Inspect" action — real engine-side PKCS#11 attributes
 * for a KMIP-addressed key, read back by `engineKeyAttributes` (KMIP uid →
 * CKA_UNIQUE_ID-stable engine handle, same identity approach the PKCS#11
 * Developer tab's key viewer uses — see HsmKey.uniqueId's doc comment). An
 * honest "not extractable" beats a fabricated CKA_VALUE, which is why this
 * never requests CKA_VALUE at all: the sensitivity/extractability flags
 * themselves ARE the answer for a private/secret key. */
function EngineKeyAttrModal({
  uid,
  attrs,
  onClose,
}: {
  uid: string
  attrs: EngineKeyAttributes
  onClose: () => void
}) {
  const ckClassName =
    attrs.ckClass !== undefined
      ? (CKO_TABLE[attrs.ckClass]?.name ?? `0x${attrs.ckClass.toString(16)}`)
      : '(unknown)'
  const ckKeyTypeName =
    attrs.ckKeyType !== undefined
      ? (CKK_TABLE[attrs.ckKeyType]?.name ?? `0x${attrs.ckKeyType.toString(16)}`)
      : '(unknown)'

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 embed-backdrop bg-black/60 flex items-center justify-center z-[100] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="glass-panel w-full max-w-md max-h-[85vh] overflow-y-auto p-5 space-y-3 shadow-xl z-[101] bg-background border border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm">Real engine attributes</h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{uid}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>

        {attrs.error ? (
          <p className="text-xs text-status-error">{attrs.error}</p>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Read back from the token itself (not the KMIP store record) — this is what a raw
              PKCS#11 caller would see for the same object.
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[10.5px]">
              {attrRow('CKA_ID', attrs.ckaId ?? '(none)')}
              {attrRow('CKA_UNIQUE_ID', attrs.ckUniqueId ?? '(none)')}
              {attrRow('CKA_CLASS', ckClassName)}
              {attrRow('CKA_KEY_TYPE', ckKeyTypeName)}
              {attrRow('CKA_LABEL', attrs.ckLabel ?? '(none)')}
              {attrs.sizeAttr &&
                attrRow(
                  attrs.sizeAttr,
                  attrs.sizeValue !== undefined ? String(attrs.sizeValue) : '(none)'
                )}
              {attrRow('CKA_LOCAL', boolLabel(attrs.ckLocal))}
              {attrRow('CKA_SENSITIVE', boolLabel(attrs.ckSensitive))}
              {attrRow('CKA_EXTRACTABLE', boolLabel(attrs.ckExtractable))}
              {attrRow('CKA_ALWAYS_SENSITIVE', boolLabel(attrs.ckAlwaysSensitive))}
              {attrRow('CKA_NEVER_EXTRACTABLE', boolLabel(attrs.ckNeverExtractable))}
            </dl>
            {(attrs.ckSensitive || attrs.ckExtractable === false) && (
              <p className="text-[10.5px] text-muted-foreground italic">
                CKA_VALUE isn't shown above — this key is sensitive and/or non-extractable, so a
                real PKCS#11 caller can't read it back either (§4.9/§4.10). That refusal is the
                honest answer, not a gap in this inspector.
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
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
