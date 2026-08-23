// SPDX-License-Identifier: GPL-3.0-only
//
// TpmLearnView — the TPM playground's "Learn" tab: one track of 8 guided
// lessons (T1–T8) whose steps run REAL wire commands against the same WASM
// TPM the workbench tabs drive. Mirrors HsmLearnView (the PKCS#11 port of
// the KMIP reference pattern): lesson nav rail, per-step Run with honest
// refusals as first-class outcomes, compare table + notes + quiz gated on
// completion, "try it in the workbench" chips, and the shared glossary rail.
// The GlossaryProvider lives in TpmPlayground.tsx so the workbench's
// Execution Log hovers share the same glossary session.
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  PlayCircle,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { logEvent } from '@/utils/analytics'
import { GlossaryRail } from '../../learnkit/GlossaryRail'
import { QuizCard } from '../../learnkit/QuizCard'
import {
  executeTpmCommand,
  executeTpmCommandLarge,
  flushAllTransient,
  nvReadAll,
  getPqcBridgeStatus,
  setTpmWireListener,
  withTpmLock,
  type TpmWireLogEntry,
} from '../../../../wasm/tpmBridge'
import { useTpmBusy } from '../useTpmBusy'
import { getU16, getU32, toHex } from '../../../../wasm/tpmSerializer'
import { getRcInfo } from '../tpmCommandDefs'
import { TAG_NAMES, CC_NAMES } from '../tpmWireDecode'
import { HexPanel } from '../ExecutionLog'
import {
  TPM_LESSONS,
  type TpmLearnContext,
  type TpmLessonStep,
  type TpmStepResult,
} from './tpmLessons'
import { TPM_QUIZZES } from './tpmQuiz'

type StepStatus = 'pending' | 'running' | 'ok' | 'refused-ok' | 'failed'

interface StepRunState {
  status: StepStatus
  detail?: string
}

const freshChain = (): TpmLearnContext['chain'] => ({ handles: {} })

/** One request/response wire exchange, rendered the same way the Command
 * Builder's Execution Log decodes a command — header fields + collapsible
 * raw hex — scoped to a single lesson step instead of a shared/global log. */
