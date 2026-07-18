// SPDX-License-Identifier: GPL-3.0-only
//
// LearnView — the KMIP3.0 tab's "Learn" sub-tab (first position, the
// on-ramp): ten guided walkthroughs, each running real KMIP 3.0
// operations against the live WASM engine — six classical→PQC comparisons
// via `engine.runOp(spec)` (the same call `KmipPlaygroundView.tsx`'s
// `run()` makes), plus four engine-addition lessons (split custody, async
// jobs, honesty, certificate services) whose steps outside `run_op`'s
// friendly union run through the same raw-TTLV pipeline the Commands tab
// uses. The
// "Modernize" CTA never mutates the classical key in place — it always
// runs a brand-new CreateKeyPair and shows the result as a parallel
// comparison; in-place algorithm conversion isn't how KMIP or real crypto
// works, and the whole lesson would be wrong if it implied otherwise.
import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, Sparkles, Wand2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KmipEngine, OpResult } from '@/wasm/kmip/kmipEngine'
import { getCodepointTable } from '@/wasm/kmip/ttlv/codepointTable'
import { runOp as runRawOp } from '@/wasm/kmip/ttlv/runner'
import { find } from '@/wasm/kmip/ttlv/nodes'
import { QuizCard } from '@/components/Playground/learnkit/QuizCard'
import { ALGO_FACTS, fmtBytes } from '@/components/Playground/learnkit/algoFacts'
import { WireTreeView } from '../WireTreeView'
import { QUIZZES } from './quiz'
import {
  LESSONS,
  type CompareRow,
  type CompareRow3,
  type Lesson,
  type LessonSide,
  type LessonStep,
} from './learnLessons'

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

const TONE_DOT: Record<Lesson['tone'], string> = {
  ok: 'bg-status-success',
  primary: 'bg-primary',
  spec: 'bg-secondary',
  warn: 'bg-status-warning',
  info: 'bg-status-info',
}

const TONE_TEXT: Record<Lesson['tone'], string> = {
  ok: 'text-status-success',
  primary: 'text-primary',
  spec: 'text-secondary',
  warn: 'text-status-warning',
  info: 'text-status-info',
}

/** One-line narration per op, mirroring `KmipPlaygroundView.tsx`'s private
 * `narrate()` — same real `OpResult.summary` field names. */
function narrateStep(r: OpResult): string {
  const s = r.summary
  if (r.status === 'Skip') return r.message ?? 'Not runnable in this browser engine.'
  if (r.status === 'OperationPending')
    return `Accepted as a background job — correlation value ${str(s.cv) || '(see wire)'}. Nothing computed yet.`
  if (!r.ok) return r.message ? `Refused: ${r.message}` : 'Operation failed.'
  switch (r.operation) {
    case 'CreateSplitKey': {
      const n = str(s.uidsCsv) ? str(s.uidsCsv).split(',').length : 0
      return `Split into ${n} share objects — none of them is the key.`
    }
    case 'JoinSplitKey':
      return 'Original key reconstructed from the shares.'
    case 'Poll':
      return 'Job complete — the response is identical to what the synchronous op would have returned.'
    case 'Hash':
      return 'Digest returned in the same round trip.'
    case 'QueryAsynchronousRequests':
      return 'Outstanding-jobs list returned.'
    case 'CreateKeyPair':
      return `Private ${str(s.privateKeyUid).slice(0, 20)}…, public ${str(s.publicKeyUid).slice(0, 20)}….`
    case 'Create':
      return `Created (${str(s.uid).slice(0, 20)}…).`
    case 'Activate':
      return `Activated — now ${str(s.state)}.`
    case 'Sign':
      return `Signature is ${Number(s.signatureLen) || str(s.signatureHex).length / 2} bytes.`
    case 'SignatureVerify':
      return `Result: ${str(s.validity)}.`
    case 'Encapsulate':
      return `${Number(s.ciphertextLen) || str(s.ciphertextHex).length / 2}-byte ciphertext.`
    case 'Decapsulate':
      return 'Shared secret re-derived from the ciphertext.'
    case 'Encrypt':
      return `${str(s.ciphertextHex).length / 2} bytes ciphertext + ${str(s.tagHex).length / 2}-byte tag.`
    case 'Decrypt':
      return 'Original message recovered.'
    default:
      return 'Done.'
  }
}

