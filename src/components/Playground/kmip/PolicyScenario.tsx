// SPDX-License-Identifier: GPL-3.0-only
//
// PolicyScenario — "test the active policy" with two modes, both driving the
// REAL in-browser engine:
//
//   • Preview (dry-run)  — asks the engine `dry_run` what it WOULD decide for a
//     battery of representative requests. Read-only: no keys, no audit, the
//     active policy is untouched. Use it to see Allow/Deny/Rekey instantly and
//     to compare policies side by side (flip the policy above, preview again).
//
//   • Run for real        — executes each request as a genuine KMIP batch
//     (Create → Activate → Sign/Encapsulate) through the same engine the
//     Workbench uses. Real keys land in the Keystore and every step is logged in
//     the Activity trail below. It still NEVER changes the active policy (only
//     the policy library does that), so the verdicts reflect exactly what you
//     selected.
//
// Accuracy note: different policies scope the same algorithm under different op
// names (RSA is denied via `CreateKeyPair` under PQC but via `Create` under
// CNSA), so a preview algorithm probe tries every creation op-form and reports
// the MOST restrictive verdict; a real run reports the strongest decision the
// engine actually emitted across the batch (e.g. Create allowed but Sign rekeyed).
import { useState } from 'react'
import { FlaskConical, Play, Loader2, CheckCircle2, XCircle, ArrowRight, CircleSlash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  strongestDecision,
  ID_PLACEHOLDER,
  type KmipEngine,
  type DryRunResult,
  type BatchResult,
  type OpSpec,
} from '@/wasm/kmip/kmipEngine'

type DryKind = 'default' | 'algo' | 'existing'
interface Probe {
  id: string
  label: string
  sub: string
  /** What the request asks for, in friendly terms (shown when allowed as-is). */
  requested: string
  // ── Preview (dry-run) shape ──
  dryKind: DryKind
  op?: string
  currentAlgorithm?: string
  algorithm?: string
  length?: number
  /** algo probes: the creation op-forms to test (most-restrictive wins). */
  ops?: string[]
  // ── Real-execution shape: a genuine KMIP batch run through the engine. ──
  live: OpSpec[]
}

const PROBES: Probe[] = [
  {
    id: 'sign',
    label: 'New signing key',
    sub: 'request a classical default and let the policy keep or upgrade it',
    requested: 'ECDSA-P256',
    dryKind: 'default',
    op: 'CreateKeyPair:Sign',
    live: [
      { op: 'CreateKeyPair', intent: 'sign', algorithm: 'ECDSA-P256' },
      { op: 'Activate', uid: ID_PLACEHOLDER },
      { op: 'Sign', uid: ID_PLACEHOLDER, text: 'policy-test message' },
    ],
  },
  {
    id: 'kem',
    label: 'New key-exchange key',
    sub: 'request a classical default and let the policy keep or upgrade it',
    requested: 'ECDH-P256',
    dryKind: 'default',
    op: 'CreateKeyPair:KeyAgreement',
    live: [
      { op: 'CreateKeyPair', intent: 'kem', algorithm: 'ECDH-P256' },
      { op: 'Activate', uid: ID_PLACEHOLDER },
      { op: 'Encapsulate', uid: ID_PLACEHOLDER },
    ],
  },
  {
    id: 'rsa',
    label: 'A classical RSA-2048 key',
    sub: 'is legacy RSA still allowed?',
    requested: 'RSA-2048',
    dryKind: 'algo',
    algorithm: 'RSA',
    length: 2048,
    ops: ['Create', 'CreateKeyPair', 'CreateKeyPair:Sign'],
    live: [{ op: 'CreateKeyPair', algorithm: 'RSA', length: 2048 }],
  },
  {
    id: 'mldsa44',
    label: 'A sub-Level-5 ML-DSA-44 key',
    sub: 'does the policy demand a higher security level?',
    requested: 'ML-DSA-44',
    dryKind: 'algo',
    algorithm: 'ML-DSA-44',
    ops: ['Create', 'CreateKeyPair', 'CreateKeyPair:Sign'],
    live: [{ op: 'CreateKeyPair', algorithm: 'ML-DSA-44' }],
  },
  {
    id: 'frodo',
    label: 'A FrodoKEM-1344 key',
    sub: 'a conservative KEM some regimes require and others reject',
    requested: 'FrodoKEM-1344',
    dryKind: 'algo',
    algorithm: 'FrodoKEM-1344',
    ops: ['Create', 'CreateKeyPair', 'CreateKeyPair:KeyAgreement'],
    // intent:'kem' shapes the request correctly for when FrodoKEM is
    // implemented; today the engine rejects the unknown algorithm outright
    // (H1) and the live run reports "not implemented" — Preview still shows the
    // real policy verdict for the name.
    live: [{ op: 'CreateKeyPair', intent: 'kem', algorithm: 'FrodoKEM-1344' }],
  },
]

