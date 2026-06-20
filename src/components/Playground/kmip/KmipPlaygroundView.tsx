// SPDX-License-Identifier: GPL-3.0-only
//
// KmipPlaygroundView — the in-browser crypto-agile KMIP 3.0 playground. Drives
// the pqctoday-kmip control plane + softhsmrustv3 engine, compiled to wasm and
// running entirely in this tab (no server, no Docker). Three planes, guided:
//
//   Plane 1 · Agility  — pick a policy; watch the same ops get allowed,
//                        denied, or auto-rekeyed.
//   Plane 2 · KMIP     — Create → Activate → Sign/Verify (or Encap/Decap),
//                        each a REAL KMIP request; see the TTLV wire response.
//   Plane 3 · PKCS#11  — the keystore the engine actually populated, plus the
//                        cross-plane audit trail every op emits.
import { useCallback, useEffect, useState } from 'react'
import {
  Cpu,
  KeyRound,
  ShieldCheck,
  ScrollText,
  Boxes,
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Server,
  Info,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getKmipEngine,
  decisionOf,
  type KmipEngine,
  type OpResult,
  type OpSpec,
  type KmipObject,
  type AuditEvent,
  type PolicyStatus,
} from '@/wasm/kmip/kmipEngine'
import { ALGORITHMS, POLICY_PRESETS, type PolicyPreset } from '@/wasm/kmip/kmipMeta'
import { WireTreeView } from './WireTreeView'
import { PolicyRulesView } from './PolicyRulesView'
import { PolicyTester } from './PolicyTester'
import { AgilityScenario } from './AgilityScenario'
import { AuditTrailPanel } from './AuditTrailPanel'

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** A synthetic failed [`OpResult`] for surfacing a thrown engine error (a wasm
 * panic comes back as a JS Error; a malformed return throws in `JSON.parse`).
 * Without this the catch-less call sites would swallow the throw and leave the
 * UI showing a stale result. */
function engineError(operation: string, err: unknown): OpResult {
  return {
    ok: false,
    operation,
    status: 'Error',
    resultReason: null,
    message: err instanceof Error ? err.message : String(err),
    summary: {},
    responseWireHex: '',
    responseWireLen: 0,
    responseTree: { tag: '', type: '' },
    audit: [],
  }
}

/** Friendly one-liner describing what an op result means. */
function narrate(r: OpResult): string {
  const s = r.summary
  if (!r.ok) return r.message ? `Refused: ${r.message}` : 'Operation failed.'
  switch (r.operation) {
    case 'CreateKeyPair':
      return `Generated a key pair. Private ${str(s.privateKeyUid).slice(0, 28)}…, public ${str(s.publicKeyUid).slice(0, 28)}….`
    case 'Create':
      return `Created a ${str(s.objectType)} (${str(s.uid).slice(0, 28)}…).`
    case 'Activate':
      return `Activated — the key is now ${str(s.state)} and usable.`
    case 'Sign':
      return `Signed your message. Signature is ${Number(s.signatureLen) || 0} bytes.`
    case 'SignatureVerify':
      return `Signature verification result: ${str(s.validity)}.`
    case 'Encapsulate':
      return `Encapsulated a shared secret — ${Number(s.ciphertextLen) || 0}-byte ciphertext for the private-key holder.`
    case 'Decapsulate':
      return `Decapsulated — the same shared secret is re-derived from the ciphertext.`
    case 'Query':
      return `Server reports vendor "${str(s.vendorIdentification)}" and ${Number(s.operationCount) || 0} supported operations.`
    case 'Locate':
      return `Located ${(s.uids as unknown[] | undefined)?.length ?? 0} object(s).`
    case 'Revoke':
    case 'Destroy':
      return `${r.operation} → object is now ${str(s.state)}.`
    default:
      return 'Done.'
  }
}

