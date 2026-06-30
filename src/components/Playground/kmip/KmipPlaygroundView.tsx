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
  ScrollText,
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Wand2,
  ShieldCheck,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
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
import { PolicyControlStrip } from './PolicyControlStrip'
import { PolicyScenario } from './PolicyScenario'
import { Inspector } from './Inspector'
import { PolicyView } from './PolicyView'
import { BatchView } from './BatchView'

/** Top-level surface of the CACP playground. */
type Plane = 'agility' | 'policy' | 'batch'

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Progressive-disclosure mode. Guided = newcomer (hides the wire, raw bytes,
 * secondary KMIP ops, PKCS#11 mechanism strings, and keystore UIDs; shows a
 * plain-English "what this means" callout). Expert = full fidelity. */
type ViewMode = 'guided' | 'expert'

const readMode = (): ViewMode => {
  try {
    return localStorage.getItem('cacp-mode') === 'expert' ? 'expert' : 'guided'
  } catch {
    return 'guided'
  }
}

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

/** Guided-mode "what this means" — one extra sentence of context tying the raw
 * result back to the crypto-agility story. Returns null when there's nothing
 * useful to add (so the callout doesn't render an empty box). */
function whatThisMeans(r: OpResult): string | null {
  const d = decisionOf(r)
  if (d.kind === 'Rekey')
    return `The policy didn't just allow this — it migrated the key to ${d.algorithm ?? 'a quantum-safe algorithm'}. The old key was retired automatically; your application code never changed.`
  if (d.kind === 'Deny')
    return 'The active policy forbids this algorithm, so the request was refused before any key was used. Switch to a policy that permits it, or pick a compliant algorithm.'
  if (d.kind === 'Allow' && d.algorithm)
    return `You asked for an operation and let the policy choose the algorithm — it resolved to ${d.algorithm}. Flip the policy above and the same request resolves differently.`
  if (!r.ok) return null
  switch (r.operation) {
    case 'CreateKeyPair':
    case 'Create':
      return 'Nothing is usable yet — a fresh key starts inactive. Activate it next, then sign or encapsulate.'
    case 'Activate':
      return 'The key is now live and the policy will govern every operation you run against it.'
    case 'Sign':
      return 'This signature was produced by the HSM engine itself — the same Rust code the appliance ships, running here in your tab.'
    case 'SignatureVerify':
      return 'Verification re-runs the math against the public key; a valid result proves the signature and message match.'
    default:
      return null
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

  const [mode, setMode] = useState<ViewMode>(readMode)
  const expert = mode === 'expert'
  const [plane, setPlane] = useState<Plane>('agility')
  const chooseMode = (m: ViewMode) => {
    setMode(m)
    try {
      localStorage.setItem('cacp-mode', m)
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

  // The active policy's friendly label (built-in permissive aliases the
  // training-permissive preset) — shown in the policy-test panel.
  const activePreset = POLICY_PRESETS.find(
    (p) =>
      p.name === policy.name ||
      (p.name === 'training-permissive' && policy.name === 'built-in-permissive')
  )
  const policyLabel = activePreset?.label ?? 'Built-in permissive'

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

  // Reset the workbench scratch state — the audit/activity trail, the last result,
  // and the working-key references (so the numbered lifecycle buttons disable
  // again for a fresh run). Deliberately does NOT touch the active policy or the
  // Guided/Expert mode (those are user context, not per-run scratch). The engine
  // exposes no "drop all objects" call, so previously-created keys stay in the
  // keystore — clearing the refs just detaches this UI flow from them.
  const onReset = () => {
    if (!engine) return
    engine.clearAudit()
    setAudit([])
    setResult(null)
    setLastSpec(null)
    setPriv(null)
    setPub(null)
    setSigHex(null)
    setCtHex(null)
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
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Cpu size={20} className="text-primary" /> Crypto-Agility Control Plane{' '}
            <span className="text-muted-foreground font-normal text-base">(CACP)</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            A real KMIP 3.0 control plane + PKCS#11 HSM, compiled to WebAssembly and running{' '}
            <span className="font-medium text-foreground">entirely in this tab</span> — no server,
            no Docker. Every operation is a genuine KMIP request answered by the same Rust engine
            the appliance ships.
          </p>
        </div>
        {/* VIEW · Guided / Expert progressive-disclosure toggle */}
        <div className="shrink-0 flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            View
          </span>
          <div
            role="group"
            aria-label="Detail level"
            className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5"
          >
            {(['guided', 'expert'] as const).map((m) => (
              <Button
                key={m}
                size="sm"
                variant="ghost"
                aria-pressed={mode === m}
                onClick={() => chooseMode(m)}
                className={`min-h-[44px] md:min-h-0 md:h-7 px-3 text-xs capitalize rounded-md ${
                  mode === m
                    ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {m}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top-level tabs ───────────────────────────────────────────────── */}
      <div className="overflow-x-auto no-scrollbar mb-4">
        <div
          role="tablist"
          aria-label="CACP surface"
          className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 w-max min-w-full"
        >
          {(
            [
              { id: 'agility', label: 'Agility & Workbench', icon: Wand2 },
              { id: 'policy', label: 'Policy', icon: ShieldCheck },
              { id: 'batch', label: 'Batch & Macros', icon: Layers },
            ] as const
          ).map((t) => {
            const on = plane === t.id
            const Icon = t.icon
            return (
              <Button
                key={t.id}
                role="tab"
                aria-selected={on}
                variant="ghost"
                size="sm"
                onClick={() => setPlane(t.id)}
                className={`h-8 gap-1.5 rounded-md px-3 text-xs ${
                  on ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Icon size={14} /> {t.label}
              </Button>
            )
          })}
        </div>
      </div>

      {plane === 'agility' && (
        <>
          {/* ── Plane 1 · the persistent policy "brain" ─────────────────── */}
          <PolicyControlStrip
            engine={engine}
            policy={policy}
            policyYaml={policyYaml}
            busy={busy}
            expert={expert}
            onLoadPolicy={onLoadPolicy}
            onOpenLibrary={() => setPlane('policy')}
          />

          {/* ── Policy-aware probe: how the SELECTED policy treats key requests ── */}
          <div className="mb-4">
            <PolicyScenario
              engine={engine}
              policyFingerprint={policy.fingerprint}
              policyLabel={policyLabel}
              busy={busy}
              onBusyChange={setBusy}
              onChanged={() => refresh(engine)}
            />
          </div>

          {/* ── Manual workbench: operate → result → inspect ─────────────────── */}
          <div className="mt-6 mb-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Manual Workbench
            </span>
            <span className="text-xs text-muted-foreground">
              — drive the lifecycle yourself; the active policy still governs every call.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="ml-auto h-7 gap-1.5 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw size={13} /> Reset
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
            {/* ── Left · Operate (Plane 2 — KMIP lifecycle) ─────────────────── */}
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold flex items-center gap-2 text-primary">
                <KeyRound size={16} /> Plane 2 · KMIP Lifecycle
              </h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Each button sends a real KMIP 3.0 request.
              </p>

              <p className="text-xs font-medium text-muted-foreground mb-1">Algorithm</p>
              <div className="mb-3" data-testid="kmip-algo">
                <FilterDropdown
                  items={ALGORITHMS.map((a) => ({
                    id: a.value,
                    label: a.pqc ? `${a.label} · PQC` : a.label,
                  }))}
                  selectedId={algo}
                  onSelect={setAlgo}
                  label="Algorithm"
                  className="w-full"
                />
              </div>

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

              {expert && (
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
              )}
            </section>

            {/* ── Right · Result + Inspector ────────────────────────────────── */}
            <div className="flex flex-col gap-4">
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
                          <span
                            className={`text-[10px] px-1.5 rounded bg-muted font-semibold ${tone}`}
                          >
                            policy: {d.kind}
                            {d.algorithm ? ` → ${d.algorithm}` : ''}
                          </span>
                        )
                      })()}
                    </div>
                    <p className="text-sm text-foreground mt-1.5">{narrate(result)}</p>
                    {!expert &&
                      (() => {
                        const wtm = whatThisMeans(result)
                        return wtm ? (
                          <p className="mt-2 border-l-2 border-primary/60 bg-muted/30 pl-2.5 py-1.5 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              What this means ·{' '}
                            </span>
                            {wtm}
                          </p>
                        ) : null
                      })()}
                    {busy && (
                      <Loader2 size={14} className="animate-spin text-muted-foreground mt-2" />
                    )}
                  </div>
                )}
              </section>

              {/* ── Inspector · Keystore / KMIP Wire (Expert) / Audit ─────────── */}
              <Inspector
                objects={objects}
                audit={audit}
                result={result}
                lastSpec={lastSpec}
                expert={expert}
                onClearAudit={() => {
                  engine.clearAudit()
                  setAudit([])
                }}
              />
            </div>
          </div>
        </>
      )}

      {plane === 'policy' && (
        <PolicyView
          engine={engine}
          policy={policy}
          policyYaml={policyYaml}
          busy={busy}
          onLoadPolicy={onLoadPolicy}
        />
      )}

      {plane === 'batch' && (
        <BatchView
          engine={engine}
          busy={busy}
          expert={expert}
          onBusyChange={setBusy}
          onChanged={() => refresh(engine)}
        />
      )}

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