type Verdict = 'Allow' | 'Deny' | 'Rekey' | 'Skip'
interface Row {
  probe: Probe
  kind: Verdict
  detail: string
}

const RANK: Record<string, number> = { Deny: 2, Rekey: 1, Allow: 0 }
const moreRestrictive = (a: DryRunResult | null, b: DryRunResult): DryRunResult =>
  !a || (RANK[b.kind] ?? 0) > (RANK[a.kind] ?? 0) ? b : a

/** Preview: ask the engine what it WOULD decide (no execution). */
function previewRow(engine: KmipEngine, p: Probe): Row {
  let d: DryRunResult
  try {
    if (p.dryKind === 'algo' && p.ops) {
      let worst: DryRunResult | null = null
      for (const op of p.ops)
        worst = moreRestrictive(
          worst,
          engine.dryRun({ op, algorithm: p.algorithm, length: p.length })
        )
      d = worst ?? { kind: 'Allow' }
    } else {
      d = engine.dryRun({ op: p.op!, currentAlgorithm: p.currentAlgorithm })
    }
  } catch {
    d = { kind: 'Deny', reason: 'engine error' }
  }
  const detail =
    d.kind === 'Rekey'
      ? `${d.from ?? p.requested} → ${d.to ?? ''}`
      : d.kind === 'Deny'
        ? d.reason || d.denyReason || 'denied'
        : d.algorithm
          ? `→ ${d.algorithm}`
          : 'allowed'
  return { probe: p, kind: d.kind, detail }
}

/** Real run: execute the request as a genuine KMIP batch and report what the
 * engine actually did (and decided). */
function liveRow(p: Probe, res: BatchResult): Row {
  const d = strongestDecision(res.audit)
  const created = res.items[0]
  const kind: Verdict = d.kind === 'Unknown' ? (created?.ok ? 'Allow' : 'Deny') : d.kind

  if (kind === 'Deny') {
    const failed = res.items.find((i) => !i.ok)
    const msg = failed?.message || 'denied by policy'
    // H1 — distinguish "the engine can't run this" (unimplemented algorithm)
    // from a genuine policy denial, so the FrodoKEM probe doesn't read as if the
    // policy rejected it when really the engine has no such algorithm.
    if (/unknown algorithm|not implemented|not supported/i.test(msg)) {
      return { probe: p, kind: 'Skip', detail: 'not implemented by this engine' }
    }
    return { probe: p, kind: 'Deny', detail: msg }
  }
  const algo = d.algorithm ?? p.requested
  const signed = res.items.some((i) => i.operation === 'Sign' && i.ok)
  const encap = res.items.some((i) => i.operation === 'Encapsulate' && i.ok)
  const extra = signed ? ' · signed' : encap ? ' · encapsulated' : ''
  return { probe: p, kind, detail: `→ ${algo}${extra}` }
}

