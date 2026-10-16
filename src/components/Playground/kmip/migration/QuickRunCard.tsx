// SPDX-License-Identifier: GPL-3.0-only
//
// The three-step quick run at the top of the Migration tab. It drives the same
// engine instance as the estate below, so every key it creates also shows in
// the keystore table. The application side only ever passes the key LABEL.

import { useCallback, useState } from 'react'
import { Check, ClipboardCopy, Loader2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KmipEngine, KmipObject } from '@/wasm/kmip/kmipEngine'
import { BUILD_COMMIT } from '@/utils/sourceLink'
import { MIGRATION_POLICIES, type MigrationPolicyChip } from './migrationKeys'
import {
  buildQuickRunSummary,
  QUICK_RUN_LABEL,
  QUICK_RUN_MESSAGE,
  type QuickRunKey,
  type QuickRunRecord,
} from './quickRun'

interface Props {
  engine: KmipEngine
  activePolicy: string | null
  /** The tab's own policy switch, so the rail and the estate cards follow. */
  switchPolicy: (chip: MigrationPolicyChip) => Promise<void>
  onKeystoreChange: () => void
}

type Target = 'migration-pqc' | 'migration-hybrid'

interface Step1 {
  key: QuickRunKey
  signatureBytes: number
  policy: string
}

const chip = (name: string) => MIGRATION_POLICIES.find((p) => p.name === name)

const toKey = (o: KmipObject): QuickRunKey => ({
  uid: o.uid,
  algorithm: o.algorithm,
  state: o.state,
  quantumSafe: o.quantumSafe,
})

const hexBytes = (hex: unknown) => Math.floor(String(hex ?? '').length / 2)

