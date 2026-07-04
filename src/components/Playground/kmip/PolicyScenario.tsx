// SPDX-License-Identifier: GPL-3.0-only
//
// PolicyScenario — the Agility Workbench's test-scenario runner. When a policy
// is active, it shows ONLY the validated scenarios tied to that policy
// (policyScenarios.ts, `policyFile`). Each scenario carries a description and an
// expected verdict; running one asks the REAL engine `dry_run` what it decides
// and compares the answer to the expectation (✓ pass / ✗ mismatch).
//
// The same scenario dataset is validated end-to-end against the engine AND the
// visual simulator by e2e/cacp-policy-scenarios.local.spec.ts — so what a user
// sees here is exactly what the automated gate checks.
import { useState } from 'react'
import {
  FlaskConical,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  ShieldX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KmipEngine } from '@/wasm/kmip/kmipEngine'
import {
  scenariosForPolicy,
  type PolicyTestScenario,
  type ScenarioVerdict,
} from './policyScenarios'

interface RunResult {
  actual: ScenarioVerdict | 'Error'
  reason: string
  pass: boolean
}

const TONE: Record<string, { badge: string; text: string; icon: typeof CheckCircle2 }> = {
  Allow: {
    badge: 'bg-status-success/15 text-status-success',
    text: 'text-status-success',
    icon: CheckCircle2,
  },
  Rekey: {
    badge: 'bg-status-warning/15 text-status-warning',
    text: 'text-status-warning',
    icon: ArrowRight,
  },
  Deny: { badge: 'bg-destructive/15 text-destructive', text: 'text-destructive', icon: XCircle },
  Error: { badge: 'bg-muted text-muted-foreground', text: 'text-muted-foreground', icon: XCircle },
}

/** One-line summary of the request a scenario sends. */
function summarize(s: PolicyTestScenario): string {
  const r = s.request
  const bits: string[] = [r.op]
  if (r.algorithm) bits.push(r.algorithm + (r.length ? `-${r.length}` : ''))
  else if (r.length) bits.push(`${r.length}-bit`)
  if (r.state && r.state !== 'Active') bits.push(`state=${r.state}`)
  if (r.date) bits.push(`@${r.date}`)
  if (r.usageMask?.length) bits.push(`mask=${r.usageMask.join('+')}`)
  if (r.mechanism?.mech) bits.push(r.mechanism.mech)
  if (r.mechanism?.blockMode) bits.push(r.mechanism.blockMode)
  if (r.mechanism?.hash) bits.push(r.mechanism.hash)
  if (r.attrs) for (const [k, v] of Object.entries(r.attrs)) bits.push(`x-${k}=${v}`)
  return bits.join(' · ')
}