const TONE: Record<Verdict, { badge: string; text: string }> = {
  Allow: { badge: 'bg-status-success/15 text-status-success', text: 'text-status-success' },
  Rekey: { badge: 'bg-status-warning/15 text-status-warning', text: 'text-status-warning' },
  Deny: { badge: 'bg-destructive/15 text-destructive', text: 'text-destructive' },
  Skip: { badge: 'bg-muted text-muted-foreground', text: 'text-muted-foreground' },
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function PolicyScenario({
  engine,
  policyFingerprint,
  policyLabel,
  busy,
  onBusyChange,
  onChanged,
}: {
  engine: KmipEngine
  /** Changes when the active policy changes — stale results are cleared. */
  policyFingerprint?: string
  policyLabel: string
  busy: boolean
  onBusyChange: (b: boolean) => void
  /** Called after each real op so the parent refreshes the Keystore + Activity. */
  onChanged: () => void
}) {
  const [rows, setRows] = useState<Row[]>([])
  const [mode, setMode] = useState<'preview' | 'live' | null>(null)
  const [running, setRunning] = useState<'preview' | 'live' | null>(null)

  // Switching policy invalidates any shown verdicts — clear them so the panel
  // never shows a result from a policy you're no longer on. Reset during render
  // (React's recommended pattern) instead of in an effect, which avoids the
  // extra render pass and the cascading-render lint warning.
  const [prevFingerprint, setPrevFingerprint] = useState(policyFingerprint)
  if (policyFingerprint !== prevFingerprint) {
    setPrevFingerprint(policyFingerprint)
    setRows([])
    setMode(null)
  }

  // Preview — read-only dry-run, revealed one row at a time.
  const preview = async () => {
    setRunning('preview')
    onBusyChange(true)
    const out: Row[] = []
    for (const p of PROBES) {
      out.push(previewRow(engine, p))
      setRows([...out])
      await sleep(110)
    }
    setMode('preview')
    setRunning(null)
    onBusyChange(false)
  }

  // Run for real — execute each probe as a genuine KMIP batch; refresh the
  // Keystore + Activity after every one so the page fills in as it goes.
  const runForReal = async () => {
    setRunning('live')
    onBusyChange(true)
    const out: Row[] = []
    for (const p of PROBES) {
      await sleep(0) // let the spinner paint before the synchronous wasm call
      let row: Row
      try {
        const res = engine.runBatch({ errorContinuation: 'Continue', items: p.live })
        row = liveRow(p, res)
      } catch {
        row = { probe: p, kind: 'Deny', detail: 'engine error' }
      }
      out.push(row)
      setRows([...out])
      onChanged()
      await sleep(140)
    }
    setMode('live')
    setRunning(null)
    onBusyChange(false)
  }

  const allowed = rows.filter((r) => r.kind === 'Allow').length
  const rekeyed = rows.filter((r) => r.kind === 'Rekey').length
  const denied = rows.filter((r) => r.kind === 'Deny').length

  return (
    <section className="rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2 text-foreground">
            <FlaskConical size={16} className="text-primary" /> Test the active policy
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            {PROBES.length} representative requests against{' '}
            <span className="font-semibold text-foreground">{policyLabel}</span>.{' '}
            <span className="font-semibold text-foreground">Preview</span> shows what the policy
            would decide (nothing is created).{' '}
            <span className="font-semibold text-foreground">Run for real</span> executes them — keys
            appear in the Keystore and every step is logged in the Activity trail below. Your policy
            selection never changes either way.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={preview}
            disabled={!!running || busy}
            className="gap-1.5"
          >
            {running === 'preview' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FlaskConical size={14} />
            )}{' '}
            Preview
          </Button>
          <Button onClick={runForReal} disabled={!!running || busy} className="gap-1.5">
            {running === 'live' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}{' '}
            Run for real
          </Button>
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
            <span
              className={`rounded px-1.5 py-0.5 font-semibold ${
                mode === 'live' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              }`}
            >
              {mode === 'live' ? 'real run — keys created below' : 'preview — nothing created'}
            </span>
            <span className="rounded bg-status-success/15 px-1.5 py-0.5 font-semibold text-status-success">
              {allowed} allowed
            </span>
            {rekeyed > 0 && (
              <span className="rounded bg-status-warning/15 px-1.5 py-0.5 font-semibold text-status-warning">
                {rekeyed} auto-migrated
              </span>
            )}
            {denied > 0 && (
              <span className="rounded bg-destructive/15 px-1.5 py-0.5 font-semibold text-destructive">
                {denied} denied
              </span>
            )}
          </div>
          <ol className="mt-2 space-y-1.5">
            {rows.map(({ probe, kind, detail }, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border border-border bg-card p-2"
              >
                {kind === 'Allow' ? (
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-status-success" />
                ) : kind === 'Rekey' ? (
                  <ArrowRight size={15} className="mt-0.5 shrink-0 text-status-warning" />
                ) : kind === 'Skip' ? (
                  <CircleSlash size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
                ) : (
                  <XCircle size={15} className="mt-0.5 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-foreground">{probe.label}</span>
                    <span
                      className={`rounded px-1.5 text-[10px] font-semibold ${TONE[kind].badge}`}
                    >
                      {kind}
                    </span>
                    <span className={`font-mono text-xs ${TONE[kind].text} break-all`}>
                      {detail}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{probe.sub}</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