export function QuickRunCard({ engine, activePolicy, switchPolicy, onKeystoreChange }: Props) {
  const [step1, setStep1] = useState<Step1 | null>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const [record, setRecord] = useState<QuickRunRecord | null>(null)
  const [events, setEvents] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const run = useCallback(
    (spec: Parameters<KmipEngine['runOp']>[0], log: string[]) => {
      const r = engine.runOp(spec)
      for (const e of r.audit ?? []) log.push(`${spec.op}: ${e.event?.type ?? 'event'}`)
      if (!r.ok) throw new Error(r.message ?? `${spec.op} failed`)
      return r
    },
    [engine]
  )

  const activeByLabel = useCallback(
    (type: 'PrivateKey' | 'PublicKey') =>
      engine
        .listObjects()
        .find((o) => o.name === QUICK_RUN_LABEL && o.state === 'Active' && o.objectType === type),
    [engine]
  )

  const guarded = (fn: () => Promise<void>) => async () => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
      onKeystoreChange()
    }
  }

  // Step 1 — classical key behind a label, used once.
  const onCreate = guarded(async () => {
    const classical = chip('migration-classical')
    if (classical && activePolicy !== classical.name) await switchPolicy(classical)
    const log: string[] = []
    // Start clean if the quick run was used before.
    for (const o of engine.listObjects().filter((x) => x.name === QUICK_RUN_LABEL)) {
      if (o.state === 'Active') engine.runOp({ op: 'Revoke', uid: o.uid })
      engine.runOp({ op: 'Destroy', uid: o.uid })
    }
    const r = run({ op: 'CreateKeyPair', intent: 'sign', name: QUICK_RUN_LABEL }, log)
    const priv = String(r.summary.privateKeyUid)
    run({ op: 'Activate', uid: priv }, log)
    run({ op: 'Activate', uid: String(r.summary.publicKeyUid) }, log)
    const sig = run({ op: 'Sign', uid: priv, text: QUICK_RUN_MESSAGE }, log)
    const rec = engine.listObjects().find((o) => o.uid === priv)
    if (!rec) throw new Error('the new key is not in the keystore')
    setStep1({
      key: toKey(rec),
      signatureBytes: hexBytes(sig.summary.signatureHex),
      policy: engine.policyStatus().name ?? 'migration-classical',
    })
    setEvents(log)
    setTarget(null)
    setRecord(null)
  })

  // Step 2 — change the policy only.
  const onSwitch = (name: Target) =>
    guarded(async () => {
      const c = chip(name)
      if (!c) throw new Error(`policy ${name} is not available`)
      await switchPolicy(c)
      setTarget(name)
      setRecord(null)
    })

  // Step 3 — the application signs again, by label; the engine rekeys on use.
  const onUse = guarded(async () => {
    if (!step1) return
    const log = [...events]
    const current = activeByLabel('PrivateKey')
    if (!current) throw new Error('no active key under the label — run step 1 again')
    const sig = run({ op: 'Sign', uid: current.uid, text: QUICK_RUN_MESSAGE }, log)
    const newPriv = activeByLabel('PrivateKey')
    const newPub = activeByLabel('PublicKey')
    if (!newPriv || !newPub) throw new Error('no active key under the label after signing')
    const verify = run(
      {
        op: 'SignatureVerify',
        uid: newPub.uid,
        text: QUICK_RUN_MESSAGE,
        signature: String(sig.summary.signatureHex ?? ''),
      },
      log
    )
    const old = engine.listObjects().find((o) => o.uid === step1.key.uid)
    setEvents(log)
    setRecord({
      label: QUICK_RUN_LABEL,
      message: QUICK_RUN_MESSAGE,
      policyBefore: step1.policy,
      policyAfter: engine.policyStatus().name ?? target ?? 'unknown',
      before: step1.key,
      signatureBytesBefore: step1.signatureBytes,
      after: toKey(newPriv),
      beforeStateAfterRun: old?.state ?? 'Destroyed',
      successorLinked: old?.supersedes === newPriv.uid,
      signatureBytesAfter: hexBytes(sig.summary.signatureHex),
      verified: /Valid/.test(String(verify.summary.validity ?? '')),
      events: log,
      appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null,
      buildCommit: BUILD_COMMIT,
      ranAt: new Date().toISOString(),
    })
  })

  const summary = record ? buildQuickRunSummary(record) : null

  const onCopy = async () => {
    if (!summary) return
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed. Select the text below and copy it by hand.')
    }
  }

  const stepCls = (done: boolean, enabled: boolean) =>
    cn(
      'rounded-lg border p-3',
      done ? 'border-status-success/40 bg-status-success/5' : 'border-border',
      !enabled && 'opacity-50'
    )

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-4" data-testid="quick-run">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Zap size={15} /> Quick run: three steps, about five minutes
      </h4>
      <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
        The application asks for the key <code className="font-mono">{QUICK_RUN_LABEL}</code> by
        name only. You change the policy, and the engine replaces the key the next time it is used.
        The full estate below shows the same mechanism for seven keys.
      </p>

      <ol className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <li className={stepCls(step1 !== null, true)}>
          <p className="text-xs font-semibold">1. Create and use a classical signing key</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Under the Classical policy: create the key by label, activate it and sign once.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-7 text-[11px]"
            disabled={busy}
            onClick={onCreate}
            data-testid="quick-run-step1"
          >
            {step1 ? 'Start again' : 'Create key'}
          </Button>
          {step1 && (
            <p className="mt-2 font-mono text-[11px]">
              {step1.key.algorithm} · {step1.signatureBytes}-byte signature
            </p>
          )}
        </li>

        <li className={stepCls(target !== null, step1 !== null)}>
          <p className="text-xs font-semibold">2. Change the policy</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            No key is touched yet. Pick the target the label should resolve to.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['migration-pqc', 'migration-hybrid'] as const).map((name) => (
              <Button
                key={name}
                size="sm"
                variant="outline"
                className={cn('h-7 text-[11px]', target === name && 'border-primary text-primary')}
                disabled={busy || step1 === null}
                onClick={onSwitch(name)}
                data-testid={`quick-run-step2-${name}`}
              >
                {chip(name)?.label ?? name}
              </Button>
            ))}
          </div>
        </li>

        <li className={stepCls(record !== null, target !== null)}>
          <p className="text-xs font-semibold">3. Use the key again, by label</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            The application signs the same message. Compare the old and new key.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-7 text-[11px]"
            disabled={busy || target === null}
            onClick={onUse}
            data-testid="quick-run-step3"
          >
            Sign again
          </Button>
          {record && (
            <p className="mt-2 font-mono text-[11px]">
              {record.before.algorithm} → {record.after.algorithm} · {record.signatureBytesAfter}
              -byte signature
            </p>
          )}
        </li>
      </ol>

      {busy && (
        <p className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Loader2 size={12} className="animate-spin" /> working…
        </p>
      )}
      {error && (
        <p className="mt-2 text-[11px] text-status-error" data-testid="quick-run-error">
          {error}
        </p>
      )}

      {summary && (
        <div className="mt-3 space-y-2" data-testid="quick-run-summary">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Result summary</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-[11px]"
              onClick={onCopy}
              data-testid="quick-run-copy"
            >
              {copied ? <Check size={12} /> : <ClipboardCopy size={12} />}
              {copied ? 'Copied' : 'Copy as Markdown'}
            </Button>
          </div>
          <pre className="max-h-72 overflow-auto rounded-md border border-border bg-background p-3 text-[11px] leading-snug whitespace-pre-wrap">
            {summary}
          </pre>
        </div>
      )}
    </div>
  )
}