/** Ask the active engine what it would decide for a scenario's request. */
function runScenario(engine: KmipEngine, s: PolicyTestScenario): RunResult {
  const r = s.request
  const isNew = /^(Create|CreateKeyPair|Register|Import)/.test(r.op)
  try {
    const dr = engine.dryRun({
      op: r.op,
      algorithm: r.algorithm,
      currentAlgorithm: isNew ? undefined : r.algorithm,
      length: r.length,
      state: r.state,
      date: r.date,
      attrs: r.attrs,
      usageMask: r.usageMask,
      activationDate: r.activationDate,
      mechanism: r.mechanism,
    })
    const reason =
      dr.kind === 'Rekey'
        ? `${dr.from ?? r.algorithm ?? ''} → ${dr.to ?? ''}`
        : dr.kind === 'Deny'
          ? dr.reason || dr.denyReason || 'denied'
          : dr.algorithm
            ? `→ ${dr.algorithm}`
            : 'allowed'
    return { actual: dr.kind, reason, pass: dr.kind === s.expect }
  } catch (e) {
    return { actual: 'Error', reason: e instanceof Error ? e.message : String(e), pass: false }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function PolicyScenario({
  engine,
  policyFile,
  policyLabel,
  policyFingerprint,
  busy,
  onBusyChange,
}: {
  engine: KmipEngine
  /** Active policy file — scenarios are filtered to this. */
  policyFile: string
  policyLabel: string
  /** Changes when the active policy changes — clears stale results. */
  policyFingerprint?: string
  busy: boolean
  onBusyChange: (b: boolean) => void
}) {
  const scenarios = scenariosForPolicy(policyFile)
  const [results, setResults] = useState<Record<string, RunResult>>({})
  const [running, setRunning] = useState<string | null>(null)

  // Reset results when the active policy changes (render-phase reset pattern).
  const [prevKey, setPrevKey] = useState(policyFingerprint ?? policyFile)
  const key = policyFingerprint ?? policyFile
  if (key !== prevKey) {
    setPrevKey(key)
    setResults({})
  }

  const runOne = (s: PolicyTestScenario) => {
    setRunning(s.id)
    onBusyChange(true)
    // Yield so the spinner paints before the synchronous wasm call.
    setTimeout(() => {
      setResults((prev) => ({ ...prev, [s.id]: runScenario(engine, s) }))
      setRunning(null)
      onBusyChange(false)
    }, 0)
  }

  const runAll = async () => {
    setRunning('__all__')
    onBusyChange(true)
    const out: Record<string, RunResult> = {}
    for (const s of scenarios) {
      await sleep(0)
      out[s.id] = runScenario(engine, s)
      setResults({ ...out })
      await sleep(90)
    }
    setRunning(null)
    onBusyChange(false)
  }

  const ran = scenarios.filter((s) => results[s.id])
  const passed = ran.filter((s) => results[s.id]?.pass).length

  return (
    <section className="rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2 text-foreground">
            <FlaskConical size={16} className="text-primary" /> Test scenarios
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Validated positive &amp; negative requests for{' '}
            <span className="font-semibold text-foreground">{policyLabel}</span>. Each asks the live
            engine what it would decide and checks it against the expected verdict — nothing is
            created.
          </p>
        </div>
        {scenarios.length > 0 && (
          <div className="flex items-center gap-2">
            {ran.length > 0 && (
              <span
                className={cn(
                  'rounded px-2 py-1 text-[11px] font-semibold',
                  passed === ran.length
                    ? 'bg-status-success/15 text-status-success'
                    : 'bg-destructive/15 text-destructive'
                )}
              >
                {passed}/{ran.length} match
              </span>
            )}
            <Button onClick={runAll} disabled={!!running || busy} className="gap-1.5">
              {running === '__all__' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}{' '}
              Run all
            </Button>
          </div>
        )}
      </div>

      {scenarios.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-border bg-card/50 p-3 text-xs text-muted-foreground">
          No validated test scenarios for this policy yet. Pick another policy, or add scenarios in{' '}
          <code className="font-mono text-[11px]">policyScenarios.ts</code>.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {scenarios.map((s) => {
            const res = results[s.id]
            const expectTone = TONE[s.expect]
            return (
              <li
                key={s.id}
                className="rounded-md border border-border bg-card p-2.5"
                data-testid={`scenario-${s.id}`}
              >
                <div className="flex items-start gap-2">
                  {/* positive/negative intent marker */}
                  {s.path === 'positive' ? (
                    <ShieldCheck size={15} className="mt-0.5 shrink-0 text-status-success" />
                  ) : (
                    <ShieldX size={15} className="mt-0.5 shrink-0 text-destructive" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{s.title}</span>
                      <span
                        className={cn(
                          'rounded px-1.5 text-[9px] font-bold uppercase tracking-wide',
                          expectTone.badge
                        )}
                        title="expected verdict"
                      >
                        expect {s.expect}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{s.description}</p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground/80 break-all">
                      {summarize(s)}
                    </p>

                    {res && (
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        {res.pass ? (
                          <CheckCircle2 size={14} className="text-status-success" />
                        ) : (
                          <XCircle size={14} className="text-destructive" />
                        )}
                        <span
                          className={cn(
                            'text-[11px] font-semibold',
                            res.pass ? 'text-status-success' : 'text-destructive'
                          )}
                        >
                          {res.pass ? 'matches' : 'MISMATCH'}
                        </span>
                        <span
                          className={cn(
                            'rounded px-1.5 text-[10px] font-semibold',
                            TONE[res.actual].badge
                          )}
                        >
                          engine: {res.actual}
                        </span>
                        <span
                          className={cn('font-mono text-[10.5px] break-all', TONE[res.actual].text)}
                        >
                          {res.reason}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => runOne(s)}
                    disabled={!!running || busy}
                    className="h-7 gap-1.5 px-2.5 text-[11px]"
                  >
                    {running === s.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Play size={12} />
                    )}{' '}
                    Run
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