export function KmipPlaygroundView() {
  const [engine, setEngine] = useState<KmipEngine | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [policy, setPolicy] = useState<PolicyStatus>({ active: false })
  const [policyYaml, setPolicyYaml] = useState<string | null>(null)
  const [objects, setObjects] = useState<KmipObject[]>([])
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [result, setResult] = useState<OpResult | null>(null)
  const [lastSpec, setLastSpec] = useState<OpSpec | null>(null)

  const [showIntro, setShowIntro] = useState(
    () =>
      typeof localStorage === 'undefined' || localStorage.getItem('kmip-intro-dismissed') !== '1'
  )
  const dismissIntro = () => {
    setShowIntro(false)
    try {
      localStorage.setItem('kmip-intro-dismissed', '1')
    } catch {
      /* ignore */
    }
  }

  const [algo, setAlgo] = useState('ML-DSA-65')
  const [message, setMessage] = useState('hello post-quantum world')
  const [priv, setPriv] = useState<string | null>(null)
  const [pub, setPub] = useState<string | null>(null)
  const [sigHex, setSigHex] = useState<string | null>(null)
  const [ctHex, setCtHex] = useState<string | null>(null)

  const chosen = ALGORITHMS.find((a) => a.value === algo)
  const isKem = chosen?.kind === 'kem'

  // Boot the wasm control plane once.
  useEffect(() => {
    let alive = true
    getKmipEngine()
      .then((e) => {
        if (!alive) return
        setEngine(e)
        setPolicy(e.policyStatus())
        setObjects(e.listObjects())
        setAudit(e.auditSnapshot())
      })
      .catch((e: unknown) => alive && setBootError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [])

  const refresh = useCallback((e: KmipEngine) => {
    setObjects(e.listObjects())
    setAudit(e.auditSnapshot())
    setPolicy(e.policyStatus())
  }, [])

  // Run one KMIP op, refresh the views, return the result for chaining.
  const run = useCallback(
    async (spec: OpSpec): Promise<OpResult | null> => {
      if (!engine) return null
      setBusy(true)
      setLastSpec(spec)
      // Yield so the spinner paints before the (synchronous) wasm call.
      await new Promise((r) => setTimeout(r, 0))
      try {
        const r = engine.runOp(spec)
        setResult(r)
        refresh(engine)
        return r
      } catch (err) {
        setResult(engineError(spec.op, err))
        return null
      } finally {
        setBusy(false)
      }
    },
    [engine, refresh]
  )

  const onCreate = async () => {
    const r = await run({ op: 'CreateKeyPair', algorithm: algo })
    if (r?.ok) {
      setPriv(str(r.summary.privateKeyUid))
      setPub(str(r.summary.publicKeyUid))
      setSigHex(null)
      setCtHex(null)
    }
  }
  const onActivate = async () => {
    if (priv) await run({ op: 'Activate', uid: priv })
    if (pub) await run({ op: 'Activate', uid: pub })
  }
  const onSign = async () => {
    if (!priv) return
    const r = await run({ op: 'Sign', uid: priv, text: message })
    if (r?.ok) setSigHex(str(r.summary.signatureHex))
  }
  const onVerify = async () => {
    if (pub && sigHex)
      await run({ op: 'SignatureVerify', uid: pub, text: message, signature: sigHex })
  }
  const onEncapsulate = async () => {
    if (!pub) return
    const r = await run({ op: 'Encapsulate', uid: pub })
    if (r?.ok) setCtHex(str(r.summary.ciphertextHex))
  }
  const onDecapsulate = async () => {
    if (priv && ctHex) await run({ op: 'Decapsulate', uid: priv, data: ctHex })
  }
  const onGet = async () => {
    if (priv) await run({ op: 'Get', uid: priv })
  }
  const onRevoke = async () => {
    if (priv) await run({ op: 'Revoke', uid: priv })
  }

  const onLoadPolicy = async (preset: PolicyPreset) => {
    if (!engine) return
    setBusy(true)
    try {
      const yaml = await fetch(`/kmip-policies/${preset.file}`).then((r) => r.text())
      setPolicyYaml(yaml)
      const res = engine.loadPolicy(yaml)
      if (!res.ok) setResult(engineError('LoadPolicy', res.error ?? 'policy load failed'))
      refresh(engine)
    } catch (err) {
      // fetch failure (missing/!ok policy file) or a wasm panic in load_policy.
      setResult(engineError('LoadPolicy', err))
    } finally {
      setBusy(false)
    }
  }

  if (bootError) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle size={18} />{' '}
          <span className="font-semibold">Couldn’t start the in-browser KMIP engine</span>
        </div>
        <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto">{bootError}</pre>
      </div>
    )
  }
  if (!engine) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-6">
        <Loader2 size={18} className="animate-spin" /> Booting the KMIP + PKCS#11 engine in your
        browser…
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto animate-fade-in p-1">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Cpu size={20} className="text-primary" /> Crypto-Agility Control Plane{' '}
          <span className="text-muted-foreground font-normal text-base">(CACP)</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          A real KMIP 3.0 control plane + PKCS#11 HSM, compiled to WebAssembly and running{' '}
          <span className="font-medium text-foreground">entirely in this tab</span> — no server, no
          Docker. Every operation is a genuine KMIP request answered by the same Rust engine the
          appliance ships.
        </p>
      </div>

      {/* ── How this works (dismissible) ─────────────────────────────────── */}
      {showIntro && (
        <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissIntro}
            aria-label="Dismiss"
            className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground"
          >
            <X size={14} />
          </Button>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Info size={15} className="text-primary" /> How this works
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            <strong className="text-foreground">KMIP</strong> is the industry standard for talking
            to a key manager; <strong className="text-foreground">PKCS#11</strong> is how a key
            manager talks to an HSM. This page runs both — a real KMIP 3.0 server and a PKCS#11 HSM
            — compiled to WebAssembly, entirely in your browser. Work flows through three planes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5">
            <div className="rounded-lg border border-status-warning/30 bg-status-warning/[0.04] p-2">
              <p className="text-xs font-semibold text-status-warning">① Crypto Agility</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                A policy decides what crypto is allowed and which algorithm a request gets — the
                control plane KMIP alone lacks.
              </p>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-2">
              <p className="text-xs font-semibold text-primary">② KMIP Key Management</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Create, activate, sign, encrypt — each a real KMIP request you can see on the wire.
              </p>
            </div>
            <div className="rounded-lg border border-status-success/30 bg-status-success/[0.04] p-2">
              <p className="text-xs font-semibold text-status-success">③ PKCS#11 Execution</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                The HSM engine does the real ML-DSA / ML-KEM / RSA / AES crypto. Watch the actual{' '}
                <code>C_*</code> calls in the audit.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2.5">
            New here? Hit <strong className="text-foreground">"Run the agility scenario"</strong>{' '}
            below to watch one unchanged operation migrate from classical to post-quantum, driven
            only by policy.
          </p>
        </div>
      )}

      {/* ── The headline: watch a policy migrate an unchanged operation ──── */}
      <div className="mb-4">
        <AgilityScenario
          engine={engine}
          busy={busy}
          onBusyChange={setBusy}
          onChanged={() => refresh(engine)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Plane 1 — Agility ─────────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold flex items-center gap-2 text-status-warning">
            <ShieldCheck size={16} /> Plane 1 · Crypto Agility
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            The control plane KMIP alone can’t give you. Switch policy and the <em>same</em>{' '}
            operations are allowed, denied, or auto-rekeyed.
          </p>
          <div className="space-y-2">
            {POLICY_PRESETS.map((p) => {
              const active =
                policy.name === p.name ||
                (p.name === 'training-permissive' && policy.name === 'built-in-permissive')
              return (
                <Button
                  key={p.file}
                  variant="ghost"
                  disabled={busy}
                  onClick={() => onLoadPolicy(p)}
                  className={`w-full h-auto flex-col items-start gap-0 whitespace-normal text-left rounded-lg border p-2.5 transition-colors ${
                    active
                      ? 'border-status-warning/60 bg-status-warning/10'
                      : 'border-border hover:bg-accent/50'
                  }`}
                >
                  <span className="w-full flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{p.label}</span>
                    {active && (
                      <span className="text-[10px] uppercase tracking-wide text-status-warning font-semibold">
                        active
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">{p.blurb}</span>
                </Button>
              )
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Active policy: <span className="font-mono text-foreground">{policy.name ?? '—'}</span>
            {typeof policy.rules === 'number' ? ` · ${policy.rules} rule(s)` : ''}
          </p>
          <PolicyRulesView yaml={policyYaml} />
          <PolicyTester engine={engine} />
        </section>

        {/* ── Plane 2 — KMIP lifecycle ──────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold flex items-center gap-2 text-primary">
            <KeyRound size={16} /> Plane 2 · KMIP Lifecycle
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Each button sends a real KMIP 3.0 request.
          </p>

          <label htmlFor="kmip-algo" className="text-xs font-medium text-muted-foreground">
            Algorithm
          </label>
          <select
            id="kmip-algo"
            value={algo}
            onChange={(e) => setAlgo(e.target.value)}
            className="w-full mt-1 mb-3 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {ALGORITHMS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
                {a.pqc ? ' · PQC' : ''}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <Button disabled={busy} onClick={onCreate} className="col-span-2 gap-1.5">
              <Play size={14} /> 1 · Create {isKem ? 'KEM' : 'signing'} key pair
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !priv}
              onClick={onActivate}
              className="col-span-2"
            >
              2 · Activate
            </Button>
            {!isKem ? (
              <>
                <Button variant="secondary" disabled={busy || !priv} onClick={onSign}>
                  3 · Sign
                </Button>
                <Button variant="secondary" disabled={busy || !sigHex} onClick={onVerify}>
                  4 · Verify
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" disabled={busy || !pub} onClick={onEncapsulate}>
                  3 · Encapsulate
                </Button>
                <Button variant="secondary" disabled={busy || !ctHex} onClick={onDecapsulate}>
                  4 · Decapsulate
                </Button>
              </>
            )}
          </div>

          {!isKem && (
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="message to sign"
              className="w-full mt-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
            />
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => run({ op: 'Query' })}
              className="text-xs"
            >
              Query
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => run({ op: 'Locate' })}
              className="text-xs"
            >
              Locate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy || !priv}
              onClick={onGet}
              className="text-xs"
            >
              Get
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy || !priv}
              onClick={onRevoke}
              className="text-xs"
            >
              Revoke
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy || !priv}
              onClick={() => priv && run({ op: 'Destroy', uid: priv })}
              className="text-xs"
            >
              Destroy
            </Button>
          </div>
        </section>

        {/* ── Result / plain-English ────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold flex items-center gap-2 text-foreground">
            <ScrollText size={16} /> Result
          </h3>
          {!result ? (
            <p className="text-xs text-muted-foreground mt-2 italic">
              Run a step to see what happened.
            </p>
          ) : (
            <div className="mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                {result.ok ? (
                  <CheckCircle2 size={16} className="text-status-success" />
                ) : (
                  <XCircle size={16} className="text-destructive" />
                )}
                <span className="text-sm font-medium">{result.operation}</span>
                <span
                  className={`text-xs ${result.ok ? 'text-status-success' : 'text-destructive'}`}
                >
                  {result.status}
                </span>
                {(() => {
                  const d = decisionOf(result)
                  if (d.kind === 'Unknown') return null
                  const tone =
                    d.kind === 'Allow'
                      ? 'text-status-success'
                      : d.kind === 'Rekey'
                        ? 'text-status-warning'
                        : 'text-destructive'
                  return (
                    <span className={`text-[10px] px-1.5 rounded bg-muted font-semibold ${tone}`}>
                      policy: {d.kind}
                      {d.algorithm ? ` → ${d.algorithm}` : ''}
                    </span>
                  )
                })()}
              </div>
              <p className="text-sm text-foreground mt-1.5">{narrate(result)}</p>
              {busy && <Loader2 size={14} className="animate-spin text-muted-foreground mt-2" />}
            </div>
          )}
        </section>
      </div>

      {/* ── Wire view (real TTLV) ───────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-4 mt-4">
        <h3 className="font-semibold flex items-center gap-2 text-status-info mb-2">
          <Server size={16} /> KMIP Wire (real TTLV response)
          {result && result.responseWireLen > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              {result.responseWireLen} bytes on the wire
            </span>
          )}
        </h3>
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
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* ── Plane 3 / keystore ──────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold flex items-center gap-2 text-status-success mb-2">
            <Boxes size={16} /> Keystore{' '}
            <span className="text-xs text-muted-foreground font-normal">
              {objects.length} object(s)
            </span>
          </h3>
          {objects.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No objects yet — create a key pair.
            </p>
          ) : (
            <div className="overflow-auto max-h-72">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground border-b border-border">
                  <tr className="text-left">
                    <th className="py-1 pr-2">Algorithm</th>
                    <th className="py-1 pr-2">Type</th>
                    <th className="py-1 pr-2">State</th>
                    <th className="py-1">UID</th>
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
                      <td className="py-1 pr-2 text-muted-foreground">{o.state}</td>
                      <td className="py-1 font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">
                        {o.uid}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Cross-plane audit trail ─────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold flex items-center gap-2 text-foreground mb-2">
            <Database size={16} /> Cross-plane Audit
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-auto px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => {
                engine.clearAudit()
                setAudit([])
              }}
            >
              clear
            </Button>
          </h3>
          <AuditTrailPanel events={audit} />
        </section>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4">
        Want the full-fidelity version with TLS transport and the REST control plane? Run the real{' '}
        <code className="text-foreground">pqctoday-kmip</code> server from the{' '}
        <a className="text-primary hover:underline" href="/playground/sandbox">
          Docker sandbox
        </a>
        .
      </p>
    </div>
  )
}

export default KmipPlaygroundView