interface StepRun {
  status: 'idle' | 'running' | 'success' | 'error'
  result: OpResult | null
  showWire: boolean
}

const idleSteps = (n: number): StepRun[] =>
  Array.from({ length: n }, () => ({ status: 'idle', result: null, showWire: false }))

function StepList({
  side,
  runs,
  onToggleWire,
}: {
  side: LessonSide
  runs: StepRun[]
  onToggleWire: (i: number) => void
}) {
  return (
    <ol className="space-y-2">
      {side.steps.map((step, i) => {
        // eslint-disable-next-line security/detect-object-injection -- `i` is this map's own array index, never user input.
        const run = runs[i]
        return (
          <li key={i} className="rounded-lg border border-border bg-background/40 p-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-muted-foreground">{i + 1}.</span>
              <span className="flex-1 text-[13px] text-foreground">{step.label}</span>
              {run.status === 'success' && (
                <CheckCircle2 size={14} className="shrink-0 text-status-success" />
              )}
              {run.status === 'error' && (
                <XCircle size={14} className="shrink-0 text-status-error" />
              )}
              {run.status === 'running' && (
                <span className="text-[10px] text-muted-foreground">running…</span>
              )}
            </div>
            {run.result && (
              <div className="ml-5 mt-1">
                <p className="text-[11.5px] text-muted-foreground">{narrateStep(run.result)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleWire(i)}
                  className="h-auto gap-1 px-1 py-0.5 text-[10.5px] text-muted-foreground hover:text-foreground"
                >
                  {run.showWire ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  show wire
                </Button>
                {run.showWire && (
                  <div className="mt-1.5">
                    <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                      Response
                    </p>
                    <WireTreeView root={run.result.responseTree} annotated />
                  </div>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** A compact, standalone fact line for one side's algorithm — the hand-
 * authored `compare` rows show the CONTRAST between sides; this shows each
 * side's own published facts (standard, security basis, key/signature/
 * ciphertext sizes) so a learner can read one card without cross-referencing
 * the other. */
function AlgoFactsLine({ algorithm }: { algorithm: string | null }) {
  // eslint-disable-next-line security/detect-object-injection -- read-only lookup against this module's own fixed facts catalog; `algorithm` is always a lesson's own algorithm string, never user input.
  const facts = algorithm ? ALGO_FACTS[algorithm] : undefined
  if (!facts) return null
  const sizeParts = [
    facts.pub !== undefined && `pub ${fmtBytes(facts.pub)}`,
    facts.priv !== undefined && `priv ${fmtBytes(facts.priv)}`,
    facts.sig !== undefined && `sig ${facts.sigNote ?? fmtBytes(facts.sig)}`,
    facts.ct !== undefined && `ciphertext ${fmtBytes(facts.ct)}`,
    facts.secret !== undefined && `shared secret ${fmtBytes(facts.secret)}`,
    facts.key !== undefined && `key ${fmtBytes(facts.key)}`,
  ].filter(Boolean)
  return (
    <p className="mt-1 text-[11px] text-muted-foreground">
      {facts.standard} · {facts.basis}
      {sizeParts.length > 0 && <> · {sizeParts.join(' · ')}</>}
    </p>
  )
}

function CompareTable({ lesson }: { lesson: Lesson }) {
  if (lesson.compare3 && lesson.compareHeaders) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-1.5 pr-3 font-semibold"> </th>
              {lesson.compareHeaders.map((h) => (
                <th key={h} className="pb-1.5 pr-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lesson.compare3.map((row: CompareRow3) => (
              <tr key={row.label} className="border-t border-border">
                <td className="py-1.5 pr-3 font-medium text-foreground">{row.label}</td>
                <td className="py-1.5 pr-3 text-muted-foreground">{row.a}</td>
                <td className="py-1.5 pr-3 text-muted-foreground">{row.b}</td>
                <td className="py-1.5 pr-3 text-muted-foreground">{row.c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  if (!lesson.compare) return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="pb-1.5 pr-3 font-semibold"> </th>
            <th className="pb-1.5 pr-3 font-semibold">{lesson.classical.algoLabel}</th>
            <th className="pb-1.5 pr-3 font-semibold">{lesson.modernize.algoLabel}</th>
          </tr>
        </thead>
        <tbody>
          {lesson.compare.map((row: CompareRow) => (
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
  )
}

function LessonPanel({
  lesson,
  engine,
  onChanged,
  onTryInReference,
  onDone,
}: {
  lesson: Lesson
  engine: KmipEngine
  onChanged: () => void
  onTryInReference: (op: string) => void
  onDone: () => void
}) {
  const [classicalRuns, setClassicalRuns] = useState<StepRun[]>(
    idleSteps(lesson.classical.steps.length)
  )
  const [modernizeRuns, setModernizeRuns] = useState<StepRun[]>(
    idleSteps(lesson.modernize.steps.length)
  )
  const [classicalBusy, setClassicalBusy] = useState(false)
  const [modernizeBusy, setModernizeBusy] = useState(false)
  const [modernizeStarted, setModernizeStarted] = useState(false)

  const classicalDone =
    classicalRuns.length > 0 && classicalRuns.every((r) => r.status === 'success')
  const canModernize = lesson.classical.steps.length === 0 || classicalDone

  /** Run one step through the friendly `run_op` path (`buildSpec`) or the
   * generic raw-TTLV pipeline (`buildRaw` — same path the Commands tab
   * uses, for the ops outside `run_op`'s union: split keys, async, Hash,
   * attribute ops). Both come back as an [`OpResult`] so narration and the
   * wire view work identically. */
  const runStep = async (step: LessonStep, results: (OpResult | null)[]): Promise<OpResult> => {
    step.preRun?.(engine)
    if (step.buildRaw) {
      const raw = step.buildRaw(results)
      try {
        const table = await getCodepointTable()
        const rr = runRawOp(engine, table, raw.op, raw.payload, raw.headerExtras)
        const pending = find(rr.namedResponseTree, 'ResultStatus')?.value === '0x00000002'
        return {
          ok: rr.ok,
          operation: raw.op,
          status: rr.ok ? 'Success' : pending ? 'OperationPending' : 'OperationFailed',
          resultReason: null,
          message: rr.resultMessage ?? null,
          summary: raw.harvest?.(rr.namedResponseTree) ?? {},
          responseWireHex: rr.responseWireHex,
          responseWireLen: rr.responseWireHex.length / 2,
          responseTree: rr.responseTree,
          audit: [],
        }
      } catch (err) {
        return {
          ok: false,
          operation: raw.op,
          status: 'Error',
          resultReason: null,
          message: err instanceof Error ? err.message : String(err),
          summary: {},
          responseWireHex: '',
          responseWireLen: 0,
          responseTree: { tag: '', type: 'Structure' },
          audit: [],
        }
      }
    }
    const spec = step.buildSpec!(results)
    let result: OpResult
    try {
      result = engine.runOp(spec)
    } catch (err) {
      result = {
        ok: false,
        operation: spec.op,
        status: 'Error',
        resultReason: null,
        message: err instanceof Error ? err.message : String(err),
        summary: {},
        responseWireHex: '',
        responseWireLen: 0,
        responseTree: { tag: '', type: 'Structure' },
        audit: [],
      }
    }
    // Remember any client-supplied ivHex (Encrypt/Decrypt) alongside the
    // engine's own summary fields — see learnLessons.ts's `freshIvHex`.
    return spec.ivHex ? { ...result, summary: { ...result.summary, ivHex: spec.ivHex } } : result
  }

  const runSide = async (
    side: LessonSide,
    setRuns: (fn: (prev: StepRun[]) => StepRun[]) => void
  ) => {
    const results: (OpResult | null)[] = []
    for (let i = 0; i < side.steps.length; i++) {
      setRuns((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: 'running' } : r)))
      // Yield so the "running…" state paints before the (synchronous) wasm call.
      await new Promise((r) => setTimeout(r, 0))
      // eslint-disable-next-line security/detect-object-injection -- `i` is this loop's own bounded counter (0..side.steps.length), never user input.
      const step = side.steps[i]
      const stored = await runStep(step, results)
      results.push(stored)
      // What outcome is this step SUPPOSED to have? A 'refusal' step (the
      // below-threshold join, reading a destroyed key) succeeds AS A LESSON
      // exactly when the engine honestly refuses; 'pending' when the async
      // accept comes back OperationPending.
      const want = step.expect ?? 'success'
      const achieved =
        want === 'success'
          ? stored.ok
          : want === 'pending'
            ? stored.status === 'OperationPending'
            : !stored.ok && stored.status !== 'Error'
      setRuns((prev) =>
        prev.map((r, idx) =>
          idx === i ? { ...r, status: achieved ? 'success' : 'error', result: stored } : r
        )
      )
      onChanged()
      if (!achieved) break
    }
    return results
  }

  const onRunClassical = async () => {
    setClassicalBusy(true)
    try {
      await runSide(lesson.classical, setClassicalRuns)
    } finally {
      setClassicalBusy(false)
    }
  }

  const onRunModernize = async () => {
    setModernizeStarted(true)
    if (lesson.modernize.skipReplay) return
    setModernizeBusy(true)
    try {
      await runSide(lesson.modernize, setModernizeRuns)
      onDone()
    } finally {
      setModernizeBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-[13.5px] leading-relaxed text-foreground">{lesson.setup}</p>
      </section>

      {/* Classical card */}
      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {lesson.sideHeaders?.[0] ?? 'Classical'}
        </p>
        <h4 className="mt-0.5 font-mono text-[14px] font-semibold text-foreground">
          {lesson.classical.algoLabel}
        </h4>
        <AlgoFactsLine algorithm={lesson.classical.algorithm} />
        {lesson.classical.steps.length > 0 && (
          <>
            <div className="mt-3">
              <StepList
                side={lesson.classical}
                runs={classicalRuns}
                onToggleWire={(i) =>
                  setClassicalRuns((prev) =>
                    prev.map((r, idx) => (idx === i ? { ...r, showWire: !r.showWire } : r))
                  )
                }
              />
            </div>
            <Button
              variant="gradient"
              size="sm"
              disabled={classicalBusy || classicalDone}
              onClick={onRunClassical}
              className="mt-3"
            >
              {classicalDone ? 'Done' : classicalBusy ? 'Running…' : 'Run these steps'}
            </Button>
          </>
        )}
        {lesson.classical.prose && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {lesson.classical.prose}
          </p>
        )}
      </section>

      {/* Modernize CTA */}
      <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <Wand2 size={16} className="text-primary" />
          <p className="text-[13px] font-semibold text-foreground">
            {lesson.modernize.cta ?? `Modernize to ${lesson.modernize.algoLabel}`}
          </p>
        </div>
        <Button
          variant="gradient"
          size="sm"
          disabled={!canModernize || modernizeBusy || modernizeStarted}
          onClick={onRunModernize}
          className="mt-2"
        >
          {modernizeStarted
            ? 'Done'
            : modernizeBusy
              ? 'Running…'
              : (lesson.modernize.cta ?? 'Modernize')}
        </Button>
      </section>

      {/* Post-quantum card */}
      {(modernizeStarted || lesson.modernize.steps.length === 0) && (
        <section className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {lesson.sideHeaders?.[1] ?? 'Post-quantum'}
          </p>
          <h4 className="mt-0.5 font-mono text-[14px] font-semibold text-foreground">
            {lesson.modernize.algoLabel}
          </h4>
          <AlgoFactsLine algorithm={lesson.modernize.algorithm} />
          {lesson.modernize.steps.length > 0 ? (
            <div className="mt-3">
              <StepList
                side={lesson.modernize}
                runs={modernizeRuns}
                onToggleWire={(i) =>
                  setModernizeRuns((prev) =>
                    prev.map((r, idx) => (idx === i ? { ...r, showWire: !r.showWire } : r))
                  )
                }
              />
            </div>
          ) : (
            lesson.modernize.prose && (
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
                {lesson.modernize.prose}
              </p>
            )
          )}
        </section>
      )}

      {/* Compare */}
      {(lesson.compare || lesson.compare3) && (
        <section className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Compare
          </p>
          <CompareTable lesson={lesson} />
        </section>
      )}

      {/* Notes */}
      {lesson.notes.map((note, i) => (
        <div
          key={i}
          className="flex gap-2 rounded-lg border border-border bg-muted/30 p-2.5 text-[12px] text-muted-foreground"
        >
          <Sparkles size={13} className="mt-0.5 shrink-0 text-primary" />
          <p>{note}</p>
        </div>
      ))}

      {/* Why it matters */}
      <div className="why rounded-lg border border-status-info/30 bg-status-info/5 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-status-info">
          Why it matters
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">{lesson.whyItMatters}</p>
      </div>

      {/* Knowledge check (only for lessons with a question bank) */}
      <QuizCard
        key={lesson.id}
        lessonId={lesson.id}
        questions={QUIZZES[lesson.id]}
        namespace="cacp"
        analyticsCategory="KMIP Quiz"
      />

      {/* Try it in Reference */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">Try it yourself in Reference:</span>
        {lesson.tryRef.map((op) => (
          <Button
            key={op}
            variant="outline"
            size="sm"
            onClick={() => onTryInReference(op)}
            className="h-auto rounded-full px-2.5 py-1 text-[11px]"
          >
            {op}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function LearnView({
  engine,
  onChanged,
  onTryInReference,
}: {
  engine: KmipEngine
  onChanged: () => void
  onTryInReference: (op: string) => void
}) {
  const [activeId, setActiveId] = useState(LESSONS[0].id)
  const [done, setDone] = useState<Set<string>>(new Set())
  const activeLesson = LESSONS.find((l) => l.id === activeId) ?? LESSONS[0]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <nav className="space-y-1.5">
        {LESSONS.map((lesson) => {
          const on = lesson.id === activeId
          const isDone = done.has(lesson.id)
          return (
            <Button
              key={lesson.id}
              variant="ghost"
              onClick={() => setActiveId(lesson.id)}
              className={cn(
                'flex h-auto w-full flex-col items-start gap-0.5 whitespace-normal rounded-lg border px-3 py-2 text-left',
                on ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'
              )}
            >
              <div className="flex w-full items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-background',
                    isDone ? 'bg-status-success' : TONE_DOT[lesson.tone]
                  )}
                >
                  {isDone ? <CheckCircle2 size={12} /> : lesson.n}
                </span>
                <span className="text-[12.5px] font-semibold text-foreground">{lesson.title}</span>
              </div>
              <p className="pl-5.5 text-[10.5px] text-muted-foreground">{lesson.blurb}</p>
              <span
                className={cn(
                  'pl-5.5 text-[9px] font-bold uppercase tracking-wide',
                  TONE_TEXT[lesson.tone]
                )}
              >
                {lesson.tag}
              </span>
            </Button>
          )
        })}
      </nav>

      <LessonPanel
        key={activeLesson.id}
        lesson={activeLesson}
        engine={engine}
        onChanged={onChanged}
        onTryInReference={onTryInReference}
        onDone={() => setDone((prev) => new Set(prev).add(activeLesson.id))}
      />
    </div>
  )
}