function WireExchange({ entry }: { entry: TpmWireLogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const reqTag = entry.request.length >= 2 ? getU16(entry.request, 0) : 0
  const reqCc = entry.request.length >= 10 ? getU32(entry.request, 6) : 0
  const reqName = CC_NAMES[reqCc] ?? `cc=0x${reqCc.toString(16).padStart(8, '0')}`

  const rc = entry.response && entry.response.length >= 10 ? getU32(entry.response, 6) : null
  const rcInfo = rc !== null ? getRcInfo(rc) : null
  const isSuccess = rc === 0

  const handleCopy = (bytes: Uint8Array | null) => {
    if (bytes) navigator.clipboard.writeText(toHex(bytes))
  }

  return (
    <div className="overflow-hidden rounded-md border border-border/60 bg-background/60">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setExpanded((v) => !v)}
        className="h-auto w-full items-center justify-between gap-2 px-2 py-1.5 text-left font-normal hover:bg-muted/30"
      >
        <span className="truncate font-mono text-[10.5px] text-muted-foreground">
          <span className="text-foreground">{reqName}</span>
          {' · '}
          {TAG_NAMES[reqTag] ?? `tag 0x${reqTag.toString(16)}`}
          {' · '}
          {entry.request.length} B → {entry.response ? `${entry.response.length} B` : '—'}
        </span>
        {entry.error ? (
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-destructive">
            <XCircle size={11} /> ERROR
          </span>
        ) : rcInfo ? (
          <span
            className={cn(
              'flex shrink-0 items-center gap-1 font-mono text-[10px] font-semibold',
              isSuccess ? 'text-status-success' : 'text-status-error'
            )}
          >
            {isSuccess ? <CheckCircle2 size={11} /> : <XCircle size={11} />} {rcInfo.name}
          </span>
        ) : null}
      </Button>
      {expanded && (
        <div className="space-y-2 border-t border-border/40 p-2">
          <HexPanel
            label="request"
            bytes={entry.request}
            onCopy={() => handleCopy(entry.request)}
          />
          {entry.error && (
            <p className="rounded border border-destructive/20 bg-destructive/5 p-2 font-mono text-[10.5px] text-destructive">
              {entry.error}
            </p>
          )}
          {rcInfo && !isSuccess && !entry.error && (
            <p className="rounded border border-border bg-muted/20 p-2 text-[10.5px] leading-snug text-muted-foreground">
              <span className="font-mono font-bold text-status-error">
                RC = 0x{(rc ?? 0).toString(16).padStart(8, '0')} — {rcInfo.name}
              </span>
              <br />
              {rcInfo.description}
            </p>
          )}
          {entry.response && (
            <HexPanel
              label="response"
              bytes={entry.response}
              onCopy={() => handleCopy(entry.response)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function StepRow({
  step,
  index,
  state,
  wireLogs,
  onRun,
  disabled,
}: {
  step: TpmLessonStep
  index: number
  state: StepRunState
  wireLogs: TpmWireLogEntry[]
  onRun: () => void
  disabled: boolean
}) {
  return (
    <li className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-muted-foreground">{step.op}</p>
          <p className="text-[13px] font-medium text-foreground">
            {index + 1}. {step.label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {state.status === 'pending' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRun}
              disabled={disabled}
              className="h-7 gap-1 px-2 text-[11px]"
            >
              <PlayCircle size={13} /> Run
            </Button>
          )}
          {state.status === 'running' && (
            <Loader2 size={15} className="animate-spin text-primary" />
          )}
          {state.status === 'ok' && <CheckCircle2 size={15} className="text-status-success" />}
          {state.status === 'refused-ok' && (
            <span className="rounded bg-status-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-success">
              Refused, as expected
            </span>
          )}
          {state.status === 'failed' && <XCircle size={15} className="text-destructive" />}
        </div>
      </div>
      {state.detail && (
        <p
          className={cn(
            'mt-2 border-l-2 py-1.5 pl-2.5 text-[11.5px] leading-snug',
            state.status === 'failed'
              ? 'border-destructive/60 bg-destructive/5 text-destructive'
              : 'border-primary/60 bg-muted/30 text-muted-foreground'
          )}
        >
          {state.detail}
        </p>
      )}
      {wireLogs.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {wireLogs.map((entry, i) => (
            <WireExchange key={i} entry={entry} />
          ))}
        </div>
      )}
    </li>
  )
}

export function TpmLearnView({
  isWasmReady,
  onTryInWorkbench,
}: {
  isWasmReady: boolean
  onTryInWorkbench: (tab: string) => void
}) {
  const [lessonIdx, setLessonIdx] = useState(0)
  const lesson = TPM_LESSONS[lessonIdx]
  // Any panel — this one or another tab — holding the shared engine lock
  // disables run controls here too, so a queued click never looks like a
  // no-op (see useTpmBusy.ts).
  const tpmBusy = useTpmBusy()
  const [stepStates, setStepStates] = useState<StepRunState[]>(() =>
    lesson.steps.map(() => ({ status: 'pending' }))
  )
  // Refs, not state: runAll's loop must see each prior step's writes
  // immediately (same reasoning as HsmLearnView's resultsRef).
  const resultsRef = useRef<(TpmStepResult | null)[]>(lesson.steps.map(() => null))
  const chainRef = useRef<TpmLearnContext['chain']>(freshChain())

  // Every wire exchange (request+response) each step's run() triggers, keyed
  // by step index. Populated via setTpmWireListener while a step is running —
  // that hook fires on EVERY executeTpmCommand/executeTpmCommandLarge call,
  // including ones issued internally by ctx.flushAll/ctx.nvReadAll, so this
  // captures a step's full wire traffic regardless of which context method
  // triggered it. Ref for the same reason as resultsRef (read-during-loop);
  // mirrored into state so it actually renders.
  const wireLogsRef = useRef<TpmWireLogEntry[][]>(lesson.steps.map(() => []))
  const [stepWireLogs, setStepWireLogs] = useState<TpmWireLogEntry[][]>(() =>
    lesson.steps.map(() => [])
  )

  // Built on demand inside handlers (never at render — reading chainRef.current
  // during render is disallowed and it's replaced per-lesson by selectLesson).
  const makeCtx = (): TpmLearnContext => ({
    exec: executeTpmCommand,
    execLarge: executeTpmCommandLarge,
    flushAll: flushAllTransient,
    nvReadAll,
    bridgeStatus: getPqcBridgeStatus,
    chain: chainRef.current,
  })

  const selectLesson = (idx: number) => {
    setLessonIdx(idx)
    setStepStates(TPM_LESSONS[idx].steps.map(() => ({ status: 'pending' })))
    resultsRef.current = TPM_LESSONS[idx].steps.map(() => null)
    chainRef.current = freshChain()
    wireLogsRef.current = TPM_LESSONS[idx].steps.map(() => [])
    setStepWireLogs(TPM_LESSONS[idx].steps.map(() => []))
  }

  const runStep = async (i: number) => {
    setStepStates((prev) => prev.map((s, j) => (j === i ? { status: 'running' } : s)))
    wireLogsRef.current[i] = []
    setStepWireLogs((prev) => prev.map((l, j) => (j === i ? [] : l)))
    // The step's entire command sequence — not just each individual wire
    // call — must run exclusively against the shared WASM TPM instance, or
    // another operation's commands (a different step, a different tab) can
    // interleave in the `await` gaps between this step's own calls and
    // corrupt shared transient-object state. The wire-listener registration
    // lives inside the lock too, since it's a single global slot and two
    // concurrently-running steps would otherwise capture each other's wire
    // traffic. See tpmBridge.ts's withTpmLock and the 2026-07-24 TPM
    // playground concurrency remediation.
    await withTpmLock(async () => {
      setTpmWireListener((entry) => {
        wireLogsRef.current[i] = [...wireLogsRef.current[i], entry]
      })
      try {
        const result = await lesson.steps[i].run(makeCtx(), resultsRef.current)
        resultsRef.current = resultsRef.current.map((r, j) => (j === i ? result : r))
        setStepStates((prev) =>
          prev.map((s, j) => (j === i ? { status: 'ok', detail: result.detail } : s))
        )
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        const expectedRefusal = lesson.steps[i].expect === 'refusal'
        logEvent(
          'Playground',
          'TPM Learn Step',
          `${lesson.id}:${lesson.steps[i].op}:${expectedRefusal ? 'refused-ok' : 'failed'}`
        )
        setStepStates((prev) =>
          prev.map((s, j) =>
            j === i ? { status: expectedRefusal ? 'refused-ok' : 'failed', detail: message } : s
          )
        )
      } finally {
        setTpmWireListener(null)
        setStepWireLogs((prev) => prev.map((l, j) => (j === i ? wireLogsRef.current[i] : l)))
      }
    })
  }

  const runAll = async () => {
    // The WHOLE lesson run — not just each step individually — must be one
    // exclusive operation. runStep's own withTpmLock wrap only stops two
    // individual steps' WASM commands from truly overlapping; it does NOT
    // stop a second, stale Run-all invocation's steps from interleaving
    // BETWEEN this run's own steps at the queue level (A-step0, B-step0,
    // A-step1, B-step1, ...) — and since all steps share ONE mutable
    // `chainRef.current`, that interleaving corrupts THIS run's own chain
    // state (e.g. a later step reads a handle a different run's step just
    // overwrote) even though no two WASM calls ever literally overlap.
    // Wrapping here makes runStep's nested lock calls reentrant instead,
    // so a second Run-all invocation queues behind this ENTIRE run, not
    // behind just its current step. Confirmed necessary by a same-tick
    // double-click repro during the 2026-07-24 concurrency remediation —
    // step-level locking alone still corrupted the streaming lesson.
    await withTpmLock(async () => {
      for (let i = 0; i < lesson.steps.length; i++) {
        if (stepStates[i].status === 'ok' || stepStates[i].status === 'refused-ok') continue
        // Steps are deliberately sequential — each may read prior chain state.
        await runStep(i)
      }
    })
  }

  const allDone = stepStates.every((s) => s.status === 'ok' || s.status === 'refused-ok')

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4 lg:flex-row">
          <nav className="w-full shrink-0 space-y-1 lg:w-52">
            {TPM_LESSONS.map((l, i) => (
              <Button
                key={l.id}
                variant="ghost"
                onClick={() => selectLesson(i)}
                className={cn(
                  'flex h-auto w-full items-start justify-start gap-1.5 whitespace-normal break-words rounded-md px-2 py-1.5 text-left text-[12px] font-normal',
                  i === lessonIdx
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                <span className="mt-0.5 shrink-0 font-mono text-[10px] opacity-70">T{l.n}</span>
                <span>{l.title}</span>
              </Button>
            ))}
          </nav>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {lesson.tag}
                </span>
                <h3 className="text-[15px] font-bold text-foreground">{lesson.title}</h3>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {lesson.blurb}
              </p>
              <p className="mt-2 rounded-lg border border-border bg-muted/20 p-2.5 text-[12px] leading-relaxed text-foreground">
                {lesson.setup}
              </p>
            </div>

            {!isWasmReady && (
              <p className="rounded-lg border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-[12px] text-status-warning">
                Waiting for the WASM TPM to initialize — steps enable once the engine is ready.
              </p>
            )}

            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Steps
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={runAll}
                disabled={allDone || !isWasmReady || tpmBusy}
                className="h-7 text-[11px]"
              >
                Run all
              </Button>
            </div>
            <ol className="space-y-2">
              {lesson.steps.map((step, i) => (
                <StepRow
                  key={i}
                  step={step}
                  index={i}
                  state={stepStates[i]}
                  wireLogs={stepWireLogs[i]}
                  onRun={() => runStep(i)}
                  disabled={stepStates[i].status === 'running' || !isWasmReady || tpmBusy}
                />
              ))}
            </ol>

            {allDone && lesson.compare && lesson.compareHeaders && (
              <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-foreground">
                  Compare
                </p>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      {lesson.compareHeaders.map((h, i) => (
                        <th key={i} className="pb-1.5 pr-3 font-semibold">
                          {h || ' '}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lesson.compare.map((row) => (
                      <tr key={row.label} className="border-t border-border">
                        <td className="py-1.5 pr-3 font-medium text-foreground">{row.label}</td>
                        <td
                          className={cn(
                            'py-1.5 pr-3',
                            row.same ? 'text-muted-foreground' : 'text-status-warning'
                          )}
                        >
                          {row.a}
                        </td>
                        <td
                          className={cn(
                            'py-1.5 pr-3',
                            row.same ? 'text-muted-foreground' : 'text-status-warning'
                          )}
                        >
                          {row.b}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {allDone && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-foreground">
                  Notes
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[12px] leading-relaxed text-muted-foreground">
                  {lesson.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
                <p className="mt-3 text-[12.5px] leading-relaxed text-foreground">
                  <span className="font-semibold">Why it matters · </span>
                  {lesson.whyItMatters}
                </p>
              </div>
            )}

            {allDone && (
              <QuizCard
                key={lesson.id}
                lessonId={lesson.id}
                questions={TPM_QUIZZES[lesson.id]}
                namespace="tpm-learn"
                analyticsCategory="TPM Learn Quiz"
              />
            )}

            {allDone && lesson.tryRef.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  Try it yourself in the workbench:
                </span>
                {lesson.tryRef.map((tab) => (
                  <Button
                    key={tab}
                    size="sm"
                    variant="outline"
                    onClick={() => onTryInWorkbench(tab)}
                    className="h-6 gap-1 px-2 text-[10.5px]"
                  >
                    {tab} <ChevronRight size={11} />
                  </Button>
                ))}
              </div>
            )}

            {allDone && lesson.crossPlaygroundLink && (
              <Link
                to={lesson.crossPlaygroundLink.to}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                {lesson.crossPlaygroundLink.label} <ExternalLink size={11} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
      <GlossaryRail />
    </div>
  )
}
